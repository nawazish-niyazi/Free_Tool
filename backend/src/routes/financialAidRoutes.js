const express = require('express');
const router = express.Router();
const FinancialAid = require('../models/FinancialAid');
const { protect } = require('../middleware/auth');

// @route   GET api/financial-aid
// @desc    Get all approved financial aids
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;
        let query = { isApproved: true };
        if (type) query.type = type;

        const aids = await FinancialAid.find(query).sort({ createdAt: -1 });
        res.json({ success: true, data: aids });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST api/financial-aid/register
// @desc    Register as a financial aid provider
// @access  Private
router.post('/register', protect, async (req, res) => {
    try {
        const { name, type, description, phone, location } = req.body;

        const newAid = await FinancialAid.create({
            name,
            type,
            description,
            phone,
            location,
            user: req.user._id,
            isApproved: false // Requires admin approval
        });

        res.status(201).json({ success: true, data: newAid, message: 'Registration submitted for approval' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
    }
});

module.exports = router;
