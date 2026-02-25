import React, { useRef, useEffect } from 'react';
import '../styles/WordStudio.css';

const WordStudio = () => {
    const editorRef = useRef(null);

    // Ensure the editor starts focused and ready
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
    }, []);

    // Core Formatting Executor
    const formatDoc = (cmd, value = null) => {
        document.execCommand(cmd, false, value);
        editorRef.current.focus();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="word-container animate-fade-in z-0">

            {/* TOOLBAR */}
            <div className="word-toolbar no-print">
                <div className="flex items-center gap-2 mr-4">
                    <i className="fa fa-file-word text-blue-600 dark:text-blue-500 text-xl"></i>
                    <span className="font-black uppercase tracking-widest text-xs text-slate-900 dark:text-white">LexEditor</span>
                </div>

                <div className="toolbar-divider"></div>

                {/* Font Family */}
                <select className="tool-select" onChange={(e) => formatDoc('fontName', e.target.value)}>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Arial">Arial</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                </select>

                {/* Font Size */}
                <select className="tool-select" onChange={(e) => formatDoc('fontSize', e.target.value)}>
                    <option value="3">Normal (12pt)</option>
                    <option value="4">Large (14pt)</option>
                    <option value="5">Heading (18pt)</option>
                    <option value="6">Title (24pt)</option>
                </select>

                <div className="toolbar-divider"></div>

                {/* Text Formatting */}
                <button className="tool-btn" onClick={() => formatDoc('bold')} title="Bold"><i className="fa fa-bold"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('italic')} title="Italic"><i className="fa fa-italic"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('underline')} title="Underline"><i className="fa fa-underline"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('strikeThrough')} title="Strikethrough"><i className="fa fa-strikethrough"></i></button>

                <div className="toolbar-divider"></div>

                {/* Alignment */}
                <button className="tool-btn" onClick={() => formatDoc('justifyLeft')} title="Align Left"><i className="fa fa-align-left"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('justifyCenter')} title="Align Center"><i className="fa fa-align-center"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('justifyRight')} title="Align Right"><i className="fa fa-align-right"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('justifyFull')} title="Justify"><i className="fa fa-align-justify"></i></button>

                <div className="toolbar-divider"></div>

                {/* Lists & Indents */}
                <button className="tool-btn" onClick={() => formatDoc('insertOrderedList')} title="Numbered List"><i className="fa fa-list-ol"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('insertUnorderedList')} title="Bullet List"><i className="fa fa-list-ul"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('outdent')} title="Decrease Indent"><i className="fa fa-indent fa-flip-horizontal"></i></button>
                <button className="tool-btn" onClick={() => formatDoc('indent')} title="Increase Indent"><i className="fa fa-indent"></i></button>

                <div className="flex-1"></div>

                {/* Actions */}
                <span className="text-[10px] font-bold text-stone-400 mr-4 flex items-center gap-2">
                    <i className="fa fa-cloud-arrow-up text-green-500"></i> Saved Locally
                </span>

                <button onClick={handlePrint} className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-colors shadow-sm">
                    <i className="fa fa-print mr-2"></i> Print / PDF
                </button>
            </div>

            {/* WORKSPACE */}
            <div className="word-workspace custom-scroll">
                <div
                    ref={editorRef}
                    className="a4-paper"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    data-placeholder="Start typing your legal document here..."
                >
                    {/* The editor area is intentionally left blank. The user types directly on the paper. */}
                </div>
            </div>

        </div>
    );
};

export default WordStudio;