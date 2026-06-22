import type { Searchers } from '../../core/searchers.js';
import { TIMEOUTS } from '../../config/constants.js';
import { PaperFactory, type Paper } from '../../models/Paper.js';
import { PaperSource, type SearchOptions } from '../../platforms/PaperSource.js';
import { logDebug } from '../../utils/Logger.js';
import { withTimeout } from '../../infrastructure/security/SecurityUtils.js';
import {
  getDoiLookupSources,
  getPlatformMetadata,
  resolvePlatformId
} from '../../registry/platformMetadata.js';
import { searchMultipleSources } from './MultiSourceSearchService.js';

function jsonTextResponse(text: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text
      }
    ]
  };
}

function normalizeDoi(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .toLowerCase();
}

function paperMatchesDoi(paper: Paper, doi: string): boolean {
  return normalizeDoi(paper.doi || '') === normalizeDoi(doi);
}

export async function handleGenericSearch(platform: string, args: any, searchers: Searchers) {
  const resolvedPlatform = resolvePlatformId(platform);
  const searcher = (searchers as any)[resolvedPlatform] as PaperSource | undefined;
  if (!searcher) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const { query, ...searchOptions } = args;
  const results = await searcher.search(query, searchOptions as SearchOptions);
  const displayName = getPlatformMetadata(platform)?.displayName || platform;

  return jsonTextResponse(
    `Found ${results.length} ${displayName} papers.\n\n${JSON.stringify(
      results.map((paper: Paper) => PaperFactory.toDict(paper)),
      null,
      2
    )}`
  );
}

export async function handleSearchPapers(args: any, searchers: Searchers) {
  const {
    query,
    platform,
    sources,
    maxResults,
    year,
    author,
    journal,
    category,
    days,
    fetchDetails,
    fieldsOfStudy,
    sortBy,
    sortOrder
  } = args;

  const results: Record<string, any>[] = [];
  const searchOptions: SearchOptions = {
    maxResults,
    year,
    author,
    journal,
    category,
    days,
    fetchDetails,
    fieldsOfStudy,
    sortBy,
    sortOrder
  };

  if (platform === 'all') {
    const result = await searchMultipleSources(searchers, query, sources || 'all', searchOptions);
    return jsonTextResponse(`Found ${result.total} papers across ${result.sources_used.length} source(s).\n\n${JSON.stringify(result, null, 2)}`);
  } else if (sources) {
    const result = await searchMultipleSources(searchers, query, sources, searchOptions);
    return jsonTextResponse(`Found ${result.total} papers across ${result.sources_used.length} source(s).\n\n${JSON.stringify(result, null, 2)}`);
  } else {
    const resolvedPlatform = resolvePlatformId(platform);
    const searcher = (searchers as any)[resolvedPlatform];
    if (!searcher) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const platformResults = await (searcher as PaperSource).search(query, searchOptions);
    results.push(...platformResults.map((paper: Paper) => PaperFactory.toDict(paper)));
  }

  return jsonTextResponse(`Found ${results.length} papers.\n\n${JSON.stringify(results, null, 2)}`);
}

export async function handleGetPaperByDoi(args: { doi: string; platform: string }, searchers: Searchers) {
  const { doi, platform } = args;
  const results: Record<string, any>[] = [];
  const sourceResults: Record<string, number> = {};
  const errors: Record<string, string> = {};
  const failedSources: string[] = [];
  const doiLookupSources = getDoiLookupSources();

  if (platform === 'all') {
    const selected = doiLookupSources.filter(source => source in searchers);
    const settled = await Promise.allSettled(
      selected.map(async source => {
        const searcher = (searchers as any)[source] as PaperSource;
        const paper = await withTimeout(
          searcher.getPaperByDoi(doi),
          TIMEOUTS.SOURCE_TASK,
          `${source} DOI lookup timed out after ${TIMEOUTS.SOURCE_TASK}ms`
        );
        return { source, paper };
      })
    );

    for (let i = 0; i < settled.length; i += 1) {
      const source = selected[i];
      const result = settled[i];

      if (result.status === 'rejected') {
        sourceResults[source] = 0;
        errors[source] = result.reason?.message || String(result.reason);
        failedSources.push(source);
        logDebug(`Error getting paper by DOI from ${source}:`, result.reason);
        continue;
      }

      const paper = result.value.paper;
      if (!paper) {
        sourceResults[source] = 0;
        continue;
      }

      if (!paperMatchesDoi(paper, doi)) {
        sourceResults[source] = 0;
        errors[source] = `Returned DOI ${paper.doi || '(missing)'} did not match requested DOI ${doi}`;
        failedSources.push(source);
        continue;
      }

      sourceResults[source] = 1;
      results.push(PaperFactory.toDict(paper));
    }
  } else {
    const searcher = (searchers as any)[resolvePlatformId(platform)];
    if (!searcher) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    const paper = await searcher.getPaperByDoi(doi);
    if (paper) {
      results.push(PaperFactory.toDict(paper));
    }
  }

  if (results.length === 0) {
    if (platform === 'all') {
      const result = {
        doi,
        sources_requested: 'all',
        sources_used: doiLookupSources.filter(source => source in searchers),
        source_results: sourceResults,
        errors,
        failed_sources: failedSources,
        warnings: failedSources.map(source => `${source}: ${errors[source]}`),
        total: 0,
        papers: []
      };
      return jsonTextResponse(`No paper found with DOI: ${doi}\n\n${JSON.stringify(result, null, 2)}`);
    }
    return jsonTextResponse(`No paper found with DOI: ${doi}`);
  }
  if (platform === 'all') {
    const result = {
      doi,
      sources_requested: 'all',
      sources_used: doiLookupSources.filter(source => source in searchers),
      source_results: sourceResults,
      errors,
      failed_sources: failedSources,
      warnings: failedSources.map(source => `${source}: ${errors[source]}`),
      total: results.length,
      papers: results
    };
    return jsonTextResponse(`Found ${results.length} paper(s) with DOI ${doi} across ${result.sources_used.length} source(s).\n\n${JSON.stringify(result, null, 2)}`);
  }
  return jsonTextResponse(`Found ${results.length} paper(s) with DOI ${doi}:\n\n${JSON.stringify(results, null, 2)}`);
}
