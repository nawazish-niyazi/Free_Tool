const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/fileManager');
const { processSignature } = require('../services/eSignService');
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Return file details including path (securely reference by filename usually, but for local mvp path is ok or just ID)
    // We'll return the filename so frontend can request it if needed, or just keep it in state.
    res.json({
        success: true,
        file: {
            filename: req.file.filename,
            path: req.file.path,
            originalName: req.file.originalname,
            size: req.file.size
        }
    });
});

// Sign endpoint
router.post('/sign', async (req, res) => {
    try {
        const { filename, signatures } = req.body;

        if (!filename || !signatures || !Array.isArray(signatures)) {
            return res.status(400).json({ success: false, message: 'Invalid request data' });
        }

        const tempDir = path.join(__dirname, '../../temp');
        const filePath = path.join(tempDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found or expired' });
        }

        const result = await processSignature(filePath, signatures, tempDir);

        res.json({
            success: true,
            downloadUrl: `/api/esign/download/${result.filename}`
        });

    } catch (error) {
        console.error('Signing error:', error);
        res.status(500).json({ success: false, message: 'Failed to sign document' });
    }
});

// Download endpoint
router.get('/download/:filename', protect, (req, res) => {
    const filename = req.params.filename;
    const tempDir = path.join(__dirname, '../../temp');
    const filePath = path.join(tempDir, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Download error:', err);
                // Don't send another response if headers sent
            }
        });
    } else {
        res.status(404).json({ success: false, message: 'File not found' });
    }
});

// Serve the uploaded file for preview (if needed by frontend directly, though frontend can usually preview local file blob)
router.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const tempDir = path.join(__dirname, '../../temp');
    const filePath = path.join(tempDir, filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

module.exports = router;
