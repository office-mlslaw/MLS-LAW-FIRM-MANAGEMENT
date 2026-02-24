const express = require('express');
const router = express.Router();
const { User } = require('../models/models');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // --- EMERGENCY DUMMY ADMIN OVERRIDE ---
    if (username === 'admin' && password === 'vault123') {
        return res.json({
            success: true,
            user: {
                username: 'Master Admin',
                role: 'ADMIN',
                id: 'DUMMY_001'
            },
            token: 'dummy-session-token'
        });
    }
});
// ==========================================
// THE GATEKEEPER VERIFICATION ENGINE
// POST: /api/auth/gatekeeper-verify
// ==========================================
router.post('/gatekeeper-verify', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        console.log(`🔒 Authentication Attempt: [${role.toUpperCase()}] ID: ${username}`);

        // 1. DEVELOPMENT OVERRIDE (Temporary backdoor for testing)
        if (username === 'test' && password === '1234') {
            return res.status(200).json({
                success: true,
                message: "Dev Override Accepted",
                redirect: "/dashboard",
                userMeta: { username: "Test User", role: role }
            });
        }

        // 2. REAL DATABASE VERIFICATION
        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(401).json({ success: false, message: "USER NOT FOUND IN REGISTRY" });
        }

        // 3. PASSWORD CHECK
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: "INVALID PASSKEY" });
        }

        // 4. ROLE CHECK (Admin vs Standard User)
        if (role === 'admin' && !user.is_staff) {
            return res.status(403).json({ success: false, message: "INSUFFICIENT CLEARANCE" });
        }

        // 5. GRANT ACCESS
        console.log(`✅ Access Granted for: ${username}`);
        res.status(200).json({
            success: true,
            message: "ACCESS GRANTED",
            redirect: "/dashboard",
            userMeta: {
                id: user._id,
                username: user.username,
                role: user.is_staff ? 'ADMIN' : 'USER',
            }
        });

    } catch (error) {
        console.error("GATEKEEPER ERROR:", error);
        res.status(500).json({ success: false, message: "SYSTEM MALFUNCTION" });
    }
});


// ==========================================
// PASSWORD UPDATE ENGINE
// POST: /api/auth/change-password
// ==========================================
router.post('/change-password', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;

        console.log(`🔐 Password Change Attempt for: ${username}`);

        // 1. DEVELOPMENT OVERRIDE (For testing with the 'test' account)
        if (username === 'test' || username === 'Test User') {
            console.log(`✅ Dev Override: Mock password update successful.`);
            return res.status(200).json({ success: true, message: "Credentials Updated Successfully (Mock Mode)." });
        }

        // 2. FIND REAL USER
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).json({ success: false, message: "USER NOT FOUND IN REGISTRY." });
        }

        // 3. VERIFY CURRENT PASSWORD
        if (user.password !== currentPassword) {
            return res.status(401).json({ success: false, message: "CURRENT PASSKEY INCORRECT." });
        }

        // 4. SAVE NEW PASSWORD
        user.password = newPassword;
        await user.save();

        console.log(`✅ Password updated securely for: ${username}`);
        res.status(200).json({ success: true, message: "CREDENTIALS UPDATED SUCCESSFULLY." });

    } catch (error) {
        console.error("PASSWORD UPDATE ERROR:", error);
        res.status(500).json({ success: false, message: "SYSTEM MALFUNCTION DURING UPDATE." });
    }
});

module.exports = router;