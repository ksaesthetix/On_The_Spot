require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
const allowedOrigins = [
  'https://ksaesthetix.github.io'
  //'https://ideal-adventure-gpx467pq6v6f94p6-5500.app.github.dev'
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

// Protected profile endpoint
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error." });
    }
});

// Get all users (for networking list)
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Create checkout session (Stripe)
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            customer_email: req.user.email,
            success_url: 'https://ksaesthetix.github.io/On_The_Spot/paywall-success.html?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://ksaesthetix.github.io/On_The_Spot/paywall-cancel.html',
            metadata: { userId: req.user.id }
        });
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ message: 'Stripe error.' });
    }
});

// Stripe webhook endpoint
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const email = session.customer_email;
        await User.findOneAndUpdate({ email }, { hasPaid: true });
    }
    res.json({ received: true });
});

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});