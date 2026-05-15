import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  diagnoseError,
  diagnoseToolResult,
  getRequirementStatus
} from '../../src/core/diagnostics.js';

const ORIGINAL_ENV = { ...process.env };

describe('diagnostics', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ELSEVIER_API_KEY;
    delete process.env.SPRINGER_API_KEY;
    delete process.env.SEMANTIC_SCHOLAR_API_KEY;
    delete process.env.WOS_API_KEY;
  });

  it('should report key-dependent capabilities and configuration state', () => {
    process.env.ELSEVIER_API_KEY = 'test-key';

    const requirements = getRequirementStatus();
    const scopus = requirements.find(item => item.id === 'scopus');
    const springer = requirements.find(item => item.id === 'springer');

    expect(scopus?.configured).toBe(true);
    expect(scopus?.keyGroups).toEqual([['ELSEVIER_API_KEY']]);
    expect(springer?.configured).toBe(false);
    expect(springer?.missingGroups).toEqual([['SPRINGER_API_KEY']]);
  });

  it('should diagnose provider product permission failures', () => {
    process.env.ELSEVIER_API_KEY = 'test-key';

    const diagnostic = diagnoseError(
      {
        status: 401,
        message: 'sciencedirect: API key was accepted but does not have permission for this API product, view, or resource.'
      },
      { tool: 'search_papers', platform: 'sciencedirect' }
    );

    expect(diagnostic?.category).toBe('permission');
    expect(diagnostic?.platform).toBe('sciencedirect');
    expect(diagnostic?.summary).toContain('authenticated the key');
    expect(diagnostic?.actions.join('\n')).toContain('ScienceDirect Search API');
  });

  it('should diagnose missing required configuration', () => {
    const diagnostic = diagnoseError(
      { message: 'Web of Science API key not configured. Please set WOS_API_KEY environment variable.' },
      { tool: 'search_webofscience' }
    );

    expect(diagnostic?.category).toBe('missing_config');
    expect(diagnostic?.relatedConfigKeys).toContain('WOS_API_KEY');
    expect(diagnostic?.actions.join('\n')).toContain('WOS_API_KEY');
  });

  it('should treat configured but rejected keys as invalid keys', () => {
    process.env.SPRINGER_API_KEY = 'test-key';

    const diagnostic = diagnoseError(
      { status: 401, message: 'springer: Invalid or missing API key. Please check your credentials.' },
      { tool: 'search_papers', platform: 'springer' }
    );

    expect(diagnostic?.category).toBe('invalid_key');
    expect(diagnostic?.summary).toContain('rejected the API key');
  });

  it('should diagnose provider timeouts as skipped source warnings', () => {
    const diagnostic = diagnoseError(
      { message: 'openalex DOI lookup timed out after 15000ms' },
      { tool: 'get_paper_by_doi', platform: 'openalex' }
    );

    expect(diagnostic?.category).toBe('timeout');
    expect(diagnostic?.severity).toBe('warning');
    expect(diagnostic?.summary).toContain('was skipped');
  });

  it('should diagnose zero results when key is configured', () => {
    process.env.SEMANTIC_SCHOLAR_API_KEY = 'test-key';

    const diagnostic = diagnoseToolResult({
      tool: 'search_semantic_snippets',
      data: [],
      args: { query: 'very narrow method query' }
    });

    expect(diagnostic?.category).toBe('zero_results');
    expect(diagnostic?.severity).toBe('info');
    expect(diagnostic?.relatedConfigKeys).toContain('SEMANTIC_SCHOLAR_API_KEY');
    expect(diagnostic?.actions.join('\n')).toContain('broader');
  });

  it('should diagnose multi-source partial failures', () => {
    const diagnostic = diagnoseToolResult({
      tool: 'search_papers',
      data: {
        query: 'test',
        sources_requested: 'crossref,sciencedirect',
        sources_used: ['crossref', 'sciencedirect'],
        source_results: { crossref: 1, sciencedirect: 0 },
        errors: {
          sciencedirect:
            'sciencedirect: API key was accepted but does not have permission for this API product, view, or resource.'
        },
        total: 1,
        raw_total: 1,
        papers: []
      }
    });

    expect(diagnostic?.category).toBe('partial_failure');
    expect(diagnostic?.likelyCauses.join('\n')).toContain('sciencedirect');
    expect(diagnostic?.actions.join('\n')).toContain('provider-specific messages');
  });
});
