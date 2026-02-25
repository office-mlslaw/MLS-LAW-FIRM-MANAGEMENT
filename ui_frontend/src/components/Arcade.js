import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Arcade.css'; // Retro styling

const GAMES = [
    { id: 'block-smash', name: 'Block Smash', desc: 'Classic line-clearing tetris action.', icon: 'fa-cubes', glow: '139, 92, 246', colorClass: 'text-violet-400', borderClass: 'border-violet-500/30', bgClass: 'bg-violet-500/10' },
    { id: 'sudoku', name: 'Sudoku Pro', desc: 'Brain-teasing numeric logic puzzles.', icon: 'fa-table-cells', glow: '56, 189, 248', colorClass: 'text-sky-400', borderClass: 'border-sky-500/30', bgClass: 'bg-sky-500/10' },
    { id: 'car-chase', name: 'Car Chase', desc: 'Top-down retro traffic dodging.', icon: 'fa-car-burst', glow: '248, 113, 113', colorClass: 'text-red-400', borderClass: 'border-red-500/30', bgClass: 'bg-red-500/10' },
    { id: 'speed-typist', name: 'Speed Typist', desc: 'Legal clause typing test (WPM metrics).', icon: 'fa-keyboard', glow: '250, 204, 21', colorClass: 'text-amber-400', borderClass: 'border-amber-500/30', bgClass: 'bg-amber-500/10' }
];

const Arcade = () => {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState([]);
    const [activeTab, setActiveTab] = useState('block-smash'); // For leaderboard filtering

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8080/api/arcade/leaderboard');
            if (res.ok) setLeaderboard(await res.json());
        } catch (error) {
            console.error("Failed to fetch arcade data.");
        }
    };

    // Calculate Firm-Wide "Stress Relief" Time
    const totalSecondsPlayed = leaderboard.reduce((acc, curr) => acc + (curr.timePlayed || 0), 0);
    const totalHours = Math.floor(totalSecondsPlayed / 3600);
    const totalMinutes = Math.floor((totalSecondsPlayed % 3600) / 60);

    return (
        <div className="flex-1 flex flex-col h-full arcade-bg text-white font-sans relative overflow-hidden">

            {/* HEADER */}
            <header className="h-20 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                        <i className="fa fa-gamepad text-xl text-white"></i>
                    </div>
                    <div>
                        <h2 className="font-black text-xl tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
                            MLS Arcade
                        </h2>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-[0.2em] mt-0.5">Firm Stress Relief Protocol</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl shadow-inner">
                    <i className="fa fa-stopwatch text-amber-400 animate-pulse"></i>
                    <div>
                        <p className="text-[8px] font-black uppercase text-stone-400 tracking-widest leading-none mb-1">Total Firm Time Wasted</p>
                        <p className="text-sm font-mono font-bold text-white leading-none">{totalHours}h {totalMinutes}m</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scroll flex flex-col lg:flex-row gap-8">

                {/* LEFT: GAME SELECTION GRID */}
                <div className="flex-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 mb-6 flex items-center gap-2">
                        <i className="fa fa-bolt text-yellow-400"></i> Select Game
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {GAMES.map(game => (
                            <div
                                key={game.id}
                                onClick={() => navigate(`/arcade/${game.id}`)}
                                className={`neon-card group cursor-pointer bg-[#121214] border ${game.borderClass} rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px]`}
                                style={{ '--glow-color': game.glow }}
                            >
                                <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${game.bgClass}`}></div>

                                <div>
                                    <div className={`w-12 h-12 rounded-xl ${game.bgClass} border ${game.borderClass} flex items-center justify-center mb-4`}>
                                        <i className={`fa ${game.icon} text-2xl ${game.colorClass} arcade-icon-wiggle`}></i>
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tighter mb-1 text-white">{game.name}</h4>
                                    <p className="text-xs font-medium text-stone-400">{game.desc}</p>
                                </div>

                                <div className="mt-6 flex justify-between items-center z-10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 group-hover:text-white transition-colors">Press Start</span>
                                    <i className="fa fa-arrow-right text-stone-500 group-hover:translate-x-2 transition-transform"></i>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: GLOBAL LEADERBOARD */}
                <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col h-[600px] lg:h-auto bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-white/5 shrink-0">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 mb-4">
                            <i className="fa fa-trophy text-amber-400"></i> Global Leaderboard
                        </h3>

                        {/* Leaderboard Tabs */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {GAMES.map(game => (
                                <button
                                    key={game.id}
                                    onClick={() => setActiveTab(game.id)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0 transition-colors ${activeTab === game.id ? `${game.bgClass} ${game.colorClass} border border-current` : 'bg-white/5 text-stone-500 hover:text-white'}`}
                                >
                                    {game.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto arcade-scroll p-2">
                        {/* Filter leaderboard by active game and sort by highest score */}
                        {(() => {
                            const filteredScores = leaderboard
                                .filter(entry => entry.game === activeTab)
                                .sort((a, b) => b.highScore - a.highScore);

                            if (filteredScores.length === 0) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-6">
                                        <i className="fa fa-ghost text-4xl mb-3"></i>
                                        <p className="text-[10px] font-black uppercase tracking-widest">No scores yet.<br />Be the first to set the record!</p>
                                    </div>
                                );
                            }

                            return filteredScores.map((entry, index) => (
                                <div key={entry.id} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`font-black w-6 text-center ${index === 0 ? 'text-amber-400 text-lg drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : index === 1 ? 'text-stone-300' : index === 2 ? 'text-amber-700' : 'text-stone-600 text-xs'}`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white uppercase tracking-tight">{entry.username}</p>
                                            <p className="text-[9px] text-stone-500 uppercase tracking-widest font-mono">
                                                Played: {Math.floor(entry.timePlayed / 60)}m {entry.timePlayed % 60}s
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-violet-400 font-mono text-lg">{entry.highScore.toLocaleString()}</p>
                                        <p className="text-[8px] text-stone-600 uppercase tracking-widest">Pts</p>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Arcade;