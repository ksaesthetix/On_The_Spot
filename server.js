require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "https://ideal-adventure-gpx467pq6v6f94p6-5501.app.github.dev",
            "https://ksaesthetix.github.io"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(bodyParser.json());

const allowedOrigins = [
  'https://ksaesthetix.github.io',
  'https://ideal-adventure-gpx467pq6v6f94p6-5501.app.github.dev'
];

app.use(cors({
    origin: [
        "https://ideal-adventure-gpx467pq6v6f94p6-5501.app.github.dev", // your Codespace origin
        "https://ksaesthetix.github.io" // your GitHub Pages origin (if needed)
    ],
    credentials: true
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
    trialEndsAt: { type: Date },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    itinerary: [{
        name: String,
        time: String, // or Date if you want
        vendor: String // or vendorId if you want to reference
    }]
});
const User = mongoose.model('User', userSchema);

// Comment and Post Schema
const commentSchema = new mongoose.Schema({
    user: String, // or userId/email
    text: String,
    time: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
    user: { type: String, required: true },
    content: { type: String, required: true },
    time: { type: Date, default: Date.now },
    mediaUrl: { type: String },
    likes: { type: [String], default: [] }, // array of user emails or IDs
    comments: { type: [commentSchema], default: [] }
});

const Post = mongoose.model('Post', postSchema);

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
    user: String,         // sender's name or ID
    message: String,      // message text
    time: { type: Date, default: Date.now }
});
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

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
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log("Login attempt:", email, password);
    if (!user) {
        console.log("User not found");
        return res.json({ success: false, message: "User not found" });
    }
    const match = await bcrypt.compare(password, user.password);
    console.log("Password match:", match);
    if (!match) {
        console.log("Incorrect password");
        return res.json({ success: false, message: "Incorrect password" });
    }

    // Generate JWT (replace with your JWT logic)
    const token = jwt.sign(
        { id: user._id, email: user.email, name: user.name, type: user.type },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
    );

    res.json({
        success: true,
        token,
        user: {
            name: user.name,
            email: user.email,
            type: user.type,
            _id: user._id
        }
    });
});

// Make profile endpoint public
app.get('/api/profile', authenticateToken, async (req, res) => {
    const user = await User.findById(req.user.id)
        .select('-password')
        .populate('connections', 'name email type');
    res.json(user);
});

// Make users endpoint public
app.get('/api/users', authenticateToken, async (req, res) => {
    const users = await User.find().populate('connections', 'name email type');
    res.json(users);
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

// New endpoint to get chat messages
app.get('/api/chat', async (req, res) => {
    try {
        const messages = await ChatMessage.find().sort({ time: 1 }); // oldest first
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Connect to another user
app.post('/api/connect', async (req, res) => {
    const { userId, targetId } = req.body;
    if (!userId || !targetId) return res.status(400).send('Missing userId or targetId');
    await User.findByIdAndUpdate(userId, { $addToSet: { connections: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { connections: userId } });
    res.sendStatus(200);
});

// Disconnect from another user
app.post('/api/disconnect', async (req, res) => {
    const { userId, targetId } = req.body;
    if (!userId || !targetId) return res.status(400).send('Missing userId or targetId');
    await User.findByIdAndUpdate(userId, { $pull: { connections: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { connections: userId } });
    res.sendStatus(200);
});

// Get a user's connections
app.get('/api/connections/:userId', async (req, res) => {
    const user = await User.findById(req.params.userId).populate('connections', 'name email type');
    res.json(user.connections);
});

// Add to itinerary endpoint
app.post('/api/itinerary', authenticateToken, async (req, res) => {
    const { name, time, vendor } = req.body;
    const userId = req.user.id;
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { itinerary: { name, time, vendor } } },
            { new: true }
        );
        res.json({ success: true, itinerary: user.itinerary });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not add to itinerary." });
    }
});

// New endpoint to get itinerary
app.get('/api/itinerary', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('itinerary');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.itinerary || []);
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});


app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const index = post.likes.indexOf(userEmail);
        if (index === -1) {
            post.likes.push(userEmail);
        } else {
            post.likes.splice(index, 1);
        }
        await post.save();
        res.json({ success: true, likes: post.likes.length, liked: index === -1 });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// New endpoint to comment on a post
app.post('/api/posts/:id/comment', authenticateToken, async (req, res) => {
    const userEmail = req.user.email;
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.comments.push({ user: userName, text });
    await post.save();
    res.json({ success: true, comments: post.comments });
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('chat message', async (data) => {
        // Broadcast to all users (including sender)
        io.emit('chat message', data);

        // Save to MongoDB
        try {
            const chatMsg = new ChatMessage({
                user: data.user,
                message: data.message,
                time: new Date()
            });
            await chatMsg.save();
        } catch (err) {
            console.error('Failed to save chat message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
