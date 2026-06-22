import { describe, expect, it } from '@jest/globals';
import { initializeSearchers } from '../../src/core/searchers.js';

describe('initializeSearchers', () => {
  it('instantiates Wiley as a download-only platform from the registry', () => {
    const searchers = initializeSearchers();

    expect(searchers.wiley).toBeDefined();
    expect(searchers.wiley.getCapabilities()).toEqual(
      expect.objectContaining({
        search: false,
        download: true,
        requiresApiKey: true
      })
    );
  });

  it('keeps registry generic platforms and aliases available through the searcher map', () => {
    const searchers = initializeSearchers();

    expect(searchers.wos).toBe(searchers.webofscience);
    expect(searchers.springerlink).toBe(searchers.springer);
    expect(searchers.dblp).toBeDefined();
    expect(searchers.ieee).toBeDefined();
    expect(searchers.acm).toBeDefined();
    expect(searchers.usenix).toBeDefined();
    expect(searchers.openreview).toBeDefined();
  });
});
