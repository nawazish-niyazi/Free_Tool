/** 
 * Main Server File 
 * This is the entry point for the backend. It starts the server and connects all the parts.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// 1. Load configuration from the .env file
dotenv.config();

// 2. Connect to the database (MongoDB)
connectDB();

const app = express();

/**
 * Middleware: These are helpers that run before reaching the routes.
 */
app.use(cors()); // Allows the frontend to talk to this backend
app.use(express.json()); // Allows the server to understand JSON data
app.use(express.urlencoded({ extended: true })); // Allows understanding form data

/**
 * Setup: Create a 'temp' folder to store files while they are being converted.
 */
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Serve temp folder for processed file previews
app.use('/temp', express.static(TEMP_DIR));

// Basic route to check if the server is alive
app.get('/', (req, res) => {
    res.send('N.A.I.R Solutions API is running...');
});

/**
 * Routes: Connect different sections of the API
 */
const pdfRoutes = require('./routes/pdfRoutes');
const eSignRoutes = require('./routes/eSignRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imageRoutes');

app.use('/api/pdf', pdfRoutes); // Logic for PDF tools (convert, compress, etc.)
app.use('/api/esign', eSignRoutes); // Logic for digital signatures
app.use('/api/invoice', invoiceRoutes); // Logic for generating invoices
app.use('/api/auth', authRoutes); // Logic for users and authentication
app.use('/api/image', imageRoutes); // New: Logic for image processing

/**
 * Error Handler: If something goes wrong anywhere in the code,
 * this function captures the error and sends a message back to the user.
 */
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

/**
 * Start the Server
 */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/**
 * Settings: Give the server more time (5 minutes) for heavy tasks 
 * like converting large documents.
 */
server.timeout = 300000;
server.keepAliveTimeout = 300000;

