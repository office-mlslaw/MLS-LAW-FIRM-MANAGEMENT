import React, { useState, useEffect, useRef } from 'react';
import '../styles/UtilityBelt.css';
import Lexicon from './Lexicon';
import BareActs from './BareActs';
import TextRefiner from './TextRefiner';
import LimitationEngine from './LimitationEngine';
import InvoiceGenerator from './InvoiceGenerator'; // <-- INVOICE GENERATOR IMPORTED

const UtilityBelt = () => {
    const [time, setTime] = useState(new Date());
    const [activeTool, setActiveTool] = useState('pdf');
    const [isProcessing, setIsProcessing] = useState(false);

    // Admin Toggle for specific tools (In a real app, tie this to your Auth context)
    const [isAdmin, setIsAdmin] = useState(true);

    // ==========================================
    // 📄 PDF STUDIO & IMG2PDF STATE
    // ==========================================
    const [pdfMode, setPdfMode] = useState('MERGE'); // MERGE, SPLIT, IMG2PDF
    const [pdfFiles, setPdfFiles] = useState([]);
    const [splitPages, setSplitPages] = useState('');
    const fileInputRef = useRef(null);

    // Img2Pdf specifics
    const [imageList, setImageList] = useState([]);
    const imgInputRef = useRef(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [activeCrop, setActiveCrop] = useState(null);
    const [cropCoords, setCropCoords] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
    const dragItem = useRef();
    const dragOverItem = useRef();

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // ==========================================
    // ⚙️ PDF & IMG2PDF LOGIC
    // ==========================================
    const handleFileSelect = (e) => { if (e.target.files.length > 0) setPdfFiles(Array.from(e.target.files)); };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            id: 'IMG_' + Math.random().toString(36).substr(2, 9),
            file: file, previewUrl: URL.createObjectURL(file), originalUrl: URL.createObjectURL(file), isCropped: false
        }));
        setImageList(prev => [...prev, ...newImages]);
    };

    const removeImage = (id) => setImageList(prev => prev.filter(img => img.id !== id));
    const dragStart = (e, position) => { dragItem.current = position; };
    const dragEnter = (e, position) => { dragOverItem.current = position; };

    const drop = () => {
        const copyList = [...imageList];
        const dragItemContent = copyList[dragItem.current];
        copyList.splice(dragItem.current, 1);
        copyList.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null; dragOverItem.current = null;
        setImageList(copyList);
    };

    const applyCrop = () => {
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.src = activeCrop.originalUrl;
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            const sx = (cropCoords.left / 100) * img.width;
            const sy = (cropCoords.top / 100) * img.height;
            const sWidth = img.width - sx - ((cropCoords.right / 100) * img.width);
            const sHeight = img.height - sy - ((cropCoords.bottom / 100) * img.height);
            canvas.width = sWidth; canvas.height = sHeight;
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            const newUrl = canvas.toDataURL('image/jpeg', 0.9);
            setImageList(prev => prev.map(item => item.id === activeCrop.id ? { ...item, previewUrl: newUrl, isCropped: true } : item));
            setCropModalOpen(false);
        };
    };

    const dataURLtoFile = (dataurl, filename) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        return new File([u8arr], filename, { type: mime });
    };

    const executePdfAction = async () => {
        setIsProcessing(true);
        const formData = new FormData();
        try {
            if (pdfMode === 'MERGE') {
                if (pdfFiles.length < 2) throw new Error("Need at least 2 PDFs.");
                pdfFiles.forEach(f => formData.append('pdfs', f));
                const res = await fetch('http://127.0.0.1:8080/api/tools/pdf/merge', { method: 'POST', body: formData });
                if (res.ok) downloadBlob(await res.blob(), 'Merged_Bundle.pdf');
            } else if (pdfMode === 'SPLIT') {
                if (pdfFiles.length !== 1) throw new Error("Select exactly 1 PDF.");
                formData.append('pdf', pdfFiles[0]);
                formData.append('pages', splitPages);
                const res = await fetch('http://127.0.0.1:8080/api/tools/pdf/split', { method: 'POST', body: formData });
                if (res.ok) downloadBlob(await res.blob(), 'Extracted_Pages.pdf');
            } else if (pdfMode === 'IMG2PDF') {
                if (imageList.length === 0) throw new Error("Add images first.");
                imageList.forEach((img, i) => {
                    const fileToUpload = img.isCropped ? dataURLtoFile(img.previewUrl, `page_${i}.jpg`) : img.file;
                    formData.append('images', fileToUpload);
                });
                const res = await fetch('http://127.0.0.1:8080/api/tools/pdf/img2pdf', { method: 'POST', body: formData });
                if (res.ok) downloadBlob(await res.blob(), 'Compiled_Annexure.pdf');
            }
        } catch (error) { alert(error.message || "Network Error"); }
        setIsProcessing(false);
    };

    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
        setPdfFiles([]); setImageList([]); setSplitPages('');
    };

    // ==========================================
    // 🎨 RENDER COMPONENT
    // ==========================================
    const ToolBtn = ({ id, icon, label, special }) => {
        const isActive = activeTool === id;
        return (
            <button
                onClick={() => setActiveTool(id)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-left shrink-0 md:w-full relative overflow-hidden ${isActive
                    ? 'bg-amber-500 text-black shadow-md md:scale-[1.02]'
                    : 'bg-transparent text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
            >
                {special && !isActive && <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/10 rotate-45 translate-x-4 -translate-y-4"></div>}
                <div className={`w-5 flex justify-center text-lg ${isActive ? 'text-black' : (special ? 'text-red-400' : 'text-stone-400')}`}>
                    <i className={`fa ${icon}`}></i>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{label}</span>
            </button>
        );
    };

    return (
        <div className="flex flex-col w-full h-full bg-stone-50 dark:bg-[#0a0a0b] text-left absolute inset-0 z-0">

            {/* Header */}
            <header className="h-20 shrink-0 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black z-20">
                <div>
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">Utility Belt</h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Complete Legal Automation Suite</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-bold text-green-600 flex items-center justify-end gap-1.5 uppercase tracking-widest">
                        System Secure <i className="fa fa-circle text-[5px] animate-pulse"></i>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-widest mt-0.5">{time.toLocaleTimeString('en-US', { hour12: false })}</div>
                </div>
            </header>

            {/* Bulletproof Split Layout */}
            <div className="flex flex-1 overflow-hidden w-full relative">

                {/* STRICT SIDEBAR (Desktop) */}
                <div
                    className="hidden md:flex flex-col bg-white dark:bg-[#121212] border-r border-stone-200 dark:border-white/5 overflow-y-auto z-10 shadow-sm custom-scroll"
                    style={{ width: '280px', minWidth: '280px', flexShrink: 0 }}
                >
                    <div className="p-5 flex flex-col gap-1.5">
                        <div className="mb-2 mt-2 px-2"><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">File Management</p></div>
                        <ToolBtn id="pdf" icon="fa-file-pdf" label="PDF Studio" />

                        <div className="mb-2 mt-6 px-2"><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Clerical Desk</p></div>
                        <ToolBtn id="limitation" icon="fa-hourglass-half" label="Limitation" />
                        <ToolBtn id="cleaner" icon="fa-soap" label="Text Refiner" />

                        {/* Admin Tools */}
                        {isAdmin && <ToolBtn id="invoice" icon="fa-file-invoice" label="Invoice Gen" special={true} />}

                        <div className="mt-6 mb-2 px-2"><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Legal Reference</p></div>
                        <ToolBtn id="bareacts" icon="fa-scale-balanced" label="Bare Acts" />
                        <ToolBtn id="dictionary" icon="fa-book-atlas" label="Legal Lexicon" />
                    </div>
                </div>

                {/* STRICT SIDEBAR (Mobile - Horizontal Scroll) */}
                <div className="md:hidden flex overflow-x-auto bg-white dark:bg-[#121212] border-b border-stone-200 dark:border-white/5 p-3 shrink-0 gap-2 z-10 custom-scroll">
                    <ToolBtn id="pdf" icon="fa-file-pdf" label="PDF Studio" />
                    <ToolBtn id="limitation" icon="fa-hourglass-half" label="Limitation" />
                    <ToolBtn id="cleaner" icon="fa-soap" label="Refiner" />
                    {isAdmin && <ToolBtn id="invoice" icon="fa-file-invoice" label="Invoice" special={true} />}
                    <ToolBtn id="bareacts" icon="fa-scale-balanced" label="Acts" />
                    <ToolBtn id="dictionary" icon="fa-book-atlas" label="Lexicon" />
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-y-auto bg-stone-50 dark:bg-transparent p-0 md:p-10 relative custom-scroll text-left">

                    {/* --- INJECTED STANDALONE COMPONENTS --- */}
                    {activeTool === 'dictionary' && <div className="animate-fade-in w-full h-full"><Lexicon /></div>}
                    {activeTool === 'bareacts' && <div className="animate-fade-in w-full h-full"><BareActs /></div>}
                    {activeTool === 'cleaner' && <div className="animate-fade-in w-full h-full"><TextRefiner /></div>}
                    {activeTool === 'limitation' && <div className="animate-fade-in w-full h-full"><LimitationEngine /></div>}
                    {activeTool === 'invoice' && isAdmin && <div className="animate-fade-in w-full h-full"><InvoiceGenerator /></div>}

                    {/* 1. PDF STUDIO & IMG2PDF (Inline because it relies on local drag/drop ref state heavily) */}
                    {activeTool === 'pdf' && (
                        <div className="max-w-5xl mx-auto animate-fade-in w-full p-6 md:p-0 pb-20">
                            <div className="mb-6"><h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3"><i className="fa fa-file-pdf text-amber-500"></i> PDF Studio</h3></div>

                            <div className="bg-white dark:bg-[#121212] rounded-[2rem] border border-stone-200 dark:border-white/5 shadow-xl overflow-hidden">
                                <div className="flex border-b border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-black/20">
                                    {['MERGE', 'SPLIT', 'IMG2PDF'].map(mode => (
                                        <button key={mode} onClick={() => { setPdfMode(mode); setPdfFiles([]); setImageList([]); }} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${pdfMode === mode ? 'bg-amber-500 text-black shadow-inner' : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
                                            {mode === 'IMG2PDF' ? 'Images to PDF' : mode}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-8">
                                    {/* Merge & Split UI */}
                                    {(pdfMode === 'MERGE' || pdfMode === 'SPLIT') && (
                                        <>
                                            <input type="file" accept=".pdf" multiple={pdfMode === 'MERGE'} className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                                            <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl h-48 flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 dark:bg-black/20 hover:border-amber-500 transition-all">
                                                <i className={`fa ${pdfMode === 'MERGE' ? 'fa-file-circle-plus' : 'fa-scissors'} text-3xl text-amber-500 mb-3`}></i>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{pdfMode === 'MERGE' ? 'Drop PDFs to Combine' : 'Drop a PDF to Split'}</h4>
                                                <p className="text-[10px] text-stone-500 mt-2">{pdfFiles.length > 0 ? `${pdfFiles.length} file(s) selected` : 'Click to browse'}</p>
                                            </div>
                                            {pdfMode === 'SPLIT' && (
                                                <div className="mt-4"><input type="text" value={splitPages} onChange={e => setSplitPages(e.target.value)} placeholder="Pages to extract (e.g., 1-5, 8)" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold outline-none text-slate-900 dark:text-white focus:border-amber-500" /></div>
                                            )}
                                        </>
                                    )}

                                    {/* Image to PDF UI */}
                                    {pdfMode === 'IMG2PDF' && (
                                        <>
                                            <input type="file" multiple accept="image/*" className="hidden" ref={imgInputRef} onChange={handleImageSelect} />
                                            {imageList.length === 0 ? (
                                                <div onClick={() => imgInputRef.current.click()} className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl h-48 flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 dark:bg-black/20 hover:border-amber-500 transition-all">
                                                    <i className="fa fa-images text-3xl text-amber-500 mb-3"></i>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Drop Images Here</h4>
                                                    <p className="text-[10px] text-stone-500 mt-2">Create an Annexure PDF</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {imageList.map((img, index) => (
                                                        <div key={img.id} draggable onDragStart={(e) => dragStart(e, index)} onDragEnter={(e) => dragEnter(e, index)} onDragEnd={drop} className="relative group cursor-grab active:cursor-grabbing aspect-[3/4] bg-stone-100 dark:bg-black rounded-xl overflow-hidden border-2 border-transparent hover:border-amber-500 transition-colors shadow-sm">
                                                            <img src={img.previewUrl} alt="doc" className="w-full h-full object-cover" />
                                                            <div className="absolute top-1 left-1 bg-black/80 text-amber-500 text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-md">{index + 1}</div>
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                                                                <button onClick={() => { setActiveCrop(img); setCropCoords({ top: 0, bottom: 0, left: 0, right: 0 }); setCropModalOpen(true); }} className="bg-amber-500 text-black px-3 py-1.5 rounded text-[9px] font-black uppercase w-20">Crop</button>
                                                                <button onClick={() => removeImage(img.id)} className="bg-red-500 text-white px-3 py-1.5 rounded text-[9px] font-black uppercase w-20">Remove</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div onClick={() => imgInputRef.current.click()} className="aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center cursor-pointer hover:border-amber-500"><i className="fa fa-plus text-stone-400 text-2xl"></i></div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <button onClick={executePdfAction} disabled={isProcessing || (pdfMode !== 'IMG2PDF' && pdfFiles.length === 0) || (pdfMode === 'IMG2PDF' && imageList.length === 0)} className="w-full mt-6 bg-black dark:bg-amber-500 text-white dark:text-black py-4 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg disabled:opacity-50 hover:scale-[1.01] transition-transform">
                                        {isProcessing ? 'Processing Document...' : `Execute ${pdfMode}`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* --- CROP MODAL --- */}
            {cropModalOpen && activeCrop && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-4xl rounded-[2rem] shadow-2xl relative flex flex-col md:flex-row overflow-hidden border border-stone-200 dark:border-white/10">
                        <div className="flex-1 bg-stone-100 dark:bg-black p-8 flex items-center justify-center relative min-h-[50vh]">
                            <div className="relative inline-block shadow-2xl">
                                <img src={activeCrop.originalUrl} alt="crop-target" className="max-h-[60vh] object-contain pointer-events-none" />
                                <div className="absolute border-2 border-amber-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none" style={{ top: `${cropCoords.top}%`, bottom: `${cropCoords.bottom}%`, left: `${cropCoords.left}%`, right: `${cropCoords.right}%` }}></div>
                            </div>
                        </div>
                        <div className="w-full md:w-80 p-8 flex flex-col justify-between bg-white dark:bg-[#121212] border-l border-stone-200 dark:border-white/5">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Adjust Crop</h3>
                                <button onClick={() => setCropCoords({ top: 8, bottom: 8, left: 5, right: 5 })} className="w-full bg-blue-500/10 text-blue-600 dark:text-blue-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mt-4 mb-6 hover:bg-blue-500 hover:text-white transition-colors"><i className="fa fa-wand-magic-sparkles mr-2"></i> Auto-Trim</button>
                                <div className="space-y-4">
                                    {['top', 'bottom', 'left', 'right'].map(dir => (
                                        <div key={dir}>
                                            <div className="flex justify-between text-[9px] font-black uppercase text-stone-400 mb-1"><span>{dir} Margin</span><span>{cropCoords[dir]}%</span></div>
                                            <input type="range" min="0" max="40" value={cropCoords[dir]} onChange={(e) => setCropCoords({ ...cropCoords, [dir]: parseInt(e.target.value) })} className="w-full accent-amber-500 cursor-pointer" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setCropModalOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl">Cancel</button>
                                <button onClick={applyCrop} className="flex-1 bg-amber-500 text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UtilityBelt;