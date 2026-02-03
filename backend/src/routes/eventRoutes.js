const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// @route   GET api/events
// @desc    Get all upcoming events
// @access  Public
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 });
        res.json({ success: true, data: events });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
