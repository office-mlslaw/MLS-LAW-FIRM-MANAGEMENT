import React, { useState, useRef } from 'react';
import '../styles/TranslationBot.css';

const TranslationBot = () => {
    const fileInputRef = useRef(null);

    // Translation Engine State
    const [sourceText, setSourceText] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [segments, setSegments] = useState([]); // Array of { id, source, target }

    // ==========================================
    // 📄 FILE EXTRACTION LOGIC (PDF / WORD / IMG)
    // ==========================================
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsExtracting(true);
        setSourceText('');

        // MOCK EXTRACTION DELAY: Simulating reading a PDF or Word Document
        setTimeout(() => {
            const mockExtractedText = `ఫిర్యాదుదారుడు ఇచ్చిన వాంగ్మూలం మేరకు ఈ క్రింది విషయాలు నమోదు చేయబడినవి. నిందితుడు కావాలని దురుద్దేశంతో దాడికి పాల్పడ్డాడు.
            
ఈ సంఘటన జరిగిన ప్రదేశంలో స్థానికులు చాలా మంది ఉన్నారు. వారు కూడా ఈ విషయాన్ని ధృవీకరించారు.

కావున నేరస్తుడిపై చట్టపరమైన చర్యలు తీసుకోవాల్సిందిగా కోరుచున్నాము.`;

            setSourceText(mockExtractedText);
            setIsExtracting(false);
            e.target.value = null; // reset input
        }, 2000);
    };

    // ==========================================
    // ⚙️ AI TRANSLATION ENGINE
    // ==========================================
    const handleTranslate = () => {
        if (!sourceText.trim()) return alert("Please paste or extract source text first.");

        setIsTranslating(true);

        // MOCK AI LOGIC: Split the text by paragraphs to retain exact formatting
        setTimeout(() => {
            const paragraphs = sourceText.split('\n').filter(p => p.trim() !== '');
            const newSegments = paragraphs.map((para, index) => ({
                id: Date.now() + index,
                source: para,
                target: `[AI Translation for paragraph ${index + 1} will appear here based on your firm's custom database...]`
            }));

            setSegments(newSegments);
            setIsTranslating(false);
        }, 1500);
    };

    const updateTargetText = (id, newText) => {
        setSegments(segments.map(seg => seg.id === id ? { ...seg, target: newText } : seg));
    };

    const downloadDocx = () => {
        alert("Downloading formatted .docx translation...");
    };

    const clearAll = () => {
        setSourceText('');
        setSegments([]);
    };

    return (
        <div className="tb-container animate-fade-in z-0">

            {/* LEFT: CONFIG & INPUT PANEL */}
            <div className="tb-form-panel no-print">
                <div className="p-6 border-b border-stone-200 dark:border-white/5 bg-white dark:bg-black shrink-0 flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">
                        <i className="fa fa-language text-amber-500 mr-2"></i> Translation Bot
                    </h2>
                    {(segments.length > 0 || sourceText) && (
                        <button onClick={clearAll} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest">
                            Clear All
                        </button>
                    )}
                </div>

                <div className="tb-form-scroll custom-scroll bg-stone-50 dark:bg-[#121212]">

                    {/* FILE UPLOAD / EXTRACTION ZONE */}
                    <div className="tb-input-group">
                        <span className="tb-label">Step 1: Extract from Document</span>
                        <label className="tb-file-drop">
                            {isExtracting ? (
                                <>
                                    <i className="fa fa-expand text-amber-500 animate-pulse"></i>
                                    <span className="text-amber-500">Extracting Text...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fa fa-file-pdf"></i>
                                    <span>Click to upload PDF or Word Doc</span>
                                </>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf, .doc, .docx, .jpg, .jpeg, .png"
                                onChange={handleFileUpload}
                                disabled={isExtracting}
                            />
                        </label>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800"></div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800"></div>
                    </div>

                    {/* RAW TEXT INPUT */}
                    <div className="tb-input-group flex-1 flex flex-col">
                        <span className="tb-label">Step 2: Review / Paste Regional Text</span>
                        <textarea
                            value={sourceText}
                            onChange={e => setSourceText(e.target.value)}
                            className="tb-textarea h-64 custom-scroll resize-none"
                            placeholder="Paste your Telugu/Hindi text here directly..."
                            disabled={isTranslating || isExtracting}
                        ></textarea>
                    </div>

                    {/* ACTION BUTTON */}
                    <button
                        onClick={handleTranslate}
                        disabled={isTranslating || !sourceText.trim()}
                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 disabled:text-stone-500 text-black py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all"
                    >
                        {isTranslating ? (
                            <><i className="fa fa-circle-notch fa-spin mr-2"></i> Processing...</>
                        ) : (
                            <>Translate Text <i className="fa fa-arrow-right ml-2"></i></>
                        )}
                    </button>
                </div>
            </div>

            {/* RIGHT: WORKSPACE / BLOCK EDITOR */}
            <div className="tb-workspace custom-scroll">

                {segments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <i className="fa fa-language text-6xl mb-4 text-stone-400"></i>
                        <h3 className="text-xl font-black uppercase tracking-widest text-stone-400">Translation Workbench</h3>
                        <p className="text-sm font-bold mt-2 text-stone-500 max-w-sm">Upload a PDF/Word file or paste text on the left to begin block-by-block legal translation.</p>
                    </div>
                ) : (
                    <div className="tb-workbench-wrapper animate-slide-up">

                        {/* Header Bar */}
                        <div className="flex justify-between items-center px-2">
                            <span className="text-xs font-black uppercase tracking-widest text-stone-400">
                                <i className="fa fa-check-circle text-green-500 mr-2"></i> {segments.length} Paragraphs Parsed
                            </span>
                            <button onClick={downloadDocx} className="bg-white dark:bg-black border border-stone-200 dark:border-stone-700 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:border-amber-500 transition-colors shadow-sm">
                                <i className="fa fa-download mr-2 text-amber-500"></i> Export .DOCX
                            </button>
                        </div>

                        {/* Translation Segments */}
                        {segments.map((seg, idx) => (
                            <div key={seg.id} className="tb-segment-card">
                                {/* Left Side: Original Regional Text */}
                                <div className="tb-segment-source">
                                    <div className="tb-segment-header">Original (Block {idx + 1})</div>
                                    <div className="tb-source-text">{seg.source}</div>
                                </div>
                                {/* Right Side: Editable Translation */}
                                <div className="tb-segment-target">
                                    <div className="tb-segment-header text-amber-600 dark:text-amber-500">Translation (Edit to refine)</div>
                                    <textarea
                                        value={seg.target}
                                        onChange={(e) => updateTargetText(seg.id, e.target.value)}
                                        className="tb-target-textarea custom-scroll"
                                    />
                                </div>
                            </div>
                        ))}

                    </div>
                )}
            </div>
        </div>
    );
};

export default TranslationBot;