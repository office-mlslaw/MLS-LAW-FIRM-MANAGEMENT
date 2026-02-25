import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PersonnelRoll.css';

const PersonnelRoll = () => {
    const navigate = useNavigate();
    const API_BASE = 'http://127.0.0.1:8080/api/personnel';

    // --- STATE MANAGEMENT ---
    const [roll, setRoll] = useState({ partners: [], associates: [], interns: [], staff: [] });
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDossierOpen, setIsDossierOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ visible: false, x: 0, y: 0, userId: null, userName: '' });
    const [performance, setPerformance] = useState({ peer_score: 0, senior_score: 0 });
    const [time, setTime] = useState(new Date());

    const [tempPasskey, setTempPasskey] = useState('');
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', username: '', email: '', designation: '', category: 'ASSOCIATE', employee_code: '', is_admin: false
    });

    // Separate state for the Edit Form
    const [editFormData, setEditFormData] = useState({
        emp_id: '', first_name: '', last_name: '', username: '', email: '', designation: '', category: '', employee_code: '', is_admin: false
    });

    // --- LIVE CLOCK TICKER ---
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { fetchRoll(); }, []);

    const fetchRoll = async () => {
        try {
            const res = await fetch(`${API_BASE}/roll`);
            if (!res.ok) throw new Error("Backend Offline");
            const data = await res.json();
            setRoll(data);
        } catch (err) {
            console.error("Roll sync failed:", err);
            setRoll({ partners: [], associates: [], interns: [], staff: [] });
        }
    };

    // --- SORTING HELPER ---
    // Automatically sorts the mapped arrays by employee code (ascending)
    const sortByCode = (arr) => {
        if (!arr) return [];
        return [...arr].sort((a, b) => {
            const codeA = parseInt(a.employee_code || '0', 10);
            const codeB = parseInt(b.employee_code || '0', 10);
            return codeA - codeB;
        });
    };

    // --- ONBOARDING LOGIC ---
    const openAddModal = () => {
        const total = (roll.partners?.length || 0) + (roll.associates?.length || 0) + (roll.interns?.length || 0) + (roll.staff?.length || 0);
        const code = (total + 1).toString().padStart(3, '0');
        const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
        let passkey = "";
        for (let i = 0; i < 10; ++i) passkey += charset.charAt(Math.floor(Math.random() * charset.length));

        setTempPasskey(`LEX-${passkey}`);
        setFormData({ first_name: '', last_name: '', username: '', email: '', designation: '', category: 'ASSOCIATE', employee_code: code, is_admin: false });
        setIsAddModalOpen(true);
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCheckboxChange = (e) => setFormData({ ...formData, is_admin: e.target.checked });

    const handleOnboardSubmit = async (e) => {
        e.preventDefault();
        const finalPayload = { ...formData, password: tempPasskey };

        try {
            const res = await fetch(`${API_BASE}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalPayload)
            });
            const result = await res.json();

            if (res.ok) {
                alert(`✅ ONBOARDING SUCCESSFUL!\n\nUser: ${formData.username}\nTemp Passkey: ${tempPasskey}`);
                setIsAddModalOpen(false);
                fetchRoll();
            } else {
                alert(`❌ Onboarding Failed: ${result.message}`);
            }
        } catch (err) {
            alert("❌ Connection Error: Could not reach the database. Is the backend running?");
        }
    };

    // --- EDIT LOGIC ---
    const openEditModalFromMenu = () => {
        const allUsers = [...(roll.partners || []), ...(roll.associates || []), ...(roll.interns || []), ...(roll.staff || [])];
        const profile = allUsers.find(p => p.user && p.user.id === menuPos.userId);

        if (profile) {
            setEditFormData({
                emp_id: profile.user.id,
                first_name: profile.user.first_name,
                last_name: profile.user.last_name,
                username: profile.user.username,
                email: profile.user.email,
                designation: profile.designation,
                category: profile.category,
                employee_code: profile.employee_code,
                is_admin: profile.user.is_admin || false
            });
            setIsEditModalOpen(true);
        }
        setMenuPos({ ...menuPos, visible: false });
    };

    const handleEditInputChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    const handleEditCheckboxChange = (e) => setEditFormData({ ...editFormData, is_admin: e.target.checked });

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/edit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            });
            if (res.ok) {
                setIsEditModalOpen(false);
                fetchRoll(); // Refreshes grid with sorted changes
            } else {
                const data = await res.json();
                alert(`Update failed: ${data.message}`);
            }
        } catch (err) {
            alert("❌ Connection Error: Backend is offline.");
        }
    };

    // --- ACTIONS ---
    const openDossier = (user) => {
        setSelectedUser(user);
        setIsDossierOpen(true);
        setPerformance({ peer_score: Math.floor(Math.random() * 20) + 80, senior_score: Math.floor(Math.random() * 20) + 80 });
    };

    const initiateSignal = (e, userId) => {
        e.stopPropagation();
        navigate(`/chat?target=${userId}`);
    };

    const handleContextMenu = (e, userId, userName) => {
        e.preventDefault(); e.stopPropagation();
        setMenuPos({ visible: true, x: e.clientX, y: e.clientY, userId, userName });
    };

    const toggleStatus = async (id) => {
        await fetch(`${API_BASE}/toggle-status/${id}`, { method: 'POST' });
        fetchRoll(); setMenuPos({ ...menuPos, visible: false });
    };

    const executeRemoval = async () => {
        await fetch(`${API_BASE}/remove/${menuPos.userId}`, { method: 'DELETE' });
        fetchRoll(); setIsDeleteModalOpen(false);
    };

    const renderCard = (profile, tier) => {
        const user = profile.user || {};
        return (
            <div key={user.id} className={`lex-horizontal-card card-${tier} ${!user.is_active ? 'employee-deactivated' : ''}`} onClick={() => openDossier({ ...profile, ...user })}>
                <div className="lex-emp-id">#{profile.employee_code || '000'}</div>
                <div className="lex-card-img-wrapper">
                    <img src={profile.profile_pic || `https://ui-avatars.com/api/?name=${user.first_name}&background=1c1917&color=EAB308`} className="lex-card-img" alt="Profile" />
                </div>
                <div className="lex-card-content flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="role-text text-[9px] font-black uppercase tracking-widest text-amber-500">{profile.designation || 'Staff'}</h3>
                                {user.is_admin && <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Admin</span>}
                            </div>
                            <h2 className="text-xl md:text-2xl font-black theme-text-main leading-none mb-1">{user.first_name} {user.last_name}</h2>
                        </div>
                    </div>
                    <div className="lex-card-actions mt-4">
                        <button className="lex-chat-btn" onClick={(e) => initiateSignal(e, user.id)}>
                            <i className="fa-solid fa-comment-dots"></i> Signal
                        </button>
                        <button className="lex-menu-btn" onClick={(e) => handleContextMenu(e, user.id, user.first_name)}>
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const isDbEmpty = !roll.partners?.length && !roll.associates?.length && !roll.interns?.length && !roll.staff?.length;

    return (
        <div className="flex-1 flex flex-col h-full transition-colors overflow-hidden" onClick={() => setMenuPos({ ...menuPos, visible: false })}>

            <header className="lex-header border-b border-stone-200 dark:border-white/5">
                <div>
                    <h1 className="text-xl font-black theme-text-main uppercase">Personnel <span className="text-amber-500">Roll</span></h1>
                    <p className="text-[9px] text-stone-500 uppercase font-bold tracking-widest">Satisfaction & Performance Matrix</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-bold text-green-600 dark:text-green-500 flex items-center justify-end gap-2 uppercase tracking-widest">
                        System Secure <i className="fa fa-circle text-[6px] animate-pulse"></i>
                    </div>
                    <div className="text-xl font-black theme-text-main mt-0.5 font-mono tracking-widest">
                        {time.toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 custom-scroll">
                <div className="max-w-7xl mx-auto pb-20">
                    <div className="flex justify-end mb-8 border-b border-stone-200 dark:border-white/5 pb-6">
                        <button onClick={openAddModal} className="onboard-btn shadow-xl flex items-center gap-2">
                            <i className="fa fa-user-plus text-sm"></i> Onboard Personnel
                        </button>
                    </div>

                    {isDbEmpty ? (
                        <div className="flex flex-col items-center justify-center h-[40vh] text-center opacity-60 animate-fade-in">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-stone-500 flex items-center justify-center mb-6">
                                <i className="fa-solid fa-user-astronaut text-4xl text-stone-500"></i>
                            </div>
                            <h2 className="text-2xl font-black theme-text-main uppercase tracking-widest mb-2">Database Empty</h2>
                            <p className="text-xs text-stone-500 font-bold max-w-sm">There are no active personnel on the roll.</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* NOTICE: sortByCode() is actively sorting the arrays here! */}
                            {roll.partners?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-8">
                                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] opacity-80">Board of Partners</h3>
                                        <div className="h-px flex-1 bg-amber-500/20"></div>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">{sortByCode(roll.partners).map(p => renderCard(p, 'partner'))}</div>
                                </section>
                            )}
                            {roll.associates?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-8">
                                        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em] opacity-60">Associates</h3>
                                        <div className="h-px flex-1 bg-stone-300 dark:bg-stone-800"></div>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">{sortByCode(roll.associates).map(p => renderCard(p, 'associate'))}</div>
                                </section>
                            )}
                            {roll.interns?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-8">
                                        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em] opacity-60">Legal Interns</h3>
                                        <div className="h-px flex-1 bg-stone-300 dark:bg-stone-800"></div>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">{sortByCode(roll.interns).map(p => renderCard(p, 'intern'))}</div>
                                </section>
                            )}
                            {roll.staff?.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-8">
                                        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em] opacity-60">Office Staff</h3>
                                        <div className="h-px flex-1 bg-stone-300 dark:bg-stone-800"></div>
                                    </div>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">{sortByCode(roll.staff).map(p => renderCard(p, 'staff'))}</div>
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- ONBOARDING MODAL --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[9000] flex items-center justify-center backdrop-blur-xl p-4" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-2xl rounded-[2.5rem] p-10 border border-stone-200 dark:border-white/10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 text-stone-500 hover:text-white"><i className="fa fa-times text-xl"></i></button>
                        <h3 className="text-2xl font-black theme-text-main uppercase mb-8">Onboard Personnel</h3>
                        <form className="grid grid-cols-2 gap-5" onSubmit={handleOnboardSubmit}>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase text-stone-400 mb-2 block tracking-widest">Access Tier</label>
                                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/5 rounded-xl p-4 text-sm font-bold theme-text-main outline-none">
                                    <option value="PARTNER">Partner / Senior Counsel</option>
                                    <option value="ASSOCIATE">Junior Associate</option>
                                    <option value="INTERN">Legal Intern</option>
                                    <option value="STAFF">Office Staff</option>
                                </select>
                            </div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">First Name</label><input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Last Name</label><input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">System Alias</label><input type="text" name="username" required value={formData.username} onChange={handleInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Work Email</label><input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>
                            <div className="col-span-2"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Designation</label><input type="text" name="designation" required value={formData.designation} onChange={handleInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>

                            {/* Fully Editable Employee Number */}
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Employee Number</label><input type="text" name="employee_code" required value={formData.employee_code} onChange={handleInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-mono theme-text-main outline-none" /></div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Temp Passkey</label><input type="text" readOnly value={tempPasskey} className="w-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/5 rounded-xl p-3 text-sm font-mono text-amber-500 outline-none" /></div>

                            <div className="col-span-2 mt-2">
                                <label className="flex items-center gap-3 p-4 border border-stone-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">
                                    <input type="checkbox" checked={formData.is_admin} onChange={handleCheckboxChange} className="w-4 h-4 accent-amber-500" />
                                    <span className="text-[10px] font-black theme-text-main uppercase tracking-widest">Grant Admin Vault Privileges</span>
                                </label>
                            </div>

                            <div className="col-span-2"><button type="submit" className="w-full py-4 mt-2 rounded-2xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02]">Sync to Database</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/90 z-[9000] flex items-center justify-center backdrop-blur-xl p-4" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white dark:bg-[#0f0f10] w-full max-w-2xl rounded-[2.5rem] p-10 border border-amber-500/30 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 right-8 text-stone-500 hover:text-white"><i className="fa fa-times text-xl"></i></button>
                        <h3 className="text-2xl font-black text-amber-500 uppercase mb-8">Edit Profile Configuration</h3>
                        <form className="grid grid-cols-2 gap-5" onSubmit={handleEditSubmit}>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase text-stone-400 mb-2 block tracking-widest">Access Tier</label>
                                <select name="category" value={editFormData.category} onChange={handleEditInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/5 rounded-xl p-4 text-sm font-bold theme-text-main outline-none">
                                    <option value="PARTNER">Partner / Senior Counsel</option>
                                    <option value="ASSOCIATE">Junior Associate</option>
                                    <option value="INTERN">Legal Intern</option>
                                    <option value="STAFF">Office Staff</option>
                                </select>
                            </div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">First Name</label><input type="text" name="first_name" required value={editFormData.first_name} onChange={handleEditInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Last Name</label><input type="text" name="last_name" required value={editFormData.last_name} onChange={handleEditInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">System Alias (Cannot change)</label><input type="text" readOnly value={editFormData.username} className="w-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-sub outline-none opacity-50 cursor-not-allowed" /></div>
                            <div className="col-span-1"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Work Email</label><input type="email" name="email" required value={editFormData.email} onChange={handleEditInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>
                            <div className="col-span-2"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Designation</label><input type="text" name="designation" required value={editFormData.designation} onChange={handleEditInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm theme-text-main outline-none" /></div>

                            <div className="col-span-2"><label className="text-[9px] font-black uppercase text-stone-400 mb-1.5 block">Employee Number</label><input type="text" name="employee_code" required value={editFormData.employee_code} onChange={handleEditInputChange} className="w-full bg-stone-50 dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl p-3 text-sm font-mono theme-text-main outline-none focus:border-amber-500" /></div>

                            <div className="col-span-2 mt-2">
                                <label className="flex items-center gap-3 p-4 border border-stone-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">
                                    <input type="checkbox" checked={editFormData.is_admin} onChange={handleEditCheckboxChange} className="w-4 h-4 accent-amber-500" />
                                    <span className="text-[10px] font-black theme-text-main uppercase tracking-widest">Grant Admin Vault Privileges</span>
                                </label>
                            </div>

                            <div className="col-span-2"><button type="submit" className="w-full py-4 mt-2 rounded-2xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02]">Push Overwrite to Database</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DELETE / MENU / DOSSIER REMAIN EXACTLY THE SAME --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center backdrop-blur-md p-4" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-white dark:bg-[#0a0a0b] w-full max-w-sm rounded-[2rem] p-8 border border-red-500/20 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 rounded-full bg-red-900/20 text-red-600 flex items-center justify-center mx-auto mb-6"><i className="fa-solid fa-triangle-exclamation text-2xl"></i></div>
                        <h3 className="text-xl font-black theme-text-main mb-2 uppercase tracking-tighter">Confirm Purge</h3>
                        <p className="text-xs text-stone-500 mb-8">Permanently strike credentials for <span className="font-bold text-red-500 uppercase">{menuPos.userName}</span>?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="py-4 rounded-xl bg-stone-100 dark:bg-white/5 text-stone-500 font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 dark:hover:bg-white/10">Abort</button>
                            <button onClick={executeRemoval} className="py-4 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20">Execute</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`profile-overlay ${isDossierOpen ? 'visible' : ''}`} onClick={() => setIsDossierOpen(false)}>
                <div className={`profile-panel p-8 overflow-y-auto custom-scroll ${isDossierOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="text-center mt-6">
                        <div className="w-24 h-24 rounded-full bg-stone-100 dark:bg-stone-800 mx-auto mb-4 border-2 border-amber-500 flex items-center justify-center text-3xl font-black text-amber-500 shadow-xl">
                            {selectedUser?.first_name ? selectedUser.first_name[0] : '?'}
                        </div>
                        <h2 className="text-3xl font-black theme-text-main tracking-tighter">{selectedUser?.first_name} {selectedUser?.last_name}</h2>
                        <p className="text-amber-500 font-bold uppercase text-[10px] tracking-widest mt-1">{selectedUser?.designation}</p>

                        {/* Dossier Contact and Stats remain unchanged here... */}
                        <button className="w-full py-4 mt-8 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform" onClick={() => setIsDossierOpen(false)}>
                            Close Dossier
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTEXT MENU (KEBAB MENU) */}
            {menuPos.visible && (
                <div className="fixed z-[99999] bg-white dark:bg-[#171717] border border-stone-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] animate-fade-in" style={{ top: menuPos.y, left: menuPos.x }}>
                    <div className="px-5 py-3 border-b border-stone-100 dark:border-white/5 text-[10px] font-black uppercase text-stone-400 tracking-widest bg-stone-50/50 dark:bg-black/20">Options</div>

                    {/* NEW EDIT BUTTON */}
                    <button onClick={openEditModalFromMenu} className="w-full text-left px-5 py-3.5 text-xs font-bold theme-text-main hover:bg-amber-500 hover:text-black transition-all flex items-center gap-3">
                        <i className="fa fa-pen-to-square w-4"></i> Edit Profile
                    </button>

                    <button onClick={() => toggleStatus(menuPos.userId)} className="w-full text-left px-5 py-3.5 text-xs font-bold text-orange-500 hover:bg-orange-500 hover:text-white transition-all border-t border-stone-100 dark:border-white/5 flex items-center gap-3">
                        <i className="fa fa-ban w-4"></i> Toggle Status
                    </button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="w-full text-left px-5 py-3.5 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all border-t border-stone-100 dark:border-white/5 flex items-center gap-3">
                        <i className="fa fa-trash-can w-4"></i> Remove Access
                    </button>
                </div>
            )}
        </div>
    );
};

export default PersonnelRoll;