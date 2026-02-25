import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LeavePortal = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');
    const isAdmin = storedUser.sessionRole === 'ADMIN';

    // --- STATE ---
    const [time, setTime] = useState(new Date());
    const [leaves, setLeaves] = useState([]);
    const [blackoutDates, setBlackoutDates] = useState([]);

    // UI State
    const [isApplyOpen, setIsApplyOpen] = useState(false);
    const [isDossierOpen, setIsDossierOpen] = useState(false);
    const [isBlackoutOpen, setIsBlackoutOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);

    // Form State
    const defaultForm = { leave_type: 'CASUAL', start_date: '', end_date: '', reason: '' };
    const [leaveForm, setLeaveForm] = useState(defaultForm);
    const [editReason, setEditReason] = useState('');

    // Admin Form State
    const [adminNote, setAdminNote] = useState('');
    const [blackoutForm, setBlackoutForm] = useState({ start: '', end: '', reason: '' });

    // --- INIT ---
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        fetchData();
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        try {
            const [leaveRes, blackoutRes] = await Promise.all([
                fetch('http://127.0.0.1:8080/api/leaves'),
                fetch('http://127.0.0.1:8080/api/blackout-dates')
            ]);
            if (leaveRes.ok) setLeaves(await leaveRes.json());
            if (blackoutRes.ok) setBlackoutDates(await blackoutRes.json());
        } catch (error) { console.error("Database connection failed."); }
    };

    // --- BLACKOUT LOGIC ENGINE ---
    const checkBlackoutOverlap = (start, end) => {
        const sDate = new Date(start);
        const eDate = new Date(end);

        for (let b of blackoutDates) {
            const bStart = new Date(b.start);
            const bEnd = new Date(b.end);
            // Check if date ranges overlap
            if (sDate <= bEnd && eDate >= bStart) {
                return b; // Return the overlapping blackout event
            }
        }
        return null;
    };

    // --- ACTIONS ---
    const handleApplyLeave = async (e) => {
        e.preventDefault();

        // 1. Check for Blackout Dates
        const overlap = checkBlackoutOverlap(leaveForm.start_date, leaveForm.end_date);
        if (overlap) {
            alert(`🚫 REQUEST BLOCKED: Your dates overlap with a Firm Blackout Period:\n\n"${overlap.reason}"\n(${overlap.start} to ${overlap.end})\n\nPlease contact the Managing Partner directly for emergencies.`);
            return;
        }

        try {
            await fetch('http://127.0.0.1:8080/api/leaves/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...leaveForm,
                    employee_name: storedUser.first_name ? `${storedUser.first_name} ${storedUser.last_name}` : storedUser.username,
                    employee_email: storedUser.email || '',
                    employee_id: storedUser.username
                })
            });
            setIsApplyOpen(false);
            setLeaveForm(defaultForm);
            fetchData();
        } catch (error) { alert("Failed to submit request."); }
    };

    const handleUpdateReason = async (e) => {
        e.preventDefault();
        try {
            await fetch(`http://127.0.0.1:8080/api/leaves/edit-reason/${selectedLeave.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: editReason })
            });
            setIsDossierOpen(false);
            fetchData();
        } catch (error) { alert("Failed to update."); }
    };

    const handleAdminAction = async (status) => {
        if ((status === 'REJECTED' || status === 'IGNORED') && adminNote.length < 5) {
            return alert("Rejections require a justification note (min 5 chars).");
        }
        try {
            await fetch(`http://127.0.0.1:8080/api/leaves/admin-action/${selectedLeave.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, admin_response: adminNote })
            });
            setIsDossierOpen(false);
            setAdminNote('');
            fetchData();
        } catch (error) { alert("Action failed."); }
    };

    const handleDeleteLeave = async (id) => {
        if (!window.confirm("Permanently strike this record?")) return;
        try {
            await fetch(`http://127.0.0.1:8080/api/leaves/delete/${id}`, { method: 'DELETE' });
            setIsDossierOpen(false);
            fetchData();
        } catch (error) { alert("Delete failed."); }
    };

    const handleAddBlackout = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://127.0.0.1:8080/api/blackout-dates/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blackoutForm)
            });
            setBlackoutForm({ start: '', end: '', reason: '' });
            fetchData();
        } catch (error) { alert("Failed to add blackout date."); }
    };

    const handleDeleteBlackout = async (id) => {
        try {
            await fetch(`http://127.0.0.1:8080/api/blackout-dates/delete/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) { alert("Failed to delete."); }
    };

    const exportToExcel = () => {
        let csvContent = "data:text/csv;charset=utf-8,Ref ID,Personnel,Type,Start,End,Days,Status,Reason,Admin Note\n";
        visibleLeaves.forEach(l => {
            const cleanReason = (l.reason || '').replace(/\n/g, " ");
            const cleanNote = (l.admin_response || '').replace(/\n/g, " ");
            csvContent += `L${l.id},"${l.employee_name}","${l.leave_type}",${l.start_date},${l.end_date},${l.days_count},${l.status},"${cleanReason}","${cleanNote}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `MLS_Leave_Archive_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    // Filter leaves based on role
    const visibleLeaves = isAdmin ? leaves : leaves.filter(l => l.employee_id === storedUser.username);

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors">

            {/* Header */}
            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0 z-10 transition-colors">
                <div>
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Registry<span className="text-amber-500">.Leaves</span></h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Archival System & Protocol</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-bold text-green-600 flex items-center justify-end gap-1.5 uppercase tracking-widest">
                        System Secure <i className="fa fa-circle text-[5px] animate-pulse"></i>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-widest mt-0.5">
                        {time.toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col p-6 md:p-8 overflow-hidden">

                {/* Toolbar */}
                <div className="flex justify-between items-end mb-6 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Record Management</h3>
                        <div className="flex gap-3 mt-3">
                            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121212] text-stone-600 dark:text-stone-300 text-[10px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm">
                                <i className="fa fa-file-export"></i> {isAdmin ? 'Global Export' : 'My Archive'}
                            </button>

                            {/* THE ADMIN BLACKOUT BUTTON */}
                            {isAdmin && (
                                <button onClick={() => setIsBlackoutOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                    <i className="fa fa-ban"></i> Blackout Dates
                                </button>
                            )}
                        </div>
                    </div>

                    <button onClick={() => setIsApplyOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-black dark:bg-amber-500 text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
                        <i className="fa fa-plus"></i> Add Request
                    </button>
                </div>

                {/* Table Area */}
                <div className="flex-1 bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 shadow-xl flex flex-col overflow-hidden transition-colors">
                    <div className="grid grid-cols-[2fr_1.5fr_3fr_2fr_1.5fr_1fr] gap-4 px-6 py-4 bg-stone-50 dark:bg-black/40 border-b border-stone-200 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-stone-400">
                        <div>Personnel</div>
                        <div>Category</div>
                        <div>Description</div>
                        <div>Duration</div>
                        <div className="text-center">Status</div>
                        <div className="text-right">Ref ID</div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
                        {visibleLeaves.map(leave => (
                            <div key={leave.id} onClick={() => { setSelectedLeave(leave); setEditReason(leave.reason); setAdminNote(''); setIsDossierOpen(true); }}
                                className={`grid grid-cols-[2fr_1.5fr_3fr_2fr_1.5fr_1fr] gap-4 px-4 py-4 items-center rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-stone-200 dark:hover:border-stone-700 ${leave.status === 'REJECTED' || leave.status === 'IGNORED' ? 'opacity-60 grayscale' : ''}`}>

                                <div className="min-w-0 flex flex-col justify-center">
                                    <p className={`text-sm font-bold text-slate-900 dark:text-white truncate ${(leave.status === 'REJECTED' || leave.status === 'IGNORED') ? 'line-through decoration-red-500' : ''}`}>
                                        {leave.employee_name}
                                    </p>
                                    <p className="text-[10px] text-stone-500 font-mono truncate">@{leave.employee_id}</p>
                                </div>

                                <div>
                                    <span className="inline-flex px-2 py-1 rounded bg-stone-100 dark:bg-black border border-stone-200 dark:border-stone-800 text-[9px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest">
                                        {leave.leave_type}
                                    </span>
                                </div>

                                <div className="min-w-0">
                                    <p className="text-xs text-stone-500 dark:text-stone-400 italic truncate max-w-full">"{leave.reason}"</p>
                                </div>

                                <div className="flex flex-col justify-center">
                                    <p className="text-xs font-bold text-slate-700 dark:text-stone-300 font-mono">
                                        {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} <span className="text-stone-300">➜</span> {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">{leave.days_count} Day(s)</p>
                                </div>

                                <div className="flex justify-center items-center">
                                    {leave.status === 'APPROVED' && <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[8px] font-black uppercase tracking-widest border border-green-200 dark:border-green-800">Approved</span>}
                                    {leave.status === 'PENDING' && <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800">Pending</span>}
                                    {(leave.status === 'REJECTED' || leave.status === 'IGNORED') && <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[8px] font-black uppercase tracking-widest border border-red-200 dark:border-red-800">Strike Off</span>}
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] font-mono font-bold text-stone-400">#L{leave.id.substring(3, 7)}</span>
                                </div>
                            </div>
                        ))}
                        {visibleLeaves.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-stone-400 pb-20">
                                <i className="fa fa-folder-open text-5xl mb-4 opacity-50"></i>
                                <p className="text-xs font-black uppercase tracking-widest">No Active Records</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- DOSSIER SLIDE-OUT --- */}
            <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isDossierOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setIsDossierOpen(false)}></div>
            <div className={`fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-[#0f0f10] border-l border-stone-200 dark:border-white/10 shadow-2xl z-[101] flex flex-col transform transition-transform duration-300 ${isDossierOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="h-20 flex items-center justify-between px-8 border-b border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-[#121212] shrink-0">
                    <div>
                        <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-tight">Record Dossier</h3>
                        <p className="text-[10px] font-mono font-bold text-amber-500 mt-1">REF: #{selectedLeave?.id}</p>
                    </div>
                    <button onClick={() => setIsDossierOpen(false)} className="w-8 h-8 rounded-full bg-stone-200 dark:bg-white/5 flex items-center justify-center text-stone-500 hover:bg-red-500 hover:text-white transition-colors"><i className="fa fa-times"></i></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scroll">
                    {selectedLeave && (
                        <div className="space-y-6">
                            <div className="p-6 bg-stone-50 dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-2xl">
                                <label className="text-[9px] font-black uppercase text-stone-400 tracking-widest mb-1 block">Personnel</label>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedLeave.employee_name}</h2>
                                <p className="text-[10px] text-amber-500 font-mono mt-1">{selectedLeave.employee_email || selectedLeave.employee_id}</p>
                            </div>

                            <div className="p-6 border border-stone-200 dark:border-white/5 rounded-2xl bg-white dark:bg-black shadow-sm">
                                <label className="text-[9px] font-black uppercase text-amber-500 tracking-widest mb-2 block">Justification</label>
                                <p className="text-sm text-slate-700 dark:text-stone-300 italic leading-relaxed">"{selectedLeave.reason}"</p>
                                {selectedLeave.is_edited && <div className="mt-4 pt-3 border-t border-stone-100 dark:border-white/5 text-[9px] font-bold text-stone-400 uppercase tracking-widest text-right">Modified by Employee</div>}
                            </div>

                            {/* User Edit Logic */}
                            {!isAdmin && selectedLeave.status === 'PENDING' && !selectedLeave.is_edited && (
                                <form onSubmit={handleUpdateReason} className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
                                    <label className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest mb-2 block">Revision Protocol</label>
                                    <textarea value={editReason} onChange={e => setEditReason(e.target.value)} required className="w-full bg-white dark:bg-black border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 text-xs outline-none focus:border-amber-500 text-slate-900 dark:text-white h-20 resize-none"></textarea>
                                    <button type="submit" className="w-full mt-3 py-3 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">Save Revision</button>
                                </form>
                            )}

                            {/* Admin Locked View */}
                            {isAdmin && (selectedLeave.status === 'REJECTED' || selectedLeave.status === 'IGNORED') && (
                                <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-500 mb-2">
                                        <i className="fa fa-lock"></i>
                                        <span className="text-[10px] font-black tracking-widest uppercase">Adjudication Locked</span>
                                    </div>
                                    <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">Record officially <strong>{selectedLeave.status}</strong>.</p>
                                    <div className="p-4 bg-white dark:bg-black rounded-lg border border-red-100 dark:border-red-900/20">
                                        <p className="text-xs italic text-stone-700 dark:text-stone-300">"{selectedLeave.admin_response}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Admin Action UI */}
                            {isAdmin && selectedLeave.status === 'PENDING' && (
                                <div className="pt-6 border-t border-stone-200 dark:border-white/5">
                                    <label className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2 block">Adjudication Note</label>
                                    <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} className="w-full bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs outline-none focus:border-amber-500 h-20 resize-none text-slate-900 dark:text-white mb-4" placeholder="Reasoning required for rejection..."></textarea>

                                    <div className="grid grid-cols-3 gap-3">
                                        <button onClick={() => handleAdminAction('APPROVED')} className="py-3 rounded-xl bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-500 border border-green-200 dark:border-green-800/50 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform">Accept</button>
                                        <button onClick={() => handleAdminAction('REJECTED')} className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-transform ${adminNote.length >= 5 ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-500 border border-red-200 dark:border-red-800/50 hover:scale-[1.02]' : 'bg-stone-100 dark:bg-white/5 text-stone-400 opacity-50 cursor-not-allowed'}`}>Reject</button>
                                        <button onClick={() => handleAdminAction('IGNORED')} className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-transform ${adminNote.length >= 5 ? 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:scale-[1.02]' : 'bg-stone-100 dark:bg-white/5 text-stone-400 opacity-50 cursor-not-allowed'}`}>Ignore</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-[#121212] shrink-0">
                    {(isAdmin || (selectedLeave?.employee_id === storedUser.username && selectedLeave?.status === 'PENDING')) ? (
                        <button onClick={() => handleDeleteLeave(selectedLeave.id)} className="w-full py-4 bg-red-100 dark:bg-red-900/10 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors shadow-sm">
                            <i className="fa fa-trash mr-2"></i> Hard Purge Record
                        </button>
                    ) : (
                        <div className="text-center py-2 text-[9px] font-black uppercase text-stone-400 tracking-widest"><i className="fa fa-lock mr-2"></i>Entry Sealed</div>
                    )}
                </div>
            </div>

            {/* --- APPLY MODAL --- */}
            {isApplyOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsApplyOpen(false)}>
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-md rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-stone-200 dark:border-white/5 flex justify-between items-center bg-stone-50 dark:bg-black/20">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">New Filing</h3>
                            <button onClick={() => setIsApplyOpen(false)} className="text-stone-400 hover:text-red-500"><i className="fa fa-times text-lg"></i></button>
                        </div>
                        <form className="p-8 space-y-6" onSubmit={handleApplyLeave}>
                            <div>
                                <label className="block text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2">Protocol Category</label>
                                <select value={leaveForm.leave_type} onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500">
                                    <option value="CASUAL">Casual Leave (CL)</option>
                                    <option value="SICK">Medical Protocol (SL)</option>
                                    <option value="EARNED">Privilege Archive (PL)</option>
                                    <option value="LOP">Loss of Pay (LOP)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2">Start Date</label>
                                    <input type="date" required value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2">End Date</label>
                                    <input type="date" required value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2">Justification</label>
                                <textarea required rows="4" placeholder="Enter purpose of request..." value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500 custom-scroll resize-none"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:scale-[1.02] transition-transform">Submit Filing</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- ADMIN BLACKOUT MODAL --- */}
            {isBlackoutOpen && isAdmin && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsBlackoutOpen(false)}>
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-lg rounded-[2rem] border border-red-500/30 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-stone-200 dark:border-white/5 bg-red-50 dark:bg-red-950/20 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-red-600 dark:text-red-500 uppercase tracking-widest">Firm Blackout Dates</h3>
                                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">Block leave requests during critical periods</p>
                            </div>
                            <button onClick={() => setIsBlackoutOpen(false)} className="text-stone-400 hover:text-red-500"><i className="fa fa-times text-lg"></i></button>
                        </div>

                        <div className="p-8">
                            <form onSubmit={handleAddBlackout} className="flex gap-2 mb-6 bg-stone-50 dark:bg-white/5 p-4 rounded-xl border border-stone-200 dark:border-white/5">
                                <input type="date" required value={blackoutForm.start} onChange={e => setBlackoutForm({ ...blackoutForm, start: e.target.value })} className="bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-lg p-2 text-[10px] text-slate-900 dark:text-white outline-none focus:border-red-500" />
                                <span className="text-stone-400 self-center">to</span>
                                <input type="date" required value={blackoutForm.end} onChange={e => setBlackoutForm({ ...blackoutForm, end: e.target.value })} className="bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-lg p-2 text-[10px] text-slate-900 dark:text-white outline-none focus:border-red-500" />
                                <input type="text" required placeholder="Reason (e.g. SC Filing)" value={blackoutForm.reason} onChange={e => setBlackoutForm({ ...blackoutForm, reason: e.target.value })} className="flex-1 bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-red-500" />
                                <button type="submit" className="bg-red-600 text-white px-4 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors">Add</button>
                            </form>

                            <div className="space-y-3 max-h-48 overflow-y-auto custom-scroll pr-2">
                                {blackoutDates.map(b => (
                                    <div key={b.id} className="flex justify-between items-center bg-white dark:bg-black border border-stone-200 dark:border-white/5 p-3 rounded-lg">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">{b.reason}</p>
                                            <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-0.5">{b.start} to {b.end}</p>
                                        </div>
                                        <button onClick={() => handleDeleteBlackout(b.id)} className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/5 text-stone-400 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"><i className="fa fa-trash text-xs"></i></button>
                                    </div>
                                ))}
                                {blackoutDates.length === 0 && <p className="text-xs text-stone-500 text-center italic py-4">No active blackout dates.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeavePortal;