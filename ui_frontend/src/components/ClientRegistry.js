import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ClientRegistry.css';

const ClientRegistry = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');
    const isAdmin = storedUser.sessionRole === 'ADMIN';

    // --- STATE MANAGEMENT ---
    const [time, setTime] = useState(new Date());
    const [clients, setClients] = useState([]);
    const [cases, setCases] = useState([]);
    const [personnel, setPersonnel] = useState({ partners: [], associates: [], staff: [] });

    // UI & Filters
    const [filters, setFilters] = useState({ search: '', alpha: 'ALL', counsel: 'ALL' });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Dossier State
    const [isDossierOpen, setIsDossierOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [dossierTab, setDossierTab] = useState('OVERVIEW');

    // Form Data
    const defaultForm = {
        name: '', phone: '', email: '', address: '', status: 'RESEARCH',
        lead_counsel: '', total_fee: 0, paid_fee: 0,
        reminders: { whatsapp: true, email: false }
    };
    const [formData, setFormData] = useState(defaultForm);
    const [visitPurpose, setVisitPurpose] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [conflictWarning, setConflictWarning] = useState(null);

    // --- INITIALIZATION & SYNC ---
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        fetchData();
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        try {
            const [clientRes, caseRes, staffRes] = await Promise.all([
                fetch('http://127.0.0.1:8080/api/clients'),
                fetch('http://127.0.0.1:8080/api/cases'),
                fetch('http://127.0.0.1:8080/api/personnel/roll')
            ]);

            if (clientRes.ok) {
                const clientData = await clientRes.json();
                setClients(clientData);
                setSelectedClient(prev => prev ? clientData.find(c => c.id === prev.id) || prev : prev);
            }
            if (caseRes.ok) setCases(await caseRes.json());
            if (staffRes.ok) setPersonnel(await staffRes.json());
        } catch (error) { console.error("Database connection failed."); }
    };

    // --- FILTERING ---
    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const resetFilters = () => setFilters({ search: '', alpha: 'ALL', counsel: 'ALL' });

    const filteredClients = clients.filter(c => {
        const matchSearch = (c.name || '').toLowerCase().includes(filters.search.toLowerCase());
        const matchAlpha = filters.alpha === 'ALL' || (c.name || '').toUpperCase().startsWith(filters.alpha);
        const matchCounsel = filters.counsel === 'ALL' || c.lead_counsel === filters.counsel;
        return matchSearch && matchAlpha && matchCounsel;
    });

    const allAttorneys = [...(personnel.partners || []), ...(personnel.associates || [])].map(p => `${p.user.first_name} ${p.user.last_name}`);

    // --- EXPORT TO EXCEL ---
    const exportToExcel = () => {
        if (!isAdmin) return alert("Unauthorized.");
        let csvContent = "data:text/csv;charset=utf-8,Client Name,Phone,Email,Status,Lead Counsel,Agreed Fee,Received,Balance Due\n";
        filteredClients.forEach(c => {
            const total = parseFloat(c.total_fee || 0);
            const paid = parseFloat(c.paid_fee || 0);
            const due = Math.max(0, total - paid);
            csvContent += `"${c.name || ''}","${c.phone || ''}","${c.email || ''}","${c.status || ''}","${c.lead_counsel || ''}",${total},${paid},${due}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "MLS_Client_Registry.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- SMART CONFLICT OF INTEREST CHECKER ---
    const runConflictCheck = () => {
        if (!formData.name) return setConflictWarning({ type: 'error', msg: "Please enter a client name first." });

        const query = formData.name.toLowerCase().trim();
        const conflicts = cases.filter(c =>
            (c.opponent || '').toLowerCase().includes(query) ||
            (c.respondent || '').toLowerCase().includes(query) ||
            (c.petitioner || '').toLowerCase().includes(query)
        );

        if (conflicts.length > 0) {
            setConflictWarning({
                type: 'danger',
                msg: `⚠️ CONFLICT FOUND: Appears in ${conflicts.length} case(s) as an opposing party or participant (e.g., ${conflicts[0].case_id}). Proceed with caution.`
            });
        } else {
            setConflictWarning({ type: 'safe', msg: '✅ CLEAR: No conflicts found in current case registry.' });
        }
    };

    // --- DATABASE ACTIONS ---
    const handleSaveClient = async (e) => {
        e.preventDefault();
        const url = isEditModalOpen ? `http://127.0.0.1:8080/api/clients/edit/${formData.id}` : `http://127.0.0.1:8080/api/clients/add`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert(`✅ Client ${isEditModalOpen ? 'Updated' : 'Added'} successfully.`);
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
                setConflictWarning(null);
                await fetchData();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`❌ ERROR: ${errorData.message || 'Failed to save to database.'}`);
            }
        } catch (error) {
            alert("❌ NETWORK ERROR: Could not communicate with the backend.");
        }
    };

    const handlePayment = async () => {
        const amt = parseFloat(paymentAmount);
        if (!amt || amt <= 0) return alert("Enter a valid amount.");

        try {
            await fetch(`http://127.0.0.1:8080/api/clients/${selectedClient.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amt })
            });
            setPaymentAmount('');
            await fetchData();
        } catch (error) { alert("Payment Failed."); }
    };

    const handleLogVisit = async () => {
        if (!visitPurpose) return;
        try {
            const visitData = { date: new Date().toISOString().split('T')[0], purpose: visitPurpose, loggedBy: storedUser.username || 'System' };
            await fetch(`http://127.0.0.1:8080/api/clients/${selectedClient.id}/visit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(visitData)
            });
            setVisitPurpose('');
            await fetchData();
        } catch (error) { alert("Visit log failed."); }
    };

    const toggleReminder = async (type) => {
        const updatedReminders = { ...selectedClient.reminders, [type]: !selectedClient.reminders?.[type] };
        setSelectedClient(prev => ({ ...prev, reminders: updatedReminders }));

        await fetch(`http://127.0.0.1:8080/api/clients/edit/${selectedClient.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reminders: updatedReminders })
        });
        fetchData();
    };

    // --- HELPERS ---
    const getClientCases = (clientId) => cases.filter(c => c.client_id === clientId);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const calcPercentage = (paid, total) => total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors">

            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0 z-10 transition-colors">
                <div>
                    <h2 className="font-black text-xl text-black dark:text-white tracking-tight uppercase">Client Registry</h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Manage Beneficiaries & Financials</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-bold text-green-600 flex items-center justify-end gap-1.5 uppercase tracking-widest">
                        System Secure <i className="fa fa-circle text-[5px] animate-pulse"></i>
                    </div>
                    <div className="text-lg font-black text-black dark:text-white font-mono tracking-widest mt-0.5">
                        {time.toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scroll">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* FLIP CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="client-flip-card">
                            <div className="client-flip-card-inner">
                                <div className="client-flip-front bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 border-b-4 border-b-blue-500 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Total Clients</span>
                                        <i className="fa fa-users text-stone-300 dark:text-stone-700"></i>
                                    </div>
                                    <div className="text-left mt-2">
                                        <h3 className="text-5xl font-black text-black dark:text-white leading-none">{clients.length}</h3>
                                        <span className="text-[10px] font-bold text-stone-500 uppercase">Registered Profiles</span>
                                    </div>
                                </div>
                                <div className="client-flip-back bg-blue-500 text-white p-6">
                                    <h2 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-80">Management</h2>
                                    <button onClick={() => { setFormData(defaultForm); setConflictWarning(null); setIsAddModalOpen(true); }} className="w-full bg-black/20 hover:bg-black/40 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-white">
                                        <i className="fa fa-plus mr-2"></i> Register New Client
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="client-flip-card">
                            <div className="client-flip-card-inner">
                                <div className="client-flip-front bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 border-b-4 border-b-amber-500 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Case Manager</span>
                                        <i className="fa fa-gavel text-stone-300 dark:text-stone-700"></i>
                                    </div>
                                    <div className="text-left mt-2">
                                        <h3 className="text-5xl font-black text-black dark:text-white leading-none">{cases.length}</h3>
                                        <span className="text-[10px] font-bold text-stone-500 uppercase">Total Active Files</span>
                                    </div>
                                </div>
                                <div className="client-flip-back bg-amber-500 text-black p-6">
                                    <h2 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-80">Navigation</h2>
                                    <button onClick={() => navigate('/cases')} className="w-full bg-black/10 hover:bg-black/20 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                        Open Case Manager
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="client-flip-card">
                            <div className="client-flip-card-inner">
                                <div className="client-flip-front bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 border-b-4 border-b-stone-500 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Lead Counsel</span>
                                        <i className="fa fa-filter text-stone-300 dark:text-stone-700"></i>
                                    </div>
                                    <div className="text-left mt-2">
                                        <h3 className="text-5xl font-black text-black dark:text-white leading-none">{allAttorneys.length}</h3>
                                        <span className="text-[10px] font-bold text-stone-500 uppercase">Attorneys on Record</span>
                                    </div>
                                </div>
                                <div className="client-flip-back bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 !justify-start !items-start p-4 transition-colors">
                                    <div className="w-full flex justify-between items-center mb-2 pb-2 border-b border-stone-100 dark:border-white/5">
                                        <span className="text-[9px] font-black uppercase text-stone-400">Directory Filter</span>
                                    </div>
                                    <div className="w-full overflow-y-auto custom-scroll max-h-[100px] pr-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleFilterChange('counsel', 'ALL'); }} className={`counsel-pill ${filters.counsel === 'ALL' ? 'active' : 'text-stone-500 dark:text-stone-400'}`}>All Staff</button>
                                        {allAttorneys.map(name => (
                                            <button key={name} onClick={(e) => { e.stopPropagation(); handleFilterChange('counsel', name); }} className={`counsel-pill truncate ${filters.counsel === name ? 'active' : 'text-stone-500 dark:text-stone-400'}`}>{name}</button>
                                        ))}
                                    </div>
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
                                    {/* THE FIX: AutoComplete OFF strictly prevents the browser from changing the background color! */}
                                    <input type="text" placeholder="Search Client Name..." value={filters.search} autoComplete="new-password" spellCheck="false" onChange={(e) => handleFilterChange('search', e.target.value)} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/5 rounded-xl h-12 pl-11 pr-4 text-sm font-bold text-black dark:text-white outline-none focus:border-amber-500 transition-colors" />
                                </div>
                                <button onClick={resetFilters} className="h-12 w-12 flex items-center justify-center bg-stone-100 dark:bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-all text-stone-500">
                                    <i className="fa fa-rotate-left"></i>
                                </button>

                                {isAdmin && (
                                    <button onClick={exportToExcel} className="h-12 px-6 flex items-center justify-center bg-green-600/10 border border-green-600/30 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                                        <i className="fa fa-file-excel mr-2 text-sm"></i> Export Data
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4 border-t border-stone-100 dark:border-white/5">
                            <button onClick={() => handleFilterChange('alpha', 'ALL')} className={`alpha-btn !w-auto !px-4 ${filters.alpha === 'ALL' ? 'alpha-active' : ''}`}>ALL</button>
                            {alphabet.map(char => (
                                <button key={char} onClick={() => handleFilterChange('alpha', char)} className={`alpha-btn ${filters.alpha === char ? 'alpha-active' : ''}`}>{char}</button>
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
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest">Client Identity & Cases</th>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest text-center">Legal Status</th>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest">Lead Counsel</th>
                                        <th className="px-6 py-5 text-[9px] uppercase font-black tracking-widest text-right w-20">Edit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                                    {filteredClients.map((client, index) => {
                                        const clientCases = getClientCases(client.id);
                                        return (
                                            <tr key={client.id} onClick={() => { setSelectedClient(client); setDossierTab('OVERVIEW'); setIsDossierOpen(true); }} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                                <td className="px-6 py-4 font-mono text-[10px] text-stone-400 text-center">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-black dark:text-white group-hover:text-amber-500 transition-colors uppercase">{client.name}</div>
                                                    <div className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mt-1">
                                                        {clientCases.length > 0 ? `Cases: ${clientCases.map(c => c.case_id).join(', ')}` : 'No active filings'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${client.status === 'RESEARCH' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : client.status === 'DRAFTING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : client.status === 'HEARING' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                                        {client.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold uppercase text-stone-500 dark:text-stone-400">{client.lead_counsel || 'Unassigned'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={(e) => { e.stopPropagation(); setFormData(client); setConflictWarning(null); setIsEditModalOpen(true); }} className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-white/5 hover:bg-black dark:hover:bg-amber-500 text-stone-500 hover:text-white dark:hover:text-black transition-all flex items-center justify-center">
                                                        <i className="fa fa-pen"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredClients.length === 0 && (
                                        <tr><td colSpan="5" className="py-16 text-center text-stone-500 text-xs font-bold uppercase tracking-widest"><i className="fa fa-folder-open text-3xl mb-3 block opacity-50"></i>No Clients Found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CLIENT DOSSIER (TABBED SLIDE-OUT) --- */}
            <div className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isDossierOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`} onClick={() => setIsDossierOpen(false)}></div>
            <div className={`fixed right-0 top-0 h-full w-full md:w-[700px] bg-stone-50 dark:bg-[#0f0f10] border-l border-stone-200 dark:border-white/10 shadow-2xl z-[101] flex flex-col transform transition-transform duration-400 ${isDossierOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="shrink-0 border-b border-stone-200 dark:border-white/5 bg-white dark:bg-[#121212] transition-colors">
                    <div className="h-20 flex items-center justify-between px-8">
                        <div>
                            <h3 className="font-black text-xl text-black dark:text-white tracking-tighter uppercase">{selectedClient?.name}</h3>
                            <div className="flex gap-4 text-[9px] font-bold text-stone-500 tracking-widest uppercase mt-1">
                                <span><i className="fa fa-phone mr-1"></i> {selectedClient?.phone || 'N/A'}</span>
                                <span><i className="fa fa-envelope mr-1"></i> {selectedClient?.email || 'N/A'}</span>
                            </div>
                        </div>
                        <button onClick={() => setIsDossierOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-500 hover:text-red-500 transition-colors"><i className="fa fa-times"></i></button>
                    </div>

                    <div className="flex overflow-x-auto px-8 gap-6 text-[10px] font-black uppercase tracking-widest text-stone-400 no-scrollbar border-t border-stone-100 dark:border-white/5">
                        {['OVERVIEW', 'FINANCIALS', 'VISITS', 'KYC VAULT', 'SETTINGS'].map(tab => (
                            <button key={tab} onClick={() => setDossierTab(tab)} className={`py-4 border-b-2 transition-all whitespace-nowrap ${dossierTab === tab ? 'border-amber-500 text-amber-500' : 'border-transparent hover:text-stone-600 dark:hover:text-stone-300'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scroll bg-stone-50 dark:bg-transparent transition-colors">
                    {selectedClient && (
                        <>
                            {/* TAB 1: OVERVIEW (Cases) */}
                            {dossierTab === 'OVERVIEW' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2"><i className="fa fa-gavel text-amber-500"></i> Linked Active Cases</h4>
                                    <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm transition-colors">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-stone-50 dark:bg-black text-[9px] uppercase font-black text-stone-500 tracking-widest">
                                                <tr><th className="px-4 py-3">Case ID</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Next Listing</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100 dark:divide-white/5 text-black dark:text-white font-medium">
                                                {getClientCases(selectedClient.id).map(c => (
                                                    <tr key={c.id}>
                                                        <td className="px-4 py-3 font-bold text-amber-500">{c.case_id}</td>
                                                        <td className="px-4 py-3 text-stone-500">{c.type}</td>
                                                        <td className="px-4 py-3"><span className="text-[8px] bg-stone-100 dark:bg-white/5 px-2 py-1 rounded tracking-widest uppercase font-black">{c.status}</span></td>
                                                        <td className="px-4 py-3 text-red-500 font-bold">{c.next_hearing || '—'}</td>
                                                    </tr>
                                                ))}
                                                {getClientCases(selectedClient.id).length === 0 && <tr><td colSpan="4" className="px-4 py-6 text-center text-stone-500 italic">No linked cases found for this client.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: FINANCIALS */}
                            {dossierTab === 'FINANCIALS' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2"><i className="fa fa-coins text-green-500"></i> Fee Tracking & Retainer</h4>
                                    <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-2xl p-6 shadow-sm transition-colors">
                                        <div className="flex flex-col md:flex-row gap-8 items-center">

                                            <div className="flex flex-col items-center gap-3 shrink-0">
                                                <div className="pie-chart" style={{ '--p': `${calcPercentage(selectedClient.paid_fee, selectedClient.total_fee)}%` }}>
                                                    <span className="z-10 text-xs font-black text-black dark:text-white">{calcPercentage(selectedClient.paid_fee, selectedClient.total_fee)}%</span>
                                                </div>
                                                <span className="text-[9px] uppercase font-black tracking-widest text-stone-400">Received Ratio</span>
                                            </div>

                                            <div className="flex-1 w-full grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-stone-50 dark:bg-black rounded-xl border border-stone-200 dark:border-white/5">
                                                    <p className="text-[9px] text-stone-500 uppercase font-black tracking-widest mb-1">Agreed Fee</p>
                                                    <p className="text-xl font-black text-black dark:text-white">₹{parseFloat(selectedClient.total_fee || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="p-4 bg-stone-50 dark:bg-black rounded-xl border border-stone-200 dark:border-white/5">
                                                    <p className="text-[9px] text-green-600 uppercase font-black tracking-widest mb-1">Received</p>
                                                    <p className="text-xl font-black text-green-600">₹{parseFloat(selectedClient.paid_fee || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-200 dark:border-red-500/20 border-l-4 border-l-red-500 col-span-2">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-[9px] text-red-600 uppercase font-black tracking-widest mb-1">Balance Due</p>
                                                            <p className="text-2xl font-black text-red-600">₹{Math.max(0, (selectedClient.total_fee || 0) - (selectedClient.paid_fee || 0)).toLocaleString()}</p>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <input type="number" placeholder="₹ Amount..." value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-24 bg-white dark:bg-black border border-stone-300 dark:border-red-500/50 rounded px-2 py-1.5 text-xs font-bold outline-none text-right text-black dark:text-white" />
                                                            <button onClick={handlePayment} className="bg-red-600 text-white px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors">Pay</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full py-4 bg-stone-100 dark:bg-white/5 hover:bg-amber-500 hover:text-black text-black dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"><i className="fa-solid fa-file-invoice mr-2"></i> Generate PDF Invoice</button>
                                </div>
                            )}

                            {/* TAB 3: VISITS */}
                            {dossierTab === 'VISITS' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2"><i className="fa fa-calendar-check text-blue-500"></i> Office Visit Log</h4>
                                    <div className="flex gap-3 mb-4">
                                        <input type="text" value={visitPurpose} onChange={e => setVisitPurpose(e.target.value)} placeholder="Purpose of client visit (e.g. Handed over Vakalatnama)..." className="flex-1 bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:border-amber-500 outline-none text-black dark:text-white transition-colors" />
                                        <button onClick={handleLogVisit} className="bg-black dark:bg-amber-500 text-white dark:text-black px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">Log Entry</button>
                                    </div>
                                    <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-xl overflow-hidden shadow-sm transition-colors">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-stone-50 dark:bg-black text-[9px] uppercase font-black text-stone-500 tracking-widest">
                                                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Purpose</th><th className="px-4 py-3 text-right">Logged By</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100 dark:divide-white/5 text-black dark:text-white">
                                                {selectedClient.visits?.map((v, i) => (
                                                    <tr key={i}><td className="px-4 py-3 text-stone-500 font-mono">{v.date}</td><td className="px-4 py-3 font-bold">{v.purpose}</td><td className="px-4 py-3 text-right text-[10px] font-bold text-stone-500 uppercase">{v.loggedBy}</td></tr>
                                                ))}
                                                {(!selectedClient.visits || selectedClient.visits.length === 0) && <tr><td colSpan="3" className="px-4 py-6 text-center text-stone-500 italic">No visits logged.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: KYC VAULT */}
                            {dossierTab === 'KYC VAULT' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest"><i className="fa-solid fa-id-card mr-2"></i> Identity & Authorization Vault.</p>
                                    </div>

                                    <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-10 text-center hover:border-amber-500 dark:hover:border-amber-500 transition-colors cursor-pointer bg-white dark:bg-[#121212]">
                                        <i className="fa-solid fa-cloud-arrow-up text-4xl text-stone-300 dark:text-stone-600 mb-4 block"></i>
                                        <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-widest mb-1">Upload KYC Documents</h4>
                                        <p className="text-xs text-stone-500">Drag & drop Aadhar, PAN, and Signed Vakalatnamas here.</p>
                                    </div>

                                    <div className="bg-white dark:bg-[#121212] rounded-xl border border-stone-200 dark:border-white/5 p-2 shadow-sm transition-colors">
                                        <div className="flex items-center justify-between p-3 hover:bg-stone-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                            <div className="flex items-center gap-4">
                                                <i className="fa-solid fa-file-image text-blue-500 text-xl"></i>
                                                <div>
                                                    <p className="text-xs font-bold text-black dark:text-white">Aadhar_Card_Front_Back.jpg</p>
                                                    <p className="text-[9px] text-stone-500 uppercase tracking-widest">Awaiting Verification</p>
                                                </div>
                                            </div>
                                            <button className="text-stone-400 hover:text-amber-500"><i className="fa-solid fa-download"></i></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: SETTINGS */}
                            {dossierTab === 'SETTINGS' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2 flex items-center gap-2"><i className="fa-solid fa-bell text-amber-500"></i> Automated Notifications</h4>

                                    <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-2xl p-6 space-y-6 shadow-sm transition-colors">

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h5 className="text-sm font-bold text-black dark:text-white">WhatsApp Reminders</h5>
                                                <p className="text-xs text-stone-500 mt-1 max-w-sm">Automatically message this client when a "Next Listing Date" changes in the Case Manager.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={selectedClient.reminders?.whatsapp || false} onChange={() => toggleReminder('whatsapp')} />
                                                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>

                                        <hr className="border-stone-100 dark:border-white/5" />

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h5 className="text-sm font-bold text-black dark:text-white">Email Reminders</h5>
                                                <p className="text-xs text-stone-500 mt-1 max-w-sm">Send a formal email notification with case details when the listing is updated.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={selectedClient.reminders?.email || false} onChange={() => toggleReminder('email')} />
                                                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* --- ADD / EDIT MODAL --- */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-xl rounded-[2rem] border border-stone-200 dark:border-white/10 shadow-2xl relative overflow-hidden transition-colors" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-stone-200 dark:border-white/5 flex justify-between items-center bg-stone-50 dark:bg-black/20">
                            <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-widest">{isEditModalOpen ? 'Edit Client Profile' : 'Register Client'}</h3>
                            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-stone-400 hover:text-red-500"><i className="fa fa-times text-lg"></i></button>
                        </div>

                        <form className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scroll" onSubmit={handleSaveClient}>

                            <div className="bg-stone-50 dark:bg-white/5 p-5 rounded-2xl border border-stone-200 dark:border-white/5 mb-2">
                                <label className="block text-[9px] font-black uppercase text-amber-500 mb-3 tracking-widest">Client Identity & Conflict Check</label>
                                <div className="flex gap-3 mb-2">
                                    <input type="text" required autoComplete="off" spellCheck="false" placeholder="Enter Full Name..." value={formData.name} onChange={e => { setFormData({ ...formData, name: e.target.value }); setConflictWarning(null); }} className="flex-1 bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-black dark:text-white outline-none focus:border-amber-500" />
                                    <button type="button" onClick={runConflictCheck} className="bg-stone-800 text-white dark:bg-stone-200 dark:text-black px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform">Run Scan</button>
                                </div>
                                {conflictWarning && (
                                    <div className={`p-3 rounded-lg text-xs font-bold ${conflictWarning.type === 'danger' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                        {conflictWarning.msg}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-500 mb-1.5 tracking-widest">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-black dark:text-white outline-none focus:border-amber-500">
                                        <option value="RESEARCH">Research</option><option value="DRAFTING">Drafting</option><option value="HEARING">Hearing</option><option value="DISPOSED">Disposed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase text-stone-500 mb-1.5 tracking-widest">Lead Counsel</label>
                                    <select value={formData.lead_counsel} onChange={e => setFormData({ ...formData, lead_counsel: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-black dark:text-white outline-none focus:border-amber-500">
                                        <option value="">Unassigned</option>
                                        <optgroup label="Partners">
                                            {personnel.partners?.map(p => <option key={p.user.id} value={`${p.user.first_name} ${p.user.last_name}`}>{p.user.first_name} {p.user.last_name}</option>)}
                                        </optgroup>
                                        <optgroup label="Associates">
                                            {personnel.associates?.map(p => <option key={p.user.id} value={`${p.user.first_name} ${p.user.last_name}`}>{p.user.first_name} {p.user.last_name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div><label className="block text-[9px] font-black uppercase text-stone-500 mb-1.5 tracking-widest">Phone</label><input type="text" autoComplete="off" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white outline-none focus:border-amber-500" /></div>
                                <div><label className="block text-[9px] font-black uppercase text-stone-500 mb-1.5 tracking-widest">Email</label><input type="email" autoComplete="off" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white outline-none focus:border-amber-500" /></div>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black uppercase text-stone-500 mb-1.5 tracking-widest">Agreed Professional Fee (₹)</label>
                                <input type="number" required min="0" autoComplete="off" placeholder="e.g. 50000" value={formData.total_fee} onChange={e => setFormData({ ...formData, total_fee: e.target.value })} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold text-black dark:text-white outline-none focus:border-green-500" />
                            </div>

                            <button type="submit" className="w-full bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] transition-transform">
                                {isEditModalOpen ? 'Save Changes' : 'Create Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientRegistry;