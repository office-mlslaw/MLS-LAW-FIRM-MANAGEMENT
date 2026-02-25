import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SecureVault.css';

const COURTS = [
    { code: 'HC', name: 'High Court', icon: 'fa-landmark' },
    { code: 'LC', name: 'Lower Courts', icon: 'fa-gavel' },
    { code: 'TR', name: 'Tribunals', icon: 'fa-scale-balanced' },
    { code: 'CC', name: 'Consumer Forum', icon: 'fa-users' }
];

const COURT_CATEGORIES = {
    'HC': ["APPL", "ARBAPPL", "AS", "CA", "CAPPEAL", "CC", "CCCA", "CMA", "COMCA", "COMOP", "COMPA", "COMS", "CP", "CRLA", "CRLP", "CRLRC", "CRP", "CS", "EP", "EXEP", "FCA", "MACMA", "OP", "OSA", "PIL", "SA", "WA", "WP", "X-OBJ"].map(c => ({ value: c, label: c })),
    'LC': ["A.R.B.O.P", "AS", "ATA", "A.T.C.", "CA", "CC", "CC.APT", "CC.LG", "CMA", "CRIME NO", "CRLA", "CRLA.MU", "CRL.MP", "CRLMP.BAIL", "CRLRP", "CRLRP.MU", "DVC", "EAS", "EAT.APPEAL", "EC.APPEALS", "ELECOP", "E.M.C", "EP", "E.S.I.", "F.C.O.P", "F.C.O.S", "G.W.O.P", "H.M.O.P", "ID", "IP", "JCC", "L.A.O.P", "LGOP", "LPC", "LRA", "L.R.A.C", "MC", "MPID", "MVOP", "OP", "OS", "PLC", "PRC", "RC", "RCA", "RCC", "SC", "SCC", "SC.IE", "SC.MU", "SC.NDPS", "SC.SPL", "S.O.P", "STC", "T.R.CRMP", "T.R.O.P"].map(c => ({ value: c, label: c })),
    'TR': [],
    'CC': []
};

const SecureVault = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');

    const isAdmin = true; // Temporary override for testing access

    const [time, setTime] = useState(new Date());
    const [cases, setCases] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // --- NAVIGATION ENGINE ---
    const [level, setLevel] = useState(1);
    const [path, setPath] = useState({ court: null, type: null, caseObj: null, folderStack: [] });

    // --- FILTER STATE ---
    const [filterMode, setFilterMode] = useState('ACTIVE');

    // --- UNIVERSAL FILE EXPLORER STATE ---
    const [caseContent, setCaseContent] = useState({ files: [], folders: [] });
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // --- SECURITY & MODAL STATE ---
    const [unlockedCases, setUnlockedCases] = useState([]);
    const [showPasscodeModal, setShowPasscodeModal] = useState({ visible: false, targetCase: null, mode: 'VERIFY' });
    const [passcode, setPasscode] = useState('');
    const [actionModal, setActionModal] = useState({ visible: false, type: '', item: null, nameValue: '' });

    const virtualCaseId = () => {
        if (level === 1) return 'ROOT';
        if (level === 2) return `COURT_${path.court.code}`;
        if (level === 3) return `TYPE_${path.court.code}_${path.type.value}`;
        if (level === 4) return path.caseObj.id;
        return 'ROOT';
    };

    const currentFolderId = path.folderStack.length > 0 ? path.folderStack[path.folderStack.length - 1].id : null;

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        fetchCases();
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchCaseContent();
    }, [level, path.court, path.type, path.caseObj]);

    const fetchCases = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8080/api/cases');
            if (res.ok) setCases(await res.json());
        } catch (error) { }
    };

    const fetchCaseContent = async () => {
        try {
            const vId = virtualCaseId();
            const res = await fetch(`http://127.0.0.1:8080/api/vault/content/${vId}`);
            if (res.ok) setCaseContent(await res.json());
        } catch (error) { }
    };

    const goBack = () => {
        if (path.folderStack.length > 0) {
            setPath(prev => ({ ...prev, folderStack: prev.folderStack.slice(0, -1) }));
        } else {
            if (level === 4) setLevel(3);
            else if (level === 3) setLevel(2);
            else if (level === 2) setLevel(1);
            setPath(prev => ({ ...prev, caseObj: level === 4 ? null : prev.caseObj, type: level === 3 ? null : prev.type, court: level === 2 ? null : prev.court }));
        }
        setSearchQuery('');
    };

    const handleNavigate = (newLevel, data) => {
        setLevel(newLevel);
        setPath({ ...path, ...data, folderStack: [] });
        setSearchQuery('');
    };

    const enterSubfolder = (folder) => {
        setPath(prev => ({ ...prev, folderStack: [...prev.folderStack, folder] }));
        setSearchQuery('');
    };

    const handleCaseClick = (caseObj) => {
        if (caseObj.is_locked && !unlockedCases.includes(caseObj.id)) {
            setShowPasscodeModal({ visible: true, targetCase: caseObj, mode: 'VERIFY' });
        } else {
            handleNavigate(4, { caseObj });
        }
    };

    const handlePasscodeSubmit = async (e) => {
        e.preventDefault();
        const target = showPasscodeModal.targetCase;
        if (showPasscodeModal.mode === 'VERIFY') {
            try {
                const res = await fetch(`http://127.0.0.1:8080/api/vault/verify-passcode/${target.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode }) });
                if (res.ok) {
                    setUnlockedCases([...unlockedCases, target.id]);
                    setShowPasscodeModal({ visible: false, targetCase: null, mode: 'VERIFY' });
                    setPasscode(''); handleNavigate(4, { caseObj: target });
                } else alert("Incorrect Passcode.");
            } catch (error) { }
        } else if (showPasscodeModal.mode === 'SET') {
            try {
                const isLocking = passcode.length > 0;
                await fetch(`http://127.0.0.1:8080/api/vault/toggle-lock/${target.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_locked: isLocking, passcode: isLocking ? passcode : null }) });
                target.is_locked = isLocking;
                if (!isLocking) setUnlockedCases(unlockedCases.filter(id => id !== target.id));
                else setUnlockedCases([...unlockedCases, target.id]);
                setShowPasscodeModal({ visible: false, targetCase: null, mode: 'VERIFY' });
                setPasscode(''); fetchCases();
            } catch (error) { }
        }
    };

    const submitActionModal = async (e) => {
        e.preventDefault();
        const { type, item, nameValue } = actionModal;
        if (!nameValue.trim()) return;

        try {
            if (type === 'NEW_FOLDER') {
                await fetch('http://127.0.0.1:8080/api/vault/folders/add', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: nameValue, case_id: virtualCaseId(), parent_id: currentFolderId })
                });
            } else if (type === 'RENAME_FOLDER') {
                await fetch(`http://127.0.0.1:8080/api/vault/folders/rename/${item.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nameValue })
                });
            } else if (type === 'RENAME_FILE') {
                await fetch(`http://127.0.0.1:8080/api/vault/files/rename/${item.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nameValue })
                });
            }
            fetchCaseContent();
            setActionModal({ visible: false, type: '', item: null, nameValue: '' });
        } catch (error) { alert("Action failed."); }
    };

    const handleDeleteItem = async (id, isFolder) => {
        if (!window.confirm(`Permanently delete this ${isFolder ? 'folder AND all its contents' : 'file'}?`)) return;
        try {
            const endpoint = isFolder ? `folders/delete/${id}` : `files/delete/${id}`;
            await fetch(`http://127.0.0.1:8080/api/vault/${endpoint}`, { method: 'DELETE' });
            fetchCaseContent();
        } catch (error) { alert("Delete failed."); }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('case_id', virtualCaseId());
        if (currentFolderId) formData.append('folder_id', currentFolderId);
        formData.append('uploader', storedUser.username);

        try {
            await fetch('http://127.0.0.1:8080/api/vault/upload', { method: 'POST', body: formData });
            fetchCaseContent();
        } catch (error) { alert("Upload error."); }
        finally { setIsUploading(false); e.target.value = null; }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // --- UNIVERSAL FILE EXPLORER TABLE (No dropzones, just buttons) ---
    const renderUniversalExplorer = () => {
        const displayFolders = caseContent.folders.filter(f => (currentFolderId ? f.parent_id === currentFolderId : !f.parent_id));
        const displayFiles = caseContent.files.filter(f => (currentFolderId ? f.folder_id === currentFolderId : !f.folder_id));

        return (
            <div className="flex-1 flex flex-col h-full space-y-4 mt-8 border-t border-stone-200 dark:border-white/10 pt-6">

                {/* SLEEK SUB-HEADER TOOLBAR (Buttons Only) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-[#121212] p-4 rounded-xl shadow-sm border border-stone-200 dark:border-white/5 gap-4">
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                            <i className="fa fa-hdd text-amber-500"></i> {path.caseObj ? 'Case Directory' : 'Local Directory'}
                            {path.caseObj?.is_locked && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[8px] animate-pulse ml-2">CONFIDENTIAL</span>}
                        </h4>
                    </div>

                    <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-1 sm:flex-none bg-amber-500 text-black px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 shadow-sm transition-colors flex items-center justify-center">
                            <i className={`fa ${isUploading ? 'fa-circle-notch fa-spin' : 'fa-cloud-arrow-up'} mr-2`}></i> {isUploading ? 'Uploading...' : 'Upload File'}
                        </button>

                        <button onClick={() => setActionModal({ visible: true, type: 'NEW_FOLDER', item: null, nameValue: '' })} className="flex-1 sm:flex-none bg-stone-800 text-white dark:bg-white dark:text-black px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-80 shadow-sm transition-opacity flex items-center justify-center">
                            <i className="fa fa-folder-plus mr-2"></i> New Folder
                        </button>

                        {level === 4 && isAdmin && (
                            <button onClick={() => { setPasscode(''); setShowPasscodeModal({ visible: true, targetCase: path.caseObj, mode: 'SET' }); }} className="flex-1 sm:flex-none bg-red-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors shadow-sm flex items-center justify-center">
                                <i className={`fa ${path.caseObj.is_locked ? 'fa-lock-open' : 'fa-lock'} mr-2`}></i> {path.caseObj.is_locked ? 'Unlock' : 'Lock'}
                            </button>
                        )}
                    </div>
                </div>

                {/* CLEAN FILE TABLE */}
                <div className="flex-1 bg-white dark:bg-[#121212] rounded-2xl border border-stone-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scroll">
                        {displayFolders.length === 0 && displayFiles.length === 0 ? (
                            <div className="text-center py-16 opacity-50 flex flex-col items-center">
                                <i className="fa fa-folder-open text-4xl text-stone-400 mb-3"></i>
                                <p className="text-xs font-black uppercase tracking-widest text-stone-500">Directory Empty</p>
                            </div>
                        ) : (
                            <table className="w-full text-left whitespace-nowrap">
                                <tbody className="divide-y divide-stone-100 dark:divide-white/5 text-xs">

                                    {/* FOLDERS */}
                                    {displayFolders.map(f => (
                                        <tr key={f.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3 cursor-pointer w-full hover:text-amber-500" onClick={() => enterSubfolder(f)}>
                                                <i className="fa fa-folder text-amber-500 text-lg"></i>
                                                <span className="truncate w-full max-w-[200px] md:max-w-md">{f.name}</span>
                                            </td>
                                            <td className="px-5 py-4 text-stone-400 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell">Folder</td>
                                            <td className="px-5 py-4 text-right space-x-2">
                                                <button onClick={(e) => { e.stopPropagation(); setActionModal({ visible: true, type: 'RENAME_FOLDER', item: f, nameValue: f.name }); }} className="bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 px-3 py-2 rounded-lg transition-colors font-black uppercase text-[9px] tracking-widest"><i className="fa fa-pen"></i></button>
                                                {isAdmin && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(f.id, true); }} className="bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 px-3 py-2 rounded-lg transition-colors font-black uppercase text-[9px] tracking-widest"><i className="fa fa-trash"></i></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {/* FILES */}
                                    {displayFiles.map(f => (
                                        <tr key={f.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                                <i className={`fa ${f.file_name.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf text-red-500' : 'fa-file-word text-blue-500'} text-lg`}></i>
                                                <span className="truncate max-w-[200px] md:max-w-md">{f.file_name}</span>
                                            </td>
                                            <td className="px-5 py-4 text-stone-400 font-mono text-[10px] hidden sm:table-cell">{formatBytes(f.size)}</td>
                                            <td className="px-5 py-4 text-right space-x-2">
                                                <a href={`http://127.0.0.1:8080/api/vault/download/${f.id}`} className="inline-block bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300 hover:bg-amber-500 hover:text-black dark:hover:bg-amber-500 dark:hover:text-black px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"><i className="fa fa-download"></i></a>
                                                <button onClick={() => setActionModal({ visible: true, type: 'RENAME_FILE', item: f, nameValue: f.file_name })} className="bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 px-3 py-2 rounded-lg transition-colors font-black uppercase text-[9px] tracking-widest"><i className="fa fa-pen"></i></button>
                                                {isAdmin && (
                                                    <button onClick={() => handleDeleteItem(f.id, false)} className="bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 px-3 py-2 rounded-lg transition-colors font-black uppercase text-[9px] tracking-widest"><i className="fa fa-trash"></i></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors relative">

            {/* TOP HEADER */}
            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0 z-10 transition-colors">
                <div className="min-w-0">
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Secure Vault</h2>

                    {/* BREADCRUMB PATH */}
                    <div className="flex items-center gap-2 text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1.5 font-mono overflow-x-auto no-scrollbar">
                        <span onClick={() => { setLevel(1); setPath({ folderStack: [] }); }} className="cursor-pointer hover:text-amber-500 whitespace-nowrap"><i className="fa fa-hdd mr-1"></i> Root</span>
                        {level > 1 && path.court && <><i className="fa fa-chevron-right text-[8px]"></i> <span onClick={() => { setLevel(2); setPath({ ...path, type: null, caseObj: null, folderStack: [] }); }} className="cursor-pointer hover:text-amber-500 whitespace-nowrap">{path.court.code}</span></>}
                        {level > 2 && path.type && <><i className="fa fa-chevron-right text-[8px]"></i> <span onClick={() => { setLevel(3); setPath({ ...path, caseObj: null, folderStack: [] }); }} className="cursor-pointer hover:text-amber-500 whitespace-nowrap">{path.type.value}</span></>}
                        {level > 3 && path.caseObj && <><i className="fa fa-chevron-right text-[8px]"></i> <span onClick={() => { setPath(prev => ({ ...prev, folderStack: [] })) }} className="cursor-pointer hover:text-amber-500 whitespace-nowrap">{path.caseObj.case_id}</span></>}
                        {path.folderStack.map((f, i) => (
                            <React.Fragment key={f.id}>
                                <i className="fa fa-chevron-right text-[8px] text-amber-500"></i>
                                <span onClick={() => setPath(prev => ({ ...prev, folderStack: prev.folderStack.slice(0, i + 1) }))} className="cursor-pointer hover:text-amber-500 text-slate-900 dark:text-white whitespace-nowrap">{f.name}</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scroll flex flex-col">
                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">

                    {/* SEARCH & FILTER BAR */}
                    <div className="flex justify-between items-center mb-6 shrink-0 flex-wrap gap-4">
                        <div className="flex gap-4 items-center flex-1">
                            {path.folderStack.length > 0 || level > 1 ? (
                                <button onClick={goBack} className="w-12 h-12 rounded-full bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 flex items-center justify-center text-stone-500 hover:text-amber-500 shadow-sm shrink-0 transition-all"><i className="fa fa-arrow-left text-lg"></i></button>
                            ) : <div className="w-12 h-12 hidden md:block"></div>}
                            <div className="relative w-full max-w-md">
                                <i className="fa fa-search absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"></i>
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Directory..." className="w-full bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-xl h-12 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 shadow-sm transition-all" />
                            </div>
                        </div>

                        {/* TOGGLE BUTTONS (Replaces the Flip Cards) */}
                        {level === 2 && path.folderStack.length === 0 && (
                            <div className="flex gap-2 bg-white dark:bg-[#121212] p-1.5 rounded-xl border border-stone-200 dark:border-white/5 shadow-sm">
                                <button
                                    onClick={() => setFilterMode('ACTIVE')}
                                    className={`px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'ACTIVE' ? 'bg-amber-500 text-black shadow-md' : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
                                    <i className="fa fa-folder-open mr-1.5"></i> Active
                                </button>
                                <button
                                    onClick={() => setFilterMode('ALL')}
                                    className={`px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
                                    <i className="fa fa-layer-group mr-1.5"></i> All
                                </button>
                            </div>
                        )}
                    </div>

                    {/* DYNAMIC GRIDS (Hidden when inside a custom folder) */}
                    {path.folderStack.length === 0 && (
                        <>
                            {/* LEVEL 1: COURTS */}
                            {level === 1 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 animate-fade-in">
                                    {COURTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(court => (
                                        <div key={court.code} onClick={() => handleNavigate(2, { court })} className="flex flex-col items-center text-center p-6 bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-2xl cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 hover:border-amber-500/50 shadow-sm transition-all group">
                                            <i className={`fa ${court.icon} text-5xl text-amber-500 mb-4 drop-shadow-md group-hover:scale-110 transition-transform`}></i>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{court.name}</h4>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* LEVEL 2: CATEGORIES (Filtered) */}
                            {level === 2 && (
                                <div className="animate-fade-in grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {(() => {
                                        const cats = COURT_CATEGORIES[path.court.code] || [];
                                        let mapped = cats.map(cat => ({ ...cat, count: cases.filter(c => c.caseCategory === cat.value).length }));

                                        // Sort: Active ones pinned to top, then alphabetical
                                        mapped.sort((a, b) => {
                                            if (a.count > 0 && b.count === 0) return -1;
                                            if (a.count === 0 && b.count > 0) return 1;
                                            return a.label.localeCompare(b.label);
                                        });

                                        if (filterMode === 'ACTIVE') mapped = mapped.filter(c => c.count > 0);
                                        mapped = mapped.filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()));

                                        return mapped.map(cat => (
                                            <div key={cat.value} onClick={() => handleNavigate(3, { type: cat })} className="flex flex-col items-center text-center p-6 bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-2xl cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 hover:border-amber-500/50 shadow-sm transition-all group">
                                                <i className={`fa fa-folder text-5xl ${cat.count > 0 ? 'text-amber-500' : 'text-stone-300 dark:text-stone-800'} mb-4 drop-shadow-md group-hover:scale-110 transition-transform`}></i>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{cat.value}</h4>
                                                <p className="text-[9px] text-stone-500 mt-1 font-bold">{cat.count} Folders</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            )}

                            {/* LEVEL 3: CASES */}
                            {level === 3 && (
                                <div className="animate-fade-in grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {cases.filter(c => c.caseCategory === path.type.value)
                                        .filter(c => c.case_id.toLowerCase().includes(searchQuery.toLowerCase()) || c.client_name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(c => (
                                            <div key={c.id} onClick={() => handleCaseClick(c)} className="relative flex flex-col items-center text-center p-6 bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 rounded-2xl cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 hover:border-amber-500/50 shadow-sm transition-all group">
                                                {c.is_locked && <div className="absolute top-3 right-3 text-red-500 bg-red-500/10 p-1.5 rounded-md"><i className={`fa ${unlockedCases.includes(c.id) ? 'fa-lock-open text-green-500' : 'fa-lock'}`}></i></div>}
                                                <i className={`fa fa-folder-open text-5xl ${c.is_locked && !unlockedCases.includes(c.id) ? 'text-stone-300 dark:text-stone-800' : 'text-amber-500'} mb-4 drop-shadow-md group-hover:scale-110 transition-transform`}></i>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white truncate w-full">{c.case_id}</h4>
                                                <p className="text-[9px] text-stone-500 mt-1 font-bold truncate w-full">{c.client_name}</p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* UNIVERSAL EXPLORER (Shown below grids or full screen if in subfolder) */}
                    {renderUniversalExplorer()}
                </div>
            </div>

            {/* --- MODALS --- */}
            {actionModal.visible && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setActionModal({ visible: false, type: '', item: null, nameValue: '' })}>
                    <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl modal-pop" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                            <i className={`fa text-amber-500 ${actionModal.type === 'NEW_FOLDER' ? 'fa-folder-plus' : 'fa-pen'}`}></i>
                            {actionModal.type === 'NEW_FOLDER' ? 'Create Subfolder' : 'Rename Item'}
                        </h3>
                        <form onSubmit={submitActionModal}>
                            <input autoFocus type="text" value={actionModal.nameValue} onChange={(e) => setActionModal({ ...actionModal, nameValue: e.target.value })} placeholder="Enter new name..." className="w-full bg-stone-50 dark:bg-black border-2 border-stone-200 dark:border-stone-800 rounded-xl px-4 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 mb-6 transition-colors" />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setActionModal({ visible: false, type: '', item: null, nameValue: '' })} className="flex-1 py-3 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500 text-xs font-black uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-amber-500 text-black text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-amber-500/20">Save Details</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPasscodeModal.visible && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4" onClick={() => setShowPasscodeModal({ visible: false, targetCase: null, mode: 'VERIFY' })}>
                    <div className="bg-white dark:bg-[#121212] border border-red-500/30 p-10 rounded-3xl shadow-2xl w-full max-w-sm text-center modal-pop" onClick={e => e.stopPropagation()}>
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><i className="fa fa-lock text-4xl"></i></div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">{showPasscodeModal.mode === 'VERIFY' ? 'Clearance Required' : 'Security Settings'}</h3>
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-8">{showPasscodeModal.mode === 'VERIFY' ? 'Enter Passcode to access Confidential Vault.' : 'Enter a new passcode, or leave blank to unlock.'}</p>
                        <form onSubmit={handlePasscodeSubmit}>
                            <input type="password" value={passcode} onChange={e => setPasscode(e.target.value)} autoFocus required={showPasscodeModal.mode === 'VERIFY'} placeholder="••••••" className="w-full bg-stone-100 dark:bg-black border-2 border-stone-300 dark:border-stone-800 rounded-xl p-4 text-center text-2xl font-mono tracking-[0.5em] text-slate-900 dark:text-white outline-none focus:border-red-500 mb-6 transition-colors" />
                            <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">{showPasscodeModal.mode === 'VERIFY' ? 'Decrypt Vault' : 'Apply Security Update'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecureVault;