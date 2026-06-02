import { CONFIG_KEYS, listConfigEntries } from '../config/ConfigService.js';
const METADATA_FREE_SOURCES = [
    'crossref',
    'openalex',
    'pubmed',
    'pmc',
    'europepmc',
    'arxiv',
    'biorxiv',
    'medrxiv',
    'semantic',
    'iacr',
    'core',
    'openaire',
    'googlescholar',
    'dblp',
    'acm',
    'usenix',
    'openreview'
];
const METADATA_ENTITLED_SOURCES = ['webofscience', 'sciencedirect', 'springer', 'scopus', 'ieee'];
const OPEN_ACCESS_SOURCES = [
    'arxiv',
    'biorxiv',
    'medrxiv',
    'pmc',
    'europepmc',
    'core',
    'openaire',
    'unpaywall',
    'openalex_oa_metadata',
    'semantic_open_access_pdf',
    'springer_open_access',
    'sciencedirect_open_access',
    'scopus_open_access_metadata',
    'iacr'
];
const ENTITLED_ACCESS_SOURCES = ['webofscience', 'sciencedirect', 'scopus', 'springer', 'ieee', 'wiley_tdm'];
const SCIHUB_SOURCES = ['scihub'];
const ENTITLED_KEY_BY_SOURCE = {
    webofscience: ['WOS_API_KEY'],
    sciencedirect: ['ELSEVIER_API_KEY'],
    scopus: ['ELSEVIER_API_KEY'],
    springer: ['SPRINGER_API_KEY'],
    ieee: ['IEEE_API_KEY'],
    wiley_tdm: ['WILEY_TDM_TOKEN']
};
export function buildCapabilityProfile() {
    const configuredKeys = configuredConfigKeys();
    const entries = [
        metadataSearchEntry(configuredKeys),
        bodySnippetSearchEntry(configuredKeys),
        journalMetricsEntry(configuredKeys),
        pdfDiscoveryEntry(configuredKeys),
        entitledAccessEntry(configuredKeys)
    ];
    return {
        ok: entries.some(entry => entry.status === 'available' || entry.status === 'degraded'),
        entries,
        summary: Object.fromEntries(entries.map(entry => [entry.id, entry.status]))
    };
}
function metadataSearchEntry(configuredKeys) {
    const configuredEntitled = METADATA_ENTITLED_SOURCES.filter(source => keysConfigured(configuredKeys, ENTITLED_KEY_BY_SOURCE[source] || []));
    const missingEntitled = METADATA_ENTITLED_SOURCES.filter(source => !configuredEntitled.includes(source));
    return {
        id: 'metadata_search',
        status: 'available',
        reason: `Free metadata sources are available (${METADATA_FREE_SOURCES.join(', ')}). Sci-Hub is excluded from metadata_search; entitled metadata sources are ${configuredEntitled.length ? `configured for ${configuredEntitled.join(', ')}` : 'not configured'}.`,
        configured: [...METADATA_FREE_SOURCES, ...configuredEntitled],
        missing: missingEntitled,
        sourceGroups: {
            free_sources: METADATA_FREE_SOURCES,
            entitled_sources: configuredEntitled,
            missing_entitled_sources: missingEntitled
        },
        optionalKeys: unique(Object.values(ENTITLED_KEY_BY_SOURCE).flat())
    };
}
function bodySnippetSearchEntry(configuredKeys) {
    const hasKey = configuredKeys.has('SEMANTIC_SCHOLAR_API_KEY');
    return {
        id: 'body_snippet_search',
        status: hasKey ? 'available' : 'unavailable',
        reason: hasKey
            ? 'SEMANTIC_SCHOLAR_API_KEY is configured, so Semantic Scholar Open Access body snippet search can run.'
            : 'SEMANTIC_SCHOLAR_API_KEY is missing; metadata search still works, but body snippet search cannot run.',
        configured: hasKey ? ['semantic_snippet_index'] : [],
        missing: hasKey ? [] : ['SEMANTIC_SCHOLAR_API_KEY'],
        requiredKeys: ['SEMANTIC_SCHOLAR_API_KEY']
    };
}
function journalMetricsEntry(configuredKeys) {
    const hasKey = configuredKeys.has('EASYSCHOLAR_KEY');
    return {
        id: 'journal_metrics',
        status: hasKey ? 'available' : 'unavailable',
        reason: hasKey
            ? 'EASYSCHOLAR_KEY is configured, so EasyScholar journal metrics can run.'
            : 'EASYSCHOLAR_KEY is missing; journal metrics are unavailable until the EasyScholar SecretKey is configured.',
        configured: hasKey ? ['easyscholar'] : [],
        missing: hasKey ? [] : ['EASYSCHOLAR_KEY'],
        requiredKeys: ['EASYSCHOLAR_KEY']
    };
}
function pdfDiscoveryEntry(configuredKeys) {
    const configuredEntitled = ENTITLED_ACCESS_SOURCES.filter(source => keysConfigured(configuredKeys, ENTITLED_KEY_BY_SOURCE[source] || []));
    const missingEntitled = ENTITLED_ACCESS_SOURCES.filter(source => !configuredEntitled.includes(source));
    return {
        id: 'pdf_discovery',
        status: configuredEntitled.length > 0 ? 'available' : 'degraded',
        reason: configuredEntitled.length > 0
            ? `Open-access PDF discovery, entitled access sources (${configuredEntitled.join(', ')}), and Sci-Hub final fallback are available.`
            : 'Open-access PDF discovery and Sci-Hub final fallback are available; entitled access sources are not configured.',
        configured: [...OPEN_ACCESS_SOURCES, ...configuredEntitled, ...SCIHUB_SOURCES],
        missing: missingEntitled,
        sourceGroups: {
            open_access_sources: OPEN_ACCESS_SOURCES,
            entitled_access_sources: configuredEntitled,
            missing_entitled_access_sources: missingEntitled,
            scihub_sources: SCIHUB_SOURCES
        },
        optionalKeys: unique(Object.values(ENTITLED_KEY_BY_SOURCE).flat())
    };
}
function entitledAccessEntry(configuredKeys) {
    const configured = ENTITLED_ACCESS_SOURCES.filter(source => keysConfigured(configuredKeys, ENTITLED_KEY_BY_SOURCE[source] || []));
    const missing = ENTITLED_ACCESS_SOURCES.filter(source => !configured.includes(source));
    return {
        id: 'entitled_access',
        status: configured.length > 0 ? 'available' : 'unavailable',
        reason: configured.length > 0
            ? `User-specific access is configured for ${configured.join(', ')}.`
            : 'No publisher, database, TDM, or institutional access keys are configured.',
        configured,
        missing,
        sourceGroups: {
            configured_sources: configured,
            missing_sources: missing
        },
        requiredKeys: unique(Object.values(ENTITLED_KEY_BY_SOURCE).flat())
    };
}
function configuredConfigKeys() {
    return new Set(listConfigEntries(false).filter(entry => entry.configured).map(entry => entry.key));
}
function keysConfigured(configuredKeys, keys) {
    return keys.length > 0 && keys.some(key => configuredKeys.has(key));
}
function unique(values) {
    return [...new Set(values.filter(key => CONFIG_KEYS.includes(key)))];
}
//# sourceMappingURL=capabilityProfile.js.map