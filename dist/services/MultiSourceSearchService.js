import { TIMEOUTS } from '../config/constants.js';
import { PaperFactory } from '../models/Paper.js';
import { withTimeout } from '../utils/SecurityUtils.js';
const DEFAULT_ALL_SOURCES = [
    'crossref',
    'openalex',
    'pubmed',
    'pmc',
    'europepmc',
    'arxiv',
    'biorxiv',
    'medrxiv',
    'iacr',
    'core',
    'openaire'
];
const ALIASES = {
    google_scholar: 'googlescholar',
    webofscience: 'webofscience',
    wos: 'webofscience',
    europe_pmc: 'europepmc',
    pubmed_central: 'pmc'
};
export function parseSourceList(sources, searchers) {
    const requested = !sources || sources.trim() === '' ? 'crossref' : sources.trim();
    if (requested.toLowerCase() === 'all') {
        return DEFAULT_ALL_SOURCES.filter(source => source in searchers);
    }
    return requested
        .split(',')
        .map(source => source.trim().toLowerCase())
        .filter(Boolean)
        .map(source => ALIASES[source] || source)
        .filter((source, index, values) => values.indexOf(source) === index)
        .filter(source => source in searchers);
}
export async function searchMultipleSources(searchers, query, sources, options, sourceTimeoutMs = TIMEOUTS.SOURCE_TASK) {
    const selected = parseSourceList(sources, searchers);
    const settled = await Promise.allSettled(selected.map(async (source) => {
        const searcher = searchers[source];
        const results = await withTimeout(searcher.search(query, options), sourceTimeoutMs, `${source} search timed out after ${sourceTimeoutMs}ms`);
        return { source, results };
    }));
    const sourceResults = {};
    const errors = {};
    const failedSources = [];
    const merged = [];
    for (let i = 0; i < settled.length; i += 1) {
        const source = selected[i];
        const result = settled[i];
        if (result.status === 'rejected') {
            sourceResults[source] = 0;
            errors[source] = result.reason?.message || String(result.reason);
            failedSources.push(source);
            continue;
        }
        sourceResults[source] = result.value.results.length;
        merged.push(...result.value.results);
    }
    const deduped = dedupePapers(merged);
    return {
        query,
        sources_requested: sources,
        sources_used: selected,
        source_results: sourceResults,
        errors,
        failed_sources: failedSources,
        warnings: failedSources.map(source => `${source}: ${errors[source]}`),
        total: deduped.length,
        raw_total: merged.length,
        papers: deduped.map(paper => PaperFactory.toDict(paper))
    };
}
export function dedupePapers(papers) {
    const seen = new Set();
    const out = [];
    for (const paper of papers) {
        const key = paperKey(paper);
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(paper);
    }
    return out;
}
function paperKey(paper) {
    const doi = paper.doi.trim().toLowerCase();
    if (doi)
        return `doi:${doi}`;
    const title = paper.title.trim().toLowerCase();
    const authors = paper.authors.join(';').trim().toLowerCase();
    if (title)
        return `title:${title}|authors:${authors}`;
    return `id:${paper.source}:${paper.paperId}`;
}
//# sourceMappingURL=MultiSourceSearchService.js.map