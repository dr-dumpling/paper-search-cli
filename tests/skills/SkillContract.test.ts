import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from '@jest/globals';
import { TOOLS } from '../../src/core/tools.js';

const SKILL_ROOT = join(process.cwd(), 'skills', 'paper-search');

function readSkillFile(relativePath: string): string {
  return readFileSync(join(SKILL_ROOT, relativePath), 'utf8');
}

const REFERENCE_FILES = [
  'references/cli-contract.md',
  'references/management-layer.md',
  'references/capability-routing.md'
];

describe('paper-search bundled skill contract', () => {
  it('keeps the routing skill short and backed by focused references', () => {
    const skill = readSkillFile('SKILL.md');

    for (const file of REFERENCE_FILES) {
      expect(existsSync(join(SKILL_ROOT, file))).toBe(true);
      expect(skill).toContain(file);
    }
    expect(skill).toContain('Routing Skill');
    expect(skill).toContain('Two-Stage Paper Workflow');
    expect(skill).toContain('Direct Paper Request');
    expect(skill).toContain('paper-search doctor --pretty');
    expect(skill).toContain('Sci-Hub');
  });

  it('documents management commands as explicit agent checks', () => {
    const skill = readSkillFile('SKILL.md');
    const management = readSkillFile('references/management-layer.md');

    expect(skill).toContain('references/management-layer.md');
    expect(management).toContain('## Management Commands');
    expect(management).toContain('| Command | Purpose | Use When |');
    expect(management).toContain('`paper-search doctor --pretty`');
    expect(management).toContain('Complete health report');
    expect(management).toContain('`paper-search smoke --mock --pretty`');
    expect(management).toContain('Offline check of CLI wiring');
    expect(management).toContain('`paper-search skills status --pretty`');
    expect(management).toContain('Installed Skill files match the Bundled Skill');
    expect(management).toContain('`paper-search tools --pretty`');
  });

  it('documents package update, Skill sync, and capability setup as separate steps', () => {
    const skill = readSkillFile('SKILL.md');
    const management = readSkillFile('references/management-layer.md');

    expect(skill).toContain('先区分包本体更新和 Skill 同步');
    expect(skill).toContain('不要只运行 `skills update`');
    expect(skill).toContain('Package Update And Capability Setup');
    expect(skill).toContain('npm install -g paper-search-cli@latest');
    expect(skill).toContain('npm install -g .');
    expect(management).toContain('## Package Update And Capability Setup');
    expect(management).toContain('does not update the npm package, GitHub checkout, compiled CLI files, or provider configuration');
    expect(management).toContain('does not update the package body');
    expect(management).toContain('npm install -g paper-search-cli@latest');
    expect(management).toContain('paper-search skills update --targets agents --pretty');
    expect(management).toContain('paper-search doctor --pretty');
    expect(management).toContain('paper-search setup');
    expect(management).toContain('git pull');
    expect(management).toContain('npm run build');
    expect(management).toContain('npm install -g .');
    expect(management).toContain('Capability Profile');
  });

  it('clearly exposes the four agent-facing literature capabilities', () => {
    const skill = readSkillFile('SKILL.md');
    const routing = readSkillFile('references/capability-routing.md');

    expect(skill).toContain('## 功能地图');
    expect(skill).toContain('| 用户意图 | 能力名 | 首选入口 | 关键边界 |');
    expect(skill).toContain('`paper-search search` 集成入口');
    expect(skill).toContain('`metadata_search`');
    expect(skill).toContain('`journal_metrics`');
    expect(skill).toContain('`pdf_discovery`');
    expect(skill).toContain('`body_snippet_search`');
    expect(skill).toContain('Sci-Hub 不属于搜索源');
    expect(routing).toContain('## Functional Map');
    expect(routing).toContain('## Metadata Search');
    expect(routing).toContain('## Journal Metrics');
    expect(routing).toContain('## PDF Discovery');
    expect(routing).toContain('## Body Snippet Search');
    expect(routing).toContain('It does not call `journal_metrics`, `pdf_discovery`, or `body_snippet_search`');
    expect(routing).toContain('Sci-Hub Fallback is enabled by default');
    expect(routing).toContain('"useSciHub":false');
    expect(skill).not.toContain('友好入口：');
  });

  it('does not describe future-only download commands or strategy flags', () => {
    const bundledText = [readSkillFile('SKILL.md'), ...REFERENCE_FILES.map(file => readSkillFile(file))].join('\n');
    const forbidden = [
      'download_batch_with_fallback',
      'download-sources',
      'downloadStrategy',
      'legal_only',
      'legacy',
      'institution browser-download',
      'antiBotRecovery',
      'camofox',
      'Camoufox',
      'webvpn.dat',
      'scansci'
    ];

    for (const phrase of forbidden) {
      expect(bundledText).not.toContain(phrase);
    }
  });

  it('keeps direct run tool names synchronized with the source tool registry', () => {
    const contract = readSkillFile('references/cli-contract.md');
    const section = contract.match(/## Direct Run Tools\n\n[\s\S]*?\n\n## Output Expectations/);
    expect(section).not.toBeNull();

    const contractTools = Array.from((section?.[0] || '').matchAll(/^- `([^`]+)`$/gm)).map(match => match[1]).sort();
    const sourceTools = TOOLS.map(tool => tool.name).sort();

    expect(contractTools).toEqual(sourceTools);
  });

  it('documents only accepted compatibility command aliases', () => {
    const contract = readSkillFile('references/cli-contract.md');

    expect(contract).toContain('`paper-search metrics ...` is an alias for `journal-metrics`');
    expect(contract).toContain('`paper-search requirements [--pretty]` is an alias for `diagnostics`');
    expect(contract).not.toContain('paper-search config setup');
  });
});
