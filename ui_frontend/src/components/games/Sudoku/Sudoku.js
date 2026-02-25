import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sudoku.css';

const Sudoku = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || '{}');

    const [board, setBoard] = useState(Array(81).fill(null));
    const [initialBoard, setInitialBoard] = useState(Array(81).fill(false));
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [startTime, setStartTime] = useState(Date.now());
    const [gameOver, setGameOver] = useState(false);

    // Simplistic board generation for a 9x9 Sudoku
    const generateBoard = () => {
        const newBoard = Array(81).fill(null);
        // Pre-filling some numbers (Static template for now, can be randomized later)
        const template = [
            5, 3, null, null, 7, null, null, null, null,
            6, null, null, 1, 9, 5, null, null, null,
            null, 9, 8, null, null, null, null, 6, null,
            8, null, null, null, 6, null, null, null, 3,
            4, null, null, 8, null, 3, null, null, 1,
            7, null, null, null, 2, null, null, null, 6,
            null, 6, null, null, null, null, 2, 8, null,
            null, null, null, 4, 1, 9, null, null, 5,
            null, null, null, null, 8, null, null, 7, 9
        ];

        setBoard(template);
        setInitialBoard(template.map(val => val !== null));
        setStartTime(Date.now());
        setGameOver(false);
    };

    useEffect(() => {
        generateBoard();
    }, []);

    const handleCellClick = (idx) => {
        if (!initialBoard[idx]) setSelectedIdx(idx);
    };

    const handleNumberInput = (num) => {
        if (selectedIdx === null || gameOver) return;

        const newBoard = [...board];
        newBoard[selectedIdx] = num;
        setBoard(newBoard);

        // Check if board is complete
        if (!newBoard.includes(null)) {
            checkWin(newBoard);
        }
    };

    const checkWin = (finalBoard) => {
        // Validation logic can be added here
        // If correct:
        setGameOver(true);
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        logScore(1000 - timeSpent); // Speed-based scoring
    };

    const logScore = (score) => {
        fetch('http://127.0.0.1:8080/api/arcade/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: storedUser.username,
                game: 'sudoku',
                score: Math.max(score, 100),
                timePlayedSeconds: Math.floor((Date.now() - startTime) / 1000)
            })
        });
    };

    return (
        <div className="sudoku-container">
            <header className="w-full h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black mb-8">
                <button onClick={() => navigate('/arcade')} className="text-stone-500 hover:text-white font-black uppercase text-xs tracking-widest">
                    <i className="fa fa-arrow-left"></i> Exit
                </button>
                <div className="font-black text-amber-500 uppercase tracking-widest">Legal Logic: Sudoku</div>
            </header>

            <div className="sudoku-board">
                {board.map((val, idx) => {
                    const row = Math.floor(idx / 9);
                    const isRowEnd = (row + 1) % 3 === 0 && row < 8;
                    return (
                        <div
                            key={idx}
                            onClick={() => handleCellClick(idx)}
                            className={`sudoku-cell ${initialBoard[idx] ? 'cell-fixed' : ''} ${selectedIdx === idx ? 'cell-selected' : ''} ${isRowEnd ? 'sudoku-row-3n' : ''}`}
                        >
                            {val}
                        </div>
                    );
                })}
            </div>

            <div className="number-pad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => handleNumberInput(num)} className="num-btn">{num}</button>
                ))}
            </div>

            {gameOver && (
                <div className="mt-8 text-center animate-bounce">
                    <h2 className="text-2xl font-black text-green-500 uppercase tracking-tighter">Case Solved!</h2>
                    <p className="text-xs text-stone-500 font-bold uppercase mt-2">Score logged to firm records.</p>
                </div>
            )}
        </div>
    );
};

export default Sudoku;