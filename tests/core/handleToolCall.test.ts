import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { handleToolCall, TOOL_HANDLER_NAMES } from '../../src/core/handleToolCall.js';
import { getGenericSearchToolPlatform } from '../../src/registry/platformMetadata.js';
import { TOOLS } from '../../src/core/tools.js';
import { PaperFactory } from '../../src/models/Paper.js';
import CitationService from '../../src/capabilities/citation-expansion/CitationService.js';

function responseData(response: any): any {
  const text = response.content[0].text;
  const start = text.indexOf('{');
  return JSON.parse(text.slice(start));
}

describe('handleToolCall', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('tool routing', () => {
    it('keeps every non-generic tool wired to the explicit handler map', () => {
      const nonGenericToolNames = TOOLS
        .map(tool => tool.name)
        .filter(toolName => !getGenericSearchToolPlatform(toolName))
        .sort();

      expect(TOOL_HANDLER_NAMES).toEqual(nonGenericToolNames);
    });

    it('keeps generic registry tools outside the explicit handler map', () => {
      expect(getGenericSearchToolPlatform('search_dblp')).toBe('dblp');
      expect(getGenericSearchToolPlatform('search_springerlink')).toBe('springerlink');
      expect(TOOL_HANDLER_NAMES).not.toContain('search_dblp');
      expect(TOOL_HANDLER_NAMES).not.toContain('search_springerlink');
    });
  });

  describe('download_paper fallback', () => {
    it('routes Wiley downloads to the native Wiley TDM downloader when present', async () => {
      const downloadPdf = jest.fn(async () => '/tmp/wiley.pdf');
      const searchers = {
        wiley: {
          getCapabilities: () => ({ download: true }),
          downloadPdf
        },
        scihub: {
          downloadPdf: jest.fn()
        }
      } as any;

      const response = await handleToolCall(
        'download_paper',
        { paperId: '10.1002/example', platform: 'wiley', savePath: './downloads' },
        searchers
      );

      expect(response.content[0].text).toContain('PDF downloaded successfully to: /tmp/wiley.pdf');
      expect(downloadPdf).toHaveBeenCalledWith('10.1002/example', { savePath: './downloads' });
      expect(searchers.scihub.downloadPdf).not.toHaveBeenCalled();
    });

    it('keeps Wiley primary failures out of the unsupported-platform path', async () => {
      const downloadPdf = jest.fn(async () => {
        throw new Error('Wiley TDM token is required. Set WILEY_TDM_TOKEN environment variable.');
      });
      const searchers = {
        wiley: {
          getCapabilities: () => ({ download: true }),
          downloadPdf
        },
        scihub: {
          downloadPdf: async () => '/tmp/fallback.pdf'
        }
      } as any;

      const response = await handleToolCall(
        'download_paper',
        { paperId: '10.1002/example', platform: 'wiley', savePath: './downloads' },
        searchers
      );
      const text = response.content[0].text;
      const data = responseData(response);

      expect(text).not.toContain('Unsupported platform for download: wiley');
      expect(text).toContain('Primary download failed; PDF downloaded successfully via fallback');
      expect(downloadPdf).toHaveBeenCalledWith('10.1002/example', { savePath: './downloads' });
      expect(data.attempts).toContainEqual(
        expect.objectContaining({
          stage: 'primary',
          status: 'error',
          message: expect.stringContaining('Wiley TDM token is required')
        })
      );
    });

    it('routes unsupported platform downloads through the fallback funnel including Sci-Hub', async () => {
      const searchers = {
        crossref: {
          getCapabilities: () => ({ download: false }),
          getPaperByDoi: async () => null
        },
        scihub: {
          downloadPdf: async () => '/tmp/fallback.pdf'
        }
      } as any;

      const response = await handleToolCall(
        'download_paper',
        { paperId: '10.1000/example', platform: 'crossref', savePath: './downloads' },
        searchers
      );
      const text = response.content[0].text;
      const data = responseData(response);

      expect(text).toContain('PDF downloaded successfully via fallback');
      expect(data.status).toBe('ok');
      expect(data.path).toBe('/tmp/fallback.pdf');
      expect(data.attempts.map((attempt: any) => attempt.stage)).toContain('scihub');
    });
  });

  describe('citation expansion tools', () => {
    it('returns citing papers from CitationService', async () => {
      const citation = {
        paperId: 'citing-1',
        title: 'Citing Paper',
        citationCount: 12,
        referenceCount: 34,
        year: 2024,
        authors: [{ name: 'A. Author' }],
        venue: 'Test Venue',
        doi: '10.1000/citing',
        url: 'https://www.semanticscholar.org/paper/citing-1'
      };
      const getCitations = jest.spyOn(CitationService.prototype, 'getCitations').mockResolvedValue([citation]);

      const response = await handleToolCall(
        'get_paper_citations',
        { doi: '10.1000/example', limit: 5 },
        {} as any
      );
      const data = responseData(response);

      expect(getCitations).toHaveBeenCalledWith('DOI:10.1000/example', 5);
      expect(data).toEqual({
        target: 'DOI:10.1000/example',
        relation: 'citations',
        provider: 'semantic_scholar',
        total: 1,
        papers: [citation]
      });
    });

    it('returns cited references from CitationService', async () => {
      const reference = {
        paperId: 'reference-1',
        title: 'Reference Paper',
        citationCount: 7,
        referenceCount: 21,
        year: 2020,
        authors: [{ name: 'B. Author' }],
        venue: 'Reference Venue',
        doi: '10.1000/reference',
        url: 'https://www.semanticscholar.org/paper/reference-1'
      };
      const getReferences = jest.spyOn(CitationService.prototype, 'getReferences').mockResolvedValue([reference]);

      const response = await handleToolCall(
        'get_paper_references',
        { arxivId: '2401.00001', limit: 2 },
        {} as any
      );
      const data = responseData(response);

      expect(getReferences).toHaveBeenCalledWith('ARXIV:2401.00001', 2);
      expect(data.relation).toBe('references');
      expect(data.provider).toBe('semantic_scholar');
      expect(data.total).toBe(1);
      expect(data.papers).toEqual([reference]);
    });

    it('uses paperId before doi and arxivId when multiple citation identifiers are present', async () => {
      const getCitations = jest.spyOn(CitationService.prototype, 'getCitations').mockResolvedValue([]);

      await handleToolCall(
        'get_paper_citations',
        {
          paperId: 'semantic-paper-id',
          doi: '10.1000/example',
          arxivId: '2401.00001',
          limit: 3
        },
        {} as any
      );

      expect(getCitations).toHaveBeenCalledWith('semantic-paper-id', 3);
    });
  });

  describe('get_paper_by_doi all', () => {
    it('keeps DOI all-source lookup order derived from registry without adding semantic or Wiley', async () => {
      const calls: string[] = [];
      const lookupSource = (source: string) => ({
        getPaperByDoi: async () => {
          calls.push(source);
          return null;
        }
      });
      const searchers = Object.fromEntries(
        [
          'crossref',
          'openalex',
          'unpaywall',
          'pubmed',
          'pmc',
          'europepmc',
          'core',
          'webofscience',
          'arxiv',
          'semantic',
          'wiley'
        ].map(source => [source, lookupSource(source)])
      ) as any;

      const response = await handleToolCall(
        'get_paper_by_doi',
        { doi: '10.1000/example', platform: 'all' },
        searchers
      );
      const data = responseData(response);

      expect(data.sources_used).toEqual([
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
      expect(calls).toEqual(data.sources_used);
      expect(data.sources_used).not.toEqual(expect.arrayContaining(['semantic', 'wiley']));
    });

    it('skips failed sources and reports warnings without failing the whole lookup', async () => {
      const matchingPaper = PaperFactory.create({
        paperId: '10.1000/example',
        title: 'Matched DOI',
        doi: '10.1000/example',
        source: 'crossref'
      });
      const wrongPaper = PaperFactory.create({
        paperId: 'openalex-1',
        title: 'Wrong DOI',
        doi: '10.1000/wrong',
        source: 'openalex'
      });
      const searchers = {
        crossref: {
          getPaperByDoi: async () => matchingPaper
        },
        openalex: {
          getPaperByDoi: async () => wrongPaper
        },
        pubmed: {
          getPaperByDoi: async () => {
            throw new Error('PubMed temporary failure');
          }
        }
      } as any;

      const response = await handleToolCall(
        'get_paper_by_doi',
        { doi: '10.1000/example', platform: 'all' },
        searchers
      );
      const data = responseData(response);

      expect(data.total).toBe(1);
      expect(data.papers[0].source).toBe('crossref');
      expect(data.source_results.crossref).toBe(1);
      expect(data.source_results.openalex).toBe(0);
      expect(data.source_results.pubmed).toBe(0);
      expect(data.failed_sources).toEqual(['openalex', 'pubmed']);
      expect(data.errors.openalex).toContain('did not match requested DOI');
      expect(data.errors.pubmed).toContain('temporary failure');
      expect(data.warnings).toHaveLength(2);
    });
  });
});
