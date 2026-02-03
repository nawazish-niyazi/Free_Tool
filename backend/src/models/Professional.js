const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ProfessionalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    locations: {
        type: [String],
        required: true,
        default: []
    },
    category: {
        type: String,
        default: ''
    },
    services: {
        type: [String], // Replaces category/service with a list of skills/services
        required: true,
        default: []
    },
    pendingServices: {
        type: [String],
        default: []
    },
    experience: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verified: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    priceRange: {
        minPrice: {
            type: Number,
            default: 0
        },
        maxPrice: {
            type: Number,
            default: 0
        }
    },
    reviews: [ReviewSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Professional', ProfessionalSchema);
