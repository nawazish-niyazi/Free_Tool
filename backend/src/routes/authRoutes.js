const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d'
    });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        // Create user - using 'undefined' for empty email strings so 'sparse' works
        const user = await User.create({
            name,
            phone,
            email: email === '' ? undefined : email,
            password
        });

        if (user) {
            res.status(201).json({
                success: true,
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    phone: user.phone,
                    email: user.email
                }
            });
        }
    } catch (error) {
        // Handle MongoDB Duplicate Key Error (Code 11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `User with this ${field} already exists`
            });
        }

        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Check for user
        const user = await User.findOne({ phone }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
