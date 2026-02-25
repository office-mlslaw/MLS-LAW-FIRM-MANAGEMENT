import React, { useState, useEffect } from 'react';
import '../styles/SettingsDrawer.css';

const SettingsDrawer = ({ isOpen, onClose, sidebarWidth = 256 }) => {
    // --- THEME STATE ---
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('mls_theme') || 'dark');

    // --- EMAIL STATE ---
    const [email, setEmail] = useState('');
    const [isEmailDisabled, setIsEmailDisabled] = useState(true);

    // --- PASSWORD STATE ---
    const [currentPass, setCurrentPass] = useState('');
    const [passVisible, setPassVisible] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    // Validator States
    const [score, setScore] = useState(0);
    const [reqs, setReqs] = useState({ length: false, number: false, symbol: false, upper: false });

    // THE FIX: Smart fetcher looks in both Storage locations
    const getUserData = () => JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');

    // --- INITIALIZE DATA ---
    useEffect(() => {
        const storedUser = getUserData();
        if (storedUser.email) setEmail(storedUser.email);
    }, [isOpen]);

    // 1. Theme Engine (Includes Tailwind Toggle)
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('mls_theme', theme);
        setCurrentTheme(theme);

        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // 2. Password Validator Engine
    useEffect(() => {
        const rules = {
            length: /.{8,}/.test(newPass),
            number: /[0-9]/.test(newPass),
            symbol: /[!@#$%^&*(),.?":{}|<>]/.test(newPass),
            upper: /(?=.*[a-z])(?=.*[A-Z])/.test(newPass)
        };
        setReqs(rules);

        let newScore = 0;
        if (rules.length) newScore += 25;
        if (rules.number) newScore += 25;
        if (rules.symbol) newScore += 25;
        if (rules.upper) newScore += 25;
        setScore(newScore);
    }, [newPass]);

    const isMatch = newPass && confirmPass && newPass === confirmPass;
    const isReadyToSubmit = score === 100 && isMatch && currentPass.length > 0;

    // 3. Auto-Generator
    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let generated = "A1!" + Array(13).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
        generated = generated.split('').sort(() => 0.5 - Math.random()).join('');
        setNewPass(generated);
        setConfirmPass(generated);
        setPassVisible(true);
    };

    // 4. Unified Update Engine (Handles both Email and Password)
    const handleProfileUpdate = async (updateType) => {
        if (!currentPass) {
            alert("SECURITY LOCK: You must enter your 'Current Password' in the Security section below to authorize changes.");
            return;
        }

        const storedUser = getUserData();

        // Safety Catch for Emergency Admin
        if (storedUser.id === 'MASTER_01') {
            alert("SYSTEM LOCKED: The master emergency account credentials cannot be modified via the UI.");
            return;
        }

        try {
            const payload = {
                userId: storedUser.id,
                currentPassword: currentPass,
                newEmail: updateType === 'email' ? email : undefined,
                newPassword: updateType === 'password' ? newPass : undefined
            };

            const res = await fetch('http://127.0.0.1:8080/api/auth/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                alert(`✅ SUCCESS: ${updateType === 'email' ? 'Email' : 'Credentials'} Updated!`);

                if (updateType === 'email') {
                    storedUser.email = email;
                    // Update whichever storage they used to log in
                    if (localStorage.getItem('mls_user_data')) localStorage.setItem('mls_user_data', JSON.stringify(storedUser));
                    else sessionStorage.setItem('mls_user_data', JSON.stringify(storedUser));
                    setIsEmailDisabled(true);
                } else {
                    setCurrentPass('');
                    setNewPass('');
                    setConfirmPass('');
                }
            } else {
                alert("❌ ERROR: " + data.message);
            }
        } catch (error) {
            alert("❌ Network Error. Could not reach server.");
        }
    };

    // Dynamic UI logic for strength bar
    let barColor = 'bg-red-500';
    let strengthText = 'None';
    let textColor = 'text-stone-300';
    if (score > 0 && score <= 25) { barColor = 'bg-red-500'; strengthText = 'Weak'; textColor = 'text-red-500'; }
    else if (score === 50) { barColor = 'bg-orange-400'; strengthText = 'Fair'; textColor = 'text-orange-400'; }
    else if (score === 75) { barColor = 'bg-yellow-400'; strengthText = 'Good'; textColor = 'text-amber-500'; }
    else if (score === 100) { barColor = 'bg-green-500'; strengthText = 'Strong'; textColor = 'text-green-500'; }

    return (
        <>
            {/* Dark Backdrop */}
            <div className={`settings-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose}></div>

            {/* The Drawer */}
            <div
                className={`settings-drawer ${isOpen ? 'open' : ''}`}
                style={{ left: isOpen ? `${sidebarWidth}px` : '0px' }}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-neutral-900/50">
                    <h3 className="text-sm font-black uppercase tracking-widest text-stone-700 dark:text-white">System Config</h3>
                    <button onClick={onClose} className="text-stone-400 hover:text-amber-500"><i className="fa fa-times text-lg"></i></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scroll text-stone-600 dark:text-stone-400">

                    {/* --- THEME SWITCHER --- */}
                    <div>
                        <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-4 border-b border-stone-100 dark:border-stone-800 pb-2">Environment Theme</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => applyTheme('default')} className={`theme-opt flex flex-col items-center justify-center p-3 rounded-xl border border-stone-200 transition-all group bg-white hover:border-amber-500 ${currentTheme === 'default' ? 'theme-active' : ''}`}>
                                <i className="fa fa-sun text-lg text-amber-500 mb-2"></i>
                                <span className="text-[10px] font-bold text-stone-600 uppercase">Light</span>
                            </button>
                            <button onClick={() => applyTheme('dark')} className={`theme-opt flex flex-col items-center justify-center p-3 rounded-xl border border-stone-800 bg-neutral-800 transition-all group hover:border-amber-500 ${currentTheme === 'dark' ? 'theme-active' : ''}`}>
                                <i className="fa fa-moon text-lg text-indigo-400 mb-2"></i>
                                <span className="text-[10px] font-bold text-stone-300 uppercase">Vault</span>
                            </button>
                            <button onClick={() => applyTheme('parchment')} className={`theme-opt flex flex-col items-center justify-center p-3 rounded-xl border border-stone-300 bg-[#f5f2eb] transition-all group hover:border-[#80011f] ${currentTheme === 'parchment' ? 'theme-active' : ''}`}>
                                <i className="fa fa-scroll text-lg text-[#80011f] mb-2"></i>
                                <span className="text-[10px] font-bold text-stone-600 uppercase">Parchment</span>
                            </button>
                        </div>
                    </div>

                    {/* --- EMAIL CONFIG --- */}
                    <div>
                        <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-4 border-b border-stone-100 dark:border-stone-800 pb-2">Contact Information</h4>
                        <div className="bg-stone-50 dark:bg-neutral-800/30 rounded-xl p-5 border border-stone-200 dark:border-stone-700/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Email Address</span>
                                <button onClick={() => setIsEmailDisabled(!isEmailDisabled)} className={`text-[9px] font-bold uppercase px-2 py-1 rounded transition-colors ${isEmailDisabled ? 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-amber-500 hover:text-white' : 'bg-red-500 text-white'}`}>
                                    {isEmailDisabled ? <><i className="fa fa-pen mr-1"></i> Edit</> : <><i className="fa fa-times mr-1"></i> Cancel</>}
                                </button>
                            </div>
                            <div className="space-y-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isEmailDisabled}
                                    className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition text-stone-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {!isEmailDisabled && (
                                    <button
                                        onClick={() => handleProfileUpdate('email')}
                                        className="w-full py-2.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-amber-600 transition-all shadow-md"
                                    >
                                        Save Email Changes
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- SECURITY ENGINE --- */}
                    <div>
                        <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-4 border-b border-stone-100 dark:border-stone-800 pb-2">Security & Access</h4>
                        <div className="bg-stone-50 dark:bg-neutral-800/30 rounded-xl p-5 border border-stone-200 dark:border-stone-700/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Update Credentials</span>
                                <button onClick={generatePassword} className="text-[9px] font-bold uppercase bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded hover:bg-amber-200 transition-colors">
                                    <i className="fa fa-bolt mr-1"></i> Auto-Gen
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* The Master Key Input */}
                                <input
                                    type="password"
                                    placeholder="Current Password (Required)"
                                    value={currentPass}
                                    onChange={(e) => setCurrentPass(e.target.value)}
                                    className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none transition text-stone-800 dark:text-white"
                                />

                                <div className="relative">
                                    <input
                                        type={passVisible ? "text" : "password"}
                                        placeholder="New Password"
                                        value={newPass}
                                        onChange={(e) => setNewPass(e.target.value)}
                                        className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none transition pr-8 text-stone-800 dark:text-white"
                                    />
                                    <button onClick={() => setPassVisible(!passVisible)} className="absolute right-2 top-2 text-stone-400 hover:text-amber-500">
                                        <i className={`fa ${passVisible ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] uppercase font-bold text-stone-400">
                                        <span>Strength</span>
                                        <span className={`font-bold ${textColor}`}>{strengthText}</span>
                                    </div>
                                    <div className="strength-bar-container bg-stone-200 dark:bg-stone-800 h-1 rounded-full overflow-hidden">
                                        <div className={`strength-bar h-full transition-all duration-300 ${barColor}`} style={{ width: `${score}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[9px] text-stone-500 font-medium">
                                    <div className={`flex items-center gap-1 ${reqs.length ? 'text-green-500' : ''}`}><i className="fa fa-circle-check"></i> 8+ Chars</div>
                                    <div className={`flex items-center gap-1 ${reqs.number ? 'text-green-500' : ''}`}><i className="fa fa-circle-check"></i> Number</div>
                                    <div className={`flex items-center gap-1 ${reqs.symbol ? 'text-green-500' : ''}`}><i className="fa fa-circle-check"></i> Symbol</div>
                                    <div className={`flex items-center gap-1 ${reqs.upper ? 'text-green-500' : ''}`}><i className="fa fa-circle-check"></i> Upper/Lower</div>
                                </div>

                                <div>
                                    <input
                                        type={passVisible ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        value={confirmPass}
                                        onChange={(e) => setConfirmPass(e.target.value)}
                                        className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-amber-500 outline-none transition text-stone-800 dark:text-white"
                                    />
                                    {confirmPass && (
                                        <p className={`text-[9px] mt-1 font-bold uppercase ${isMatch ? 'text-green-500' : 'text-red-500'}`}>
                                            {isMatch ? 'Match' : 'Mismatch'}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleProfileUpdate('password')}
                                    disabled={!isReadyToSubmit}
                                    className={`w-full py-2.5 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${isReadyToSubmit ? 'bg-amber-500 hover:bg-amber-600' : 'bg-stone-300 dark:bg-stone-800 cursor-not-allowed opacity-50'}`}
                                >
                                    Update Credentials
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsDrawer;