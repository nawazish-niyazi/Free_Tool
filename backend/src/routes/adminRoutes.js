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
    deleteMultiLink
} = require('../controllers/adminController');
const { adminProtect, authorize } = require('../middleware/adminAuth');

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

// Super Admin only
router.post('/create', adminProtect, authorize('superadmin'), createAdmin);

module.exports = router;
