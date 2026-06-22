import { PaperSource } from '../../../platforms/PaperSource.js';
import { downloadPdfFromUrl, safeFilename } from '../../../infrastructure/pdf/PdfDownload.js';
import type { DownloadTier, DownloadTierContext, DownloadTierResult } from '../DownloadTier.js';

export function createDirectPdfUrlTier(): DownloadTier {
  return {
    id: 'direct_pdf_url',
    stage: 'direct_pdf_url',
    run: tryDirectMetadataUrl
  };
}

async function tryDirectMetadataUrl(context: DownloadTierContext): Promise<DownloadTierResult> {
  const searcher = (context.searchers as any)[context.source] as PaperSource | undefined;
  if (!searcher) {
    return { status: 'skipped', message: `No metadata searcher for ${context.source}.` };
  }

  try {
    const lookupId = context.doi || context.paperId;
    const paper = await searcher.getPaperByDoi(lookupId);
    if (!paper?.pdfUrl) {
      return { status: 'skipped', message: 'No pdf_url found in source metadata.' };
    }
    const path = await downloadPdfFromUrl(paper.pdfUrl, context.savePath, `${context.source}_${safeFilename(paper.paperId)}`);
    return { status: 'ok', path, message: path };
  } catch (error: any) {
    return { status: 'error', message: error?.message || String(error) };
  }
}
