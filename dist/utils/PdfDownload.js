import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';
export function safeFilename(value, fallback = 'paper') {
    const safe = value.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[_\-.]+|[_\-.]+$/g, '');
    return (safe || fallback).slice(0, 120);
}
export async function downloadPdfFromUrl(pdfUrl, savePath, filenameHint) {
    if (!pdfUrl) {
        throw new Error('Missing PDF URL');
    }
    fs.mkdirSync(savePath, { recursive: true });
    const outputPath = path.join(savePath, `${safeFilename(filenameHint)}.pdf`);
    const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: TIMEOUTS.DOWNLOAD,
        maxRedirects: 5,
        headers: {
            'User-Agent': USER_AGENT,
            Accept: 'application/pdf,*/*'
        },
        validateStatus: status => status < 500
    });
    if (response.status >= 400) {
        throw new Error(`PDF download failed with HTTP ${response.status}`);
    }
    const buffer = Buffer.from(response.data);
    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    const isPdf = contentType.includes('pdf') || buffer.subarray(0, 4).toString() === '%PDF';
    if (!isPdf) {
        throw new Error(`Resolved URL is not a PDF candidate: ${pdfUrl}`);
    }
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
}
//# sourceMappingURL=PdfDownload.js.map