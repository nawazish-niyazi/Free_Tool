const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Protect admin routes - verifies admin JWT
 */
exports.adminProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access the admin panel' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = await Admin.findById(decoded.id);

        if (!req.admin) {
            return res.status(401).json({ success: false, message: 'Admin account not found' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Session expired or invalid token' });
    }
};

/**
 * Role-based access control
 * @param  {...string} roles - Permitted roles (superadmin, admin, moderator)
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.admin.role}' is not authorized to perform this action`
            });
        }
        next();
    };
};
