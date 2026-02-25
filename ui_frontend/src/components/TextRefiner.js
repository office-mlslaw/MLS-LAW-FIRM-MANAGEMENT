import React, { useState } from 'react';
import '../styles/TextRefiner.css';

const TextRefiner = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');

    // Cleaning Options
    const [options, setOptions] = useState({
        removeBreaks: true,
        removeExtraSpaces: true,
        stripBullets: false,
        sentenceCase: false
    });

    const toggleOption = (opt) => {
        setOptions(prev => ({ ...prev, [opt]: !prev[opt] }));
    };

    const handleClean = () => {
        if (!inputText.trim()) return;

        let cleaned = inputText;

        // 1. Remove PDF Line Breaks
        if (options.removeBreaks) {
            // Replaces single line breaks with space, but preserves double line breaks (paragraphs)
            cleaned = cleaned.replace(/(?<!\n)\n(?!\n)/g, ' ');
        }

        // 2. Strip Numbers and Bullets (e.g. "1.", "a)", "•")
        if (options.stripBullets) {
            cleaned = cleaned.replace(/^[\s]*([a-zA-Z0-9ivxlcdm]+[\.\)]|[\u2022\u2023\u25E6\u2043\u2219\-])\s*/gim, '');
        }

        // 3. Remove Extra Spaces
        if (options.removeExtraSpaces) {
            cleaned = cleaned.replace(/\s{2,}/g, ' ');
        }

        // 4. Force Sentence Case (Good for ALL CAPS documents)
        if (options.sentenceCase) {
            cleaned = cleaned.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, c => c.toUpperCase());
        }

        setOutputText(cleaned.trim());
    };

    const copyToClipboard = () => {
        if (outputText) {
            navigator.clipboard.writeText(outputText);
        }
    };

    const clearAll = () => {
        setInputText('');
        setOutputText('');
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] text-left absolute inset-0 overflow-hidden z-0">

            {/* HEADER */}
            <div className="bg-white dark:bg-[#0f0f10] border-b border-stone-200 dark:border-white/5 p-6 md:p-10 shrink-0 z-20 shadow-sm relative">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="font-black text-3xl text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <i className="fa fa-soap text-amber-500"></i> Text Refiner
                        </h2>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Instantly scrub PDF formatting, line breaks, and OCR errors</p>
                    </div>
                </div>
            </div>

            {/* WORKSPACE */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scroll">
                <div className="max-w-7xl mx-auto w-full h-full flex flex-col lg:flex-row gap-6 lg:gap-8 pb-20 animate-fade-in">

                    {/* INPUT PANE */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden">
                        <div className="bg-stone-50 dark:bg-white/5 p-4 border-b border-stone-200 dark:border-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-2">
                                <i className="fa fa-file-text mr-2"></i> Messy Input
                            </span>
                            {inputText && (
                                <button onClick={clearAll} className="text-[10px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest pr-2 transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>

                        <textarea
                            className="flex-1 w-full p-6 lg:p-8 bg-transparent outline-none resize-none text-[15px] font-mono leading-relaxed text-slate-700 dark:text-stone-300 custom-scroll"
                            placeholder="Paste your broken PDF text, messy OCR, or unformatted legalese here..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />

                        {/* TOGGLES BAR */}
                        <div className="p-5 border-t border-stone-100 dark:border-white/5 bg-stone-50 dark:bg-black/20 flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="refiner-checkbox" checked={options.removeBreaks} onChange={() => toggleOption('removeBreaks')} />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">Fix Line Breaks</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="refiner-checkbox" checked={options.removeExtraSpaces} onChange={() => toggleOption('removeExtraSpaces')} />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">Remove Extra Spaces</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="refiner-checkbox" checked={options.stripBullets} onChange={() => toggleOption('stripBullets')} />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">Strip Bullets</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="refiner-checkbox" checked={options.sentenceCase} onChange={() => toggleOption('sentenceCase')} />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">Sentence Case</span>
                                </label>
                            </div>

                            <button
                                onClick={handleClean}
                                disabled={!inputText.trim()}
                                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 dark:disabled:bg-white/5 text-black disabled:text-stone-500 py-4 rounded-xl font-black uppercase tracking-widest text-[12px] transition-all shadow-md mt-2"
                            >
                                Scrub Formatting <i className="fa fa-wand-magic-sparkles ml-2"></i>
                            </button>
                        </div>
                    </div>

                    {/* OUTPUT PANE */}
                    <div className="flex-1 flex flex-col bg-stone-50 dark:bg-[#1a1a1a] border border-amber-200 dark:border-amber-500/20 rounded-[2rem] shadow-inner overflow-hidden relative">
                        <div className="bg-amber-100 dark:bg-amber-500/10 p-4 border-b border-amber-200 dark:border-amber-500/20 flex justify-between items-center">
                            <span className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest pl-2">
                                <i className="fa fa-check-circle mr-2"></i> Refined Output
                            </span>
                            {outputText && (
                                <button onClick={copyToClipboard} className="text-[10px] font-black bg-white dark:bg-black border border-amber-200 dark:border-amber-900/50 text-stone-600 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 uppercase tracking-widest px-3 py-1 rounded-md transition-colors shadow-sm">
                                    <i className="fa fa-copy mr-1"></i> Copy
                                </button>
                            )}
                        </div>

                        <div className="flex-1 w-full p-6 lg:p-8 overflow-y-auto custom-scroll text-[15px] font-serif leading-loose text-slate-900 dark:text-stone-200 whitespace-pre-wrap select-text">
                            {outputText ? (
                                outputText
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <i className="fa fa-soap text-4xl mb-4 text-stone-400"></i>
                                    <p className="text-xs font-black uppercase tracking-widest">Awaiting Text</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TextRefiner;