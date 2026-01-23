const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB...');

        const existing = await Admin.findOne({ username: 'superadmin' });
        if (existing) {
            console.log('Super Admin already exists');
            process.exit();
        }

        const newAdmin = new Admin({
            name: 'Super Admin',
            username: 'superadmin',
            email: 'admin@nair.solutions',
            password: 'adminpassword123',
            role: 'superadmin'
        });

        await newAdmin.save();

        console.log('Super Admin created successfully!');
        process.exit();
    } catch (err) {
        console.error('ERROR CREATING ADMIN:');
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`${key}: ${err.errors[key].message}`);
            });
        } else {
            console.error(err);
        }
        process.exit(1);
    }
};

createSuperAdmin();
