import { spawnSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

describe('doctor command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'paper-search-doctor-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns masked config, capability profile, and platform status', () => {
    const result = spawnSync(
      process.execPath,
      [join(process.cwd(), 'node_modules/.bin/tsx'), 'src/cli.ts', 'doctor', '--pretty'],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PAPER_SEARCH_CONFIG_FILE: join(tempDir, 'config.json'),
          PAPER_SEARCH_HIDE_SETUP_HINT: '1',
          EASYSCHOLAR_KEY: 'easy-secret'
        },
        encoding: 'utf8'
      }
    );

    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.ok).toBe(true);
    expect(output.config.entries.find((entry: any) => entry.key === 'EASYSCHOLAR_KEY')).toEqual(
      expect.objectContaining({ configured: true, value: 'easy...cret' })
    );
    expect(output.capabilityProfile.entries.find((entry: any) => entry.id === 'journal_metrics')).toEqual(
      expect.objectContaining({
        status: 'available',
        requiredKeys: ['EASYSCHOLAR_KEY']
      })
    );
    expect(output.platformStatus.ok).toBe(true);
    expect(output.platformStatus.tool).toBe('get_platform_status');
  });

  it('renders text report without exposing raw secrets', () => {
    const result = spawnSync(
      process.execPath,
      [join(process.cwd(), 'node_modules/.bin/tsx'), 'src/cli.ts', 'doctor', '--format', 'text'],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          PAPER_SEARCH_CONFIG_FILE: join(tempDir, 'config.json'),
          PAPER_SEARCH_HIDE_SETUP_HINT: '1',
          EASYSCHOLAR_KEY: 'easy-secret'
        },
        encoding: 'utf8'
      }
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Paper Search Doctor');
    expect(result.stdout).toContain('EASYSCHOLAR_KEY: easy...cret');
    expect(result.stdout).toContain('journal_metrics: available');
    expect(result.stdout).not.toContain('easy-secret');
  });
});
