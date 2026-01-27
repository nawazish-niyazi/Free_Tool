const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
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
    location: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    experience: {
        type: String,
        required: true
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
    reviews: [ReviewSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Professional', ProfessionalSchema);
