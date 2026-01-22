const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.log('MONGO_URI not found in env, skipping DB connection (File processing is stateless).');
        return;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // We don't exit process here because the app might function without DB for core file tools
    }
};

module.exports = connectDB;
