import React, { useState } from 'react';
import '../styles/LimitationEngine.css';

const LimitationEngine = () => {
    const [limitDate, setLimitDate] = useState('');
    const [limitCategory, setLimitCategory] = useState('3_YEARS');
    const [limitResult, setLimitResult] = useState(null);

    // ==========================================
    // ⚙️ LIMITATION ACT CALCULATOR (Sec 4 & Sec 12 applied)
    // ==========================================
    const calculateLimitation = (e) => {
        e.preventDefault();
        if (!limitDate) return;

        const start = new Date(limitDate);
        const [amountStr, unit] = limitCategory.split('_');
        const amount = parseInt(amountStr, 10);
        let note = `Base Statutory Period: ${amount} ${unit.toLowerCase()}`;

        // Sec 12: Exclude the day from which the period is to be reckoned. 
        // JavaScript Date addition inherently skips day 0 when adding whole units.
        if (unit === 'YEARS') {
            start.setFullYear(start.getFullYear() + amount);
        } else if (unit === 'DAYS') {
            start.setDate(start.getDate() + amount);
        }

        // Sec 4: Where court is closed when period expires (Weekends)
        let sec4Extension = "";
        if (start.getDay() === 0) { // Sunday
            start.setDate(start.getDate() + 1);
            sec4Extension = " • Extended to Monday (Sec. 4)";
        } else if (start.getDay() === 6) { // Saturday
            start.setDate(start.getDate() + 2);
            sec4Extension = " • Extended to Monday (Sec. 4)";
        }

        setLimitResult({
            date: start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            note: note + sec4Extension
        });
    };

    const clearEngine = () => {
        setLimitDate('');
        setLimitResult(null);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] text-left absolute inset-0 overflow-hidden z-0">

            {/* HEADER */}
            <div className="bg-white dark:bg-[#0f0f10] border-b border-stone-200 dark:border-white/5 p-6 md:p-10 shrink-0 z-20 shadow-sm relative">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="font-black text-3xl text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <i className="fa fa-hourglass-half text-amber-500"></i> Limitation Engine
                        </h2>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Calculated as per The Limitation Act, 1963</p>
                    </div>
                    {limitResult && (
                        <button onClick={clearEngine} className="text-[10px] font-black text-stone-400 hover:text-red-500 uppercase tracking-widest transition-colors">
                            Reset Engine <i className="fa fa-rotate-right ml-1"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* WORKSPACE */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scroll">
                <div className="max-w-4xl mx-auto w-full pb-20 animate-fade-in">

                    <form onSubmit={calculateLimitation} className="bg-white dark:bg-[#121212] p-8 md:p-10 rounded-[2rem] border border-stone-200 dark:border-white/5 shadow-xl relative overflow-hidden">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            {/* Date Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">
                                    Date of Cause of Action / Order
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={limitDate}
                                    onChange={e => setLimitDate(e.target.value)}
                                    className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                                />
                                <p className="text-[10px] text-stone-400 font-bold mt-3">
                                    <i className="fa fa-info-circle text-amber-500 mr-1"></i> Sec 12: First day is automatically excluded from reckoning.
                                </p>
                            </div>

                            {/* Dropdown Input based on Schedule */}
                            <div>
                                <label className="block text-[10px] font-black uppercase text-stone-400 tracking-widest mb-3">
                                    Applicable Article (Schedule)
                                </label>
                                <select
                                    value={limitCategory}
                                    onChange={e => setLimitCategory(e.target.value)}
                                    className="limitation-select w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-4 text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors custom-scroll"
                                >
                                    <optgroup label="SUITS: CONTRACTS & ACCOUNTS">
                                        <option value="3_YEARS">Art. 1-14: Suits relating to Accounts (3 Years)</option>
                                        <option value="3_YEARS">Art. 15-55: Contracts / Money / Specific Perf. (3 Years)</option>
                                    </optgroup>
                                    <optgroup label="SUITS: IMMOVABLE PROPERTY">
                                        <option value="12_YEARS">Art. 64-65: Possession based on title (12 Years)</option>
                                        <option value="30_YEARS">Art. 61: By mortgagee for foreclosure (30 Years)</option>
                                    </optgroup>
                                    <optgroup label="SUITS: TORTS">
                                        <option value="1_YEARS">Art. 72-76: Libel, slander, false imprisonment (1 Year)</option>
                                        <option value="3_YEARS">Art. 87-90: Trespass, infringement of IP (3 Years)</option>
                                    </optgroup>
                                    <optgroup label="SUITS: MISCELLANEOUS">
                                        <option value="3_YEARS">Art. 113: Any suit not provided elsewhere (3 Years)</option>
                                    </optgroup>
                                    <optgroup label="APPEALS">
                                        <option value="30_DAYS">Art. 114: Appeal from Death Sentence (30 Days)</option>
                                        <option value="90_DAYS">Art. 114: Appeal from Acquittal (90 Days)</option>
                                        <option value="60_DAYS">Art. 115: Under CrPC to High Court (60 Days)</option>
                                        <option value="30_DAYS">Art. 115: Under CrPC to any other court (30 Days)</option>
                                        <option value="90_DAYS">Art. 116: Under CPC to High Court (90 Days)</option>
                                        <option value="30_DAYS">Art. 116: Under CPC to any other court (30 Days)</option>
                                    </optgroup>
                                    <optgroup label="APPLICATIONS">
                                        <option value="30_DAYS">Art. 122/123: To restore suit or set aside ex-parte (30 Days)</option>
                                        <option value="90_DAYS">Art. 131: For revision under CrPC or CPC (90 Days)</option>
                                        <option value="12_YEARS">Art. 136: For execution of any decree/order (12 Years)</option>
                                        <option value="3_YEARS">Art. 137: Any other application (3 Years)</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="w-full mt-8 bg-amber-500 hover:bg-amber-600 text-black py-4 rounded-xl font-black uppercase text-[12px] tracking-widest shadow-md transition-colors relative z-10">
                            Calculate Expiry Date <i className="fa fa-calculator ml-2"></i>
                        </button>

                        <i className="fa fa-scale-balanced absolute -bottom-10 -right-10 text-[15rem] text-stone-100 dark:text-white/[0.02] -rotate-12 pointer-events-none"></i>
                    </form>

                    {/* RESULT CARD */}
                    {limitResult && (
                        <div className="mt-6 p-10 bg-white dark:bg-[#1a1a1a] border border-amber-200 dark:border-amber-500/20 rounded-[2rem] text-center shadow-lg relative overflow-hidden animate-slide-up">
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>

                            <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2">Statutory Limitation Expires On</p>

                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-3 mb-6 tracking-tight">
                                {limitResult.date}
                            </h2>

                            <span className="text-[10px] font-bold bg-stone-50 dark:bg-black px-4 py-2 rounded-lg text-stone-500 border border-stone-200 dark:border-stone-800 shadow-sm inline-flex items-center gap-2">
                                <i className="fa fa-check-circle text-amber-500"></i> {limitResult.note}
                            </span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LimitationEngine;