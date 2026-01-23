const mongoose = require('mongoose');

const MultiLinkQRSchema = new mongoose.Schema({
    shortId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        trim: true
    },
    links: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        clickCount: {
            type: Number,
            default: 0
        }
    }],
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
        default: 'active'
    },
    scanCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MultiLinkQR', MultiLinkQRSchema);
