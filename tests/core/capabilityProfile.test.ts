import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { setUserConfigValue } from '../../src/config/ConfigService.js';
import { buildCapabilityProfile } from '../../src/core/capabilityProfile.js';

const CONFIG_ENV_KEYS = [
  'PAPER_SEARCH_CONFIG_FILE',
  'SEMANTIC_SCHOLAR_API_KEY',
  'EASYSCHOLAR_KEY',
  'ELSEVIER_API_KEY',
  'SPRINGER_API_KEY',
  'WOS_API_KEY',
  'IEEE_API_KEY',
  'WILEY_TDM_TOKEN'
];

describe('capabilityProfile', () => {
  const originalEnv = { ...process.env };
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'paper-search-profile-test-'));
    process.env = { ...originalEnv, PAPER_SEARCH_CONFIG_FILE: join(tempDir, 'config.json') };
    for (const key of CONFIG_ENV_KEYS) {
      if (key !== 'PAPER_SEARCH_CONFIG_FILE') delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('reports independent unavailable capabilities with reasons', () => {
    const profile = buildCapabilityProfile();
    const byId = Object.fromEntries(profile.entries.map(entry => [entry.id, entry]));

    expect(profile.ok).toBe(true);
    expect(profile.entries.map(entry => entry.id)).toEqual([
      'metadata_search',
      'citation_expansion',
      'body_snippet_search',
      'journal_metrics',
      'pdf_discovery',
      'entitled_access'
    ]);
    expect(byId.metadata_search.status).toBe('available');
    expect(byId.metadata_search.configured).not.toContain('scihub');
    expect(byId.metadata_search.reason).toContain('Sci-Hub is excluded');
    expect(byId.citation_expansion.status).toBe('available');
    expect(byId.citation_expansion.configured).toEqual(['semantic_scholar_graph']);
    expect(byId.citation_expansion.optionalKeys).toEqual(['SEMANTIC_SCHOLAR_API_KEY']);
    expect(byId.body_snippet_search.status).toBe('unavailable');
    expect(byId.body_snippet_search.reason).toContain('SEMANTIC_SCHOLAR_API_KEY');
    expect(byId.journal_metrics.status).toBe('unavailable');
    expect(byId.journal_metrics.requiredKeys).toEqual(['EASYSCHOLAR_KEY']);
    expect(byId.pdf_discovery.status).toBe('degraded');
    expect(byId.pdf_discovery.sourceGroups?.open_access_sources).toContain('unpaywall');
    expect(byId.pdf_discovery.sourceGroups?.entitled_access_sources).toEqual([]);
    expect(byId.pdf_discovery.sourceGroups?.scihub_sources).toEqual(['scihub']);
    expect(byId.entitled_access.status).toBe('unavailable');
    for (const entry of profile.entries) {
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it('uses configured canonical keys and separates entitled access from open access', () => {
    process.env.SEMANTIC_SCHOLAR_API_KEY = 'semantic-key';
    process.env.EASYSCHOLAR_KEY = 'easy-key';
    process.env.ELSEVIER_API_KEY = 'elsevier-key';
    setUserConfigValue('SPRINGER_API_KEY', 'springer-key');

    const profile = buildCapabilityProfile();
    const byId = Object.fromEntries(profile.entries.map(entry => [entry.id, entry]));

    expect(byId.body_snippet_search.status).toBe('available');
    expect(byId.journal_metrics.status).toBe('available');
    expect(byId.pdf_discovery.status).toBe('available');
    expect(byId.pdf_discovery.sourceGroups?.open_access_sources).toEqual(
      expect.arrayContaining(['sciencedirect_open_access', 'springer_open_access'])
    );
    expect(byId.pdf_discovery.sourceGroups?.entitled_access_sources).toEqual(
      expect.arrayContaining(['sciencedirect', 'scopus', 'springer'])
    );
    expect(byId.pdf_discovery.sourceGroups?.scihub_sources).toEqual(['scihub']);
    expect(byId.entitled_access.configured).toEqual(expect.arrayContaining(['sciencedirect', 'scopus', 'springer']));
  });
});
