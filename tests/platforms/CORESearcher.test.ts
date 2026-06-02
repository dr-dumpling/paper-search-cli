import axios from 'axios';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { CORESearcher } from '../../src/platforms/CORESearcher.js';

describe('CORESearcher', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('paginates CORE results until maxResults is reached', async () => {
    const get = jest.fn(async (_path: string, options: any) => {
      const offset = Number(options.params.offset || 0);
      const totalForPage = offset >= 400 ? 0 : 25;
      return {
        status: 200,
        data: {
          totalHits: 1000,
          results: Array.from({ length: totalForPage }, (_, index) => {
            const id = offset + index + 1;
            return {
              id,
              title: `CORE paper ${id}`,
              authors: [{ name: `Author ${id}` }],
              abstract: `Abstract ${id}`,
              doi: `10.1000/core.${id}`,
              yearPublished: 2024,
              url: `https://core.ac.uk/works/${id}`
            };
          })
        }
      };
    });
    jest.spyOn(axios, 'create').mockReturnValue({ get } as any);

    const results = await new CORESearcher().search('machine learning', { maxResults: 100 });

    expect(results).toHaveLength(100);
    expect(results[0].paperId).toBe('1');
    expect(results[99].paperId).toBe('250');
    expect(get).toHaveBeenCalledTimes(4);
    expect(get).toHaveBeenNthCalledWith(
      1,
      '/search/works',
      expect.objectContaining({
        params: expect.objectContaining({ limit: 100, offset: 0 })
      })
    );
    expect(get).toHaveBeenNthCalledWith(
      2,
      '/search/works',
      expect.objectContaining({
        params: expect.objectContaining({ limit: 75, offset: 100 })
      })
    );
    expect(get).toHaveBeenNthCalledWith(
      4,
      '/search/works',
      expect.objectContaining({
        params: expect.objectContaining({ limit: 25, offset: 225 })
      })
    );
  });

  it('stops pagination when CORE returns no more results', async () => {
    const get = jest.fn(async (_path: string, options: any) => {
      const offset = Number(options.params.offset || 0);
      return {
        status: 200,
        data: {
          totalHits: 25,
          results: offset === 0
            ? Array.from({ length: 25 }, (_, index) => ({
                id: index + 1,
                title: `CORE paper ${index + 1}`
              }))
            : []
        }
      };
    });
    jest.spyOn(axios, 'create').mockReturnValue({ get } as any);

    const results = await new CORESearcher().search('machine learning', { maxResults: 50 });

    expect(results).toHaveLength(25);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
