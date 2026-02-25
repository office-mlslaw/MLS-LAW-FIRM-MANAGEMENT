import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// --- IMPORT CORE COMPONENTS ---
import Login from './components/Login';
import MasterLayout from './components/MasterLayout';
import Dashboard from './components/Dashboard';
import PersonnelRoll from './components/PersonnelRoll';
import CaseManager from './components/CaseManager';
import ClientRegistry from './components/ClientRegistry';
import WorkPipeline from './components/WorkPipeline';
import RequestWork from './components/RequestWork';
import Calendar from './components/Calendar';
import LeavePortal from './components/LeavePortal';
import ChatHub from './components/ChatHub';
import SecureVault from './components/SecureVault';
import GrievanceSubmit from './components/Grievance';
import MonthlyAudit from './components/MonthlyAudit';
import GrievanceAdmin from './components/GrievanceAdmin';
import Arcade from './components/Arcade';
import UtilityBelt from './components/UtilityBelt';
import PdfStudio from './components/PdfStudio';
import DraftingBot from './components/DraftingBot';
import MiscDrafts from './components/MiscDrafts';
import TranslationBot from './components/TranslationBot';
import WordStudio from './components/WordStudio'; // <-- WORD STUDIO IMPORTED

// --- IMPORT GAMES (Scoped Folder Structure) ---
// Each game now lives in its own folder with its own JS and CSS
// --- CRITICAL FIX: MATCHING FILENAMES ON DISK EXACTLY ---
import BlockSmash from './components/games/Blocksmash/Blocksmash'; // Note the lowercase 's'
import CarChase from './components/games/CarChase/CarChase';
import SpeedTypist from './components/games/SpeedTypist/SpeedTypist';
import Sudoku from './components/games/Sudoku/Sudoku';

// A placeholder component for modules currently under development
const PlaceholderPage = ({ title }) => (
    <div className="p-10 flex-1 w-full h-full animate-fade-in">
        <h1 className="text-3xl font-black uppercase theme-text-main tracking-tighter">
            {title}
        </h1>
        <div className="mt-4 p-6 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50/50 dark:bg-white/5">
            <p className="text-stone-500 font-medium">
                <i className="fa-solid fa-microchip mr-2 animate-pulse text-amber-500"></i>
                This module is online and awaiting its data feed.
            </p>
        </div>
    </div>
);

function App() {
    return (
        <Router>
            <Routes>
                {/* 1. THE AUTH PORTAL */}
                <Route path="/" element={<Login />} />

                {/* 2. SECURE OPERATING SYSTEM ROUTES */}
                {/* --- MAIN --- */}
                <Route path="/dashboard" element={<MasterLayout><Dashboard /></MasterLayout>} />
                <Route path="/chat" element={<MasterLayout><ChatHub /></MasterLayout>} />

                {/* --- PORTALS --- */}
                <Route path="/cases" element={<MasterLayout><CaseManager /></MasterLayout>} />
                <Route path="/clients" element={<MasterLayout><ClientRegistry /></MasterLayout>} />
                <Route path="/calendar" element={<MasterLayout><Calendar /></MasterLayout>} />
                <Route path="/work" element={<MasterLayout><WorkPipeline /></MasterLayout>} />

                {/* --- PERSONNEL --- */}
                <Route path="/personnel" element={<MasterLayout><PersonnelRoll /></MasterLayout>} />
                <Route path="/leave" element={<MasterLayout><LeavePortal /></MasterLayout>} />

                {/* --- DRAFTING & TRANSLATION --- */}
                <Route path="/drafting" element={<MasterLayout><DraftingBot /></MasterLayout>} />
                <Route path="/translation" element={<MasterLayout><TranslationBot /></MasterLayout>} />
                <Route path="/misc-drafts" element={<MasterLayout><MiscDrafts /></MasterLayout>} />

                {/* --- TOOLKIT & STUDIO --- */}
                <Route path="/tools" element={<MasterLayout><UtilityBelt /></MasterLayout>} />
                <Route path="/tools/pdf-studio" element={<MasterLayout><PdfStudio /></MasterLayout>} />
                <Route path="/tools/word-studio" element={<MasterLayout><WordStudio /></MasterLayout>} /> {/* <-- FIXED: WORD STUDIO INJECTED */}

                {/* --- GRIEVANCE & SECURITY --- */}
                <Route path="/grievance" element={<MasterLayout><GrievanceSubmit /></MasterLayout>} />
                <Route path="/grievance-audit" element={<MasterLayout><MonthlyAudit /></MasterLayout>} />

                {/* --- ADMIN VAULT --- */}
                <Route path="/admin-vault" element={<MasterLayout><SecureVault /></MasterLayout>} />
                <Route path="/internal-affairs-vault" element={<MasterLayout><GrievanceAdmin /></MasterLayout>} />

                {/* --- ARCADE & GAMES --- */}
                <Route path="/arcade" element={<MasterLayout><Arcade /></MasterLayout>} />

                {/* Scoped Game Components */}
                <Route path="/arcade/block-smash" element={<MasterLayout><BlockSmash /></MasterLayout>} />
                <Route path="/arcade/car-chase" element={<MasterLayout><CarChase /></MasterLayout>} />
                <Route path="/arcade/sudoku" element={<MasterLayout><Sudoku /></MasterLayout>} />
                <Route path="/arcade/speed-typist" element={<MasterLayout><SpeedTypist /></MasterLayout>} />

                {/* --- MISC --- */}
                <Route path="/request-work" element={<MasterLayout><RequestWork /></MasterLayout>} />

                {/* 3. CATCH-ALL */}
                <Route path="*" element={<MasterLayout><PlaceholderPage title="Module Initializing..." /></MasterLayout>} />
            </Routes>
        </Router>
    );
}

export default App;