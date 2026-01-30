const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const createInitialAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Remove any admin with username 'admin' or email 'admin@nair.com' to avoid conflicts
        await Admin.deleteMany({
            $or: [
                { username: 'admin' },
                { email: 'admin@nair.com' }
            ]
        });
        console.log('Cleared existing admin records for update.');

        await Admin.create({
            name: 'admin',
            username: 'admin',
            email: 'admin@nair.com',
            password: 'admin123',
            role: 'superadmin'
        });

        console.log('Initial admin created successfully!');
        console.log('\n--- Credentials ---');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('-------------------\n');

    } catch (err) {
        console.error('Error in admin initialization:', err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
};

createInitialAdmin();
