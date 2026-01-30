const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const Referral = require('../models/Referral');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

// --- Coupon Routes ---

// @route   GET api/rewards/coupons
// @desc    Get all active coupons
// @access  Public (or semi-public)
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find({ active: true }).sort({ createdAt: -1 });
        res.json({ success: true, count: coupons.length, data: coupons });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Admin Coupon routes moved to adminRoutes.js

// --- Referral Routes ---

// @route   POST api/rewards/referrals
// @desc    Submit a new referral
// @access  Private
router.post('/referrals', protect, async (req, res) => {
    try {
        const { name, service, number, area } = req.body;

        if (!name || !service || !number || !area) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const newReferral = await Referral.create({
            name,
            service,
            number,
            area,
            referrer: req.user._id
        });

        res.status(201).json({ success: true, data: newReferral });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET api/rewards/referrals
// @desc    Get all referrals (for admin)
// @access  Admin - MOVED TO adminRoutes.js
/*
router.get('/referrals', adminProtect, async (req, res) => {
    ...
});
*/

module.exports = router;
