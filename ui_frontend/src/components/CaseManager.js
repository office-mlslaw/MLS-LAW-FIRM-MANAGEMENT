import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CaseManager.css';

const CASE_CATEGORIES = [
    { value: "APPL", label: "APPL - APPLICATION IN CIVIL SUIT" },
    { value: "ARBAPPL", label: "ARBAPPL - ARBITRATION APPLICATION" },
    { value: "AS", label: "AS - APPEAL SUIT" },
    { value: "CA", label: "CA - CONTEMPT APPEAL" },
    { value: "CAPPEAL", label: "CAPPEAL - COMPANY APPEAL" },
    { value: "CC", label: "CC - CONTEMPT CASE" },
    { value: "CCCA", label: "CCCA - CITY CIVIL COURT APPEAL" },
    { value: "CMA", label: "CMA - CIVIL MISCELLANEOUS APPEAL" },
    { value: "COMCA", label: "COMCA - COMMERCIAL COURT APPEAL" },
    { value: "COMOP", label: "COMOP - COMMERCIAL ORIGINAL PETITION" },
    { value: "COMPA", label: "COMPA - COMPANY APPLICATION" },
    { value: "COMS", label: "COMS - COMMERCIAL SUIT" },
    { value: "CP", label: "CP - COMPANY PETITION" },
    { value: "CRLA", label: "CRLA - CRIMINAL APPEAL" },
    { value: "CRLP", label: "CRLP - CRIMINAL PETITION" },
    { value: "CRLRC", label: "CRLRC - CRIMINAL REVISION CASE" },
    { value: "CRP", label: "CRP - CIVIL REVISION PETITION" },
    { value: "CS", label: "CS - CIVIL SUIT" },
    { value: "EP", label: "EP - ELECTION PETITION" },
    { value: "EXEP", label: "EXEP - EXECUTION PETITION" },
    { value: "FCA", label: "FCA - FAMILY COURT APPEAL" },
    { value: "MACMA", label: "MACMA - MOTOR ACCIDENT CIVIL MISCELLANEOUS APPEAL" },
    { value: "OP", label: "OP - ORIGINAL PETITION" },
    { value: "OSA", label: "OSA - ORIGINAL SIDE APPEAL" },
    { value: "PIL", label: "PIL - PUBLIC INTEREST LITIGATION" },
    { value: "SA", label: "SA - SECOND APPEAL" },
    { value: "WA", label: "WA - WRIT APPEAL" },
    { value: "WP", label: "WP - WRIT PETITION" },
    { value: "X-OBJ", label: "X-OBJ - Cross Objection" }
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from(new Array(80), (val, index) => currentYear + 1 - index);

const CaseManager = () => {
    const navigate = useNavigate();

    // --- USER ROLE & STATE ---
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');
    const isAdmin = storedUser.sessionRole === 'ADMIN';

    const [time, setTime] = useState(new Date());
    const [filters, setFilters] = useState({ search: '', type: 'ALL', status: 'ALL', alpha: 'ALL' });
    const [menuPos, setMenuPos] = useState({ visible: false, x: 0, y: 0, caseObj: null });

    // UI Modals & Drawers
    const [isFilingOpen, setIsFilingOpen] = useState(false);
    const [isDossierOpen, setIsDossierOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);
    const [editingCaseId, setEditingCaseId] = useState(null);
    const [dossierTab, setDossierTab] = useState('OVERVIEW');

    // Sub-Item Forms State
    const [showDocketForm, setShowDocketForm] = useState(false);
    const [docketText, setDocketText] = useState('');

    const [showIaForm, setShowIaForm] = useState(false);
    const [iaData, setIaData] = useState({ num: '', status: 'PENDING' });

    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskData, setTaskData] = useState({ desc: '', assignee: '', due: '' });

    const [showLedgerForm, setShowLedgerForm] = useState(false);
    const [ledgerData, setLedgerData] = useState({ date: '', desc: '', amount: '' });

    const defaultFormState = {
        caseCategory: 'WP', caseNumber: '', caseYear: currentYear.toString(),
        type: 'CIVIL', status: 'RESEARCH', client_name: '', client_id: '',
        lawyer: storedUser.username || 'Admin', court: '', opponent: '', priority: 'NORMAL',
        role: 'PETITIONER', petitioner: '', respondent: '', next_hearing: '', item_number: ''
    };
    const [formData, setFormData] = useState(defaultFormState);

    const [cases, setCases] = useState([]);
    const [clients, setClients] = useState([]);
    const [personnel, setPersonnel] = useState({ partners: [], associates: [], interns: [], staff: [] });

    // --- INITIALIZATION ---
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        fetchCases();
        fetchPersonnel();
        fetchClients();
        return () => clearInterval(timer);
    }, []);

    const fetchCases = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8080/api/cases');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setCases(data);
            }
        } catch (error) { setCases([]); }
    };

    const fetchClients = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8080/api/clients');
            if (res.ok) setClients(await res.json());
        } catch (error) { console.error("Failed to fetch clients"); }
    };

    const fetchPersonnel = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8080/api/personnel/roll');
            if (res.ok) setPersonnel(await res.json());
        } catch (error) { console.error("Failed to fetch personnel"); }
    };

    // --- FILTERING ---
    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const resetFilters = () => setFilters({ search: '', type: 'ALL', status: 'ALL', alpha: 'ALL' });

    const filteredCases = cases.filter(c => {
        if (!c) return false;
        const safeCaseId = (c.case_id || '').toLowerCase();
        const safeClientName = (c.client_name || '').toLowerCase();
        const safeLawyer = (c.lawyer || '').toLowerCase();
        const searchLower = (filters.search || '').toLowerCase();

        const matchSearch = safeCaseId.includes(searchLower) || safeClientName.includes(searchLower) || safeLawyer.includes(searchLower);
        const matchType = filters.type === 'ALL' || c.type === filters.type;
        const matchStatus = filters.status === 'ALL' || c.status === filters.status;
        const matchAlpha = filters.alpha === 'ALL' || (c.client_name || '').toUpperCase().startsWith(filters.alpha);
        return matchSearch && matchType && matchStatus && matchAlpha;
    });

    // --- DB ACTIONS (MAIN CASE) ---
    const handleFilingSubmit = async (e) => {
        e.preventDefault();
        const formalCaseId = `${formData.caseCategory} ${formData.caseNumber}/${formData.caseYear}`;
        const submissionData = { ...formData, case_id: formalCaseId, next_hearing: formData.status === 'DISPOSED' ? '' : formData.next_hearing };
        const url = editingCaseId ? `http://127.0.0.1:8080/api/cases/edit/${editingCaseId}` : 'http://127.0.0.1:8080/api/cases/add';

        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionData) });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ SUCCESS: ${data.message || 'Record Saved'}`);
                setIsFilingOpen(false);
                fetchCases();
                setFormData(defaultFormState);
                setEditingCaseId(null);
            } else alert(`❌ ERROR: ${data.message}`);
        } catch (error) { alert("❌ NETWORK ERROR."); }
    };

    const requestDeletion = async (id) => {
        await fetch(`http://127.0.0.1:8080/api/cases/request-delete/${id}`, { method: 'POST' });
        alert("🚨 Deletion Request sent to Admin.");
        fetchCases();
        setMenuPos({ visible: false });
    };

    const resolveDeletion = async (id, action) => {
        await fetch(`http://127.0.0.1:8080/api/cases/resolve-delete/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
        fetchCases();
        setMenuPos({ visible: false });
    };

    // --- DOSSIER SUB-ITEM ACTIONS (DOCKET, IA, TASK, LEDGER) ---
    const saveSubItem = async (arrayName, itemData) => {
        const targetCase = { ...selectedCase };
        const updatedArray = targetCase[arrayName] ? [...targetCase[arrayName]] : [];
        const newItem = { id: Date.now().toString(), ...itemData };
        updatedArray.push(newItem);

        targetCase[arrayName] = updatedArray;
        setSelectedCase(targetCase);
        setCases(cases.map(c => c.id === targetCase.id ? targetCase : c));

        await fetch(`http://127.0.0.1:8080/api/cases/edit/${targetCase.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [arrayName]: updatedArray })
        });
    };

    const deleteSubItem = async (arrayName, itemId) => {
        if (!window.confirm("Delete this entry?")) return;
        const targetCase = { ...selectedCase };
        const updatedArray = (targetCase[arrayName] || []).filter(item => item.id !== itemId);

        targetCase[arrayName] = updatedArray;
        setSelectedCase(targetCase);
        setCases(cases.map(c => c.id === targetCase.id ? targetCase : c));

        await fetch(`http://127.0.0.1:8080/api/cases/edit/${targetCase.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [arrayName]: updatedArray })
        });
    };

    const submitDocket = (e) => {
        e.preventDefault();
        saveSubItem('dockets', { date: new Date().toISOString().split('T')[0], desc: docketText, loggedBy: storedUser.username || 'System' });
        setDocketText(''); setShowDocketForm(false);
    };
    const submitIa = (e) => {
        e.preventDefault();
        saveSubItem('ias', iaData);
        setIaData({ num: '', status: 'PENDING' }); setShowIaForm(false);
    };
    const submitTask = (e) => {
        e.preventDefault();
        saveSubItem('tasks', taskData);
        setTaskData({ desc: '', assignee: '', due: '' }); setShowTaskForm(false);
    };
    const submitLedger = (e) => {
        e.preventDefault();
        saveSubItem('ledger', ledgerData);
        setLedgerData({ date: '', desc: '', amount: '' }); setShowLedgerForm(false);
    };

    // --- UI ACTIONS ---
    const handleMenuOpen = (e, caseObj) => { e.preventDefault(); e.stopPropagation(); setMenuPos({ visible: true, x: e.clientX, y: e.clientY, caseObj }); };
    const openDossier = (caseObj) => { setSelectedCase(caseObj); setDossierTab('OVERVIEW'); setIsDossierOpen(true); setMenuPos({ visible: false }); };

    const openCreateModal = () => { setEditingCaseId(null); setFormData(defaultFormState); setIsFilingOpen(true); };
    const openEditModal = (caseObj) => {
        let cat = 'WP', num = '', yr = currentYear.toString();
        try {
            const parts = caseObj.case_id.match(/^([A-Z\(\)-]+)\s+(\d+)\/(\d{4})$/);
            if (parts) { cat = parts[1]; num = parts[2]; yr = parts[3]; } else { num = caseObj.case_id; }
        } catch (e) { }

        setFormData({
            caseCategory: cat, caseNumber: num, caseYear: yr,
            type: caseObj.type || 'CIVIL', status: caseObj.status || 'RESEARCH',
            client_name: caseObj.client_name || '', client_id: caseObj.client_id || '',
            lawyer: caseObj.lawyer || '', court: caseObj.court || '', opponent: caseObj.opponent || '',
            priority: caseObj.priority || 'NORMAL', role: caseObj.role || 'PETITIONER',
            petitioner: caseObj.petitioner || '', respondent: caseObj.respondent || '', next_hearing: caseObj.next_hearing || '',
            item_number: caseObj.item_number || ''
        });
        setEditingCaseId(caseObj.id);
        setIsFilingOpen(true);
        setMenuPos({ visible: false });
    };

    const getStatusColors = (status) => {
        switch (status) {
            case 'RESEARCH': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'DRAFTING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'HEARING': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'DISPOSED': return 'bg-green-500/10 text-green-500 border-green-500/20';
            default: return 'bg-stone-500/10 text-stone-500 border-stone-500/20';
        }
    };

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors" onClick={() => setMenuPos({ visible: false })}>

            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0 z-10 transition-colors">
                <div>
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Case Manager</h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Litigation Pipeline & Registry</p>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-widest hidden sm:block">
                    {time.toLocaleTimeString('en-US', { hour12: false })}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scroll">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* FLIP CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        {[
                            { id: 'RESEARCH', title: 'Research', icon: 'fa-book-open', textClass: 'text-blue-500', borderClass: 'border-b-blue-500', bgClass: 'bg-blue-500', count: cases.filter(c => c.status === 'RESEARCH').length, sub: 'Files in Prep' },
                            { id: 'DRAFTING', title: 'Drafting', icon: 'fa-pen-nib', textClass: 'text-amber-500', borderClass: 'border-b-amber-500', bgClass: 'bg-amber-500', count: cases.filter(c => c.status === 'DRAFTING').length, sub: 'Pending Review' },
                            { id: 'HEARING', title: 'Hearing', icon: 'fa-gavel', textClass: 'text-red-500', borderClass: 'border-b-red-500', bgClass: 'bg-red-500', count: cases.filter(c => c.status === 'HEARING').length, sub: 'Active Litigation' },
                            { id: 'DISPOSED', title: 'Disposed', icon: 'fa-archive', textClass: 'text-green-500', borderClass: 'border-b-green-500', bgClass: 'bg-green-500', count: cases.filter(c => c.status === 'DISPOSED').length, sub: 'Archived Cases' },
                        ].map(card => (
                            <div key={card.id} className={`flip-card ${filters.status === card.id ? 'active' : ''}`} onClick={() => handleFilterChange('status', card.id)}>
                                <div className="flip-card-inner">
                                    <div className={`flip-front bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 border-b-4 ${card.borderClass} transition-colors`}>
                                        <div className="flex justify-between items-start">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${card.textClass}`}>{card.title}</span>
                                            <i className={`fa ${card.icon} text-stone-300 dark:text-stone-700`}></i>
                                        </div>
                                        <div className="text-left mt-2">
                                            <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none">{card.count}</h3>
                                            <span className="text-[10px] font-bold text-stone-400">{card.sub}</span>
                                        </div>
                                    </div>
                                    <div className={`flip-back ${card.bgClass} text-white`}>
                                        <div className="text-center">
                                            <i className="fa fa-filter-circle-xmark text-2xl mb-2"></i>
                                            <button onClick={(e) => { e.stopPropagation(); resetFilters(); }} className="block w-full bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors mt-2">Reset Filter</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="h-[140px] cursor-pointer" onClick={() => handleFilterChange('status', 'ALL')}>
                            <div className="w-full h-full bg-white dark:bg-[#121212] rounded-2xl p-5 flex flex-col justify-between border border-stone-200 dark:border-white/5 border-b-4 border-b-stone-800 dark:border-b-stone-400 transition-all hover:scale-[1.02]">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Registry</span>
                                    <i className="fa fa-layer-group text-stone-300 dark:text-stone-700"></i>
                                </div>
                                <div className="text-left mt-2">
                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none">{cases.length}</h3>
                                    <span className="text-[10px] font-bold text-stone-400">Total Database</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TOOLBAR */}
                    <div className="bg-white dark:bg-[#121212] p-5 rounded-2xl border border-stone-200 dark:border-white/5 flex flex-col gap-5 shadow-sm transition-colors">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                <div className="relative flex-grow sm:flex-grow-0 sm:w-80">
                                    <i className="fa fa-search absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"></i>
                                    <input type="text" placeholder="Search Case ID or Lawyer..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/5 rounded-xl h-12 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors" />
                                </div>
                                <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="h-12 bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/5 rounded-xl px-4 text-xs font-bold uppercase outline-none focus:border-amber-500 text-slate-900 dark:text-white cursor-pointer transition-colors">
                                    <option value="ALL">All Types</option><option value="CIVIL">Civil Suit</option><option value="CRIMINAL">Criminal</option><option value="WP">Writ Petition</option><option value="CORPORATE">Corporate</option>
                                </select>
                                <button onClick={resetFilters} className="h-12 w-12 flex items-center justify-center bg-stone-100 dark:bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-all text-stone-500">
                                    <i className="fa fa-rotate-left"></i>
                                </button>
                            </div>

                            <button onClick={openCreateModal} className="bg-amber-500 text-black px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-amber-500/20 flex items-center gap-2">
                                <i className="fa fa-plus"></i> New Filing
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4 border-t border-stone-100 dark:border-white/5">
                            <button onClick={() => handleFilterChange('alpha', 'ALL')} className={`alpha-btn !w-auto !px-4 ${filters.alpha === 'ALL' ? 'bg-black dark:bg-amber-500 text-white dark:text-black' : 'bg-stone-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-stone-200 dark:hover:bg-white/10'}`}>ALL</button>
                            {alphabet.map(char => (
                                <button key={char} onClick={() => handleFilterChange('alpha', char)} className={`alpha-btn ${filters.alpha === char ? 'bg-black dark:bg-amber-500 text-white dark:text-black' : 'bg-stone-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-stone-200 dark:hover:bg-white/10'}`}>{char}</button>
                            ))}
                        </div>
                    </div>

                    {/* REGISTRY TABLE */}
                    <div className="bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 shadow-xl overflow-hidden transition-colors">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead className="bg-stone-50 dark:bg-black/50 text-stone-400 border-b border-stone-200 dark:border-white/5">
                                    <tr>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest w-16 text-center">No.</th>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest">Case Profile</th>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest text-center">Our Role</th>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest text-center">Status</th>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest">Lead Counsel</th>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest text-right w-20">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                                    {filteredCases.map((c, index) => (
                                        <tr key={c.id} onClick={() => openDossier(c)} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4 font-mono text-[10px] text-stone-400 text-center">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors uppercase">{c.case_id}</span>
                                                            {c.priority === 'HIGH' && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse uppercase tracking-widest">Urgent</span>}
                                                            {isAdmin && c.delete_requested && <span title="Deletion Requested" className="text-red-500 animate-bounce"><i className="fa-solid fa-bell"></i></span>}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Client: {c.client_name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest border ${c.role === 'PETITIONER' ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20'}`}>
                                                    {c.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest border ${getStatusColors(c.status)}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold uppercase text-slate-600 dark:text-slate-400">{c.lawyer}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={(e) => handleMenuOpen(e, c)} className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/5 hover:bg-black dark:hover:bg-amber-500 text-stone-500 hover:text-white dark:hover:text-black transition-all flex items-center justify-center">
                                                    <i className="fa fa-ellipsis-vertical"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCases.length === 0 && (
                                        <tr><td colSpan="6" className="py-16 text-center text-stone-500 text-xs font-bold uppercase tracking-widest"><i className="fa fa-folder-open text-3xl mb-3 block opacity-50"></i>No Records Found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CONTEXT MENU (3-DOTS) --- */}
            {menuPos.visible && (
                <div className="fixed z-[99999] bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px] animate-fade-in" style={{ top: menuPos.y, left: menuPos.x - 160 }}>
                    <div className="px-4 py-2 border-b border-stone-100 dark:border-white/5 text-[9px] font-black uppercase text-stone-400 tracking-widest bg-stone-50/50 dark:bg-black/20">Options</div>
                    <button onClick={() => openDossier(menuPos.caseObj)} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-900 dark:text-white hover:bg-amber-500 hover:text-black transition-all flex items-center gap-3"><i className="fa fa-folder-open w-4"></i> View Dossier</button>
                    <button onClick={() => openEditModal(menuPos.caseObj)} className="w-full text-left px-4 py-3 text-[11px] font-bold text-slate-900 dark:text-white hover:bg-amber-500 hover:text-black transition-all flex items-center gap-3 border-b border-stone-100 dark:border-white/5"><i className="fa fa-pen-to-square w-4"></i> Edit Record</button>

                    {isAdmin ? (
                        <>
                            {menuPos.caseObj?.delete_requested ? (
                                <>
                                    <div className="px-4 py-2 border-y border-stone-100 dark:border-white/5 text-[9px] font-black uppercase text-red-500 tracking-widest bg-red-500/10">Purge Request Pending</div>
                                    <button onClick={() => resolveDeletion(menuPos.caseObj.id, 'approve')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-3"><i className="fa fa-check w-4"></i> Approve Purge</button>
                                    <button onClick={() => resolveDeletion(menuPos.caseObj.id, 'reject')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-stone-500 hover:bg-stone-500 hover:text-white transition-all flex items-center gap-3"><i className="fa fa-times w-4"></i> Reject Request</button>
                                </>
                            ) : (
                                <button onClick={() => resolveDeletion(menuPos.caseObj.id, 'approve')} className="w-full text-left px-4 py-3 text-[11px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-3"><i className="fa fa-trash w-4"></i> Delete Permanently</button>
                            )}
                        </>
                    ) : (
                        !menuPos.caseObj?.delete_requested && (
                            <button onClick={() => requestDeletion(menuPos.caseObj.id)} className="w-full text-left px-4 py-3 text-[11px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-3"><i className="fa fa-code-pull-request w-4"></i> Request Deletion</button>
                        )
                    )}
                </div>
            )}

            {/* --- ADVANCED DOSSIER SLIDE-OUT PANEL --- */}
            <div className={`drawer-overlay fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isDossierOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setIsDossierOpen(false)}></div>
            <div className={`side-drawer fixed right-0 top-0 h-full w-full md:w-[700px] bg-stone-50 dark:bg-[#0f0f10] border-l border-stone-200 dark:border-white/10 shadow-2xl z-[101] flex flex-col transform transition-transform duration-300 ${isDossierOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="shrink-0 border-b border-stone-200 dark:border-white/5 bg-white dark:bg-[#121212] transition-colors">
                    <div className="h-20 flex items-center justify-between px-8">
                        <div>
                            <h3 className="font-black text-lg uppercase text-slate-900 dark:text-white tracking-widest">{selectedCase?.case_id}</h3>
                            <p className="text-[10px] font-bold text-stone-500 tracking-widest uppercase">Client: {selectedCase?.client_name}</p>
                        </div>
                        <button onClick={() => setIsDossierOpen(false)} className="w-8 h-8 rounded-full bg-stone-200 dark:bg-white/5 flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors"><i className="fa fa-times"></i></button>
                    </div>

                    <div className="flex overflow-x-auto px-8 gap-6 text-[10px] font-black uppercase tracking-widest text-stone-400 no-scrollbar border-t border-stone-200 dark:border-white/5">
                        {['OVERVIEW', 'DOCKET', 'SUB-APPS', 'VAULT', 'TASKS & LEDGER'].map(tab => (
                            <button key={tab} onClick={() => setDossierTab(tab)} className={`py-4 border-b-2 transition-all whitespace-nowrap ${dossierTab === tab ? 'border-amber-500 text-amber-500' : 'border-transparent hover:text-stone-600 dark:hover:text-stone-300'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scroll bg-stone-50 dark:bg-transparent transition-colors">
                    {selectedCase && (
                        <>
                            {/* TAB 1: OVERVIEW */}
                            {dossierTab === 'OVERVIEW' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-center bg-white dark:bg-[#121212] p-6 rounded-2xl border border-stone-200 dark:border-white/5 transition-colors">
                                        <div>
                                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mb-1">Our Client's Role</p>
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${selectedCase.role === 'PETITIONER' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{selectedCase.role}</span>
                                        </div>
                                        <button onClick={() => navigate(`/clients/${selectedCase.client_id}`)} className="bg-stone-100 dark:bg-white/5 hover:bg-amber-500 hover:text-black text-slate-900 dark:text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">Go to Client Profile <i className="fa fa-arrow-right ml-2"></i></button>
                                    </div>

                                    {/* --- INTERACTIVE NEXT LISTING GATEWAY --- */}
                                    <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm transition-colors">
                                        <p className="text-[9px] text-stone-400 font-black uppercase tracking-widest mb-1">Next Listing</p>
                                        <div className="flex items-center gap-3">
                                            <p className={`text-xl font-black uppercase tracking-tighter ${!selectedCase.next_hearing ? 'text-stone-400 italic text-sm' :
                                                    new Date(selectedCase.next_hearing) < new Date().setHours(0, 0, 0, 0) ? 'text-red-500' : 'text-slate-900 dark:text-white'
                                                }`}>
                                                {selectedCase.next_hearing || 'Not Scheduled'}
                                            </p>
                                            {selectedCase.next_hearing && (
                                                <button onClick={() => navigate('/calendar')} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 transition-colors border border-amber-500/20">
                                                    <span className="text-[9px] font-black uppercase text-amber-600 group-hover:text-black tracking-widest">View Docket</span>
                                                    <i className="fa-solid fa-arrow-up-right-from-square text-[9px] text-amber-600 group-hover:text-black"></i>
                                                </button>
                                            )}
                                        </div>
                                        {selectedCase.next_hearing && (
                                            <p className="text-[10px] font-bold text-stone-500 uppercase mt-2">
                                                {new Date(selectedCase.next_hearing) < new Date().setHours(0, 0, 0, 0)
                                                    ? '⚠️ Past Date: Needs Adjournment in Calendar'
                                                    : `Hall: ${selectedCase.court || 'TBD'} • Item: ${selectedCase.item_number || 'TBD'}`
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-stone-200 dark:border-white/5 transition-colors">
                                            <p className="text-[9px] text-stone-400 font-black uppercase mb-1">Lead Counsel</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedCase.lawyer}</p>
                                        </div>
                                        <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-stone-200 dark:border-white/5 transition-colors">
                                            <p className="text-[9px] text-stone-400 font-black uppercase mb-1">Opposing Counsel</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedCase.opponent || 'TBD'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-2xl p-6 transition-colors">
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-4 border-b border-stone-100 dark:border-white/5 pb-2">Formal Cause Title</h4>
                                        <div className="whitespace-pre-wrap text-sm font-mono text-slate-900 dark:text-white leading-relaxed bg-stone-50 dark:bg-black p-4 rounded-xl border border-stone-100 dark:border-white/5 transition-colors">
                                            <span className="font-bold underline decoration-stone-400 underline-offset-4 text-stone-400 uppercase">Petitioner:</span><br />
                                            {selectedCase.petitioner || 'Not Specified'}<br /><br />
                                            <span className="font-bold underline decoration-stone-400 underline-offset-4 text-stone-400 uppercase">Respondent:</span><br />
                                            {selectedCase.respondent || 'Not Specified'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: DOCKET */}
                            {dossierTab === 'DOCKET' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest"><i className="fa-regular fa-calendar mr-2"></i> Hearings Auto-Sync from Calendar</p>
                                        <button onClick={() => setShowDocketForm(!showDocketForm)} className="bg-amber-500 text-black px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"><i className={`fa ${showDocketForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>{showDocketForm ? 'Cancel' : 'Log Update'}</button>
                                    </div>

                                    {showDocketForm && (
                                        <form onSubmit={submitDocket} className="bg-stone-100 dark:bg-white/5 p-4 rounded-xl border border-stone-200 dark:border-white/10 transition-colors">
                                            <textarea required value={docketText} onChange={e => setDocketText(e.target.value)} placeholder="Type docket update here..." className="w-full bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg p-3 text-xs text-slate-900 dark:text-white outline-none custom-scroll resize-none" rows="3"></textarea>
                                            <button type="submit" className="mt-2 w-full bg-black dark:bg-amber-500 text-white dark:text-black py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Save Docket Entry</button>
                                        </form>
                                    )}

                                    <div className="bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 p-8 transition-colors">
                                        {(!selectedCase.dockets || selectedCase.dockets.length === 0) && <p className="text-xs text-stone-500 italic text-center py-4">No procedural history logged.</p>}

                                        {selectedCase.dockets?.slice().reverse().map((docket, i) => (
                                            <div key={docket.id} className={`relative pl-6 ml-2 ${i !== selectedCase.dockets.length - 1 ? 'pb-8 border-l-2 border-stone-200 dark:border-white/10' : 'border-l-2 border-transparent'}`}>
                                                <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-amber-500 border-[3px] border-white dark:border-[#121212]"></div>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Update - {docket.date}</p>
                                                        <p className="text-[9px] text-stone-500 mt-0.5">Logged by {docket.loggedBy}</p>
                                                    </div>
                                                    <button onClick={() => deleteSubItem('dockets', docket.id)} className="text-stone-400 hover:text-red-500"><i className="fa fa-trash"></i></button>
                                                </div>
                                                <div className="text-[11px] text-slate-900 dark:text-white bg-stone-50 dark:bg-black border border-stone-100 dark:border-white/5 p-4 rounded-xl mt-3 font-medium whitespace-pre-wrap">{docket.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: SUB-APPS */}
                            {dossierTab === 'SUB-APPS' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest"><i className="fa-solid fa-layer-group mr-2"></i> Interlocutory Applications</p>
                                        <button onClick={() => setShowIaForm(!showIaForm)} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"><i className={`fa ${showIaForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>{showIaForm ? 'Cancel' : 'Add IA'}</button>
                                    </div>

                                    {showIaForm && (
                                        <form onSubmit={submitIa} className="bg-stone-100 dark:bg-white/5 p-4 rounded-xl border border-stone-200 dark:border-white/10 grid grid-cols-3 gap-3 transition-colors">
                                            <input type="text" required placeholder="IA No. (e.g. IA 1/2024)" value={iaData.num} onChange={e => setIaData({ ...iaData, num: e.target.value })} className="col-span-1 bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg px-3 text-xs text-slate-900 dark:text-white outline-none" />
                                            <select value={iaData.status} onChange={e => setIaData({ ...iaData, status: e.target.value })} className="col-span-1 bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg px-3 text-xs font-bold text-slate-900 dark:text-white outline-none">
                                                <option value="PENDING">PENDING</option><option value="ALLOWED">ALLOWED</option><option value="DISMISSED">DISMISSED</option>
                                            </select>
                                            <button type="submit" className="col-span-1 bg-blue-500 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Save IA</button>
                                        </form>
                                    )}

                                    <div className="bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 overflow-hidden transition-colors">
                                        {(!selectedCase.ias || selectedCase.ias.length === 0) ? (
                                            <p className="text-xs text-stone-500 italic text-center py-10">No applications filed yet.</p>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead className="bg-stone-50 dark:bg-black text-[9px] uppercase font-black text-stone-500 tracking-widest border-b border-stone-200 dark:border-white/5">
                                                    <tr><th className="px-6 py-4">App Number</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-stone-100 dark:divide-white/5 text-xs text-slate-900 dark:text-white">
                                                    {selectedCase.ias.map(ia => (
                                                        <tr key={ia.id}>
                                                            <td className="px-6 py-4 font-bold">{ia.num}</td>
                                                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[8px] font-black uppercase border ${ia.status === 'ALLOWED' ? 'text-green-500 border-green-500/20 bg-green-500/10' : ia.status === 'DISMISSED' ? 'text-red-500 border-red-500/20 bg-red-500/10' : 'text-amber-500 border-amber-500/20 bg-amber-500/10'}`}>{ia.status}</span></td>
                                                            <td className="px-6 py-4 text-right"><button onClick={() => deleteSubItem('ias', ia.id)} className="text-stone-400 hover:text-red-500"><i className="fa fa-trash"></i></button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: VAULT */}
                            {dossierTab === 'VAULT' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest"><i className="fa-solid fa-shield-halved mr-2"></i> Document uploads bridge directly to Secure Vault module.</p>
                                    </div>
                                    <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-10 text-center hover:border-amber-500 transition-colors cursor-pointer bg-white dark:bg-[#121212]">
                                        <i className="fa-solid fa-cloud-arrow-up text-4xl text-stone-300 dark:text-stone-600 mb-4 block"></i>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Upload Case Files</h4>
                                        <p className="text-xs text-stone-500">Drag & drop Petitions, Orders, and Annexures here.</p>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: TASKS & LEDGER */}
                            {dossierTab === 'TASKS & LEDGER' && (
                                <div className="space-y-8 animate-fade-in">

                                    {/* Tasks Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500"><i className="fa-solid fa-list-check mr-2"></i>Action Items (Pipeline)</h4>
                                            <button onClick={() => setShowTaskForm(!showTaskForm)} className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white hover:text-amber-500"><i className={`fa ${showTaskForm ? 'fa-times' : 'fa-plus'} mr-1`}></i> {showTaskForm ? 'Cancel' : 'Delegate Task'}</button>
                                        </div>

                                        {showTaskForm && (
                                            <form onSubmit={submitTask} className="bg-stone-100 dark:bg-white/5 p-4 rounded-xl border border-stone-200 dark:border-white/10 grid grid-cols-12 gap-3 mb-4 transition-colors">
                                                <input type="text" required placeholder="Task Desc..." value={taskData.desc} onChange={e => setTaskData({ ...taskData, desc: e.target.value })} className="col-span-5 bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg px-3 text-xs text-slate-900 dark:text-white outline-none" />
                                                <select required value={taskData.assignee} onChange={e => setTaskData({ ...taskData, assignee: e.target.value })} className="col-span-3 bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg px-3 text-xs font-bold text-slate-900 dark:text-white outline-none">
                                                    <option value="">Assign To...</option>
                                                    {personnel.associates?.map(p => <option key={p.user.id} value={p.user.first_name}>{p.user.first_name}</option>)}
                                                    {personnel.staff?.map(p => <option key={p.user.id} value={p.user.first_name}>{p.user.first_name}</option>)}
                                                </select>
                                                <input type="date" required value={taskData.due} onChange={e => setTaskData({ ...taskData, due: e.target.value })} className="col-span-2 bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg px-2 text-[10px] text-slate-900 dark:text-white outline-none" />
                                                <button type="submit" className="col-span-2 bg-amber-500 text-black py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Assign</button>
                                            </form>
                                        )}

                                        <div className="bg-white dark:bg-[#121212] rounded-xl border border-stone-200 dark:border-white/5 overflow-hidden transition-colors">
                                            {(!selectedCase.tasks || selectedCase.tasks.length === 0) ? (
                                                <p className="text-xs text-stone-500 italic text-center py-6">No pending tasks.</p>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <thead className="bg-stone-50 dark:bg-black text-[9px] uppercase font-black text-stone-500 tracking-widest border-b border-stone-200 dark:border-white/5">
                                                        <tr><th className="px-4 py-3">Task</th><th className="px-4 py-3">Assignee</th><th className="px-4 py-3">Due</th><th className="px-4 py-3 text-right">Action</th></tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-stone-100 dark:divide-white/5 text-xs text-slate-900 dark:text-white">
                                                        {selectedCase.tasks.map(t => (
                                                            <tr key={t.id}><td className="px-4 py-3 font-medium">{t.desc}</td><td className="px-4 py-3"><span className="bg-stone-100 dark:bg-white/10 px-2 py-1 rounded text-[9px] font-bold">{t.assignee}</span></td><td className="px-4 py-3 text-red-500 font-bold">{t.due}</td><td className="px-4 py-3 text-right"><button onClick={() => deleteSubItem('tasks', t.id)} className="text-stone-400 hover:text-green-500"><i className="fa fa-check-circle"></i></button></td></tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>

                                    <hr className="border-stone-200 dark:border-white/5" />

                                    {/* Ledger Section */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500"><i className="fa-solid fa-receipt mr-2"></i>Out-of-Pocket Ledger</h4>
                                            <button onClick={() => setShowLedgerForm(!showLedgerForm)} className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white hover:text-green-500"><i className={`fa ${showLedgerForm ? 'fa-times' : 'fa-plus'} mr-1`}></i> {showLedgerForm ? 'Cancel' : 'Log Expense'}</button>
                                        </div>

                                        {showLedgerForm && (
                                            <form onSubmit={submitLedger} className="bg-stone-100 dark:bg-white/5 p-4 rounded-xl border border-stone-200 dark:border-white/10 grid grid-cols-12 gap-3 mb-4 transition-colors">
                                                <input type="date" required value={ledgerData.date} onChange={e => setLedgerData({ ...ledgerData, date: e.target.value })} className="col-span-3 bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg px-2 text-[10px] text-slate-900 dark:text-white outline-none" />
                                                <input type="text" required placeholder="Description (e.g. Stamps)" value={ledgerData.desc} onChange={e => setLedgerData({ ...ledgerData, desc: e.target.value })} className="col-span-5 bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg px-3 text-xs text-slate-900 dark:text-white outline-none" />
                                                <input type="number" required placeholder="₹ Amt" value={ledgerData.amount} onChange={e => setLedgerData({ ...ledgerData, amount: e.target.value })} className="col-span-2 bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-lg px-3 text-xs font-bold text-slate-900 dark:text-white outline-none" />
                                                <button type="submit" className="col-span-2 bg-green-600 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-widest">Add</button>
                                            </form>
                                        )}

                                        <div className="bg-white dark:bg-[#121212] rounded-xl border border-stone-200 dark:border-white/5 overflow-hidden transition-colors">
                                            {(!selectedCase.ledger || selectedCase.ledger.length === 0) ? (
                                                <p className="text-xs text-stone-500 italic text-center py-6">No expenses logged.</p>
                                            ) : (
                                                <table className="w-full text-left">
                                                    <thead className="bg-stone-50 dark:bg-black text-[9px] uppercase font-black text-stone-500 tracking-widest border-b border-stone-200 dark:border-white/5">
                                                        <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Amount (₹)</th><th className="px-4 py-3 w-10"></th></tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-stone-100 dark:divide-white/5 text-xs text-slate-900 dark:text-white">
                                                        {selectedCase.ledger.map(l => (
                                                            <tr key={l.id}><td className="px-4 py-3 text-stone-500">{l.date}</td><td className="px-4 py-3 font-medium">{l.desc}</td><td className="px-4 py-3 text-right font-black">₹ {l.amount}</td><td className="px-4 py-3 text-right"><button onClick={() => deleteSubItem('ledger', l.id)} className="text-stone-400 hover:text-red-500"><i className="fa fa-trash"></i></button></td></tr>
                                                        ))}
                                                        {/* Total Row */}
                                                        <tr className="bg-stone-50 dark:bg-white/5"><td colSpan="2" className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-stone-500">Total Billed Expenses:</td><td className="px-4 py-3 text-right text-sm font-black text-green-600">₹ {selectedCase.ledger.reduce((sum, item) => sum + Number(item.amount), 0)}</td><td></td></tr>
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* --- FILING / EDITING MODAL --- */}
            {isFilingOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsFilingOpen(false)}>
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-3xl rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl relative overflow-hidden transition-colors" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-stone-200 dark:border-white/5 flex justify-between items-center bg-stone-50 dark:bg-black/20">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">{editingCaseId ? 'Edit Case Entry' : 'New Case Entry'}</h3>
                            <button onClick={() => setIsFilingOpen(false)} className="text-stone-400 hover:text-red-500 transition-colors"><i className="fa fa-times text-lg"></i></button>
                        </div>

                        <form className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scroll" onSubmit={handleFilingSubmit}>

                            <div className="bg-stone-50 dark:bg-white/5 p-5 rounded-2xl border border-stone-200 dark:border-white/5">
                                <label className="block text-[9px] font-black uppercase text-amber-500 mb-3 tracking-widest">Case Identification</label>
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-5">
                                        <select value={formData.caseCategory} onChange={e => setFormData({ ...formData, caseCategory: e.target.value })} className="w-full bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none">
                                            {CASE_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <input type="number" placeholder="Number" value={formData.caseNumber} onChange={e => setFormData({ ...formData, caseNumber: e.target.value })} required className="w-full bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                                    </div>
                                    <div className="col-span-3">
                                        <select value={formData.caseYear} onChange={e => setFormData({ ...formData, caseYear: e.target.value })} className="w-full bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white outline-none">
                                            {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Client Profile</label>
                                    <select required value={formData.client_id} onChange={e => {
                                        const selected = clients.find(c => c.id === e.target.value);
                                        setFormData({ ...formData, client_id: e.target.value, client_name: selected ? selected.name : '' });
                                    }} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500">
                                        <option value="">-- Select Registered Client --</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Our Client's Role</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none">
                                        <option value="PETITIONER">Petitioner / Applicant</option><option value="RESPONDENT">Respondent / Defense</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Lead Counsel</label>
                                    <select value={formData.lawyer} onChange={e => setFormData({ ...formData, lawyer: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none">
                                        <optgroup label="Partners">
                                            {personnel.partners?.map(p => <option key={p.user.id} value={`${p.user.first_name} ${p.user.last_name}`}>{p.user.first_name} {p.user.last_name}</option>)}
                                        </optgroup>
                                        <optgroup label="Associates & Staff">
                                            {personnel.associates?.map(p => <option key={p.user.id} value={`${p.user.first_name} ${p.user.last_name}`}>{p.user.first_name} {p.user.last_name}</option>)}
                                            {personnel.staff?.map(p => <option key={p.user.id} value={`${p.user.first_name} ${p.user.last_name}`}>{p.user.first_name} {p.user.last_name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                <div><label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Opposing Counsel</label><input type="text" placeholder="Defense Lawyer Name" value={formData.opponent} onChange={e => setFormData({ ...formData, opponent: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500" /></div>

                                <div><label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Case Type</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none"><option value="CIVIL">CIVIL</option><option value="CRIMINAL">CRIMINAL</option><option value="CORPORATE">CORPORATE</option><option value="WP">WP</option></select></div>
                                <div><label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Status</label><select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none"><option value="RESEARCH">RESEARCH</option><option value="DRAFTING">DRAFTING</option><option value="HEARING">HEARING</option><option value="DISPOSED">DISPOSED</option></select></div>

                                <div><label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Bench Location</label><input type="text" value={formData.court} onChange={e => setFormData({ ...formData, court: e.target.value })} required placeholder="e.g. Court Hall 1" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500" /></div>
                                <div><label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Item Number</label><input type="number" placeholder="Item No. on Cause List" value={formData.item_number} onChange={e => setFormData({ ...formData, item_number: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500" /></div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Next Hearing Date</label>
                                    <input type="date" disabled={formData.status === 'DISPOSED'} value={formData.status === 'DISPOSED' ? '' : formData.next_hearing} onChange={e => setFormData({ ...formData, next_hearing: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                                </div>
                                <div><label className="block text-[9px] font-black uppercase text-stone-400 mb-1.5 tracking-widest">Priority</label><select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none"><option value="NORMAL">NORMAL</option><option value="HIGH">HIGH (URGENT)</option></select></div>
                            </div>

                            <div className="bg-stone-50 dark:bg-white/5 p-5 rounded-2xl border border-stone-200 dark:border-white/5">
                                <label className="block text-[9px] font-black uppercase text-amber-500 mb-3 tracking-widest">Formal Cause Title (Multi-line format)</label>
                                <div className="space-y-4">
                                    <textarea placeholder="e.g. Koppula Rambabu, S/o Naganna...&#10;...Petitioner" rows="3" value={formData.petitioner} onChange={e => setFormData({ ...formData, petitioner: e.target.value })} className="w-full bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none custom-scroll resize-none focus:border-amber-500"></textarea>
                                    <div className="text-center text-[10px] font-black text-stone-400 uppercase">AND</div>
                                    <textarea placeholder="e.g. The State of Andhra Pradesh...&#10;...Respondent" rows="3" value={formData.respondent} onChange={e => setFormData({ ...formData, respondent: e.target.value })} className="w-full bg-white dark:bg-black border border-stone-200 dark:border-white/5 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none custom-scroll resize-none focus:border-amber-500"></textarea>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-xl">
                                {editingCaseId ? 'Update Record in Database' : 'File Record to Database'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseManager;