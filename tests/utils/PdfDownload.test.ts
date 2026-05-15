import axios from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { downloadPdfFromUrl, isPdfBuffer } from '../../src/utils/PdfDownload.js';

describe('PdfDownload', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('recognizes PDFs by magic bytes even when content-type is generic', () => {
    expect(isPdfBuffer(Buffer.from('%PDF-1.7'), 'application/octet-stream')).toBe(true);
  });

  it('rejects HTML challenge pages instead of writing them as PDFs', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html' },
      data: Buffer.from('<html><title>Preparing to download ...</title></html>')
    } as any);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-download-test-'));

    await expect(downloadPdfFromUrl('https://example.test/paper.pdf', dir, 'paper')).rejects.toThrow(
      'did not return a PDF'
    );
    expect(fs.existsSync(path.join(dir, 'paper.pdf'))).toBe(false);
  });

  it('explains HTTP challenge responses clearly', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 403,
      headers: { 'content-type': 'text/html', 'cf-mitigated': 'challenge' },
      data: Buffer.from('<html><title>Just a moment...</title></html>')
    } as any);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-download-test-'));

    await expect(downloadPdfFromUrl('https://example.test/paper.pdf', dir, 'paper')).rejects.toThrow(
      'anti-bot challenge'
    );
  });

  it('writes validated PDF responses', async () => {
    jest.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'application/pdf' },
      data: Buffer.from('%PDF-1.7\nbody')
    } as any);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-download-test-'));

    const filePath = await downloadPdfFromUrl('https://example.test/paper.pdf', dir, 'paper');

    expect(fs.readFileSync(filePath).subarray(0, 4).toString()).toBe('%PDF');
  });
});
