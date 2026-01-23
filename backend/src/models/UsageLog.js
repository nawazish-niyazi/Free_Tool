const mongoose = require('mongoose');

const UsageLogSchema = new mongoose.Schema({
    event: {
        type: String,
        required: true,
        enum: [
            'PAGE_VIEW',
            'PDF_COMPRESS', 'PDF_CONVERT', 'PDF_PROTECT', 'PDF_UNLOCK', 'PDF_WATERMARK', 'PDF_SIGN',
            'IMAGE_RESIZE', 'IMAGE_COMPRESS', 'IMAGE_CONVERT', 'IMAGE_BG_RETOUCH',
            'QR_GENERATE', 'QR_DOWNLOAD',
            'INVOICE_GENERATE',
            'LOCAL_HELP_SEARCH', 'LOCAL_HELP_CALL'
        ]
    },
    metadata: {
        type: Object,
        default: {}
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for faster analytics queries
UsageLogSchema.index({ event: 1, timestamp: -1 });

module.exports = mongoose.model('UsageLog', UsageLogSchema);
