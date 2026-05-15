import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - pdf-parse doesn't have type definitions
import pdf from 'pdf-parse';
import { logDebug, logWarn } from './Logger.js';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
export class PDFExtractor {
    /**
     * Download PDF from URL and extract text
     */
    async extractFromUrl(url, options = {}) {
        try {
            logDebug(`Downloading PDF from: ${url}`);
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: TIMEOUTS.DOWNLOAD,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/pdf'
                }
            });
            if (response.status !== 200) {
                throw new Error(`Failed to download PDF: HTTP ${response.status}`);
            }
            const buffer = Buffer.from(response.data);
            return await this.extractFromBuffer(buffer, options);
        }
        catch (error) {
            logWarn(`Error downloading PDF from ${url}:`, error.message);
            throw error;
        }
    }
    /**
     * Extract text from PDF file
     */
    async extractFromFile(filePath, options = {}) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`PDF file not found: ${filePath}`);
            }
            logDebug(`Extracting text from PDF file: ${filePath}`);
            const dataBuffer = fs.readFileSync(filePath);
            return await this.extractFromBuffer(dataBuffer, options);
        }
        catch (error) {
            logWarn(`Error extracting PDF from file ${filePath}:`, error.message);
            throw error;
        }
    }
    /**
     * Extract text from PDF buffer
     */
    async extractFromBuffer(buffer, options = {}) {
        try {
            const pdfOptions = {};
            if (options.maxPages) {
                pdfOptions.max = options.maxPages;
            }
            const data = await pdf(buffer, pdfOptions);
            let text = data.text;
            if (options.cleanText !== false) {
                text = this.cleanText(text);
            }
            logDebug(`Extracted ${data.numpages} pages, ${text.length} characters`);
            return {
                text,
                numPages: data.numpages,
                info: data.info,
                metadata: data.metadata
            };
        }
        catch (error) {
            logWarn('Error parsing PDF:', error.message);
            throw error;
        }
    }
    /**
     * Clean extracted text
     */
    cleanText(text) {
        return text
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Remove page numbers (common patterns)
            .replace(/\n\s*\d+\s*\n/g, '\n')
            // Remove headers/footers (lines with only numbers or short text)
            .replace(/\n\s*[\w\s]{1,30}\s*\n/g, '\n')
            // Normalize line breaks
            .replace(/\n{3,}/g, '\n\n')
            // Trim
            .trim();
    }
    /**
     * Download PDF and save to file
     */
    async downloadPdf(url, savePath) {
        try {
            logDebug(`Downloading PDF from ${url} to ${savePath}`);
            // Ensure directory exists
            const dir = path.dirname(savePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const response = await axios.get(url, {
                responseType: 'stream',
                timeout: TIMEOUTS.DOWNLOAD,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/pdf'
                }
            });
            const writer = fs.createWriteStream(savePath);
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    logDebug(`PDF saved to: ${savePath}`);
                    resolve(savePath);
                });
                writer.on('error', reject);
            });
        }
        catch (error) {
            logWarn(`Error downloading PDF:`, error.message);
            throw error;
        }
    }
}
export default PDFExtractor;
//# sourceMappingURL=PDFExtractor.js.map