import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Husky from './Husky';
import '../styles/Login.css';

const Login = () => {
    const navigate = useNavigate();

    // ==========================================
    // 1. UI & CLOCK STATE
    // ==========================================
    const [isUserView, setIsUserView] = useState(true);
    const [timeStr, setTimeStr] = useState({ hours: '00', minutes: '00', seconds: '00' });
    const [dateStr, setDateStr] = useState('SYSTEM ONLINE');

    // ==========================================
    // 2. AUTHENTICATION STATE
    // ==========================================
    const [userAuth, setUserAuth] = useState({ id: '', pass: '', remember: false });
    const [adminAuth, setAdminAuth] = useState({ id: '', pass: '', remember: false });
    const [loading, setLoading] = useState({ user: false, admin: false, reset: false });
    const [error, setError] = useState({ user: '', admin: '' });
    const [passVisible, setPassVisible] = useState({ user: false, admin: false });

    // ==========================================
    // 3. PASSWORD RESET STATE
    // ==========================================
    const [showReset, setShowReset] = useState(false);
    const [resetData, setResetData] = useState({ username: '', email: '', newPass: '' });
    const [resetStatus, setResetStatus] = useState({ type: '', msg: '' });

    // ==========================================
    // 4. HUSKY MOOD STATE
    // ==========================================
    const [userHusky, setUserHusky] = useState({ closed: false, error: false, happy: false, wagging: false });
    const [adminHusky, setAdminHusky] = useState({ closed: false, error: false, happy: false, wagging: false });

    // --- CLOCK ENGINE ---
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeParts = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(':');
            setTimeStr({ hours: timeParts[0], minutes: timeParts[1], seconds: timeParts[2] });
            setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase());
        };
        const timer = setInterval(updateClock, 1000);
        updateClock();
        return () => clearInterval(timer);
    }, []);

    // --- PORTAL SLIDER ---
    const togglePortal = () => {
        setIsUserView(!isUserView);
        triggerHuskyWag('both');
    };

    const triggerHuskyWag = (target) => {
        if (target === 'user' || target === 'both') {
            setUserHusky(prev => ({ ...prev, wagging: true }));
            setTimeout(() => setUserHusky(prev => ({ ...prev, wagging: false })), 1000);
        }
        if (target === 'admin' || target === 'both') {
            setAdminHusky(prev => ({ ...prev, wagging: true }));
            setTimeout(() => setAdminHusky(prev => ({ ...prev, wagging: false })), 1000);
        }
    };

    // --- PASSWORD PEEK LOGIC ---
    const togglePassword = (role) => {
        setPassVisible(prev => ({ ...prev, [role]: !prev[role] }));
        if (role === 'user') setUserHusky(prev => ({ ...prev, closed: !passVisible.user }));
        else setAdminHusky(prev => ({ ...prev, closed: !passVisible.admin }));
    };

    const handlePassFocus = (role) => {
        if (role === 'user' && !passVisible.user) setUserHusky(prev => ({ ...prev, closed: true }));
        if (role === 'admin' && !passVisible.admin) setAdminHusky(prev => ({ ...prev, closed: true }));
    };

    const handlePassBlur = (role) => {
        if (role === 'user') setUserHusky(prev => ({ ...prev, closed: false }));
        if (role === 'admin') setAdminHusky(prev => ({ ...prev, closed: false }));
    };

    // --- AUTHENTICATION SUBMIT LOGIC ---
    const handleAuth = async (e, role) => {
        e.preventDefault();
        const isUser = role === 'user';
        const credentials = isUser ? userAuth : adminAuth;

        setError(prev => ({ ...prev, [role]: '' }));
        setLoading(prev => ({ ...prev, [role]: true }));

        try {
            const res = await fetch('http://127.0.0.1:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: credentials.id, password: credentials.pass, role: role.toUpperCase() })
            });
            const data = await res.json();

            if (data.success) {
                if (isUser) setUserHusky(prev => ({ ...prev, happy: true, wagging: true }));
                else setAdminHusky(prev => ({ ...prev, happy: true, wagging: true }));

                // Handle Remember Me storage logic
                if (credentials.remember) {
                    localStorage.setItem('mls_user_data', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('mls_user_data', JSON.stringify(data.user));
                }

                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                throw new Error(data.message || "Invalid Credentials");
            }
        } catch (err) {
            setError(prev => ({ ...prev, [role]: err.message.toUpperCase() }));
            setLoading(prev => ({ ...prev, [role]: false }));

            if (isUser) {
                setUserHusky(prev => ({ ...prev, error: true }));
                setTimeout(() => setUserHusky(prev => ({ ...prev, error: false })), 2000);
            } else {
                setAdminHusky(prev => ({ ...prev, error: true }));
                setTimeout(() => setAdminHusky(prev => ({ ...prev, error: false })), 2000);
            }
        }
    };

    // --- PASSWORD RESET LOGIC ---
    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, reset: true }));
        setResetStatus({ type: '', msg: '' });

        try {
            const res = await fetch('http://127.0.0.1:8080/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resetData)
            });
            const data = await res.json();

            if (res.ok) {
                setResetStatus({ type: 'success', msg: '✅ Passkey Forged Successfully.' });
                setTimeout(() => {
                    setShowReset(false);
                    setResetData({ username: '', email: '', newPass: '' });
                    setResetStatus({ type: '', msg: '' });
                }, 2000);
            } else {
                setResetStatus({ type: 'error', msg: `❌ ${data.message}` });
            }
        } catch (err) {
            setResetStatus({ type: 'error', msg: '❌ Connection Error.' });
        }
        setLoading(prev => ({ ...prev, reset: false }));
    };

    return (
        <div className="security-wrapper relative">

            {/* --- PASSWORD RESET OVERLAY --- */}
            {showReset && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-[#0f0f10] border border-amber-500/30 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative animate-fade-in">
                        <button onClick={() => setShowReset(false)} className="absolute top-6 right-6 text-stone-500 hover:text-white">
                            <i className="fa fa-times text-lg"></i>
                        </button>
                        <h3 className="text-xl font-black text-amber-500 uppercase tracking-widest mb-1">Lost Key?</h3>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-6">Identity Verification Required</p>

                        {resetStatus.msg && (
                            <div className={`p-3 mb-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${resetStatus.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-green-500/10 text-green-500 border-green-500/30'}`}>
                                {resetStatus.msg}
                            </div>
                        )}

                        <form onSubmit={handleReset} className="space-y-4">
                            <div><input type="text" required placeholder="System Alias (Username)" value={resetData.username} onChange={(e) => setResetData({ ...resetData, username: e.target.value })} className="w-full bg-black border border-stone-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500" /></div>
                            <div><input type="email" required placeholder="Registered Work Email" value={resetData.email} onChange={(e) => setResetData({ ...resetData, email: e.target.value })} className="w-full bg-black border border-stone-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500" /></div>
                            <div><input type="password" required placeholder="Forge New Passkey" value={resetData.newPass} onChange={(e) => setResetData({ ...resetData, newPass: e.target.value })} className="w-full bg-black border border-stone-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500" /></div>

                            <button type="submit" disabled={loading.reset} className="w-full py-3 mt-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-400 disabled:opacity-50">
                                {loading.reset ? 'Verifying...' : 'Forge Passkey'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CLOCK WIDGET */}
            <div className="clock-widget">
                <div className="clock-time">{timeStr.hours}:{timeStr.minutes}<span>:{timeStr.seconds}</span></div>
                <div className="clock-date">{dateStr}</div>
            </div>

            {/* MASTER CARD LAYOUT */}
            <div className="portal-card">
                <div className={`slider-door ${!isUserView ? 'admin-active' : ''}`} id="slider"></div>

                {/* USER PANELS */}
                <div className={`panel hero-user ${isUserView ? 'active' : ''}`}>
                    <Husky isClosedEye={userHusky.closed} isError={userHusky.error} isHappy={userHusky.happy} isWagging={userHusky.wagging} onInteract={() => triggerHuskyWag('user')} />
                    <h2 className="hero-title">USER PORTAL</h2>
                    <p className="hero-subtitle">K-9 Security System</p>
                    <button className="btn-switch" onClick={togglePortal}>Switch to Admin <i className="fas fa-arrow-right ml-2"></i></button>
                </div>

                <div className={`panel form-user ${isUserView ? 'active' : ''}`}>
                    <div className="form-header">
                        <h2 className="portal-title text-yellow-500" style={{ color: '#f5b000' }}>Authentication</h2>
                        <p className="portal-subtitle">Provide User Credentials</p>
                    </div>

                    {error.user && <div className="error-msg" style={{ display: 'block' }}><i className="fas fa-exclamation-triangle mr-1"></i> <span>{error.user}</span></div>}

                    <form onSubmit={(e) => handleAuth(e, 'user')} style={{ width: '100%' }}>
                        <div className="input-group">
                            <i className="fas fa-user input-icon"></i>
                            <input type="text" className="premium-input" placeholder="User ID" value={userAuth.id} onChange={(e) => setUserAuth({ ...userAuth, id: e.target.value })} required autoComplete="off" />
                        </div>

                        <div className="input-group">
                            <i className="fas fa-lock input-icon"></i>
                            <input type={passVisible.user ? "text" : "password"} className="premium-input password-field" placeholder="Passkey" value={userAuth.pass} onChange={(e) => setUserAuth({ ...userAuth, pass: e.target.value })} onFocus={() => handlePassFocus('user')} onBlur={() => handlePassBlur('user')} required />
                            <button type="button" className="btn-reveal" onClick={() => togglePassword('user')} tabIndex="-1"><i className={passVisible.user ? "fas fa-eye-slash" : "fas fa-eye"}></i></button>
                        </div>

                        <div className="flex-row">
                            <label className="chk-wrap">
                                <input type="checkbox" checked={userAuth.remember} onChange={(e) => setUserAuth({ ...userAuth, remember: e.target.checked })} />
                                <div className="chk-box"></div> Remember Me
                            </label>
                            {/* TRIGGER RESET MODAL */}
                            <button type="button" onClick={() => setShowReset(true)} className="link bg-transparent border-none cursor-pointer">Lost Key?</button>
                        </div>

                        <button type="submit" className="btn-submit" style={{ background: loading.user ? '#10b981' : '', opacity: loading.user ? 0.8 : 1 }}>
                            {loading.user ? <><i className="fas fa-circle-notch fa-spin mr-2"></i> VERIFYING...</> : 'Authorize Entry'}
                        </button>
                    </form>
                    <div className="footer-stamp">MLS R.LEX // K-9 UNIT</div>
                </div>

                {/* ADMIN PANELS */}
                <div className={`panel hero-admin ${!isUserView ? 'active' : ''}`}>
                    <Husky isMirrored={true} isClosedEye={adminHusky.closed} isError={adminHusky.error} isHappy={adminHusky.happy} isWagging={adminHusky.wagging} onInteract={() => triggerHuskyWag('admin')} />
                    <h2 className="hero-title">ADMIN PORTAL</h2>
                    <p className="hero-subtitle">Command Intelligence</p>
                    <button className="btn-switch" onClick={togglePortal}><i className="fas fa-arrow-left mr-2"></i> Switch to User</button>
                </div>

                <div className={`panel form-admin ${!isUserView ? 'active' : ''}`}>
                    <div className="form-header">
                        <h2 className="portal-title text-red-600" style={{ color: '#a80a2a' }}>Master Access</h2>
                        <p className="portal-subtitle">Strictly Classified</p>
                    </div>

                    {error.admin && <div className="error-msg" style={{ display: 'block' }}><i className="fas fa-exclamation-triangle mr-1"></i> <span>{error.admin}</span></div>}

                    <form onSubmit={(e) => handleAuth(e, 'admin')} style={{ width: '100%' }}>
                        <div className="input-group">
                            <i className="fas fa-id-badge input-icon"></i>
                            <input type="text" className="premium-input" placeholder="Admin ID" value={adminAuth.id} onChange={(e) => setAdminAuth({ ...adminAuth, id: e.target.value })} required autoComplete="off" />
                        </div>

                        <div className="input-group">
                            <i className="fas fa-lock input-icon"></i>
                            <input type={passVisible.admin ? "text" : "password"} className="premium-input password-field" placeholder="Master Key" value={adminAuth.pass} onChange={(e) => setAdminAuth({ ...adminAuth, pass: e.target.value })} onFocus={() => handlePassFocus('admin')} onBlur={() => handlePassBlur('admin')} required />
                            <button type="button" className="btn-reveal" onClick={() => togglePassword('admin')} tabIndex="-1"><i className={passVisible.admin ? "fas fa-eye-slash" : "fas fa-eye"}></i></button>
                        </div>

                        <div className="flex-row">
                            <label className="chk-wrap">
                                <input type="checkbox" checked={adminAuth.remember} onChange={(e) => setAdminAuth({ ...adminAuth, remember: e.target.checked })} />
                                <div className="chk-box"></div> Trust Device
                            </label>
                        </div>

                        <button type="submit" className="btn-submit" style={{ background: loading.admin ? '#10b981' : '', opacity: loading.admin ? 0.8 : 1 }}>
                            {loading.admin ? <><i className="fas fa-circle-notch fa-spin mr-2"></i> VERIFYING...</> : 'Secure Login'}
                        </button>
                    </form>
                    <div className="footer-stamp">MLS R.LEX // COMMAND</div>
                </div>

            </div>
        </div>
    );
};

export default Login;