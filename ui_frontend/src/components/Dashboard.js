import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');
    const isAdmin = storedUser.sessionRole === 'ADMIN';

    // --- STATE ---
    const [time, setTime] = useState(new Date());
    const [sessionTime, setSessionTime] = useState({ h: 0, m: 0 });
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const [data, setData] = useState({ cases: [], tasks: [], events: [], leaves: [] });

    // Persistent Activity Log (Stored in LocalStorage)
    const [activityLog, setActivityLog] = useState(() => {
        const savedLogs = localStorage.getItem('mls_activity_log');
        return savedLogs ? JSON.parse(savedLogs) : [
            { time: new Date().toLocaleTimeString(), user: storedUser.username, action: 'System Login Authenticated', status: 'SUCCESS' }
        ];
    });

    // --- INIT & LISTENERS ---
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
            calculateSession();
        }, 1000);

        fetchAllData();

        // 👁️ WINDOW VISIBILITY TRACKER
        const handleVisibilityChange = () => {
            if (document.hidden) {
                logActivity('Application minimized or tab switched', 'AWAY');
            } else {
                logActivity('Returned to active session', 'ACTIVE');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Session Timer Logic
    const calculateSession = () => {
        const startTime = localStorage.getItem('mls_shift_start');
        if (startTime) {
            const diffInSeconds = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
            setSessionSeconds(diffInSeconds);
            setSessionTime({
                h: Math.floor(diffInSeconds / 3600),
                m: Math.floor((diffInSeconds % 3600) / 60)
            });
        }
    };

    const fetchAllData = async () => {
        try {
            const [casesRes, tasksRes, eventsRes, leavesRes] = await Promise.all([
                fetch('http://127.0.0.1:8080/api/cases'),
                fetch('http://127.0.0.1:8080/api/tasks'),
                fetch('http://127.0.0.1:8080/api/events'),
                fetch('http://127.0.0.1:8080/api/leaves')
            ]);

            setData({
                cases: casesRes.ok ? await casesRes.json() : [],
                tasks: tasksRes.ok ? await tasksRes.json() : [],
                events: eventsRes.ok ? await eventsRes.json() : [],
                leaves: leavesRes.ok ? await leavesRes.json() : []
            });
        } catch (error) { console.error("Dashboard Data Sync Failed"); }
    };

    // --- THE EFFICIENCY ALGORITHM ---
    const todayStr = new Date().toISOString().split('T')[0];
    const myTotalTasks = data.tasks.filter(t => t.assigned_to === storedUser.username);
    const myCompletedTasks = myTotalTasks.filter(t => t.status === 'DONE');
    const myPendingTasks = myTotalTasks.filter(t => t.status !== 'DONE');

    // 1. Satisfactory Rate (Task Completion & Quality)
    const satisfactionRate = myTotalTasks.length > 0
        ? Math.round((myCompletedTasks.length / myTotalTasks.length) * 100)
        : 100;

    // 2. Time-to-Work Ratio (Logged Hours vs Active Session Time)
    let totalLoggedHours = 0;
    myTotalTasks.forEach(task => {
        if (task.workLogs) {
            task.workLogs.forEach(log => {
                totalLoggedHours += parseFloat(log.hours || 0);
            });
        }
    });

    const loggedSeconds = totalLoggedHours * 3600;
    let timeToWorkRatio = 100;

    // Only calculate Time-to-Work ratio if the user has been logged in for at least 15 minutes to avoid skewed morning stats
    if (sessionSeconds > 900) {
        timeToWorkRatio = Math.round((loggedSeconds / sessionSeconds) * 100);
        if (timeToWorkRatio > 100) timeToWorkRatio = 100; // Cap at 100%
    }

    // 3. Final Combined Efficiency Score (60% Satisfaction / 40% Time Ratio)
    const efficiencyRate = Math.round((satisfactionRate * 0.6) + (timeToWorkRatio * 0.4));

    // SVG Ring Math (Circumference = 100)
    const ringDasharray = `${efficiencyRate}, 100`;


    // --- OTHER METRICS ---
    const activeCases = data.cases.filter(c => c.status !== 'DISPOSED').length;

    const todaysHearings = data.cases.filter(c => c.next_hearing === todayStr);
    const todaysEvents = data.events.filter(e => e.date === todayStr);
    const combinedSchedule = [...todaysHearings.map(c => ({ ...c, isCase: true })), ...todaysEvents];

    // --- AUDIT TRAIL HELPER ---
    const logActivity = (actionDesc, statusCode) => {
        const newLog = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            user: storedUser.username,
            action: actionDesc,
            status: statusCode
        };

        setActivityLog(prev => {
            const updatedLogs = [newLog, ...prev].slice(0, 50); // Keep last 50 logs
            localStorage.setItem('mls_activity_log', JSON.stringify(updatedLogs));
            return updatedLogs;
        });
    };

    const handleNavigate = (path, actionDesc) => {
        logActivity(actionDesc, 'NAVIGATE');
        setTimeout(() => navigate(path), 200);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors overflow-hidden">

            {/* --- HEADER --- */}
            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0 z-10 transition-colors">
                <div>
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Command Center</h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">System Overview</p>
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

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scroll">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* --- WELCOME BANNER --- */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#121212] p-6 md:p-8 rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm transition-colors">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {getGreeting()}, <span className="text-amber-500">{storedUser.first_name || storedUser.username}</span>.
                            </h1>
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mt-1">
                                Operational Systems Nominal. Awaiting Input.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => handleNavigate('/work', 'Opened Work Pipeline')} className="bg-amber-500 text-black px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform flex items-center gap-2">
                                <i className="fa fa-list-check"></i> Active Pipeline
                            </button>
                        </div>
                    </div>

                    {/* --- TOP FLIP CARDS --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                        <div className="flip-card">
                            <div className="flip-card-inner has-back">
                                <div className="flip-front bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 border-b-4 border-b-blue-500 rounded-2xl p-5 flex flex-col justify-between transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Hours Today</span>
                                        <i className="fa fa-hourglass-half text-stone-300 dark:text-stone-700"></i>
                                    </div>
                                    <div className="text-left mt-2">
                                        <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{sessionTime.h}h {sessionTime.m}m</h3>
                                        <span className="text-[10px] font-bold text-stone-400">Active Shift Duration</span>
                                    </div>
                                </div>
                                <div className="flip-back bg-blue-600 text-white rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg">
                                    <i className="fa fa-clock text-3xl mb-2"></i>
                                    <p className="text-[9px] font-black uppercase tracking-widest">Time tracked automatically based on login.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flip-card cursor-pointer" onClick={() => handleNavigate('/cases', 'Accessed Case Manager')}>
                            <div className="flip-card-inner has-back">
                                <div className="flip-front bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 border-b-4 border-b-amber-500 rounded-2xl p-5 flex flex-col justify-between transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Active Cases</span>
                                        <i className="fa fa-briefcase text-stone-300 dark:text-stone-700"></i>
                                    </div>
                                    <div className="text-left mt-2">
                                        <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none">{activeCases}</h3>
                                        <span className="text-[10px] font-bold text-stone-400">Firm-Wide Litigation</span>
                                    </div>
                                </div>
                                <div className="flip-back bg-amber-500 text-black rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg">
                                    <i className="fa fa-folder-open text-3xl mb-2"></i>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Open Registry</p>
                                </div>
                            </div>
                        </div>

                        <div className="flip-card cursor-pointer" onClick={() => handleNavigate('/work', 'Checked Completed Tasks')}>
                            <div className="flip-card-inner has-back">
                                <div className="flip-front bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 border-b-4 border-b-green-500 rounded-2xl p-5 flex flex-col justify-between transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500">My Works Done</span>
                                        <i className="fa fa-check-circle text-stone-300 dark:text-stone-700"></i>
                                    </div>
                                    <div className="text-left mt-2">
                                        <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none">{myCompletedTasks.length}</h3>
                                        <span className="text-[10px] font-bold text-stone-400">Successfully Filed</span>
                                    </div>
                                </div>
                                <div className="flip-back bg-green-600 text-white rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg">
                                    <i className="fa fa-check-double text-3xl mb-2"></i>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">View History</p>
                                </div>
                            </div>
                        </div>

                        <div className="flip-card cursor-pointer" onClick={() => handleNavigate('/work', 'Checked Pending Tasks')}>
                            <div className="flip-card-inner has-back">
                                <div className="flip-front bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 border-b-4 border-b-purple-500 rounded-2xl p-5 flex flex-col justify-between transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Pending Drafts</span>
                                        <i className="fa fa-file-signature text-stone-300 dark:text-stone-700"></i>
                                    </div>
                                    <div className="text-left mt-2">
                                        <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none">{myPendingTasks.length}</h3>
                                        <span className="text-[10px] font-bold text-stone-400">Require My Action</span>
                                    </div>
                                </div>
                                <div className="flip-back bg-purple-600 text-white rounded-2xl p-5 flex flex-col items-center justify-center shadow-lg">
                                    <i className="fa fa-list-check text-3xl mb-2"></i>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Open Pipeline</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- LOWER GRIDS --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                        {/* LEFT: Live System Activity (The Audit Trail) */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm flex flex-col overflow-hidden transition-colors">
                            <div className="px-6 py-4 border-b border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-black/20 flex justify-between items-center">
                                <span className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest"><i className="fa fa-satellite-dish mr-2 text-stone-400"></i> Live System Activity</span>
                                <span className="text-[10px] text-green-500 font-mono font-bold animate-pulse">● Monitoring</span>
                            </div>

                            <div className="overflow-x-auto flex-1 h-[340px] custom-scroll">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-stone-50 dark:bg-[#1a1a1a] text-stone-400 border-b border-stone-100 dark:border-white/5 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 font-black uppercase text-[9px] tracking-widest">Time</th>
                                            <th className="px-6 py-4 font-black uppercase text-[9px] tracking-widest hidden sm:table-cell">Personnel</th>
                                            <th className="px-6 py-4 font-black uppercase text-[9px] tracking-widest">Action / Trace</th>
                                            <th className="px-6 py-4 font-black uppercase text-[9px] tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                                        {activityLog.map((log, i) => {
                                            let icon = <i className="fa fa-shield-check text-green-500 mr-2"></i>;
                                            let badge = "bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-400 border-stone-200 dark:border-white/10";

                                            if (log.status === 'NAVIGATE') {
                                                icon = <i className="fa fa-arrow-right text-blue-500 mr-2"></i>;
                                            } else if (log.status === 'AWAY') {
                                                icon = <i className="fa fa-eye-slash text-red-500 mr-2"></i>;
                                                badge = "bg-red-500/10 text-red-500 border-red-500/20";
                                            } else if (log.status === 'ACTIVE') {
                                                icon = <i className="fa fa-eye text-green-500 mr-2"></i>;
                                                badge = "bg-green-500/10 text-green-500 border-green-500/20";
                                            }

                                            return (
                                                <tr key={i} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4 font-mono text-[10px] text-stone-400">{log.time}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white hidden sm:table-cell uppercase text-xs">@{log.user}</td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-stone-300">
                                                        {icon} {log.action}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`border px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${badge}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );

                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* RIGHT: Visual Efficiency Ring */}
                        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm p-6 flex flex-col justify-between items-center transition-colors">
                            <div className="w-full text-left">
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm mb-1">Algorithmic Efficiency</h3>
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Calculated Performance Metric</p>
                            </div>

                            <div className="relative w-40 h-40 mx-auto my-4">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-xl">
                                    <path className="text-stone-100 dark:text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                    <path className={`${efficiencyRate >= 80 ? 'text-green-500' : efficiencyRate >= 50 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                        strokeDasharray={ringDasharray}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">{efficiencyRate}%</span>
                                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Efficiency</span>
                                </div>
                            </div>

                            {/* THE ALGORITHM BREAKDOWN */}
                            <div className="w-full pt-4 border-t border-stone-100 dark:border-white/5 mt-auto">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Satisfactory Rate (60% WT)</span>
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white">{satisfactionRate}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Time-to-Work Ratio (40% WT)</span>
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white">{timeToWorkRatio}%</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;