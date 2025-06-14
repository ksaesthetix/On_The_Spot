require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

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
    type: { type: String, default: 'Attendee' }
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

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});