const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { upload, deleteFile } = require('../middleware/fileManager');
const { protect } = require('../middleware/auth');

/**
 * API: Remove Background
 * This route proxies the request to the Python AI service.
 */
router.post('/remove-bg', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        const filePath = req.file.path;

        // Prepare form data for Python service
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        // Call Python Service (Port 5001)
        const response = await axios.post('http://localhost:5001/remove-bg', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            responseType: 'arraybuffer'
        });

        // Save processed file to temp
        const fileName = `processed-bg-${Date.now()}.png`;
        const outputPath = path.join(__dirname, '../../temp', fileName);

        fs.writeFileSync(outputPath, response.data);

        // Cleanup original file
        deleteFile(filePath);

        // Success - Return filename for preview/download
        res.json({
            success: true,
            filename: fileName
        });

        // Cleanup processed file after 10 mins
        setTimeout(() => deleteFile(outputPath), 10 * 60 * 1000);

    } catch (error) {
        console.error('BG Removal Error:', error.message);
        if (req.file) deleteFile(req.file.path);
        res.status(500).json({
            success: false,
            message: 'AI Service error. Ensure background service is running.'
        });
    }
});

/**
 * API: General Image Upload
 */
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.json({
        success: true,
        filename: req.file.filename
    });
});

/**
 * API: Download Processed Image (Protected)
 */
router.get('/download/:filename', protect, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../temp', filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) console.error('Download error:', err);
        });
    } else {
        res.status(404).json({ success: false, message: 'File not found or expired' });
    }
});

module.exports = router;
