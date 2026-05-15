import type { Searchers } from '../core/searchers.js';
import { PaperSource } from '../platforms/PaperSource.js';
import { UnpaywallSearcher } from '../platforms/UnpaywallSearcher.js';
import { downloadPdfFromUrl, safeFilename } from '../utils/PdfDownload.js';

export interface DownloadWithFallbackOptions {
  source: string;
  paperId: string;
  doi?: string;
  title?: string;
  savePath?: string;
  useSciHub?: boolean;
}

export interface DownloadWithFallbackResult {
  status: 'ok' | 'error';
  path?: string;
  attempts: Array<{ stage: string; status: 'ok' | 'error' | 'skipped'; message: string }>;
}

const REPOSITORY_SOURCES = ['pmc', 'europepmc', 'core', 'openaire'];

export async function downloadWithFallback(
  searchers: Searchers,
  options: DownloadWithFallbackOptions
): Promise<DownloadWithFallbackResult> {
  const savePath = options.savePath || './downloads';
  const attempts: DownloadWithFallbackResult['attempts'] = [];
  const source = normalizeSource(options.source);

  const primary = (searchers as any)[source] as PaperSource | undefined;
  if (primary?.getCapabilities().download) {
    try {
      const path = await primary.downloadPdf(options.paperId, { savePath });
      attempts.push({ stage: 'primary', status: 'ok', message: path });
      return { status: 'ok', path, attempts };
    } catch (error: any) {
      attempts.push({ stage: 'primary', status: 'error', message: error?.message || String(error) });
    }
  } else {
    attempts.push({ stage: 'primary', status: 'skipped', message: `No primary downloader for ${source}` });
  }

  const directResult = await tryDirectMetadataUrl(searchers, source, options.paperId, savePath, attempts);
  if (directResult) return { status: 'ok', path: directResult, attempts };

  const repositoryResult = await tryRepositoryFallback(searchers, options, savePath, attempts);
  if (repositoryResult) return { status: 'ok', path: repositoryResult, attempts };

  const unpaywallResult = await tryUnpaywall(searchers, options.doi || '', savePath, attempts);
  if (unpaywallResult) return { status: 'ok', path: unpaywallResult, attempts };

  if (options.useSciHub) {
    const identifier = options.doi || options.title || options.paperId;
    try {
      const path = await searchers.scihub.downloadPdf(identifier, { savePath });
      attempts.push({ stage: 'scihub', status: 'ok', message: path });
      return { status: 'ok', path, attempts };
    } catch (error: any) {
      attempts.push({ stage: 'scihub', status: 'error', message: error?.message || String(error) });
    }
  } else {
    attempts.push({ stage: 'scihub', status: 'skipped', message: 'Sci-Hub fallback disabled; pass useSciHub=true to opt in.' });
  }

  return { status: 'error', attempts };
}

async function tryDirectMetadataUrl(
  searchers: Searchers,
  source: string,
  paperId: string,
  savePath: string,
  attempts: DownloadWithFallbackResult['attempts']
): Promise<string> {
  const searcher = (searchers as any)[source] as PaperSource | undefined;
  if (!searcher) return '';

  try {
    const paper = await searcher.getPaperByDoi(paperId);
    if (!paper?.pdfUrl) {
      attempts.push({ stage: 'direct_pdf_url', status: 'skipped', message: 'No pdf_url found in source metadata.' });
      return '';
    }
    const path = await downloadPdfFromUrl(paper.pdfUrl, savePath, `${source}_${safeFilename(paper.paperId)}`);
    attempts.push({ stage: 'direct_pdf_url', status: 'ok', message: path });
    return path;
  } catch (error: any) {
    attempts.push({ stage: 'direct_pdf_url', status: 'error', message: error?.message || String(error) });
    return '';
  }
}

async function tryRepositoryFallback(
  searchers: Searchers,
  options: DownloadWithFallbackOptions,
  savePath: string,
  attempts: DownloadWithFallbackResult['attempts']
): Promise<string> {
  const queries = [options.doi || '', options.title || ''].filter(Boolean);
  if (queries.length === 0) {
    attempts.push({ stage: 'repositories', status: 'skipped', message: 'No DOI/title provided for repository discovery.' });
    return '';
  }

  for (const source of REPOSITORY_SOURCES) {
    const searcher = (searchers as any)[source] as PaperSource | undefined;
    if (!searcher) continue;

    for (const query of queries) {
      try {
        const papers = await searcher.search(query, { maxResults: 3 });
        const paper = papers.find(candidate => candidate.pdfUrl);
        if (!paper?.pdfUrl) continue;

        const path = await downloadPdfFromUrl(paper.pdfUrl, savePath, `${source}_${safeFilename(paper.paperId)}`);
        attempts.push({ stage: `repository:${source}`, status: 'ok', message: path });
        return path;
      } catch (error: any) {
        attempts.push({ stage: `repository:${source}`, status: 'error', message: error?.message || String(error) });
      }
    }
  }

  attempts.push({ stage: 'repositories', status: 'skipped', message: 'No repository PDF candidate succeeded.' });
  return '';
}

async function tryUnpaywall(
  searchers: Searchers,
  doi: string,
  savePath: string,
  attempts: DownloadWithFallbackResult['attempts']
): Promise<string> {
  if (!doi) {
    attempts.push({ stage: 'unpaywall', status: 'skipped', message: 'DOI not provided.' });
    return '';
  }

  try {
    const unpaywall = searchers.unpaywall as UnpaywallSearcher;
    const pdfUrl = await unpaywall.resolveBestPdfUrl(doi);
    if (!pdfUrl) {
      attempts.push({ stage: 'unpaywall', status: 'skipped', message: 'No OA PDF URL found or email not configured.' });
      return '';
    }
    const path = await downloadPdfFromUrl(pdfUrl, savePath, `unpaywall_${safeFilename(doi)}`);
    attempts.push({ stage: 'unpaywall', status: 'ok', message: path });
    return path;
  } catch (error: any) {
    attempts.push({ stage: 'unpaywall', status: 'error', message: error?.message || String(error) });
    return '';
  }
}

function normalizeSource(source: string): string {
  const normalized = source.trim().toLowerCase();
  if (normalized === 'google_scholar') return 'googlescholar';
  if (normalized === 'pubmed_central') return 'pmc';
  if (normalized === 'europe_pmc') return 'europepmc';
  return normalized;
}
