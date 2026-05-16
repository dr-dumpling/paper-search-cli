import type { Searchers } from '../core/searchers.js';
import { TIMEOUTS } from '../config/constants.js';
import { Paper, PaperFactory } from '../models/Paper.js';
import { PaperSource, SearchOptions } from '../platforms/PaperSource.js';
import { withTimeout } from '../utils/SecurityUtils.js';

export interface MultiSourceSearchResult {
  query: string;
  sources_requested: string;
  sources_used: string[];
  source_results: Record<string, number>;
  errors: Record<string, string>;
  failed_sources: string[];
  warnings: string[];
  total: number;
  raw_total: number;
  papers: Record<string, unknown>[];
}

const DEFAULT_ALL_SOURCES = [
  'crossref',
  'openalex',
  'pubmed',
  'pmc',
  'europepmc',
  'arxiv',
  'biorxiv',
  'medrxiv',
  'semantic',
  'iacr',
  'core',
  'openaire',
  'googlescholar',
  'webofscience',
  'sciencedirect',
  'springer',
  'scopus',
  'scihub',
  'unpaywall'
];
const ALIASES: Record<string, string> = {
  google_scholar: 'googlescholar',
  webofscience: 'webofscience',
  wos: 'webofscience',
  europe_pmc: 'europepmc',
  pubmed_central: 'pmc'
};

export function parseSourceList(sources: string | undefined, searchers: Searchers): string[] {
  const requested = !sources || sources.trim() === '' ? 'crossref' : sources.trim();

  if (requested.toLowerCase() === 'all') {
    return DEFAULT_ALL_SOURCES.filter(source => source in searchers);
  }

  return requested
    .split(',')
    .map(source => source.trim().toLowerCase())
    .filter(Boolean)
    .map(source => ALIASES[source] || source)
    .filter((source, index, values) => values.indexOf(source) === index)
    .filter(source => source in searchers);
}

export async function searchMultipleSources(
  searchers: Searchers,
  query: string,
  sources: string,
  options: SearchOptions,
  sourceTimeoutMs: number = TIMEOUTS.SOURCE_TASK
): Promise<MultiSourceSearchResult> {
  const selected = parseSourceList(sources, searchers);
  const settled = await Promise.allSettled(
    selected.map(async source => {
      const searcher = (searchers as any)[source] as PaperSource;
      const results = await withTimeout(
        searcher.search(query, options),
        sourceTimeoutMs,
        `${source} search timed out after ${sourceTimeoutMs}ms`
      );
      return { source, results };
    })
  );

  const sourceResults: Record<string, number> = {};
  const errors: Record<string, string> = {};
  const failedSources: string[] = [];
  const merged: Paper[] = [];

  for (let i = 0; i < settled.length; i += 1) {
    const source = selected[i];
    const result = settled[i];
    if (result.status === 'rejected') {
      sourceResults[source] = 0;
      errors[source] = result.reason?.message || String(result.reason);
      failedSources.push(source);
      continue;
    }

    sourceResults[source] = result.value.results.length;
    merged.push(...result.value.results);
  }

  const deduped = dedupePapers(merged);
  return {
    query,
    sources_requested: sources,
    sources_used: selected,
    source_results: sourceResults,
    errors,
    failed_sources: failedSources,
    warnings: failedSources.map(source => `${source}: ${errors[source]}`),
    total: deduped.length,
    raw_total: merged.length,
    papers: deduped.map(paper => PaperFactory.toDict(paper))
  };
}

export function dedupePapers(papers: Paper[]): Paper[] {
  const seen = new Set<string>();
  const out: Paper[] = [];

  for (const paper of papers) {
    const key = paperKey(paper);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(paper);
  }

  return out;
}

function paperKey(paper: Paper): string {
  const doi = paper.doi.trim().toLowerCase();
  if (doi) return `doi:${doi}`;

  const title = paper.title.trim().toLowerCase();
  const authors = paper.authors.join(';').trim().toLowerCase();
  if (title) return `title:${title}|authors:${authors}`;

  return `id:${paper.source}:${paper.paperId}`;
}
