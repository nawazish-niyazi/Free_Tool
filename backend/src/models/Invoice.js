const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    invoiceID: {
        type: String,
        required: true,
        unique: true
    },
    invoiceNumber: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: false
    },
    issueDate: Date,
    dueDate: Date,
    currency: String,
    status: {
        type: String,
        default: 'Generated'
    },
    business: {
        name: String,
        address: String,
        email: String,
        phone: String,
        logoPath: String,
        logoData: String
    },
    client: {
        name: String,
        address: String,
        email: String
    },
    items: [{
        description: String,
        quantity: Number,
        unitPrice: Number,
        total: Number
    }],
    totals: {
        subtotal: Number,
        tax: Number,
        taxAmount: Number,
        discount: Number,
        discountAmount: Number,
        grandTotal: Number
    },
    notes: String,
    pdfPath: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
