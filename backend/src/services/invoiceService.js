/**
 * Invoice Service
 * This file handles calculating totals and creating a professional PDF invoice.
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const { format } = require('date-fns');

/**
 * Helper: Formats numbers as currency (like ₹1,000.00)
 */
const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

/**
 * FEATURE: Generate Invoice PDF
 * This is the main function that creates the invoice file.
 */
const generateInvoicePdf = async (invoiceData, outputDir) => {
    // 1. Get the data sent from the website (business info, client info, list of items)
    const {
        business = {},
        client = {},
        items = [],
        tax = 0,
        discount = 0,
        currency = 'INR',
        invoiceNumber,
        issueDate,
        dueDate,
        notes,
        paymentMode,
        templateId = 'classic' // Default template
    } = invoiceData;

    // We need at least one item to make an invoice
    if (!items || items.length === 0) {
        throw new Error('At least one line item is required');
    }

    // 2. Calculations: Figure out the price for each item and the final total
    const normalizedItems = items.map(item => {
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const quantity = parseFloat(item.quantity) || 0;
        return {
            ...item,
            unitPrice,
            quantity,
            total: unitPrice * quantity
        };
    });

    // Subtotal: Total price before taxes or discounts
    const subtotal = normalizedItems.reduce((acc, item) => acc + item.total, 0);
    // Tax: Extra percentage added to the bill
    const taxAmount = subtotal * (parseFloat(tax) / 100 || 0);
    // Discount: Percentage taken off the bill
    const discountAmount = subtotal * (parseFloat(discount) / 100 || 0);
    // Grand Total: The final amount the client has to pay
    const grandTotal = subtotal + taxAmount - discountAmount;

    const totals = {
        subtotal,
        tax,
        taxAmount,
        discount,
        discountAmount,
        grandTotal
    };

    // 3. Setup Dates and IDs
    const id = uuidv4(); // Unique ID for this invoice
    const finalInvoiceNumber = invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const formattedIssueDate = issueDate ? format(new Date(issueDate), 'PPP') : format(new Date(), 'PPP');
    const formattedDueDate = dueDate ? format(new Date(dueDate), 'PPP') : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'PPP');

    // 4. Create the HTML: Mix the data with the design (template)
    let templateName = 'invoice.ejs';
    const safeTemplateId = (templateId || 'classic').toLowerCase();

    if (safeTemplateId === 'modern') templateName = 'invoice-modern.ejs';
    if (safeTemplateId === 'minimal') templateName = 'invoice-minimal.ejs';

    let templatePath = path.join(__dirname, `../templates/${templateName}`);

    // Fallback if file doesn't exist
    if (!fs.existsSync(templatePath)) {
        console.warn(`Template ${templateName} not found. Falling back to classic.`);
        templatePath = path.join(__dirname, '../templates/invoice.ejs');
    }

    console.log(`Using template: ${templatePath}`);

    const templateData = {
        id,
        business,
        client,
        items: normalizedItems,
        totals,
        currency,
        invoiceNumber: finalInvoiceNumber,
        issueDate: formattedIssueDate,
        dueDate: formattedDueDate,
        notes,
        paymentMode,
        formatCurrency,
        status: 'Generated'
    };

    // Render the file (combines design and data)
    let html;
    try {
        html = await ejs.renderFile(templatePath, templateData);
    } catch (ejsError) {
        console.error('EJS Rendering Error:', ejsError);
        throw new Error('Failed to render invoice template: ' + ejsError.message);
    }

    // 5. PDF Generation: Use a tool called Puppeteer (a headless browser) to "print" the HTML as a PDF
    const outputPath = path.join(outputDir, `invoice-${id}.pdf`);

    let browser;
    try {
        console.log('Launching Puppeteer for invoice:', id);
        // Start a hidden browser with robust flags
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--font-render-hinting=none',
            ]
        });
        const page = await browser.newPage();

        // 5. PDF Generation: Feed our HTML into the browser
        console.log('Setting page content...');
        try {
            // 'networkidle2' is usually the most reliable for pages with assets
            await page.setContent(html, {
                waitUntil: ['load', 'networkidle2'],
                timeout: 45000
            });
        } catch (contentError) {
            console.warn('Puppeteer setContent timeout/error (continuing to PDF anyway):', contentError.message);
        }

        console.log('Printing to PDF...');
        // Save the page as an A4 size PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            }
        });

        fs.writeFileSync(outputPath, pdfBuffer);
        console.log('Successfully saved PDF to:', outputPath);

        // Return the file info and the calculated data for saving to DB
        return {
            id,
            outputPath,
            filename: `invoice-${finalInvoiceNumber}.pdf`,
            invoiceData: {
                invoiceID: id,
                invoiceNumber: finalInvoiceNumber,
                issueDate: new Date(issueDate || Date.now()),
                dueDate: new Date(dueDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
                currency,
                business,
                client,
                items: normalizedItems,
                totals,
                notes,
                paymentMode,
                pdfPath: outputPath
            }
        };
    } catch (error) {
        console.error('Puppeteer error:', error);
        throw new Error('Failed to generate PDF: ' + error.message);
    } finally {
        // Always close the browser when done
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = {
    generateInvoicePdf
};

