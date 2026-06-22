import axios from 'axios';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { queryJournalMetrics } from '../../src/capabilities/journal-metrics/JournalMetricsService.js';

const ORIGINAL_ENV = { ...process.env };

describe('JournalMetricsService', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
  });

  it('requires an EasyScholar key', async () => {
    delete process.env.EASYSCHOLAR_KEY;

    await expect(queryJournalMetrics({ journals: ['Nature'] })).rejects.toThrow('EasyScholar API key not configured');
  });

  it('queries EasyScholar and normalizes official rank fields', async () => {
    process.env.EASYSCHOLAR_KEY = 'test-easyscholar-key';
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: {
        code: 200,
        msg: 'SUCCESS',
        data: {
          officialRank: {
            all: {
              sciif: '48.5',
              sciif5: '55.0',
              sci: 'Q1',
              ssci: 'Q1',
              jci: '11.12',
              sciBase: '综合性期刊1区',
              sciUp: '综合性期刊1区',
              sciUpSmall: '综合性期刊1区/医学2区',
              sciUpTop: '是',
              sciwarn: '否',
              esi: '多学科',
              pku: '核心',
              cssci: '来源期刊',
              cscd: '核心库',
              ahci: 'A&HCI',
              ccf: 'A',
              eii: 'EI',
              zhongguokejihexin: '科技核心'
            },
            select: {
              sci: 'Q1'
            }
          },
          customRank: {
            rankInfo: [{ uuid: 'dataset-1', abbName: 'LOCAL' }],
            rank: ['dataset-1&&&1']
          }
        }
      }
    } as any);

    const rows = await queryJournalMetrics({ journals: ['Nature'], includeRaw: true });

    expect(axios.get).toHaveBeenCalledWith(
      'https://www.easyscholar.cc/open/getPublicationRank',
      expect.objectContaining({
        params: {
          secretKey: 'test-easyscholar-key',
          publicationName: 'Nature'
        }
      })
    );
    expect(rows).toEqual([
      {
        journal: 'Nature',
        status: 'found',
        source: 'easyScholar',
        core: {
          impact_factor: '48.5',
          impact_factor_5y: '55.0',
          jcr_quartile: 'Q1',
          ssci_quartile: 'Q1',
          jci: '11.12',
          cas_base: '综合性期刊1区',
          cas_upgraded: '综合性期刊1区',
          cas_small: '综合性期刊1区/医学2区',
          cas_top: '是',
          cas_zone: '1',
          cas_small_zones: ['综合性期刊1区', '医学2区'],
          esi: '多学科',
          warning: '否',
          pku: '核心',
          cssci: '来源期刊',
          cscd: '核心库',
          ahci: 'A&HCI',
          ccf: 'A',
          ei: 'EI',
          china_st_core: '科技核心'
        },
        official_all: expect.objectContaining({
          sciif: '48.5',
          sci: 'Q1'
        }),
        official_select: {
          sci: 'Q1'
        },
        custom_rank: {
          rankInfo: [{ uuid: 'dataset-1', abbName: 'LOCAL' }],
          rank: ['dataset-1&&&1']
        }
      }
    ]);
  });

  it('reports not_found when EasyScholar returns no official rank fields', async () => {
    process.env.EASYSCHOLAR_KEY = 'test-easyscholar-key';
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: {
        code: 200,
        msg: 'SUCCESS',
        data: {
          officialRank: {
            all: {}
          }
        }
      }
    } as any);

    const rows = await queryJournalMetrics({ journals: ['Unknown Journal'] });

    expect(rows[0]).toEqual({
      journal: 'Unknown Journal',
      status: 'not_found',
      source: 'easyScholar',
      message: 'No officialRank.all fields returned for this journal.',
      core: {}
    });
  });
});
