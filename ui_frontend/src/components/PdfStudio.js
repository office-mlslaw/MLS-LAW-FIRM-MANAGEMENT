import React, { useState, useRef } from 'react';

const PdfStudio = () => {
    const [activeTab, setActiveTab] = useState('IMG_TO_PDF'); // MERGE, SPLIT, IMG_TO_PDF
    const [isProcessing, setIsProcessing] = useState(false);

    // Standard PDF Files (For Merge/Split)
    const [pdfFiles, setPdfFiles] = useState([]);
    const [splitPages, setSplitPages] = useState('');
    const fileInputRef = useRef(null);

    // Image to PDF State
    const [imageList, setImageList] = useState([]); // { id, file, previewUrl, originalUrl, isCropped }
    const imgInputRef = useRef(null);

    // Drag & Drop Sorting Refs
    const dragItem = useRef();
    const dragOverItem = useRef();

    // Cropping Modal State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [activeCrop, setActiveCrop] = useState(null);
    const [cropCoords, setCropCoords] = useState({ top: 0, bottom: 0, left: 0, right: 0 }); // Percentages

    // --- STANDARD PDF ACTIONS (Merge & Split) ---
    const handlePdfSelect = (e) => {
        if (e.target.files.length > 0) setPdfFiles(Array.from(e.target.files));
    };

    const executePdfAction = async () => {
        if (pdfFiles.length === 0) return alert("Select PDF files first.");
        setIsProcessing(true);
        const formData = new FormData();

        try {
            if (activeTab === 'MERGE') {
                if (pdfFiles.length < 2) throw new Error("Need 2+ PDFs to merge.");
                pdfFiles.forEach(f => formData.append('pdfs', f));
                const res = await fetch('http://127.0.0.1:8080/api/tools/pdf/merge', { method: 'POST', body: formData });
                if (res.ok) downloadBlob(await res.blob(), 'Merged_Bundle.pdf');
            } else if (activeTab === 'SPLIT') {
                if (pdfFiles.length > 1) throw new Error("Select only 1 PDF to split.");
                formData.append('pdf', pdfFiles[0]);
                formData.append('pages', splitPages);
                const res = await fetch('http://127.0.0.1:8080/api/tools/pdf/split', { method: 'POST', body: formData });
                if (res.ok) downloadBlob(await res.blob(), 'Extracted_Pages.pdf');
            }
        } catch (error) {
            alert(error.message || "Operation failed.");
        }
        setIsProcessing(false);
        setPdfFiles([]);
    };

    // --- IMAGE TO PDF ACTIONS ---
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            id: 'IMG_' + Math.random().toString(36).substr(2, 9),
            file: file,
            previewUrl: URL.createObjectURL(file),
            originalUrl: URL.createObjectURL(file),
            isCropped: false
        }));
        setImageList(prev => [...prev, ...newImages]);
    };

    const removeImage = (id) => setImageList(prev => prev.filter(img => img.id !== id));

    // Drag & Drop Sorting
    const dragStart = (e, position) => { dragItem.current = position; };
    const dragEnter = (e, position) => { dragOverItem.current = position; };
    const drop = (e) => {
        const copyList = [...imageList];
        const dragItemContent = copyList[dragItem.current];
        copyList.splice(dragItem.current, 1);
        copyList.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null; dragOverItem.current = null;
        setImageList(copyList);
    };

    // Canvas Cropping Engine
    const openCropModal = (img) => {
        setActiveCrop(img);
        setCropCoords({ top: 0, bottom: 0, left: 0, right: 0 });
        setCropModalOpen(true);
    };

    const autoCropDocument = () => {
        // Simulates finding the document bounds by trimming 10% off all edges (usually where fingers/desk are)
        setCropCoords({ top: 8, bottom: 8, left: 5, right: 5 });
    };

    const applyCrop = () => {
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.src = activeCrop.originalUrl; // Always crop from original to maintain quality

        img.onload = () => {
            const ctx = canvas.getContext('2d');
            const sx = (cropCoords.left / 100) * img.width;
            const sy = (cropCoords.top / 100) * img.height;
            const sWidth = img.width - sx - ((cropCoords.right / 100) * img.width);
            const sHeight = img.height - sy - ((cropCoords.bottom / 100) * img.height);

            canvas.width = sWidth;
            canvas.height = sHeight;
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

    const executeImgToPdf = async () => {
        if (imageList.length === 0) return alert("Add images first.");
        setIsProcessing(true);
        const formData = new FormData();

        // Convert cropped Data URLs back to files for backend processing
        imageList.forEach((img, i) => {
            const fileToUpload = img.isCropped ? dataURLtoFile(img.previewUrl, `page_${i}.jpg`) : img.file;
            formData.append('images', fileToUpload);
        });

        try {
            const res = await fetch('http://127.0.0.1:8080/api/tools/pdf/img2pdf', { method: 'POST', body: formData });
            if (res.ok) {
                downloadBlob(await res.blob(), `Compiled_Annexure_${Date.now()}.pdf`);
                setImageList([]);
            } else { alert("Failed to convert on server."); }
        } catch (error) { alert("Network Error."); }
        setIsProcessing(false);
    };

    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-stone-50 dark:bg-[#0a0a0b] transition-colors overflow-y-auto custom-scroll">

            {/* Header */}
            <header className="h-20 border-b border-stone-200 dark:border-white/5 flex items-center justify-between px-8 bg-white dark:bg-black shrink-0">
                <div>
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase">PDF Studio</h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Document Processing Engine</p>
                </div>
            </header>

            <div className="max-w-6xl mx-auto w-full p-8">

                {/* Tabs */}
                <div className="flex bg-stone-200 dark:bg-[#121212] p-1.5 rounded-2xl mb-8">
                    {['IMG_TO_PDF', 'MERGE', 'SPLIT'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white dark:bg-amber-500 text-slate-900 dark:text-black shadow-md' : 'text-stone-500 hover:text-slate-900 dark:hover:text-white'}`}>
                            {tab.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                {/* --- IMG TO PDF WORKSPACE --- */}
                {activeTab === 'IMG_TO_PDF' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">Annexure Builder</h3>
                                <p className="text-xs text-stone-500 mt-1">Upload images, drag to reorder, crop, and convert to a single PDF.</p>
                            </div>
                            <button onClick={() => imgInputRef.current.click()} className="bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-white/5 text-slate-900 dark:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-amber-500 transition-colors">
                                + Add Images
                            </button>
                            <input type="file" multiple accept="image/*" className="hidden" ref={imgInputRef} onChange={handleImageSelect} />
                        </div>

                        {imageList.length === 0 ? (
                            <div onClick={() => imgInputRef.current.click()} className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl h-64 flex flex-col items-center justify-center cursor-pointer bg-white dark:bg-[#121212] hover:border-amber-500 transition-all">
                                <i className="fa fa-images text-4xl text-stone-300 dark:text-stone-700 mb-4"></i>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Drop Images Here</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-stone-200 dark:border-white/5 shadow-xl">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {imageList.map((img, index) => (
                                        <div key={img.id} draggable onDragStart={(e) => dragStart(e, index)} onDragEnter={(e) => dragEnter(e, index)} onDragEnd={drop} className="relative group cursor-grab active:cursor-grabbing aspect-[3/4] bg-stone-100 dark:bg-black rounded-xl overflow-hidden border-2 border-transparent hover:border-amber-500 transition-colors">

                                            <img src={img.previewUrl} alt="doc" className="w-full h-full object-cover" />

                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full">
                                                {index + 1}
                                            </div>

                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                                                <button onClick={() => openCropModal(img)} className="bg-amber-500 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase w-24">Crop</button>
                                                <button onClick={() => removeImage(img.id)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase w-24">Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-stone-200 dark:border-white/5 flex justify-end">
                                    <button onClick={executeImgToPdf} disabled={isProcessing} className="bg-black dark:bg-amber-500 text-white dark:text-black px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg disabled:opacity-50 flex items-center gap-2">
                                        {isProcessing ? <><i className="fa fa-circle-notch fa-spin"></i> Processing...</> : <><i className="fa fa-file-pdf"></i> Generate PDF</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- STANDARD MERGE / SPLIT --- */}
                {(activeTab === 'MERGE' || activeTab === 'SPLIT') && (
                    <div className="bg-white dark:bg-[#121212] rounded-3xl border border-stone-200 dark:border-white/5 shadow-xl p-10 text-center animate-fade-in">
                        <input type="file" accept=".pdf" multiple={activeTab === 'MERGE'} className="hidden" ref={fileInputRef} onChange={handlePdfSelect} />

                        <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-3xl h-64 flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 dark:bg-black/20 hover:border-amber-500 transition-all">
                            <i className={`fa ${activeTab === 'MERGE' ? 'fa-file-circle-plus' : 'fa-scissors'} text-4xl text-amber-500 mb-4`}></i>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{activeTab === 'MERGE' ? 'Drop PDFs to Combine' : 'Drop a PDF to Split'}</h4>
                            <p className="text-[10px] text-stone-500 mt-2">{pdfFiles.length > 0 ? `${pdfFiles.length} file(s) selected` : 'Or click to browse'}</p>
                        </div>

                        {activeTab === 'SPLIT' && (
                            <div className="mt-6 max-w-md mx-auto text-left">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Pages to Extract</label>
                                <input type="text" value={splitPages} onChange={e => setSplitPages(e.target.value)} placeholder="e.g., 1-5, 8, 11-13" className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                            </div>
                        )}

                        <button onClick={executePdfAction} disabled={isProcessing || pdfFiles.length === 0} className="mt-8 bg-black dark:bg-stone-800 text-white py-4 px-12 rounded-xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg disabled:opacity-50">
                            {isProcessing ? 'Working...' : `Execute ${activeTab}`}
                        </button>
                    </div>
                )}
            </div>

            {/* --- CROP MODAL --- */}
            {cropModalOpen && activeCrop && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-4xl rounded-[2rem] shadow-2xl relative flex flex-col md:flex-row overflow-hidden border border-stone-200 dark:border-white/10">

                        {/* Image Preview Area */}
                        <div className="flex-1 bg-stone-100 dark:bg-black p-8 flex items-center justify-center relative min-h-[50vh]">
                            <div className="relative inline-block shadow-2xl">
                                <img src={activeCrop.originalUrl} alt="crop-target" className="max-h-[60vh] md:max-h-[70vh] object-contain pointer-events-none" />
                                {/* Visual Crop Box Overlay */}
                                <div className="absolute border-2 border-amber-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" style={{
                                    top: `${cropCoords.top}%`, bottom: `${cropCoords.bottom}%`,
                                    left: `${cropCoords.left}%`, right: `${cropCoords.right}%`
                                }}></div>
                            </div>
                        </div>

                        {/* Controls Area */}
                        <div className="w-full md:w-80 p-8 flex flex-col justify-between bg-white dark:bg-[#121212] border-l border-stone-200 dark:border-white/5">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Adjust Crop</h3>
                                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-6">Trim background edges</p>

                                <button onClick={autoCropDocument} className="w-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 hover:bg-blue-500 hover:text-white transition-colors">
                                    <i className="fa fa-wand-magic-sparkles mr-2"></i> Auto-Trim Edges
                                </button>

                                <div className="space-y-4">
                                    {['top', 'bottom', 'left', 'right'].map(dir => (
                                        <div key={dir}>
                                            <div className="flex justify-between text-[9px] font-black uppercase text-stone-400 mb-1">
                                                <span>{dir} Margin</span><span>{cropCoords[dir]}%</span>
                                            </div>
                                            <input type="range" min="0" max="40" value={cropCoords[dir]} onChange={(e) => setCropCoords({ ...cropCoords, [dir]: parseInt(e.target.value) })} className="w-full accent-amber-500" />
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

export default PdfStudio;