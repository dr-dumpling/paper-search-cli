import { parseToolArgs } from './schemas.js';
import { PaperFactory } from '../models/Paper.js';
import { handleSemanticSnippets } from '../capabilities/body-snippet-search/handler.js';
import { handleGetPaperCitations, handleGetPaperReferences } from '../capabilities/citation-expansion/handler.js';
import { handleGenericSearch, handleGetPaperByDoi, handleSearchPapers } from '../capabilities/metadata-search/handler.js';
import { handleJournalMetrics } from '../capabilities/journal-metrics/handler.js';
import { handleDownloadPaper, handleDownloadWithFallback } from '../capabilities/pdf-discovery/handler.js';
import { getGenericSearchToolPlatform, isPlatformAlias } from '../registry/platformMetadata.js';
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
const TOOL_HANDLERS = {
    search_papers: async (args, searchers) => handleSearchPapers(args, searchers),
    search_arxiv: async (args, searchers) => {
        const { query, maxResults, category, author, year, sortBy, sortOrder } = args;
        const results = await searchers.arxiv.search(query, {
            maxResults,
            category,
            author,
            year,
            sortBy,
            sortOrder
        });
        return jsonTextResponse(`Found ${results.length} arXiv papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_webofscience: async (args, searchers) => {
        const { query, maxResults, year, author, journal, sortBy, sortOrder } = args;
        if (!process.env.WOS_API_KEY) {
            throw new Error('Web of Science API key not configured. Please set WOS_API_KEY environment variable.');
        }
        const results = await searchers.webofscience.search(query, {
            maxResults,
            year,
            author,
            journal,
            sortBy,
            sortOrder
        });
        return jsonTextResponse(`Found ${results.length} Web of Science papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_pubmed: async (args, searchers) => {
        const { query, maxResults, year, author, journal, publicationType, sortBy } = args;
        const results = await searchers.pubmed.search(query, {
            maxResults,
            year,
            author,
            journal,
            publicationType,
            sortBy
        });
        const rateStatus = searchers.pubmed.getRateLimiterStatus();
        const apiKeyStatus = searchers.pubmed.hasApiKey() ? 'configured' : 'not configured';
        const rateLimit = searchers.pubmed.hasApiKey() ? '10 requests/second' : '3 requests/second';
        return jsonTextResponse(`Found ${results.length} PubMed papers.\n\nAPI Status: ${apiKeyStatus} (${rateLimit})\nRate Limiter: ${rateStatus.availableTokens}/${rateStatus.maxTokens} tokens available\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_biorxiv: async (args, searchers) => {
        const { query, maxResults, days, category } = args;
        const results = await searchers.biorxiv.search(query, {
            maxResults,
            days,
            category
        });
        return jsonTextResponse(`Found ${results.length} bioRxiv papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_medrxiv: async (args, searchers) => {
        const { query, maxResults, days, category } = args;
        const results = await searchers.medrxiv.search(query, {
            maxResults,
            days,
            category
        });
        return jsonTextResponse(`Found ${results.length} medRxiv papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_semantic_scholar: async (args, searchers) => {
        const { query, maxResults, year, fieldsOfStudy } = args;
        const results = await searchers.semantic.search(query, {
            maxResults,
            year,
            fieldsOfStudy
        });
        const rateStatus = searchers.semantic.getRateLimiterStatus();
        const apiKeyStatus = searchers.semantic.hasApiKey()
            ? 'configured'
            : 'not configured (using free tier)';
        const rateLimit = searchers.semantic.hasApiKey() ? '200 requests/minute' : '20 requests/minute';
        return jsonTextResponse(`Found ${results.length} Semantic Scholar papers.\n\nAPI Status: ${apiKeyStatus} (${rateLimit})\nRate Limiter: ${rateStatus.availableTokens}/${rateStatus.maxTokens} tokens available\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_semantic_snippets: async (args, searchers) => handleSemanticSnippets(args, searchers),
    get_paper_citations: async (args) => handleGetPaperCitations(args),
    get_paper_references: async (args) => handleGetPaperReferences(args),
    search_iacr: async (args, searchers) => {
        const { query, maxResults, fetchDetails } = args;
        const results = await searchers.iacr.search(query, { maxResults, fetchDetails });
        return jsonTextResponse(`Found ${results.length} IACR ePrint papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    download_paper: async (args, searchers) => handleDownloadPaper(args, searchers),
    download_with_fallback: async (args, searchers) => handleDownloadWithFallback(args, searchers),
    query_journal_metrics: async (args) => handleJournalMetrics(args),
    search_google_scholar: async (args, searchers) => {
        const { query, maxResults, yearLow, yearHigh, author } = args;
        const results = await searchers.googlescholar.search(query, {
            maxResults,
            yearLow,
            yearHigh,
            author
        });
        return jsonTextResponse(`Found ${results.length} Google Scholar papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    get_paper_by_doi: async (args, searchers) => handleGetPaperByDoi(args, searchers),
    search_scihub: async (args, searchers) => {
        const { doiOrUrl, downloadPdf, savePath } = args;
        const resolvedSavePath = savePath || './downloads';
        const results = await searchers.scihub.search(doiOrUrl);
        if (results.length === 0) {
            return jsonTextResponse(`No paper found on Sci-Hub for: ${doiOrUrl}`);
        }
        const paper = results[0];
        let responseText = `Found paper on Sci-Hub:\n\n${JSON.stringify(PaperFactory.toDict(paper), null, 2)}`;
        if (downloadPdf && paper.pdfUrl) {
            try {
                const filePath = await searchers.scihub.downloadPdf(doiOrUrl, { savePath: resolvedSavePath });
                responseText += `\n\nPDF downloaded successfully to: ${filePath}`;
            }
            catch (downloadError) {
                responseText += `\n\nFailed to download PDF: ${downloadError.message}`;
            }
        }
        return jsonTextResponse(responseText);
    },
    check_scihub_mirrors: async (args, searchers) => {
        const { forceCheck } = args;
        if (forceCheck) {
            await searchers.scihub.forceHealthCheck();
        }
        const mirrorStatus = searchers.scihub.getMirrorStatus();
        return jsonTextResponse(`Sci-Hub Mirror Status:\n\n${JSON.stringify(mirrorStatus, null, 2)}`);
    },
    search_sciencedirect: async (args, searchers) => {
        const { query, maxResults, year, author, journal, openAccess } = args;
        if (!process.env.ELSEVIER_API_KEY) {
            throw new Error('Elsevier API key not configured. Please set ELSEVIER_API_KEY environment variable.');
        }
        const results = await searchers.sciencedirect.search(query, {
            maxResults,
            year,
            author,
            journal,
            openAccess
        });
        return jsonTextResponse(`Found ${results.length} ScienceDirect papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_springer: async (args, searchers) => {
        const { query, maxResults, year, author, journal, subject, openAccess, type } = args;
        if (!process.env.SPRINGER_API_KEY) {
            throw new Error('Springer API key not configured. Please set SPRINGER_API_KEY environment variable.');
        }
        const results = await searchers.springer.search(query, {
            maxResults,
            year,
            author,
            journal,
            subject,
            openAccess,
            type
        });
        return jsonTextResponse(`Found ${results.length} Springer papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_wiley: async () => jsonTextResponse(`DEPRECATED: Wiley TDM API does not support keyword search.\n\n` +
        `To access Wiley content:\n` +
        `1. Use search_crossref to find Wiley articles (filter by publisher if needed)\n` +
        `2. Use download_paper with platform="wiley" and the DOI to download the PDF\n\n` +
        `Example: download_paper(paperId="10.1111/jtsb.12390", platform="wiley")`),
    search_scopus: async (args, searchers) => {
        const { query, maxResults, year, author, journal, affiliation, subject, openAccess, documentType } = args;
        if (!process.env.ELSEVIER_API_KEY) {
            throw new Error('Elsevier API key not configured. Please set ELSEVIER_API_KEY environment variable.');
        }
        const results = await searchers.scopus.search(query, {
            maxResults,
            year,
            author,
            journal,
            affiliation,
            subject,
            openAccess,
            documentType
        });
        return jsonTextResponse(`Found ${results.length} Scopus papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_crossref: async (args, searchers) => {
        const { query, maxResults, year, author, sortBy, sortOrder } = args;
        const results = await searchers.crossref.search(query, {
            maxResults,
            year,
            author,
            sortBy,
            sortOrder
        });
        return jsonTextResponse(`Found ${results.length} Crossref papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_openalex: async (args, searchers) => {
        const { query, maxResults, year } = args;
        const results = await searchers.openalex.search(query, { maxResults, year });
        return jsonTextResponse(`Found ${results.length} OpenAlex papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_unpaywall: async (args, searchers) => {
        const { query, maxResults } = args;
        const results = await searchers.unpaywall.search(query, { maxResults });
        return jsonTextResponse(`Found ${results.length} Unpaywall record(s).\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_pmc: async (args, searchers) => {
        const { query, maxResults, year } = args;
        const results = await searchers.pmc.search(query, { maxResults, year });
        return jsonTextResponse(`Found ${results.length} PMC papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_europepmc: async (args, searchers) => {
        const { query, maxResults, year } = args;
        const results = await searchers.europepmc.search(query, { maxResults, year });
        return jsonTextResponse(`Found ${results.length} Europe PMC papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_core: async (args, searchers) => {
        const { query, maxResults, year } = args;
        const results = await searchers.core.search(query, { maxResults, year });
        return jsonTextResponse(`Found ${results.length} CORE papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    search_openaire: async (args, searchers) => {
        const { query, maxResults, year } = args;
        const results = await searchers.openaire.search(query, { maxResults, year });
        return jsonTextResponse(`Found ${results.length} OpenAIRE papers.\n\n${JSON.stringify(results.map((paper) => PaperFactory.toDict(paper)), null, 2)}`);
    },
    get_platform_status: async (args, searchers) => {
        const { validate } = args;
        const statusInfo = [];
        for (const [platformName, searcher] of Object.entries(searchers)) {
            if (isPlatformAlias(platformName))
                continue;
            const capabilities = searcher.getCapabilities();
            const hasApiKey = searcher.hasApiKey();
            let apiKeyStatus = 'not_required';
            if (capabilities.requiresApiKey) {
                if (hasApiKey) {
                    if (validate) {
                        try {
                            const isValid = await searcher.validateApiKey();
                            apiKeyStatus = isValid ? 'valid' : 'invalid';
                        }
                        catch {
                            apiKeyStatus = 'unknown';
                        }
                    }
                    else {
                        apiKeyStatus = 'configured';
                    }
                }
                else {
                    apiKeyStatus = 'missing';
                }
            }
            let additionalInfo = {};
            if (platformName === 'scihub') {
                const mirrorStatus = searchers.scihub.getMirrorStatus();
                additionalInfo = {
                    mirrorCount: mirrorStatus.length,
                    workingMirrors: mirrorStatus.filter(m => m.status === 'Working').length
                };
            }
            statusInfo.push({
                platform: platformName,
                baseUrl: searcher.getBaseUrl(),
                capabilities,
                apiKeyStatus,
                ...additionalInfo
            });
        }
        return jsonTextResponse(`Platform Status:\n\n${JSON.stringify(statusInfo, null, 2)}`);
    }
};
export const TOOL_HANDLER_NAMES = Object.keys(TOOL_HANDLERS).sort();
export async function handleToolCall(toolNameRaw, rawArgs, searchers) {
    const toolName = toolNameRaw;
    const args = parseToolArgs(toolName, rawArgs);
    const genericSearchPlatform = getGenericSearchToolPlatform(toolNameRaw);
    if (genericSearchPlatform) {
        return handleGenericSearch(genericSearchPlatform, args, searchers);
    }
    const handler = TOOL_HANDLERS[toolNameRaw];
    if (!handler) {
        throw new Error(`Unknown tool: ${toolNameRaw}`);
    }
    return handler(args, searchers);
}
//# sourceMappingURL=handleToolCall.js.map