export interface PDFExtractOptions {
    maxPages?: number;
    cleanText?: boolean;
}
export interface PDFExtractResult {
    text: string;
    numPages: number;
    info?: any;
    metadata?: any;
}
export declare class PDFExtractor {
    /**
     * Download PDF from URL and extract text
     */
    extractFromUrl(url: string, options?: PDFExtractOptions): Promise<PDFExtractResult>;
    /**
     * Extract text from PDF file
     */
    extractFromFile(filePath: string, options?: PDFExtractOptions): Promise<PDFExtractResult>;
    /**
     * Extract text from PDF buffer
     */
    extractFromBuffer(buffer: Buffer, options?: PDFExtractOptions): Promise<PDFExtractResult>;
    /**
     * Clean extracted text
     */
    private cleanText;
    /**
     * Download PDF and save to file
     */
    downloadPdf(url: string, savePath: string): Promise<string>;
}
export default PDFExtractor;
//# sourceMappingURL=PDFExtractor.d.ts.map