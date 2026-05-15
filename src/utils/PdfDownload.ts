import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { TIMEOUTS, USER_AGENT } from '../config/constants.js';

export interface PdfDownloadOptions {
  headers?: Record<string, string>;
}

export function safeFilename(value: string, fallback = 'paper'): string {
  const safe = value.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[_\-.]+|[_\-.]+$/g, '');
  return (safe || fallback).slice(0, 120);
}

export function isPdfBuffer(buffer: Buffer, contentType = ''): boolean {
  return contentType.toLowerCase().includes('pdf') || buffer.subarray(0, 4).toString() === '%PDF';
}

export async function downloadPdfFromUrl(
  pdfUrl: string,
  savePath: string,
  filenameHint: string,
  options: PdfDownloadOptions = {}
): Promise<string> {
  if (!pdfUrl) {
    throw new Error('Missing PDF URL');
  }
  if (pdfUrl.startsWith('ftp://')) {
    throw new Error(`FTP PDF links are not supported by the Node downloader: ${pdfUrl}`);
  }

  fs.mkdirSync(savePath, { recursive: true });
  const outputPath = path.join(savePath, `${safeFilename(filenameHint)}.pdf`);

  const response = await axios.get<ArrayBuffer>(pdfUrl, {
    responseType: 'arraybuffer',
    timeout: TIMEOUTS.DOWNLOAD,
    maxRedirects: 5,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/pdf,*/*',
      ...(options.headers || {})
    },
    validateStatus: status => status < 500
  });

  if (response.status >= 400) {
    const errorBuffer = Buffer.from(response.data || []);
    const snippet = errorBuffer.subarray(0, 240).toString('utf8').replace(/\s+/g, ' ').trim();
    const challenge = response.headers['cf-mitigated'] || /cloudflare|challenge|just a moment/i.test(snippet);
    const reason = challenge ? 'provider returned an HTML anti-bot challenge instead of a PDF' : 'provider refused the request';
    throw new Error(`PDF download failed with HTTP ${response.status}: ${reason}`);
  }

  const buffer = Buffer.from(response.data);
  const contentType = String(response.headers['content-type'] || '').toLowerCase();
  if (!isPdfBuffer(buffer, contentType)) {
    const snippet = buffer.subarray(0, 240).toString('utf8').replace(/\s+/g, ' ').trim();
    const challenge = response.headers['cf-mitigated'] || /cloudflare|challenge|preparing to download|proof-of-work/i.test(snippet);
    const reason = challenge
      ? 'the provider returned an HTML challenge page instead of a PDF'
      : `content-type was ${contentType || 'unknown'}`;
    throw new Error(`Resolved URL did not return a PDF (${reason}): ${pdfUrl}`);
  }

  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}
