import React, { useState, useEffect } from 'react';
import '../styles/BareActs.css';

const BareActs = () => {
    const [viewMode, setViewMode] = useState('GRID'); // GRID, ACT_DETAIL, SEARCH_RESULTS
    const [searchQuery, setSearchQuery] = useState('');
    const [dossierQuery, setDossierQuery] = useState('');
    const [activeAct, setActiveAct] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [actsDatabase, setActsDatabase] = useState([]);
    const [isDbLoaded, setIsDbLoaded] = useState(false);

    // ALPHABETIC FILTER STATE
    const [selectedLetter, setSelectedLetter] = useState('ALL');
    const alphabet = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

    // ==========================================
    // 🛠️ DEFAULT & NEW ACTS
    // ==========================================
    const defaultActs = [
        { id: "boiler_2025", actNumber: "110", year: "2025", title: "The Boilers Act, 2025", sections: [{ secNum: "1", title: "Short title", content: "This Act may be called the Boilers Act, 2025." }] },
        { id: "lading_2025", actNumber: "105", year: "2025", title: "The Bills of Lading Act, 2025", sections: [{ secNum: "1", title: "Short title", content: "This Act may be called the Bills of Lading Act, 2025." }] },
        { id: "tribhuvan_2025", actNumber: "0", year: "2025", title: "The Tribhuvan Sahkari University Act, 2025", sections: [{ secNum: "1", title: "Short title", content: "This Act may be called the Tribhuvan Sahkari University Act, 2025." }] },
        { id: "disaster_2025", actNumber: "0", year: "2025", title: "The Disaster Management Act, 2025", sections: [{ secNum: "1", title: "Short title", content: "This Act may be called the Disaster Management Act, 2025." }] },
        { id: "pe_2024", actNumber: "1", year: "2024", title: "The Public Examinations (Prevention of Unfair Means) Act, 2024", sections: [{ secNum: "1", title: "Short title", content: "This Act may be called the Public Examinations (Prevention of Unfair Means) Act, 2024." }] },
        {
            id: "bns_2023", actNumber: "45", year: "2023", title: "Bharatiya Nyaya Sanhita, 2023", sections: [
                { secNum: "303", title: "Theft", content: "(1) Whoever, intending to take dishonestly any movable property out of the possession of any person without that person’s consent, moves that property in order to such taking, is said to commit theft.\n\n(2) Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both." },
                { secNum: "304", title: "Snatching", content: "(1) Theft is snatching if, in order to commit theft, the offender suddenly or quickly or forcibly seizes or secures or grabs or takes away from any person or from his possession any movable property." },
                { secNum: "103", title: "Punishment for Murder", content: "(1) Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine." }
            ]
        },
        { id: "bnss_2023", actNumber: "46", year: "2023", title: "Bharatiya Nagarik Suraksha Sanhita, 2023", sections: [{ secNum: "1", title: "Short title and commencement", content: "This Act may be called the Bharatiya Nagarik Suraksha Sanhita, 2023." }] },
        { id: "bsa_2023", actNumber: "47", year: "2023", title: "Bharatiya Sakshya Adhiniyam, 2023", sections: [{ secNum: "1", title: "Short Title", content: "This Act may be called the Bharatiya Sakshya Adhiniyam, 2023." }] },
        { id: "netting_2020", actNumber: "30", year: "2020", title: "Bilateral Netting of Qualified Financial Contracts Act, 2020", sections: [{ secNum: "5", title: "Enforceability of bilateral netting", content: "Notwithstanding anything contained in any other law for the time being in force, bilateral netting of a qualified financial contract shall be enforceable." }] },
        { id: "art_2021", actNumber: "42", year: "2021", title: "Assisted Reproductive Technology (Regulation) Act, 2021", sections: [{ secNum: "21", title: "General duties of clinics", content: "Clinics and banks shall ensure that commissioning couple, woman and donor are eligible to avail the assisted reproductive technology procedures." }] }
    ];

    // Helper: Ignores "The " for smart alphabetical sorting
    const getCleanTitle = (title) => {
        return String(title || "").replace(/^The\s+/i, '').trim();
    };

    useEffect(() => {
        const loadDatabase = async () => {
            let mergedData = [...defaultActs];
            try {
                const res = await fetch('/data/compiled_acts_db.json');
                if (res.ok) {
                    const text = await res.text();
                    try {
                        const data = JSON.parse(text);
                        mergedData = [...defaultActs, ...data];
                    } catch (e) { console.error("JSON Error", e); }
                }
            } catch (e) { console.error("Fetch Error", e); }

            // ALPHABETICAL SORTING (A-Z)
            mergedData.sort((a, b) => getCleanTitle(a.title).localeCompare(getCleanTitle(b.title)));

            setActsDatabase(mergedData);
            setIsDbLoaded(true);
        };
        loadDatabase();
    }, []);

    // 🛡️ CRASH PREVENTION: Safe String Converter
    const safeString = (val) => String(val || "").toLowerCase().trim();

    // ==========================================
    // 🧠 GLOBAL SMART SEARCH ENGINE
    // ==========================================
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query.trim()) {
            setViewMode('GRID');
            setSearchResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase().trim();
        let results = [];

        actsDatabase.forEach(act => {
            (act.sections || []).forEach(sec => {
                const sTitle = safeString(sec.title);
                const sContent = safeString(sec.content);

                const titleMatch = sTitle.includes(lowerQuery);
                const contentMatch = sContent.includes(lowerQuery);

                if (titleMatch || contentMatch) {
                    let score = 0;
                    if (sTitle === lowerQuery) score += 100; // Exact title match
                    else if (titleMatch) score += 50; // Partial title match
                    if (contentMatch) score += 10; // Content match

                    results.push({
                        ...sec,
                        actTitle: act.title,
                        actYear: act.year,
                        score: score
                    });
                }
            });
        });

        results.sort((a, b) => b.score - a.score);
        setSearchResults(results);
        setViewMode('SEARCH_RESULTS');
    };

    const clearSearch = () => {
        setSearchQuery('');
        setViewMode('GRID');
    };

    const openAct = (act) => {
        setActiveAct(act);
        setViewMode('ACT_DETAIL');
        setSearchQuery('');
        setDossierQuery('');
    };

    const closeAct = () => {
        setActiveAct(null);
        setViewMode('GRID');
    };

    // ==========================================
    // 📝 NESTED CONTENT RENDERER
    // ==========================================
    const formatContent = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, key) => {
            const match = line.match(/^ */);
            const leadingSpaces = match ? match[0].length : 0;
            const paddingLeft = (leadingSpaces / 4) * 20;

            return (
                <div key={key} style={{ paddingLeft: `${paddingLeft}px`, marginBottom: line.trim() ? '8px' : '0px' }}>
                    <span className="text-[15px] font-serif leading-relaxed text-slate-700 dark:text-stone-300">
                        {line.trim()}
                    </span>
                </div>
            );
        });
    };

    // ==========================================
    // 🔍 DOSSIER INTERNAL FILTER (Crash-Proof)
    // ==========================================
    const filteredDossierSections = (activeAct?.sections || []).filter(sec => {
        const lq = safeString(dossierQuery);
        return safeString(sec.title).includes(lq) ||
            safeString(sec.secNum).includes(lq) ||
            safeString(sec.content).includes(lq);
    });

    // ==========================================
    // 🔠 ALPHABETIC GRID FILTER
    // ==========================================
    const displayedActs = actsDatabase.filter(act => {
        if (selectedLetter === 'ALL') return true;
        const firstChar = getCleanTitle(act.title).charAt(0).toUpperCase();
        return firstChar === selectedLetter;
    });

    // ==========================================
    // 🎨 RENDERERS
    // ==========================================
    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] text-left absolute inset-0 overflow-hidden z-0">

            {/* MAIN HEADER */}
            {viewMode !== 'ACT_DETAIL' && (
                <div className="bg-white dark:bg-[#0f0f10] border-b border-stone-200 dark:border-white/5 p-6 md:p-10 shrink-0 z-20 shadow-sm relative">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="font-black text-3xl text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                    <i className="fa fa-scale-balanced text-amber-500"></i> Bare Acts Dossier
                                </h2>
                                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Unified Legislative Database • {isDbLoaded ? actsDatabase.length : 0} Acts Indexed</p>
                            </div>
                        </div>

                        {/* GLOBAL SEARCH BAR */}
                        <div className={`relative flex items-center w-full bg-stone-50 dark:bg-[#121212] border-2 transition-all shadow-md rounded-2xl ${searchQuery ? 'border-amber-500' : 'border-stone-200 dark:border-white/10 hover:border-amber-500/50'}`}>
                            <i className="fa fa-search absolute left-6 text-stone-400 text-lg"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search deep into sections across all acts (e.g. 'Theft', 'Murder')..."
                                className="flex-1 bg-transparent py-5 pl-14 pr-16 text-lg font-bold text-slate-900 dark:text-white outline-none"
                            />
                            {searchQuery && (
                                <button onClick={clearSearch} className="absolute right-4 text-stone-400 hover:text-red-500 w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-200 dark:hover:bg-white/10 transition-colors">
                                    <i className="fa fa-times-circle text-2xl"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scroll relative">
                <div className="max-w-6xl mx-auto w-full pb-20">

                    {/* --- VIEW 1: ACTS GRID --- */}
                    {viewMode === 'GRID' && (
                        <div className="animate-fade-in">

                            {/* ALPHABET SORTING BAR */}
                            <div className="mb-8 flex overflow-x-auto custom-scroll pb-2 gap-2 border-b border-stone-200 dark:border-white/5">
                                {alphabet.map(letter => (
                                    <button
                                        key={letter}
                                        onClick={() => setSelectedLetter(letter)}
                                        className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedLetter === letter ? 'bg-amber-500 text-black shadow-md' : 'bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 text-stone-500 hover:text-amber-500 hover:border-amber-500'}`}
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>

                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">
                                {selectedLetter === 'ALL' ? 'All Available Acts' : `Acts starting with '${selectedLetter}'`} ({displayedActs.length})
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedActs.length > 0 ? displayedActs.map((act, index) => (
                                    <div key={`${act.id}_${index}`} onClick={() => openAct(act)} className="act-card group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                                Act {act.actNumber} of {act.year}
                                            </span>
                                            <i className="fa fa-arrow-right text-stone-300 dark:text-stone-600 group-hover:text-amber-500 transition-colors -rotate-45"></i>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                            {act.title}
                                        </h3>
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-auto pt-4 border-t border-stone-100 dark:border-white/5">
                                            <i className="fa fa-file-lines mr-1.5 opacity-50"></i> {(act.sections || []).length} Sections
                                        </p>
                                    </div>
                                )) : (
                                    <div className="col-span-full text-center py-20 opacity-30">
                                        <i className="fa fa-folder-open text-5xl mb-4 text-stone-400"></i>
                                        <h4 className="text-lg font-black uppercase tracking-widest">No Acts found for "{selectedLetter}"</h4>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- VIEW 2: GLOBAL SEARCH RESULTS --- */}
                    {viewMode === 'SEARCH_RESULTS' && (
                        <div className="animate-fade-in">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-200 dark:border-white/5 pb-2">
                                Found {searchResults.length} instances matching "{searchQuery}"
                            </p>

                            {searchResults.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <i className="fa fa-folder-open text-6xl text-stone-400 mb-4"></i>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">No Results Found</h4>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {searchResults.map((sec, idx) => (
                                        <div key={idx} className={`bg-white dark:bg-[#121212] border ${sec.score >= 50 ? 'border-amber-500/50 shadow-md' : 'border-stone-200 dark:border-white/10 shadow-sm'} rounded-[1.5rem] p-6 relative overflow-hidden animate-slide-up`} style={{ animationDelay: `${idx * 0.03}s` }}>
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <span className="text-[9px] font-black bg-stone-100 dark:bg-white/5 text-stone-500 px-3 py-1 rounded-md uppercase tracking-widest border border-stone-200 dark:border-stone-800">
                                                    {sec.actTitle}
                                                </span>
                                                {sec.score >= 50 && (
                                                    <span className="text-[9px] font-black bg-amber-500 text-black px-3 py-1 rounded-md uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                                        <i className="fa fa-bullseye"></i> Primary Definition
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 dark:text-amber-500 mb-4">
                                                <span className="opacity-50 text-sm mr-2">Sec {sec.secNum}:</span> {sec.title}
                                            </h4>
                                            <div className="bg-stone-50 dark:bg-[#1a1a1a] p-5 rounded-2xl border border-stone-100 dark:border-white/5">
                                                {formatContent(sec.content)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- VIEW 3: SINGLE ACT DOSSIER --- */}
                    {viewMode === 'ACT_DETAIL' && activeAct && (
                        <div className="animate-slide-up bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col min-h-[70vh]">
                            <div className="bg-stone-50 dark:bg-[#0f0f10] p-8 border-b border-stone-200 dark:border-white/5 flex flex-col lg:flex-row lg:items-center gap-6 sticky top-0 z-30">
                                <button onClick={closeAct} className="w-12 h-12 shrink-0 bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-white/10 rounded-full flex items-center justify-center text-stone-500 hover:text-amber-500 hover:border-amber-500 transition-all shadow-sm">
                                    <i className="fa fa-arrow-left"></i>
                                </button>
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 block">
                                        Act No. {activeAct.actNumber} of {activeAct.year}
                                    </span>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {activeAct.title}
                                    </h3>
                                </div>
                                <div className="relative flex items-center w-full lg:w-80 bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl focus-within:border-amber-500 transition-all shadow-sm">
                                    <i className="fa fa-filter absolute left-4 text-stone-400 text-sm"></i>
                                    <input
                                        type="text"
                                        value={dossierQuery}
                                        onChange={(e) => setDossierQuery(e.target.value)}
                                        placeholder="Find in this Act..."
                                        className="w-full bg-transparent py-3 pl-10 pr-10 text-sm font-bold text-slate-900 dark:text-white outline-none"
                                    />
                                    {dossierQuery && (
                                        <button onClick={() => setDossierQuery('')} className="absolute right-3 text-stone-400 hover:text-red-500 transition-colors">
                                            <i className="fa fa-times-circle"></i>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 flex-1">
                                {filteredDossierSections.length > 0 ? (
                                    filteredDossierSections.map((sec, idx) => (
                                        <div key={idx} className="section-item group py-8 border-b border-stone-100 dark:border-white/5 last:border-0">
                                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                                                <span className="text-amber-600 dark:text-amber-500 text-[11px] bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-md uppercase tracking-widest shrink-0 border border-amber-200 dark:border-amber-500/20">
                                                    Section {sec.secNum}
                                                </span>
                                                <span>{sec.title}</span>
                                            </h4>
                                            <div className="bg-stone-50/50 dark:bg-white/5 p-6 rounded-2xl border border-stone-100 dark:border-white/5">
                                                {formatContent(sec.content)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 opacity-30">
                                        <i className="fa fa-filter-circle-xmark text-5xl mb-4 text-stone-400"></i>
                                        <h4 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">No matching sections found</h4>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BareActs;