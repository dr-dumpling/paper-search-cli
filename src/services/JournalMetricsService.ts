import axios from 'axios';

const EASYSCHOLAR_URL = 'https://www.easyscholar.cc/open/getPublicationRank';
const REQUEST_DELAY_MS = 500;

interface QueryJournalMetricsOptions {
  journals: string[];
  includeRaw?: boolean;
}

interface EasyScholarResponse {
  code?: number;
  msg?: string;
  data?: {
    officialRank?: {
      all?: Record<string, unknown>;
      select?: Record<string, unknown>;
    };
    customRank?: {
      rankInfo?: unknown;
      rank?: unknown;
    };
  } | null;
}

export interface JournalMetricsRow {
  journal: string;
  status: 'found' | 'not_found' | 'error';
  source: 'easyScholar';
  message?: string;
  core: {
    impact_factor?: string;
    impact_factor_5y?: string;
    jcr_quartile?: string;
    ssci_quartile?: string;
    jci?: string;
    cas_base?: string;
    cas_upgraded?: string;
    cas_small?: string;
    cas_top?: string;
    cas_zone?: string;
    cas_small_zones?: string[];
    esi?: string;
    warning?: string;
    pku?: string;
    cssci?: string;
    cscd?: string;
    ahci?: string;
    ccf?: string;
    ei?: string;
    china_st_core?: string;
  };
  official_all?: Record<string, unknown>;
  official_select?: Record<string, unknown>;
  custom_rank?: unknown;
}

function easyScholarKey(): string {
  const key = process.env.EASYSCHOLAR_KEY || '';
  if (!key.trim()) {
    throw new Error('EasyScholar API key not configured. Set EASYSCHOLAR_KEY with `paper-search setup EASYSCHOLAR_KEY`.');
  }
  return key.trim();
}

function uniqueJournals(journals: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const journal of journals.map(item => item.trim()).filter(Boolean)) {
    if (seen.has(journal)) continue;
    seen.add(journal);
    unique.push(journal);
  }

  return unique;
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function extractZone(value: unknown): string | undefined {
  const text = stringValue(value);
  const match = text?.match(/(\d+)区/);
  return match?.[1];
}

function extractSmallZones(value: unknown): string[] | undefined {
  const text = stringValue(value);
  if (!text) return undefined;
  const matches = [...text.matchAll(/([^/。；;]+?)([1-4])区/g)].map(match => `${match[1].trim()}${match[2]}区`);
  return matches.length ? matches : undefined;
}

function normalizeOfficialRank(all: Record<string, unknown>): JournalMetricsRow['core'] {
  const casUpgraded = stringValue(all.sciUp);
  const casBase = stringValue(all.sciBase);
  const casSmall = stringValue(all.sciUpSmall);

  const core: JournalMetricsRow['core'] = {
    impact_factor: stringValue(all.sciif),
    impact_factor_5y: stringValue(all.sciif5),
    jcr_quartile: stringValue(all.sci),
    ssci_quartile: stringValue(all.ssci),
    jci: stringValue(all.jci),
    cas_base: casBase,
    cas_upgraded: casUpgraded,
    cas_small: casSmall,
    cas_top: stringValue(all.sciUpTop),
    cas_zone: extractZone(casUpgraded) || extractZone(casBase),
    cas_small_zones: extractSmallZones(casSmall),
    esi: stringValue(all.esi),
    warning: stringValue(all.sciwarn),
    pku: stringValue(all.pku),
    cssci: stringValue(all.cssci),
    cscd: stringValue(all.cscd),
    ahci: stringValue(all.ahci),
    ccf: stringValue(all.ccf),
    ei: stringValue(all.eii),
    china_st_core: stringValue(all.zhongguokejihexin)
  };

  return Object.fromEntries(Object.entries(core).filter(([, value]) => value !== undefined)) as JournalMetricsRow['core'];
}

function formatResult(
  journal: string,
  data: EasyScholarResponse,
  includeRaw: boolean
): JournalMetricsRow {
  if (data.code !== 200 || data.msg !== 'SUCCESS' || !data.data) {
    return {
      journal,
      status: 'not_found',
      source: 'easyScholar',
      message: data.msg || `EasyScholar returned code ${data.code ?? 'unknown'}`,
      core: {}
    };
  }

  const officialAll = data.data.officialRank?.all || {};
  const officialSelect = data.data.officialRank?.select || {};
  if (Object.keys(officialAll).length === 0) {
    return {
      journal,
      status: 'not_found',
      source: 'easyScholar',
      message: 'No officialRank.all fields returned for this journal.',
      core: {}
    };
  }

  const row: JournalMetricsRow = {
    journal,
    status: 'found',
    source: 'easyScholar',
    core: normalizeOfficialRank(officialAll)
  };

  if (includeRaw) {
    row.official_all = officialAll;
    row.official_select = officialSelect;
    row.custom_rank = data.data.customRank || {};
  }

  return row;
}

async function delay(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

export async function queryJournalMetrics(options: QueryJournalMetricsOptions): Promise<JournalMetricsRow[]> {
  const secretKey = easyScholarKey();
  const journals = uniqueJournals(options.journals);
  if (journals.length === 0) {
    throw new Error('Provide at least one journal name.');
  }

  const rows: JournalMetricsRow[] = [];
  for (let index = 0; index < journals.length; index += 1) {
    const journal = journals[index];
    try {
      const response = await axios.get<EasyScholarResponse>(EASYSCHOLAR_URL, {
        params: {
          secretKey,
          publicationName: journal
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Paper-Search-CLI/JournalMetrics'
        }
      });

      rows.push(formatResult(journal, response.data, Boolean(options.includeRaw)));
    } catch (error: any) {
      rows.push({
        journal,
        status: 'error',
        source: 'easyScholar',
        message: error?.message || String(error),
        core: {}
      });
    }

    if (index < journals.length - 1) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  return rows;
}
