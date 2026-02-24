const mongoose = require('mongoose');

// ==========================================
// UTILS (Encryption Placeholders)
// ==========================================
// Matches your Python logic. We will replace this with real crypto later.
const encrypt_text = (text) => `gAAAA_${text}`; // Added the 'gAAAA' Fernet signature you used
const decrypt_text = (text) => text.replace('gAAAA_', '');

const options = {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // Forces JS to use your exact Python column names
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
};

// ==========================================
// 0. DJANGO USER REPLICA (CRITICAL)
// ==========================================
// Django gives this for free, Node.js needs it defined.
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    first_name: { type: String },
    last_name: { type: String },
    is_active: { type: Boolean, default: true },
    is_staff: { type: Boolean, default: false }
}, options);

// Python @receiver(post_save, sender=User) equivalent:
// Automatically creates a UserProfile when a User is created.
UserSchema.post('save', async function (doc, next) {
    const UserProfile = mongoose.model('UserProfile');
    const existingProfile = await UserProfile.findOne({ user: doc._id });
    if (!existingProfile) {
        await UserProfile.create({ user: doc._id });
    }
    next();
});

// ==========================================
// 1. CLIENT REGISTRY
// ==========================================
const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 200 },
    phone: { type: String, default: null, maxlength: 20 },
    email: { type: String, default: null },
    address: { type: String, default: null },
    total_fees: { type: Number, default: 0.00 },
    amount_paid: { type: Number, default: 0.00 },
    status: { type: String, enum: ['RESEARCH', 'DRAFTING', 'HEARING', 'DISPOSED'], default: 'RESEARCH' },
    lead_counsel: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, options);

ClientSchema.virtual('balance_due').get(function () {
    return this.total_fees - this.amount_paid;
});

ClientSchema.virtual('payment_percentage').get(function () {
    if (this.total_fees === 0) return 0;
    return Math.floor((this.amount_paid / this.total_fees) * 100);
});

const ClientVisitSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: Date, required: true },
    purpose: { type: String, required: true, maxlength: 200 },
    notes: { type: String, default: '' },
    logged_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, options);

// ==========================================
// 2. CASE MANAGEMENT
// ==========================================
const CASE_TYPES = [
    'WP', 'WA', 'CRP', 'CRLP', 'CMA', 'AS_HC', 'SA', 'PIL', 'CONTEMPT',
    'OS', 'AS_LC', 'CC', 'OP', 'EP', 'MC', 'OA', 'TA', 'MA',
    'DCDRC', 'SCDRC', 'NCDRC', 'CIVIL', 'CRIMINAL'
];

const CaseSchema = new mongoose.Schema({
    case_id: { type: String, unique: true, required: true, maxlength: 50 },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    client_role: { type: String, enum: ['PETITIONER', 'RESPONDENT'], default: 'PETITIONER' },
    court_name: { type: String, default: "High Court", maxlength: 100 },
    court_hall_number: { type: Number, default: null },
    petitioner: { type: String, default: null, maxlength: 255 },
    respondent: { type: String, default: null, maxlength: 255 },
    opposing_party: { type: String, default: '', maxlength: 255 },
    opposing_counsel: { type: String, default: '', maxlength: 100 },
    case_type: { type: String, enum: CASE_TYPES, required: true, maxlength: 10 },
    status: { type: String, enum: ['RESEARCH', 'DRAFTING', 'HEARING', 'DISPOSED', 'OPEN', 'CLOSED'], default: 'RESEARCH' },
    priority: { type: String, enum: ['HIGH', 'NORMAL', 'LOW'], default: 'NORMAL' },
    assigned_lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    next_hearing: { type: Date, default: null },
    brief_facts: { type: String, default: '' }
}, options);

const ExpenseSchema = new mongoose.Schema({
    case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    amount: { type: Number, required: true },
    expense_type: { type: String, enum: ['COURT_FEE', 'STAMP', 'TRAVEL', 'MISC'], required: true, maxlength: 20 },
    description: { type: String, required: true, maxlength: 255 },
    receipt: { type: String, default: null },
    date: { type: Date, default: Date.now } // In Django auto_now_add applies only to creation
}, options);

// ==========================================
// 3. SECURE FILE VAULT
// ==========================================
const SecureFileSchema = new mongoose.Schema({
    file_name: { type: String, required: true, maxlength: 100 },
    file_obj: { type: String, default: null },
    court_category: { type: String, enum: ['HC', 'LC', 'TR', 'CC'], default: 'HC', maxlength: 10 },
    case_type: { type: String, enum: CASE_TYPES, default: 'WP', maxlength: 20 },
    is_folder: { type: Boolean, default: false },
    parent_folder: { type: mongoose.Schema.Types.ObjectId, ref: 'SecureFile', default: null },
    is_translation: { type: Boolean, default: false },
    original_content: { type: String, default: null },
    translated_content: { type: String, default: null },
    related_case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
    allowed_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    uploaded_at: { type: Date, default: Date.now }
}, options);

const DocumentVersionSchema = new mongoose.Schema({
    parent_file: { type: mongoose.Schema.Types.ObjectId, ref: 'SecureFile', required: true },
    version_number: { type: Number, required: true },
    content_snapshot: { type: String, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, options); // options handles created_at

// ==========================================
// 4. CHAT HUB (ENCRYPTED)
// ==========================================
const ChatMessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: null },
    file_attachment: { type: String, default: null },
    attachment_type: { type: String, enum: ['IMAGE', 'VIDEO', 'AUDIO', 'DOC', 'MEMOJI'], default: null, maxlength: 20 },
    timestamp: { type: Date, default: Date.now },
    is_read: { type: Boolean, default: false },
    is_edited: { type: Boolean, default: false },
    is_deleted_everyone: { type: Boolean, default: false },
    deleted_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reply_to: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage', default: null }
}, options);

// Matches your exact Python save() method for auto-encryption
ChatMessageSchema.pre('save', function (next) {
    if (this.isModified('content') && this.content) {
        // Checking for 'gAAAA' just like your Python code logic
        if (!this.content.startsWith('gAAAA')) {
            this.content = encrypt_text(this.content);
        }
    }
    next();
});

ChatMessageSchema.virtual('message').get(function () {
    if (this.is_deleted_everyone) return "🚫 This message was deleted";
    if (this.content) {
        try {
            return decrypt_text(this.content);
        } catch (err) {
            return this.content;
        }
    }
    return "";
});

// ==========================================
// 5. CALENDAR & TASKS
// ==========================================
const EventSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    event_type: { type: String, enum: ['HEARING', 'OFFICE_OUT', 'OTHERS', 'MEETING', 'DEADLINE'], required: true, maxlength: 20 },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    location: { type: String, default: '', maxlength: 255 },
    is_important: { type: Boolean, default: false },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    related_case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, options);

// Python post-save logic for syncing next_hearing
EventSchema.post('save', async function (doc, next) {
    if (doc.event_type === 'HEARING' && doc.related_case) {
        const CaseModel = mongoose.model('Case');
        // Extracting just the date portion as per Python .date()
        await CaseModel.findByIdAndUpdate(doc.related_case, { next_hearing: doc.start_time });
    }
    next();
});

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 200 },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    related_case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
    priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM', maxlength: 10 },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO', maxlength: 20 },
    due_date: { type: Date, required: true }
}, options);

// ==========================================
// 6. LEAVE REGISTRY
// ==========================================
const LeaveSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leave_type: { type: String, enum: ['CASUAL', 'SICK', 'EARNED', 'LOP'], required: true, maxlength: 10 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'IGNORED'], default: 'PENDING', maxlength: 10 },
    admin_response: { type: String, default: null },
    is_edited_by_employee: { type: Boolean, default: false }
}, options);

LeaveSchema.virtual('days_count').get(function () {
    const diffTime = Math.abs(this.end_date - this.start_date);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

// ==========================================
// 7. WORK & PERFORMANCE
// ==========================================
const WorkDiarySchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    activity_type: { type: String, enum: ['HEARING', 'DRAFTING', 'RESEARCH', 'CLIENT', 'CLERICAL'], default: 'DRAFTING', maxlength: 20 },
    hours_worked: { type: Number, required: true },
    summary: { type: String, required: true },
    related_case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
    points: { type: Number, default: 0 },
    logged_at: { type: Date, default: Date.now }
}, options);

// Matches Python save() calculation for points exactly
WorkDiarySchema.pre('save', function (next) {
    const multipliers = { 'HEARING': 50, 'DRAFTING': 20, 'RESEARCH': 10, 'CLIENT': 15, 'CLERICAL': 5 };
    if (this.activity_type === 'HEARING') {
        this.points = 50;
    } else {
        const rate = multipliers[this.activity_type] || 5;
        this.points = parseInt((parseFloat(this.hours_worked) * rate).toString(), 10);
    }
    next();
});

// ==========================================
// 8. EMPLOYEE PROFILE
// ==========================================
const UserProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    profile_pic: { type: String, default: 'profile_pics/default.png' },
    designation: { type: String, default: 'Associate Advocate', maxlength: 100 },
    phone: { type: String, default: '', maxlength: 15 },
    employee_code: { type: String, default: null, maxlength: 10 },
    category: { type: String, enum: ['PARTNER', 'ASSOCIATE', 'INTERN'], default: 'ASSOCIATE', maxlength: 20 },
    is_active_employee: { type: Boolean, default: true },
    joined_at: { type: Date, default: Date.now },
    resigned_at: { type: Date, default: null }
}, options);

UserProfileSchema.virtual('avatar_url').get(function () {
    return this.profile_pic ? `/static/${this.profile_pic}` : "/static/img/default-avatar.png";
});

// ==========================================
// 9. INTERNAL AFFAIRS (GRIEVANCE)
// ==========================================
const GrievanceSchema = new mongoose.Schema({
    category: { type: String, enum: ['SUBMIT', 'PEER', 'MONTHLY'], required: true, maxlength: 20 },
    subject: { type: String, default: null, maxlength: 200 },
    description: { type: String, required: true },
    submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    target_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    is_by_senior: { type: Boolean, default: false },
    experience_office: { type: String, default: null },
    experience_colleagues: { type: String, default: null },
    work_experience: { type: String, default: null },
    issues: { type: String, default: null },
    suggestions: { type: String, default: null },
    rating_professionalism: { type: Number, default: 5 },
    rating_collaboration: { type: Number, default: 5 },
    rating_friendliness: { type: Number, default: 5 },
    submitted_at: { type: Date, default: Date.now }
}, options);

GrievanceSchema.virtual('average_rating').get(function () {
    return Number(((this.rating_professionalism + this.rating_collaboration + this.rating_friendliness) / 3).toFixed(1));
});

// ==========================================
// EXPORT ALL MODELS
// ==========================================
module.exports = {
    User: mongoose.model('User', UserSchema), // Added User
    Client: mongoose.model('Client', ClientSchema),
    ClientVisit: mongoose.model('ClientVisit', ClientVisitSchema),
    Case: mongoose.model('Case', CaseSchema),
    Expense: mongoose.model('Expense', ExpenseSchema),
    SecureFile: mongoose.model('SecureFile', SecureFileSchema),
    DocumentVersion: mongoose.model('DocumentVersion', DocumentVersionSchema),
    ChatMessage: mongoose.model('ChatMessage', ChatMessageSchema),
    Event: mongoose.model('Event', EventSchema),
    Task: mongoose.model('Task', TaskSchema),
    Leave: mongoose.model('Leave', LeaveSchema),
    WorkDiary: mongoose.model('WorkDiary', WorkDiarySchema),
    UserProfile: mongoose.model('UserProfile', UserProfileSchema),
    Grievance: mongoose.model('Grievance', GrievanceSchema)
};