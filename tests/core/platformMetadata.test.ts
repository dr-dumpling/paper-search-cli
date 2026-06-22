import { describe, expect, it } from '@jest/globals';
import {
  getCapabilityProfileConfigKeysBySource,
  getCapabilityProfileSources,
  getDefaultAllSources,
  getDoiLookupSources,
  getGenericPlatformToolDescriptors,
  getGenericSearchToolPlatform,
  getGenericSearchToolNames,
  getPlatformMetadata,
  getPlatformToolDescriptors,
  getRepositoryFallbackSources,
  isKnownSearchPlatform,
  resolvePlatformId
} from '../../src/registry/platformMetadata.js';

describe('platformMetadata', () => {
  it('resolves platform aliases without adding duplicate platform identities', () => {
    expect(resolvePlatformId('springerlink')).toBe('springer');
    expect(resolvePlatformId('google_scholar')).toBe('googlescholar');
    expect(resolvePlatformId('scholar')).toBe('googlescholar');
    expect(resolvePlatformId('wos')).toBe('webofscience');
    expect(resolvePlatformId('pubmed_central')).toBe('pmc');
    expect(resolvePlatformId('europe_pmc')).toBe('europepmc');
  });

  it('recognizes newly registered search platforms', () => {
    expect(isKnownSearchPlatform('dblp')).toBe(true);
    expect(isKnownSearchPlatform('ieee')).toBe(true);
    expect(isKnownSearchPlatform('acm')).toBe(true);
    expect(isKnownSearchPlatform('usenix')).toBe(true);
    expect(isKnownSearchPlatform('openreview')).toBe(true);
    expect(isKnownSearchPlatform('springerlink')).toBe(true);
    expect(isKnownSearchPlatform('wiley')).toBe(true);
  });

  it('registers Wiley as a download-only entitled platform', () => {
    expect(getPlatformMetadata('wiley')).toEqual(
      expect.objectContaining({
        id: 'wiley',
        displayName: 'Wiley TDM',
        defaultInAll: false,
        schemaKind: 'wiley-deprecated',
        capabilityGroups: ['pdf_discovery', 'entitled_access'],
        configKeys: [['WILEY_TDM_TOKEN']]
      })
    );
  });

  it('maps generic direct search tools to platforms', () => {
    expect(getGenericSearchToolPlatform('search_dblp')).toBe('dblp');
    expect(getGenericSearchToolPlatform('search_ieee')).toBe('ieee');
    expect(getGenericSearchToolPlatform('search_acm')).toBe('acm');
    expect(getGenericSearchToolPlatform('search_usenix')).toBe('usenix');
    expect(getGenericSearchToolPlatform('search_openreview')).toBe('openreview');
    expect(getGenericSearchToolPlatform('search_springerlink')).toBe('springerlink');
  });

  it('keeps aliases out of default all sources', () => {
    expect(getDefaultAllSources()).not.toEqual(
      expect.arrayContaining(['wos', 'scholar', 'google_scholar', 'springerlink', 'pubmed_central', 'europe_pmc'])
    );
    expect(getDefaultAllSources()).not.toContain('wiley');
  });

  it('derives repository fallback sources without changing order or tier boundaries', () => {
    expect(getRepositoryFallbackSources()).toEqual(['pmc', 'europepmc', 'core', 'openaire']);
    expect(getRepositoryFallbackSources()).not.toEqual(expect.arrayContaining(['unpaywall', 'wiley', 'scihub']));
  });

  it('derives DOI lookup sources without silently adding unsupported all-source platforms', () => {
    expect(getDoiLookupSources()).toEqual([
      'crossref',
      'openalex',
      'unpaywall',
      'pubmed',
      'pmc',
      'europepmc',
      'core',
      'webofscience',
      'arxiv'
    ]);
    expect(getDoiLookupSources()).not.toEqual(expect.arrayContaining(['semantic', 'wiley']));
  });

  it('derives capability profile source groups while preserving virtual source names', () => {
    expect(getCapabilityProfileSources('metadata_free')).toEqual([
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
    ]);
    expect(getCapabilityProfileSources('metadata_entitled')).toEqual([
      'webofscience',
      'sciencedirect',
      'springer',
      'scopus',
      'ieee'
    ]);
    expect(getCapabilityProfileSources('pdf_open_access')).toEqual([
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
    ]);
    expect(getCapabilityProfileSources('pdf_entitled')).toEqual([
      'webofscience',
      'sciencedirect',
      'scopus',
      'springer',
      'ieee',
      'wiley_tdm'
    ]);
    expect(getCapabilityProfileSources('pdf_scihub')).toEqual(['scihub']);
  });

  it('derives capability profile config keys for entitled sources', () => {
    expect(getCapabilityProfileConfigKeysBySource(['pdf_entitled'])).toEqual({
      webofscience: ['WOS_API_KEY'],
      sciencedirect: ['ELSEVIER_API_KEY'],
      scopus: ['ELSEVIER_API_KEY'],
      springer: ['SPRINGER_API_KEY'],
      ieee: ['IEEE_API_KEY'],
      wiley_tdm: ['WILEY_TDM_TOKEN']
    });
  });

  it('separates direct platform descriptors from generic descriptors', () => {
    expect(getPlatformToolDescriptors().map(platform => platform.toolName)).toEqual([
      'search_dblp',
      'search_ieee',
      'search_acm',
      'search_usenix',
      'search_openreview'
    ]);
    expect(getGenericPlatformToolDescriptors().map(platform => platform.toolName)).toEqual([
      'search_dblp',
      'search_ieee',
      'search_acm',
      'search_usenix',
      'search_openreview'
    ]);
    expect(getGenericSearchToolNames()).toEqual([
      'search_dblp',
      'search_ieee',
      'search_acm',
      'search_usenix',
      'search_openreview',
      'search_springerlink'
    ]);
    expect(getGenericSearchToolNames()).not.toContain('search_wiley');
  });
});
