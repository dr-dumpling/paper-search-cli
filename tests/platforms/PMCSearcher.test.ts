import axios from 'axios';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { PMCSearcher } from '../../src/platforms/PMCSearcher.js';

describe('PMCSearcher', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves publisher PDF URLs through Europe PMC before downloading', async () => {
    const get = jest.spyOn(axios, 'get').mockImplementation(async (url: any) => {
      if (String(url).includes('europepmc')) {
        return {
          data: {
            resultList: {
              result: [
                {
                  fullTextUrlList: {
                    fullTextUrl: [
                      {
                        documentStyle: 'pdf',
                        site: 'Unpaywall',
                        url: 'https://publisher.test/article.pdf'
                      }
                    ]
                  }
                }
              ]
            }
          }
        } as any;
      }
      return {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
        data: Buffer.from('%PDF-1.7\nbody')
      } as any;
    });

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pmc-download-test-'));
    const filePath = await new PMCSearcher().downloadPdf('PMC3531190', { savePath: dir });

    expect(filePath).toContain('pmc_PMC3531190.pdf');
    expect(fs.readFileSync(filePath).subarray(0, 4).toString()).toBe('%PDF');
    expect(get).toHaveBeenNthCalledWith(
      1,
      'https://www.ebi.ac.uk/europepmc/webservices/rest/search',
      expect.objectContaining({
        params: expect.objectContaining({ query: 'PMC3531190' })
      })
    );
  });
});
