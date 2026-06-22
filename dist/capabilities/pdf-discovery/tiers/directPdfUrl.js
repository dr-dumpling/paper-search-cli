import { downloadPdfFromUrl, safeFilename } from '../../../infrastructure/pdf/PdfDownload.js';
export function createDirectPdfUrlTier() {
    return {
        id: 'direct_pdf_url',
        stage: 'direct_pdf_url',
        run: tryDirectMetadataUrl
    };
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
//# sourceMappingURL=directPdfUrl.js.map