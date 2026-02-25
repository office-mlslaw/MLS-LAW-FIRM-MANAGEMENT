import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpeedTypist.css';

const CLAUSES = [
    "The Tenant shall keep the premises in a good and tenantable state of repair during the continuance of the lease.",
    "Force Majeure shall mean any event beyond the reasonable control of the Parties including strikes or acts of God.",
    "The Parties hereby agree to submit all disputes arising out of this Agreement to the exclusive jurisdiction of the Courts.",
    "Confidential Information shall not include information that is or becomes part of the public domain through no fault of the Receiving Party.",
    "Indemnification shall survive the termination of this Agreement for a period of three years from the date of expiration."
];

const SpeedTypist = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || '{}');

    const [targetText, setTargetText] = useState("");
    const [userInput, setUserInput] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [wpm, setWpm] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        setTargetText(CLAUSES[Math.floor(Math.random() * CLAUSES.length)]);
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        if (!startTime) setStartTime(Date.now());

        setUserInput(value);

        if (value === targetText) {
            const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
            const words = targetText.split(" ").length;
            const finalWpm = Math.round(words / timeElapsed);
            setWpm(finalWpm);
            setIsFinished(true);
            logScore(finalWpm);
        }
    };

    const logScore = (score) => {
        fetch('http://127.0.0.1:8080/api/arcade/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: storedUser.username,
                game: 'speed-typist',
                score: score,
                timePlayedSeconds: 30
            })
        });
    };

    return (
        <div className="typing-container" onClick={() => inputRef.current.focus()}>
            <header className="w-full h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black mb-10">
                <button onClick={() => navigate('/arcade')} className="text-stone-500 hover:text-white font-black uppercase text-xs tracking-widest">
                    <i className="fa fa-arrow-left"></i> Exit
                </button>
                <div className="font-black text-amber-500 uppercase tracking-widest">Legal Typing Test</div>
            </header>

            <div className="clause-card">
                <div className="text-display">
                    {targetText.split("").map((char, i) => {
                        let color = "";
                        if (i < userInput.length) {
                            color = char === userInput[i] ? "char-correct" : "char-incorrect";
                        }
                        return <span key={i} className={`${color} ${i === userInput.length ? 'char-current' : ''}`}>{char}</span>;
                    })}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={handleChange}
                    className="typing-input"
                    disabled={isFinished}
                />

                {isFinished && (
                    <div className="text-center animate-fade-in">
                        <h2 className="text-4xl font-black text-green-500 mb-2">{wpm} WPM</h2>
                        <p className="text-stone-500 uppercase text-[10px] tracking-widest mb-6">Expert Legal Drafter Status</p>
                        <button onClick={() => window.location.reload()} className="bg-amber-500 text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest">Retry</button>
                    </div>
                )}
            </div>
            {!isFinished && <p className="mt-8 text-stone-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Start typing to begin clock</p>}
        </div>
    );
};

export default SpeedTypist;