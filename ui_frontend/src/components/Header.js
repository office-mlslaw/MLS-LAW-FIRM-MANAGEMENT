import React, { useState, useEffect } from 'react';

const Header = () => {
    // 1. Clock State
    const [currentTime, setCurrentTime] = useState(new Date());

    // 2. Theme State
    const [theme, setTheme] = useState('default');

    // Update the clock every single second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer); // Cleanup when page closes
    }, []);

    // Format the Date and Time perfectly
    const timeString = currentTime.toLocaleTimeString('en-US', { hour12: true }); // e.g., 10:45:30 AM
    const dateString = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }); // e.g., Monday, February 23, 2026

    // Function to cycle through the 3 themes
    const toggleTheme = () => {
        let nextTheme;
        if (theme === 'default') nextTheme = 'light';
        else if (theme === 'light') nextTheme = 'parchment';
        else nextTheme = 'default';

        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme); // Applies the CSS overrides
    };

    // Inline styles for the header layout to keep it self-contained
    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        backgroundColor: 'var(--surface-color)',
        borderBottom: '2px solid var(--accent-color)'
    };

    const clockStyle = {
        textAlign: 'right',
        fontFamily: 'var(--font-main)',
        color: 'var(--text-secondary)'
    };

    const buttonStyle = {
        backgroundColor: 'var(--accent-color)',
        color: 'var(--bg-color)',
        border: 'none',
        padding: '8px 16px',
        cursor: 'pointer',
        fontWeight: 'bold',
        borderRadius: '4px',
        fontFamily: 'var(--font-main)'
    };

    return (
        <header style={headerStyle}>
            <div>
                <h2 style={{ margin: 0 }}>MLS R.LEX</h2>
                <button style={buttonStyle} onClick={toggleTheme}>
                    Theme: {theme.toUpperCase()}
                </button>
            </div>

            <div style={clockStyle}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {timeString}
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                    {dateString}
                </div>
            </div>
        </header>
    );
};

export default Header;