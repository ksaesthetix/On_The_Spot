require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
const allowedOrigins = [
  'https://ksaesthetix.github.io',
  'https://ideal-adventure-gpx467pq6v6f94p6-5500.app.github.dev'
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    type: { type: String, default: 'Attendee' },
    hasPaid: { type: Boolean, default: false },
    trialEndsAt: { type: Date }
});
const User = mongoose.model('User', userSchema);

// Post Schema
const postSchema = new mongoose.Schema({
    user: String,
    content: String,
    time: { type: Date, default: Date.now },
    mediaUrl: String,
    mediaType: String
});

const Post = mongoose.model('Post', postSchema);

// JWT middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Sign up endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: "All fields are required." });
        }
        if (password.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters." });
        }
        const existing = await User.findOne({ email });
        if (existing) {
            return res.json({ success: false, message: "Email already registered." });
        }
        const hashed = await bcrypt.hash(password, 10);
        const trialEndsAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
        const user = new User({ name, email, password: hashed });
        await user.save();
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: "Server error." });
    }
});

// Login endpoint (returns JWT)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, message: "Invalid credentials." });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.json({ success: false, message: "Invalid credentials." });

        // Issue JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, name: user.name, type: user.type },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ success: true, token, name: user.name, email: user.email, type: user.type });
    } catch (err) {
        res.json({ success: false, message: "Server error." });
    }
});

// Make profile endpoint public
app.get('/api/profile', async (req, res) => {
    // You may want to return a default/anonymous profile or handle this differently
    res.json({ message: "Public profile endpoint. No authentication required." });
});

// Make users endpoint public
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Set up Multer for uploads (store in /uploads)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Use timestamp + original name for uniqueness
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple in-memory posts array (replace with DB for production)
// let posts = [];

// Post creation endpoint
app.post('/api/posts', upload.single('media'), async (req, res) => {
    const content = req.body.content || '';
    let mediaUrl = '';
    let mediaType = '';
    if (req.file) {
        mediaUrl = '/uploads/' + req.file.filename;
        mediaType = req.file.mimetype.startsWith('image') ? 'image' :
                    req.file.mimetype.startsWith('video') ? 'video' : '';
    }
    const user = req.body.user || 'Guest';
    try {
        const post = new Post({
            user,
            content,
            time: new Date(),
            mediaUrl,
            mediaType
        });
        await post.save();
        res.json({ success: true, post });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to save post." });
    }
});

// Endpoint to get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ time: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});