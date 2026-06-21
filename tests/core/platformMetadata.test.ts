import { describe, expect, it } from '@jest/globals';
import {
  getDefaultAllSources,
  getGenericPlatformToolDescriptors,
  getGenericSearchToolPlatform,
  getGenericSearchToolNames,
  getPlatformToolDescriptors,
  isKnownSearchPlatform,
  resolvePlatformId
} from '../../src/core/platformMetadata.js';

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
  });
});
