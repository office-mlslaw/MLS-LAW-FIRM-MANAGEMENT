import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ChatHub.css';

const ChatHub = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || sessionStorage.getItem('mls_user_data') || '{}');
    const isAdmin = storedUser.sessionRole === 'ADMIN';

    // --- STATE ---
    const [personnel, setPersonnel] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [isCallActive, setIsCallActive] = useState(false);
    const messagesEndRef = useRef(null);

    // --- INIT & POLLING ---
    useEffect(() => {
        fetchPersonnel();
    }, []);

    // High-speed Polling for Messages (1 second)
    useEffect(() => {
        if (!selectedUser) return;

        fetchMessages(); // Initial fetch
        const poll = setInterval(fetchMessages, 1000);
        return () => clearInterval(poll);
    }, [selectedUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll when messages change
    useEffect(() => { scrollToBottom(); }, [messages]);

    const fetchPersonnel = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8080/api/personnel/roll');
            if (res.ok) {
                const data = await res.json();
                // Flatten array and remove self
                const allStaff = [...(data.partners || []), ...(data.associates || []), ...(data.staff || [])];
                setPersonnel(allStaff.filter(p => p.user.username !== storedUser.username));
            }
        } catch (error) { console.error("Failed to load directory."); }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:8080/api/chat/${storedUser.username}/${selectedUser.user.username}`);
            if (res.ok) {
                const data = await res.json();
                // Only update state if message length changed to prevent re-renders
                setMessages(prev => (prev.length !== data.length || prev.some((m, i) => m.status !== data[i].status) ? data : prev));
            }
        } catch (error) { }
    };

    // --- ACTIONS ---
    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || !selectedUser) return;

        const textToSend = inputText;
        setInputText(''); // Clear instantly for UI speed

        try {
            await fetch('http://127.0.0.1:8080/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: storedUser.username,
                    receiver: selectedUser.user.username,
                    text: textToSend
                })
            });
            fetchMessages();
        } catch (error) { alert("Message failed to send."); }
    };

    // Smart Draft Approvals
    const handleDraftStatus = async (msgId, status) => {
        try {
            await fetch(`http://127.0.0.1:8080/api/chat/update-status/${msgId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }) // 'APPROVED' or 'REVISION'
            });
            fetchMessages();
        } catch (error) { }
    };

    // Push to Kanban
    const pushToKanban = async (msgText) => {
        if (!window.confirm("Convert this message into an Actionable Task on the Work Pipeline?")) return;
        try {
            await fetch('http://127.0.0.1:8080/api/chat/to-kanban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: msgText,
                    receiver: selectedUser.user.username // Assigns to the person you are chatting with
                })
            });
            alert("Task Pushed to Pipeline!");
        } catch (error) { alert("Failed to create task."); }
    };

    // Filtering the Directory
    const filteredPersonnel = personnel.filter(p =>
        (p.user.first_name + ' ' + p.user.last_name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-[#0a0a0b] transition-colors">

            {/* --- DIRECTORY SIDEBAR --- */}
            <div className={`w-full md:w-80 flex flex-col border-r border-stone-200 dark:border-white/5 bg-stone-50 dark:bg-[#121212] shrink-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-stone-200 dark:border-white/5 bg-white dark:bg-black shrink-0">
                    <h2 className="font-black text-xl text-slate-900 dark:text-white tracking-tight uppercase leading-none">Chat Hub</h2>
                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-1">Encrypted Network</p>
                    <div className="relative mt-4">
                        <i className="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
                        <input type="text" placeholder="Search Directory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
                    {filteredPersonnel.map(p => (
                        <div key={p.user.id} onClick={() => setSelectedUser(p)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedUser?.user.id === p.user.id ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white dark:hover:bg-white/5 border border-transparent'}`}>
                            <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-black border border-stone-300 dark:border-stone-800 flex items-center justify-center font-black text-slate-900 dark:text-white shadow-sm shrink-0">
                                {p.user.first_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-xs font-bold truncate ${selectedUser?.user.id === p.user.id ? 'text-amber-600 dark:text-amber-500' : 'text-slate-900 dark:text-white'}`}>{p.user.first_name} {p.user.last_name}</h4>
                                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest truncate">{p.designation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MAIN CHAT WINDOW --- */}
            {selectedUser ? (
                <div className="flex-1 flex flex-col bg-white dark:bg-black min-w-0 relative">

                    {/* Header */}
                    <div className="h-20 px-6 border-b border-stone-200 dark:border-white/5 flex items-center justify-between bg-stone-50 dark:bg-[#121212] shrink-0 z-10">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedUser(null)} className="md:hidden text-stone-400 hover:text-slate-900 dark:hover:text-white"><i className="fa fa-arrow-left"></i></button>
                            <div>
                                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest">{selectedUser.user.first_name} {selectedUser.user.last_name}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Available</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setIsCallActive(true)} className="w-10 h-10 rounded-full bg-white dark:bg-black border border-stone-200 dark:border-white/10 text-stone-500 hover:text-amber-500 hover:border-amber-500 transition-colors shadow-sm"><i className="fa fa-phone"></i></button>
                            <button onClick={() => setIsCallActive(true)} className="w-10 h-10 rounded-full bg-white dark:bg-black border border-stone-200 dark:border-white/10 text-stone-500 hover:text-amber-500 hover:border-amber-500 transition-colors shadow-sm"><i className="fa fa-video"></i></button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(200,200,200,0.05) 0%, transparent 100%)' }}>
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-50">
                                <i className="fa fa-lock text-4xl mb-3"></i>
                                <p className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const isSelf = msg.sender === storedUser.username;

                                // Color logic based on Smart Approval
                                let bubbleStyle = isSelf ? 'bg-black text-white dark:bg-stone-800 border-stone-800' : 'bg-stone-100 text-slate-900 dark:bg-white/5 dark:text-white border-stone-200 dark:border-white/10';

                                if (msg.status === 'APPROVED') bubbleStyle = 'bg-green-100 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-500/50 dark:text-green-300';
                                if (msg.status === 'REVISION') bubbleStyle = 'bg-red-100 border-red-300 text-red-900 dark:bg-red-900/30 dark:border-red-500/50 dark:text-red-300';

                                return (
                                    <div key={msg.id} className={`flex w-full group ${isSelf ? 'justify-end' : 'justify-start'}`}>

                                        {/* Hover Actions (Partner/Admin Approvals & Kanban) */}
                                        {!isSelf && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mr-2">
                                                <button onClick={() => pushToKanban(msg.text)} title="Create Task" className="w-6 h-6 rounded bg-stone-100 dark:bg-white/10 text-stone-500 hover:text-amber-500"><i className="fa fa-plus text-[10px]"></i></button>
                                                {isAdmin && (
                                                    <>
                                                        <button onClick={() => handleDraftStatus(msg.id, 'APPROVED')} title="Approve Draft" className="w-6 h-6 rounded bg-stone-100 dark:bg-white/10 text-stone-500 hover:text-green-500"><i className="fa fa-check text-[10px]"></i></button>
                                                        <button onClick={() => handleDraftStatus(msg.id, 'REVISION')} title="Needs Revision" className="w-6 h-6 rounded bg-stone-100 dark:bg-white/10 text-stone-500 hover:text-red-500"><i className="fa fa-times text-[10px]"></i></button>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        <div className={`max-w-[70%] p-3.5 rounded-2xl border text-sm shadow-sm relative ${bubbleStyle} ${isSelf ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>

                                            {/* Status Badge */}
                                            {msg.status === 'APPROVED' && <div className="text-[8px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-1"><i className="fa fa-check-circle mr-1"></i>Draft Approved</div>}
                                            {msg.status === 'REVISION' && <div className="text-[8px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1"><i className="fa fa-exclamation-circle mr-1"></i>Needs Revision</div>}

                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                                            <div className={`text-[8px] font-bold uppercase tracking-widest mt-2 text-right opacity-60 ${isSelf ? 'text-white/80' : 'text-stone-500'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {/* Hover Actions for Self (Kanban) */}
                                        {isSelf && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-2">
                                                <button onClick={() => pushToKanban(msg.text)} title="Create Task" className="w-6 h-6 rounded bg-stone-100 dark:bg-white/10 text-stone-500 hover:text-amber-500"><i className="fa fa-plus text-[10px]"></i></button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-stone-50 dark:bg-[#121212] border-t border-stone-200 dark:border-white/5 shrink-0">
                        <form onSubmit={handleSend} className="flex gap-2 relative">
                            <button type="button" className="w-12 h-12 flex items-center justify-center text-stone-400 hover:text-amber-500 transition-colors"><i className="fa fa-paperclip text-lg"></i></button>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type a message or draft..."
                                className="flex-1 bg-white dark:bg-black border border-stone-200 dark:border-white/10 rounded-xl px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-500 shadow-inner"
                            />
                            <button type="submit" disabled={!inputText.trim()} className="w-12 h-12 rounded-xl bg-black dark:bg-amber-500 text-white dark:text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100">
                                <i className="fa fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-stone-50/50 dark:bg-[#0a0a0b] text-stone-400">
                    <div className="w-24 h-24 rounded-full bg-white dark:bg-[#121212] border border-stone-200 dark:border-white/5 shadow-xl flex items-center justify-center mb-6">
                        <i className="fa fa-comments text-3xl text-amber-500"></i>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Secure Comms Hub</h3>
                    <p className="text-xs font-bold uppercase tracking-widest mt-2">Select personnel to initiate secure channel</p>
                </div>
            )}

            {/* --- CALL MODAL (SIMULATED) --- */}
            {isCallActive && (
                <div className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in">
                    <div className="text-center">
                        <div className="w-32 h-32 mx-auto rounded-full bg-stone-800 border-4 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center justify-center mb-6">
                            <span className="text-5xl font-black text-white">{selectedUser.user.first_name.charAt(0)}</span>
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{selectedUser.user.first_name} {selectedUser.user.last_name}</h2>
                        <p className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] animate-pulse mb-12">Establishing Secure Connection...</p>

                        <div className="flex justify-center gap-6">
                            <button onClick={() => setIsCallActive(false)} className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl shadow-xl hover:scale-110 transition-transform">
                                <i className="fa fa-phone-slash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHub;