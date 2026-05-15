import { describe, expect, it } from '@jest/globals';
import { handleToolCall } from '../../src/core/handleToolCall.js';
import { PaperFactory } from '../../src/models/Paper.js';

function responseData(response: any): any {
  const text = response.content[0].text;
  const start = text.indexOf('{');
  return JSON.parse(text.slice(start));
}

describe('handleToolCall', () => {
  describe('get_paper_by_doi all', () => {
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
