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
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "https://ideal-adventure-gpx467pq6v6f94p6-5501.app.github.dev",
            "https://ksaesthetix.github.io",
            'http://www.onthespot.marketing', // <-- add this line
            'https://www.onthespot.marketing' 
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;

// --- Place this BEFORE any express.json() or bodyParser.json() ---
app.use('/webhook', express.raw({type: 'application/json'}));

// Stripe webhook endpoint
app.post('/webhook', async (req, res) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook signature error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.log("Received Stripe event:", event.type);
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        // Use customer_details.email as customer_email is null in new API
        const customerEmail = session.customer_email || (session.customer_details && session.customer_details.email);
        console.log("Session completed for email:", customerEmail);
        if (customerEmail) {
            const result = await User.findOneAndUpdate(
                { email: customerEmail },
                { $set: { hasPaid: true }, $unset: { trialEndsAt: "" } }
            );
            console.log("User update result:", result);
        } else {
            console.log("No customer_email in session!");
        }
    }
    res.json({received: true});
});

// JSON and body parser middleware
app.use(express.json({ limit: '5mb' }));
app.use(bodyParser.json({ limit: '5mb' }));

const allowedOrigins = [
  'https://ksaesthetix.github.io',
  'https://ideal-adventure-gpx467pq6v6f94p6-5501.app.github.dev',
  'http://www.onthespot.marketing', // <-- add this line
  'https://www.onthespot.marketing' 
];

app.use(cors({
  origin: "https://www.onthespot.marketing",
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
        time: String,
        vendor: String,
        description: String,
        event_type: String,
        location: String,
        url_link: String
    }],
    phone: String,
    website: String,
    socials: [String],
    avatarUrl: String
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

// --- User Event Schema ---
const userEventSchema = new mongoose.Schema({
    name: String,
    host: String,
    date_time: String,
    location: String,
    lat: Number,
    lng: Number,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});
const UserEvent = mongoose.model('UserEvent', userEventSchema);

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
        const user = new User({ name, email, password: hashed, trialEndsAt }); // <-- add trialEndsAt here
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
            _id: user._id,
            trialEndsAt: user.trialEndsAt, 
            hasPaid: user.hasPaid          
        }
    });
});

// Get current user's profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        // --- TEST ONLY: Force trial expired and unpaid ---
        // user.hasPaid = false;
        // user.trialEndsAt = new Date(Date.now() - 1000 * 60 * 60 * 24); // 24 hours ago
        // --- END TEST ---

        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// Make users endpoint public
app.get('/api/users', async (req, res) => {
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
    const event = req.body; // Accept all fields sent from frontend
    const userId = req.user.id;
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { itinerary: event } },
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
    const userName = req.user.name;
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.comments.push({ user: userName, text });
    await post.save();
    res.json({ success: true, comments: post.comments });
});

// Update profile endpoint
app.post('/api/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { phone, website, email, socials, avatarUrl } = req.body;
    try {
        const update = { phone, website, email, socials, avatarUrl };
        Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: update },
            { new: true }
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Could not update profile." });
    }
});

// Example: create a session and redirect to Stripe Checkout
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: 'On The Spot Access',
                        },
                        unit_amount: 990, // $9.90 (amount in cents)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'https://on-the-spot.onrender.com/paywall-success.html',
            cancel_url: 'https://on-the-spot.onrender.com/paywall.html',
        });
        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// --- Add User Event Endpoint ---
app.post('/api/user-events', authenticateToken, async (req, res) => {
    const { name, host, date_time, location, lat, lng } = req.body;
    if (!name || !host || !date_time || !location || lat == null || lng == null) {
        return res.status(400).json({ success: false, message: "All fields required." });
    }
    const event = new UserEvent({
        name, host, date_time, location, lat, lng, createdBy: req.user.id
    });
    await event.save();
    res.json({ success: true, event });
});

// --- Get All User Events Endpoint ---
app.get('/api/user-events', async (req, res) => {
    const events = await UserEvent.find().sort({ createdAt: -1 });
    res.json(events);
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
