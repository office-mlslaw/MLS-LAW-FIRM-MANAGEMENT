import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CarChase.css';

const CarChase = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const gameInstance = useRef(null);
    const storedUser = JSON.parse(localStorage.getItem('mls_user_data') || '{}');
    const [personalBest, setPersonalBest] = useState(0);

    // Fetch user's personal best on load
    useEffect(() => {
        fetch('http://127.0.0.1:8080/api/arcade/leaderboard')
            .then(res => res.json())
            .then(data => {
                const myRecord = data.find(r => r.username === storedUser.username && r.game === 'car-chase');
                if (myRecord) setPersonalBest(myRecord.highScore);
            })
            .catch(err => console.error("Leaderboard offline."));
    }, [storedUser.username]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // --- GAME CLASSES ---
        class Player {
            constructor(game) {
                this.game = game;
                this.width = 30;
                this.height = 30;
                this.x = 50;
                this.y = this.game.groundLevel - this.height;
                this.color = "#a855f7"; // Neon Purple
                this.velocityY = 0;
                this.isJumping = false;
                this.isGrounded = true;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;

                if (this.game.shieldActive) {
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width, 0, 2 * Math.PI);
                    ctx.stroke();
                }
                ctx.shadowBlur = 0; // Reset
            }
            update() {
                if (!this.isGrounded) this.velocityY += this.game.physics.gravity;
                this.y += this.velocityY;
                if (this.y >= this.game.groundLevel - this.height) {
                    this.y = this.game.groundLevel - this.height;
                    this.velocityY = 0;
                    this.isGrounded = true;
                    this.isJumping = false;
                }
            }
            jump() {
                if (this.isGrounded) {
                    this.isGrounded = false;
                    this.isJumping = true;
                    this.velocityY = this.game.physics.jumpForce;
                }
            }
        }

        class Obstacle {
            constructor(game) {
                this.game = game;
                this.width = 30;
                this.height = 30 + Math.random() * 20; // Variable height
                this.x = canvas.width;
                this.y = this.game.groundLevel - this.height;
                this.color = "#ef4444"; // Neon Red
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            update() {
                this.x -= this.game.timeSlowed ? this.game.obstacleSpeed / 2 : this.game.obstacleSpeed;
            }
        }

        class PowerUp {
            constructor(game) {
                this.game = game;
                this.width = 20;
                this.height = 20;
                this.x = canvas.width;
                this.y = this.game.groundLevel - this.height - Math.random() * 80 - 40;
                this.duration = 5000;
                this.type = this.getRandomType();
                this.color = this.getColorForType();
            }
            getRandomType() {
                const types = ["scoreMultiplier", "shield", "highJump", "slowTime"];
                return types[Math.floor(Math.random() * types.length)];
            }
            getColorForType() {
                switch (this.type) {
                    case "scoreMultiplier": return "#fbbf24";
                    case "shield": return "#38bdf8";
                    case "highJump": return "#4ade80";
                    case "slowTime": return "#c084fc";
                    default: return "#cccccc";
                }
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            update() {
                this.x -= this.game.timeSlowed ? this.game.obstacleSpeed / 2 : this.game.obstacleSpeed;
            }
        }

        class GameEngine {
            constructor() {
                this.player = new Player(this);
                this.physics = { gravity: 0.6, jumpForce: -12 };
                this.obstacles = [];
                this.powerUps = [];
                this.obstacleSpeed = 6;
                this.obstacleInterval = 1200;
                this.powerUpInterval = 5000;
                this.lastObstacleTime = Date.now();
                this.lastPowerUpTime = Date.now();
                this.gameOver = false;
                this.score = 0;
                this.scoreMultiplier = 1;
                this.groundLevel = canvas.height - 30;
                this.lastUpdateTime = 0;
                this.parallaxBackground = { x: 0, y: 0, speed: 1 };
                this.shieldActive = false;
                this.timeSlowed = false;
                this.startTime = Date.now();
                this.animationFrameId = null;
            }

            drawParallaxBackground() {
                ctx.fillStyle = "#121214";
                ctx.fillRect(0, 0, canvas.width, this.groundLevel);

                // Ground
                ctx.fillStyle = "#1e1e24";
                ctx.fillRect(0, this.groundLevel, canvas.width, canvas.height - this.groundLevel);
                ctx.strokeStyle = "#8b5cf6";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, this.groundLevel);
                ctx.lineTo(canvas.width, this.groundLevel);
                ctx.stroke();

                // Cyberpunk Grid Lines
                ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
                for (let i = 0; i < 50; i++) {
                    const lineX = (i * 40 - this.parallaxBackground.x) % canvas.width;
                    if (lineX > 0) ctx.fillRect(lineX, this.groundLevel, 2, canvas.height - this.groundLevel);
                }
                this.parallaxBackground.x += this.parallaxBackground.speed;
            }

            drawUI() {
                ctx.fillStyle = "white";
                ctx.font = "bold 16px 'JetBrains Mono', monospace";
                ctx.textAlign = "left";
                ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 20, 35);

                ctx.textAlign = "center";
                if (this.scoreMultiplier > 1) {
                    ctx.fillStyle = "#fbbf24";
                    ctx.fillText(`MULTIPLIER x${this.scoreMultiplier}`, canvas.width / 2, 35);
                }
                if (this.shieldActive) {
                    ctx.fillStyle = "#38bdf8";
                    ctx.fillText("SHIELD ACTIVE", canvas.width / 2, 60);
                }
                if (this.timeSlowed) {
                    ctx.fillStyle = "#c084fc";
                    ctx.fillText("TIME DILATION", canvas.width / 2, 85);
                }
            }

            generateEntities() {
                const now = Date.now();
                if (now - this.lastObstacleTime > (this.timeSlowed ? this.obstacleInterval * 2 : this.obstacleInterval)) {
                    this.obstacles.push(new Obstacle(this));
                    this.lastObstacleTime = now;
                }
                if (now - this.lastPowerUpTime > (this.timeSlowed ? this.powerUpInterval * 2 : this.powerUpInterval)) {
                    this.powerUps.push(new PowerUp(this));
                    this.lastPowerUpTime = now;
                }
            }

            checkCollision() {
                this.obstacles.forEach((obs, index) => {
                    if (this.player.x < obs.x + obs.width && this.player.x + this.player.width > obs.x &&
                        this.player.y < obs.y + obs.height && this.player.y + this.player.height > obs.y) {
                        if (this.shieldActive) {
                            this.shieldActive = false;
                            this.obstacles.splice(index, 1);
                        } else {
                            this.triggerGameOver();
                        }
                    }
                });

                this.powerUps.forEach((pu, index) => {
                    if (this.player.x < pu.x + pu.width && this.player.x + this.player.width > pu.x &&
                        this.player.y < pu.y + pu.height && this.player.y + this.player.height > pu.y) {
                        this.powerUps.splice(index, 1);
                        this.activatePowerUp(pu);
                    }
                });
            }

            activatePowerUp(pu) {
                switch (pu.type) {
                    case "scoreMultiplier":
                        this.scoreMultiplier = 2; setTimeout(() => this.scoreMultiplier = 1, pu.duration); break;
                    case "shield":
                        this.shieldActive = true; setTimeout(() => this.shieldActive = false, pu.duration); break;
                    case "highJump":
                        this.physics.jumpForce = -16; setTimeout(() => this.physics.jumpForce = -12, pu.duration); break;
                    case "slowTime":
                        this.timeSlowed = true; setTimeout(() => this.timeSlowed = false, pu.duration); break;
                    default: break;
                }
            }

            triggerGameOver() {
                this.gameOver = true;
                const finalScore = Math.floor(this.score);
                const timePlayed = Math.floor((Date.now() - this.startTime) / 1000);

                // Report to Firm Backend
                fetch('http://127.0.0.1:8080/api/arcade/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: storedUser.username,
                        game: 'car-chase',
                        score: finalScore,
                        timePlayedSeconds: timePlayed
                    })
                }).catch(() => console.error("Score failed to log"));

                if (finalScore > personalBest) setPersonalBest(finalScore);

                ctx.fillStyle = "rgba(0,0,0,0.8)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "#ef4444";
                ctx.font = "bold 40px 'JetBrains Mono'";
                ctx.textAlign = "center";
                ctx.fillText("SYSTEM FAILURE", canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillStyle = "white";
                ctx.font = "20px 'JetBrains Mono'";
                ctx.fillText(`FINAL SCORE: ${finalScore}`, canvas.width / 2, canvas.height / 2 + 20);
                ctx.fillStyle = "#8b5cf6";
                ctx.fillText("PRESS [SPACE] TO REBOOT", canvas.width / 2, canvas.height / 2 + 60);
            }

            loop = (timestamp) => {
                if (this.gameOver) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.drawParallaxBackground();

                this.player.update();
                this.obstacles.forEach(o => o.update());
                this.powerUps.forEach(p => p.update());

                this.generateEntities();
                this.checkCollision();

                this.obstacleSpeed += 0.002 * (this.timeSlowed ? 0.5 : 1);
                if (this.obstacleInterval > 600) this.obstacleInterval -= 0.2;

                this.score += (0.1 * this.scoreMultiplier);

                this.obstacles = this.obstacles.filter(o => o.x + o.width > 0);
                this.powerUps = this.powerUps.filter(p => p.x + p.width > 0);

                this.player.draw();
                this.obstacles.forEach(o => o.draw());
                this.powerUps.forEach(p => p.draw());
                this.drawUI();

                this.animationFrameId = requestAnimationFrame(this.loop);
            }
        }

        // Initialize Game
        gameInstance.current = new GameEngine();
        gameInstance.current.loop(0);

        // Key Controls
        const handleKeyDown = (e) => {
            if (e.code === "Space") {
                e.preventDefault(); // Stop page from scrolling!
                if (gameInstance.current.gameOver) {
                    cancelAnimationFrame(gameInstance.current.animationFrameId);
                    gameInstance.current = new GameEngine();
                    gameInstance.current.loop(0);
                } else {
                    gameInstance.current.player.jump();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        // Cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (gameInstance.current && gameInstance.current.animationFrameId) {
                cancelAnimationFrame(gameInstance.current.animationFrameId);
            }
        };
    }, [personalBest, storedUser.username]);

    return (
        <div className="runner-container">
            <header className="w-full h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black mb-8 shrink-0">
                <button onClick={() => navigate('/arcade')} className="text-stone-500 hover:text-white font-black uppercase text-xs tracking-widest transition-colors">
                    <i className="fa fa-arrow-left mr-2"></i> Abort Run
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Personal Best</span>
                    <span className="text-sm font-black text-amber-400 font-mono">{personalBest.toLocaleString()}</span>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="canvas-wrapper">
                    <canvas ref={canvasRef} width={800} height={400} id="gameCanvas" />
                </div>

                <div className="mt-8 flex gap-6 text-[10px] font-black uppercase tracking-widest text-stone-500">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#fbbf24]"></div> 2x Score</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#38bdf8]"></div> Shield</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#4ade80]"></div> High Jump</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#c084fc]"></div> Time Slow</span>
                </div>
            </div>
        </div>
    );
};

export default CarChase;