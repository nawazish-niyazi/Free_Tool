const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'successful', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Referral', ReferralSchema);
