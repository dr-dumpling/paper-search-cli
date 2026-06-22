import { resolvePlatformId } from '../../registry/platformMetadata.js';
import { downloadWithFallback } from './OpenAccessFallbackService.js';
function jsonTextResponse(text) {
    return {
        content: [
            {
                type: 'text',
                text
            }
        ]
    };
}
export async function handleDownloadPaper(args, searchers) {
    const { paperId, platform, savePath } = args;
    const resolvedSavePath = savePath || './downloads';
    const resolvedPlatform = resolvePlatformId(platform);
    const searcher = searchers[resolvedPlatform];
    if (!searcher) {
        throw new Error(`Unsupported platform for download: ${platform}`);
    }
    if (!searcher.getCapabilities().download) {
        const result = await downloadWithFallback(searchers, {
            source: resolvedPlatform,
            paperId,
            doi: paperId,
            savePath: resolvedSavePath,
            useSciHub: true
        });
        if (result.status === 'ok') {
            return jsonTextResponse(`PDF downloaded successfully via fallback to: ${result.path}\n\n${JSON.stringify(result, null, 2)}`);
        }
        return jsonTextResponse(`PDF download failed via fallback.\n\n${JSON.stringify(result, null, 2)}`);
    }
    try {
        const filePath = await searcher.downloadPdf(paperId, { savePath: resolvedSavePath });
        return jsonTextResponse(`PDF downloaded successfully to: ${filePath}`);
    }
    catch (error) {
        const result = await downloadWithFallback(searchers, {
            source: resolvedPlatform,
            paperId,
            doi: paperId,
            savePath: resolvedSavePath,
            useSciHub: true
        });
        if (result.status === 'ok') {
            return jsonTextResponse(`Primary download failed; PDF downloaded successfully via fallback to: ${result.path}\n\n${JSON.stringify(result, null, 2)}`);
        }
        throw error;
    }
}
export async function handleDownloadWithFallback(args, searchers) {
    const result = await downloadWithFallback(searchers, args);
    return jsonTextResponse(`Download with fallback ${result.status}.\n\n${JSON.stringify(result, null, 2)}`);
}
//# sourceMappingURL=handler.js.map