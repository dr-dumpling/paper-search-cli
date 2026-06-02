import { describe, expect, it } from '@jest/globals';
import { summarizeLiveSmoke, type SmokeCase } from '../../src/core/liveSmoke.js';
import type { CapabilityProfile } from '../../src/core/capabilityProfile.js';

const capabilityProfile: CapabilityProfile = {
  ok: true,
  entries: [],
  summary: {} as CapabilityProfile['summary']
};

describe('live smoke severity', () => {
  it('treats degraded checks as configured/enabled capability warnings, not command failure', () => {
    const cases: SmokeCase[] = [
      {
        name: 'free metadata search (Crossref)',
        ok: true,
        severity: 'critical',
        status: 'passed',
        message: 'Free metadata search returned a live response.'
      },
      {
        name: 'Semantic Scholar snippet capability',
        ok: false,
        severity: 'degraded',
        status: 'failed',
        configured: true,
        message: 'SEMANTIC_SCHOLAR_API_KEY is configured, but snippet search could not be verified: 401',
        remediation: 'Run `paper-search config get SEMANTIC_SCHOLAR_API_KEY --pretty`.'
      }
    ];

    const result = summarizeLiveSmoke(cases, capabilityProfile);

    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.failedCases).toEqual([]);
    expect(result.degradedCases).toHaveLength(1);
    expect(result.degradedCases[0]).toEqual(
      expect.objectContaining({
        configured: true,
        remediation: expect.stringContaining('paper-search config get SEMANTIC_SCHOLAR_API_KEY')
      })
    );
    expect(result.severityCounts.degraded).toBe(1);
  });

  it('fails the command only when a critical check fails', () => {
    const cases: SmokeCase[] = [
      {
        name: 'free metadata search (Crossref)',
        ok: false,
        severity: 'critical',
        status: 'failed',
        message: 'Free metadata search failed',
        remediation: 'Check network/proxy settings.'
      }
    ];

    const result = summarizeLiveSmoke(cases, capabilityProfile);

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.failedCases).toHaveLength(1);
  });
});
