import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RequestWork = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');
    const [isLoading, setIsLoading] = useState(false);

    const handleYes = async () => {
        setIsLoading(true);
        try {
            // Push a notification task directly to the Kanban board
            await fetch('http://127.0.0.1:8080/api/tasks/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `BANDWIDTH LOG: ${storedUser.first_name || storedUser.username} is available for new assignments.`,
                    assigned_to: 'Admin_PC', // Assign to Admin to review
                    related_case: 'General Firm Management',
                    due_date: new Date().toISOString().split('T')[0],
                    priority: 'NORMAL',
                    created_by: storedUser.username
                })
            });

            alert("✅ Capacity logged. The Lead Partners have been notified of your availability.");
            navigate('/work');
        } catch (error) {
            alert("❌ Network error. Please try again.");
            setIsLoading(false);
        }
    };

    const handleNo = () => {
        // Simply return to the pipeline if they change their mind
        navigate('/work');
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-stone-50 dark:bg-[#0a0a0b] h-full p-4 transition-colors">
            <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 p-10 md:p-14 rounded-3xl shadow-2xl max-w-lg w-full text-center animate-fade-in relative overflow-hidden">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-gold-600"></div>
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>

                <div className="w-20 h-20 bg-stone-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-stone-200 dark:border-white/5">
                    <i className="fa-solid fa-scale-balanced text-3xl text-amber-500"></i>
                </div>

                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Capacity Check</h1>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-8 leading-relaxed">
                    Please confirm your current workload bandwidth. Clicking "Available" will notify the managing partners to deploy a new case file to your desk.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleYes}
                        disabled={isLoading}
                        className="w-full bg-black text-white dark:bg-amber-500 dark:text-black py-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <i className="fa fa-circle-notch fa-spin"></i> : 'I am Available for Work'}
                    </button>

                    <button
                        onClick={handleNo}
                        disabled={isLoading}
                        className="w-full bg-stone-100 text-stone-500 dark:bg-white/5 dark:text-stone-400 py-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-stone-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all border border-stone-200 dark:border-white/5"
                    >
                        Cancel / Return to Pipeline
                    </button>
                </div>

                <p className="mt-8 text-[9px] font-bold text-stone-400 uppercase tracking-widest opacity-60">
                    Logged as: {storedUser.username} • {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

export default RequestWork;