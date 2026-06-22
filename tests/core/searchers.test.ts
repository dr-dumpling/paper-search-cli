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
});
