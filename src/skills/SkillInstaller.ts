import { createHash } from 'crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join, relative, resolve, sep } from 'path';

export const SKILL_NAME = 'paper-search';

export interface SkillTarget {
  id: string;
  label: string;
  relativeRoot: string;
}

export interface SkillTargetStatus {
  target: string;
  label: string;
  path: string;
  status: 'missing' | 'up_to_date' | 'stale' | 'extra_files' | 'error';
  files: number;
  installedFiles: number;
  bundledHash: string;
  installedHash: string;
  hashMatch: boolean;
  managedHashMatch: boolean;
  extraFiles: string[];
  missingFiles: string[];
  staleFiles: string[];
  error?: string;
}

export interface SkillStatusResult {
  ok: boolean;
  root: string;
  skill: string;
  selected: string[];
  bundledFiles: number;
  bundledHash: string;
  targets: SkillTargetStatus[];
  statusCounts: Record<string, number>;
}

export interface SkillInstallResult {
  ok: boolean;
  root: string;
  skill: string;
  selected: string[];
  installed: Array<{ target: string; label: string; path: string; files: number }>;
  failed: Array<{ target: string; label: string; path: string; error: string }>;
  installedCount: number;
  failedCount: number;
  status: SkillStatusResult;
}

export interface SkillManagedFileDiff {
  file: string;
  status: 'missing' | 'stale' | 'up_to_date';
  bundledHash: string;
  installedHash: string;
  diff?: string;
}

export interface SkillTargetDiff {
  target: string;
  label: string;
  path: string;
  status: SkillTargetStatus['status'];
  files: number;
  installedFiles: number;
  bundledHash: string;
  installedHash: string;
  hashMatch: boolean;
  managedHashMatch: boolean;
  managedFiles: SkillManagedFileDiff[];
  extraFiles: string[];
  missingFiles: string[];
  staleFiles: string[];
  error?: string;
}

export interface SkillDiffResult {
  ok: boolean;
  root: string;
  skill: string;
  selected: string[];
  bundledFiles: number;
  bundledHash: string;
  targets: SkillTargetDiff[];
  statusCounts: Record<string, number>;
}

type SkillFile = [relPath: string, content: Buffer];

export const SKILL_TARGETS: SkillTarget[] = [
  { id: 'agents', label: 'Agents shared skills', relativeRoot: '.agents/skills' },
  { id: 'codex', label: 'Codex', relativeRoot: '.codex/skills' },
  { id: 'claude', label: 'Claude Code', relativeRoot: '.claude/skills' },
  { id: 'cursor', label: 'Cursor', relativeRoot: '.cursor/skills' },
  { id: 'gemini', label: 'Gemini CLI', relativeRoot: '.gemini/skills' },
  { id: 'antigravity', label: 'Antigravity', relativeRoot: '.gemini/antigravity/skills' }
];

const TARGET_BY_ID = new Map(SKILL_TARGETS.map(target => [target.id, target]));
const TARGET_ALIASES = new Map<string, string>([
  ['agent', 'agents'],
  ['shared', 'agents'],
  ['agent-skills', 'agents'],
  ['claude-code', 'claude']
]);

export function defaultSkillTargetIds(root = homedir()): string[] {
  const agentsRoot = join(resolve(root), '.agents', 'skills');
  return existsSync(agentsRoot) ? ['agents'] : ['codex', 'claude', 'cursor'];
}

export function parseSkillTargets(raw: string, root = homedir()): string[] {
  const text = raw.trim();
  if (!text) return defaultSkillTargetIds(root);

  const tokens = text
    .replace(/[;+]/g, ',')
    .split(',')
    .flatMap(part => part.trim().split(/\s+/))
    .map(part => part.trim().toLowerCase())
    .filter(Boolean);

  const selected: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    if (['skip', 'none', 'no', 'n', '跳过', '无', '否'].includes(token)) return [];
    if (['all', '全部'].includes(token)) return SKILL_TARGETS.map(target => target.id);

    const targetId = TARGET_ALIASES.get(token) || token;
    if (!TARGET_BY_ID.has(targetId)) {
      invalid.push(token);
      continue;
    }
    if (!selected.includes(targetId)) selected.push(targetId);
  }

  if (invalid.length > 0) {
    throw new Error(`Unknown skill target(s): ${invalid.join(', ')}. Valid targets: ${SKILL_TARGETS.map(target => target.id).join(', ')}`);
  }
  return selected;
}

export function describeSkillTargets(targetIds: string[], root = homedir()): Array<{ target: string; label: string; path: string }> {
  const base = resolve(root);
  return targetIds.map(targetId => {
    const target = getSkillTarget(targetId);
    return {
      target: target.id,
      label: target.label,
      path: skillDestination(target, base)
    };
  });
}

export function statusSkillTargets(targetIds: string[], options: { skillsRoot?: string; sourceRoot?: string } = {}): SkillStatusResult {
  const root = resolve(options.skillsRoot || homedir());
  const files = loadSkillFiles(options.sourceRoot);
  const sourceByPath = new Map(files.map(([relPath, content]) => [relPath, content]));
  const bundledHash = skillDigest(files);
  const targets: SkillTargetStatus[] = [];

  for (const targetId of targetIds) {
    const target = getSkillTarget(targetId);
    const dest = skillDestination(target, root);
    const item: SkillTargetStatus = {
      target: target.id,
      label: target.label,
      path: dest,
      status: 'missing',
      files: files.length,
      installedFiles: 0,
      bundledHash,
      installedHash: '',
      hashMatch: false,
      managedHashMatch: false,
      extraFiles: [],
      missingFiles: [...sourceByPath.keys()].sort(),
      staleFiles: []
    };

    try {
      if (!existsSync(dest)) {
        targets.push(item);
        continue;
      }
      if (!statSync(dest).isDirectory()) {
        item.status = 'error';
        item.error = 'Installed skill path exists but is not a directory.';
        targets.push(item);
        continue;
      }

      const installedFiles = iterFilesystemFiles(dest);
      const installedByPath = new Map(installedFiles.map(([relPath, content]) => [relPath, content]));
      const missingFiles = [...sourceByPath.keys()].filter(relPath => !installedByPath.has(relPath)).sort();
      const staleFiles = [...sourceByPath.entries()]
        .filter(([relPath, content]) => installedByPath.has(relPath) && !installedByPath.get(relPath)?.equals(content))
        .map(([relPath]) => relPath)
        .sort();
      const extraFiles = [...installedByPath.keys()].filter(relPath => !sourceByPath.has(relPath)).sort();
      const managedHashMatch = missingFiles.length === 0 && staleFiles.length === 0;
      const hashMatch = managedHashMatch && extraFiles.length === 0;

      item.installedFiles = installedFiles.length;
      item.installedHash = installedFiles.length > 0 ? skillDigest(installedFiles) : '';
      item.missingFiles = missingFiles;
      item.staleFiles = staleFiles;
      item.extraFiles = extraFiles;
      item.managedHashMatch = managedHashMatch;
      item.hashMatch = hashMatch;
      item.status = missingFiles.length || staleFiles.length ? 'stale' : extraFiles.length ? 'extra_files' : 'up_to_date';
    } catch (error: any) {
      item.status = 'error';
      item.error = error?.message || String(error);
    }
    targets.push(item);
  }

  const statusCounts: Record<string, number> = {};
  for (const target of targets) {
    statusCounts[target.status] = (statusCounts[target.status] || 0) + 1;
  }

  return {
    ok: targets.every(target => target.status !== 'error'),
    root,
    skill: SKILL_NAME,
    selected: targetIds,
    bundledFiles: files.length,
    bundledHash,
    targets,
    statusCounts
  };
}

export function installSkillTargets(targetIds: string[], options: { skillsRoot?: string; sourceRoot?: string } = {}): SkillInstallResult {
  const root = resolve(options.skillsRoot || homedir());
  const files = loadSkillFiles(options.sourceRoot);
  const installed: SkillInstallResult['installed'] = [];
  const failed: SkillInstallResult['failed'] = [];

  for (const targetId of targetIds) {
    const target = getSkillTarget(targetId);
    const dest = skillDestination(target, root);
    try {
      for (const [relPath, content] of files) {
        const filePath = join(dest, relPath);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, content);
      }
      installed.push({ target: target.id, label: target.label, path: dest, files: files.length });
    } catch (error: any) {
      failed.push({ target: target.id, label: target.label, path: dest, error: error?.message || String(error) });
    }
  }

  const status = statusSkillTargets(targetIds, options);
  return {
    ok: failed.length === 0 && status.ok,
    root,
    skill: SKILL_NAME,
    selected: targetIds,
    installed,
    failed,
    installedCount: installed.length,
    failedCount: failed.length,
    status
  };
}

export function diffSkillTargets(targetIds: string[], options: { skillsRoot?: string; sourceRoot?: string } = {}): SkillDiffResult {
  const root = resolve(options.skillsRoot || homedir());
  const files = loadSkillFiles(options.sourceRoot);
  const sourceByPath = new Map(files.map(([relPath, content]) => [relPath, content]));
  const bundledHash = skillDigest(files);
  const targets: SkillTargetDiff[] = [];

  for (const targetId of targetIds) {
    const target = getSkillTarget(targetId);
    const dest = skillDestination(target, root);
    const item: SkillTargetDiff = {
      target: target.id,
      label: target.label,
      path: dest,
      status: 'missing',
      files: files.length,
      installedFiles: 0,
      bundledHash,
      installedHash: '',
      hashMatch: false,
      managedHashMatch: false,
      managedFiles: [...sourceByPath.entries()].map(([relPath, content]) => ({
        file: relPath,
        status: 'missing',
        bundledHash: bufferDigest(content),
        installedHash: ''
      })),
      extraFiles: [],
      missingFiles: [...sourceByPath.keys()].sort(),
      staleFiles: []
    };

    try {
      if (!existsSync(dest)) {
        targets.push(item);
        continue;
      }
      if (!statSync(dest).isDirectory()) {
        item.status = 'error';
        item.error = 'Installed skill path exists but is not a directory.';
        targets.push(item);
        continue;
      }

      const installedFiles = iterFilesystemFiles(dest);
      const installedByPath = new Map(installedFiles.map(([relPath, content]) => [relPath, content]));
      const managedFiles: SkillManagedFileDiff[] = [...sourceByPath.entries()].map(([relPath, bundled]) => {
        const installed = installedByPath.get(relPath);
        if (!installed) {
          return {
            file: relPath,
            status: 'missing',
            bundledHash: bufferDigest(bundled),
            installedHash: ''
          };
        }
        if (!installed.equals(bundled)) {
          return {
            file: relPath,
            status: 'stale',
            bundledHash: bufferDigest(bundled),
            installedHash: bufferDigest(installed),
            diff: unifiedManagedDiff(relPath, installed, bundled)
          };
        }
        return {
          file: relPath,
          status: 'up_to_date',
          bundledHash: bufferDigest(bundled),
          installedHash: bufferDigest(installed)
        };
      });
      const missingFiles = managedFiles.filter(file => file.status === 'missing').map(file => file.file).sort();
      const staleFiles = managedFiles.filter(file => file.status === 'stale').map(file => file.file).sort();
      const extraFiles = [...installedByPath.keys()].filter(relPath => !sourceByPath.has(relPath)).sort();
      const managedHashMatch = missingFiles.length === 0 && staleFiles.length === 0;
      const hashMatch = managedHashMatch && extraFiles.length === 0;

      item.installedFiles = installedFiles.length;
      item.installedHash = installedFiles.length > 0 ? skillDigest(installedFiles) : '';
      item.managedFiles = managedFiles.sort((a, b) => a.file.localeCompare(b.file));
      item.missingFiles = missingFiles;
      item.staleFiles = staleFiles;
      item.extraFiles = extraFiles;
      item.managedHashMatch = managedHashMatch;
      item.hashMatch = hashMatch;
      item.status = missingFiles.length || staleFiles.length ? 'stale' : extraFiles.length ? 'extra_files' : 'up_to_date';
    } catch (error: any) {
      item.status = 'error';
      item.error = error?.message || String(error);
    }
    targets.push(item);
  }

  const statusCounts: Record<string, number> = {};
  for (const target of targets) {
    statusCounts[target.status] = (statusCounts[target.status] || 0) + 1;
  }

  return {
    ok: targets.every(target => target.status !== 'error'),
    root,
    skill: SKILL_NAME,
    selected: targetIds,
    bundledFiles: files.length,
    bundledHash,
    targets,
    statusCounts
  };
}

function getSkillTarget(targetId: string): SkillTarget {
  const target = TARGET_BY_ID.get(targetId);
  if (!target) {
    throw new Error(`Unknown skill target: ${targetId}. Valid targets: ${SKILL_TARGETS.map(item => item.id).join(', ')}`);
  }
  return target;
}

function skillDestination(target: SkillTarget, root: string): string {
  return join(root, target.relativeRoot, SKILL_NAME);
}

function loadSkillFiles(sourceRoot?: string): SkillFile[] {
  const root = sourceRoot ? resolve(sourceRoot) : bundledSkillRoot();
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Skill source directory not found: ${root}`);
  }
  const files = iterFilesystemFiles(root);
  if (files.length === 0) {
    throw new Error(`Skill source directory is empty: ${root}`);
  }
  return files;
}

function bundledSkillRoot(): string {
  const explicit = process.env.PAPER_SEARCH_SKILL_SOURCE_ROOT;
  const candidates = [
    explicit ? resolve(explicit) : '',
    resolve(process.cwd(), 'skills', SKILL_NAME),
    ...entrypointSkillCandidates()
  ].filter(Boolean);

  const found = candidates.find(candidate => existsSync(candidate) && statSync(candidate).isDirectory());
  if (!found) return candidates[0] || resolve(process.cwd(), 'skills', SKILL_NAME);
  return found;
}

function entrypointSkillCandidates(): string[] {
  const entry = process.argv[1];
  if (!entry) return [];
  const entryPath = existsSync(entry) ? realpathSync(entry) : resolve(entry);
  const entryDir = dirname(entryPath);
  return [
    resolve(entryDir, '..', 'skills', SKILL_NAME),
    resolve(entryDir, 'skills', SKILL_NAME)
  ];
}

function iterFilesystemFiles(root: string): SkillFile[] {
  const files: SkillFile[] = [];

  function visit(dir: string) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        visit(path);
      } else if (stats.isFile()) {
        files.push([relative(root, path).split(sep).join('/'), readFileSync(path)]);
      }
    }
  }

  visit(root);
  return files.sort(([a], [b]) => a.localeCompare(b));
}

function skillDigest(files: SkillFile[]): string {
  const hash = createHash('sha256');
  for (const [relPath, content] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    hash.update(relPath);
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
  }
  return hash.digest('hex');
}

function bufferDigest(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function unifiedManagedDiff(relPath: string, installed: Buffer, bundled: Buffer): string {
  if (hasBinaryByte(installed) || hasBinaryByte(bundled)) {
    return [
      `--- installed/${relPath}`,
      `+++ bundled/${relPath}`,
      '@@',
      '-[binary content differs]',
      '+[binary content differs]'
    ].join('\n');
  }

  const installedLines = splitLines(installed.toString('utf8'));
  const bundledLines = splitLines(bundled.toString('utf8'));
  const lines = [
    `--- installed/${relPath}`,
    `+++ bundled/${relPath}`,
    '@@'
  ];

  for (const line of installedLines) {
    lines.push(`-${line}`);
  }
  for (const line of bundledLines) {
    lines.push(`+${line}`);
  }
  return lines.join('\n');
}

function hasBinaryByte(content: Buffer): boolean {
  return content.includes(0);
}

function splitLines(text: string): string[] {
  if (!text) return [''];
  const lines = text.split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}
