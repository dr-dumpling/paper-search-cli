export const PLATFORM_METADATA = [
    {
        id: 'crossref',
        displayName: 'Crossref',
        sourceKind: 'official-api',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'year', 'author', 'sortBy', 'sortOrder'],
        schemaKind: 'crossref',
        supportsDoiLookup: true,
        capabilityGroups: ['metadata_search']
    },
    {
        id: 'openalex',
        displayName: 'OpenAlex',
        sourceKind: 'official-api',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'year'],
        schemaKind: 'openalex',
        supportsDoiLookup: true,
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'pubmed',
        displayName: 'PubMed',
        sourceKind: 'official-api',
        defaultInAll: true,
        optionalConfigKeys: [['PUBMED_API_KEY'], ['NCBI_EMAIL'], ['NCBI_TOOL']],
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'sortBy'],
        schemaKind: 'pubmed',
        supportsDoiLookup: true,
        capabilityGroups: ['metadata_search']
    },
    {
        id: 'pmc',
        aliases: ['pubmed_central'],
        displayName: 'PubMed Central',
        sourceKind: 'official-api',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'year'],
        schemaKind: 'pmc-style',
        supportsDoiLookup: true,
        isRepository: true,
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'europepmc',
        aliases: ['europe_pmc'],
        displayName: 'Europe PMC',
        sourceKind: 'official-api',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'year'],
        schemaKind: 'pmc-style',
        supportsDoiLookup: true,
        isRepository: true,
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'arxiv',
        displayName: 'arXiv',
        sourceKind: 'official-api',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'year', 'author', 'category', 'sortBy', 'sortOrder'],
        schemaKind: 'arxiv',
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'biorxiv',
        displayName: 'bioRxiv',
        sourceKind: 'official-api',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'days', 'category'],
        schemaKind: 'biorxiv',
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'medrxiv',
        displayName: 'medRxiv',
        sourceKind: 'official-api',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'days', 'category'],
        schemaKind: 'medrxiv',
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'semantic',
        displayName: 'Semantic Scholar',
        sourceKind: 'official-api',
        defaultInAll: true,
        optionalConfigKeys: [['SEMANTIC_SCHOLAR_API_KEY']],
        supportedOptions: ['maxResults', 'year', 'fieldsOfStudy', 'sortBy'],
        schemaKind: 'semantic-scholar',
        supportsDoiLookup: true,
        capabilityGroups: ['metadata_search', 'citation_expansion', 'body_snippet_search', 'pdf_discovery']
    },
    {
        id: 'iacr',
        displayName: 'IACR ePrint',
        sourceKind: 'html',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'fetchDetails'],
        schemaKind: 'iacr',
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'core',
        displayName: 'CORE',
        sourceKind: 'official-api',
        defaultInAll: true,
        optionalConfigKeys: [['CORE_API_KEY']],
        supportedOptions: ['maxResults', 'year'],
        schemaKind: 'core',
        isRepository: true,
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'openaire',
        displayName: 'OpenAIRE',
        sourceKind: 'official-api',
        defaultInAll: true,
        optionalConfigKeys: [['OPENAIRE_API_KEY']],
        supportedOptions: ['maxResults', 'year'],
        schemaKind: 'pmc-style',
        isRepository: true,
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'googlescholar',
        aliases: ['scholar', 'google_scholar'],
        displayName: 'Google Scholar',
        sourceKind: 'html',
        defaultInAll: true,
        supportedOptions: ['maxResults', 'year', 'author'],
        schemaKind: 'google-scholar',
        capabilityGroups: ['metadata_search']
    },
    {
        id: 'webofscience',
        aliases: ['wos'],
        displayName: 'Web of Science',
        sourceKind: 'official-api',
        defaultInAll: true,
        configKeys: [['WOS_API_KEY']],
        optionalConfigKeys: [['WOS_API_VERSION']],
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'sortBy', 'sortOrder'],
        schemaKind: 'webofscience',
        capabilityGroups: ['metadata_search', 'entitled_access']
    },
    {
        id: 'sciencedirect',
        displayName: 'ScienceDirect',
        sourceKind: 'official-api',
        defaultInAll: true,
        configKeys: [['ELSEVIER_API_KEY']],
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'openAccess'],
        schemaKind: 'sciencedirect',
        capabilityGroups: ['metadata_search', 'pdf_discovery', 'entitled_access']
    },
    {
        id: 'springer',
        aliases: ['springerlink'],
        displayName: 'Springer Nature',
        sourceKind: 'official-api',
        defaultInAll: true,
        configKeys: [['SPRINGER_API_KEY']],
        optionalConfigKeys: [['SPRINGER_OPENACCESS_API_KEY']],
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'openAccess', 'subject', 'type'],
        schemaKind: 'springer',
        capabilityGroups: ['metadata_search', 'pdf_discovery', 'entitled_access']
    },
    {
        id: 'scopus',
        displayName: 'Scopus',
        sourceKind: 'official-api',
        defaultInAll: true,
        configKeys: [['ELSEVIER_API_KEY']],
        optionalConfigKeys: [['SCOPUS_SEARCH_API_KEY']],
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'affiliation', 'subject', 'openAccess', 'documentType'],
        schemaKind: 'scopus',
        capabilityGroups: ['metadata_search', 'pdf_discovery', 'entitled_access']
    },
    {
        id: 'scihub',
        displayName: 'Sci-Hub',
        sourceKind: 'html',
        defaultInAll: true,
        supportedOptions: ['maxResults'],
        schemaKind: 'scihub',
        capabilityGroups: ['pdf_discovery']
    },
    {
        id: 'unpaywall',
        displayName: 'Unpaywall',
        sourceKind: 'official-api',
        defaultInAll: true,
        configKeys: [['PAPER_SEARCH_UNPAYWALL_EMAIL', 'UNPAYWALL_EMAIL']],
        supportedOptions: ['maxResults'],
        schemaKind: 'unpaywall',
        isRepository: true,
        capabilityGroups: ['metadata_search', 'pdf_discovery']
    },
    {
        id: 'dblp',
        displayName: 'DBLP',
        sourceKind: 'official-api',
        defaultInAll: true,
        directTool: true,
        toolName: 'search_dblp',
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'sortBy', 'sortOrder'],
        schemaKind: 'generic',
        capabilityGroups: ['metadata_search'],
        description: 'Search DBLP computer-science bibliography using the official public search API'
    },
    {
        id: 'ieee',
        displayName: 'IEEE Xplore',
        sourceKind: 'official-api',
        defaultInAll: true,
        directTool: true,
        toolName: 'search_ieee',
        configKeys: [['IEEE_API_KEY']],
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'sortBy', 'sortOrder', 'articleTitle', 'startRecord'],
        schemaKind: 'generic',
        capabilityGroups: ['metadata_search', 'entitled_access'],
        description: 'Search IEEE Xplore metadata using the official API. Requires IEEE_API_KEY.'
    },
    {
        id: 'acm',
        displayName: 'ACM Digital Library',
        sourceKind: 'metadata-proxy',
        defaultInAll: true,
        directTool: true,
        toolName: 'search_acm',
        supportedOptions: ['maxResults', 'year', 'author', 'sortBy', 'sortOrder'],
        schemaKind: 'generic',
        capabilityGroups: ['metadata_search'],
        description: 'Search ACM metadata through Crossref/OpenAlex-style metadata, constrained to ACM DOI records'
    },
    {
        id: 'usenix',
        displayName: 'USENIX',
        sourceKind: 'metadata-proxy',
        defaultInAll: true,
        directTool: true,
        toolName: 'search_usenix',
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'sortBy', 'sortOrder'],
        schemaKind: 'generic',
        capabilityGroups: ['metadata_search'],
        description: 'Search USENIX-related paper metadata through DBLP-backed discovery'
    },
    {
        id: 'openreview',
        displayName: 'OpenReview',
        sourceKind: 'official-api',
        defaultInAll: true,
        directTool: true,
        toolName: 'search_openreview',
        supportedOptions: ['maxResults', 'year', 'author', 'journal', 'venue'],
        schemaKind: 'generic',
        capabilityGroups: ['metadata_search'],
        description: 'Search public OpenReview notes using OpenReview APIs'
    }
];
export const SEARCH_PLATFORM_IDS = PLATFORM_METADATA.map(platform => platform.id);
export const SEARCH_PLATFORM_VALUES = PLATFORM_METADATA.flatMap(platform => [
    platform.id,
    ...(platform.aliases || [])
]);
export const DEFAULT_ALL_SOURCES = PLATFORM_METADATA
    .filter(platform => platform.defaultInAll)
    .map(platform => platform.id);
const ALIAS_TO_CANONICAL = new Map();
const METADATA_BY_ID = new Map();
const GENERIC_TOOL_ALIASES = new Map([
    ['search_springerlink', 'springerlink']
]);
for (const platform of PLATFORM_METADATA) {
    METADATA_BY_ID.set(platform.id, platform);
    for (const alias of platform.aliases || []) {
        ALIAS_TO_CANONICAL.set(alias, platform.id);
    }
}
export function resolvePlatformId(platform) {
    const normalized = platform.trim().toLowerCase();
    return ALIAS_TO_CANONICAL.get(normalized) || normalized;
}
export function isPlatformAlias(platform) {
    return ALIAS_TO_CANONICAL.has(platform.trim().toLowerCase());
}
export function isKnownSearchPlatform(platform) {
    const canonical = resolvePlatformId(platform);
    return METADATA_BY_ID.has(canonical);
}
export function getPlatformMetadata(platform) {
    return METADATA_BY_ID.get(resolvePlatformId(platform));
}
export function getDefaultAllSources() {
    return [...DEFAULT_ALL_SOURCES];
}
export function getAliasMap() {
    return Object.fromEntries(ALIAS_TO_CANONICAL.entries());
}
export function getGenericSearchToolPlatform(toolName) {
    const aliasPlatform = GENERIC_TOOL_ALIASES.get(toolName);
    if (aliasPlatform)
        return aliasPlatform;
    const platform = getGenericPlatformToolDescriptors().find(item => item.toolName === toolName);
    return platform?.id;
}
export function getGenericSearchToolNames() {
    return [
        ...getGenericPlatformToolDescriptors().map(item => item.toolName),
        ...GENERIC_TOOL_ALIASES.keys()
    ];
}
export function getPlatformToolDescriptors() {
    return PLATFORM_METADATA.filter(platform => platform.directTool && platform.toolName);
}
export function getGenericPlatformToolDescriptors() {
    return getPlatformToolDescriptors().filter(platform => platform.schemaKind === 'generic');
}
//# sourceMappingURL=platformMetadata.js.map