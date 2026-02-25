import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Blocksmash.css';

const COLS = 10;
const ROWS = 20;

const TETROMINOS = {
    'I': { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: 'I' },
    'J': { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: 'J' },
    'L': { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: 'L' },
    'O': { shape: [[1, 1], [1, 1]], color: 'O' },
    'S': { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: 'S' },
    'T': { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: 'T' },
    'Z': { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: 'Z' }
};

const randomTetromino = () => {
    const keys = Object.keys(TETROMINOS);
    return TETROMINOS[keys[Math.floor(Math.random() * keys.length)]];
};

const BlockSmash = () => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || '{}');

    const [grid, setGrid] = useState(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    const [activePiece, setActivePiece] = useState(null);
    const [pos, setPos] = useState({ x: 3, y: 0 });
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [playTime, setPlayTime] = useState(0);

    const gameLoop = useRef();
    const timeTracker = useRef();

    // Start/Reset Game
    const startGame = () => {
        setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
        setScore(0);
        setPlayTime(0);
        setGameOver(false);
        resetPiece();
    };

    const resetPiece = () => {
        const next = randomTetromino();
        setActivePiece(next);
        setPos({ x: 3, y: 0 });
        if (checkCollision(next.shape, 3, 0, grid)) setGameOver(true);
    };

    const checkCollision = (shape, x, y, currentGrid) => {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] !== 0) {
                    if (!currentGrid[y + r] || currentGrid[y + r][x + c] === undefined || currentGrid[y + r][x + c] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const move = (dir) => {
        if (!checkCollision(activePiece.shape, pos.x + dir, pos.y, grid)) {
            setPos(prev => ({ ...prev, x: prev.x + dir }));
        }
    };

    const rotate = () => {
        const rotated = activePiece.shape[0].map((_, i) => activePiece.shape.map(row => row[i]).reverse());
        if (!checkCollision(rotated, pos.x, pos.y, grid)) {
            setActivePiece({ ...activePiece, shape: rotated });
        }
    };

    const drop = useCallback(() => {
        if (checkCollision(activePiece.shape, pos.x, pos.y + 1, grid)) {
            lockPiece();
        } else {
            setPos(prev => ({ ...prev, y: prev.y + 1 }));
        }
    }, [activePiece, pos, grid]);

    const lockPiece = () => {
        const newGrid = [...grid.map(row => [...row])];
        activePiece.shape.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value !== 0) newGrid[pos.y + r][pos.x + c] = activePiece.color;
            });
        });

        // Clear lines
        let linesCleared = 0;
        const filteredGrid = newGrid.filter(row => {
            const isFull = row.every(cell => cell !== 0);
            if (isFull) linesCleared++;
            return !isFull;
        });

        while (filteredGrid.length < ROWS) filteredGrid.unshift(Array(COLS).fill(0));

        setGrid(filteredGrid);
        setScore(prev => prev + (linesCleared * 100));
        resetPiece();
    };

    // Logging score to Backend on Game Over
    useEffect(() => {
        if (gameOver) {
            fetch('http://127.0.0.1:8080/api/arcade/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: storedUser.username,
                    game: 'block-smash',
                    score: score,
                    timePlayedSeconds: playTime
                })
            });
        }
    }, [gameOver]);

    useEffect(() => {
        if (!activePiece || gameOver) return;
        gameLoop.current = setInterval(drop, 800);
        timeTracker.current = setInterval(() => setPlayTime(p => p + 1), 1000);
        return () => { clearInterval(gameLoop.current); clearInterval(timeTracker.current); };
    }, [drop, gameOver, activePiece]);

    useEffect(() => {
        const handleKeys = (e) => {
            if (gameOver) return;
            if (e.key === 'ArrowLeft') move(-1);
            if (e.key === 'ArrowRight') move(1);
            if (e.key === 'ArrowDown') drop();
            if (e.key === 'ArrowUp') rotate();
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [activePiece, pos, gameOver]);

    return (
        <div className="flex-1 flex flex-col bg-[#09090b] text-white">
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/arcade')} className="text-stone-500 hover:text-white"><i className="fa fa-arrow-left"></i></button>
                    <h2 className="font-black uppercase tracking-tighter">Block Smash</h2>
                </div>
                <div className="flex gap-8 font-mono text-amber-500">
                    <div>SCORE: {score.toLocaleString()}</div>
                    <div>TIME: {playTime}s</div>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center relative">
                <div className="tetris-board">
                    {grid.map((row, y) => row.map((cell, x) => {
                        let colorClass = cell ? `cell-${cell}` : '';

                        // Render active piece
                        if (activePiece) {
                            activePiece.shape.forEach((pRow, pr) => {
                                pRow.forEach((pValue, pc) => {
                                    if (pValue !== 0 && pos.y + pr === y && pos.x + pc === x) {
                                        colorClass = `cell-${activePiece.color}`;
                                    }
                                });
                            });
                        }

                        return <div key={`${x}-${y}`} className={`tetris-cell ${colorClass}`}></div>;
                    }))}
                </div>

                {(!activePiece && !gameOver) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                        <button onClick={startGame} className="bg-violet-600 px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform">Start Mission</button>
                    </div>
                )}

                {gameOver && (
                    <div className="game-over-overlay">
                        <h2 className="text-5xl font-black text-red-500 uppercase tracking-tighter mb-4">Terminated</h2>
                        <p className="text-stone-400 uppercase tracking-widest mb-8">Score: {score}</p>
                        <button onClick={startGame} className="bg-white text-black px-10 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-amber-500 transition-colors">Retry</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockSmash;