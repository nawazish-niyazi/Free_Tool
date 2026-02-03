const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true // URL to image
    },
    date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    organizer: {
        type: String
    },
    link: {
        type: String // Optional external link
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Event', eventSchema);
