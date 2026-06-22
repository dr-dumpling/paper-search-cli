import { CONFIG_KEYS, listConfigEntries } from '../config/index.js';
import {
  getCapabilityProfileConfigKeysBySource,
  getCapabilityProfileSources
} from '../../registry/platformMetadata.js';

export type CapabilityStatus = 'available' | 'degraded' | 'unavailable';

export interface CapabilityEntry {
  id:
    | 'metadata_search'
    | 'citation_expansion'
    | 'body_snippet_search'
    | 'journal_metrics'
    | 'pdf_discovery'
    | 'entitled_access';
  status: CapabilityStatus;
  reason: string;
  configured: string[];
  missing: string[];
  sourceGroups?: Record<string, string[]>;
  requiredKeys?: string[];
  optionalKeys?: string[];
}

export interface CapabilityProfile {
  ok: boolean;
  entries: CapabilityEntry[];
  summary: Record<string, CapabilityStatus>;
}

const METADATA_FREE_SOURCES = getCapabilityProfileSources('metadata_free');
const METADATA_ENTITLED_SOURCES = getCapabilityProfileSources('metadata_entitled');
const OPEN_ACCESS_SOURCES = getCapabilityProfileSources('pdf_open_access');
const ENTITLED_ACCESS_SOURCES = getCapabilityProfileSources('pdf_entitled');
const SCIHUB_SOURCES = getCapabilityProfileSources('pdf_scihub');

const ENTITLED_KEY_BY_SOURCE = getCapabilityProfileConfigKeysBySource(['pdf_entitled']);

export function buildCapabilityProfile(): CapabilityProfile {
  const configuredKeys = configuredConfigKeys();
  const entries: CapabilityEntry[] = [
    metadataSearchEntry(configuredKeys),
    citationExpansionEntry(),
    bodySnippetSearchEntry(configuredKeys),
    journalMetricsEntry(configuredKeys),
    pdfDiscoveryEntry(configuredKeys),
    entitledAccessEntry(configuredKeys)
  ];
  return {
    ok: entries.some(entry => entry.status === 'available' || entry.status === 'degraded'),
    entries,
    summary: Object.fromEntries(entries.map(entry => [entry.id, entry.status])) as CapabilityProfile['summary']
  };
}

function metadataSearchEntry(configuredKeys: Set<string>): CapabilityEntry {
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

function citationExpansionEntry(): CapabilityEntry {
  return {
    id: 'citation_expansion',
    status: 'available',
    reason: 'Semantic Scholar Graph API citation expansion is available; SEMANTIC_SCHOLAR_API_KEY is optional for higher quota.',
    configured: ['semantic_scholar_graph'],
    missing: [],
    sourceGroups: {
      citation_sources: ['semantic_scholar_graph']
    },
    optionalKeys: ['SEMANTIC_SCHOLAR_API_KEY']
  };
}

function bodySnippetSearchEntry(configuredKeys: Set<string>): CapabilityEntry {
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

function journalMetricsEntry(configuredKeys: Set<string>): CapabilityEntry {
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

function pdfDiscoveryEntry(configuredKeys: Set<string>): CapabilityEntry {
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

function entitledAccessEntry(configuredKeys: Set<string>): CapabilityEntry {
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

function configuredConfigKeys(): Set<string> {
  return new Set(listConfigEntries(false).filter(entry => entry.configured).map(entry => entry.key));
}

function keysConfigured(configuredKeys: Set<string>, keys: string[]): boolean {
  return keys.length > 0 && keys.some(key => configuredKeys.has(key));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(key => (CONFIG_KEYS as readonly string[]).includes(key)))];
}
