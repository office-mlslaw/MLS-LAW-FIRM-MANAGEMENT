const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, UserProfile } = require('../models/models');

// --- ONBOARD NEW PERSONNEL ---
router.post('/add', async (req, res) => {
    try {
        const { firstName, lastName, username, email, designation, category, employee_code, password } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username already active in system." });

        // 2. Hash the generated Passkey
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create the Base User
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            role: 'AGENT' // Default role
        });

        const savedUser = await newUser.save();

        // 4. Create the Legal Profile
        const newProfile = new UserProfile({
            user: savedUser._id,
            designation,
            category,
            employee_code,
            is_active: true
        });

        await newProfile.save();

        res.status(201).json({ success: true, message: "Personnel Onboarded Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;