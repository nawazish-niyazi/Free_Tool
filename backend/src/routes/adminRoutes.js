const express = require('express');
const router = express.Router();
const {
    login,
    getDashboardStats,
    getUsers,
    deleteUser,
    getProfessionals,
    updateProfessional,
    deleteProfessional,
    getLogs,
    createAdmin,
    getInvoices,
    getMultiLinks,
    updateMultiLink,
    deleteMultiLink,
    getPendingWorkers,
    updateWorkerStatus,
    getPendingSkills,
    approveSkill,
    rejectSkill
} = require('../controllers/adminController');
const { adminProtect, authorize } = require('../middleware/adminAuth');
const Coupon = require('../models/Coupon');
const Referral = require('../models/Referral');
const LocalHelpCategory = require('../models/LocalHelpCategory');
const FinancialAid = require('../models/FinancialAid');
const Event = require('../models/Event');

// Local Help Category Management
router.get('/local-help/categories', adminProtect, async (req, res) => {
    try {
        const categories = await LocalHelpCategory.find().sort({ name: 1 });
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.post('/local-help/categories', adminProtect, async (req, res) => {
    try {
        const { name, services } = req.body;
        const category = await LocalHelpCategory.create({ name, services });
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/local-help/categories/:id', adminProtect, async (req, res) => {
    try {
        const { name, services } = req.body;
        const category = await LocalHelpCategory.findByIdAndUpdate(
            req.params.id,
            { name, services },
            { new: true }
        );
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.delete('/local-help/categories/:id', adminProtect, async (req, res) => {
    try {
        await LocalHelpCategory.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Rewards Management (Admin)
router.get('/rewards/coupons', adminProtect, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ success: true, data: coupons });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.post('/rewards/coupons', adminProtect, async (req, res) => {
    try {
        const { title, description, image, code, keyPoints } = req.body;
        const newCoupon = await Coupon.create({
            title, description, image, code, keyPoints,
            createdBy: req.admin._id
        });
        res.status(201).json({ success: true, data: newCoupon });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.delete('/rewards/coupons/:id', adminProtect, async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.get('/rewards/referrals', adminProtect, async (req, res) => {
    try {
        const referrals = await Referral.find().populate('referrer', 'name email phone').sort({ createdAt: -1 });
        res.json({ success: true, data: referrals });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Financial Aid Management (Admin)
router.get('/financial-aid', adminProtect, async (req, res) => {
    try {
        const aids = await FinancialAid.find().sort({ createdAt: -1 });
        res.json({ success: true, data: aids });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.put('/financial-aid/:id/status', adminProtect, async (req, res) => {
    try {
        const { isApproved } = req.body;
        const aid = await FinancialAid.findByIdAndUpdate(req.params.id, { isApproved }, { new: true });
        res.json({ success: true, data: aid });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.delete('/financial-aid/:id', adminProtect, async (req, res) => {
    try {
        await FinancialAid.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Event Management (Admin)
router.get('/events', adminProtect, async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json({ success: true, data: events });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.post('/events', adminProtect, async (req, res) => {
    try {
        const { title, description, image, date, location, organizer, link } = req.body;
        const newEvent = await Event.create({ title, description, image, date, location, organizer, link });
        res.status(201).json({ success: true, data: newEvent });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/events/:id', adminProtect, async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: event });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

router.delete('/events/:id', adminProtect, async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});


// Public Admin routes
router.post('/login', login);

// Protected Admin routes
router.get('/dashboard', adminProtect, getDashboardStats);
router.get('/users', adminProtect, getUsers);
router.delete('/users/:id', adminProtect, authorize('superadmin'), deleteUser);

router.get('/professionals', adminProtect, getProfessionals);
router.put('/professionals/:id', adminProtect, updateProfessional);
router.delete('/professionals/:id', adminProtect, authorize('superadmin', 'admin'), deleteProfessional);

router.get('/invoices', adminProtect, getInvoices);

router.get('/logs', adminProtect, getLogs);

router.get('/multi-qrs', adminProtect, getMultiLinks);
router.put('/multi-qrs/:id', adminProtect, updateMultiLink);
router.delete('/multi-qrs/:id', adminProtect, authorize('superadmin', 'admin'), deleteMultiLink);

// Worker signup management
router.get('/pending-workers', adminProtect, getPendingWorkers);
router.put('/workers/:id/status', adminProtect, updateWorkerStatus);

// Skill Suggestion Management
router.get('/pending-skills', adminProtect, getPendingSkills);
router.put('/professionals/:id/approve-skill', adminProtect, approveSkill);
router.put('/professionals/:id/reject-skill', adminProtect, rejectSkill);

// Super Admin only
router.post('/create', adminProtect, authorize('superadmin'), createAdmin);

module.exports = router;
