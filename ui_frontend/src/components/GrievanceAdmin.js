import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GrievanceAdmin.css';

const GrievanceAdmin = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');

    // Check if the user is an Admin (Master Account)
    const isAdmin = storedUser.sessionRole === 'ADMIN';

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin) fetchReports();
    }, [isAdmin]);

    const fetchReports = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8080/api/grievances');
            if (res.ok) {
                const data = await res.json();
                // Sort newest first
                setReports(data.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)));
            }
        } catch (error) {
            console.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    // --- ACCESS DENIED SCREEN ---
    // If a regular user tries to type this URL in, they get blocked!
    if (!isAdmin) {
        return (
            <div className="flex-1 flex items-center justify-center bg-stone-100 dark:bg-black p-6">
                <div className="bg-white dark:bg-[#121212] border border-red-500/50 p-12 rounded-3xl shadow-2xl max-w-sm text-center">
                    <i className="fa fa-hand text-6xl text-red-500 mb-6"></i>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Access Denied</h2>
                    <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-8">Classified Clearance Required.</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-colors shadow-lg">
                        Return to Safety
                    </button>
                </div>
            </div>
        );
    }

    const countAnonymous = reports.filter(r => r.type === 'ANONYMOUS_REPORT').length;
    const countAudit = reports.filter(r => r.type === 'MONTHLY_AUDIT').length;

    return (
        <div className="h-full w-full bg-stone-50 dark:bg-black flex flex-col overflow-hidden font-sans relative">

            {/* HEADER */}
            <header className="h-16 shrink-0 border-b border-red-200 dark:border-red-900/30 bg-white dark:bg-[#121212] flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-stone-100 dark:bg-[#1a1a1a] flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors">
                        <i className="fa fa-arrow-left"></i>
                    </button>
                    <div className="flex items-center gap-3 border-l border-stone-200 dark:border-white/10 pl-4">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                            <i className="fa fa-user-secret text-xs"></i>
                        </div>
                        <div>
                            <h2 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                                Internal<span className="text-stone-400">.Affairs</span>
                            </h2>
                            <p className="text-[9px] text-red-500 font-bold uppercase tracking-[0.2em] mt-0.5">Classified Clearance</p>
                        </div>
                    </div>
                </div>

                <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-red"></span>
                    <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Live Feed</span>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden admin-grid-bg">

                {/* LEFT SIDEBAR STATS */}
                <div className="w-64 shrink-0 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-r border-red-200 dark:border-red-900/30 p-6 flex flex-col gap-4 overflow-y-auto custom-scroll-red hidden md:flex">

                    <div className="p-5 bg-stone-50 dark:bg-black border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm">
                        <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Total Logs</p>
                        <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">{reports.length}</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="p-4 bg-stone-50 dark:bg-black border-l-4 border-amber-500 rounded-r-xl border-y border-r border-stone-200 dark:border-stone-800">
                            <p className="text-[9px] font-black uppercase text-stone-500">Anonymous</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{countAnonymous}</p>
                        </div>
                        <div className="p-4 bg-stone-50 dark:bg-black border-l-4 border-blue-500 rounded-r-xl border-y border-r border-stone-200 dark:border-stone-800">
                            <p className="text-[9px] font-black uppercase text-stone-500">Monthly Audits</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{countAudit}</p>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-stone-200 dark:border-stone-800 text-center opacity-40">
                        <p className="text-[8px] font-mono text-stone-500 uppercase">MLS.OS Secure Admin</p>
                    </div>
                </div>

                {/* MAIN FEED */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scroll-red">
                    <div className="max-w-4xl mx-auto space-y-5 pb-10">

                        {loading && <div className="text-center py-20 text-red-500"><i className="fa fa-circle-notch fa-spin text-3xl"></i></div>}

                        {!loading && reports.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 opacity-30 text-stone-400 dark:text-stone-600">
                                <i className="fa fa-folder-open text-6xl mb-4"></i>
                                <p className="text-xs font-black uppercase tracking-[0.3em]">Vault Empty</p>
                            </div>
                        )}

                        {reports.map(report => (
                            <div key={report.id} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">

                                {/* Color Coded Left Border */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${report.type === 'ANONYMOUS_REPORT' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border 
                                            ${report.type === 'ANONYMOUS_REPORT' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20' :
                                                'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'}`}>
                                            {report.type === 'ANONYMOUS_REPORT' ? 'Anonymous Grievance' : 'Monthly Audit'}
                                        </span>
                                        <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">
                                            <i className="fa fa-clock mr-1"></i> {new Date(report.submitted_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <i className={`fa ${report.type === 'ANONYMOUS_REPORT' ? 'fa-user-secret' : 'fa-clipboard-list'} text-stone-300 dark:text-stone-700`}></i>
                                </div>

                                <div className="pl-3">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-tight">{report.subject}</h3>

                                    <div className="p-4 bg-stone-50 dark:bg-black/50 rounded-xl border border-stone-100 dark:border-white/5 font-mono text-xs text-stone-700 dark:text-stone-400 whitespace-pre-wrap leading-relaxed shadow-inner">
                                        {report.description}
                                    </div>

                                    {/* Additional Audit Details (Only shows for Monthly Audits) */}
                                    {report.type === 'MONTHLY_AUDIT' && (
                                        <div className="mt-4 grid grid-cols-3 gap-4">
                                            <div className="bg-stone-50 dark:bg-[#1a1a1a] p-3 rounded-lg border border-stone-100 dark:border-white/5 text-center">
                                                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Professionalism</p>
                                                <p className="text-lg font-bold text-blue-500">{report.rating_prof}/10</p>
                                            </div>
                                            <div className="bg-stone-50 dark:bg-[#1a1a1a] p-3 rounded-lg border border-stone-100 dark:border-white/5 text-center">
                                                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Collaboration</p>
                                                <p className="text-lg font-bold text-blue-500">{report.rating_collab}/10</p>
                                            </div>
                                            <div className="bg-stone-50 dark:bg-[#1a1a1a] p-3 rounded-lg border border-stone-100 dark:border-white/5 text-center">
                                                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Friendliness</p>
                                                <p className="text-lg font-bold text-blue-500">{report.rating_friend}/10</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 flex justify-between items-center border-t border-stone-100 dark:border-white/5 pt-3">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${report.status === 'INVESTIGATING' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-500' : 'bg-green-500/20 text-green-600 dark:text-green-500'}`}>
                                            Status: {report.status}
                                        </span>
                                        <div className="flex items-center gap-1.5 opacity-50">
                                            <i className="fa fa-fingerprint text-[10px] text-stone-500"></i>
                                            <span className="text-[9px] font-mono font-bold uppercase text-stone-500">{report.secret_key}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GrievanceAdmin;