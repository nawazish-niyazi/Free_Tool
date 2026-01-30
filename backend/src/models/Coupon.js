const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Find Coupons & Best Deals'
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String, // URL to image
        required: true
    },
    code: {
        type: String,
        required: true
    },
    keyPoints: [{
        type: String
    }],
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Coupon', CouponSchema);
