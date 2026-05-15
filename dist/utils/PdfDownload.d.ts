export interface PdfDownloadOptions {
    headers?: Record<string, string>;
}
export declare function safeFilename(value: string, fallback?: string): string;
export declare function isPdfBuffer(buffer: Buffer, contentType?: string): boolean;
export declare function downloadPdfFromUrl(pdfUrl: string, savePath: string, filenameHint: string, options?: PdfDownloadOptions): Promise<string>;
//# sourceMappingURL=PdfDownload.d.ts.map