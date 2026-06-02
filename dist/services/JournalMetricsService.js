import axios from 'axios';
const EASYSCHOLAR_URL = 'https://www.easyscholar.cc/open/getPublicationRank';
const REQUEST_DELAY_MS = 500;
function easyScholarKey() {
    const key = process.env.EASYSCHOLAR_KEY || '';
    if (!key.trim()) {
        throw new Error('EasyScholar API key not configured. Set EASYSCHOLAR_KEY with `paper-search setup EASYSCHOLAR_KEY`.');
    }
    return key.trim();
}
function uniqueJournals(journals) {
    const seen = new Set();
    const unique = [];
    for (const journal of journals.map(item => item.trim()).filter(Boolean)) {
        if (seen.has(journal))
            continue;
        seen.add(journal);
        unique.push(journal);
    }
    return unique;
}
function stringValue(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
}
function extractZone(value) {
    const text = stringValue(value);
    const match = text?.match(/(\d+)区/);
    return match?.[1];
}
function extractSmallZones(value) {
    const text = stringValue(value);
    if (!text)
        return undefined;
    const matches = [...text.matchAll(/([^/。；;]+?)([1-4])区/g)].map(match => `${match[1].trim()}${match[2]}区`);
    return matches.length ? matches : undefined;
}
function normalizeOfficialRank(all) {
    const casUpgraded = stringValue(all.sciUp);
    const casBase = stringValue(all.sciBase);
    const casSmall = stringValue(all.sciUpSmall);
    const core = {
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
    return Object.fromEntries(Object.entries(core).filter(([, value]) => value !== undefined));
}
function formatResult(journal, data, includeRaw) {
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
    const row = {
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
async function delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
export async function queryJournalMetrics(options) {
    const secretKey = easyScholarKey();
    const journals = uniqueJournals(options.journals);
    if (journals.length === 0) {
        throw new Error('Provide at least one journal name.');
    }
    const rows = [];
    for (let index = 0; index < journals.length; index += 1) {
        const journal = journals[index];
        try {
            const response = await axios.get(EASYSCHOLAR_URL, {
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
        }
        catch (error) {
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
//# sourceMappingURL=JournalMetricsService.js.map