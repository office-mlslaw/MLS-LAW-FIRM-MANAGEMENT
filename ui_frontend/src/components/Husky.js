import React, { useEffect, useRef, useState } from 'react';
import '../styles/Husky.css'; // Perfectly linked to your styles folder

const Husky = ({ isMirrored, isClosedEye, isError, isHappy, isWagging, onInteract }) => {
    const huskyRef = useRef(null);
    const [randomEarTwitch, setRandomEarTwitch] = useState(false);

    // 1. Random Ear Twitch Engine
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                setRandomEarTwitch(true);
                setTimeout(() => setRandomEarTwitch(false), 400);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // 2. Advanced Eye Tracking Math
    useEffect(() => {
        let cX = 0, cY = 0;
        let animationFrameId;

        const handleMouseMove = (e) => {
            cX += (e.clientX - cX) * 0.1;
            cY += (e.clientY - cY) * 0.1;

            if (!huskyRef.current) return;
            const eyes = huskyRef.current.querySelectorAll('.eye');

            eyes.forEach(eye => {
                const r = eye.getBoundingClientRect();
                const centerX = r.left + r.width / 2;
                const centerY = r.top + r.height / 2;

                const angle = Math.atan2(cY - centerY, cX - centerX);
                const dist = Math.min(5, Math.hypot(cX - centerX, cY - centerY) / 40);

                let eyeX = Math.cos(angle) * dist;
                let eyeY = Math.sin(angle) * dist;

                // Reverse the X axis if this is the mirrored Admin Husky
                if (isMirrored) eyeX = -eyeX;

                eye.style.setProperty('--eyeX', `${eyeX}px`);
                eye.style.setProperty('--eyeY', `${eyeY}px`);
            });
            animationFrameId = requestAnimationFrame(() => handleMouseMove(e));
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isMirrored]);

    // 3. Dynamic Mood Classes
    const huskyClasses = `husky ${isClosedEye ? 'closed-eye' : ''} ${isError ? 'error-eyes' : ''} ${isHappy ? 'happy' : ''} ${isWagging ? 'wagging' : ''} ${randomEarTwitch ? 'ears-back' : ''}`;

    // 4. Mirror Transform for Admin Panel
    const transformStyle = isMirrored
        ? "translate(-50%, -50%) scale(0.55) scaleX(-1)"
        : "translate(-50%, -50%) scale(0.55)";

    return (
        <div className="titanium-box" onClick={onInteract}>
            <div className="husky-scene" style={{ transform: transformStyle }} data-mirrored={isMirrored ? "true" : "false"}>
                <div className={huskyClasses} ref={huskyRef}>
                    <div className="mane"><div className="coat"></div></div>
                    <div className="body">
                        <div className="head">
                            <div className="ear"></div><div className="ear"></div>
                            <div className="face">
                                <div className="eye"></div><div className="eye"></div>
                                <div className="nose"></div>
                                <div className="mouth">
                                    <div className="lips"></div>
                                    <div className="tongue"></div>
                                </div>
                            </div>
                        </div>
                        <div className="torso"></div>
                    </div>
                    <div className="legs">
                        <div className="front-legs">
                            <div className="leg"></div>
                            <div className="leg"></div>
                        </div>
                        <div className="hind-leg"></div>
                    </div>
                    <div className="tail">
                        <div className="tail">
                            <div className="tail">
                                <div className="tail">
                                    <div className="tail"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Husky;