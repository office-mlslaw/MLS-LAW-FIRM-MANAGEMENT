import React from 'react';
import '../styles/LogoutModal.css'; // Successfully linked to your animation engine

const LogoutModal = ({ isOpen, onConfirm, onCancel, isLoggingOut }) => {
    return (
        <div className={`logout-modal-overlay ${isOpen ? 'open' : ''}`}>
            <div className="logout-modal">

                {/* The Animated Doorway */}
                <div className="doorway-container">
                    <div className="door"></div>
                    {/* The walking person icon. It triggers the CSS animation when isLoggingOut is true */}
                    <i className={`fa-solid fa-person person ${isLoggingOut ? 'walking' : ''}`}></i>
                </div>

                <h3 className="text-xl font-black mb-2 uppercase text-stone-800 dark:text-white">Secure Logout</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 tracking-wide">
                    Are you sure you want to terminate this session?
                </p>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={onCancel}
                        className="modal-btn btn-cancel"
                        disabled={isLoggingOut}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="modal-btn btn-confirm"
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? 'Terminating...' : 'Logout'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LogoutModal;