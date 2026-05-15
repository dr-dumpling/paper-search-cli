export interface ApiRequirement {
  id: string;
  platform: string;
  capability: string;
  tools: string[];
  keyGroups: string[][];
  optionalKeyGroups?: string[][];
  productAccess?: string;
  commonFailures: string[];
  actions: string[];
}

export interface RequirementStatus extends ApiRequirement {
  configured: boolean;
  configuredGroups: string[][];
  missingGroups: string[][];
}

export interface Diagnostic {
  severity: 'info' | 'warning' | 'error';
  category:
    | 'missing_config'
    | 'invalid_key'
    | 'permission'
    | 'query_or_filter'
    | 'rate_limit'
    | 'timeout'
    | 'zero_results'
    | 'partial_failure'
    | 'unsupported';
  platform?: string;
  tool?: string;
  summary: string;
  likelyCauses: string[];
  actions: string[];
  relatedConfigKeys: string[];
}

interface DiagnosticContext {
  tool?: string;
  platform?: string;
  sources?: string;
}

interface ToolResultContext extends DiagnosticContext {
  args?: Record<string, unknown>;
  data?: unknown;
  message?: string;
}

export const API_REQUIREMENTS: ApiRequirement[] = [
  {
    id: 'semantic-snippets',
    platform: 'semantic',
    capability: 'Semantic Scholar body snippet search',
    tools: ['search_semantic_snippets'],
    keyGroups: [['SEMANTIC_SCHOLAR_API_KEY']],
    commonFailures: [
      'Missing or invalid Semantic Scholar API key',
      'The Open Access snippet index has no body snippets for the query',
      'Filters such as field, year, author, or venue are too narrow'
    ],
    actions: [
      'Run `paper-search config doctor --pretty` and confirm `SEMANTIC_SCHOLAR_API_KEY` is configured.',
      'Retry with fewer filters or broader method terms.',
      'Use `search_semantic_scholar`, PubMed, or Crossref to find candidate titles before snippet search.'
    ]
  },
  {
    id: 'webofscience',
    platform: 'webofscience',
    capability: 'Web of Science metadata and citation search',
    tools: ['search_webofscience', 'search_papers'],
    keyGroups: [['WOS_API_KEY']],
    optionalKeyGroups: [['WOS_API_VERSION']],
    productAccess: 'Web of Science Starter or equivalent Clarivate API access',
    commonFailures: [
      'API key is missing or invalid',
      'The key is valid but not enabled for the selected Web of Science API product',
      'The query uses unsupported field tags, sort fields, or filters'
    ],
    actions: [
      'Run `paper-search config doctor --pretty` and confirm `WOS_API_KEY` is configured.',
      'Try `paper-search search "machine learning" --platform webofscience --max-results 1 --pretty` as a minimal test.',
      'Remove advanced filters first; then re-add year, author, journal, or sorting one at a time.',
      'Check the Clarivate developer dashboard for Web of Science Starter access.'
    ]
  },
  {
    id: 'scopus',
    platform: 'scopus',
    capability: 'Scopus search and citation metadata',
    tools: ['search_scopus', 'search_papers'],
    keyGroups: [['ELSEVIER_API_KEY']],
    optionalKeyGroups: [['SCOPUS_SEARCH_API_KEY']],
    productAccess: 'Elsevier Scopus Search API access',
    commonFailures: [
      'The Elsevier key is missing or invalid',
      'The key works for Scopus basic search but not for premium views or fields',
      'Institution or product entitlement is not enabled'
    ],
    actions: [
      'Run `paper-search config doctor --pretty` and confirm `ELSEVIER_API_KEY` is configured.',
      'Try `paper-search search "machine learning" --platform scopus --max-results 1 --pretty` as a minimal test.',
      'If 401/403 persists, check the Elsevier developer dashboard for Scopus Search API entitlement.',
      'Avoid COMPLETE view or premium fields unless the key is explicitly entitled for them.'
    ]
  },
  {
    id: 'sciencedirect',
    platform: 'sciencedirect',
    capability: 'ScienceDirect search and article metadata',
    tools: ['search_sciencedirect', 'search_papers'],
    keyGroups: [['ELSEVIER_API_KEY']],
    productAccess: 'Elsevier ScienceDirect Search API access',
    commonFailures: [
      'The Elsevier key is valid but not entitled for ScienceDirect Search API',
      'The requested view or fields require product access',
      'The key is restricted to another Elsevier product such as Scopus'
    ],
    actions: [
      'Run `paper-search config doctor --pretty` and confirm `ELSEVIER_API_KEY` is configured.',
      'If Scopus works but ScienceDirect returns 401, request ScienceDirect Search API access in the Elsevier developer dashboard.',
      'Use Crossref, OpenAlex, Semantic Scholar, PubMed, or Europe PMC as metadata fallbacks while entitlement is unavailable.'
    ]
  },
  {
    id: 'springer',
    platform: 'springer',
    capability: 'Springer Nature metadata and open access discovery',
    tools: ['search_springer', 'download_paper', 'search_papers'],
    keyGroups: [['SPRINGER_API_KEY']],
    optionalKeyGroups: [['SPRINGER_OPENACCESS_API_KEY']],
    productAccess: 'Springer Nature Metadata API and optional OpenAccess API access',
    commonFailures: [
      'The Springer API key is invalid, expired, or not recognized by the selected endpoint',
      'OpenAccess API access is not enabled for this key',
      'Filters such as subject, year, or type are too restrictive'
    ],
    actions: [
      'Run `paper-search config doctor --pretty` and confirm `SPRINGER_API_KEY` is configured.',
      'Try `paper-search search "machine learning" --platform springer --max-results 1 --pretty` as a minimal test.',
      'Generate or verify the key in the Springer Nature developer portal.',
      'Set `SPRINGER_OPENACCESS_API_KEY` only if you have a separate OpenAccess API key.'
    ]
  },
  {
    id: 'wiley',
    platform: 'wiley',
    capability: 'Wiley PDF download by DOI',
    tools: ['download_paper'],
    keyGroups: [['WILEY_TDM_TOKEN']],
    productAccess: 'Wiley TDM entitlement for PDF download',
    commonFailures: [
      'The Wiley token is missing, expired, or not entitled for the requested DOI',
      'The DOI is not a Wiley DOI',
      'The requested article is outside the token permissions'
    ],
    actions: [
      'Run `paper-search config doctor --pretty` and confirm `WILEY_TDM_TOKEN` is configured.',
      'Verify the DOI belongs to Wiley before using `download_paper --platform wiley`.',
      'Check Wiley TDM token permissions if 401/403 persists.'
    ]
  },
  {
    id: 'unpaywall',
    platform: 'unpaywall',
    capability: 'Open access PDF URL lookup by DOI',
    tools: ['search_papers', 'download_with_fallback'],
    keyGroups: [['PAPER_SEARCH_UNPAYWALL_EMAIL', 'UNPAYWALL_EMAIL']],
    commonFailures: [
      'No email is configured',
      'The query is not a DOI',
      'The DOI has no known open access location'
    ],
    actions: [
      'Set `PAPER_SEARCH_UNPAYWALL_EMAIL` or `UNPAYWALL_EMAIL` with `paper-search config set`.',
      'Use a DOI as the query, not free text.',
      'Use repository fallbacks such as PMC, Europe PMC, CORE, or OpenAIRE.'
    ]
  },
  {
    id: 'pubmed',
    platform: 'pubmed',
    capability: 'PubMed higher rate limits',
    tools: ['search_pubmed', 'search_papers'],
    keyGroups: [],
    optionalKeyGroups: [['PUBMED_API_KEY'], ['NCBI_EMAIL'], ['NCBI_TOOL']],
    commonFailures: [
      'Without an API key, NCBI applies lower rate limits',
      'Query translation may be too narrow or unexpected',
      'Filters such as journal, publication type, or year remove all matches'
    ],
    actions: [
      'Configure `PUBMED_API_KEY` for higher NCBI rate limits when needed.',
      'Remove filters and inspect PubMed query translation when a known topic returns zero results.',
      'Add `NCBI_EMAIL` and `NCBI_TOOL` for clearer NCBI client identification.'
    ]
  },
  {
    id: 'core',
    platform: 'core',
    capability: 'CORE search and OA full text discovery',
    tools: ['search_papers'],
    keyGroups: [],
    optionalKeyGroups: [['PAPER_SEARCH_CORE_API_KEY', 'CORE_API_KEY']],
    commonFailures: [
      'Unauthenticated requests may be rate-limited',
      'A configured key may be invalid; the CLI can fall back to unauthenticated search',
      'Repository records may not expose a PDF URL'
    ],
    actions: [
      'Configure `PAPER_SEARCH_CORE_API_KEY` or `CORE_API_KEY` for higher limits.',
      'If results are empty, retry through Europe PMC, PMC, OpenAIRE, or OpenAlex.',
      'Use DOI/title fallbacks for PDF discovery.'
    ]
  },
  {
    id: 'openaire',
    platform: 'openaire',
    capability: 'OpenAIRE discovery',
    tools: ['search_papers'],
    keyGroups: [],
    optionalKeyGroups: [['PAPER_SEARCH_OPENAIRE_API_KEY', 'OPENAIRE_API_KEY']],
    commonFailures: [
      'OpenAIRE can return sparse metadata for broad or ambiguous terms',
      'Rate limits or temporary service blocks may affect unauthenticated requests',
      'Direct PDF download is not supported by this CLI'
    ],
    actions: [
      'Configure `PAPER_SEARCH_OPENAIRE_API_KEY` or `OPENAIRE_API_KEY` if your OpenAIRE account requires it.',
      'Use OpenAlex, Crossref, Europe PMC, or CORE as companion sources.',
      'Use returned DOI or URL with `download_with_fallback` for retrieval.'
    ]
  },
  {
    id: 'crossref',
    platform: 'crossref',
    capability: 'Crossref polite pool contact',
    tools: ['search_crossref', 'search_papers'],
    keyGroups: [],
    optionalKeyGroups: [['CROSSREF_MAILTO']],
    commonFailures: [
      'No mailto is configured, so requests may not receive polite-pool treatment',
      'Crossref metadata may be incomplete for older or non-DOI records'
    ],
    actions: [
      'Set `CROSSREF_MAILTO` to a real email for polite-pool usage.',
      'Use OpenAlex or Semantic Scholar to enrich incomplete Crossref results.'
    ]
  }
];

const DIRECT_TOOL_PLATFORM: Record<string, string> = {
  search_webofscience: 'webofscience',
  search_pubmed: 'pubmed',
  search_semantic_scholar: 'semantic',
  search_semantic_snippets: 'semantic',
  search_sciencedirect: 'sciencedirect',
  search_springer: 'springer',
  search_scopus: 'scopus',
  search_wiley: 'wiley',
  search_crossref: 'crossref',
  search_core: 'core',
  search_openaire: 'openaire'
};

export function getRequirementStatus(): RequirementStatus[] {
  return API_REQUIREMENTS.map(requirement => {
    const configuredGroups = requirement.keyGroups.filter(group => isKeyGroupConfigured(group));
    const missingGroups = requirement.keyGroups.filter(group => !isKeyGroupConfigured(group));
    return {
      ...requirement,
      configured: missingGroups.length === 0,
      configuredGroups,
      missingGroups
    };
  });
}

export function diagnoseToolResult(context: ToolResultContext): Diagnostic | undefined {
  const data = context.data;

  if (isMultiSourceResult(data)) {
    const errorEntries = Object.entries(data.errors || {});
    if (errorEntries.length > 0) {
      return diagnosePartialFailure(context, errorEntries);
    }
    if (data.total === 0) {
      return zeroResultDiagnostic({ ...context, platform: 'multiple sources' });
    }
    return undefined;
  }

  if (Array.isArray(data) && data.length === 0) {
    return zeroResultDiagnostic(context);
  }

  return undefined;
}

export function diagnoseError(error: any, context: DiagnosticContext = {}): Diagnostic | undefined {
  const message = String(error?.message || error || '');
  const status = error?.status || error?.response?.status;
  const platform = normalizePlatform(context.platform || platformFromTool(context.tool));
  const requirement = requirementForPlatform(platform);
  const relatedConfigKeys = requirement ? flattenKeyGroups([...requirement.keyGroups, ...(requirement.optionalKeyGroups || [])]) : [];
  const configured = requirement ? requirement.keyGroups.every(isKeyGroupConfigured) : true;

  if (/not configured|api key is required|api key.*required/i.test(message) || (!configured && [401, 403].includes(status))) {
    return {
      severity: 'error',
      category: 'missing_config',
      platform,
      tool: context.tool,
      summary: `${displayPlatform(platform)} needs configuration before this capability can run.`,
      likelyCauses: [
        'Required credential is missing from environment, .env, or user config.',
        'The CLI process was started before the user config was loaded.'
      ],
      actions: [
        'Run `paper-search config doctor --pretty`.',
        ...missingKeyActions(requirement),
        'After setting credentials, rerun the same minimal command.'
      ],
      relatedConfigKeys
    };
  }

  if (/does not have permission|not authorized|requested view|requested.*fields|entitlement/i.test(message)) {
    return {
      severity: 'error',
      category: 'permission',
      platform,
      tool: context.tool,
      summary: `${displayPlatform(platform)} authenticated the key, but the key is not entitled for this API product, view, or resource.`,
      likelyCauses: [
        requirement?.productAccess ? `The developer account is missing ${requirement.productAccess}.` : 'The API product is not enabled for this key.',
        'The request asks for a premium view, field set, or restricted resource.',
        'Institutional entitlement is different from developer API entitlement.'
      ],
      actions: [
        ...platformActions(platform),
        'If another platform with the same key works, treat this as product entitlement rather than a global key failure.',
        'Use Crossref, OpenAlex, Semantic Scholar, PubMed, Europe PMC, PMC, CORE, or OpenAIRE as fallbacks while access is unavailable.'
      ],
      relatedConfigKeys
    };
  }

  if (status === 401 || /invalid or missing api key|authentication failed|unauthorized/i.test(message)) {
    return {
      severity: 'error',
      category: 'invalid_key',
      platform,
      tool: context.tool,
      summary: `${displayPlatform(platform)} rejected the API key.`,
      likelyCauses: [
        'The key is wrong, expired, disabled, copied with extra whitespace, or belongs to a different provider.',
        'The provider expects a different key for this endpoint.',
        'The credential is configured under the wrong variable name.'
      ],
      actions: [
        'Run `paper-search config doctor --pretty` and verify the relevant key is configured.',
        ...platformActions(platform),
        'Regenerate the key in the provider developer portal if the minimal command still returns 401.'
      ],
      relatedConfigKeys
    };
  }

  if (status === 403 || /forbidden|access denied/i.test(message)) {
    return {
      severity: 'error',
      category: 'permission',
      platform,
      tool: context.tool,
      summary: `${displayPlatform(platform)} refused access to this request.`,
      likelyCauses: [
        'The API key lacks the selected product, endpoint, or filter entitlement.',
        'The request uses a premium filter or product field.',
        'The provider may require a subscribed account, approved project, or institution-linked entitlement.'
      ],
      actions: [
        ...platformActions(platform),
        'Remove optional filters such as year, subject, author, journal, view, and openAccess; then retry.',
        'Check the provider dashboard for product access and quota status.'
      ],
      relatedConfigKeys
    };
  }

  if (status === 400 || /bad request|invalid syntax|not valid|unsupported/i.test(message)) {
    return {
      severity: 'warning',
      category: 'query_or_filter',
      platform,
      tool: context.tool,
      summary: `${displayPlatform(platform)} rejected the query or one of the selected parameters.`,
      likelyCauses: [
        'The query uses provider-specific syntax incorrectly.',
        'A sort field, field tag, date range, or filter is unsupported by this API product.',
        'A CLI option maps to an endpoint feature that this account or endpoint does not accept.'
      ],
      actions: [
        'Retry a minimal query such as `machine learning` with `--max-results 1`.',
        'Remove year, author, journal, subject, document type, and sort options; then add them back one at a time.',
        ...platformActions(platform)
      ],
      relatedConfigKeys
    };
  }

  if (status === 429 || /rate limit|too many requests|quota/i.test(message)) {
    return {
      severity: 'warning',
      category: 'rate_limit',
      platform,
      tool: context.tool,
      summary: `${displayPlatform(platform)} rate limit or quota was reached.`,
      likelyCauses: [
        'Too many requests were sent in a short time.',
        'The account daily quota is exhausted.',
        'Optional API key or contact configuration is missing for higher limits.'
      ],
      actions: [
        'Wait and retry with a smaller `--max-results`.',
        'Run `paper-search config doctor --pretty` to check optional rate-limit keys.',
        ...platformActions(platform)
      ],
      relatedConfigKeys
    };
  }

  if (/timed out|timeout|etimedout|econnaborted/i.test(message)) {
    return {
      severity: 'warning',
      category: 'timeout',
      platform,
      tool: context.tool,
      summary: `${displayPlatform(platform)} timed out and was skipped so the remaining sources could continue.`,
      likelyCauses: [
        'The provider API is temporarily slow or unavailable.',
        'The query triggered a slow provider-side lookup.',
        'Network latency or proxy routing delayed this platform.'
      ],
      actions: [
        'Retry this provider alone with `--max-results 1` if it is important.',
        'Use faster fallback sources such as Crossref, OpenAlex, PubMed, Europe PMC, CORE, or Unpaywall.',
        ...platformActions(platform)
      ],
      relatedConfigKeys
    };
  }

  return undefined;
}

export function diagnosticContextFromCli(command: string, positionals: string[], flags: Record<string, unknown>): DiagnosticContext {
  if (command === 'search') {
    return {
      tool: 'search_papers',
      platform: typeof flags.platform === 'string' ? flags.platform : undefined,
      sources: typeof flags.sources === 'string' ? flags.sources : undefined
    };
  }
  if (command === 'run') {
    return {
      tool: positionals[0],
      platform: typeof flags.platform === 'string' ? flags.platform : undefined,
      sources: typeof flags.sources === 'string' ? flags.sources : undefined
    };
  }
  if (command === 'download') {
    return {
      tool: 'download_paper',
      platform: typeof flags.platform === 'string' ? flags.platform : undefined
    };
  }
  return {};
}

function diagnosePartialFailure(
  context: ToolResultContext,
  errorEntries: Array<[string, string]>
): Diagnostic {
  const platforms = errorEntries.map(([source]) => source);
  const actions = new Set<string>(['Inspect the `errors` object in the output for provider-specific messages.']);
  const relatedKeys = new Set<string>();

  for (const [source, message] of errorEntries) {
    const diagnostic = diagnoseError({ message }, { ...context, platform: source });
    diagnostic?.actions.forEach(action => actions.add(action));
    diagnostic?.relatedConfigKeys.forEach(key => relatedKeys.add(key));
  }

  return {
    severity: 'warning',
    category: 'partial_failure',
    platform: platforms.join(','),
    tool: context.tool,
    summary: `Some requested sources failed: ${platforms.join(', ')}.`,
    likelyCauses: errorEntries.map(([source, message]) => `${source}: ${message}`),
    actions: Array.from(actions).slice(0, 6),
    relatedConfigKeys: Array.from(relatedKeys)
  };
}

function zeroResultDiagnostic(context: ToolResultContext): Diagnostic | undefined {
  const platform = normalizePlatform(context.platform || platformFromTool(context.tool) || platformFromArgs(context.args));
  const requirement = requirementForPlatform(platform);
  const relatedConfigKeys = requirement ? flattenKeyGroups([...requirement.keyGroups, ...(requirement.optionalKeyGroups || [])]) : [];
  const requiredConfigured = requirement ? requirement.keyGroups.every(isKeyGroupConfigured) : true;

  if (!requirement && platform !== 'multiple sources') {
    return undefined;
  }

  const likelyCauses = [
    'The query or filters may be too narrow for this provider.',
    'The provider may not index this topic, DOI, or document type.',
    'Some providers return empty results instead of a clear entitlement or filter error.'
  ];

  if (!requiredConfigured) {
    likelyCauses.unshift('Required API configuration is missing.');
  } else if (relatedConfigKeys.length > 0) {
    likelyCauses.unshift('The key is configured, so zero results are more likely caused by query scope, filters, product coverage, or provider indexing.');
  }

  return {
    severity: requiredConfigured ? 'info' : 'warning',
    category: requiredConfigured ? 'zero_results' : 'missing_config',
    platform,
    tool: context.tool,
    summary: requiredConfigured
      ? `${displayPlatform(platform)} returned zero results; the key configuration alone appears present, so inspect query scope, filters, and product coverage.`
      : `${displayPlatform(platform)} returned zero results and required configuration is missing.`,
    likelyCauses,
    actions: [
      'Retry a minimal broad query with `--max-results 1`.',
      'Remove optional filters such as year, author, journal, subject, document type, and openAccess.',
      'Run `paper-search config doctor --pretty`.',
      ...missingKeyActions(requirement),
      ...platformActions(platform),
      'Cross-check the same query with Crossref, OpenAlex, Semantic Scholar, PubMed, Europe PMC, or Google Scholar.'
    ].filter((action, index, actions) => actions.indexOf(action) === index).slice(0, 8),
    relatedConfigKeys
  };
}

function platformFromArgs(args?: Record<string, unknown>): string | undefined {
  const platform = args?.platform;
  return typeof platform === 'string' ? platform : undefined;
}

function platformFromTool(tool?: string): string | undefined {
  if (!tool) return undefined;
  return DIRECT_TOOL_PLATFORM[tool];
}

function normalizePlatform(platform?: string): string | undefined {
  if (!platform) return undefined;
  const normalized = platform.toLowerCase();
  if (normalized === 'wos') return 'webofscience';
  if (normalized === 'scholar') return 'googlescholar';
  if (normalized === 'google_scholar') return 'googlescholar';
  if (normalized === 'europe_pmc') return 'europepmc';
  if (normalized === 'pubmed_central') return 'pmc';
  return normalized;
}

function requirementForPlatform(platform?: string): ApiRequirement | undefined {
  if (!platform) return undefined;
  return API_REQUIREMENTS.find(requirement => requirement.platform === platform);
}

function isMultiSourceResult(data: unknown): data is { total: number; errors?: Record<string, string> } {
  return Boolean(
    data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'total' in data &&
      'source_results' in data
  );
}

function isKeyGroupConfigured(group: string[]): boolean {
  if (group.length === 0) return true;
  return group.some(key => Boolean(process.env[key]));
}

function missingKeyActions(requirement?: ApiRequirement): string[] {
  if (!requirement) return [];
  return requirement.keyGroups
    .filter(group => !isKeyGroupConfigured(group))
    .map(group => `Set ${group.join(' or ')} with \`paper-search config set KEY VALUE\`.`);
}

function platformActions(platform?: string): string[] {
  const requirement = requirementForPlatform(platform);
  return requirement?.actions || [];
}

function flattenKeyGroups(groups: string[][]): string[] {
  return groups.flat().filter((key, index, keys) => keys.indexOf(key) === index);
}

function displayPlatform(platform?: string): string {
  if (!platform) return 'This provider';
  if (platform === 'webofscience') return 'Web of Science';
  if (platform === 'sciencedirect') return 'ScienceDirect';
  if (platform === 'semantic') return 'Semantic Scholar';
  if (platform === 'multiple sources') return 'The selected sources';
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}
