const mongoose = require('mongoose');

const LocalHelpCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    services: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('LocalHelpCategory', LocalHelpCategorySchema);
