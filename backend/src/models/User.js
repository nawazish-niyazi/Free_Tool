const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        unique: true
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,15})+$/,
            'Please add a valid email'
        ],
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    businessProfile: {
        name: String,
        address: String,
        email: String,
        phone: String,
        logoData: String // Store as base64
    },
    profilePicture: {
        type: String // Base64
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    } else {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
