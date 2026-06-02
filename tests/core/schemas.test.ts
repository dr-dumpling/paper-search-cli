import { afterEach, describe, expect, it } from '@jest/globals';
import { parseToolArgs } from '../../src/core/schemas.js';

describe('schemas', () => {
  const originalCoreCap = process.env.CORE_MAX_RESULTS_CAP;

  afterEach(() => {
    if (originalCoreCap === undefined) delete process.env.CORE_MAX_RESULTS_CAP;
    else process.env.CORE_MAX_RESULTS_CAP = originalCoreCap;
  });

  it('keeps CORE maxResults capped at 100 by default', () => {
    delete process.env.CORE_MAX_RESULTS_CAP;

    expect(() => parseToolArgs('search_core', { query: 'machine learning', maxResults: 101 })).toThrow(
      'CORE maxResults must be less than or equal to 100'
    );
  });

  it('allows users to raise the CORE maxResults cap up to the hard limit', () => {
    process.env.CORE_MAX_RESULTS_CAP = '300';

    expect(parseToolArgs('search_core', { query: 'machine learning', maxResults: 300 })).toEqual({
      query: 'machine learning',
      maxResults: 300
    });
    expect(() => parseToolArgs('search_core', { query: 'machine learning', maxResults: 301 })).toThrow(
      'CORE maxResults must be less than or equal to 300'
    );
  });

  it('applies the CORE cap to the generic search command when platform is core', () => {
    process.env.CORE_MAX_RESULTS_CAP = '300';

    expect(parseToolArgs('search_papers', { query: 'machine learning', platform: 'core', maxResults: 300 })).toEqual(
      expect.objectContaining({
        query: 'machine learning',
        platform: 'core',
        maxResults: 300
      })
    );
    expect(() => parseToolArgs('search_papers', { query: 'machine learning', platform: 'crossref', maxResults: 300 })).toThrow(
      'Number must be less than or equal to 100'
    );
  });

  it('clamps CORE_MAX_RESULTS_CAP to the hard maximum', () => {
    process.env.CORE_MAX_RESULTS_CAP = '9999';

    expect(parseToolArgs('search_core', { query: 'machine learning', maxResults: 500 })).toEqual({
      query: 'machine learning',
      maxResults: 500
    });
    expect(() => parseToolArgs('search_core', { query: 'machine learning', maxResults: 501 })).toThrow(
      'CORE maxResults must be less than or equal to 500'
    );
  });
});
