import React, { useState } from 'react';
import '../styles/InvoiceGenerator.css';

// --- HELPER: Number to Words (Indian Format) ---
const numToWords = (num) => {
    if (num === 0) return "Zero";

    const words = {
        0: '', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six',
        7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Eleven', 12: 'Twelve',
        13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen',
        17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty',
        30: 'Thirty', 40: 'Forty', 50: 'Fifty', 60: 'Sixty', 70: 'Seventy',
        80: 'Eighty', 90: 'Ninety'
    };

    const chunkToWords = (n) => {
        if (n < 20) return words[n];
        else if (n < 100) return words[Math.floor(n / 10) * 10] + (n % 10 === 0 ? '' : ' ' + words[n % 10]);
        else if (n < 1000) return words[Math.floor(n / 100)] + ' Hundred' + (n % 100 === 0 ? '' : ' and ' + chunkToWords(n % 100));
        return "";
    };

    let n = Math.floor(num);
    let result = [];

    if (n >= 10000000) { result.push(chunkToWords(Math.floor(n / 10000000)) + " Crore"); n %= 10000000; }
    if (n >= 100000) { result.push(chunkToWords(Math.floor(n / 100000)) + " Lakh"); n %= 100000; }
    if (n >= 1000) { result.push(chunkToWords(Math.floor(n / 1000)) + " Thousand"); n %= 1000; }
    if (n > 0) { result.push(chunkToWords(n)); }

    return result.join(' ');
};

const InvoiceGenerator = () => {
    // Zoom State adjusted to 0.65 to fit laptop screens perfectly by default
    const [zoom, setZoom] = useState(0.65);

    // Firm State
    const [logoUrl, setLogoUrl] = useState('');
    const [signUrl, setSignUrl] = useState('');
    const [authName, setAuthName] = useState('M.S.S. SWAYAM PRAKASH BABU');
    const [authRole, setAuthRole] = useState('PRINCIPAL ASSOCIATE');

    // Meta State
    const [invNum, setInvNum] = useState(`2026_001`);
    const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);

    // Client State
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');

    // Line Items State
    const [items, setItems] = useState([
        { id: 1, desc: '', qty: 1, price: '' },
        { id: 2, desc: '', qty: 1, price: '' },
        { id: 3, desc: '', qty: 1, price: '' }
    ]);

    const handleImageUpload = (e, setUrl) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setUrl(url);
        }
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // Calculations
    const validItems = items.filter(i => i.desc.trim() !== '' && Number(i.price) > 0);
    const grandTotal = validItems.reduce((sum, i) => sum + (Number(i.qty) * Number(i.price)), 0);

    return (
        <div className="studio-container animate-fade-in z-0">

            {/* LEFT PANEL: CONTROLS */}
            <div className="controls-panel no-print">
                <div className="p-6 border-b border-stone-200 dark:border-white/5 bg-white dark:bg-black shrink-0">
                    <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-tighter">
                        <i className="fa fa-file-invoice text-amber-500 mr-2"></i> Invoice Studio
                    </h2>
                </div>

                <div className="controls-scroll custom-scroll bg-white dark:bg-[#121212]">

                    {/* 1. Firm Details */}
                    <div className="form-group">
                        <span className="form-label">1. Firm Branding</span>
                        <div className="flex gap-3 mb-3">
                            <label className="flex-1 flex flex-col items-center p-4 border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-black rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                                <i className="fa fa-cloud-upload-alt text-stone-400 mb-1 text-lg"></i>
                                <span className="text-[10px] font-bold text-stone-500 uppercase">Upload Logo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setLogoUrl)} />
                            </label>
                            <label className="flex-1 flex flex-col items-center p-4 border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-black rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                                <i className="fa fa-signature text-stone-400 mb-1 text-lg"></i>
                                <span className="text-[10px] font-bold text-stone-500 uppercase">Upload Sign</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setSignUrl)} />
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div>
                                <span className="text-[9px] font-bold text-stone-400 uppercase mb-1 block">Authority</span>
                                <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="studio-input" />
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-stone-400 uppercase mb-1 block">Role</span>
                                <input type="text" value={authRole} onChange={e => setAuthRole(e.target.value)} className="studio-input" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-t border-stone-100 dark:border-white/5 my-6" />

                    {/* 2. Client Details */}
                    <div className="form-group">
                        <span className="form-label">2. Client Details</span>
                        <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="studio-input mb-3" placeholder="Client Name" />
                        <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="studio-input h-20 resize-none" placeholder="Billing Address..."></textarea>
                    </div>

                    <hr className="border-t border-stone-100 dark:border-white/5 my-6" />

                    {/* 3. Invoice Meta */}
                    <div className="form-group">
                        <span className="form-label">3. Invoice Meta</span>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-[9px] font-bold text-stone-400 uppercase mb-1 block">Invoice #</span>
                                <input type="text" value={invNum} onChange={e => setInvNum(e.target.value)} className="studio-input" placeholder="INV-001" />
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-stone-400 uppercase mb-1 block">Date</span>
                                <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className="studio-input" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-t border-stone-100 dark:border-white/5 my-6" />

                    {/* 4. Billables */}
                    <div className="form-group">
                        <span className="form-label">4. Billables</span>
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={item.id} className="flex gap-2">
                                    <input type="text" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} placeholder={`Item ${idx + 1}`} className="studio-input flex-1" />
                                    <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} placeholder="Qty" className="studio-input w-16 text-center" />
                                    <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} placeholder="₹" className="studio-input w-24 text-right" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 mb-10">
                        <button onClick={() => window.print()} className="btn-download flex items-center justify-center gap-2">
                            <i className="fa fa-file-pdf"></i> Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: PREVIEW */}
            <div className="preview-panel custom-scroll">

                {/* Zoom Controls */}
                <div className="zoom-toolbar no-print">
                    <i className="fa fa-minus zoom-btn" onClick={() => zoom > 0.4 && setZoom(z => Number((z - 0.1).toFixed(1)))}></i>
                    <input type="range" min="0.4" max="1.5" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} />
                    <i className="fa fa-plus zoom-btn" onClick={() => zoom < 1.5 && setZoom(z => Number((z + 0.1).toFixed(1)))}></i>
                </div>

                {/* --- A4 PAPER --- */}
                <div id="invoice-preview-wrapper" style={{ transform: `scale(${zoom})` }}>
                    <div className="invoice-paper">

                        {/* Header */}
                        <div className="inv-header">
                            <div className="inv-title-block">
                                <div className="inv-type">INVOICE</div>
                            </div>
                            <div className="inv-firm-info">
                                {logoUrl && <img src={logoUrl} alt="Logo" className="inv-logo-preview" />}
                                <div className="inv-firm-name">MLS & Co. LAW FIRM</div>
                                <div className="inv-firm-text">
                                    112-203/6/2/57; 2nd Floor,<br />
                                    Sree Lakshmi Narasimha Towers,<br />
                                    Tadepalli, Guntur-522501, AP<br />
                                    +91 7995277899 | office.mlslaw@gmail.com
                                </div>

                                <div className="inv-meta">
                                    <div>INVOICE NO <span>{invNum || '000'}</span></div>
                                    <div>DATE ISSUED <span>{invDate}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Info Block */}
                        <div className="inv-info">
                            <div className="inv-to">
                                <div className="inv-label">BILL TO:</div>
                                <div className="inv-client-name">{clientName || 'CLIENT NAME'}</div>
                                <div className="inv-client-addr">{clientAddress || 'Address Line 1...'}</div>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    <th width="8%">#</th>
                                    <th width="50%" className="txt-l">DESCRIPTION</th>
                                    <th width="12%">QTY</th>
                                    <th width="15%" className="txt-r">PRICE</th>
                                    <th width="15%" className="txt-r">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {validItems.length > 0 ? validItems.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td>{idx + 1}</td>
                                        <td className="txt-l">{item.desc}</td>
                                        <td>{item.qty}</td>
                                        <td className="txt-r">{Number(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="txt-r">{((item.qty || 0) * (item.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="cen" style={{ padding: '40px', color: '#ccc', fontStyle: 'italic' }}>
                                            Add billable items to preview...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Totals & Signature */}
                        <div className="inv-bottom">
                            <div className="inv-total-row">
                                <div className="total-lbl">Grand Total</div>
                                <div className="total-val">Rs. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            </div>
                            {grandTotal > 0 && (
                                <div className="amount-words">
                                    ({numToWords(grandTotal)} Rupees Only)
                                </div>
                            )}

                            <div className="inv-sign-box">
                                {signUrl && <img src={signUrl} alt="Sign" className="inv-sign-img" />}
                                <div className="inv-sign-line"></div>
                                <div className="inv-sign-name">{authName || 'AUTHORIZED SIGNATORY'}</div>
                                <div className="inv-sign-role">{authRole || 'DESIGNATION'}</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceGenerator;