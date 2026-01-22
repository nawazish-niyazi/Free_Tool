/**
 * eSign Service
 * This file handles putting digital signatures onto PDF files.
 */

const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

/**
 * FEATURE: Process Signature
 * This function takes a PDF and a list of signatures, and draws them onto the pages.
 */
const processSignature = async (filePath, signatures, outputDir) => {
    try {
        // Load the existing PDF file
        const existingPdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();

        // Loop through each signature provided by the user
        for (const sig of signatures) {
            /**
             * sig contains:
             * - pageIndex: Which page to sign
             * - x, y: Position on the page (0 to 1)
             * - width, height: Size of the signature (0 to 1)
             * - imageData: The actual signature image (base64 PNG)
             */

            const page = pages[sig.pageIndex];
            const { width: pageWidth, height: pageHeight } = page.getSize();

            // Convert the signature image data into a format the PDF can use
            const pngImage = await pdfDoc.embedPng(sig.imageData);

            // Calculate the actual size in PDF points (pixels)
            const imgWidth = sig.width * pageWidth;
            const imgHeight = sig.height * pageHeight;

            /**
             * Coordinate Math:
             * On a web browser, (0,0) is the top-left corner.
             * In a PDF, (0,0) is the bottom-left corner.
             * We have to flip the Y coordinate so the signature appears in the right spot.
             */
            const x = sig.x * pageWidth;
            const y = pageHeight - (sig.y * pageHeight) - imgHeight;

            // Draw the signature image onto the page
            page.drawImage(pngImage, {
                x,
                y,
                width: imgWidth,
                height: imgHeight,
            });
        }

        // Save the signed PDF into memory
        const pdfBytes = await pdfDoc.save();

        // Create a unique name for the new signed file
        const filename = `signed-${Date.now()}.pdf`;
        const outputPath = path.join(outputDir, filename);

        // Make sure the output folder exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write the PDF data to a real file on the disk
        fs.writeFileSync(outputPath, pdfBytes);

        // Return the name and path so the user can download it
        return {
            filename,
            path: outputPath
        };

    } catch (error) {
        console.error('Error in processSignature:', error);
        throw error;
    }
};

module.exports = { processSignature };

