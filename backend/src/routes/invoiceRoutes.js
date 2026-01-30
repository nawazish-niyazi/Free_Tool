const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload, deleteFile } = require('../middleware/fileManager');
const invoiceService = require('../services/invoiceService');
const { protect } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const User = require('../models/User');

// GET /api/invoice/business-profile
router.get('/business-profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ success: true, businessProfile: user.businessProfile || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/invoice/business-profile
router.post('/business-profile', protect, async (req, res) => {
    try {
        const { name, address, email, phone, logoData } = req.body;
        const user = await User.findById(req.user.id);

        user.businessProfile = {
            name,
            address,
            email,
            phone,
            logoData
        };

        await user.save();
        res.json({ success: true, message: 'Business profile saved successfully', businessProfile: user.businessProfile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/invoice/generate
router.post('/generate', protect, upload.single('logo'), async (req, res) => {
    console.log('--- INVOICE GENERATION START ---');
    try {
        let invoiceData;

        // Data might come as stringified JSON if mixed with file upload
        if (req.body.data) {
            console.log('Invoice data received as stringified JSON');
            try {
                invoiceData = JSON.parse(req.body.data);
            } catch (parseErr) {
                console.error('JSON Parse Error:', parseErr);
                return res.status(400).json({ success: false, message: 'Invalid invoice data format' });
            }
        } else {
            console.log('Invoice data received as JSON body');
            invoiceData = req.body;
        }

        if (!invoiceData || Object.keys(invoiceData).length === 0) {
            console.error('Error: Empty invoice data');
            return res.status(400).json({ success: false, message: 'Invoice data is missing' });
        }

        console.log(`Generating invoice ${invoiceData.invoiceNumber || 'Unknown'} for user ${req.user?._id || 'Guest'}`);

        // Handle uploaded logo - Convert to Base64 for reliable PDF rendering
        if (req.file) {
            console.log('Processing uploaded logo file:', req.file.path);
            const logoBuffer = fs.readFileSync(req.file.path);
            const logoBase64 = logoBuffer.toString('base64');
            const logoMime = req.file.mimetype;
            invoiceData.business = invoiceData.business || {};
            invoiceData.business.logo = `data:${logoMime};base64,${logoBase64}`;
        } else if (invoiceData.business?.logo) {
            console.log('Using existing logo from data');
        }

        const outputDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(outputDir)) {
            console.log('Creating temp directory:', outputDir);
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log('Calling invoiceService.generateInvoicePdf...');
        const result = await invoiceService.generateInvoicePdf(invoiceData, outputDir);
        console.log('PDF generated at:', result.outputPath);

        // SAVE TO DATABASE (Optional - don't let it block)
        if (req.user) {
            try {
                const data = result.invoiceData;
                console.log('Saving to database...');
                const newInvoice = new Invoice({
                    invoiceID: data.invoiceID,
                    invoiceNumber: data.invoiceNumber,
                    user: req.user.id,
                    issueDate: data.issueDate,
                    dueDate: data.dueDate,
                    currency: data.currency,
                    business: {
                        name: data.business.name,
                        address: data.business.address,
                        email: data.business.email,
                        phone: data.business.phone,
                        logoPath: req.file ? req.file.path : null,
                        logoData: invoiceData.business?.logo || null
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
                    paymentMode: data.paymentMode,
                    pdfPath: result.outputPath
                });

                await newInvoice.save();
                console.log('Invoice database record created.');
            } catch (dbErr) {
                console.error('Database record creation failed (Request will still continue):', dbErr.message);
            }
        }

        console.log('Sending file for download...');
        res.download(result.outputPath, result.filename, (err) => {
            if (err) {
                console.error('File download error:', err);
            }

            // Cleanup
            if (req.file) deleteFile(req.file.path);
            setTimeout(() => {
                if (fs.existsSync(result.outputPath)) {
                    deleteFile(result.outputPath);
                    console.log('Cleaned up generated PDF:', result.outputPath);
                }
            }, 1000 * 60 * 5);
        });

    } catch (error) {
        console.error('CRITICAL ROUTE ERROR:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during invoice generation'
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
