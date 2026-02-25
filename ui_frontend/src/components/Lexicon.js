import React, { useState, useEffect } from 'react';
import '../styles/Lexicon.css';

const Lexicon = () => {
    // --- DICTIONARY DATA STATES ---
    const [dictionaries, setDictionaries] = useState({ legal: {}, general: {} });
    const [dictsLoaded, setDictsLoaded] = useState(false);
    const [termCount, setTermCount] = useState({ legal: 0, general: 0 });
    const [fetchError, setFetchError] = useState('');

    // --- SEARCH STATES ---
    const [dictQuery, setDictQuery] = useState('');
    const [dictSuggestions, setDictSuggestions] = useState([]);
    const [activeWord, setActiveWord] = useState(null);
    const [dictDefinitions, setDictDefinitions] = useState({ legal: '', general: '' });

    // --- HISTORY & BOOKMARKS ---
    const [history, setHistory] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);

    useEffect(() => {
        // Load History/Bookmarks from LocalStorage
        const savedHistory = JSON.parse(localStorage.getItem('lexiconHistory') || '[]');
        const savedBookmarks = JSON.parse(localStorage.getItem('lexiconBookmarks') || '[]');
        setHistory(savedHistory);
        setBookmarks(savedBookmarks);

        // 🚀 INDESTRUCTIBLE BACKGROUND FILE HUNTER
        const loadDictionaries = async () => {

            // This safely forces JSON parsing and ignores hidden HTML 404 pages
            const fetchJsonSafely = async (paths) => {
                for (let path of paths) {
                    try {
                        const res = await fetch(path);
                        if (!res.ok) continue;

                        const text = await res.text();
                        try {
                            const data = JSON.parse(text);
                            return data; // Success!
                        } catch (err) {
                            // It was probably an HTML fallback page, ignore and try next path
                        }
                    } catch (e) {
                        // Network error, try next path
                    }
                }
                return null;
            };

            // 1. Hunt for Black's Law
            const legalRaw = await fetchJsonSafely([
                '/data/blacks_second_edition_terms.json',
                '/blacks_second_edition_terms.json',
                '/data/blacks_dictionary.json'
            ]);

            // 2. Hunt for General English
            const genRaw = await fetchJsonSafely([
                '/data/dictionary.json',
                '/dictionary.json',
                '/data/english_dictionary.json'
            ]);

            if (!legalRaw && !genRaw) {
                setFetchError("Please ensure JSON files are placed exactly in the 'public/data/' folder.");
            }

            // 🛠️ UNIVERSAL JSON PARSER
            const parseJSON = (data) => {
                const normalized = {};
                if (!data) return normalized;
                try {
                    if (Array.isArray(data)) {
                        data.forEach(item => {
                            const word = String(item.term || item.word || Object.values(item)[0] || "").toLowerCase().trim();
                            const def = String(item.definition || item.meaning || Object.values(item)[1] || "");
                            if (word && def) normalized[word] = def;
                        });
                    } else if (data.term && data.definition && typeof data.term === 'object') {
                        // Pandas Format handling (Black's Law)
                        Object.keys(data.term).forEach(key => {
                            const word = String(data.term[key] || "").toLowerCase().trim();
                            const def = String(data.definition[key] || "");
                            if (word && def) normalized[word] = def;
                        });
                    } else {
                        // Standard Key-Value format (dictionary.json)
                        Object.keys(data).forEach(k => {
                            const word = String(k).toLowerCase().trim();
                            const val = data[k];
                            const def = typeof val === 'object' ? String(val.definition || val.meaning || Object.values(val)[0] || "") : String(val);
                            if (word && def) normalized[word] = def;
                        });
                    }
                } catch (e) { console.error("JSON Parsing Error", e); }
                return normalized;
            };

            const parsedLegal = parseJSON(legalRaw);
            const parsedGen = parseJSON(genRaw);

            setDictionaries({ legal: parsedLegal, general: parsedGen });
            setTermCount({ legal: Object.keys(parsedLegal).length, general: Object.keys(parsedGen).length });
            setDictsLoaded(true);
        };

        loadDictionaries();
    }, []);

    // --- SMART SEARCH ENGINE ---
    const handleSearchInput = (e) => {
        const val = e.target.value;
        setDictQuery(val);

        if (!val.trim() || !dictsLoaded) {
            setDictSuggestions([]);
            return;
        }

        const lowerVal = val.toLowerCase();
        const matches = new Set();
        const legalKeys = Object.keys(dictionaries.legal);
        const generalKeys = Object.keys(dictionaries.general);

        for (let i = 0; i < legalKeys.length; i++) {
            if (legalKeys[i].startsWith(lowerVal)) matches.add(legalKeys[i]);
            if (matches.size >= 12) break;
        }

        if (matches.size < 5) {
            for (let i = 0; i < legalKeys.length; i++) {
                if (legalKeys[i].includes(lowerVal) && !matches.has(legalKeys[i])) matches.add(legalKeys[i]);
                if (matches.size >= 12) break;
            }
        }

        if (matches.size < 12) {
            for (let i = 0; i < generalKeys.length; i++) {
                if (generalKeys[i].startsWith(lowerVal) && !matches.has(generalKeys[i])) matches.add(generalKeys[i]);
                if (matches.size >= 12) break;
            }
        }

        setDictSuggestions(Array.from(matches));
    };

    // --- EXECUTE SEARCH & SYNC PANES ---
    const executeSearch = (wordToSearch) => {
        if (!wordToSearch || !wordToSearch.trim()) return;

        const lowerWord = wordToSearch.toLowerCase().trim();
        setDictQuery(wordToSearch);
        setDictSuggestions([]);
        setActiveWord(lowerWord);

        // FILLS BOTH PANES!
        setDictDefinitions({
            legal: dictionaries.legal[lowerWord] || "Term not found in Black's Law Dictionary.",
            general: dictionaries.general[lowerWord] || "Definition not found in General English database."
        });

        const newHistory = [lowerWord, ...history.filter(w => w !== lowerWord)].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('lexiconHistory', JSON.stringify(newHistory));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') executeSearch(dictQuery);
    };

    const handleDoubleClick = () => {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText && selectedText.length > 2 && selectedText.length < 40) {
            const cleanWord = selectedText.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
            if (cleanWord) executeSearch(cleanWord);
        }
    };

    const speakWord = (word) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleBookmark = (word) => {
        let newBookmarks = bookmarks.includes(word)
            ? bookmarks.filter(w => w !== word)
            : [...bookmarks, word];
        setBookmarks(newBookmarks);
        localStorage.setItem('lexiconBookmarks', JSON.stringify(newBookmarks));
    };

    return (
        <div className="w-full h-full flex flex-col animate-fade-in relative z-0">

            {/* NO HEADER - Integrates seamlessly into Utility Belt */}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scroll relative">
                <div className="max-w-6xl mx-auto w-full pb-20">

                    {/* TOP HERO AREA */}
                    <div className="mb-10 text-center relative mt-4">
                        <div className="w-20 h-20 bg-amber-500 text-black rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20 text-4xl">
                            <i className="fa fa-book-atlas"></i>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Legal Dictionary</h3>
                        <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mt-3">Cross-reference Black's Law and Standard English instantly</p>

                        {/* --- DYNAMIC STATUS INDICATOR --- */}
                        <div className="mt-5 flex justify-center items-center gap-2">
                            {!dictsLoaded ? (
                                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20">
                                    <i className="fa fa-circle text-[7px] animate-pulse"></i> Loading Engine...
                                </span>
                            ) : (termCount.legal > 0 || termCount.general > 0) ? (
                                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                                    <i className="fa fa-circle text-[7px]"></i> Databases Online ({(termCount.legal + termCount.general).toLocaleString()} Terms)
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                                    <i className="fa fa-triangle-exclamation text-[10px]"></i> {fetchError || "JSON Parsing Failed"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* --- FIXED SEARCH BAR WITH ALIGNED X BUTTON --- */}
                    <div className="relative mb-8 max-w-4xl mx-auto w-full z-50 px-2 md:px-0">
                        <div className={`relative flex items-center w-full bg-white dark:bg-[#121212] border-2 transition-all shadow-xl z-50 p-2 pl-6 ${dictSuggestions.length > 0 ? 'border-amber-500 rounded-t-[2rem] rounded-b-none' : 'border-stone-200 dark:border-white/10 rounded-[2rem] hover:border-stone-300 dark:hover:border-white/20 focus-within:border-amber-500 dark:focus-within:border-amber-500'}`}>

                            <i className="fa fa-search text-stone-400 text-xl shrink-0"></i>

                            <input
                                type="text"
                                value={dictQuery}
                                onChange={handleSearchInput}
                                onKeyDown={handleKeyDown}
                                placeholder={dictsLoaded ? "Search a legal maxim or english word..." : "Loading memory..."}
                                disabled={!dictsLoaded}
                                className="flex-1 bg-transparent px-5 text-xl font-bold text-slate-900 dark:text-white outline-none disabled:opacity-50 min-w-0"
                            />

                            {/* Clear Button */}
                            {dictQuery && (
                                <button
                                    onClick={() => { setDictQuery(''); setDictSuggestions([]); setActiveWord(null); }}
                                    className="text-stone-400 hover:text-red-500 transition-colors shrink-0 mx-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-white/5"
                                >
                                    <i className="fa fa-times-circle text-2xl"></i>
                                </button>
                            )}

                            {/* Search Button */}
                            <button
                                onClick={() => executeSearch(dictQuery)}
                                disabled={!dictQuery.trim()}
                                className="bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 dark:disabled:bg-white/5 text-black disabled:text-stone-400 px-6 md:px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[12px] transition-colors shadow-md flex items-center gap-2 shrink-0"
                            >
                                Search <i className="fa fa-arrow-right"></i>
                            </button>

                        </div>

                        {/* Custom Dropdown */}
                        {dictSuggestions.length > 0 && (
                            <div className="dict-dropdown mx-2 md:mx-0 w-auto md:w-full right-2 left-2 md:right-0 md:left-0">
                                {dictSuggestions.map((word) => (
                                    <div key={word} onMouseDown={() => executeSearch(word)} className="dict-dropdown-item">
                                        <i className="fa fa-arrow-right text-[10px] opacity-30"></i> {word}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* HISTORY & BOOKMARKS */}
                    {!activeWord && (history.length > 0 || bookmarks.length > 0) && (
                        <div className="max-w-4xl mx-auto w-full px-2 md:px-0 flex flex-col md:flex-row gap-6 mb-12 animate-fade-in">
                            {bookmarks.length > 0 && (
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3"><i className="fa fa-star mr-1"></i> Bookmarks</p>
                                    <div className="flex flex-wrap gap-2">
                                        {bookmarks.map(w => (
                                            <button key={'bm_' + w} onClick={() => executeSearch(w)} className="bg-white dark:bg-[#121212] border border-amber-200 dark:border-amber-500/30 text-slate-900 dark:text-amber-500 px-4 py-2 rounded-full text-xs font-bold capitalize hover:bg-amber-500 hover:text-black transition-colors shadow-sm">{w}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {history.length > 0 && (
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3"><i className="fa fa-history mr-1"></i> Recent</p>
                                    <div className="flex flex-wrap gap-2">
                                        {history.map(w => (
                                            <button key={'hist_' + w} onClick={() => executeSearch(w)} className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-400 px-4 py-2 rounded-full text-xs font-bold capitalize hover:border-amber-500 hover:text-amber-500 transition-colors shadow-sm">{w}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- DUAL PANE RESULTS (SYNCED VIEW) --- */}
                    {activeWord && (
                        <div className="max-w-6xl mx-auto w-full animate-fade-in pb-12 px-2 md:px-0">
                            {/* Controls Row */}
                            <div className="flex items-center justify-between mb-6 px-2">
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest hidden md:block">
                                    <i className="fa fa-mouse-pointer mr-2"></i> Double-click any word inside definitions to search it
                                </p>
                                <div className="flex gap-3 w-full md:w-auto justify-end">
                                    <button onClick={() => speakWord(activeWord)} className="w-12 h-12 bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 rounded-full flex items-center justify-center text-stone-500 hover:text-amber-500 shadow-sm transition-all hover:scale-105" title="Pronounce">
                                        <i className="fa fa-volume-high text-lg"></i>
                                    </button>
                                    <button onClick={() => toggleBookmark(activeWord)} className={`w-12 h-12 bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-105 ${bookmarks.includes(activeWord) ? 'text-amber-500' : 'text-stone-500 hover:text-amber-500'}`} title="Bookmark">
                                        <i className={`text-lg ${bookmarks.includes(activeWord) ? "fa-solid fa-star" : "fa-regular fa-star"}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" onDoubleClick={handleDoubleClick}>

                                {/* Black's Law Pane */}
                                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[2.5rem] p-8 md:p-10 relative flex flex-col shadow-inner">
                                    <div className="absolute top-0 right-10 bg-amber-500 text-black px-6 py-1.5 rounded-b-2xl text-[10px] font-black uppercase tracking-widest shadow-md">
                                        <i className="fa fa-scale-balanced mr-2"></i> Black's Law
                                    </div>
                                    <h4 className="text-3xl font-black text-amber-900 dark:text-amber-500 uppercase tracking-tighter mb-6 capitalize border-b border-amber-200 dark:border-amber-500/10 pb-4">
                                        {activeWord}
                                    </h4>
                                    <p className="text-[17px] font-serif leading-loose text-amber-950 dark:text-stone-200 flex-1 select-text whitespace-pre-wrap">
                                        {dictDefinitions.legal}
                                    </p>
                                </div>

                                {/* General English Pane */}
                                <div className="bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 relative flex flex-col shadow-xl">
                                    <div className="absolute top-0 right-10 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-6 py-1.5 rounded-b-2xl text-[10px] font-black uppercase tracking-widest shadow-md">
                                        <i className="fa fa-book mr-2"></i> Standard English
                                    </div>
                                    <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 capitalize border-b border-stone-100 dark:border-white/5 pb-4">
                                        {activeWord}
                                    </h4>
                                    <p className="text-[17px] font-serif leading-loose text-slate-700 dark:text-stone-400 flex-1 select-text whitespace-pre-wrap">
                                        {dictDefinitions.general}
                                    </p>
                                </div>

                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Lexicon;