import React, { useState } from 'react';
import '../styles/MiscDrafts.css';

const MiscDrafts = () => {
    const [draftType, setDraftType] = useState('MEMO'); // MEMO or NOTICE
    const year = new Date().getFullYear(); // <-- FIXED: Added year definition

    // ==========================================
    // 🗄️ STATE: ADDITIONAL DOCUMENTS MEMO
    // ==========================================
    const [memoData, setMemoData] = useState({
        jurisdiction: 'CRIMINAL JURISDICTION',
        caseNo: 'Crl.P No: 8778 of 2024',
        petitionerName: 'Nethala Ambedkar',
        petitionerDesc: 'S/o. Anjaneyulu, Aged about 38 years, Occ: Junior Assistant...',
        respondentName: 'The State of Andhra Pradesh',
        respondentDesc: 'Rep. by its Public Prosecutor...',
        filingParty: 'PETITIONER', // PETITIONER or RESPONDENT
    });

    const [memoDocs, setMemoDocs] = useState([
        { id: 1, desc: 'Copy of Compromise Deed (Oppandu Raji Pathram)', date: '05.10.2020', page: '' },
        { id: 2, desc: 'Account Statement for the period from 01.10.2020 to 31.10.2020', date: '31.10.2020', page: '' }
    ]);

    // ==========================================
    // 🗄️ STATE: PERSONAL NOTICE
    // ==========================================
    const [noticeData, setNoticeData] = useState({
        advocateHeader: "DR. SATTARU RAJANI\nDr. M. RAMA KRISHNA\nM.S.S. SWAYAM PRAKASH BABU\n12-203/6/2/57; 2nd floor Sree lakshmi Narasimha Towers,\nNear rainbow villas, Navodaya colony,\nTadepalli, Guntur district-522501, A.P.\nEmail: rajanisattaru@gmail.com | Ph: +91 9515098589",
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),

        toName: '',
        toAge: '',
        toFather: '',
        toOcc: '',
        toAddress: '',

        caseNo: 'W.P. No. 2311 / 2026',
        clientName: 'Duggempudi Pitchi Reddy',
        caseSubject: 'prevention and removal of illegal and unauthorized construction being carried out in a portion of agricultural land',
        admissionDate: '04.02.2026',
        nextHearingDate: '24.02.2026'
    });

    // ==========================================
    // ⚙️ HANDLERS
    // ==========================================
    const handleMemoChange = (e) => setMemoData({ ...memoData, [e.target.name]: e.target.value });
    const handleNoticeChange = (e) => setNoticeData({ ...noticeData, [e.target.name]: e.target.value });

    // Memo Docs Logic
    const addMemoDoc = () => setMemoDocs([...memoDocs, { id: Date.now(), desc: '', date: '', page: '' }]);
    const updateMemoDoc = (id, field, value) => setMemoDocs(memoDocs.map(d => d.id === id ? { ...d, [field]: value } : d));
    const removeMemoDoc = (id) => setMemoDocs(memoDocs.filter(d => d.id !== id));

    const downloadDocx = () => alert(`Generating ${draftType} Bundle...`);

    // ==========================================
    // 🎨 RENDERERS
    // ==========================================
    return (
        <div className="misc-container animate-fade-in z-0">

            {/* LEFT: FORM PANEL */}
            <div className="misc-form-panel no-print">
                <div className="p-6 border-b border-stone-200 dark:border-white/5 bg-white dark:bg-black shrink-0">
                    <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">
                        <i className="fa fa-file-lines text-amber-500 mr-2"></i> Misc Drafts
                    </h2>
                </div>

                <div className="misc-form-scroll custom-scroll bg-stone-50 dark:bg-[#121212]">

                    {/* TYPE SWITCHER */}
                    <div className="misc-toggle-bar p-1">
                        <button onClick={() => setDraftType('MEMO')} className={`misc-toggle-btn ${draftType === 'MEMO' ? 'active' : ''}`}>Addl. Docs Memo</button>
                        <button onClick={() => setDraftType('NOTICE')} className={`misc-toggle-btn ${draftType === 'NOTICE' ? 'active' : ''}`}>Personal Notice</button>
                    </div>

                    {/* ========================================== */}
                    {/* FORM: ADDITIONAL DOCUMENTS MEMO            */}
                    {/* ========================================== */}
                    {draftType === 'MEMO' && (
                        <div className="animate-fade-in">
                            <div className="misc-input-group">
                                <span className="misc-label">Jurisdiction & Case No</span>
                                <div className="flex gap-2">
                                    <select name="jurisdiction" value={memoData.jurisdiction} onChange={handleMemoChange} className="misc-select w-1/2">
                                        <option value="CRIMINAL JURISDICTION">Criminal</option>
                                        <option value="CIVIL JURISDICTION">Civil</option>
                                        <option value="APPELLATE JURISDICTION">Appellate</option>
                                    </select>
                                    <input type="text" name="caseNo" value={memoData.caseNo} onChange={handleMemoChange} className="misc-input w-1/2 force-caps" placeholder="e.g. Crl.P No: 8778 of 2024" />
                                </div>
                            </div>

                            <hr className="border-stone-200 dark:border-stone-800 my-6" />

                            <div className="misc-input-group">
                                <span className="misc-label">Filing On Behalf Of</span>
                                <select name="filingParty" value={memoData.filingParty} onChange={handleMemoChange} className="misc-select font-bold text-amber-600 border-amber-500">
                                    <option value="PETITIONER">Petitioner / Appellant</option>
                                    <option value="RESPONDENT">Respondent / Defendant</option>
                                </select>
                            </div>

                            <div className="misc-input-group">
                                <span className="misc-label">Party 1 (Petitioner/Appellant)</span>
                                <input type="text" name="petitionerName" value={memoData.petitionerName} onChange={handleMemoChange} className="misc-input force-caps mb-2" placeholder="Full Name" />
                                <textarea name="petitionerDesc" value={memoData.petitionerDesc} onChange={handleMemoChange} className="misc-textarea h-16 resize-none" placeholder="Description / Address..."></textarea>
                            </div>

                            <div className="misc-input-group">
                                <span className="misc-label">Party 2 (Respondent/State)</span>
                                <input type="text" name="respondentName" value={memoData.respondentName} onChange={handleMemoChange} className="misc-input force-caps mb-2" placeholder="The State of A.P." />
                                <textarea name="respondentDesc" value={memoData.respondentDesc} onChange={handleMemoChange} className="misc-textarea h-16 resize-none" placeholder="Rep. by its Public Prosecutor..."></textarea>
                            </div>

                            <hr className="border-stone-200 dark:border-stone-800 my-6" />

                            <div className="flex justify-between items-center mb-4">
                                <span className="misc-label mb-0 border-0 pl-0 text-slate-900 dark:text-white">Documents to File</span>
                            </div>

                            <div className="space-y-2 mb-6">
                                {memoDocs.map((item, idx) => (
                                    <div key={item.id} className="misc-row-editor flex">
                                        <span className="text-[10px] font-bold w-4 mt-3 text-stone-500">{idx + 1}.</span>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <textarea value={item.desc} onChange={e => updateMemoDoc(item.id, 'desc', e.target.value)} className="misc-textarea py-2 px-3 h-12 resize-none text-xs" placeholder="Document Description..."></textarea>
                                            <div className="flex gap-1">
                                                <input type="text" value={item.date} onChange={e => updateMemoDoc(item.id, 'date', e.target.value)} className="misc-input py-1.5 px-3 flex-1 text-xs" placeholder="Date (Optional)" />
                                                <input type="text" value={item.page} onChange={e => updateMemoDoc(item.id, 'page', e.target.value)} className="misc-input py-1.5 px-3 w-16 text-xs text-center" placeholder="Pg#" />
                                            </div>
                                        </div>
                                        <button onClick={() => removeMemoDoc(item.id)} className="text-red-500 hover:text-red-600 px-2 mt-2"><i className="fa fa-times"></i></button>
                                    </div>
                                ))}
                                <button onClick={addMemoDoc} className="text-[10px] font-black text-amber-600 bg-amber-500/10 px-3 py-2 rounded uppercase w-full border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-colors mt-2">
                                    + Add Document
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ========================================== */}
                    {/* FORM: PERSONAL NOTICE                      */}
                    {/* ========================================== */}
                    {draftType === 'NOTICE' && (
                        <div className="animate-fade-in">
                            <div className="misc-input-group">
                                <span className="misc-label">Advocate Details (Letterhead)</span>
                                <textarea name="advocateHeader" value={noticeData.advocateHeader} onChange={handleNoticeChange} className="misc-textarea h-28 resize-none text-xs" />
                            </div>

                            <div className="misc-input-group">
                                <span className="misc-label">Notice Date</span>
                                <input type="text" name="date" value={noticeData.date} onChange={handleNoticeChange} className="misc-input" />
                            </div>

                            <hr className="border-stone-200 dark:border-stone-800 my-6" />

                            <span className="misc-label">Recipient Details (To:)</span>
                            <div className="misc-input-group">
                                <input type="text" name="toName" value={noticeData.toName} onChange={handleNoticeChange} className="misc-input force-caps mb-2" placeholder="Name (e.g. Shaik Rafi)" />
                                <div className="flex gap-2 mb-2">
                                    <input type="text" name="toAge" value={noticeData.toAge} onChange={handleNoticeChange} className="misc-input w-24" placeholder="Age" />
                                    <input type="text" name="toFather" value={noticeData.toFather} onChange={handleNoticeChange} className="misc-input flex-1" placeholder="S/o or W/o" />
                                </div>
                                <input type="text" name="toOcc" value={noticeData.toOcc} onChange={handleNoticeChange} className="misc-input mb-2" placeholder="Occupation" />
                                <textarea name="toAddress" value={noticeData.toAddress} onChange={handleNoticeChange} className="misc-textarea h-16 resize-none" placeholder="Address..."></textarea>
                            </div>

                            <hr className="border-stone-200 dark:border-stone-800 my-6" />

                            <span className="misc-label">Case & Subject Matter</span>
                            <div className="misc-input-group">
                                <input type="text" name="caseNo" value={noticeData.caseNo} onChange={handleNoticeChange} className="misc-input force-caps mb-2" placeholder="Case No (e.g. W.P. No. 2311 / 2026)" />
                                <input type="text" name="clientName" value={noticeData.clientName} onChange={handleNoticeChange} className="misc-input force-caps mb-2" placeholder="Our Client Name" />
                                <textarea name="caseSubject" value={noticeData.caseSubject} onChange={handleNoticeChange} className="misc-textarea h-20 resize-none" placeholder="Purpose (e.g. prevention and removal of illegal construction...)"></textarea>
                            </div>

                            <div className="flex gap-2">
                                <div className="misc-input-group flex-1">
                                    <span className="misc-label">Admission Date</span>
                                    <input type="text" name="admissionDate" value={noticeData.admissionDate} onChange={handleNoticeChange} className="misc-input" placeholder="DD.MM.YYYY" />
                                </div>
                                <div className="misc-input-group flex-1">
                                    <span className="misc-label">Next Hearing</span>
                                    <input type="text" name="nextHearingDate" value={noticeData.nextHearingDate} onChange={handleNoticeChange} className="misc-input" placeholder="DD.MM.YYYY" />
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={downloadDocx} className="w-full bg-amber-500 hover:bg-amber-600 text-black py-4 rounded-xl font-black uppercase tracking-widest mt-6 shadow-lg transition-transform hover:scale-[1.02]">
                        Download Draft (.docx) <i className="fa fa-download ml-2"></i>
                    </button>
                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW PANEL */}
            <div className="misc-preview-panel custom-scroll">
                <div className="legal-paper-wrapper" style={{ transform: 'scale(0.8)', transformOrigin: 'top center', marginTop: '-3rem' }}>

                    {/* ========================================== */}
                    {/* PREVIEW: ADDITIONAL DOCUMENTS MEMO (2 PAGES) */}
                    {/* ========================================== */}
                    {draftType === 'MEMO' && (
                        <>
                            {/* PAGE 1: INDEX */}
                            <div className="legal-paper">
                                <div className="draft-court-title">IN THE HIGH COURT OF ANDHRA PRADESH AT AMARAVATI</div>
                                <div className="draft-court-title" style={{ textDecoration: 'none', marginBottom: '30px' }}>{memoData.jurisdiction}</div>
                                <div className="draft-case-num">{memoData.caseNo || 'Crl.P No: ________ of 202_'}</div>

                                <div className="draft-between" style={{ textAlign: 'left', marginTop: '30px' }}>
                                    <strong>BETWEEN:</strong><br />
                                    {memoData.petitionerName || '____________________'} <span style={{ float: 'right', fontWeight: 'bold' }}>... Petitioner</span><br />
                                    <div className="draft-and">AND</div>
                                    {memoData.respondentName || '____________________'} <span style={{ float: 'right', fontWeight: 'bold' }}>... Respondent</span>
                                </div>

                                <div className="draft-heading" style={{ marginTop: '50px' }}>RUNNING INDEX</div>

                                <table className="draft-index-table">
                                    <thead>
                                        <tr>
                                            <th width="10%">Sl.No.</th>
                                            <th width="50%">Description of Document</th>
                                            <th width="20%">Date</th>
                                            <th width="20%">Page No.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {memoDocs.map((item, idx) => (
                                            <tr key={item.id}>
                                                <td>{idx + 1}</td>
                                                <td style={{ textAlign: 'left' }}>{item.desc || '___________________'}</td>
                                                <td>{item.date || '-'}</td>
                                                <td>{item.page}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* PAGE 2: MAIN MEMO */}
                            <div className="legal-paper">
                                <div className="draft-court-title">IN THE HIGH COURT OF ANDHRA PRADESH AT AMARAVATI</div>
                                <div className="draft-court-title" style={{ textDecoration: 'none', marginBottom: '30px' }}>{memoData.jurisdiction}</div>
                                <div className="draft-case-num">{memoData.caseNo || 'Crl.P No: ________ of 202_'}</div>

                                <div className="draft-between" style={{ textAlign: 'left', marginTop: '30px' }}>
                                    <strong>BETWEEN:</strong><br />
                                    <strong>{memoData.petitionerName || '____________________'}</strong><br />
                                    {memoData.petitionerDesc}<br />
                                    <span style={{ float: 'right', fontWeight: 'bold' }}>... Petitioner</span><br /><br />
                                    <div className="draft-and">AND</div>
                                    <strong>{memoData.respondentName || '____________________'}</strong><br />
                                    {memoData.respondentDesc}<br />
                                    <span style={{ float: 'right', fontWeight: 'bold' }}>... Respondent</span>
                                </div>

                                <div className="draft-heading" style={{ marginTop: '40px' }}>MEMO FILED ON BEHALF OF THE {memoData.filingParty}</div>

                                <div className="draft-para">
                                    It is humbly submitted that the above matter bearing {memoData.caseNo || '________'} is filed by the {memoData.filingParty === 'PETITIONER' ? 'Petitioner' : 'Respondent'} and is pending adjudication before this Hon’ble Court.
                                </div>
                                <div className="draft-para">
                                    It is further respectfully submitted that, for the purpose of assisting this Hon’ble Court in the proper and effective adjudication of the present matter, the {memoData.filingParty === 'PETITIONER' ? 'Petitioner' : 'Respondent'} is herewith filing the following documents, which are relevant, material, and necessary for a just and complete consideration of the issues involved in the present case:
                                </div>

                                <div style={{ marginLeft: '50px', marginBottom: '20px', lineHeight: '1.8', fontSize: '14px' }}>
                                    {memoDocs.map((item, idx) => (
                                        <div key={item.id} style={{ marginBottom: '10px' }}>
                                            {idx + 1}. <strong>{item.desc || '___________________'}</strong> {item.date ? `dated ${item.date}` : ''}.
                                        </div>
                                    ))}
                                </div>

                                <div className="draft-para">
                                    It is respectfully submitted that the above documents clearly evidence the prior proceedings and material facts which are directly relevant for the proper adjudication of the present matter.
                                </div>
                                <div className="draft-para">
                                    Hence, this Memo is filed.
                                </div>

                                <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>Date: ____.{new Date().getMonth() + 1}.{year}<br /><br />AMARAVATI</div>
                                    <div style={{ fontWeight: 'bold' }}>COUNSEL FOR {memoData.filingParty}</div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ========================================== */}
                    {/* PREVIEW: PERSONAL NOTICE (1 PAGE)          */}
                    {/* ========================================== */}
                    {draftType === 'NOTICE' && (
                        <div className="legal-paper">
                            {/* Letterhead */}
                            <div className="notice-header">
                                {noticeData.advocateHeader.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                            </div>

                            <div className="notice-date">Date: {noticeData.date}</div>

                            <div className="notice-to">
                                <strong>To,</strong><br />
                                {noticeData.toName || '__________________________'}, aged about {noticeData.toAge || '___'} years,<br />
                                {noticeData.toFather ? `${noticeData.toFather},` : ''} Occ: {noticeData.toOcc || '___________'},<br />
                                {noticeData.toAddress.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                            </div>

                            <div className="notice-salutation">Respected Sir/Madam,</div>

                            <div className="notice-body">
                                As per the orders of the Hon’ble High Court of Andhra Pradesh in <strong>{noticeData.caseNo || '___________________'}</strong>, a personal notice is hereby issued to you on behalf of my client, namely <strong>{noticeData.clientName || '___________________'}</strong>.
                            </div>

                            <div className="notice-body">
                                Who have filed the above matter before the Hon’ble High Court of Andhra Pradesh for {noticeData.caseSubject || '________________________________________________'}.
                            </div>

                            <div className="notice-body">
                                When the said matter came up for admission before the Hon’ble High Court on <strong>{noticeData.admissionDate || '________'}</strong>, the Hon’ble Court was pleased to direct issuance of personal notice to you, requiring your appearance either in person or through an advocate on or before the next date of hearing, as scheduled by the Hon’ble High Court, i.e., <strong>{noticeData.nextHearingDate || '________'}</strong>.
                            </div>

                            <div className="notice-body">
                                Hence, this notice is issued to you in compliance with the said order of the Hon’ble High Court.
                            </div>

                            <div style={{ marginTop: '80px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>
                                Advocate
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MiscDrafts;