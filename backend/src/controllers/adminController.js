const Admin = require('../models/Admin');
const User = require('../models/User');
const Professional = require('../models/Professional');
const UsageLog = require('../models/UsageLog');
const Invoice = require('../models/Invoice');
const MultiLinkQR = require('../models/MultiLinkQR');
const Referral = require('../models/Referral');
const jwt = require('jsonwebtoken');

// @desc    Admin Login
// @route   POST api/admin/login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username }).select('+password');

        if (!admin || !(await admin.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                role: admin.role,
                username: admin.username
            }
        });
    } catch (err) {
        console.error('Admin Login Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get dashboard metrics
// @route   GET api/admin/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProfessionals = await Professional.countDocuments();
        const totalInvoices = await Invoice.countDocuments();
        const pendingWorkers = await Professional.countDocuments({ status: 'pending' });
        const pendingReferrals = await Referral.countDocuments({ status: 'pending' });

        // Users created in the last 24 hours
        const last24h = new Date();
        last24h.setHours(last24h.getHours() - 24);
        const newUsers = await User.countDocuments({ createdAt: { $gte: last24h } });

        // Tool usage summary (Last 30 days)
        const dateLimit30 = new Date();
        dateLimit30.setDate(dateLimit30.getDate() - 30);

        // Tool usage summary (Last 3 days - Specific request)
        const dateLimit3 = new Date();
        dateLimit3.setDate(dateLimit3.getDate() - 3);

        const logs30d = await UsageLog.aggregate([
            { $match: { timestamp: { $gte: dateLimit30 } } },
            { $group: { _id: "$event", count: { $sum: 1 } } }
        ]);

        const logs3d = await UsageLog.aggregate([
            { $match: { timestamp: { $gte: dateLimit3 } } },
            { $group: { _id: "$event", count: { $sum: 1 } } }
        ]);

        const recentLogs = await UsageLog.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('userId', 'name phone');

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalProfessionals,
                totalInvoices,
                pendingWorkers,
                pendingReferrals,
                newUsers
            },
            toolUsage: logs30d,
            usageLast3Days: logs3d,
            recentActivity: recentLogs
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete user
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'User removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all professionals
exports.getProfessionals = async (req, res) => {
    try {
        const pros = await Professional.find().sort({ createdAt: -1 });
        res.json({ success: true, count: pros.length, data: pros });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update professional
exports.updateProfessional = async (req, res) => {
    try {
        const pro = await Professional.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: pro });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete professional
exports.deleteProfessional = async (req, res) => {
    try {
        await Professional.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Professional removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get Monthly Tool Usage
exports.getLogs = async (req, res) => {
    try {
        const monthlyStats = await UsageLog.aggregate([
            {
                $project: {
                    month: { $month: "$timestamp" },
                    year: { $year: "$timestamp" },
                    event: 1
                }
            },
            {
                $group: {
                    _id: { month: "$month", year: "$year", event: "$event" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1, "count": -1 } }
        ]);

        const formattedStats = monthlyStats.map(stat => ({
            month: new Date(stat._id.year, stat._id.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
            tool: stat._id.event.replace(/_/g, ' '),
            usage: stat.count
        }));

        res.json({ success: true, data: formattedStats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all invoices
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 }).populate('user', 'name phone email');
        res.json({ success: true, count: invoices.length, data: invoices });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Bulk Create Admin (One-time or by Super Admin)
exports.createAdmin = async (req, res) => {
    try {
        const admin = await Admin.create(req.body);
        res.json({ success: true, data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get all multi-link QRs
exports.getMultiLinks = async (req, res) => {
    try {
        const qrList = await MultiLinkQR.find().sort({ createdAt: -1 });
        res.json({ success: true, count: qrList.length, data: qrList });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update multi-link QR status
exports.updateMultiLink = async (req, res) => {
    try {
        const qr = await MultiLinkQR.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: qr });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete multi-link QR
exports.deleteMultiLink = async (req, res) => {
    try {
        await MultiLinkQR.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'QR Record removed' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get pending worker signups
exports.getPendingWorkers = async (req, res) => {
    try {
        const pendingWorkers = await Professional.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json({ success: true, count: pendingWorkers.length, data: pendingWorkers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Approve or reject worker signup
exports.updateWorkerStatus = async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const worker = await Professional.findByIdAndUpdate(
            req.params.id,
            {
                status,
                verified: status === 'approved' ? true : false
            },
            { new: true }
        );

        if (!worker) {
            return res.status(404).json({ success: false, message: 'Worker not found' });
        }

        res.json({
            success: true,
            message: `Worker ${status} successfully`,
            data: worker
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// @desc    Get professionals with pending skills
exports.getPendingSkills = async (req, res) => {
    try {
        const pros = await Professional.find({ 'pendingServices.0': { $exists: true } });
        res.json({ success: true, count: pros.length, data: pros });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Approve a specific pending skill
exports.approveSkill = async (req, res) => {
    try {
        const { skill } = req.body;
        const professional = await Professional.findById(req.params.id);

        if (!professional) return res.status(404).json({ success: false, message: 'Professional not found' });

        if (professional.pendingServices.includes(skill)) {
            professional.pendingServices = professional.pendingServices.filter(s => s !== skill);
            if (!professional.services.includes(skill)) {
                professional.services.push(skill);
            }
            await professional.save();
            res.json({ success: true, message: 'Skill approved', data: professional });
        } else {
            res.status(400).json({ success: false, message: 'Skill not found in pending list' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Reject a specific pending skill
exports.rejectSkill = async (req, res) => {
    try {
        const { skill } = req.body;
        const professional = await Professional.findById(req.params.id);

        if (!professional) return res.status(404).json({ success: false, message: 'Professional not found' });

        professional.pendingServices = professional.pendingServices.filter(s => s !== skill);
        await professional.save();
        res.json({ success: true, message: 'Skill rejected', data: professional });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
