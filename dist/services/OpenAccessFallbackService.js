import { downloadPdfFromUrl, safeFilename } from '../utils/PdfDownload.js';
export const INSTITUTIONAL_ACCESS_TIER_ID = 'institutional_access';
const REPOSITORY_SOURCES = ['pmc', 'europepmc', 'core', 'openaire'];
export function createDefaultDownloadTiers() {
    return [
        createPrimaryTier(),
        createDirectPdfUrlTier(),
        createRepositoryTier(),
        createUnpaywallTier(),
        createSciHubTier()
    ];
}
export function insertDownloadTierBefore(tiers, beforeStage, tier) {
    const index = tiers.findIndex(item => item.stage === beforeStage);
    if (index < 0)
        return [...tiers, tier];
    return [...tiers.slice(0, index), tier, ...tiers.slice(index)];
}
function createPrimaryTier() {
    return {
        id: 'primary',
        stage: 'primary',
        run: tryPrimaryDownload
    };
}
function createDirectPdfUrlTier() {
    return {
        id: 'direct_pdf_url',
        stage: 'direct_pdf_url',
        run: tryDirectMetadataUrl
    };
}
function createRepositoryTier() {
    return {
        id: 'repositories',
        stage: 'repositories',
        run: tryRepositoryFallback
    };
}
function createUnpaywallTier() {
    return {
        id: 'unpaywall',
        stage: 'unpaywall',
        run: tryUnpaywall
    };
}
function createSciHubTier() {
    return {
        id: 'scihub',
        stage: 'scihub',
        run: trySciHub
    };
}
export async function downloadWithFallback(searchers, options, tiers = createDefaultDownloadTiers()) {
    const savePath = options.savePath || './downloads';
    const attempts = [];
    const context = {
        searchers,
        source: normalizeSource(options.source),
        paperId: options.paperId,
        doi: options.doi,
        title: options.title,
        savePath,
        useSciHub: options.useSciHub !== false
    };
    for (const tier of tiers) {
        const result = await tier.run(context);
        attempts.push({ stage: tier.stage, status: result.status, message: result.message });
        if (result.status === 'ok' && result.path) {
            return { status: 'ok', path: result.path, attempts };
        }
    }
    return { status: 'error', attempts };
}
async function tryPrimaryDownload(context) {
    const primary = context.searchers[context.source];
    if (!primary?.getCapabilities().download) {
        return { status: 'skipped', message: `No primary downloader for ${context.source}` };
    }
    try {
        const path = await primary.downloadPdf(context.paperId, { savePath: context.savePath });
        return { status: 'ok', path, message: path };
    }
    catch (error) {
        return { status: 'error', message: error?.message || String(error) };
    }
}
async function tryDirectMetadataUrl(context) {
    const searcher = context.searchers[context.source];
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
    }
    catch (error) {
        return { status: 'error', message: error?.message || String(error) };
    }
}
async function tryRepositoryFallback(context) {
    const queries = [context.doi || '', context.title || ''].filter(Boolean);
    if (queries.length === 0) {
        return { status: 'skipped', message: 'No DOI/title provided for repository discovery.' };
    }
    for (const source of REPOSITORY_SOURCES) {
        const searcher = context.searchers[source];
        if (!searcher)
            continue;
        for (const query of queries) {
            try {
                const papers = await searcher.search(query, { maxResults: 3 });
                const paper = papers.find(candidate => candidate.pdfUrl);
                if (!paper?.pdfUrl)
                    continue;
                const path = await downloadPdfFromUrl(paper.pdfUrl, context.savePath, `${source}_${safeFilename(paper.paperId)}`);
                return { status: 'ok', path, message: path };
            }
            catch {
                continue;
            }
        }
    }
    return { status: 'skipped', message: 'No repository PDF candidate succeeded.' };
}
async function tryUnpaywall(context) {
    if (!context.doi) {
        return { status: 'skipped', message: 'DOI not provided.' };
    }
    const unpaywall = context.searchers.unpaywall;
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
    }
    catch (error) {
        return { status: 'error', message: error?.message || String(error) };
    }
}
async function trySciHub(context) {
    if (!context.useSciHub) {
        return { status: 'skipped', message: 'Sci-Hub fallback disabled by useSciHub=false.' };
    }
    const identifier = context.doi || context.title || context.paperId;
    try {
        const path = await context.searchers.scihub.downloadPdf(identifier, { savePath: context.savePath });
        return { status: 'ok', path, message: path };
    }
    catch (error) {
        return { status: 'error', message: error?.message || String(error) };
    }
}
function normalizeSource(source) {
    const normalized = source.trim().toLowerCase();
    if (normalized === 'google_scholar')
        return 'googlescholar';
    if (normalized === 'pubmed_central')
        return 'pmc';
    if (normalized === 'europe_pmc')
        return 'europepmc';
    return normalized;
}
//# sourceMappingURL=OpenAccessFallbackService.js.map