import { downloadPdfFromUrl, safeFilename } from '../../../infrastructure/pdf/PdfDownload.js';
export function createUnpaywallTier() {
    return {
        id: 'unpaywall',
        stage: 'unpaywall',
        run: tryUnpaywall
    };
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
//# sourceMappingURL=unpaywall.js.map