/**
 * PDF Service
 * This file contains the logic for processing PDF files.
 * It uses external tools like LibreOffice, Ghostscript, and QPDF to perform tasks
 * like conversion, compression, protection, and watermarking.
 */

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');

// Converts exec (which uses callbacks) into a Promise-based function
const execPromise = promisify(exec);
const { PDFDocument, rgb } = require('pdf-lib');

/**
 * Setup: If running on Windows, make sure LibreOffice is in the system's path
 * so we can use its 'soffice' command to convert documents.
 */
if (process.platform === 'win32') {
    const loPath = 'C:\\Program Files\\LibreOffice\\program';
    if (fs.existsSync(loPath) && !process.env.PATH.includes(loPath)) {
        process.env.PATH = `${process.env.PATH};${loPath}`;
    }
}

/**
 * Helper: Find where QPDF is installed on Windows.
 * QPDF is used for locking (protecting) and unlocking PDF files.
 */
const findQpdfPath = () => {
    if (process.platform !== 'win32') return 'qpdf';

    // List of common places where QPDF might be installed
    const possiblePaths = [
        'C:\\Program Files\\qpdf 12.2.0\\bin\\qpdf.exe',
        'C:\\Program Files (x86)\\qpdf 12.2.0\\bin\\qpdf.exe',
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'qpdf', 'bin', 'qpdf.exe'),
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'qpdf 12.2.0', 'bin', 'qpdf.exe')
    ];

    // Also look for any folder starting with 'qpdf' in Program Files
    try {
        const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
        const entries = fs.readdirSync(programFiles);
        const qpdfDirs = entries.filter(e => e.toLowerCase().startsWith('qpdf'));
        for (const dir of qpdfDirs) {
            possiblePaths.push(path.join(programFiles, dir, 'bin', 'qpdf.exe'));
        }
    } catch (e) {
        // Just ignore if we can't read the directory
    }

    // Check if the file actually exists at any of those paths
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return `"${p}"`;
    }
    return 'qpdf'; // Default to just 'qpdf' and hope it's in the system path
};

/**
 * Helper: Find where Ghostscript is installed on Windows.
 * Ghostscript is used for making PDF file sizes smaller (compression).
 */
const findGsPath = () => {
    if (process.platform !== 'win32') return 'gs';

    // List of common versions/places for Ghostscript
    const possiblePaths = [
        'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
        'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
        'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe'
    ];

    // Search inside the 'gs' folder for any version
    try {
        const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
        const gsRoot = path.join(programFiles, 'gs');
        if (fs.existsSync(gsRoot)) {
            const entries = fs.readdirSync(gsRoot);
            for (const dir of entries) {
                const p = path.join(gsRoot, dir, 'bin', 'gswin64c.exe');
                if (fs.existsSync(p)) possiblePaths.push(p);
            }
        }
    } catch (e) { }

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return `"${p}"`;
    }
    return 'gswin64c'; // Default for Windows
};

/**
 * FEATURE: Convert TO PDF
 * Takes files like Word (.docx) or Excel (.xlsx) and turns them into PDFs.
 */
const convertToPdf = async (inputPath, outputDir) => {
    return convertDocument(inputPath, outputDir, 'pdf');
};

/**
 * FEATURE: Convert FROM PDF
 * Takes a PDF and turns it into Word, Excel, or Images.
 */
const convertFromPdf = async (inputPath, outputDir, targetFormat) => {
    // targetFormat could be docx, xlsx, pptx, jpg, png, etc.
    return convertDocument(inputPath, outputDir, targetFormat);
};

const libre = require('libreoffice-convert');
const libreConvert = promisify(libre.convert);
const { pathToFileURL } = require('url');

/**
 * Core Logic: Uses LibreOffice 'soffice' command to handle document conversions.
 * It's powerful and supports many file types.
 */
const convertDocument = async (inputPath, outputDir, targetFormat) => {
    const extension = '.' + targetFormat;
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, baseName + extension);

    // Try to find the exact path to LibreOffice
    const winSoffice = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
    const cmdBase = fs.existsSync(winSoffice) ? `"${winSoffice}"` : 'soffice';

    // Some formats need special instructions (filters) for LibreOffice
    let formatFilter = targetFormat;
    if (targetFormat === 'jpg' || targetFormat === 'png') {
        formatFilter = `${targetFormat}:draw_${targetFormat}_Export`;
    }

    // Create a temporary profile folder so LibreOffice instances don't clash
    const userProfile = path.join(outputDir, 'lo_profile_' + Date.now() + '_' + Math.floor(Math.random() * 1000));

    // Special setting when converting PDFs back to Word/Text
    let extraArgs = '';
    if (path.extname(inputPath).toLowerCase() === '.pdf' && ['docx', 'rtf', 'txt', 'odt'].includes(targetFormat)) {
        extraArgs = '--infilter="writer_pdf_import"';
    }

    // The command we run on the computer's terminal
    const command = `${cmdBase} -env:UserInstallation="${pathToFileURL(userProfile).href}" --headless ${extraArgs} --convert-to ${formatFilter} --outdir "${outputDir}" "${inputPath}"`;

    try {
        console.log(`[CONVERSION START] Format: ${formatFilter}, Command: ${command}`);
        const startTime = Date.now();

        // Run the command
        const { stdout, stderr } = await execPromise(command);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`[CONVERSION DONE] ${duration}s.`);

        // Delete the temporary profile folder after 10 seconds
        setTimeout(() => {
            if (fs.existsSync(userProfile)) fs.rmSync(userProfile, { recursive: true, force: true });
        }, 10000);

        /**
         * naming Fix: Sometimes LibreOffice creates files with slightly different names
         * (like adding page numbers to images). This part finds and fixes that.
         */
        if (!fs.existsSync(outputPath)) {
            const pattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\.${targetFormat}$`);
            const files = fs.readdirSync(outputDir);
            const match = files.find(f => pattern.test(f));
            if (match) {
                const found = path.join(outputDir, match);
                if (found !== outputPath) fs.renameSync(found, outputPath);
            }
        }

        // If the file STILL isn't there, something went wrong
        if (!fs.existsSync(outputPath)) {
            throw new Error(`Output file not generated: ${outputPath}`);
        }

        return outputPath;
    } catch (error) {
        console.error('Conversion engine failed:', error);
        throw new Error('System conversion error: ' + (error.stderr || error.message));
    }
};

/**
 * FEATURE: Compress PDF
 * Makes a PDF file smaller in size using Ghostscript.
 */
const compressPdf = async (inputPath, outputDir, level = 'ebook') => {
    const outputPath = path.join(outputDir, 'compressed_' + path.basename(inputPath));
    const isWindows = process.platform === 'win32';

    // Find the Ghostscript command path
    let gsCmd = findGsPath();

    // Compression levels (screen = small/low quality, printer = large/high quality)
    const gsLevel = level.startsWith('/') ? level : `/${level}`;
    const finalCommand = `${gsCmd} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsLevel} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

    try {
        await execPromise(finalCommand);
        return outputPath;
    } catch (error) {
        // If the custom path failed, try the generic 'gs' command
        if (isWindows && (error.message.includes('not found') || error.message.includes('is not recognized'))) {
            try {
                const gsFallback = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsLevel} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
                await execPromise(gsFallback);
                return outputPath;
            } catch (e) {
                throw new Error('Ghostscript not found. Please install it to use compression.');
            }
        }
        throw new Error('Failed to compress PDF: ' + (error.stderr || error.message));
    }
};

/**
 * FEATURE: Protect PDF
 * Adds a password to a PDF so nobody can open it without the secret key.
 */
const protectPdf = async (inputPath, outputDir, password) => {
    const outputPath = path.join(outputDir, 'protected_' + path.basename(inputPath));

    // Find the QPDF command path
    let qpdfCmd = findQpdfPath();

    try {
        // Try using QPDF tool for encryption
        const command = `${qpdfCmd} --encrypt "${password}" "${password}" 256 -- "${inputPath}" "${outputPath}"`;
        await execPromise(command);

        if (!fs.existsSync(outputPath)) {
            throw new Error('Encryption failed');
        }

        return outputPath;
    } catch (qpdfError) {
        // If QPDF isn't there, try PDFTK as a backup
        try {
            const pdftk = 'pdftk';
            const command = `${pdftk} "${inputPath}" output "${outputPath}" user_pw "${password}" owner_pw "${password}" encrypt_128bit`;
            await execPromise(command);

            if (!fs.existsSync(outputPath)) {
                throw new Error('Fallback encryption failed');
            }

            return outputPath;
        } catch (pdftkError) {
            throw new Error('PDF protection requires QPDF or PDFTK to be installed.');
        }
    }
};

/**
 * FEATURE: Unlock PDF
 * Removes the password from a PDF (you must know the password first).
 */
const unlockPdf = async (inputPath, outputDir, password) => {
    const outputPath = path.join(outputDir, 'unlocked_' + path.basename(inputPath));

    let qpdfCmd = findQpdfPath();

    try {
        // Try removing the password using QPDF
        const command = `${qpdfCmd} --password="${password}" --decrypt "${inputPath}" "${outputPath}"`;
        await execPromise(command);

        if (!fs.existsSync(outputPath)) {
            throw new Error('Decryption failed');
        }

        return outputPath;
    } catch (qpdfError) {
        // Error handling for wrong password
        if (qpdfError.message.includes('invalid password') || qpdfError.message.includes('incorrect password')) {
            throw new Error('Incorrect password. Please try again.');
        }

        // Try PDFTK as a backup
        try {
            const pdftk = 'pdftk';
            const command = `${pdftk} "${inputPath}" input_pw "${password}" output "${outputPath}"`;
            await execPromise(command);

            if (!fs.existsSync(outputPath)) {
                throw new Error('Fallback decryption failed');
            }

            return outputPath;
        } catch (pdftkError) {
            if (pdftkError.message.includes('password')) {
                throw new Error('Incorrect password. Please try again.');
            }
            throw new Error('PDF unlocking requires QPDF or PDFTK to be installed.');
        }
    }
};

/**
 * FEATURE: Add Watermark
 * Places text or an image on top of PDF pages.
 */
const watermarkPdf = async (inputPath, outputDir, watermarkConfig) => {
    const outputPath = path.join(outputDir, 'watermarked_' + path.basename(inputPath));

    try {
        // Load the PDF into memory
        const fileBuffer = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();

        // Get settings like text, image, opacity, etc.
        const {
            type,
            text,
            imagePath,
            opacity = 0.5,
            rotation = 0,
            fontSize = 48,
            color = { r: 0.5, g: 0.5, b: 0.5 },
            position = 'center',
            pageNumbers = 'all',
            scale = 1.0
        } = watermarkConfig;

        // Choose which pages to apply the watermark to
        let pagesToWatermark = [];
        if (pageNumbers === 'all') {
            pagesToWatermark = pages.map((_, idx) => idx);
        } else if (Array.isArray(pageNumbers)) {
            pagesToWatermark = pageNumbers.map(p => p - 1).filter(p => p >= 0 && p < pages.length);
        }

        // Loop through each page and draw the watermark
        for (const pageIndex of pagesToWatermark) {
            const page = pages[pageIndex];
            const { width, height } = page.getSize();

            if (type === 'text' && text) {
                // Determine text position
                let x, y;
                const currentFontSize = fontSize * scale;
                const textWidth = currentFontSize * text.length * 0.5; // Rough estimate
                const textHeight = currentFontSize;

                switch (position) {
                    case 'top-left': x = 50; y = height - textHeight - 50; break;
                    case 'top-right': x = width - textWidth - 50; y = height - textHeight - 50; break;
                    case 'bottom-left': x = 50; y = 50; break;
                    case 'bottom-right': x = width - textWidth - 50; y = 50; break;
                    case 'top-center': x = (width - textWidth) / 2; y = height - textHeight - 50; break;
                    case 'bottom-center': x = (width - textWidth) / 2; y = 50; break;
                    case 'center':
                    default:
                        x = (width - textWidth) / 2;
                        y = height / 2;
                }

                let textColor = rgb(color.r, color.g, color.b);

                // Draw the text
                page.drawText(text, {
                    x,
                    y,
                    size: currentFontSize,
                    color: textColor,
                    opacity: opacity,
                    rotate: { type: 'degrees', angle: rotation }
                });
            } else if (type === 'image' && imagePath && fs.existsSync(imagePath)) {
                // Load and embed the watermark image (PNG or JPG)
                const imageBytes = fs.readFileSync(imagePath);
                let image;

                if (imagePath.toLowerCase().endsWith('.png')) {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    image = await pdfDoc.embedJpg(imageBytes);
                }

                // Scale the image and draw it
                const imgWidth = image.width * scale;
                const imgHeight = image.height * scale;

                let x, y;
                switch (position) {
                    case 'top-left': x = 50; y = height - imgHeight - 50; break;
                    case 'top-right': x = width - imgWidth - 50; y = height - imgHeight - 50; break;
                    case 'bottom-left': x = 50; y = 50; break;
                    case 'bottom-right': x = width - imgWidth - 50; y = 50; break;
                    case 'top-center': x = (width - imgWidth) / 2; y = height - imgHeight - 50; break;
                    case 'bottom-center': x = (width - imgWidth) / 2; y = 50; break;
                    case 'center':
                    default:
                        x = (width - imgWidth) / 2;
                        y = (height - imgHeight) / 2;
                }

                page.drawImage(image, {
                    x,
                    y,
                    width: imgWidth,
                    height: imgHeight,
                    opacity: opacity,
                    rotate: { type: 'degrees', angle: rotation }
                });
            }
        }

        // Save the new PDF to a file
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytes);
        return outputPath;
    } catch (err) {
        throw new Error('Failed to add watermark: ' + err.message);
    }
};

/**
 * FEATURE: Remove Watermark
 * This is a tricky process. It tries 4 different methods to clean a PDF.
 */
const removeWatermark = async (inputPath, outputDir) => {
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const step1Path = path.join(outputDir, `step1_${baseName}.pdf`);
    const finalOutputPath = path.join(outputDir, `cleaned_${baseName}.pdf`);

    let currentPath = inputPath;

    // If it's not a PDF yet, convert it first
    if (path.extname(inputPath).toLowerCase() !== '.pdf') {
        try {
            currentPath = await convertDocument(inputPath, outputDir, 'pdf');
        } catch (convErr) {
            throw new Error('Conversion failed: ' + convErr.message);
        }
    }

    try {
        // STEP 1: Remove "Annotations" (these are often notes or watermarks added on top)
        try {
            const fileBuffer = fs.readFileSync(currentPath);
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const pages = pdfDoc.getPages();
            let modified = false;

            for (const page of pages) {
                const annots = page.node.Annots();
                if (annots) {
                    page.node.set(page.node.context.obj({ Annots: [] }));
                    modified = true;
                }
            }

            if (modified) {
                const pdfBytes = await pdfDoc.save();
                fs.writeFileSync(step1Path, pdfBytes);
                currentPath = step1Path;
            }
        } catch (step1Error) { }

        // STEP 2: Use Ghostscript to "flatten" the PDF (merges layers together)
        const step2Path = path.join(outputDir, `step2_${baseName}.pdf`);
        try {
            const gsCmd = findGsPath();
            const command = `${gsCmd} -dPDFA=1 -dNOOUTERSAVE -sProcessColorModel=DeviceRGB -sDEVICE=pdfwrite -o "${step2Path}" -dPDFACompatibilityPolicy=1 "${currentPath}"`;
            await execPromise(command);
            if (fs.existsSync(step2Path)) currentPath = step2Path;
        } catch (step2Error) { }

        // STEP 3: Re-reconstruct the PDF using LibreOffice
        try {
            const winSoffice = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
            const loCmd = fs.existsSync(winSoffice) ? `"${winSoffice}"` : 'soffice';
            const command = `${loCmd} --headless --convert-to pdf --outdir "${outputDir}" "${currentPath}"`;
            await execPromise(command);
        } catch (step3Error) { }

        // STEP 4: Clean up the file structure using QPDF
        try {
            const qpdfCmd = findQpdfPath();
            const step4Path = path.join(outputDir, `step4_${baseName}.pdf`);
            const command = `${qpdfCmd} --linearize "${currentPath}" "${step4Path}"`;
            await execPromise(command);
            if (fs.existsSync(step4Path)) currentPath = step4Path;
        } catch (step4Error) { }

        /**
         * Finalize: Save the best cleaned version we got and delete the 
         * messy temporary files we created during the process.
         */
        if (currentPath !== inputPath) {
            fs.copyFileSync(currentPath, finalOutputPath);
            try {
                const intermediates = [step1Path, step2Path, path.join(outputDir, `step4_${baseName}.pdf`)];
                intermediates.forEach(p => {
                    if (fs.existsSync(p) && p !== finalOutputPath) fs.unlinkSync(p);
                });
            } catch (cleanupErr) { }
            return finalOutputPath;
        } else {
            fs.copyFileSync(inputPath, finalOutputPath);
            return finalOutputPath;
        }

    } catch (err) {
        throw new Error('Unable to remove watermark: ' + err.message);
    }
};

// Export these functions so they can be used in other parts of the app
module.exports = {
    convertToPdf,
    convertFromPdf,
    compressPdf,
    protectPdf,
    unlockPdf,
    watermarkPdf,
    removeWatermark
};

