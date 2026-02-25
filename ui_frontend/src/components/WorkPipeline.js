import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WorkPipeline.css';

const COLUMNS = {
    'TODO': { id: 'TODO', title: 'New Assignments', color: 'border-l-red-500', badge: 'bg-red-500' },
    'IN_PROGRESS': { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-l-blue-500', badge: 'bg-blue-500' },
    'REVIEW': { id: 'REVIEW', title: 'Awaiting Review', color: 'border-l-gold-500', badge: 'bg-amber-500' },
    'DONE': { id: 'DONE', title: 'Completed & Filed', color: 'border-l-green-500', badge: 'bg-green-500' }
};

const WorkPipeline = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');
    const isAdmin = storedUser.sessionRole === 'ADMIN';

    // --- STATE ---
    const [time, setTime] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [cases, setCases] = useState([]);
    const [personnel, setPersonnel] = useState([]);
    const [isMyPriority, setIsMyPriority] = useState(false);

    // Drag & Drop State
    const [draggedTaskId, setDraggedTaskId] = useState(null);

    // Modal States
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isWorkLogOpen, setIsWorkLogOpen] = useState(false);
    const [activeTask, setActiveTask] = useState(null);

    // Form Data
    const [taskForm, setTaskForm] = useState({ title: '', assigned_to: '', related_case: '', due_date: '', priority: 'NORMAL' });
    const [logForm, setLogForm] = useState({ hours: 1.0, activity_type: 'DRAFTING', summary: '' });

    // --- INIT ---
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        fetchData();
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        try {
            const [taskRes, caseRes, staffRes] = await Promise.all([
                fetch('http://127.0.0.1:8080/api/tasks'),
                fetch('http://127.0.0.1:8080/api/cases'),
                fetch('http://127.0.0.1:8080/api/personnel/roll')
            ]);
            if (taskRes.ok) setTasks(await taskRes.json());
            if (caseRes.ok) setCases(await caseRes.json());
            if (staffRes.ok) {
                const data = await staffRes.json();
                setPersonnel([...(data.partners || []), ...(data.associates || []), ...(data.staff || [])]);
            }
        } catch (error) { console.error("Database connection failed."); }
    };

    // --- NATIVE DRAG AND DROP HANDLERS ---
    const handleDragStart = (e, taskId) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        if (!draggedTaskId) return;

        const taskIndex = tasks.findIndex(t => t.id === draggedTaskId);
        if (taskIndex === -1 || tasks[taskIndex].status === targetStatus) {
            setDraggedTaskId(null);
            return;
        }

        // Optimistic UI Update
        const newTasks = [...tasks];
        newTasks[taskIndex].status = targetStatus;
        setTasks(newTasks);
        setDraggedTaskId(null);

        // Sync to Backend
        try {
            await fetch(`http://127.0.0.1:8080/api/tasks/update-status/${draggedTaskId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus })
            });
        } catch (error) {
            alert("Failed to sync move with server.");
            fetchData();
        }
    };

    // --- ACTIONS ---
    const handleAssignTask = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://127.0.0.1:8080/api/tasks/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...taskForm, created_by: storedUser.username })
            });
            setIsAssignOpen(false);
            setTaskForm({ title: '', assigned_to: '', related_case: '', due_date: '', priority: 'NORMAL' });
            fetchData();
        } catch (error) { alert("Failed to assign task."); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Permanently delete this task and all its logged hours?")) return;
        try {
            await fetch(`http://127.0.0.1:8080/api/tasks/delete/${taskId}`, { method: 'DELETE' });
            setIsWorkLogOpen(false);
            fetchData();
        } catch (error) { alert("Delete failed."); }
    };

    const handleLogWork = async (e) => {
        e.preventDefault();
        try {
            const logData = { ...logForm, date: new Date().toISOString().split('T')[0], loggedBy: storedUser.username };
            await fetch(`http://127.0.0.1:8080/api/tasks/${activeTask.id}/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData)
            });
            alert("Progress Logged Successfully!");
            setIsWorkLogOpen(false);
            setLogForm({ hours: 1.0, activity_type: 'DRAFTING', summary: '' });
            fetchData();
        } catch (error) { alert("Failed to log work."); }
    };

    const exportWorkLogs = () => {
        let csvContent = "data:text/csv;charset=utf-8,Task ID,Title,Assignee,Case Ref,Status,Total Hours,Logs\n";
        tasks.forEach(t => {
            const totalHours = (t.workLogs || []).reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);
            const logSummaries = (t.workLogs || []).map(l => `${l.date}: ${l.activity_type} - ${l.hours}hrs`).join(" | ");
            csvContent += `${t.id},"${t.title}","${t.assigned_to}","${t.related_case}",${t.status},${totalHours},"${logSummaries}"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `MLS_Work_Logs_${new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- FILTERING ---
    const visibleTasks = isMyPriority ? tasks.filter(t => t.assigned_to === storedUser.username) : tasks;

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors">

            {/* Header */}
            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0 z-10">
                <div>
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Work Pipeline</h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Drafting & Research Queue</p>
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
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div className="flex gap-3">
                        <button onClick={() => setIsMyPriority(false)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isMyPriority ? 'bg-black text-white dark:bg-amber-500 dark:text-black shadow-lg' : 'bg-stone-200 text-stone-600 dark:bg-white/5 dark:text-stone-400'}`}>Global Queue</button>
                        <button onClick={() => setIsMyPriority(true)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isMyPriority ? 'bg-black text-white dark:bg-amber-500 dark:text-black shadow-lg' : 'bg-stone-200 text-stone-600 dark:bg-white/5 dark:text-stone-400'}`}>
                            <i className="fa fa-user-tag"></i> My Priority
                        </button>
                        <button onClick={() => navigate('/request-work')} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform flex items-center gap-2"><i className="fa fa-hand-raising"></i> Request Work</button>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={exportWorkLogs} className="bg-green-600/10 text-green-600 border border-green-600/30 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center gap-2">
                            <i className="fa fa-file-excel text-sm"></i> Download Logs
                        </button>
                        {isAdmin && (
                            <button onClick={() => setIsAssignOpen(true)} className="bg-amber-500 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-amber-500/20 flex items-center gap-2">
                                <i className="fa fa-plus"></i> Assign Task
                            </button>
                        )}
                    </div>
                </div>

                {/* NATIVE HTML5 KANBAN BOARD ENGINE */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                    {Object.values(COLUMNS).map(column => {
                        const columnTasks = visibleTasks.filter(t => t.status === column.id);

                        return (
                            <div key={column.id} className="flex flex-col bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-stone-100 dark:border-white/5 flex justify-between items-center bg-stone-50 dark:bg-black/20">
                                    <h4 className="text-[10px] font-black uppercase text-stone-500 tracking-widest">{column.title}</h4>
                                    <span className={`${column.badge} text-white text-[9px] font-black px-2 py-0.5 rounded-md`}>{columnTasks.length}</span>
                                </div>

                                {/* Droppable Area */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                    className={`flex-1 p-4 overflow-y-auto kanban-col space-y-4 transition-colors`}
                                >
                                    {columnTasks.map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onDragEnd={() => setDraggedTaskId(null)}
                                            onClick={() => { setActiveTask(task); setIsWorkLogOpen(true); }}
                                            className={`task-card bg-white dark:bg-black p-4 rounded-xl border border-stone-200 dark:border-white/10 border-l-4 ${column.color} cursor-pointer group hover:shadow-md transition-all ${draggedTaskId === task.id ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                        >

                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[8px] font-bold bg-stone-100 dark:bg-white/5 px-2 py-1 rounded text-stone-500 uppercase tracking-widest">#{task.id}</span>
                                                {task.priority === 'HIGH' && <span className="text-red-500 text-[10px] animate-pulse"><i className="fa fa-triangle-exclamation"></i></span>}
                                            </div>

                                            <h5 className={`text-xs font-black text-slate-900 dark:text-white mb-2 leading-tight uppercase ${column.id === 'DONE' ? 'line-through opacity-50' : ''}`}>{task.title}</h5>
                                            <p className="text-[10px] font-bold text-stone-400 mb-4 uppercase tracking-widest truncate"><i className="fa fa-gavel mr-1"></i> {task.related_case || 'General Matter'}</p>

                                            <div className="flex justify-between items-center pt-3 border-t border-stone-100 dark:border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-[8px] font-black text-slate-900 dark:text-white">{task.assigned_to?.charAt(0) || '?'}</div>
                                                    <span className="text-[9px] font-bold text-stone-500 uppercase">{task.assigned_to}</span>
                                                </div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-stone-400'}`}>{task.due_date}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {columnTasks.length === 0 && <div className="h-20 flex items-center justify-center text-[10px] font-bold text-stone-400 uppercase tracking-widest border-2 border-dashed border-stone-200 dark:border-white/5 rounded-xl pointer-events-none">Drop Here</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- ASSIGN TASK MODAL --- */}
            {isAssignOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsAssignOpen(false)}>
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-lg rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-stone-200 dark:border-white/5 flex justify-between items-center bg-stone-50 dark:bg-black/20">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Assign New Task</h3>
                            <button onClick={() => setIsAssignOpen(false)} className="text-stone-400 hover:text-red-500"><i className="fa fa-times text-lg"></i></button>
                        </div>
                        <form className="p-8 space-y-5" onSubmit={handleAssignTask}>
                            <div>
                                <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Drafting Instructions / Title</label>
                                <input type="text" required placeholder="e.g. Draft Writ Petition for Case 123" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Assign To</label>
                                    <select required value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500">
                                        <option value="">Select Personnel...</option>
                                        {personnel.map(p => <option key={p.user.id} value={p.user.username}>{p.user.first_name} {p.user.last_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Attach Case File</label>
                                    <select value={taskForm.related_case} onChange={e => setTaskForm({ ...taskForm, related_case: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500">
                                        <option value="">-- General Firm Task --</option>
                                        {cases.map(c => <option key={c.id} value={c.case_id}>{c.case_id} - {c.client_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Due Date</label>
                                    <input type="date" required value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Priority</label>
                                    <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500">
                                        <option value="NORMAL">Standard</option>
                                        <option value="HIGH">Urgent (High Priority)</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-lg">Push to Pipeline</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- WORK LOG DOSSIER MODAL --- */}
            {isWorkLogOpen && activeTask && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsWorkLogOpen(false)}>
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-2xl rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-stone-200 dark:border-white/5 flex justify-between items-center bg-stone-50 dark:bg-black/20">
                            <div>
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded">Active Workspace</span>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mt-2 leading-tight">{activeTask.title}</h3>
                            </div>
                            <button onClick={() => setIsWorkLogOpen(false)} className="text-stone-400 hover:text-red-500"><i className="fa fa-times text-xl"></i></button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scroll">

                            {/* Task Details Info */}
                            <div className="space-y-6">
                                <div className="bg-stone-50 dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-2xl p-5">
                                    <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest mb-1">Related Case</p>
                                    <p className="text-sm font-bold text-amber-500 font-mono mb-4">{activeTask.related_case || 'General Firm Matter'}</p>

                                    <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest mb-1">Currently Assigned</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-4">{activeTask.assigned_to}</p>

                                    <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest mb-1">Deadline</p>
                                    <p className={`text-sm font-black uppercase tracking-widest ${new Date(activeTask.due_date) < new Date() ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{activeTask.due_date}</p>
                                </div>

                                {isAdmin && (
                                    <button onClick={() => handleDeleteTask(activeTask.id)} className="w-full py-3 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-500/30">
                                        <i className="fa fa-trash mr-2"></i> Purge Assignment
                                    </button>
                                )}
                            </div>

                            {/* Work Log Form */}
                            <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Log Hours & Progress</h4>
                                <form onSubmit={handleLogWork} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Hours Spent</label>
                                            <input type="number" step="0.5" min="0.5" required value={logForm.hours} onChange={e => setLogForm({ ...logForm, hours: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Activity Type</label>
                                            <select value={logForm.activity_type} onChange={e => setLogForm({ ...logForm, activity_type: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500">
                                                <option value="DRAFTING">Drafting</option>
                                                <option value="RESEARCH">Research</option>
                                                <option value="CLERICAL">Filing / Clerical</option>
                                                <option value="APPEARANCE">Court Appearance</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Work Summary</label>
                                        <textarea required rows="4" placeholder="Summarize what was completed..." value={logForm.summary} onChange={e => setLogForm({ ...logForm, summary: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 custom-scroll resize-none"></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-lg">Submit Entry</button>
                                </form>

                                {/* Historical Logs */}
                                {activeTask.workLogs?.length > 0 && (
                                    <div className="mt-6 border-t border-stone-200 dark:border-white/5 pt-4">
                                        <h5 className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3">Previous Logs</h5>
                                        <div className="space-y-2 max-h-32 overflow-y-auto custom-scroll pr-2">
                                            {activeTask.workLogs.map((log, i) => (
                                                <div key={i} className="bg-stone-50 dark:bg-[#121212] p-3 rounded-lg border border-stone-100 dark:border-white/5">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[8px] font-black text-amber-500 uppercase">{log.activity_type} • {log.hours} Hrs</span>
                                                        <span className="text-[8px] font-bold text-stone-500">{log.date} by {log.loggedBy}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-900 dark:text-white font-medium italic">"{log.summary}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkPipeline;