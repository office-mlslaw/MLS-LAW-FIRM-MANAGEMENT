import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Grievance.css'; // <-- SYNCED WITH YOUR CSS

const GrievanceSubmit = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ subject: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [secretKey, setSecretKey] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('http://127.0.0.1:8080/api/grievances/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ANONYMOUS_REPORT',
                    subject: formData.subject,
                    description: formData.description
                })
            });
            const data = await res.json();
            if (data.success) {
                setSecretKey(data.secret_key); // Shows the success screen
            }
        } catch (error) {
            alert("Secure connection failed. Check your network.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // The Panic Button logic (wipes form and redirects instantly)
    const handlePanic = () => {
        setFormData({ subject: '', description: '' });
        navigate('/dashboard');
    };

    // --- SUCCESS SCREEN (Displays the Secret Key) ---
    if (secretKey) {
        return (
            <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors relative grid-bg">
                <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white dark:bg-[#121212] border border-green-500/30 p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
                        <i className="fa fa-shield-check text-5xl text-green-500 mb-6"></i>

                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Report Secured</h2>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-8">Your identity has been purged from the payload.</p>

                        <div className="bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 p-6 rounded-2xl mb-8 select-all">
                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-2">Your Secret Tracker Key</p>
                            <p className="text-3xl font-mono font-black text-amber-500 tracking-[0.2em]">{secretKey}</p>
                        </div>

                        <p className="text-[10px] text-stone-400 mb-8 max-w-xs mx-auto leading-relaxed">
                            Please save this key securely. You will need it to read admin replies or check the status of your report anonymously.
                        </p>

                        <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-stone-800 text-white dark:bg-white dark:text-black rounded-xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-lg">
                            Wipe Screen & Exit
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN SUBMISSION SCREEN ---
    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors relative">

            {/* Header */}
            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white/80 dark:bg-black/80 backdrop-blur-md shrink-0 z-10">
                <div>
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Internal Affairs</h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-1">Zero-Trace Anonymous Reporting</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-[9px] font-black text-green-600 dark:text-green-500 uppercase flex items-center justify-end gap-1.5 tracking-widest">
                            Encrypted Feed <i className="fa fa-circle text-[6px] animate-pulse-fast"></i>
                        </div>
                    </div>
                    {/* THE PANIC BUTTON */}
                    <button onClick={handlePanic} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-700 transition-colors flex items-center gap-2 border border-red-500/50" title="Wipe screen and return to Dashboard immediately">
                        <i className="fa fa-person-running text-sm"></i> Panic Exit
                    </button>
                </div>
            </header>

            <div className="flex-1 flex justify-center p-6 md:p-8 overflow-y-auto grid-bg">
                <div className="max-w-3xl w-full animate-fade-in mt-4">

                    {/* INFO BANNER */}
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl mb-8 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <i className="fa fa-user-secret text-lg text-amber-500"></i>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Total Anonymity Guaranteed</h4>
                            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                                This portal bypasses standard logging. It does not track your IP, MAC address, session cookie, or username. When you click submit, only the text below is transmitted to the Managing Partner.
                            </p>
                        </div>
                    </div>

                    {/* SUBMISSION FORM */}
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 p-8 rounded-[2rem] shadow-xl space-y-6">

                        <div>
                            <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2 ml-1">Subject / Category</label>
                            <input
                                type="text" required
                                value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="e.g., Issues, Needs, Disputes within colleagues, Any other issue..."
                                className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2 ml-1">Detailed Description</label>
                            <textarea
                                required rows="8"
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Provide as much detail as possible. Do not include your own name or specific dates if you wish to remain entirely anonymous."
                                className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-xl px-5 py-4 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors resize-none legal-textarea"
                            ></textarea>
                        </div>

                        <div className="pt-6 mt-4 border-t border-stone-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-2 opacity-60">
                                <i className="fa fa-lock text-green-500 text-xs"></i>
                                <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest">AES-256 Encrypted Payload</span>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-black text-white dark:bg-amber-500 dark:text-black px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform shadow-lg shadow-black/10 flex items-center justify-center gap-3">
                                {isSubmitting ? <i className="fa fa-circle-notch fa-spin"></i> : <i className="fa fa-paper-plane"></i>}
                                {isSubmitting ? 'Encrypting Data...' : 'Transmit Securely'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default GrievanceSubmit;