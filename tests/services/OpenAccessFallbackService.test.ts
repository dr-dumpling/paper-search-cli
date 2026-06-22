import { describe, expect, it, jest } from '@jest/globals';
import {
  createDefaultDownloadTiers,
  downloadWithFallback,
  INSTITUTIONAL_ACCESS_TIER_ID,
  insertDownloadTierBefore,
  type DownloadTier
} from '../../src/capabilities/pdf-discovery/OpenAccessFallbackService.js';

describe('OpenAccessFallbackService', () => {
  it('uses Sci-Hub as the final fallback by default', async () => {
    const scihubDownload = jest.fn(async () => '/tmp/paper.pdf');
    const searchers = {
      crossref: {
        getCapabilities: () => ({ download: false }),
        getPaperByDoi: async () => null
      },
      scihub: {
        downloadPdf: scihubDownload
      }
    } as any;

    const result = await downloadWithFallback(searchers, {
      source: 'crossref',
      paperId: '10.1000/example',
      doi: '10.1000/example'
    });

    expect(result.status).toBe('ok');
    expect(result.path).toBe('/tmp/paper.pdf');
    expect(scihubDownload).toHaveBeenCalledWith('10.1000/example', { savePath: './downloads' });
    expect(result.attempts.map(attempt => attempt.stage)).toEqual([
      'primary',
      'direct_pdf_url',
      'repositories',
      'unpaywall',
      'scihub'
    ]);
    expect(result.attempts.map(attempt => attempt.stage)).not.toContain(INSTITUTIONAL_ACCESS_TIER_ID);
    for (const attempt of result.attempts) {
      expect(Object.keys(attempt)).toEqual(['stage', 'status', 'message']);
    }
  });

  it('allows callers to suppress the Sci-Hub fallback explicitly', async () => {
    const scihubDownload = jest.fn(async () => '/tmp/paper.pdf');
    const searchers = {
      crossref: {
        getCapabilities: () => ({ download: false }),
        getPaperByDoi: async () => null
      },
      scihub: {
        downloadPdf: scihubDownload
      }
    } as any;

    const result = await downloadWithFallback(searchers, {
      source: 'crossref',
      paperId: '10.1000/example',
      doi: '10.1000/example',
      useSciHub: false
    });

    expect(result.status).toBe('error');
    expect(scihubDownload).not.toHaveBeenCalled();
    expect(result.attempts).toContainEqual({
      stage: 'scihub',
      status: 'skipped',
      message: 'Sci-Hub fallback disabled by useSciHub=false.'
    });
    expect(result.attempts.map(attempt => attempt.stage)).toEqual([
      'primary',
      'direct_pdf_url',
      'repositories',
      'unpaywall',
      'scihub'
    ]);
  });

  it('allows callers to inject custom tiers without changing the public result shape', async () => {
    const customTier: DownloadTier = {
      id: 'custom',
      stage: 'custom',
      run: async () => ({ status: 'ok', path: '/tmp/custom.pdf', message: '/tmp/custom.pdf' })
    };

    const result = await downloadWithFallback(
      {} as any,
      {
        source: 'crossref',
        paperId: 'source-id'
      },
      [customTier]
    );

    expect(result).toEqual({
      status: 'ok',
      path: '/tmp/custom.pdf',
      attempts: [{ stage: 'custom', status: 'ok', message: '/tmp/custom.pdf' }]
    });
  });

  it('inserts future tiers before a named stage without mutating the original list', () => {
    const original = createDefaultDownloadTiers();
    const institutionalTier: DownloadTier = {
      id: INSTITUTIONAL_ACCESS_TIER_ID,
      stage: INSTITUTIONAL_ACCESS_TIER_ID,
      run: async () => ({ status: 'skipped', message: 'disabled' })
    };

    const inserted = insertDownloadTierBefore(original, 'scihub', institutionalTier);

    expect(original.map(tier => tier.stage)).toEqual([
      'primary',
      'direct_pdf_url',
      'repositories',
      'unpaywall',
      'scihub'
    ]);
    expect(inserted.map(tier => tier.stage)).toEqual([
      'primary',
      'direct_pdf_url',
      'repositories',
      'unpaywall',
      INSTITUTIONAL_ACCESS_TIER_ID,
      'scihub'
    ]);
  });

  it('uses doi before source-native paperId for direct metadata lookup', async () => {
    const getPaperByDoi = jest.fn(async () => null);
    const searchers = {
      crossref: {
        getCapabilities: () => ({ download: false }),
        getPaperByDoi
      },
      scihub: {
        downloadPdf: jest.fn()
      }
    } as any;

    await downloadWithFallback(searchers, {
      source: 'crossref',
      paperId: 'crossref-source-id',
      doi: '10.1000/example',
      useSciHub: false
    });

    expect(getPaperByDoi).toHaveBeenCalledWith('10.1000/example');
  });

  it('skips Unpaywall cleanly when the searcher is unavailable', async () => {
    const searchers = {
      crossref: {
        getCapabilities: () => ({ download: false }),
        getPaperByDoi: async () => null
      },
      scihub: {
        downloadPdf: jest.fn()
      }
    } as any;

    const result = await downloadWithFallback(searchers, {
      source: 'crossref',
      paperId: 'source-id',
      doi: '10.1000/example',
      useSciHub: false
    });

    expect(result.attempts).toContainEqual({
      stage: 'unpaywall',
      status: 'skipped',
      message: 'Unpaywall searcher unavailable.'
    });
  });

  it('keeps repository discovery order separate from Unpaywall', async () => {
    const calls: string[] = [];
    const repositorySearcher = (source: string) => ({
      search: jest.fn(async () => {
        calls.push(source);
        return [];
      })
    });
    const searchers = {
      crossref: {
        getCapabilities: () => ({ download: false }),
        getPaperByDoi: async () => null
      },
      pmc: repositorySearcher('pmc'),
      europepmc: repositorySearcher('europepmc'),
      core: repositorySearcher('core'),
      openaire: repositorySearcher('openaire'),
      unpaywall: repositorySearcher('unpaywall')
    } as any;

    await downloadWithFallback(searchers, {
      source: 'crossref',
      paperId: 'source-id',
      title: 'repository discovery title',
      useSciHub: false
    });

    expect(calls).toEqual(['pmc', 'europepmc', 'core', 'openaire']);
  });
});
