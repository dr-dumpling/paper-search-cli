import type { SearchOptions } from '../platforms/PaperSource.js';

export type PlatformSourceKind = 'official-api' | 'metadata-proxy' | 'html' | 'alias';
export type CapabilityGroup =
  | 'metadata_search'
  | 'citation_expansion'
  | 'body_snippet_search'
  | 'journal_metrics'
  | 'pdf_discovery'
  | 'entitled_access';
export type CapabilityProfileSourceGroup =
  | 'metadata_free'
  | 'metadata_entitled'
  | 'pdf_open_access'
  | 'pdf_entitled'
  | 'pdf_scihub';
export type PlatformSchemaKind =
  | 'generic'
  | 'arxiv'
  | 'webofscience'
  | 'pubmed'
  | 'biorxiv'
  | 'medrxiv'
  | 'semantic-scholar'
  | 'google-scholar'
  | 'iacr'
  | 'core'
  | 'springer'
  | 'sciencedirect'
  | 'scopus'
  | 'wiley-deprecated'
  | 'crossref'
  | 'openalex'
  | 'pmc-style'
  | 'unpaywall'
  | 'scihub'
  | 'custom';

export interface PlatformMetadata {
  id: string;
  aliases?: string[];
  displayName: string;
  sourceKind: PlatformSourceKind;
  defaultInAll: boolean;
  directTool?: boolean;
  toolName?: string;
  configKeys?: string[][];
  optionalConfigKeys?: string[][];
  supportedOptions: (keyof SearchOptions)[];
  schemaKind?: PlatformSchemaKind;
  optionCaps?: { maxResults?: number };
  capabilityGroups?: CapabilityGroup[];
  supportsDoiLookup?: boolean;
  isRepository?: boolean;
  repositoryFallbackOrder?: number;
  doiLookupOrder?: number;
  capabilityProfileSources?: {
    group: CapabilityProfileSourceGroup;
    order: number;
    source?: string;
  }[];
  description?: string;
}

export const PLATFORM_METADATA: PlatformMetadata[] = [
  {
    id: 'crossref',
    displayName: 'Crossref',
    sourceKind: 'official-api',
    defaultInAll: true,
    supportedOptions: ['maxResults', 'year', 'author', 'sortBy', 'sortOrder'],
    schemaKind: 'crossref',
    supportsDoiLookup: true,
    doiLookupOrder: 10,
    capabilityProfileSources: [{ group: 'metadata_free', order: 10 }],
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
    doiLookupOrder: 20,
    capabilityProfileSources: [{ group: 'metadata_free', order: 20 }],
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
    doiLookupOrder: 40,
    capabilityProfileSources: [{ group: 'metadata_free', order: 30 }],
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
    repositoryFallbackOrder: 10,
    doiLookupOrder: 50,
    capabilityProfileSources: [
      { group: 'metadata_free', order: 40 },
      { group: 'pdf_open_access', order: 40 }
    ],
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
    repositoryFallbackOrder: 20,
    doiLookupOrder: 60,
    capabilityProfileSources: [
      { group: 'metadata_free', order: 50 },
      { group: 'pdf_open_access', order: 50 }
    ],
    capabilityGroups: ['metadata_search', 'pdf_discovery']
  },
  {
    id: 'arxiv',
    displayName: 'arXiv',
    sourceKind: 'official-api',
    defaultInAll: true,
    supportedOptions: ['maxResults', 'year', 'author', 'category', 'sortBy', 'sortOrder'],
    schemaKind: 'arxiv',
    doiLookupOrder: 90,
    capabilityProfileSources: [
      { group: 'metadata_free', order: 60 },
      { group: 'pdf_open_access', order: 10 }
    ],
    capabilityGroups: ['metadata_search', 'pdf_discovery']
  },
  {
    id: 'biorxiv',
    displayName: 'bioRxiv',
    sourceKind: 'official-api',
    defaultInAll: true,
    supportedOptions: ['maxResults', 'days', 'category'],
    schemaKind: 'biorxiv',
    capabilityProfileSources: [
      { group: 'metadata_free', order: 70 },
      { group: 'pdf_open_access', order: 20 }
    ],
    capabilityGroups: ['metadata_search', 'pdf_discovery']
  },
  {
    id: 'medrxiv',
    displayName: 'medRxiv',
    sourceKind: 'official-api',
    defaultInAll: true,
    supportedOptions: ['maxResults', 'days', 'category'],
    schemaKind: 'medrxiv',
    capabilityProfileSources: [
      { group: 'metadata_free', order: 80 },
      { group: 'pdf_open_access', order: 30 }
    ],
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
    capabilityProfileSources: [{ group: 'metadata_free', order: 90 }],
    capabilityGroups: ['metadata_search', 'citation_expansion', 'body_snippet_search', 'pdf_discovery']
  },
  {
    id: 'iacr',
    displayName: 'IACR ePrint',
    sourceKind: 'html',
    defaultInAll: true,
    supportedOptions: ['maxResults', 'fetchDetails'],
    schemaKind: 'iacr',
    capabilityProfileSources: [
      { group: 'metadata_free', order: 100 },
      { group: 'pdf_open_access', order: 140 }
    ],
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
    repositoryFallbackOrder: 30,
    doiLookupOrder: 70,
    capabilityProfileSources: [
      { group: 'metadata_free', order: 110 },
      { group: 'pdf_open_access', order: 60 }
    ],
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
    repositoryFallbackOrder: 40,
    capabilityProfileSources: [
      { group: 'metadata_free', order: 120 },
      { group: 'pdf_open_access', order: 70 }
    ],
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
    capabilityProfileSources: [{ group: 'metadata_free', order: 130 }],
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
    doiLookupOrder: 80,
    capabilityProfileSources: [
      { group: 'metadata_entitled', order: 10 },
      { group: 'pdf_entitled', order: 10 }
    ],
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
    capabilityProfileSources: [
      { group: 'metadata_entitled', order: 20 },
      { group: 'pdf_entitled', order: 20 }
    ],
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
    capabilityProfileSources: [
      { group: 'metadata_entitled', order: 30 },
      { group: 'pdf_entitled', order: 40 }
    ],
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
    capabilityProfileSources: [
      { group: 'metadata_entitled', order: 40 },
      { group: 'pdf_entitled', order: 30 }
    ],
    capabilityGroups: ['metadata_search', 'pdf_discovery', 'entitled_access']
  },
  {
    id: 'wiley',
    displayName: 'Wiley TDM',
    sourceKind: 'official-api',
    defaultInAll: false,
    configKeys: [['WILEY_TDM_TOKEN']],
    supportedOptions: [],
    schemaKind: 'wiley-deprecated',
    capabilityGroups: ['pdf_discovery', 'entitled_access'],
    supportsDoiLookup: false,
    isRepository: false,
    capabilityProfileSources: [{ group: 'pdf_entitled', source: 'wiley_tdm', order: 60 }],
    description:
      'Wiley TDM API supports DOI-targeted PDF download only; use Crossref/OpenAlex for metadata discovery.'
  },
  {
    id: 'scihub',
    displayName: 'Sci-Hub',
    sourceKind: 'html',
    defaultInAll: true,
    supportedOptions: ['maxResults'],
    schemaKind: 'scihub',
    capabilityProfileSources: [{ group: 'pdf_scihub', order: 10 }],
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
    doiLookupOrder: 30,
    capabilityProfileSources: [{ group: 'pdf_open_access', order: 80 }],
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
    capabilityProfileSources: [{ group: 'metadata_free', order: 140 }],
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
    capabilityProfileSources: [
      { group: 'metadata_entitled', order: 50 },
      { group: 'pdf_entitled', order: 50 }
    ],
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
    capabilityProfileSources: [{ group: 'metadata_free', order: 150 }],
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
    capabilityProfileSources: [{ group: 'metadata_free', order: 160 }],
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
    capabilityProfileSources: [{ group: 'metadata_free', order: 170 }],
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

const VIRTUAL_CAPABILITY_PROFILE_SOURCES: {
  group: CapabilityProfileSourceGroup;
  source: string;
  order: number;
}[] = [
  { group: 'pdf_open_access', source: 'openalex_oa_metadata', order: 90 },
  { group: 'pdf_open_access', source: 'semantic_open_access_pdf', order: 100 },
  { group: 'pdf_open_access', source: 'springer_open_access', order: 110 },
  { group: 'pdf_open_access', source: 'sciencedirect_open_access', order: 120 },
  { group: 'pdf_open_access', source: 'scopus_open_access_metadata', order: 130 }
];

const ALIAS_TO_CANONICAL = new Map<string, string>();
const METADATA_BY_ID = new Map<string, PlatformMetadata>();
const GENERIC_TOOL_ALIASES = new Map<string, string>([
  ['search_springerlink', 'springerlink']
]);

for (const platform of PLATFORM_METADATA) {
  METADATA_BY_ID.set(platform.id, platform);
  for (const alias of platform.aliases || []) {
    ALIAS_TO_CANONICAL.set(alias, platform.id);
  }
}

export function resolvePlatformId(platform: string): string {
  const normalized = platform.trim().toLowerCase();
  return ALIAS_TO_CANONICAL.get(normalized) || normalized;
}

export function isPlatformAlias(platform: string): boolean {
  return ALIAS_TO_CANONICAL.has(platform.trim().toLowerCase());
}

export function isKnownSearchPlatform(platform: string): boolean {
  const canonical = resolvePlatformId(platform);
  return METADATA_BY_ID.has(canonical);
}

export function getPlatformMetadata(platform: string): PlatformMetadata | undefined {
  return METADATA_BY_ID.get(resolvePlatformId(platform));
}

export function getDefaultAllSources(): string[] {
  return [...DEFAULT_ALL_SOURCES];
}

export function getRepositoryFallbackSources(): string[] {
  return PLATFORM_METADATA
    .filter(platform => typeof platform.repositoryFallbackOrder === 'number')
    .sort((a, b) => a.repositoryFallbackOrder! - b.repositoryFallbackOrder!)
    .map(platform => platform.id);
}

export function getDoiLookupSources(): string[] {
  return PLATFORM_METADATA
    .filter(platform => typeof platform.doiLookupOrder === 'number')
    .sort((a, b) => a.doiLookupOrder! - b.doiLookupOrder!)
    .map(platform => platform.id);
}

export function getCapabilityProfileSources(group: CapabilityProfileSourceGroup): string[] {
  return [
    ...PLATFORM_METADATA.flatMap(platform =>
      (platform.capabilityProfileSources || []).map(source => ({
        group: source.group,
        source: source.source || platform.id,
        order: source.order
      }))
    ),
    ...VIRTUAL_CAPABILITY_PROFILE_SOURCES
  ]
    .filter(source => source.group === group)
    .sort((a, b) => a.order - b.order)
    .map(source => source.source);
}

export function getCapabilityProfileConfigKeysBySource(
  groups: CapabilityProfileSourceGroup[]
): Record<string, string[]> {
  const keysBySource = new Map<string, string[]>();
  for (const platform of PLATFORM_METADATA) {
    for (const source of platform.capabilityProfileSources || []) {
      const keys = (platform.configKeys || []).flat();
      if (keys.length > 0) {
        keysBySource.set(source.source || platform.id, keys);
      }
    }
  }

  const orderedSources = groups.flatMap(group => getCapabilityProfileSources(group));
  return Object.fromEntries(
    [...new Set(orderedSources)]
      .filter(source => keysBySource.has(source))
      .map(source => [source, keysBySource.get(source)!])
  );
}

export function getAliasMap(): Record<string, string> {
  return Object.fromEntries(ALIAS_TO_CANONICAL.entries());
}

export function getGenericSearchToolPlatform(toolName: string): string | undefined {
  const aliasPlatform = GENERIC_TOOL_ALIASES.get(toolName);
  if (aliasPlatform) return aliasPlatform;

  const platform = getGenericPlatformToolDescriptors().find(item => item.toolName === toolName);
  return platform?.id;
}

export function getGenericSearchToolNames(): string[] {
  return [
    ...getGenericPlatformToolDescriptors().map(item => item.toolName as string),
    ...GENERIC_TOOL_ALIASES.keys()
  ];
}

export function getPlatformToolDescriptors(): PlatformMetadata[] {
  return PLATFORM_METADATA.filter(platform => platform.directTool && platform.toolName);
}

export function getGenericPlatformToolDescriptors(): PlatformMetadata[] {
  return getPlatformToolDescriptors().filter(platform => platform.schemaKind === 'generic');
}
