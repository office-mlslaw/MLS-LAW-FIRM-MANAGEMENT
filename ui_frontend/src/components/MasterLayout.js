import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SettingsDrawer from './SettingsDrawer';
import LogoutModal from './LogoutModal';
import '../styles/MasterLayout.css';

const MasterLayout = ({ children }) => {
    const navigate = useNavigate();

    // --- LAYOUT STATE ---
    const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [timeoutMessage, setTimeoutMessage] = useState("");

    // --- LOGOUT CORE LOGIC ---
    const performFinalCleanup = useCallback(() => {
        setIsLoggingOut(true);
        setTimeout(() => {
            // THE FIX: We ONLY clear user credentials here. 
            // We DO NOT clear the session timer so the clock survives the logout!
            localStorage.removeItem('mls_user_data');
            sessionStorage.removeItem('mls_user_data');

            navigate('/');
        }, 1500);
    }, [navigate]);

    // --- SECURITY & INACTIVITY ENGINE ---
    useEffect(() => {
        const persistentUser = localStorage.getItem('mls_user_data');
        const sessionUser = sessionStorage.getItem('mls_user_data');

        if (!persistentUser && !sessionUser) {
            navigate('/');
            return;
        }

        let inactivityTimer;
        const resetTimer = () => {
            if (isLoggingOut) return;
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                setTimeoutMessage("Session expired due to 20 minutes of inactivity.");
                setIsLogoutModalOpen(true);
            }, 1200000);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        resetTimer();

        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [navigate, isLoggingOut]);

    // --- HANDLERS ---
    const handleTriggerLogout = () => {
        setTimeoutMessage("");
        setIsLogoutModalOpen(true);
    };

    const handleCancelLogout = () => {
        if (timeoutMessage) {
            performFinalCleanup();
        } else {
            setIsLogoutModalOpen(false);
        }
    };

    return (
        <div className="os-wrapper">
            {/* 1. The Left Sidebar */}
            <Sidebar
                // Trigger the unified Settings Drawer from the gear icon
                onOpenSettings={() => setIsSettingsDrawerOpen(true)}
                onTriggerLogout={handleTriggerLogout}
            />

            {/* 2. The Main Page Content Area */}
            <div className={`os-main-content ${isSettingsDrawerOpen || isLogoutModalOpen ? 'pointer-events-none' : ''}`}>
                {children}
            </div>

            {/* 3. The Unified UI & Settings Drawer */}
            <SettingsDrawer
                isOpen={isSettingsDrawerOpen}
                onClose={() => setIsSettingsDrawerOpen(false)}
                sidebarWidth={256}
            />

            {/* 4. The Animated Logout Modal */}
            <LogoutModal
                isOpen={isLogoutModalOpen}
                onConfirm={performFinalCleanup}
                onCancel={handleCancelLogout}
                isLoggingOut={isLoggingOut}
                message={timeoutMessage}
            />
        </div>
    );
};

export default MasterLayout;