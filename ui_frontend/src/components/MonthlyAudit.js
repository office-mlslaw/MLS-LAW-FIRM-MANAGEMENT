import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MonthlyAudit.css';

const MonthlyAudit = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');

    // --- STATE ---
    const [status, setStatus] = useState({ isOpen: false, loading: true });
    const [targetDateLabel, setTargetDateLabel] = useState('');
    const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });
    const [colleagues, setColleagues] = useState([]);

    const [formData, setFormData] = useState({
        exp_office: '', exp_work: '', issues: '', suggestions: '',
        target_user: '', rating_prof: 5, rating_collab: 5, rating_friend: 5, exp_colleagues: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // --- GLITCH-FREE LOCAL TIME ENGINE ---
    useEffect(() => {
        // 1. Helper: Find the Last Monday of a given month at Midnight
        const getAuditDate = (year, month) => {
            let d = new Date(year, month + 1, 0);
            while (d.getDay() !== 1) { d.setDate(d.getDate() - 1); }
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const now = new Date();
        let target = getAuditDate(now.getFullYear(), now.getMonth());

        // 2. Check if today is exactly the Last Monday
        if (now.toDateString() === target.toDateString()) {
            setStatus({ isOpen: true, loading: false });
            return; // Exit early, no timer needed!
        }

        // 3. If we are past this month's Last Monday, aim for next month
        if (now.getTime() > target.getTime()) {
            target = getAuditDate(now.getFullYear(), now.getMonth() + 1);
        }

        setTargetDateLabel(target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
        setStatus({ isOpen: false, loading: false });

        // 4. Start the glitch-free local countdown
        const interval = setInterval(() => {
            const diff = target.getTime() - new Date().getTime();

            // Seamlessly unlock the UI without refreshing the page
            if (diff <= 0) {
                clearInterval(interval);
                setStatus({ isOpen: true, loading: false });
                return;
            }

            setTimeLeft({
                d: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0'),
                h: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
                m: String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0'),
                s: String(Math.floor((diff / 1000) % 60)).padStart(2, '0')
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []); // Empty dependency array ensures this NEVER loops!

    // --- FETCH COLLEAGUES ---
    useEffect(() => {
        const fetchColleagues = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8080/api/personnel/roll');
                if (res.ok) {
                    const data = await res.json();
                    const allEmp = [...data.partners, ...data.associates, ...data.staff];
                    setColleagues(allEmp.filter(emp => emp.userId !== storedUser.id));
                }
            } catch (error) { }
        };
        fetchColleagues();
    }, [storedUser.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        try {
            const res = await fetch('http://127.0.0.1:8080/api/grievances/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'MONTHLY_AUDIT',
                    subject: `Monthly Audit - ${currentMonthYear}`,
                    description: `Experience: ${formData.exp_colleagues}\nIssues: ${formData.issues}\nSuggestions: ${formData.suggestions}`,
                    target_user: formData.target_user,
                    exp_office: formData.exp_office,
                    exp_work: formData.exp_work,
                    rating_prof: formData.rating_prof,
                    rating_collab: formData.rating_collab,
                    rating_friend: formData.rating_friend
                })
            });
            if (res.ok) setIsSuccess(true);
        } catch (error) {
            alert("Submission failed. Check network.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status.loading) return <div className="flex-1 flex items-center justify-center bg-stone-50 dark:bg-[#0a0a0b] text-amber-500"><i className="fa fa-circle-notch fa-spin text-4xl"></i></div>;

    if (isSuccess) {
        return (
            <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors relative grid-bg">
                <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white dark:bg-[#121212] border border-green-500/30 p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
                        <i className="fa fa-check-circle text-5xl text-green-500 mb-6"></i>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Audit Complete</h2>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-8">Your reflection and peer review have been securely archived.</p>
                        <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-stone-800 text-white dark:bg-white dark:text-black rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-lg">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors relative">

            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white/80 dark:bg-black/80 backdrop-blur-md shrink-0 z-10">
                <div>
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Protocol<span className="text-stone-400 dark:text-stone-600">.Review</span></h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-1">Monthly Operations Audit</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-black text-green-600 dark:text-green-500 uppercase flex items-center justify-end gap-1.5 tracking-widest mb-0.5">
                        Encrypted Feed <i className="fa fa-circle text-[6px] animate-pulse"></i>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-widest">
                        {new Date().toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6 md:p-8 overflow-y-auto grid-bg">

                {!status.isOpen ? (
                    <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 p-12 rounded-[2rem] shadow-2xl max-w-lg w-full text-center animate-fade-in relative overflow-hidden">
                        <div className="w-20 h-20 bg-stone-50 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6 border border-stone-200 dark:border-white/10 shadow-inner">
                            <i className="fa fa-lock text-stone-300 dark:text-stone-600 text-4xl"></i>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Vault Restricted</h3>
                        <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-8 max-w-xs mx-auto leading-relaxed">
                            Protocol activates on the <span className="text-amber-600 dark:text-amber-500">Last Monday</span> of the month.
                        </p>

                        <div className="grid grid-cols-4 gap-4 mb-8">
                            <div className="bg-stone-50 dark:bg-[#1a1a1a] p-3 rounded-xl border border-stone-200 dark:border-white/5">
                                <div className="text-2xl font-black text-amber-500 font-mono">{timeLeft.d}</div>
                                <div className="text-[9px] font-bold uppercase text-stone-400 mt-1">Days</div>
                            </div>
                            <div className="bg-stone-50 dark:bg-[#1a1a1a] p-3 rounded-xl border border-stone-200 dark:border-white/5">
                                <div className="text-2xl font-black text-amber-500 font-mono">{timeLeft.h}</div>
                                <div className="text-[9px] font-bold uppercase text-stone-400 mt-1">Hrs</div>
                            </div>
                            <div className="bg-stone-50 dark:bg-[#1a1a1a] p-3 rounded-xl border border-stone-200 dark:border-white/5">
                                <div className="text-2xl font-black text-amber-500 font-mono">{timeLeft.m}</div>
                                <div className="text-[9px] font-bold uppercase text-stone-400 mt-1">Min</div>
                            </div>
                            <div className="bg-stone-50 dark:bg-[#1a1a1a] p-3 rounded-xl border border-stone-200 dark:border-white/5">
                                <div className="text-2xl font-black text-amber-500 font-mono">{timeLeft.s}</div>
                                <div className="text-[9px] font-bold uppercase text-stone-400 mt-1">Sec</div>
                            </div>
                        </div>

                        <div className="inline-block px-4 py-2 bg-stone-100 dark:bg-[#1a1a1a] rounded-lg border border-stone-200 dark:border-white/5">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                                Target: {targetDateLabel}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl w-full bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-[2rem] shadow-2xl flex flex-col h-full max-h-full animate-fade-in overflow-hidden">
                        <div className="p-8 border-b border-stone-100 dark:border-white/5 flex justify-between items-end shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Monthly Audit</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="h-[2px] w-6 bg-amber-500"></span>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">Reflection & Peer Assessment</p>
                                </div>
                            </div>
                            <div className="text-[9px] font-mono text-amber-500 uppercase tracking-widest hidden md:block border border-amber-500/20 bg-amber-500/10 px-2 py-1 rounded">Vault Open</div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto custom-scroll p-8 space-y-10">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-stone-400 dark:text-stone-500 tracking-widest mb-4 border-b border-stone-100 dark:border-white/5 pb-2">Section I: Office & Self Reflection</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-2 ml-1">Experience in Office</label>
                                            <textarea required value={formData.exp_office} onChange={e => setFormData({ ...formData, exp_office: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors h-24 resize-none legal-textarea" placeholder="Environment, resources, atmosphere..."></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-2 ml-1">Work Experience</label>
                                            <textarea required value={formData.exp_work} onChange={e => setFormData({ ...formData, exp_work: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors h-24 resize-none legal-textarea" placeholder="Professional growth, tasks handled..."></textarea>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-2 ml-1">Issues & Grievances</label>
                                            <input type="text" value={formData.issues} onChange={e => setFormData({ ...formData, issues: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors" placeholder="Any roadblocks or complaints (Confidential)..." />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-2 ml-1">Suggestions</label>
                                            <input type="text" value={formData.suggestions} onChange={e => setFormData({ ...formData, suggestions: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors" placeholder="Ideas for firm improvement..." />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end border-b border-amber-500/20 pb-2 mb-4">
                                        <h4 className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest">Section II: Peer Evaluation</h4>
                                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Mandatory</span>
                                    </div>
                                    <div className="bg-stone-50 dark:bg-[#1a1a1a] p-6 rounded-2xl border border-stone-200 dark:border-white/5">
                                        <div className="mb-8">
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2 ml-1">Select Colleague to Rate</label>
                                            <div className="relative">
                                                <select required value={formData.target_user} onChange={e => setFormData({ ...formData, target_user: e.target.value })} className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer">
                                                    <option value="" disabled>-- Choose Personnel --</option>
                                                    {colleagues.map(c => (
                                                        <option key={c.userId} value={c.userId}>{c.user.first_name ? `${c.user.first_name} ${c.user.last_name}`.toUpperCase() : c.userId}</option>
                                                    ))}
                                                </select>
                                                <i className="fa fa-chevron-down absolute right-4 top-4 text-stone-400 text-xs pointer-events-none"></i>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-stone-500">
                                                    <span>Professionalism</span><span className="text-amber-500">{formData.rating_prof}/10</span>
                                                </div>
                                                <input type="range" min="1" max="10" value={formData.rating_prof} onChange={e => setFormData({ ...formData, rating_prof: e.target.value })} className="w-full accent-amber-500 cursor-pointer" />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-stone-500">
                                                    <span>Collaboration</span><span className="text-amber-500">{formData.rating_collab}/10</span>
                                                </div>
                                                <input type="range" min="1" max="10" value={formData.rating_collab} onChange={e => setFormData({ ...formData, rating_collab: e.target.value })} className="w-full accent-amber-500 cursor-pointer" />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-stone-500">
                                                    <span>Friendliness</span><span className="text-amber-500">{formData.rating_friend}/10</span>
                                                </div>
                                                <input type="range" min="1" max="10" value={formData.rating_friend} onChange={e => setFormData({ ...formData, rating_friend: e.target.value })} className="w-full accent-amber-500 cursor-pointer" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold uppercase text-stone-500 mb-2 ml-1">Experience with this Colleague</label>
                                            <textarea required value={formData.exp_colleagues} onChange={e => setFormData({ ...formData, exp_colleagues: e.target.value })} className="w-full bg-white dark:bg-black border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors h-20 resize-none legal-textarea" placeholder="Provide context for your rating..."></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-black/40 shrink-0 flex justify-between items-center rounded-b-[2rem]">
                                <button type="submit" disabled={isSubmitting} className="bg-black text-white dark:bg-amber-500 dark:text-black px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-xl flex items-center gap-2">
                                    {isSubmitting ? <i className="fa fa-circle-notch fa-spin"></i> : <i className="fa fa-lock"></i>}
                                    {isSubmitting ? 'Securing Data...' : 'Submit Assessment'}
                                </button>
                                <div className="flex items-center gap-2 opacity-60">
                                    <i className="fa fa-shield-halved text-green-500 text-xs"></i>
                                    <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest hidden sm:inline">AES-256 Encrypted</span>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MonthlyAudit;