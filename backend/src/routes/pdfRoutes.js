/**
 * PDF Routes
 * This file defines the API endpoints for all PDF-related tools.
 * It connects the web requests from the frontend to the logic in pdfService.js.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { upload, deleteFile } = require('../middleware/fileManager');
const pdfService = require('../services/pdfService');
const { protect } = require('../middleware/auth');

/**
 * API: Download Processed File
 * This route is dedicated for downloading and is PROTECTED.
 */
router.get('/download/:filename', protect, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../temp', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            // Optional: delete after download or let the server cleanup handle it
        });
    } else {
        res.status(404).json({ success: false, message: 'File not found or expired' });
    }
});

/**
 * API: Convert File TO PDF
 * Supports: Word, Excel, PPT, JPG, PNG
 */
router.post('/convert-to-pdf', upload.single('file'), async (req, res) => {
    // Check if a file was actually uploaded
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const inputPath = req.file.path; // Where the uploaded file is stored
    const outputDir = path.dirname(inputPath);

    try {
        // Call the service to do the conversion
        const outputPath = await pdfService.convertToPdf(inputPath, outputDir);
        const filename = path.basename(outputPath);

        // CLEANUP input immediately
        deleteFile(inputPath);

        // Return the filename so the frontend can request the download later
        res.json({
            success: true,
            message: 'File converted successfully',
            filename: filename
        });

        // Auto-cleanup output after 10 minutes if not downloaded
        setTimeout(() => deleteFile(outputPath), 1000 * 60 * 10);

    } catch (error) {
        deleteFile(inputPath);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * API: Compress PDF (Reduce File Size)
 */
router.post('/compress', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const level = req.body.level || 'ebook';

    try {
        const outputPath = await pdfService.compressPdf(inputPath, outputDir, level);
        const filename = path.basename(outputPath);

        deleteFile(inputPath);

        res.json({
            success: true,
            message: 'File compressed successfully',
            filename: filename
        });

        setTimeout(() => deleteFile(outputPath), 1000 * 60 * 10);
    } catch (error) {
        deleteFile(inputPath);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * API: Convert FROM PDF to Other Formats
 */
router.post('/convert-from-pdf', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const targetFormat = req.body.format || 'docx';

    try {
        req.setTimeout(300000);
        const outputPath = await pdfService.convertFromPdf(inputPath, outputDir, targetFormat);
        const filename = path.basename(outputPath);

        deleteFile(inputPath);

        res.json({
            success: true,
            message: 'File converted successfully',
            filename: filename
        });

        setTimeout(() => deleteFile(outputPath), 1000 * 60 * 10);
    } catch (error) {
        deleteFile(inputPath);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * API: Protect PDF (Add Password)
 */
router.post('/protect', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const password = req.body.password;

    if (!password) {
        deleteFile(inputPath);
        return res.status(400).json({ success: false, message: 'Password is required' });
    }

    try {
        const outputPath = await pdfService.protectPdf(inputPath, outputDir, password);
        const filename = path.basename(outputPath);

        deleteFile(inputPath);

        res.json({
            success: true,
            message: 'File protected successfully',
            filename: filename
        });

        setTimeout(() => deleteFile(outputPath), 1000 * 60 * 10);
    } catch (error) {
        deleteFile(inputPath);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * API: Unlock PDF (Remove Password)
 */
router.post('/unlock', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const password = req.body.password;

    if (!password) {
        deleteFile(inputPath);
        return res.status(400).json({ success: false, message: 'Password is required' });
    }

    try {
        const outputPath = await pdfService.unlockPdf(inputPath, outputDir, password);
        const filename = path.basename(outputPath);

        deleteFile(inputPath);

        res.json({
            success: true,
            message: 'File unlocked successfully',
            filename: filename
        });

        setTimeout(() => deleteFile(outputPath), 1000 * 60 * 10);
    } catch (error) {
        deleteFile(inputPath);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * API: Add Watermark (Text or Image)
 */
router.post('/watermark', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'watermarkImage', maxCount: 1 }]), async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    const inputPath = req.files.file[0].path;
    const outputDir = path.dirname(inputPath);

    try {
        const watermarkConfig = {
            type: req.body.type || 'text',
            text: req.body.text || '',
            opacity: parseFloat(req.body.opacity) || 0.5,
            rotation: parseInt(req.body.rotation) || 0,
            fontSize: parseInt(req.body.fontSize) || 48,
            position: req.body.position || 'center',
            pageNumbers: req.body.pageNumbers === 'all' ? 'all' : JSON.parse(req.body.pageNumbers || '[]'),
            scale: parseFloat(req.body.scale) || 1.0
        };

        if (req.body.color) {
            try {
                watermarkConfig.color = JSON.parse(req.body.color);
            } catch (e) {
                watermarkConfig.color = { r: 0.5, g: 0.5, b: 0.5 };
            }
        }

        if (watermarkConfig.type === 'image' && req.files.watermarkImage) {
            watermarkConfig.imagePath = req.files.watermarkImage[0].path;
        }

        const outputPath = await pdfService.watermarkPdf(inputPath, outputDir, watermarkConfig);
        const filename = path.basename(outputPath);

        deleteFile(inputPath);
        if (watermarkConfig.imagePath) deleteFile(watermarkConfig.imagePath);

        res.json({
            success: true,
            message: 'Watermark added successfully',
            filename: filename
        });

        setTimeout(() => deleteFile(outputPath), 1000 * 60 * 10);
    } catch (error) {
        deleteFile(inputPath);
        if (req.files.watermarkImage) deleteFile(req.files.watermarkImage[0].path);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * API: Remove Watermark (Cleaning)
 */
router.post('/remove-watermark', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);

    try {
        const outputPath = await pdfService.removeWatermark(inputPath, outputDir);
        const filename = path.basename(outputPath);

        deleteFile(inputPath);

        res.json({
            success: true,
            message: 'Watermark removed successfully',
            filename: filename
        });

        setTimeout(() => deleteFile(outputPath), 1000 * 60 * 10);
    } catch (error) {
        deleteFile(inputPath);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;


