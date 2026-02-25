import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ onOpenSettings, onTriggerLogout }) => {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sessionSeconds, setSessionSeconds] = useState(0);

    // --- SMART STORAGE FETCHER ---
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');

    // 1. THE REAL NAME FIX
    const displayName = storedUser.first_name ? `${storedUser.first_name} ${storedUser.last_name}` : (storedUser.username || 'Agent');
    const initials = displayName.charAt(0).toUpperCase();

    // 2. THE PORTAL FIX (Check if Master Admin)
    const isAdminSession = storedUser.sessionRole === 'ADMIN';

    // 3. THE SHIFT CLOCK FIX (Survives Logouts)
    useEffect(() => {
        let startTime = localStorage.getItem('mls_shift_start');
        if (!startTime) {
            startTime = Date.now().toString();
            localStorage.setItem('mls_shift_start', startTime);
        }

        const updateTimer = () => {
            const diffInSeconds = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
            setSessionSeconds(diffInSeconds);
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // FIXED: Strict routing check prevents /grievance-audit from triggering /grievance
    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="no-print h-full flex flex-col">
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="sidebar-toggle-btn hidden md:flex" title="Toggle Sidebar">
                    <i className="fa fa-chevron-left"></i>
                </button>

                {/* HEADER / LOGO */}
                <div className="h-20 flex items-center justify-center md:justify-start px-0 md:px-4 border-b border-stone-100 dark:border-stone-800 shrink-0 sidebar-header transition-colors">
                    <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="custom-logo-wrapper shrink-0">
                            <img src="/Logo.png" alt="MLS Logo" className="custom-logo" />
                        </div>
                        <div className="hidden md:flex flex-col overflow-hidden logo-text-container">
                            <div className="flex items-end gap-1 leading-none">
                                <span className="font-black text-xl tracking-tighter theme-text-main">MLS</span>
                                <span className="font-bold text-xl tracking-tighter theme-text-sub">R.LEX</span>
                            </div>
                            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-1">Legal OS</span>
                        </div>
                    </Link>
                </div>

                {/* NAVIGATION LINKS */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 md:px-3 space-y-1 custom-scroll">

                    {/* SECTION: MAIN */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Main</p>
                        <Link to="/dashboard" title={isCollapsed ? "Command Center" : ""} className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-home text-base"></i></div>
                            <span className="nav-text text-xs">Command Center</span>
                        </Link>
                        <Link to="/chat" title={isCollapsed ? "Chat Hub" : ""} className={`nav-item relative ${isActive('/chat') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center">
                                <i className="fa fa-comments text-base"></i>
                                <span className="absolute top-0 right-0 md:top-2 md:left-7 w-2 h-2 bg-amber-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
                            </div>
                            <span className="nav-text text-xs">Chat Hub</span>
                        </Link>
                    </div>

                    {/* SECTION: PORTALS */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Portals</p>
                        <Link to="/cases" title={isCollapsed ? "Case Manager" : ""} className={`nav-item ${isActive('/cases') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-gavel text-base"></i></div>
                            <span className="nav-text text-xs">Case Manager</span>
                        </Link>
                        <Link to="/clients" title={isCollapsed ? "Client Registry" : ""} className={`nav-item ${isActive('/clients') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-users text-base"></i></div>
                            <span className="nav-text text-xs">Client Registry</span>
                        </Link>
                        <Link to="/calendar" title={isCollapsed ? "Court Docket" : ""} className={`nav-item ${isActive('/calendar') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa-solid fa-calendar-days text-base"></i></div>
                            <span className="nav-text text-xs">Court Docket</span>
                        </Link>
                        <Link to="/admin-vault" title={isCollapsed ? "Secure Vault" : ""} className={`nav-item ${isActive('/admin-vault') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa-solid fa-folder-closed text-base"></i></div>
                            <span className="nav-text text-xs">Secure Vault</span>
                        </Link>
                    </div>

                    {/* SECTION: TASK MANAGEMENT */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Task Management</p>
                        <Link to="/work" title={isCollapsed ? "Work Pipeline" : ""} className={`nav-item ${isActive('/work') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-list-check text-base"></i></div>
                            <span className="nav-text text-xs">Work Pipeline</span>
                        </Link>
                        <Link to="/request-work" title={isCollapsed ? "Request Work" : ""} className={`nav-item ${isActive('/request-work') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-briefcase text-base"></i></div>
                            <span className="nav-text text-xs">Request Work</span>
                        </Link>
                    </div>

                    {/* SECTION: LEGAL DRAFTING */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Legal Drafting</p>
                        <Link to="/drafting" title={isCollapsed ? "Drafting Bot" : ""} className={`nav-item ${isActive('/drafting') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-pen-nib text-base"></i></div>
                            <span className="nav-text text-xs">Drafting Bot</span>
                        </Link>
                        <Link to="/misc-drafts" title={isCollapsed ? "Misc. Drafts" : ""} className={`nav-item ${isActive('/misc-drafts') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-file-lines text-base"></i></div>
                            <span className="nav-text text-xs">Misc. Drafts</span>
                        </Link>
                        <Link to="/tools/word-studio" title={isCollapsed ? "LexEditor (Word)" : ""} className={`nav-item ${isActive('/tools/word-studio') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-file-word text-base"></i></div>
                            <span className="nav-text text-xs">LexEditor (Word)</span>
                        </Link>
                    </div>

                    {/* SECTION: TRANSLATION */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Translation</p>
                        <Link to="/translation" title={isCollapsed ? "Translation Bot" : ""} className={`nav-item ${isActive('/translation') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-language text-base"></i></div>
                            <span className="nav-text text-xs">Translation Bot</span>
                        </Link>
                    </div>

                    {/* SECTION: UTILITIES */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Utilities</p>
                        {/* Strict equality for /tools so word-studio doesn't trigger it */}
                        <Link to="/tools" title={isCollapsed ? "Utility Belt" : ""} className={`nav-item ${location.pathname === '/tools' ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-screwdriver-wrench text-base"></i></div>
                            <span className="nav-text text-xs">Utility Belt</span>
                        </Link>
                    </div>

                    {/* SECTION: PERSONNEL */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Personnel</p>
                        <Link to="/personnel" title={isCollapsed ? "Personnel Roll" : ""} className={`nav-item ${isActive('/personnel') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa-solid fa-users-viewfinder text-base"></i></div>
                            <span className="nav-text text-xs">Personnel Roll</span>
                        </Link>
                        <Link to="/leave" title={isCollapsed ? "Leave Portal" : ""} className={`nav-item ${isActive('/leave') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa-solid fa-calendar-minus text-base"></i></div>
                            <span className="nav-text text-xs">Leave Portal</span>
                        </Link>
                    </div>

                    {/* SECTION: GRIEVANCE */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Grievance</p>
                        <Link to="/grievance" title={isCollapsed ? "Anonymous Report" : ""} className={`nav-item ${isActive('/grievance') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-shield-halved text-base"></i></div>
                            <span className="nav-text text-xs">Anonymous Report</span>
                        </Link>
                        <Link to="/grievance-audit" title={isCollapsed ? "Monthly Audit" : ""} className={`nav-item ${isActive('/grievance-audit') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-clipboard-check text-base"></i></div>
                            <span className="nav-text text-xs">Monthly Audit</span>
                        </Link>

                        {/* ONLY SHOWS IF LOGGED IN AS ADMIN */}
                        {isAdminSession && (
                            <Link to="/internal-affairs-vault" title={isCollapsed ? "Internal Affairs" : ""} className={`nav-item ${isActive('/internal-affairs-vault') ? 'active' : ''} text-red-500 hover:text-red-400`}>
                                <div className="w-5 flex justify-center"><i className="fa fa-user-secret text-base"></i></div>
                                <span className="nav-text text-xs font-bold">Internal Affairs</span>
                            </Link>
                        )}
                    </div>

                    {/* SECTION: MISC */}
                    <div className="mb-5 section-block">
                        <p className="section-title text-[9px] uppercase font-bold px-3 mb-2 tracking-widest">Misc.</p>
                        <Link to="/arcade" title={isCollapsed ? "Arcade" : ""} className={`nav-item ${isActive('/arcade') ? 'active' : ''}`}>
                            <div className="w-5 flex justify-center"><i className="fa fa-gamepad text-base"></i></div>
                            <span className="nav-text text-xs">Arcade</span>
                        </Link>
                    </div>

                </nav>

                {/* FOOTER: PROFILE & CONTROLS */}
                <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-black/40 shrink-0 sidebar-footer transition-colors">
                    <div className="flex items-center gap-3 mb-3 user-profile justify-center md:justify-start">
                        <div className="w-8 h-8 rounded-full bg-stone-800 border border-amber-500 overflow-hidden flex items-center justify-center shrink-0 shadow-lg" title={isCollapsed ? displayName : ""}>
                            <span className="font-bold text-xs text-amber-500">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0 nav-text hidden md:block">
                            <h4 className="text-[11px] font-bold theme-text-main truncate uppercase">{displayName}</h4>
                            <p className="text-[8px] text-stone-500 font-mono">@{isAdminSession ? 'ADMIN_MODE' : 'USER_MODE'}</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-1 footer-controls">
                        <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-md flex-1 justify-center border shadow-sm session-box transition-colors" title={isCollapsed ? "Session Time" : ""}>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[9px] font-black tabular-nums tracking-widest theme-text-main">{formatTime(sessionSeconds)}</span>
                        </div>

                        <button onClick={onOpenSettings} title="Settings" className="w-8 h-8 shrink-0 rounded-md border text-stone-500 hover:text-blue-500 transition-all flex items-center justify-center shadow-sm session-box">
                            <i className="fa fa-gear text-xs"></i>
                        </button>

                        <button onClick={onTriggerLogout} title="Logout" className="w-8 h-8 shrink-0 rounded-md border text-stone-500 hover:text-red-500 transition-all flex items-center justify-center shadow-sm session-box">
                            <i className="fa fa-power-off text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;