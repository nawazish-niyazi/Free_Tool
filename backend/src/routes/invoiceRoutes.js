const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload, deleteFile } = require('../middleware/fileManager');
const invoiceService = require('../services/invoiceService');
const { protect } = require('../middleware/auth');
const Invoice = require('../models/Invoice');

// POST /api/invoice/generate
router.post('/generate', protect, upload.single('logo'), async (req, res) => {
    try {
        let invoiceData;

        // Data might come as stringified JSON if mixed with file upload
        if (req.body.data) {
            invoiceData = JSON.parse(req.body.data);
        } else {
            invoiceData = req.body;
        }

        // Handle uploaded logo - Convert to Base64 for reliable PDF rendering
        if (req.file) {
            const logoBuffer = fs.readFileSync(req.file.path);
            const logoBase64 = logoBuffer.toString('base64');
            const logoMime = req.file.mimetype;
            invoiceData.business = invoiceData.business || {};
            invoiceData.business.logo = `data:${logoMime};base64,${logoBase64}`;
        }

        const outputDir = path.join(__dirname, '../../temp');
        const result = await invoiceService.generateInvoicePdf(invoiceData, outputDir);

        // SAVE TO DATABASE
        try {
            const data = result.invoiceData;
            console.log('Preparing to save invoice:', data.invoiceNumber);

            const newInvoice = new Invoice({
                invoiceID: data.invoiceID,
                invoiceNumber: data.invoiceNumber,
                user: req.user.id, // Tie to user
                issueDate: data.issueDate,
                dueDate: data.dueDate,
                currency: data.currency,
                business: {
                    name: data.business.name,
                    address: data.business.address,
                    email: data.business.email,
                    phone: data.business.phone,
                    logoPath: req.file ? req.file.path : null,
                    logoData: req.file ? invoiceData.business.logo : null
                },
                client: data.client,
                items: data.items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.total
                })),
                totals: data.totals,
                notes: data.notes,
                pdfPath: data.pdfPath
            });

            const saved = await newInvoice.save();
            console.log('SUCCESS: Invoice saved to DB for user:', req.user.phone);
        } catch (dbErr) {
            console.error('CRITICAL DATABASE ERROR:', dbErr);
        }

        res.download(result.outputPath, result.filename, (err) => {
            if (err) console.error('Error sending invoice:', err);

            // Cleanup: delete logo if exists
            if (req.file) deleteFile(req.file.path);

            // Cleanup: delete generated PDF after 5 minutes
            setTimeout(() => deleteFile(result.outputPath), 1000 * 60 * 5);
        });

    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/invoice/recent
router.get('/recent', protect, async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
        console.log(`Fetched ${invoices.length} recent invoices for user ${req.user.phone}`);
        res.json({ success: true, invoices });
    } catch (error) {
        console.error('Error fetching recent invoices:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/invoice/search
router.get('/search', protect, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            const invoices = await Invoice.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
            return res.json({ success: true, invoices });
        }

        const invoices = await Invoice.find({
            user: req.user.id,
            $or: [
                { invoiceNumber: { $regex: query, $options: 'i' } },
                { 'client.name': { $regex: query, $options: 'i' } },
                { invoiceID: { $regex: query, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.json({ success: true, invoices });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
