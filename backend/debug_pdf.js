const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function test() {
    console.log('PDFDocument prototype keys:', Object.getOwnPropertyNames(PDFDocument.prototype));

    const doc = await PDFDocument.create();
    console.log('New Document encrypt type:', typeof doc.encrypt);

    try {
        // Create a dummy pdf
        const bytes = await doc.save();
        const loadedDoc = await PDFDocument.load(bytes);
        console.log('Loaded Document encrypt type:', typeof loadedDoc.encrypt);
    } catch (e) {
        console.error('Error during load:', e);
    }
}

test();
