const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Professional = require('../models/Professional');
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

        // Fetch professional profile if exists
        const professional = await Professional.findOne({ userRef: user._id });

        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                profilePicture: user.profilePicture
            },
            professional: professional ? {
                ...professional.toObject(),
                reviews: undefined
            } : null
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
        let professional = await Professional.findOne({ userRef: req.user._id });

        // Self-healing: If not found by ID, check by phone number and link if found
        if (!professional && user.phone) {
            professional = await Professional.findOne({ number: user.phone });
            if (professional) {
                professional.userRef = user._id;
                await professional.save();
                console.log(`Auto-linked professional profile ${professional._id} to user ${user._id}`);
            }
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                profilePicture: user.profilePicture
            },
            professional: professional ? {
                ...professional.toObject(),
                reviews: undefined // Don't send reviews to the user here
            } : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, email, phone, profilePicture } = req.body;
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = name || user.name;
            user.email = email || user.email;
            user.phone = phone || user.phone;
            if (profilePicture !== undefined) user.profilePicture = profilePicture;

            const updatedUser = await user.save();

            // Check if professional exists and update common fields
            const professional = await Professional.findOne({ userRef: user._id });
            if (professional) {
                if (name) professional.name = name;
                if (phone) professional.number = phone;
                await professional.save();
            }

            res.json({
                success: true,
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    email: updatedUser.email,
                    profilePicture: updatedUser.profilePicture
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password
 * @access  Private
 */
router.put('/reset-password', protect, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (user && (await user.matchPassword(oldPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ success: true, message: 'Password updated successfully' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
