import React, { useState, useEffect } from 'react';
import '../styles/DraftingBot.css';

const DraftingBot = () => {
    const [step, setStep] = useState(1);
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const year = new Date().getFullYear();

    // ==========================================
    // 🗄️ THE TEMPLATE DATABASE ENGINE
    // ==========================================
    const templatesDB = {
        ANTICIPATORY_BAIL: {
            title: "MEMORANDUM OF CRIMINAL PETITION",
            section: "(Under Section 482 of BNSS, 2023)",
            docketCategory: "CRIMINAL MISC PETITION",
            prayer: "enlarge the petitioner on bail in the event of his arrest",
            party1Role: "Petitioner / Accused",
            party2Role: "Respondent / State",
            defaultIndex: [
                { id: 1, desc: 'Memorandum of Criminal Petition', date: 'TODAY', page: '' },
                { id: 2, desc: 'Affidavit of Petitioner', date: 'TODAY', page: '' },
                { id: 3, desc: 'Copy of FIR', date: '-', page: '' },
                { id: 4, desc: 'Vakalatnama', date: 'TODAY', page: '' },
            ]
        },
        QUASH: {
            title: "MEMORANDUM OF CRIMINAL PETITION",
            section: "(Under Section 528 of BNSS, 2023)",
            docketCategory: "CRIMINAL MISC PETITION",
            prayer: "quash the proceedings",
            party1Role: "Petitioner / Accused",
            party2Role: "Respondent / State",
            defaultIndex: [
                { id: 1, desc: 'Memorandum of Criminal Petition', date: 'TODAY', page: '' },
                { id: 2, desc: 'Affidavit of Petitioner', date: 'TODAY', page: '' },
                { id: 3, desc: 'Certified Copy of FIR', date: '-', page: '' },
                { id: 4, desc: 'Certified Copy of Charge Sheet', date: '-', page: '' },
                { id: 5, desc: 'Vakalatnama', date: 'TODAY', page: '' },
            ]
        },
        CAVEAT: {
            title: "CAVEAT PETITION",
            section: "(Under Section 148-A of C.P.C)",
            docketCategory: "CAVEAT PETITION",
            prayer: "enter the caveat on record and direct the service of all process, papers and notices on the caveator’s Counsel",
            party1Role: "Caveator / Defendant",
            party2Role: "Expected Appellant / Plaintiff",
            defaultIndex: [
                { id: 1, desc: 'Caveat Petition with Affidavit', date: 'TODAY', page: '' },
                { id: 2, desc: 'Vakalatnama', date: 'TODAY', page: '' },
            ]
        },
        CMA: {
            title: "MEMORANDUM OF CIVIL MISCELLANEOUS APPEAL",
            section: "(Under Section 28 of the Hindu Marriage Act, 1955)",
            docketCategory: "CIVIL MISC APPEAL",
            prayer: "allow the appeal by setting aside the judgement/order of the lower court",
            party1Role: "Appellant / Petitioner",
            party2Role: "Respondent",
            defaultIndex: [
                { id: 1, desc: 'Memorandum of Civil Misc Appeal', date: 'TODAY', page: '' },
                { id: 2, desc: 'Certified copy of Judgment', date: '-', page: '' },
                { id: 3, desc: 'Certified copy of Decree', date: '-', page: '' },
                { id: 4, desc: 'Vakalatnama', date: 'TODAY', page: '' },
            ]
        },
        NBW_STAY: {
            title: "INTERLOCUTORY APPLICATION",
            section: "(Under Section 430 of BNSS, 2023)",
            docketCategory: "CRIMINAL MISC PETITION",
            prayer: "Grant stay of execution or Interim Protection from execution of NBW issued against the petitioner",
            party1Role: "Petitioner",
            party2Role: "Respondent",
            defaultIndex: [
                { id: 1, desc: 'Interlocutory Application', date: 'TODAY', page: '' },
                { id: 2, desc: 'Affidavit', date: 'TODAY', page: '' },
                { id: 3, desc: 'Vakalatnama', date: 'TODAY', page: '' },
            ]
        }
    };

    // ==========================================
    // 🧠 GLOBAL DRAFTING STATE
    // ==========================================
    const [data, setData] = useState({
        docType: 'ANTICIPATORY_BAIL',
        district: 'VISAKHAPATNAM',

        counselNames: 'Dr. SATTARU RAJANI (25730), Sri M.S.S. SWAYAM PRAKASH BABU (26789)',
        counselAddress: 'D.No 12-203/6/2/57, 2nd floor, Sree Lakshmi Narasimha Towers, Navodaya colony, Tadepalli, Guntur district.',

        psName: '',
        crimeNum: '',
        crimeYear: year.toString(),
        offences: '',
        lowerCourtName: '',

        prosecutionCase: '',
        petitionerFacts: ''
    });

    const [petitioners, setPetitioners] = useState([
        { id: 1, name: '', relationType: 'S/o', father: '', age: '', accusedNo: '', address: '' }
    ]);
    const [respondents, setRespondents] = useState([]);
    const [grounds, setGrounds] = useState([{ id: 1, text: '' }]);
    const [indexItems, setIndexItems] = useState([]);

    // Set Default Index on Load & Template Change
    useEffect(() => {
        const defaultList = templatesDB[data.docType].defaultIndex.map(item => ({
            ...item,
            id: Date.now() + Math.random(),
            date: item.date === 'TODAY' ? today : item.date
        }));
        setIndexItems(defaultList);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.docType]);

    // ==========================================
    // ⚙️ HANDLERS
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        const uppercaseFields = ['district', 'counselNames'];
        setData({ ...data, [name]: uppercaseFields.includes(name) ? value.toUpperCase() : value });
    };

    const addPetitioner = () => setPetitioners([...petitioners, { id: Date.now(), name: '', relationType: 'S/o', father: '', age: '', accusedNo: '', address: '' }]);
    const updatePetitioner = (id, field, value) => {
        const capsFields = ['name', 'father'];
        setPetitioners(petitioners.map(p => p.id === id ? { ...p, [field]: capsFields.includes(field) ? value.toUpperCase() : value } : p));
    };
    const removePetitioner = (id) => setPetitioners(petitioners.filter(p => p.id !== id));

    const addRespondent = () => setRespondents([...respondents, { id: Date.now(), name: '', address: '' }]);
    const updateRespondent = (id, field, value) => setRespondents(respondents.map(r => r.id === id ? { ...r, [field]: value } : r));
    const removeRespondent = (id) => setRespondents(respondents.filter(r => r.id !== id));

    const addGround = () => setGrounds([...grounds, { id: Date.now(), text: '' }]);
    const updateGround = (id, value) => setGrounds(grounds.map(g => g.id === id ? { ...g, text: value } : g));
    const removeGround = (id) => setGrounds(grounds.filter(g => g.id !== id));

    const addIndexItem = () => setIndexItems([...indexItems, { id: Date.now(), desc: '', date: '', page: '' }]);
    const updateIndexItem = (id, field, value) => setIndexItems(indexItems.map(i => i.id === id ? { ...i, [field]: value } : i));
    const removeIndexItem = (id) => setIndexItems(indexItems.filter(i => i.id !== id));

    const downloadDocx = () => alert("Bundle generation initialized! In the full build, this instantly triggers the 'docx' generator.");

    const activeTemplate = templatesDB[data.docType];
    const prosecutionArray = data.prosecutionCase.split('\n').filter(para => para.trim() !== '');
    const petitionerArray = data.petitionerFacts.split('\n').filter(para => para.trim() !== '');

    const primaryPetitioner = petitioners[0] || {};
    const hasMultiplePetitioners = petitioners.length > 1;

    // ==========================================
    // 🎨 RENDERERS
    // ==========================================
    return (
        <div className="bot-container animate-fade-in z-0">

            {/* LEFT: QUESTIONNAIRE */}
            <div className="bot-form-panel no-print">
                <div className="p-6 border-b border-stone-200 dark:border-white/5 bg-white dark:bg-black shrink-0">
                    <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">
                        <i className="fa fa-robot text-amber-500 mr-2"></i> Drafting Bot
                    </h2>
                </div>

                <div className="bot-form-scroll custom-scroll bg-stone-50 dark:bg-[#121212]">

                    <div className="step-indicator">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} onClick={() => setStep(s)} className={`step-dot ${step === s ? 'active' : step > s ? 'completed' : ''}`}></div>
                        ))}
                    </div>

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h3 className="step-title">1. Jurisdiction & Counsel</h3>
                            <div className="bot-input-group">
                                <span className="bot-label">Template Format</span>
                                <select name="docType" value={data.docType} onChange={handleChange} className="bot-select font-bold text-amber-600 border-amber-500">
                                    <option value="ANTICIPATORY_BAIL">Anticipatory Bail (BNSS 482)</option>
                                    <option value="QUASH">Criminal Quash (BNSS 528)</option>
                                    <option value="NBW_STAY">NBW Stay App (BNSS 430)</option>
                                    <option value="CAVEAT">High Court Caveat</option>
                                    <option value="CMA">Civil Misc Appeal (CMA)</option>
                                </select>
                            </div>
                            <div className="bot-input-group">
                                <span className="bot-label">District</span>
                                <input type="text" name="district" value={data.district} onChange={handleChange} className="bot-input force-caps" placeholder="e.g. VISAKHAPATNAM" />
                            </div>
                            <hr className="border-stone-200 dark:border-stone-800 my-6" />
                            <div className="bot-input-group">
                                <span className="bot-label">Counsel Names</span>
                                <textarea name="counselNames" value={data.counselNames} onChange={handleChange} className="bot-textarea force-caps h-16 resize-none" />
                            </div>
                            <div className="bot-input-group">
                                <span className="bot-label">Counsel Office Address</span>
                                <textarea name="counselAddress" value={data.counselAddress} onChange={handleChange} className="bot-textarea h-24 resize-none" />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DYNAMIC PETITIONERS */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="step-title mb-0">2. {activeTemplate.party1Role.split(' ')[0]}s</h3>
                                <button onClick={addPetitioner} className="text-[10px] font-black bg-amber-500 text-black px-3 py-1.5 rounded uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-sm">
                                    + ADD PARTY
                                </button>
                            </div>

                            {petitioners.map((p, idx) => (
                                <div key={p.id} className="p-5 border border-stone-200 dark:border-stone-800 rounded-xl mb-4 relative bg-white dark:bg-black shadow-sm">
                                    {petitioners.length > 1 && (
                                        <button onClick={() => removePetitioner(p.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors">
                                            <i className="fa fa-times-circle text-lg"></i>
                                        </button>
                                    )}
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 border-b border-stone-100 dark:border-stone-800 pb-2">
                                        Party No. {idx + 1}
                                    </p>

                                    <div className="bot-input-group">
                                        <span className="bot-label">Full Name</span>
                                        <input type="text" value={p.name} onChange={e => updatePetitioner(p.id, 'name', e.target.value)} className="bot-input force-caps" placeholder="e.g. CHOKKARA TIRUPATHI RAO" />
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="bot-input-group w-20 shrink-0">
                                            <span className="bot-label">Rel</span>
                                            <select value={p.relationType} onChange={e => updatePetitioner(p.id, 'relationType', e.target.value)} className="bot-select px-1">
                                                <option value="S/o">S/o</option><option value="W/o">W/o</option><option value="D/o">D/o</option>
                                            </select>
                                        </div>
                                        <div className="bot-input-group flex-1">
                                            <span className="bot-label">Father/Husband Name</span>
                                            <input type="text" value={p.father} onChange={e => updatePetitioner(p.id, 'father', e.target.value)} className="bot-input force-caps" placeholder="e.g. LAKSHMINAIDU" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="bot-input-group flex-1">
                                            <span className="bot-label">Age</span>
                                            <input type="text" value={p.age} onChange={e => updatePetitioner(p.id, 'age', e.target.value)} className="bot-input" placeholder="e.g. 45" />
                                        </div>
                                        <div className="bot-input-group flex-1">
                                            <span className="bot-label">Party Rank Tag</span>
                                            <input type="text" value={p.accusedNo} onChange={e => updatePetitioner(p.id, 'accusedNo', e.target.value)} className="bot-input" placeholder="e.g. A3" />
                                        </div>
                                    </div>

                                    <div className="bot-input-group mb-0">
                                        <span className="bot-label">Complete Address</span>
                                        <textarea value={p.address} onChange={e => updatePetitioner(p.id, 'address', e.target.value)} className="bot-textarea h-16 resize-none" placeholder="D.No, Street, Village..."></textarea>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 3: CRIME & DYNAMIC RESPONDENTS */}
                    {step === 3 && (
                        <div className="animate-fade-in">
                            <h3 className="step-title">3. Case Meta & Opposing Parties</h3>

                            {data.docType !== 'CAVEAT' && (
                                <>
                                    <div className="flex gap-3">
                                        <div className="bot-input-group flex-1">
                                            <span className="bot-label">Crime / Lower Case No.</span>
                                            <input type="text" name="crimeNum" value={data.crimeNum} onChange={handleChange} className="bot-input" />
                                        </div>
                                        <div className="bot-input-group flex-1">
                                            <span className="bot-label">Year</span>
                                            <input type="text" name="crimeYear" value={data.crimeYear} onChange={handleChange} className="bot-input" />
                                        </div>
                                    </div>
                                    <div className="bot-input-group">
                                        <span className="bot-label">Police Station / Lower Court Name</span>
                                        <input type="text" name="psName" value={data.psName} onChange={handleChange} className="bot-input" />
                                    </div>
                                    <div className="bot-input-group">
                                        <span className="bot-label">Offences / Sections</span>
                                        <input type="text" name="offences" value={data.offences} onChange={handleChange} className="bot-input" />
                                    </div>
                                    <hr className="border-stone-200 dark:border-stone-800 my-6" />
                                </>
                            )}

                            <div className="flex justify-between items-center mb-4">
                                <span className="bot-label mb-0 border-0 pl-0 text-slate-900 dark:text-white">Additional Opposing Parties</span>
                                <button onClick={addRespondent} className="text-[10px] font-black bg-amber-500 text-black px-2 py-1 rounded">ADD +</button>
                            </div>

                            {respondents.map((r, i) => (
                                <div key={r.id} className="p-4 border border-stone-200 dark:border-stone-800 rounded-xl mb-3 relative bg-white dark:bg-black">
                                    <button onClick={() => removeRespondent(r.id)} className="absolute top-2 right-2 text-red-500"><i className="fa fa-times"></i></button>
                                    <p className="text-[10px] font-bold text-stone-500 mb-2">Opposing Party {i + 2}</p>
                                    <input type="text" value={r.name} onChange={e => updateRespondent(r.id, 'name', e.target.value)} placeholder="Full Name" className="bot-input mb-2 py-2" />
                                    <textarea value={r.address} onChange={e => updateRespondent(r.id, 'address', e.target.value)} placeholder="Address..." className="bot-textarea h-12 py-2 resize-none"></textarea>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 4: FACTS & DYNAMIC GROUNDS */}
                    {step === 4 && (
                        <div className="animate-fade-in">
                            <h3 className="step-title">4. Facts & Grounds</h3>
                            <p className="text-[10px] text-amber-600 mb-4 uppercase tracking-widest font-bold">
                                <i className="fa fa-exclamation-triangle mr-1"></i> Exact match formatting. Each new line creates a numbered paragraph.
                            </p>

                            <div className="bot-input-group">
                                <span className="bot-label">Brief Case of the Prosecution</span>
                                <textarea name="prosecutionCase" value={data.prosecutionCase} onChange={handleChange} className="bot-textarea h-24 custom-scroll" placeholder="The brief case of the prosecution is that on..."></textarea>
                            </div>

                            <div className="bot-input-group mt-4">
                                <span className="bot-label">Brief Facts of the Case</span>
                                <textarea name="petitionerFacts" value={data.petitionerFacts} onChange={handleChange} className="bot-textarea h-32 custom-scroll" placeholder="It is respectfully submitted that..."></textarea>
                            </div>

                            <hr className="border-stone-200 dark:border-stone-800 my-6" />
                            <div className="flex justify-between items-center mb-4">
                                <span className="bot-label mb-0 border-0 pl-0 text-slate-900 dark:text-white">Grounds List</span>
                                <button onClick={addGround} className="text-[10px] font-black bg-amber-500 text-black px-2 py-1 rounded">ADD GROUND +</button>
                            </div>

                            {grounds.map((g, idx) => (
                                <div key={g.id} className="flex gap-2 items-start mb-3">
                                    <span className="font-bold text-stone-500 mt-3 w-5 shrink-0">{String.fromCharCode(65 + idx)}.</span>
                                    <textarea value={g.text} onChange={e => updateGround(g.id, e.target.value)} className="bot-textarea h-20 custom-scroll flex-1 resize-none" placeholder="Because the petitioner is falsely implicated..."></textarea>
                                    <button onClick={() => removeGround(g.id)} className="text-red-400 hover:text-red-600 mt-3 px-1"><i className="fa fa-times"></i></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 5: INDEX BUILDER & EXPORT */}
                    {step === 5 && (
                        <div className="animate-fade-in">
                            <h3 className="step-title">5. Index Builder</h3>
                            <p className="text-[10px] text-stone-500 mb-3 uppercase tracking-widest font-bold">Customize the documents attached in the bundle.</p>

                            <div className="space-y-2 mb-6">
                                {indexItems.map((item, idx) => (
                                    <div key={item.id} className="index-row-editor flex">
                                        <span className="text-xs font-bold w-6 text-stone-500">{idx + 1}.</span>
                                        <input type="text" value={item.desc} onChange={e => updateIndexItem(item.id, 'desc', e.target.value)} className="bot-input flex-1" placeholder="Doc Name" />
                                        <input type="text" value={item.date} onChange={e => updateIndexItem(item.id, 'date', e.target.value)} className="bot-input w-24 text-center" placeholder="Date" />
                                        <input type="text" value={item.page} onChange={e => updateIndexItem(item.id, 'page', e.target.value)} className="bot-input w-16 text-center" placeholder="Pg#" />
                                        <button onClick={() => removeIndexItem(item.id)} className="text-red-500 hover:text-red-600 px-2"><i className="fa fa-times"></i></button>
                                    </div>
                                ))}
                                <button onClick={addIndexItem} className="text-[10px] font-black text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded uppercase w-full border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-colors">
                                    + Add Document to Index
                                </button>
                            </div>
                            <button onClick={downloadDocx} className="w-full bg-amber-500 hover:bg-amber-600 text-black py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.02]">
                                Download Bundle (.docx) <i className="fa fa-download ml-2"></i>
                            </button>
                        </div>
                    )}

                    <div className="wizard-nav">
                        {step > 1 && <button onClick={() => setStep(s => s - 1)} className="btn-wizard btn-prev">Back</button>}
                        {step < 5 && <button onClick={() => setStep(s => s + 1)} className="btn-wizard btn-next">Next Step</button>}
                    </div>
                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW PANEL */}
            <div className="bot-preview-panel custom-scroll">
                <div className="legal-paper-wrapper" style={{ transform: 'scale(0.8)', transformOrigin: 'top center', marginTop: '-3rem' }}>

                    {/* PAGE 1: DOCKET */}
                    <div className="legal-paper flex flex-col justify-center">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '40px' }}>
                            <div>PRESENTED ON: ___________</div><div>FILED ON: ___________</div>
                        </div>

                        <div className="docket-box">
                            <div style={{ fontSize: '20px', textTransform: 'uppercase', marginBottom: '10px' }}>HIGH COURT OF ANDHRA PRADESH</div>
                            <div style={{ fontSize: '16px', marginBottom: '20px' }}>AT AMARAVATI</div>
                            <div style={{ fontSize: '18px', textDecoration: 'underline', marginBottom: '20px' }}>{activeTemplate.docketCategory}</div>
                            <div style={{ fontSize: '14px', marginBottom: '5px' }}>I.A.No. ____________ of {year}</div>
                            <div style={{ fontSize: '14px', marginBottom: '10px' }}>IN</div>
                            <div style={{ fontSize: '16px', marginBottom: '20px' }}>Crl.P.No. ____________ of {year}</div>

                            {data.docType !== 'CAVEAT' && (
                                <div style={{ fontSize: '12px', fontWeight: 'normal', marginBottom: '20px' }}>
                                    (Arising out of Crime No.{data.crimeNum || '___'}/{data.crimeYear || '___'} of {data.psName || '_______'}, {data.district || '_______'} Dist)
                                </div>
                            )}

                            <div style={{ fontSize: '16px', textDecoration: 'underline', marginBottom: '30px' }}>{data.district || '________'} DISTRICT</div>

                            <div style={{ textAlign: 'left', marginBottom: '20px', padding: '0 40px' }}>
                                {primaryPetitioner.name || '____________________'} {hasMultiplePetitioners ? '& Ors.' : ''}
                                <span style={{ float: 'right' }}>... {activeTemplate.party1Role}</span>
                            </div>

                            <div style={{ marginBottom: '20px' }}>BY</div>
                            <div style={{ textTransform: 'uppercase', fontSize: '14px' }}>
                                {data.counselNames || '__________________________'}<br />
                                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>COUNSEL</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '40px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px' }}>NATURE OF APPLICATION</div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>{activeTemplate.section}</div>
                            <div style={{ textAlign: 'justify', fontSize: '14px', lineHeight: '1.5' }}>
                                It is prayed that this Hon'ble Court may be pleased to {activeTemplate.prayer} in the interest of justice.
                            </div>
                        </div>
                    </div>

                    {/* PAGE 2: INDEX */}
                    <div className="legal-paper">
                        <div className="draft-court-title">IN THE HIGH COURT OF ANDHRA PRADESH AT AMARAVATI</div>
                        <div className="draft-case-num">Crl.P.No. ________ OF {year}</div>
                        {data.docType !== 'CAVEAT' && (
                            <div className="draft-case-num" style={{ fontWeight: 'normal' }}>
                                (Crime No.{data.crimeNum || '___'}/{data.crimeYear || '___'} of {data.psName || '_______'})
                            </div>
                        )}
                        <div className="draft-heading">CHRONOLOGICAL / RUNNING INDEX</div>

                        <table className="draft-index-table">
                            <thead>
                                <tr>
                                    <th width="10%">Sl.No.</th>
                                    <th width="60%">Description of Document</th>
                                    <th width="15%">Date</th>
                                    <th width="15%">Page No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {indexItems.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td>{idx + 1}.</td>
                                        <td style={{ textAlign: 'left' }}>{item.desc}</td>
                                        <td>{item.date}</td>
                                        <td>{item.page}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between' }}>
                            <div>Date: {today} <br />Place: Amaravati</div>
                            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                {data.counselNames.split(',')[0]}<br />
                                Counsel
                            </div>
                        </div>
                    </div>

                    {/* PAGE 3: MAIN PETITION */}
                    <div className="legal-paper">
                        <div className="draft-court-title">IN THE HIGH COURT OF ANDHRA PRADESH AT AMARAVATI</div>
                        <div className="draft-case-num">Crl.P.No. ________ OF {year}</div>
                        <div className="draft-between">BETWEEN:</div>

                        {/* Dynamic Petitioners */}
                        {petitioners.map((p, i) => (
                            <div className="draft-party-block" key={p.id}>
                                <div className="draft-party-desc">
                                    {hasMultiplePetitioners && `${i + 1}. `}
                                    {p.name ? <strong>{p.name}</strong> : '____________________'} {p.accusedNo && `(${p.accusedNo})`},<br />
                                    {p.relationType} {p.father || '____________________'}, Aged about {p.age || '___'} years, <br />
                                    R/o {p.address || '________________________________________'}.
                                </div>
                                {i === petitioners.length - 1 && (
                                    <div className="draft-party-role">… {activeTemplate.party1Role}</div>
                                )}
                            </div>
                        ))}

                        {data.docType !== 'CAVEAT' && <div className="draft-and">AND</div>}

                        {/* Respondent 1 (Only if not Caveat) */}
                        {data.docType !== 'CAVEAT' && (
                            <div className="draft-party-block">
                                <div className="draft-party-desc">
                                    <strong>1. The State of Andhra Pradesh</strong>, <br />
                                    Rep. by the Station House Officer, <br />
                                    {data.psName || '____________________'} P.S, <br />
                                    Rep. by its Public Prosecutor, High Court of A.P.
                                </div>
                                <div className="draft-party-role">… {activeTemplate.party2Role} No.1</div>
                            </div>
                        )}

                        {/* Additional Respondents */}
                        {respondents.map((r, i) => (
                            <div className="draft-party-block" key={r.id}>
                                <div className="draft-party-desc">
                                    <strong>{i + 2}. {r.name || '____________________'}</strong>, <br />
                                    {r.address || '________________________________________'}
                                </div>
                                <div className="draft-party-role">… {activeTemplate.party2Role} No.{i + 2}</div>
                            </div>
                        ))}

                        <div className="draft-heading">
                            {activeTemplate.title}<br />
                            <span style={{ fontSize: '12px', fontWeight: 'normal', textDecoration: 'none' }}>{activeTemplate.section}</span>
                        </div>

                        <div className="draft-para">
                            The Address for service of all notices and processes on the {activeTemplate.party1Role.split(' ')[0]} is that of their counsel, {data.counselNames}, {data.counselAddress}
                        </div>
                        <div className="draft-para">
                            For the reasons stated in the accompanying affidavit, it is respectfully prayed that this Hon'ble Court may be pleased to {activeTemplate.prayer}, in the interest of justice.
                        </div>

                        <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
                            <div>Date: {today}</div>
                            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>Counsel</div>
                        </div>
                    </div>

                    {/* PAGE 4: AFFIDAVIT */}
                    <div className="legal-paper">
                        <div className="draft-court-title">IN THE HIGH COURT OF ANDHRA PRADESH AT AMARAVATI</div>
                        <div className="draft-case-num">Crl.P.No. ________ OF {year}</div>
                        <div className="draft-between" style={{ textAlign: 'left' }}>
                            <strong>Between:</strong><br />
                            {primaryPetitioner.name || '____________________'} {hasMultiplePetitioners ? '& Ors.' : ''} <span style={{ float: 'right', fontWeight: 'bold' }}>... {activeTemplate.party1Role}</span><br />
                            {data.docType !== 'CAVEAT' && (
                                <>
                                    <div className="draft-and">AND</div>
                                    The State of AP {respondents.length > 0 ? '& Ors.' : ''} <span style={{ float: 'right', fontWeight: 'bold' }}>... {activeTemplate.party2Role}(s)</span>
                                </>
                            )}
                        </div>

                        <div className="draft-heading">AFFIDAVIT FILED BY THE {activeTemplate.party1Role.split(' ')[0].toUpperCase()}</div>

                        <div style={{ textIndent: '50px', textAlign: 'justify', lineHeight: '2', fontSize: '14px', marginBottom: '15px' }}>
                            I, <strong>{primaryPetitioner.name || '____________________'}</strong>, {primaryPetitioner.relationType} {primaryPetitioner.father || '____________________'}, aged about {primaryPetitioner.age || '___'} years, R/o {primaryPetitioner.address || '________________________________________'}, do hereby solemnly affirm and state as follows:
                        </div>

                        <div className="draft-para">
                            1. I am the {activeTemplate.party1Role.split(' ')[0].toLowerCase()} {hasMultiplePetitioners ? 'No.1' : ''} herein and I am well acquainted with the facts of the case.
                        </div>

                        {prosecutionArray.length > 0 && <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginTop: '20px', marginBottom: '10px' }}>BRIEF CASE OF THE PROSECUTION:</div>}
                        {prosecutionArray.map((para, idx) => <div key={`pros_${idx}`} className="draft-para">{para}</div>)}

                        {petitionerArray.length > 0 && <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginTop: '20px', marginBottom: '10px' }}>BRIEF FACTS OF THE CASE:</div>}
                        {petitionerArray.map((para, idx) => <div key={`pet_${idx}`} className="draft-para">{para}</div>)}

                        <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginTop: '20px', marginBottom: '15px' }}>GROUNDS:</div>
                        {grounds.map((g, idx) => (
                            <div key={`grnd_${idx}`} style={{ display: 'flex', gap: '15px', textAlign: 'justify', lineHeight: '2', fontSize: '14px', marginBottom: '15px' }}>
                                <div style={{ fontWeight: 'bold' }}>{String.fromCharCode(65 + idx)}.</div>
                                <div style={{ flex: 1 }}>{g.text || '[Ground text...]'}</div>
                            </div>
                        ))}

                        <div className="draft-para" style={{ marginTop: '20px' }}>
                            It is therefore prayed that this Hon'ble Court may be pleased to {activeTemplate.prayer}, in the interest of justice.
                        </div>

                        <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>Sworn and signed before me<br />on this the ____ day of {new Date().toLocaleString('default', { month: 'long' })}, {year}<br />at Amaravati. <br /><br /><strong>ADVOCATE</strong></div>
                            <div style={{ fontWeight: 'bold' }}>DEPONENT</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DraftingBot;