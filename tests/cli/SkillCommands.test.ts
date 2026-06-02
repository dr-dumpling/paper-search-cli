import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

describe('skill CLI commands', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'paper-search-skill-cli-test-'));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('reports missing skill status and installs selected targets', () => {
    const missing = runCli(['skills', 'status', '--targets', 'agents', '--skills-root', tempRoot, '--pretty']);
    expect(missing.status).toBe(0);
    const missingOutput = JSON.parse(missing.stdout);
    expect(missingOutput.targets[0].status).toBe('missing');

    const update = runCli(['skills', 'update', '--targets', 'agents', '--skills-root', tempRoot, '--pretty']);
    expect(update.status).toBe(0);
    const updateOutput = JSON.parse(update.stdout);
    expect(updateOutput.installedCount).toBe(1);
    expect(updateOutput.status.targets[0].status).toBe('up_to_date');

    const skillFile = join(tempRoot, '.agents', 'skills', 'paper-search', 'SKILL.md');
    expect(existsSync(skillFile)).toBe(true);

    writeFileSync(join(tempRoot, '.agents', 'skills', 'paper-search', 'LOCAL.md'), 'local note\n');
    const extra = runCli(['skills', 'status', '--targets', 'agents', '--skills-root', tempRoot, '--pretty']);
    const extraOutput = JSON.parse(extra.stdout);
    expect(extraOutput.targets[0].status).toBe('extra_files');
    expect(extraOutput.targets[0].extraFiles).toEqual(['LOCAL.md']);
  });

  it('runs mock smoke checks without network access', () => {
    const result = runCli(['smoke', '--mock', '--skills-root', tempRoot, '--pretty']);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.ok).toBe(true);
    expect(output.mode).toBe('mock');
    expect(output.cases.map((item: any) => item.name)).toEqual(
      expect.arrayContaining([
        'metadata_search excludes Sci-Hub',
        'pdf_discovery has source groups',
        'journal_metrics uses EASYSCHOLAR_KEY',
        'skill status runs offline'
      ])
    );
  });

  it('renders skill diff text with managed diffs and extra file names only', () => {
    const sourceRoot = join(tempRoot, 'source-skill');
    mkdirSync(sourceRoot, { recursive: true });
    writeFileSync(join(sourceRoot, 'SKILL.md'), 'bundled skill\n');

    const update = runCli([
      'skills',
      'update',
      '--targets',
      'agents',
      '--skills-root',
      tempRoot,
      '--source-root',
      sourceRoot,
      '--pretty'
    ]);
    expect(update.status).toBe(0);

    const installedSkill = join(tempRoot, '.agents', 'skills', 'paper-search');
    writeFileSync(join(installedSkill, 'SKILL.md'), 'local skill\n');
    writeFileSync(join(installedSkill, 'LOCAL_SECRET.md'), 'SECRET=do-not-print\n');

    const json = runCli([
      'skills',
      'diff',
      '--targets',
      'agents',
      '--skills-root',
      tempRoot,
      '--source-root',
      sourceRoot,
      '--pretty'
    ]);
    expect(json.status).toBe(0);
    const jsonOutput = JSON.parse(json.stdout);
    expect(jsonOutput.targets[0].staleFiles).toEqual(['SKILL.md']);
    expect(json.stdout).toContain('LOCAL_SECRET.md');
    expect(json.stdout).not.toContain('do-not-print');

    const text = runCli([
      'skills',
      'diff',
      '--targets',
      'agents',
      '--skills-root',
      tempRoot,
      '--source-root',
      sourceRoot,
      '--format',
      'text'
    ]);
    expect(text.status).toBe(0);
    expect(text.stdout).toContain('Paper Search Skill Diff');
    expect(text.stdout).toContain('--- installed/SKILL.md');
    expect(text.stdout).toContain('+bundled skill');
    expect(text.stdout).toContain('LOCAL_SECRET.md');
    expect(text.stdout).not.toContain('do-not-print');
  });

  function runCli(args: string[]) {
    return spawnSync(process.execPath, [join(process.cwd(), 'node_modules/.bin/tsx'), 'src/cli.ts', ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PAPER_SEARCH_CONFIG_FILE: join(tempRoot, 'config.json')
      },
      encoding: 'utf8'
    });
  }
});
