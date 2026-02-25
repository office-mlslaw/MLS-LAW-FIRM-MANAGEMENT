import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2026 Indian Judicial Holiday Database
const HOLIDAYS = {
    "2026-01-01": "New Year's Day", "2026-01-13": "Bhogi", "2026-01-14": "Sankranti/Pongal",
    "2026-01-15": "Kanuma", "2026-01-26": "Republic Day", "2026-03-04": "Holi",
    "2026-03-20": "Ugadi", "2026-03-21": "Ramzan", "2026-03-26": "Srirama Navami",
    "2026-04-03": "Good Friday", "2026-04-14": "Ambedkar Jayanti", "2026-05-27": "Bakrid",
    "2026-06-26": "Muharrum", "2026-08-15": "Independence Day", "2026-08-26": "Eid Miladun Nabi",
    "2026-08-28": "Varalakshmi Vratam", "2026-09-04": "Sri Krishna Astami", "2026-09-14": "Vinayaka Chavithi",
    "2026-10-02": "Gandhi Jayanti", "2026-10-19": "Durgastami", "2026-10-20": "Maharnavami",
    "2026-10-21": "Dussehra", "2026-11-07": "Naraka Chaturdasi", "2026-12-25": "Christmas",
};

const VACATIONS = [
    { start: '2026-01-12', end: '2026-01-16', name: 'Sankranti Vacation' },
    { start: '2026-05-11', end: '2026-06-12', name: 'Summer Vacation' },
    { start: '2026-10-22', end: '2026-10-23', name: 'Dussehra Vacation' }
];

const Calendar = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');

    const [time, setTime] = useState(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [cases, setCases] = useState([]);
    const [manualEvents, setManualEvents] = useState([]);
    const [personnel, setPersonnel] = useState([]);

    const [selectedDay, setSelectedDay] = useState(null);
    const [isDayViewOpen, setIsDayViewOpen] = useState(false);
    const [isAddEventOpen, setIsAddEventOpen] = useState(false);

    const [isAdjournOpen, setIsAdjournOpen] = useState(false);
    const [adjournForm, setAdjournForm] = useState({ id: '', next_hearing: '', court: '', item_number: '' });

    const defaultEvent = { title: '', type: 'HEARING', time: '10:30', lawyer: '', court_hall: '', item_number: '', client_name: '' };
    const [eventForm, setEventForm] = useState(defaultEvent);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        fetchData();
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        try {
            const [caseRes, eventRes, staffRes] = await Promise.all([
                fetch('http://127.0.0.1:8080/api/cases'),
                fetch('http://127.0.0.1:8080/api/events'),
                fetch('http://127.0.0.1:8080/api/personnel/roll')
            ]);
            if (caseRes.ok) setCases(await caseRes.json());
            if (eventRes.ok) setManualEvents(await eventRes.json());
            if (staffRes.ok) {
                const data = await staffRes.json();
                setPersonnel([...(data.partners || []), ...(data.associates || [])]);
            }
        } catch (error) { console.error("Database connection failed."); }
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
    const changeMonth = (offset) => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));
    const jumpToToday = () => setCurrentDate(new Date());

    const isHoliday = (dateStr) => {
        if (HOLIDAYS[dateStr]) return HOLIDAYS[dateStr];
        for (let v of VACATIONS) { if (dateStr >= v.start && dateStr <= v.end) return v.name; }
        const dayOfWeek = new Date(dateStr).getDay();
        if (dayOfWeek === 0) return "Sunday";
        if (dayOfWeek === 6) return "Saturday";
        return false;
    };

    // --- LAST MONDAY CALCULATION ENGINE ---
    const isLastMondayOfMonth = (dateStr) => {
        if (!dateStr) return false;
        const [year, month, day] = dateStr.split('-');
        const tempDate = new Date(year, month - 1, day);

        // Is it a Monday?
        if (tempDate.getDay() !== 1) return false;

        // If we add 7 days, does the month change? If yes, it is the last Monday.
        const currentMonth = tempDate.getMonth();
        tempDate.setDate(tempDate.getDate() + 7);
        return tempDate.getMonth() !== currentMonth;
    };

    const getAllEventsForDay = (dateStr) => {
        const dayEvents = [];
        cases.forEach(c => {
            if (c.next_hearing === dateStr) {
                dayEvents.push({
                    id: `case_${c.id}`, title: `Hearing: ${c.case_id}`, type: 'HEARING',
                    lawyer: c.lawyer, court: c.court, item_number: c.item_number || 'TBD', case: c
                });
            }
        });
        manualEvents.forEach(e => { if (e.date === dateStr) dayEvents.push({ ...e, court: e.court_hall }); });

        return dayEvents.sort((a, b) => {
            const numA = parseInt(a.item_number) || 999;
            const numB = parseInt(b.item_number) || 999;
            return numA - numB;
        });
    };

    const getDoubleBookings = (dayEvents) => {
        const lawyerCourts = {};
        dayEvents.forEach(ev => {
            if (ev.lawyer && ev.court && ev.type === 'HEARING') {
                if (!lawyerCourts[ev.lawyer]) lawyerCourts[ev.lawyer] = new Set();
                lawyerCourts[ev.lawyer].add(ev.court);
            }
        });
        const warnings = [];
        for (const [lawyer, courts] of Object.entries(lawyerCourts)) {
            if (courts.size > 1) warnings.push(`${lawyer} is scheduled in multiple benches: ${Array.from(courts).join(' & ')}`);
        }
        return warnings;
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://127.0.0.1:8080/api/events/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...eventForm, date: selectedDay, created_by: storedUser.username })
            });
            setIsAddEventOpen(false); setEventForm(defaultEvent); fetchData();
        } catch (error) { alert("Failed to save event."); }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Purge this event?")) return;
        try {
            await fetch(`http://127.0.0.1:8080/api/events/delete/${eventId}`, { method: 'DELETE' });
            fetchData(); setIsDayViewOpen(false);
        } catch (error) { alert("Failed to delete."); }
    };

    const handleAdjournSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetch(`http://127.0.0.1:8080/api/cases/edit/${adjournForm.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    next_hearing: adjournForm.next_hearing,
                    court: adjournForm.court,
                    item_number: adjournForm.item_number,
                    status: 'HEARING'
                })
            });
            setIsAdjournOpen(false);
            setIsDayViewOpen(false);
            fetchData();
        } catch (error) { alert("Failed to adjourn case."); }
    };

    const generateCauseListPDF = () => {
        window.print();
    };

    const renderCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const todayObj = new Date();
        const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`pad-${i}`} className="border-b border-r border-stone-200 dark:border-white/5 bg-stone-50/50 dark:bg-black/20 opacity-30 min-h-[140px]"></div>);

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const holidayName = isHoliday(dateStr);
            const isToday = dateStr === todayStr;
            const dayEvents = getAllEventsForDay(dateStr);
            const isAuditDay = isLastMondayOfMonth(dateStr); // <-- AUDIT CHECK HERE

            days.push(
                <div key={d} onClick={() => { setSelectedDay(dateStr); setIsDayViewOpen(true); }} className={`min-h-[140px] border-b border-r border-stone-200 dark:border-white/5 relative p-2 cursor-pointer transition-colors group ${isToday ? 'bg-amber-50 dark:bg-amber-500/5' : holidayName ? 'bg-red-50/40 dark:bg-red-950/20' : 'bg-white dark:bg-[#121212] hover:bg-stone-50 dark:hover:bg-white/5'}`}>
                    <div className="flex justify-between items-start">
                        <span className={`text-xs font-black ${isToday ? 'text-amber-600 dark:text-amber-500' : holidayName ? 'text-red-500' : 'text-slate-500 dark:text-stone-400'}`}>{d}</span>
                        {holidayName && <span className="text-[8px] font-black uppercase text-red-500 tracking-widest text-right leading-tight max-w-[70%]">{holidayName.replace('Holiday', '')}</span>}
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5 z-10 relative">

                        {/* MONTHLY AUDIT AMBER PILL */}
                        {isAuditDay && (
                            <div className="w-full bg-amber-500/20 border border-amber-500/50 rounded-md px-1.5 py-1 mb-1 flex items-center gap-1.5 shadow-sm">
                                <i className="fa fa-lock text-[8px] text-amber-600 dark:text-amber-500"></i>
                                <span className="text-[8px] font-black uppercase text-amber-700 dark:text-amber-500 tracking-widest truncate">Monthly Audit</span>
                            </div>
                        )}

                        {dayEvents.slice(0, 4).map((ev, i) => {
                            let chipStyle = ev.type === 'HEARING' ? 'bg-red-500 text-white border border-red-600 shadow-sm' : ev.type === 'OFFICE_OUT' ? 'bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white border border-stone-200 dark:border-stone-700 shadow-sm' : 'bg-blue-500 text-white border border-blue-600 shadow-sm';
                            return (
                                <div key={i} className={`text-[9px] font-bold px-2 py-1 rounded-md truncate transition-transform hover:scale-[1.02] flex justify-between ${chipStyle}`}>
                                    <span>{ev.title}</span>
                                    {ev.item_number && <span className="opacity-70 ml-1">#{ev.item_number}</span>}
                                </div>
                            );
                        })}
                        {dayEvents.length > 4 && <div className="text-[8px] font-black text-stone-400 mt-0.5 text-center">+{dayEvents.length - 4} more</div>}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors relative">

            {/* --- HIDDEN PRINTABLE CAUSE LIST --- */}
            {selectedDay && (
                <div className="print-only w-full bg-white text-black p-10 font-serif">
                    <div className="text-center border-b-2 border-black pb-4 mb-6">
                        <h1 className="text-2xl font-black uppercase tracking-widest">Firm Daily Cause List</h1>
                        <h2 className="text-lg font-bold mt-1">{new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-black text-sm uppercase">
                                <th className="py-2 pr-4 w-16">Item No.</th>
                                <th className="py-2 pr-4 w-32">Bench / Court</th>
                                <th className="py-2 pr-4 w-40">Case Number</th>
                                <th className="py-2 pr-4">Cause Title</th>
                                <th className="py-2 w-32">Lead Counsel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-300">
                            {getAllEventsForDay(selectedDay).map((ev, i) => (
                                <tr key={i} className="text-sm">
                                    <td className="py-3 pr-4 font-bold">{ev.item_number || '—'}</td>
                                    <td className="py-3 pr-4">{ev.court || '—'}</td>
                                    <td className="py-3 pr-4 font-bold">{ev.case ? ev.case.case_id : ev.title}</td>
                                    <td className="py-3 pr-4 text-xs">
                                        {ev.case ? (
                                            <>
                                                <span className="font-bold">{ev.case.petitioner || ev.case.client_name}</span><br />
                                                <span className="italic text-stone-600">vs</span><br />
                                                <span className="font-bold">{ev.case.respondent || ev.case.opponent || 'State'}</span>
                                            </>
                                        ) : (
                                            ev.client_name || ev.title
                                        )}
                                    </td>
                                    <td className="py-3 font-bold uppercase">{ev.lawyer || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- MAIN APP UI (HIDDEN ON PRINT) --- */}
            <div className="no-print flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0 z-10">
                    <div>
                        <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Court Docket</h2>
                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Global Judiciary Schedule</p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-[9px] font-bold text-green-600 flex items-center justify-end gap-1.5 uppercase tracking-widest">
                            Database Sync <i className="fa fa-circle text-[5px] animate-pulse"></i>
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-widest mt-0.5">
                            {time.toLocaleTimeString('en-US', { hour12: false })}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col max-w-[1600px] mx-auto w-full">
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-xl p-1 shadow-sm">
                                <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-stone-50 dark:hover:bg-black rounded-lg text-stone-500 transition-colors"><i className="fa fa-chevron-left text-xs"></i></button>
                                <span className="px-6 py-2 text-sm font-black uppercase text-slate-900 dark:text-white min-w-[180px] text-center tracking-widest">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={() => changeMonth(1)} className="p-3 hover:bg-stone-50 dark:hover:bg-black rounded-lg text-stone-500 transition-colors"><i className="fa fa-chevron-right text-xs"></i></button>
                            </div>
                            <button onClick={jumpToToday} className="bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-300 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-amber-500 dark:hover:text-black transition-all">Today</button>
                        </div>

                        <div className="hidden lg:flex items-center gap-5 bg-white dark:bg-[#121212] px-6 py-3 rounded-xl border border-stone-200 dark:border-white/5 shadow-sm">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div><span className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Cases / Hearings</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white dark:bg-[#1e1e1e] border border-stone-300 dark:border-stone-600 rounded-sm"></div><span className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Meetings / Events</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div><span className="text-[9px] font-black uppercase text-stone-500 tracking-widest">Other Tasks</span></div>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 shadow-xl flex flex-col overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-black/40">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                <div key={day} className={`py-4 text-center text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-500' : 'text-stone-400'}`}>{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 flex-1 overflow-y-auto custom-scroll auto-rows-fr">
                            {renderCalendarGrid()}
                        </div>
                    </div>
                </div>

                {/* --- DAY VIEW DOSSIER (SLIDE-OUT) --- */}
                <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isDayViewOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setIsDayViewOpen(false)}></div>
                <div className={`fixed right-0 top-0 h-full w-full md:w-[600px] bg-stone-50 dark:bg-[#0f0f10] border-l border-stone-200 dark:border-white/10 shadow-2xl z-[101] flex flex-col transform transition-transform duration-300 ${isDayViewOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                    <div className="shrink-0 border-b border-stone-200 dark:border-white/5 bg-white dark:bg-[#121212] p-8 flex justify-between items-start">
                        <div>
                            <h3 className="font-black text-4xl text-slate-900 dark:text-white tracking-tighter mb-1">
                                {selectedDay ? new Date(selectedDay).getDate() : '--'}
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                                {selectedDay ? new Date(selectedDay).toLocaleString('default', { month: 'long', year: 'numeric', weekday: 'long' }) : '--'}
                            </p>

                            {selectedDay && isHoliday(selectedDay) && <span className="mt-3 inline-block bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest">Holiday: {isHoliday(selectedDay).replace('Holiday', '')}</span>}
                            {selectedDay && isLastMondayOfMonth(selectedDay) && <span className="mt-3 ml-2 inline-block bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest"><i className="fa fa-lock mr-1"></i> Monthly Audit Day</span>}

                        </div>
                        <div className="flex gap-3">
                            <button onClick={generateCauseListPDF} className="bg-stone-100 dark:bg-white/5 hover:bg-amber-500 hover:text-black text-slate-900 dark:text-white px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                                <i className="fa fa-print"></i> Print Cause List
                            </button>
                            <button onClick={() => setIsDayViewOpen(false)} className="w-10 h-10 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors"><i className="fa fa-times"></i></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scroll">

                        {selectedDay && getDoubleBookings(getAllEventsForDay(selectedDay)).map((warning, i) => (
                            <div key={i} className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
                                <i className="fa fa-triangle-exclamation text-amber-500 mt-0.5"></i>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Double Booking Alert</h4>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{warning}</p>
                                </div>
                            </div>
                        ))}

                        <div className="space-y-4">
                            {selectedDay && getAllEventsForDay(selectedDay).map(ev => (
                                <div key={ev.id} className={`p-5 rounded-2xl border-l-4 bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 shadow-sm ${ev.type === 'HEARING' ? 'border-l-red-500' : ev.type === 'OFFICE_OUT' ? 'border-l-stone-500 dark:border-l-white' : 'border-l-blue-500'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-2 items-center">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${ev.type === 'HEARING' ? 'bg-red-500/10 text-red-500' : ev.type === 'OFFICE_OUT' ? 'bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300' : 'bg-blue-500/10 text-blue-500'}`}>{ev.type === 'OFFICE_OUT' ? 'MEETING' : ev.type}</span>
                                            {ev.item_number && <span className="text-[8px] font-black uppercase tracking-widest bg-stone-100 dark:bg-white/5 px-2 py-1 rounded text-stone-500">Item: {ev.item_number}</span>}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            {ev.id.toString().startsWith('case_') ? (
                                                <button onClick={() => { setAdjournForm({ id: ev.case.id, next_hearing: '', court: ev.court, item_number: ev.item_number }); setIsAdjournOpen(true); }} className="text-[9px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-600 transition-colors">Adjourn <i className="fa fa-arrow-right ml-1"></i></button>
                                            ) : (
                                                <button onClick={() => handleDeleteEvent(ev.id)} className="text-stone-400 hover:text-red-500 transition-colors"><i className="fa fa-trash text-sm"></i></button>
                                            )}
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-2">{ev.title}</h4>

                                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-stone-100 dark:border-white/5">
                                        <div>
                                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Bench / Court</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{ev.court || 'Not Assigned'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Lead Counsel</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{ev.lawyer || 'Unassigned'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {selectedDay && getAllEventsForDay(selectedDay).length === 0 && (
                                <div className="text-center py-16 opacity-40">
                                    <i className="fa fa-calendar-check text-5xl mb-4 text-stone-400"></i>
                                    <p className="text-xs font-black uppercase tracking-widest text-stone-500">Clear Schedule</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 border-t border-stone-200 dark:border-white/5 bg-white dark:bg-[#121212] shrink-0">
                        <button onClick={() => setIsAddEventOpen(true)} className="w-full bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-lg">
                            + Add Manual Entry
                        </button>
                    </div>
                </div>

                {/* --- ADJOURNMENT QUICK-ACTION MODAL --- */}
                {isAdjournOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsAdjournOpen(false)}>
                        <div className="bg-white dark:bg-[#0f0f10] w-full max-w-sm rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-8 py-6 border-b border-stone-200 dark:border-white/5 flex justify-between items-center bg-stone-50 dark:bg-black/20">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Update Hearing</h3>
                                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1">Adjournment / Item Assignment</p>
                                </div>
                                <button onClick={() => setIsAdjournOpen(false)} className="text-stone-400 hover:text-red-500"><i className="fa fa-times text-lg"></i></button>
                            </div>
                            <form className="p-8 space-y-5" onSubmit={handleAdjournSubmit}>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">New Hearing Date</label>
                                    <input type="date" required value={adjournForm.next_hearing} onChange={e => setAdjournForm({ ...adjournForm, next_hearing: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Item No.</label>
                                        <input type="number" placeholder="e.g. 42" value={adjournForm.item_number} onChange={e => setAdjournForm({ ...adjournForm, item_number: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Court / Bench</label>
                                        <input type="text" placeholder="Court Hall 1" value={adjournForm.court} onChange={e => setAdjournForm({ ...adjournForm, court: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-lg">Save Changes</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- ADD EVENT MODAL --- */}
                {isAddEventOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsAddEventOpen(false)}>
                        <div className="bg-white dark:bg-[#0f0f10] w-full max-w-md rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-8 py-6 border-b border-stone-200 dark:border-white/5 flex justify-between items-center bg-stone-50 dark:bg-black/20">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Add Manual Entry</h3>
                                <button onClick={() => setIsAddEventOpen(false)} className="text-stone-400 hover:text-red-500"><i className="fa fa-times text-lg"></i></button>
                            </div>
                            <form className="p-8 space-y-5" onSubmit={handleSaveEvent}>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Event Title / Description</label>
                                    <input type="text" required placeholder="e.g. Meeting with Client X..." value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Event Type</label>
                                        <select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500">
                                            <option value="OFFICE_OUT">Meeting / Consultation</option>
                                            <option value="HEARING">Hearing / Tribunal</option>
                                            <option value="OTHER">Other Task</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Lead Counsel</label>
                                        <select value={eventForm.lawyer} onChange={e => setEventForm({ ...eventForm, lawyer: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500">
                                            <option value="">Unassigned</option>
                                            {personnel.map(p => <option key={p.user.id} value={`${p.user.first_name} ${p.user.last_name}`}>{p.user.first_name} {p.user.last_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Item No. (If Hearing)</label>
                                        <input type="number" placeholder="Optional" value={eventForm.item_number} onChange={e => setEventForm({ ...eventForm, item_number: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Location / Court</label>
                                        <input type="text" placeholder="Location" value={eventForm.court_hall} onChange={e => setEventForm({ ...eventForm, court_hall: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-lg">Save to Docket</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar;