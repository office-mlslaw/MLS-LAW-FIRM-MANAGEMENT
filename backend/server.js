require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PDFDocument, rgb, degrees } = require('pdf-lib');

const app = express();
const PORT = 8080;
const DB_PATH = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- 📁 MULTER CONFIGURATION (SECURE VAULT & TEMP) ---
const uploadDir = path.join(__dirname, 'uploads', 'vault');
const tempDir = path.join(__dirname, 'uploads', 'temp'); // ADDED: For PDF Utility Belt

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("📁 Secure Vault physical directory created.");
}
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log("📁 Temp PDF directory created.");
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. Vault Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

// 2. Temp Storage (For Utility Belt)
const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => cb(null, 'temp_' + Date.now() + path.extname(file.originalname))
});
const uploadTemp = multer({ storage: tempStorage });

// --- 📦 LOCAL DB INITIALIZER ---
if (!fs.existsSync(DB_PATH)) {
    const initialData = {
        users: [],
        profiles: [],
        clients: [],
        cases: [],
        tasks: [],
        events: [],
        leaves: [],
        blackout_dates: [],
        messages: [],
        vault_files: [],
        vault_folders: [],
        grievances: [],
        arcade: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    console.log("📁 Local Database Created: db.json");
}

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
const generateId = (prefix = 'EMP') => prefix + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();

// ==========================================
// 🔌 1. AUTHENTICATION ROUTES
// ==========================================
app.post('/api/auth/login', (req, res) => {
    const { username, password, role } = req.body;
    const db = readDB();

    if (username === 'admin' && password === 'vault123') {
        if (role === 'USER') return res.status(403).json({ message: "Master account requires Admin Portal." });
        return res.json({ success: true, user: { username: 'Admin_PC', sessionRole: 'ADMIN', id: 'MASTER_01' } });
    }

    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        if (!user.is_active) return res.status(403).json({ message: "Account Suspended." });
        if (role === 'ADMIN' && !user.is_admin) return res.status(403).json({ message: "Access Denied." });

        const sessionUser = { ...user, sessionRole: role || 'USER' };
        delete sessionUser.password;
        return res.json({ success: true, user: sessionUser });
    }
    res.status(401).json({ message: "Invalid Credentials" });
});

// ==========================================
// 👔 2. PERSONNEL MANAGEMENT
// ==========================================
app.get('/api/personnel/roll', (req, res) => {
    const db = readDB();
    const fullProfiles = db.profiles.map(profile => {
        const user = db.users.find(u => u.id === profile.userId) || {};
        return { ...profile, user };
    });
    res.json({
        partners: fullProfiles.filter(p => p.category === 'PARTNER'),
        associates: fullProfiles.filter(p => p.category === 'ASSOCIATE'),
        staff: fullProfiles.filter(p => p.category === 'STAFF')
    });
});

// ==========================================
// 🤝 3. CLIENT REGISTRY
// ==========================================
app.get('/api/clients', (req, res) => res.json(readDB().clients || []));

app.post('/api/clients/add', (req, res) => {
    const db = readDB();
    const newClient = { id: generateId('CLI'), ...req.body, paid_fee: 0, visits: [], created_at: new Date().toISOString() };
    db.clients.push(newClient);
    writeDB(db);
    res.json({ success: true, client: newClient });
});

app.post('/api/clients/edit/:id', (req, res) => {
    const db = readDB();
    const idx = db.clients.findIndex(c => c.id === req.params.id);
    if (idx > -1) {
        db.clients[idx] = { ...db.clients[idx], ...req.body };
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

// ==========================================
// 🏛️ 4. CASE MANAGEMENT & CAUSE LIST SYNC
// ==========================================
app.get('/api/cases', (req, res) => res.json(readDB().cases || []));

app.post('/api/cases/add', (req, res) => {
    const db = readDB();
    const newCase = {
        id: generateId('CASE'), ...req.body,
        dockets: [], tasks: [], ledger: [], created_at: new Date().toISOString()
    };
    db.cases.push(newCase);
    writeDB(db);
    res.json({ success: true, case: newCase });
});

app.post('/api/cases/edit/:id', (req, res) => {
    const db = readDB();
    const idx = db.cases.findIndex(c => c.id === req.params.id);
    if (idx > -1) {
        db.cases[idx] = { ...db.cases[idx], ...req.body };
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

// ==========================================
// 📋 5. WORK PIPELINE (KANBAN)
// ==========================================
app.get('/api/tasks', (req, res) => res.json(readDB().tasks || []));

app.post('/api/tasks/add', (req, res) => {
    const db = readDB();
    const newTask = { id: generateId('TSK'), ...req.body, status: 'TODO', workLogs: [], created_at: new Date().toISOString() };
    db.tasks.push(newTask);
    writeDB(db);
    res.json({ success: true, task: newTask });
});

app.post('/api/tasks/update-status/:id', (req, res) => {
    const db = readDB();
    const idx = db.tasks.findIndex(t => t.id === req.params.id);
    if (idx > -1) {
        db.tasks[idx].status = req.body.status;
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

app.post('/api/tasks/:id/log', (req, res) => {
    const db = readDB();
    const idx = db.tasks.findIndex(t => t.id === req.params.id);
    if (idx > -1) {
        if (!db.tasks[idx].workLogs) db.tasks[idx].workLogs = [];
        db.tasks[idx].workLogs.unshift({ id: generateId('LOG'), ...req.body });
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

app.delete('/api/tasks/delete/:id', (req, res) => {
    const db = readDB();
    db.tasks = db.tasks.filter(t => t.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ==========================================
// 📅 6. CALENDAR & MANUAL EVENTS
// ==========================================
app.get('/api/events', (req, res) => {
    const db = readDB();
    res.json(db.events || []);
});

app.post('/api/events/add', (req, res) => {
    const db = readDB();
    if (!db.events) db.events = [];
    const newEvent = { id: generateId('EVT'), ...req.body, created_at: new Date().toISOString() };
    db.events.push(newEvent);
    writeDB(db);
    res.json({ success: true, event: newEvent });
});

app.delete('/api/events/delete/:id', (req, res) => {
    const db = readDB();
    db.events = (db.events || []).filter(e => e.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ==========================================
// 🏖️ 7. LEAVE PORTAL & BLACKOUT DATES
// ==========================================
app.get('/api/leaves', (req, res) => res.json(readDB().leaves || []));

app.post('/api/leaves/add', (req, res) => {
    const db = readDB();
    if (!db.leaves) db.leaves = [];

    const start = new Date(req.body.start_date);
    const end = new Date(req.body.end_date);
    const diffTime = Math.abs(end - start);
    const days_count = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newLeave = {
        id: generateId('LV'),
        ...req.body,
        days_count,
        status: 'PENDING',
        admin_response: '',
        is_edited: false,
        created_at: new Date().toISOString()
    };
    db.leaves.push(newLeave);
    writeDB(db);
    res.json({ success: true, leave: newLeave });
});

app.post('/api/leaves/edit-reason/:id', (req, res) => {
    const db = readDB();
    const idx = db.leaves.findIndex(l => l.id === req.params.id);
    if (idx > -1) {
        db.leaves[idx].reason = req.body.reason;
        db.leaves[idx].is_edited = true;
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

app.post('/api/leaves/admin-action/:id', (req, res) => {
    const db = readDB();
    const idx = db.leaves.findIndex(l => l.id === req.params.id);
    if (idx > -1) {
        db.leaves[idx].status = req.body.status;
        db.leaves[idx].admin_response = req.body.admin_response;
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

app.delete('/api/leaves/delete/:id', (req, res) => {
    const db = readDB();
    db.leaves = db.leaves.filter(l => l.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

app.get('/api/blackout-dates', (req, res) => res.json(readDB().blackout_dates || []));

app.post('/api/blackout-dates/add', (req, res) => {
    const db = readDB();
    if (!db.blackout_dates) db.blackout_dates = [];
    const newBlackout = { id: generateId('BLK'), ...req.body };
    db.blackout_dates.push(newBlackout);
    writeDB(db);
    res.json({ success: true });
});

app.delete('/api/blackout-dates/delete/:id', (req, res) => {
    const db = readDB();
    db.blackout_dates = (db.blackout_dates || []).filter(b => b.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ==========================================
// 💬 8. CHAT HUB ENGINE
// ==========================================
app.get('/api/chat/:user1/:user2', (req, res) => {
    const db = readDB();
    const { user1, user2 } = req.params;

    const conversation = (db.messages || []).filter(m =>
        (m.sender === user1 && m.receiver === user2) ||
        (m.sender === user2 && m.receiver === user1)
    );

    let updated = false;
    conversation.forEach(m => {
        if (m.receiver === user1 && !m.is_read) {
            m.is_read = true;
            updated = true;
        }
    });

    if (updated) writeDB(db);
    res.json(conversation);
});

app.post('/api/chat/send', (req, res) => {
    const db = readDB();
    if (!db.messages) db.messages = [];

    const newMsg = {
        id: generateId('MSG'),
        sender: req.body.sender,
        receiver: req.body.receiver,
        text: req.body.text,
        status: 'NONE',
        is_read: false,
        timestamp: new Date().toISOString()
    };

    db.messages.push(newMsg);
    writeDB(db);
    res.json({ success: true, message: newMsg });
});

app.post('/api/chat/update-status/:id', (req, res) => {
    const db = readDB();
    const idx = db.messages.findIndex(m => m.id === req.params.id);
    if (idx > -1) {
        db.messages[idx].status = req.body.status;
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

app.post('/api/chat/to-kanban', (req, res) => {
    const db = readDB();
    if (!db.tasks) db.tasks = [];

    const newTask = {
        id: generateId('TSK'),
        title: req.body.text,
        assigned_to: req.body.receiver,
        priority: 'NORMAL',
        status: 'TODO',
        workLogs: [],
        created_at: new Date().toISOString()
    };

    db.tasks.push(newTask);
    writeDB(db);
    res.json({ success: true });
});

// ==========================================
// 🗄️ 9. SECURE FILE VAULT FULL EXPLORER
// ==========================================
app.post('/api/vault/folders/add', (req, res) => {
    const db = readDB();
    if (!db.vault_folders) db.vault_folders = [];
    const newFolder = {
        id: generateId('FLD'),
        name: req.body.name,
        case_id: req.body.case_id,
        parent_id: req.body.parent_id || null,
        created_at: new Date().toISOString()
    };
    db.vault_folders.push(newFolder);
    writeDB(db);
    res.json({ success: true, folder: newFolder });
});

app.put('/api/vault/folders/rename/:id', (req, res) => {
    const db = readDB();
    const folder = (db.vault_folders || []).find(f => f.id === req.params.id);
    if (folder) {
        folder.name = req.body.name;
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

app.delete('/api/vault/folders/delete/:id', (req, res) => {
    const db = readDB();
    const filesToDelete = (db.vault_files || []).filter(f => f.folder_id === req.params.id);
    filesToDelete.forEach(fileObj => {
        const physicalPath = path.join(__dirname, fileObj.file_path);
        if (fs.existsSync(physicalPath)) fs.unlinkSync(physicalPath);
    });
    db.vault_files = (db.vault_files || []).filter(f => f.folder_id !== req.params.id);
    db.vault_folders = (db.vault_folders || []).filter(f => f.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

app.get('/api/vault/content/:case_id', (req, res) => {
    const db = readDB();
    const files = (db.vault_files || []).filter(f => f.case_id === req.params.case_id);
    const folders = (db.vault_folders || []).filter(f => f.case_id === req.params.case_id);
    res.json({ files, folders });
});

app.post('/api/vault/upload', upload.single('file'), (req, res) => {
    try {
        const db = readDB();
        if (!db.vault_files) db.vault_files = [];
        if (!req.file) return res.status(400).json({ error: "No file provided." });

        const newFile = {
            id: generateId('DOC'),
            file_name: req.file.originalname,
            file_path: `/uploads/vault/${req.file.filename}`,
            case_id: req.body.case_id,
            folder_id: req.body.folder_id || null,
            uploaded_by: req.body.uploader,
            size: req.file.size,
            uploaded_at: new Date().toISOString()
        };

        db.vault_files.push(newFile);
        writeDB(db);
        res.json({ success: true, file: newFile });
    } catch (error) { res.status(500).json({ error: "Upload failed securely." }); }
});

app.put('/api/vault/files/rename/:id', (req, res) => {
    const db = readDB();
    const file = (db.vault_files || []).find(f => f.id === req.params.id);
    if (file) {
        const oldExt = path.extname(file.file_name);
        let newName = req.body.name;
        if (!newName.toLowerCase().endsWith(oldExt.toLowerCase())) { newName += oldExt; }
        file.file_name = newName;
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

app.delete('/api/vault/files/delete/:id', (req, res) => {
    const db = readDB();
    const fileIndex = (db.vault_files || []).findIndex(f => f.id === req.params.id);
    if (fileIndex > -1) {
        const fileObj = db.vault_files[fileIndex];
        const physicalPath = path.join(__dirname, fileObj.file_path);
        if (fs.existsSync(physicalPath)) fs.unlinkSync(physicalPath);
        db.vault_files.splice(fileIndex, 1);
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).json({ error: "File not found." });
});

app.post('/api/vault/toggle-lock/:case_id', (req, res) => {
    const db = readDB();
    const caseObj = db.cases.find(c => c.id === req.params.case_id);
    if (caseObj) {
        caseObj.is_locked = req.body.is_locked;
        caseObj.passcode = req.body.passcode || null;
        writeDB(db);
        res.json({ success: true });
    } else res.status(404).send();
});

app.post('/api/vault/verify-passcode/:case_id', (req, res) => {
    const db = readDB();
    const caseObj = db.cases.find(c => c.id === req.params.case_id);
    if (caseObj && caseObj.passcode === req.body.passcode) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Incorrect Passcode" });
    }
});

app.get('/api/vault/download/:file_id', async (req, res) => {
    const db = readDB();
    const fileObj = db.vault_files.find(f => f.id === req.params.file_id);
    if (!fileObj) return res.status(404).send("File not found");

    const caseObj = db.cases.find(c => c.id === fileObj.case_id);
    const isLocked = caseObj && caseObj.is_locked;
    const filePath = path.join(__dirname, fileObj.file_path);

    if (!fs.existsSync(filePath)) return res.status(404).send("Physical file missing");

    if (isLocked && fileObj.file_name.toLowerCase().endsWith('.pdf')) {
        try {
            const existingPdfBytes = fs.readFileSync(filePath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const pages = pdfDoc.getPages();

            pages.forEach(page => {
                const { width, height } = page.getSize();
                page.drawText('STRICTLY CONFIDENTIAL', {
                    x: width / 2 - 300, y: height / 2,
                    size: 45, color: rgb(0.85, 0.1, 0.1), opacity: 0.2, rotate: degrees(45),
                });
            });

            const pdfBytes = await pdfDoc.save();
            res.setHeader('Content-Disposition', `attachment; filename="CONFIDENTIAL_${fileObj.file_name}"`);
            res.setHeader('Content-Type', 'application/pdf');
            return res.send(Buffer.from(pdfBytes));
        } catch (err) {
            console.error("Watermark failed, downloading original.", err);
        }
    }
    res.setHeader('Content-Disposition', `attachment; filename="${isLocked ? 'CONFIDENTIAL_' : ''}${fileObj.file_name}"`);
    res.download(filePath);
});

// ==========================================
// 🛡️ 10. GRIEVANCE & MONTHLY AUDIT ENGINE
// ==========================================

const getLastMonday = (year, month) => {
    let d = new Date(year, month + 1, 0);
    while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
    d.setHours(9, 0, 0, 0);
    return d;
};

app.get('/api/audit/status', (req, res) => {
    const now = new Date();
    let target = getLastMonday(now.getFullYear(), now.getMonth());
    const isOpen = now.toDateString() === target.toDateString();
    if (now > target && !isOpen) target = getLastMonday(now.getFullYear(), now.getMonth() + 1);
    res.json({ is_open: isOpen, target_date: target.toISOString() });
});

app.get('/api/grievances', (req, res) => res.json(readDB().grievances || []));

app.post('/api/grievances/submit', (req, res) => {
    const db = readDB();
    if (!db.grievances) db.grievances = [];
    const secretKey = 'GRV-' + Math.random().toString(36).substr(2, 4).toUpperCase() + '-' + Math.random().toString(36).substr(2, 2).toUpperCase();

    const newGrievance = {
        id: generateId('GRV'), secret_key: secretKey, type: req.body.type,
        subject: req.body.subject || "Confidential Report", description: req.body.description || "",
        target_user: req.body.target_user || null, exp_office: req.body.exp_office || "",
        exp_work: req.body.exp_work || "", rating_prof: req.body.rating_prof || null,
        rating_collab: req.body.rating_collab || null, rating_friend: req.body.rating_friend || null,
        status: 'INVESTIGATING', submitted_at: new Date().toISOString(), admin_reply: ""
    };

    db.grievances.push(newGrievance);
    writeDB(db);
    res.json({ success: true, secret_key: secretKey });
});

// ==========================================
// 🕹️ 11. ARCADE & LEADERBOARD ENGINE
// ==========================================

app.get('/api/arcade/leaderboard', (req, res) => res.json(readDB().arcade || []));

app.post('/api/arcade/log', (req, res) => {
    const db = readDB();
    if (!db.arcade) db.arcade = [];

    const { username, game, score, timePlayedSeconds } = req.body;
    let userRecord = db.arcade.find(a => a.username === username && a.game === game);

    if (userRecord) {
        if (score > userRecord.highScore) userRecord.highScore = score;
        userRecord.timePlayed += timePlayedSeconds;
        userRecord.lastPlayed = new Date().toISOString();
    } else {
        db.arcade.push({
            id: generateId('ARC'), username, game, highScore: score,
            timePlayed: timePlayedSeconds, lastPlayed: new Date().toISOString()
        });
    }
    writeDB(db);
    res.json({ success: true });
});

// ==========================================
// 🛠️ 12. UTILITY BELT (PDF & AI ENGINES)
// ==========================================

// --- AI Mock Engine ---
app.post('/api/tools/ai', (req, res) => {
    const { action, text } = req.body;
    let result = "";

    // Simulated AI processing delay
    setTimeout(() => {
        if (action === 'dict') {
            result = `[Legal Lexicon Result]: '${text}' generally refers to a foundational legal principle. Check specific bare acts for statutory definitions.`;
        } else if (action === 'para') {
            result = `[Rephrased for Court]: It is most respectfully submitted that pursuant to the facts stated above, the respondent bears liability.`;
        } else if (action === 'gist') {
            result = `[AI Summary]: 1. The petition lacks merit. 2. Jurisdiction is challenged. 3. Interim relief was denied.`;
        }
        res.json({ success: true, result });
    }, 1200);
});

// --- PDF Merger ---
app.post('/api/tools/pdf/merge', uploadTemp.array('pdfs', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) return res.status(400).send("Need at least 2 PDFs to merge.");

        const mergedPdf = await PDFDocument.create();
        for (let file of req.files) {
            const pdfBytes = fs.readFileSync(file.path);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            fs.unlinkSync(file.path); // Clean up temp file
        }

        const mergedPdfFile = await mergedPdf.save();
        res.setHeader('Content-Disposition', 'attachment; filename="Merged_Document.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(mergedPdfFile));
    } catch (error) {
        console.error("PDF Merge Error:", error);
        res.status(500).send("Failed to merge PDFs.");
    }
});

// --- PDF Splitter ---
app.post('/api/tools/pdf/split', uploadTemp.single('pdf'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No PDF uploaded.");

        const rawRange = req.body.pages; // e.g., "1, 3, 5-7"
        const srcPdf = await PDFDocument.load(fs.readFileSync(req.file.path));
        const newPdf = await PDFDocument.create();

        // Parse "1, 3, 5-7" into zero-indexed array [0, 2, 4, 5, 6]
        let pagesToKeep = [];
        rawRange.split(',').forEach(part => {
            if (part.includes('-')) {
                let [start, end] = part.split('-').map(Number);
                for (let i = start; i <= end; i++) pagesToKeep.push(i - 1);
            } else {
                pagesToKeep.push(Number(part) - 1);
            }
        });

        // Ensure pages exist
        const totalPages = srcPdf.getPageCount();
        pagesToKeep = pagesToKeep.filter(p => p >= 0 && p < totalPages);

        const copiedPages = await newPdf.copyPages(srcPdf, pagesToKeep);
        copiedPages.forEach((page) => newPdf.addPage(page));

        fs.unlinkSync(req.file.path); // Clean up temp file

        const splitPdfFile = await newPdf.save();
        res.setHeader('Content-Disposition', 'attachment; filename="Split_Document.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(splitPdfFile));
    } catch (error) {
        console.error("PDF Split Error:", error);
        res.status(500).send("Failed to split PDF.");
    }
});

// --- Image to PDF Converter ---
app.post('/api/tools/pdf/img2pdf', uploadTemp.array('images', 50), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).send("No images provided.");

        const pdfDoc = await PDFDocument.create();

        for (let file of req.files) {
            const imgBytes = fs.readFileSync(file.path);
            let img;

            // Embed based on mime type
            if (file.mimetype.includes('jpeg') || file.mimetype.includes('jpg')) {
                img = await pdfDoc.embedJpg(imgBytes);
            } else if (file.mimetype.includes('png')) {
                img = await pdfDoc.embedPng(imgBytes);
            } else {
                fs.unlinkSync(file.path);
                continue; // Skip unsupported files
            }

            // Create a page matching the exact image dimensions
            const page = pdfDoc.addPage([img.width, img.height]);
            page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });

            fs.unlinkSync(file.path); // Clean up temp file
        }

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Disposition', 'attachment; filename="Compiled_Annexure.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error("Img2Pdf Error:", error);
        res.status(500).send("Failed to convert images.");
    }
});

// ==========================================
// 🚀 ENGINE START
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PC-INTERNAL SERVER LIVE: http://127.0.0.1:${PORT}`);
    console.log(`💾 Data stored locally at: ${DB_PATH}`);
});