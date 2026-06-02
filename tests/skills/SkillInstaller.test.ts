import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  defaultSkillTargetIds,
  diffSkillTargets,
  installSkillTargets,
  parseSkillTargets,
  statusSkillTargets
} from '../../src/skills/SkillInstaller.js';

describe('SkillInstaller', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'paper-search-skill-test-'));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('selects agents by default when the shared skill root exists', () => {
    expect(defaultSkillTargetIds(tempRoot)).toEqual(['codex', 'claude', 'cursor']);
    installSkillTargets(['agents'], { skillsRoot: tempRoot });
    expect(defaultSkillTargetIds(tempRoot)).toEqual(['agents']);
  });

  it('parses aliases, all targets, and skip targets', () => {
    expect(parseSkillTargets('agent,claude-code', tempRoot)).toEqual(['agents', 'claude']);
    expect(parseSkillTargets('skip', tempRoot)).toEqual([]);
    expect(parseSkillTargets('all', tempRoot)).toEqual([
      'agents',
      'codex',
      'claude',
      'cursor',
      'gemini',
      'antigravity'
    ]);
    expect(() => parseSkillTargets('unknown', tempRoot)).toThrow('Unknown skill target');
  });

  it('installs bundled skill files, preserves extra files, and detects stale managed files', () => {
    const missing = statusSkillTargets(['agents'], { skillsRoot: tempRoot });
    expect(missing.targets[0].status).toBe('missing');

    const installed = installSkillTargets(['agents'], { skillsRoot: tempRoot });
    expect(installed.ok).toBe(true);
    const skillFile = join(tempRoot, '.agents', 'skills', 'paper-search', 'SKILL.md');
    expect(existsSync(skillFile)).toBe(true);

    const extraFile = join(tempRoot, '.agents', 'skills', 'paper-search', 'NOTES.md');
    writeFileSync(extraFile, 'local note\n');
    const extraStatus = statusSkillTargets(['agents'], { skillsRoot: tempRoot });
    expect(extraStatus.targets[0].status).toBe('extra_files');
    expect(extraStatus.targets[0].extraFiles).toEqual(['NOTES.md']);

    writeFileSync(skillFile, `${readFileSync(skillFile, 'utf8')}\nlocal edit\n`);
    const staleStatus = statusSkillTargets(['agents'], { skillsRoot: tempRoot });
    expect(staleStatus.targets[0].status).toBe('stale');
    expect(staleStatus.targets[0].staleFiles).toEqual(['SKILL.md']);

    const updated = installSkillTargets(['agents'], { skillsRoot: tempRoot });
    expect(updated.status.targets[0].status).toBe('extra_files');
    expect(existsSync(extraFile)).toBe(true);
  });

  it('diffs only managed files and lists extra file names without reading their contents', () => {
    const installed = installSkillTargets(['agents'], { skillsRoot: tempRoot });
    expect(installed.ok).toBe(true);

    const skillFile = join(tempRoot, '.agents', 'skills', 'paper-search', 'SKILL.md');
    writeFileSync(skillFile, `${readFileSync(skillFile, 'utf8')}\nlocal managed edit\n`);
    writeFileSync(join(tempRoot, '.agents', 'skills', 'paper-search', 'LOCAL_SECRET.md'), 'SECRET=do-not-print\n');

    const diff = diffSkillTargets(['agents'], { skillsRoot: tempRoot });
    const target = diff.targets[0];
    const text = JSON.stringify(diff);

    expect(target.status).toBe('stale');
    expect(target.staleFiles).toEqual(['SKILL.md']);
    expect(target.extraFiles).toEqual(['LOCAL_SECRET.md']);
    expect(target.managedFiles.find(file => file.file === 'SKILL.md')?.diff).toContain('-local managed edit');
    expect(text).toContain('LOCAL_SECRET.md');
    expect(text).not.toContain('do-not-print');
  });
});
