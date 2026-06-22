import { UnpaywallSearcher } from '../../../platforms/UnpaywallSearcher.js';
import { downloadPdfFromUrl, safeFilename } from '../../../infrastructure/pdf/PdfDownload.js';
import type { DownloadTier, DownloadTierContext, DownloadTierResult } from '../DownloadTier.js';

export function createUnpaywallTier(): DownloadTier {
  return {
    id: 'unpaywall',
    stage: 'unpaywall',
    run: tryUnpaywall
  };
}

async function tryUnpaywall(context: DownloadTierContext): Promise<DownloadTierResult> {
  if (!context.doi) {
    return { status: 'skipped', message: 'DOI not provided.' };
  }

  const unpaywall = context.searchers.unpaywall as UnpaywallSearcher | undefined;
  if (!unpaywall?.resolveBestPdfUrl) {
    return { status: 'skipped', message: 'Unpaywall searcher unavailable.' };
  }

  try {
    const pdfUrl = await unpaywall.resolveBestPdfUrl(context.doi);
    if (!pdfUrl) {
      return { status: 'skipped', message: 'No OA PDF URL found or email not configured.' };
    }
    const path = await downloadPdfFromUrl(pdfUrl, context.savePath, `unpaywall_${safeFilename(context.doi)}`);
    return { status: 'ok', path, message: path };
  } catch (error: any) {
    return { status: 'error', message: error?.message || String(error) };
  }
}
