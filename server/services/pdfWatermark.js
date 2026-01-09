import { PDFDocument, rgb, PDFName, PDFArray, PDFDict, PDFString } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fontkit from '@pdf-lib/fontkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontsDir = path.join(__dirname, '../fonts');

const WATERMARK_TEXT = '© Robin Notes';
const WATERMARK_LINK = 'https://notes.rob1n.dev';

/**
 * Add watermark to all pages of a PDF with clickable link
 * @param {string} inputPath - Path to the input PDF
 * @param {string} outputPath - Path where watermarked PDF will be saved (can be same as input)
 * @returns {Promise<string>} - Path to the watermarked PDF
 */
export const addWatermarkToPdf = async (inputPath, outputPath = null) => {
    try {
        // Read the PDF
        const pdfBytes = await fs.readFile(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Register fontkit for custom fonts
        pdfDoc.registerFontkit(fontkit);

        // Load Arial font for Turkish character support
        const fontPath = path.join(fontsDir, 'Arial.ttf');
        const fontBytes = await fs.readFile(fontPath);
        const font = await pdfDoc.embedFont(fontBytes);

        // Get all pages
        const pages = pdfDoc.getPages();

        // Add watermark to each page
        for (const page of pages) {
            const { width, height } = page.getSize();

            // Calculate text dimensions
            const fontSize = 10;
            const textWidth = font.widthOfTextAtSize(WATERMARK_TEXT, fontSize);

            // Banner properties - light background to blend with paper
            const bannerHeight = 24;
            const bannerY = 0;

            // Draw light banner background
            page.drawRectangle({
                x: 0,
                y: bannerY,
                width: width,
                height: bannerHeight,
                color: rgb(0.96, 0.96, 0.96), // Light gray
            });

            // Draw dark text centered
            const textX = (width - textWidth) / 2;
            const textY = bannerY + (bannerHeight - fontSize) / 2 + 2;

            page.drawText(WATERMARK_TEXT, {
                x: textX,
                y: textY,
                size: fontSize,
                font: font,
                color: rgb(0.3, 0.3, 0.3), // Dark gray text
            });

            // Add clickable link annotation
            const context = pdfDoc.context;

            // Create URI action
            const uriAction = context.obj({
                Type: 'Action',
                S: 'URI',
                URI: PDFString.of(WATERMARK_LINK),
            });

            // Create link annotation
            const linkAnnotation = context.obj({
                Type: 'Annot',
                Subtype: 'Link',
                Rect: [0, bannerY, width, bannerY + bannerHeight],
                Border: [0, 0, 0],
                A: uriAction,
            });

            // Get existing annotations or create new array
            const existingAnnots = page.node.get(PDFName.of('Annots'));
            let annotsArray;

            if (existingAnnots instanceof PDFArray) {
                annotsArray = existingAnnots;
            } else {
                annotsArray = context.obj([]);
            }

            annotsArray.push(context.register(linkAnnotation));
            page.node.set(PDFName.of('Annots'), annotsArray);
        }

        // Save the watermarked PDF
        const watermarkedPdfBytes = await pdfDoc.save();
        const finalPath = outputPath || inputPath;
        await fs.writeFile(finalPath, watermarkedPdfBytes);

        console.log(`Watermark added to PDF: ${finalPath}`);
        return finalPath;
    } catch (error) {
        console.error('Error adding watermark to PDF:', error);
        throw error;
    }
};

/**
 * Check if file is a PDF
 * @param {string} filename - Filename to check
 * @returns {boolean}
 */
export const isPdf = (filename) => {
    return path.extname(filename).toLowerCase() === '.pdf';
};

export default { addWatermarkToPdf, isPdf };
