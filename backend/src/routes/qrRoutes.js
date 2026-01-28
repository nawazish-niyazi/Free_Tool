const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const auth = require('../middleware/auth');
const MultiLinkQR = require('../models/MultiLinkQR');
const crypto = require('crypto');

// @route   POST api/qr/generate
// @desc    Generate a QR code (Public for preview)
// @access  Public
router.post('/generate', async (req, res) => {
    const { url, options } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
    }

    try {
        // Generate QR code as a data URL (base64)
        const qrDataUrl = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: options?.width || 300,
            color: {
                dark: options?.dark || '#000000',
                light: options?.light || '#ffffff'
            }
        });

        res.json({ success: true, qrDataUrl });
    } catch (err) {
        console.error('QR Generation error:', err);
        res.status(500).json({ success: false, message: 'Server error generating QR code' });
    }
});

// @route   POST api/qr/download
// @desc    Download a QR code (Protected)
// @access  Private
router.post('/download', auth.protect, async (req, res) => {
    const { url, format, options } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
    }

    try {
        if (format === 'svg') {
            const svg = await QRCode.toString(url, {
                type: 'svg',
                errorCorrectionLevel: 'H',
                margin: 1,
                width: options?.width || 300
            });
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Content-Disposition', 'attachment; filename=qrcode.svg');
            return res.send(svg);
        } else {
            // Default to PNG
            const buffer = await QRCode.toBuffer(url, {
                type: 'png',
                errorCorrectionLevel: 'H',
                margin: 1,
                width: options?.width || 300
            });
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', 'attachment; filename=qrcode.png');
            return res.send(buffer);
        }
    } catch (err) {
        console.error('QR Download error:', err);
        res.status(500).json({ success: false, message: 'Server error generating QR code for download' });
    }
});

// @route   POST api/qr/multi
// @desc    Create a multi-link QR record
// @access  Public (Optionally private for download)
router.post('/multi', auth.optionalProtect, async (req, res) => {
    const { title, links, logo, logoShape } = req.body;

    if (!links || !Array.isArray(links) || links.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one link is required' });
    }

    try {
        const shortId = crypto.randomBytes(4).toString('hex'); // 8 characters e.g. 'a1b2c3d4'

        const multiLink = new MultiLinkQR({
            shortId,
            title,
            links,
            logo,
            logoShape: logoShape || 'rect',
            creator: req.user?._id || null
        });

        await multiLink.save();

        res.json({
            success: true,
            shortId,
            url: `${req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173'}/q/${shortId}`
        });

    } catch (err) {
        console.error('Multi-Link QR creation error:', err);
        res.status(500).json({ success: false, message: 'Server error creating multi-link QR' });
    }
});

// @route   GET api/qr/multi/:shortId
// @desc    Get multi-link QR details by short ID
// @access  Public
router.get('/multi/:shortId', async (req, res) => {
    try {
        const multiLink = await MultiLinkQR.findOne({ shortId: req.params.shortId });

        if (!multiLink) {
            return res.status(404).json({ success: false, message: 'Link collection not found' });
        }

        if (multiLink.status === 'disabled') {
            return res.status(403).json({ success: false, message: 'This link collection has been disabled' });
        }

        // Increment scan count
        multiLink.scanCount += 1;
        await multiLink.save();

        res.json({
            success: true,
            data: {
                title: multiLink.title,
                links: multiLink.links,
                scanCount: multiLink.scanCount,
                logo: multiLink.logo,
                logoShape: multiLink.logoShape
            }
        });
    } catch (err) {
        console.error('Fetch multi-link QR error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching multi-link QR' });
    }
});

// @route   GET api/qr/my-multi-qrs
// @desc    Get user's multi-link QRs
// @access  Private
router.get('/my-multi-qrs', auth.protect, async (req, res) => {
    try {
        const qrList = await MultiLinkQR.find({ creator: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: qrList });
    } catch (err) {
        console.error('Fetch user multi-link QRs error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching your QR codes' });
    }
});

// @route   DELETE api/qr/multi/:id
// @desc    Delete a multi-link QR record
// @access  Private
router.delete('/multi/:id', auth.protect, async (req, res) => {
    try {
        const multiLink = await MultiLinkQR.findById(req.params.id);

        if (!multiLink) {
            return res.status(404).json({ success: false, message: 'QR record not found' });
        }

        // Check ownership
        if (multiLink.creator?.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this QR' });
        }

        await MultiLinkQR.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'QR record deleted and memory freed' });
    } catch (err) {
        console.error('Delete multi-link QR error:', err);
        res.status(500).json({ success: false, message: 'Server error deleting QR record' });
    }
});

// @route   PUT api/qr/multi/:id
// @desc    Update a multi-link QR record
// @access  Private
router.put('/multi/:id', auth.protect, async (req, res) => {
    const { title, links, logo, logoShape } = req.body;

    try {
        const multiLink = await MultiLinkQR.findById(req.params.id);

        if (!multiLink) {
            return res.status(404).json({ success: false, message: 'QR record not found' });
        }

        // Check ownership
        if (multiLink.creator?.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this QR' });
        }

        multiLink.title = title || multiLink.title;
        multiLink.links = links || multiLink.links;
        multiLink.logo = logo !== undefined ? logo : multiLink.logo;
        multiLink.logoShape = logoShape || multiLink.logoShape;

        await multiLink.save();

        res.json({
            success: true,
            message: 'QR updated successfully',
            url: `${req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173'}/q/${multiLink.shortId}`
        });

    } catch (err) {
        console.error('Update multi-link QR error:', err);
        res.status(500).json({ success: false, message: 'Server error updating QR record' });
    }
});

module.exports = router;
