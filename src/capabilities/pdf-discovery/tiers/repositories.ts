import { PaperSource } from '../../../platforms/PaperSource.js';
import { downloadPdfFromUrl, safeFilename } from '../../../infrastructure/pdf/PdfDownload.js';
import { getRepositoryFallbackSources } from '../../../registry/platformMetadata.js';
import type { DownloadTier, DownloadTierContext, DownloadTierResult } from '../DownloadTier.js';

export function createRepositoryTier(): DownloadTier {
  return {
    id: 'repositories',
    stage: 'repositories',
    run: tryRepositoryFallback
  };
}

async function tryRepositoryFallback(context: DownloadTierContext): Promise<DownloadTierResult> {
  const queries = [context.doi || '', context.title || ''].filter(Boolean);
  if (queries.length === 0) {
    return { status: 'skipped', message: 'No DOI/title provided for repository discovery.' };
  }

  for (const source of getRepositoryFallbackSources()) {
    const searcher = (context.searchers as any)[source] as PaperSource | undefined;
    if (!searcher) continue;

    for (const query of queries) {
      try {
        const papers = await searcher.search(query, { maxResults: 3 });
        const paper = papers.find(candidate => candidate.pdfUrl);
        if (!paper?.pdfUrl) continue;

        const path = await downloadPdfFromUrl(paper.pdfUrl, context.savePath, `${source}_${safeFilename(paper.paperId)}`);
        return { status: 'ok', path, message: path };
      } catch {
        continue;
      }
    }
  }

  return { status: 'skipped', message: 'No repository PDF candidate succeeded.' };
}
