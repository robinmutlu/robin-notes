import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontsDir = path.join(__dirname, '../fonts');

/**
 * Convert DOCX file to PDF using mammoth and pdf-lib with Turkish font support
 * @param {string} inputPath - Path to the DOCX file
 * @param {string} outputPath - Path where PDF will be saved
 * @returns {Promise<string>} - Path to the generated PDF
 */
export const convertDocxToPdf = async (inputPath, outputPath) => {
    try {
        // Read DOCX and convert to text
        const docxBuffer = await fs.readFile(inputPath);
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        const text = result.value;

        // Create PDF document
        const pdfDoc = await PDFDocument.create();

        // Register fontkit for custom fonts
        pdfDoc.registerFontkit(fontkit);

        // Load Arial font (supports Turkish characters)
        const fontPath = path.join(fontsDir, 'Arial.ttf');
        const fontBytes = await fs.readFile(fontPath);
        const font = await pdfDoc.embedFont(fontBytes);

        const fontSize = 11;
        const lineHeight = fontSize * 1.4;
        const margin = 50;
        const pageWidth = 595; // A4
        const pageHeight = 842; // A4
        const maxWidth = pageWidth - (margin * 2);
        const maxLinesPerPage = Math.floor((pageHeight - margin * 2 - 30) / lineHeight);

        // Split text into lines that fit the page width
        const paragraphs = text.split('\n');
        const lines = [];

        for (const para of paragraphs) {
            if (!para.trim()) {
                lines.push('');
                continue;
            }

            const words = para.split(' ');
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const textWidth = font.widthOfTextAtSize(testLine, fontSize);

                if (textWidth > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
        }

        // Create pages
        let currentLine = 0;
        while (currentLine < lines.length) {
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            let y = pageHeight - margin;

            for (let i = 0; i < maxLinesPerPage && currentLine < lines.length; i++) {
                const line = lines[currentLine];
                if (line) {
                    page.drawText(line, {
                        x: margin,
                        y: y,
                        size: fontSize,
                        font: font,
                        color: rgb(0.1, 0.1, 0.1),
                    });
                }
                y -= lineHeight;
                currentLine++;
            }
        }

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, pdfBytes);

        console.log('Converted DOCX to PDF:', outputPath);
        return outputPath;
    } catch (error) {
        console.error('DOCX to PDF conversion error:', error);
        throw new Error('PDF dönüştürme başarısız: ' + error.message);
    }
};

/**
 * Check if file is a Word document
 * @param {string} filename - Filename to check
 * @returns {boolean}
 */
export const isWordDocument = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    return ext === '.doc' || ext === '.docx';
};

/**
 * Get PDF path for a Word document
 * @param {string} wordPath - Path to the Word document
 * @returns {string} - Path where PDF would be stored
 */
export const getPdfPath = (wordPath) => {
    const dir = path.dirname(wordPath);
    const basename = path.basename(wordPath, path.extname(wordPath));
    return path.join(dir, `${basename}.pdf`);
};

export default { convertDocxToPdf, isWordDocument, getPdfPath };
