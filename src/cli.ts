#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { createInterface as createPromiseInterface } from 'readline/promises';
import { emitKeypressEvents } from 'readline';
import { TOOLS } from './core/tools.js';
import { initializeSearchers } from './core/searchers.js';
import { handleToolCall } from './core/handleToolCall.js';
import {
  diagnoseError,
  diagnoseToolResult,
  diagnosticContextFromCli,
  getRequirementStatus
} from './core/diagnostics.js';
import type { ToolName } from './core/schemas.js';
import {
  CONFIG_KEYS,
  getConfigPath,
  importEnvFile,
  initUserConfig,
  listConfigEntries,
  loadUserConfigIntoEnv,
  maskValue,
  readUserConfig,
  assertConfigKey,
  setUserConfigValue,
  unsetUserConfigValue
} from './config/ConfigService.js';
import type { ConfigKey } from './config/ConfigService.js';

dotenv.config();
loadUserConfigIntoEnv();

type FlagValue = boolean | string | string[];

interface ParsedCli {
  command: string;
  positionals: string[];
  flags: Record<string, FlagValue>;
}

class CliError extends Error {
  constructor(
    message: string,
    readonly code = 'CLI_ERROR',
    readonly exitCode = 1
  ) {
    super(message);
    this.name = 'CliError';
  }
}

const GLOBAL_FLAGS = new Set(['pretty', 'format', 'includeText', 'include-text', 'help', 'h', 'version', 'v']);

function packageVersion(): string {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version?: string };
  return pkg.version || '0.0.0';
}

function usage(): string {
  return `paper-search - agent-friendly academic paper search CLI

Usage:
  paper-search search <query> [--platform crossref] [--max-results 10] [--year 2024]
  paper-search search <query> [--sources crossref,openalex,pmc] [--max-results 10]
  paper-search run <tool-name> --json-args '{"query":"machine learning","maxResults":5}'
  paper-search status [--validate]
  paper-search tools
  paper-search diagnostics
  paper-search config <init|set|get|unset|list|doctor|path|import-env|keys>
  paper-search setup [--all]
  paper-search download <paper-id> --platform arxiv [--save-path ./downloads]

Global flags:
  --pretty         Pretty-print JSON output
  --format text    Print only the human-readable tool text
  --include-text   Include raw tool response text in JSON output
  --version, -v    Print the CLI version

Examples:
  paper-search search "large language model evaluation" --platform crossref --max-results 5 --pretty
  paper-search search "machine learning" --sources crossref,openalex --max-results 2 --pretty
  paper-search setup
  paper-search config set SEMANTIC_SCHOLAR_API_KEY sk_xxx
  paper-search run search_pubmed --arg query="osteoarthritis occupational exposure" --arg maxResults=3
  paper-search status --pretty
`;
}

function parseCli(argv: string[]): ParsedCli {
  if (argv[0] === '--help' || argv[0] === '-h') {
    return { command: 'help', positionals: [], flags: { help: true } };
  }
  if (argv[0] === '--version' || argv[0] === '-v') {
    return { command: 'version', positionals: [], flags: { version: true } };
  }

  const [command = 'help', ...rest] = argv;
  const flags: Record<string, FlagValue> = {};
  const positionals: string[] = [];

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token === '--') {
      positionals.push(...rest.slice(i + 1));
      break;
    }

    if (token.startsWith('--')) {
      const withoutPrefix = token.slice(2);
      const eqIndex = withoutPrefix.indexOf('=');
      const rawKey = eqIndex >= 0 ? withoutPrefix.slice(0, eqIndex) : withoutPrefix;
      const key = toCamelKey(rawKey);
      let value: FlagValue = true;

      if (eqIndex >= 0) {
        value = withoutPrefix.slice(eqIndex + 1);
      } else if (rest[i + 1] && !rest[i + 1].startsWith('-')) {
        value = rest[i + 1];
        i += 1;
      }

      if (key === 'arg') {
        const existing = flags.arg;
        flags.arg = Array.isArray(existing) ? [...existing, String(value)] : [String(value)];
      } else {
        flags[key] = value;
      }
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      if (token === '-h') {
        flags.help = true;
        continue;
      }
      if (token === '-v') {
        flags.version = true;
        continue;
      }
      throw new CliError(`Unsupported short flag: ${token}`, 'UNSUPPORTED_FLAG');
    }

    positionals.push(token);
  }

  return { command, positionals, flags };
}

function toCamelKey(key: string): string {
  return key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function coerceValue(value: string | boolean): unknown {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
    return JSON.parse(value);
  }
  return value;
}

function parseJsonArgs(value: FlagValue | undefined): Record<string, unknown> {
  if (!value) return {};
  if (typeof value !== 'string') {
    throw new CliError('--json-args expects a JSON string or @file path', 'INVALID_JSON_ARGS');
  }

  const raw = value.startsWith('@') ? readFileSync(value.slice(1), 'utf8') : value;
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new CliError('--json-args must decode to a JSON object', 'INVALID_JSON_ARGS');
  }
  return parsed as Record<string, unknown>;
}

function parseArgFlags(value: FlagValue | undefined): Record<string, unknown> {
  if (!value) return {};
  const entries = Array.isArray(value) ? value : [String(value)];
  const args: Record<string, unknown> = {};

  for (const entry of entries) {
    const eqIndex = entry.indexOf('=');
    if (eqIndex <= 0) {
      throw new CliError(`--arg must use key=value form: ${entry}`, 'INVALID_ARG');
    }
    const key = toCamelKey(entry.slice(0, eqIndex));
    const rawValue = entry.slice(eqIndex + 1);
    const stringKeys = new Set(['paperId', 'doi', 'doiOrUrl', 'source', 'title', 'savePath']);
    args[key] = stringKeys.has(key) ? rawValue : coerceValue(rawValue);
  }

  return args;
}

function flagsToArgs(flags: Record<string, FlagValue>): Record<string, unknown> {
  const args: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flags)) {
    if (GLOBAL_FLAGS.has(key) || key === 'arg' || key === 'jsonArgs') continue;
    args[key] = coerceValue(value === true ? 'true' : String(value));
  }

  return args;
}

function formatOutput(payload: unknown, flags: Record<string, FlagValue>): string {
  return JSON.stringify(payload, null, flags.pretty ? 2 : 0);
}

function extractText(response: any): string {
  const content = response?.content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((item: any) => item?.type === 'text')
    .map((item: any) => String(item.text || ''))
    .join('\n');
}

function extractFirstJsonValue(text: string): unknown | undefined {
  const start = text.search(/[\[{]/);
  if (start < 0) return undefined;

  const open = text[start];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) depth -= 1;

    if (depth === 0) {
      return JSON.parse(text.slice(start, i + 1));
    }
  }

  return undefined;
}

function firstLine(text: string): string {
  return text.split('\n').find(line => line.trim())?.trim() || '';
}

async function callTool(tool: string, args: Record<string, unknown>, flags: Record<string, FlagValue>) {
  const searchers = initializeSearchers();
  const response: any = await handleToolCall(tool, args, searchers);
  const text = extractText(response);

  if (flags.format === 'text') {
    return text;
  }

  const payload: Record<string, unknown> = {
    ok: !response?.isError,
    tool,
    message: firstLine(text),
    data: extractFirstJsonValue(text)
  };

  const diagnostic = diagnoseToolResult({
    tool,
    args,
    platform: typeof args.platform === 'string' ? args.platform : undefined,
    sources: typeof args.sources === 'string' ? args.sources : undefined,
    data: payload.data,
    message: String(payload.message || '')
  });
  if (diagnostic) {
    payload.diagnostic = diagnostic;
  }

  if (flags.includeText) {
    payload.text = text;
  }

  return payload;
}

function getToolNames(): string[] {
  return TOOLS.map(tool => tool.name);
}

function assertToolName(tool: string): asserts tool is ToolName {
  if (!getToolNames().includes(tool)) {
    throw new CliError(`Unknown tool: ${tool}. Run "paper-search tools" to list tools.`, 'UNKNOWN_TOOL');
  }
}

async function run(parsed: ParsedCli): Promise<unknown> {
  const { command, positionals, flags } = parsed;

  if (flags.help || command === 'help') {
    return usage();
  }

  if (flags.version || command === 'version') {
    return packageVersion();
  }

  if (command === 'tools') {
    return {
      ok: true,
      tools: TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  }

  if (command === 'diagnostics' || command === 'requirements') {
    return {
      ok: true,
      requirements: getRequirementStatus()
    };
  }

  if (command === 'config') {
    return handleConfigCommand(positionals, flags);
  }

  if (command === 'setup') {
    return handleSetupCommand(positionals, flags);
  }

  if (command === 'status' || command === 'doctor') {
    return callTool('get_platform_status', { validate: flags.validate === true }, flags);
  }

  if (command === 'search') {
    const query = typeof flags.query === 'string' ? flags.query : positionals.join(' ').trim();
    if (!query) {
      throw new CliError('Missing search query', 'MISSING_QUERY');
    }
    const args = {
      ...flagsToArgs(flags),
      query
    };
    return callTool('search_papers', args, flags);
  }

  if (command === 'download') {
    const paperId = typeof flags.paperId === 'string' ? flags.paperId : positionals[0];
    if (!paperId) throw new CliError('Missing paper id', 'MISSING_PAPER_ID');
    if (!flags.platform) throw new CliError('Missing --platform', 'MISSING_PLATFORM');
    return callTool(
      'download_paper',
      {
        ...flagsToArgs(flags),
        paperId
      },
      flags
    );
  }

  if (command === 'run') {
    const tool = positionals[0];
    if (!tool) throw new CliError('Missing tool name', 'MISSING_TOOL');
    assertToolName(tool);

    const args = {
      ...parseJsonArgs(flags.jsonArgs),
      ...parseArgFlags(flags.arg),
      ...flagsToArgs(flags)
    };
    return callTool(tool, args, flags);
  }

  throw new CliError(`Unknown command: ${command}`, 'UNKNOWN_COMMAND');
}

function handleConfigCommand(positionals: string[], flags: Record<string, FlagValue>): unknown {
  const subcommand = positionals[0] || 'list';

  if (subcommand === 'setup') {
    return handleSetupCommand(positionals.slice(1), flags);
  }

  if (subcommand === 'path') {
    return { ok: true, path: getConfigPath() };
  }

  if (subcommand === 'keys') {
    return { ok: true, keys: CONFIG_KEYS };
  }

  if (subcommand === 'init') {
    const result = initUserConfig(flags.force === true);
    return { ok: true, ...result };
  }

  if (subcommand === 'list') {
    return {
      ok: true,
      path: getConfigPath(),
      entries: listConfigEntries(flags.all === true)
    };
  }

  if (subcommand === 'doctor') {
    const entries = listConfigEntries(true);
    return {
      ok: true,
      path: getConfigPath(),
      configured: entries.filter(entry => entry.configured).length,
      missing: entries.filter(entry => !entry.configured).map(entry => entry.key),
      entries
    };
  }

  if (subcommand === 'get') {
    const key = positionals[1];
    if (!key) throw new CliError('Missing config key', 'MISSING_CONFIG_KEY');
    assertConfigKey(key);
    const entry = listConfigEntries(true).find(item => item.key === key);
    const value = process.env[key] || readUserConfig()[key] || '';
    return {
      ok: true,
      key,
      configured: Boolean(value),
      value: flags.raw === true ? value : maskValue(key, value),
      source: entry?.source || 'missing'
    };
  }

  if (subcommand === 'set') {
    const parsed = parseConfigAssignment(positionals.slice(1), flags);
    setUserConfigValue(parsed.key, parsed.value);
    process.env[parsed.key] = parsed.value;
    return {
      ok: true,
      path: getConfigPath(),
      key: parsed.key,
      value: maskValue(parsed.key, parsed.value)
    };
  }

  if (subcommand === 'unset' || subcommand === 'delete' || subcommand === 'remove') {
    const key = positionals[1];
    if (!key) throw new CliError('Missing config key', 'MISSING_CONFIG_KEY');
    unsetUserConfigValue(key);
    return { ok: true, path: getConfigPath(), key, removed: true };
  }

  if (subcommand === 'import-env') {
    const envPath = positionals[1] || (typeof flags.file === 'string' ? flags.file : '.env');
    const result = importEnvFile(envPath);
    return {
      ok: true,
      path: result.path,
      imported: result.imported,
      count: result.imported.length
    };
  }

  throw new CliError(`Unknown config command: ${subcommand}`, 'UNKNOWN_CONFIG_COMMAND');
}

interface SetupPrompt {
  key: ConfigKey;
  label: string;
  secret: boolean;
}

const AUTO_EMAIL_CONFIG_KEYS = new Set<ConfigKey>([
  'PAPER_SEARCH_UNPAYWALL_EMAIL',
  'UNPAYWALL_EMAIL',
  'CROSSREF_MAILTO'
]);

const DEFAULT_SETUP_PROMPTS: SetupPrompt[] = [
  {
    key: 'SEMANTIC_SCHOLAR_API_KEY',
    label: 'Semantic Scholar API key, required for search_semantic_snippets',
    secret: true
  },
  {
    key: 'PAPER_SEARCH_UNPAYWALL_EMAIL',
    label: 'Unpaywall email, recommended for open-access DOI lookup',
    secret: false
  },
  {
    key: 'CROSSREF_MAILTO',
    label: 'Crossref contact email, recommended for polite API access',
    secret: false
  },
  {
    key: 'PAPER_SEARCH_CORE_API_KEY',
    label: 'CORE API key, optional but recommended for stable CORE access',
    secret: true
  }
];

function setupPromptsFor(flags: Record<string, FlagValue>, positionals: string[]): SetupPrompt[] {
  const keysFlag = typeof flags.keys === 'string' ? flags.keys : positionals[0];
  if (keysFlag) {
    return keysFlag
      .split(',')
      .map(key => key.trim())
      .filter(Boolean)
      .map(key => {
        assertConfigKey(key);
        return { key, label: key, secret: isSecretConfigKey(key) };
      });
  }

  if (flags.all === true) {
    return CONFIG_KEYS.map(key => ({ key, label: key, secret: isSecretConfigKey(key) }));
  }

  return DEFAULT_SETUP_PROMPTS;
}

function isSecretConfigKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized.includes('key') || normalized.includes('token');
}

async function handleSetupCommand(positionals: string[], flags: Record<string, FlagValue>): Promise<unknown> {
  const { path } = initUserConfig(false);
  const prompts = setupPromptsFor(flags, positionals);
  const entries = new Map(listConfigEntries(true).map(entry => [entry.key, entry]));
  const session = new PromptSession();
  const updated: string[] = [];
  const kept: string[] = [];
  const skipped: string[] = [];
  const autoGenerated: string[] = [];
  let defaultEmail = '';

  process.stderr.write(`Paper Search CLI setup\n`);
  process.stderr.write(`Config file: ${path}\n`);
  process.stderr.write(`Press Enter to keep an existing value or skip an optional value.\n`);
  process.stderr.write(`For Unpaywall/Crossref email fields, Enter auto-generates a random Gmail-format address.\n\n`);

  try {
    for (const prompt of prompts) {
      const entry = entries.get(prompt.key);
      const current = entry?.configured ? ` current=${entry.value} source=${entry.source}` : ' not configured';
      const question = `${prompt.label}\n${prompt.key} (${current})`;
      const answer = prompt.secret ? await session.secret(question) : await session.line(`${question}: `);
      const value = answer.trim();

      if (!value) {
        if (entry?.configured) {
          kept.push(prompt.key);
        } else if (AUTO_EMAIL_CONFIG_KEYS.has(prompt.key)) {
          defaultEmail ||= randomCommonEmail();
          setUserConfigValue(prompt.key, defaultEmail);
          process.env[prompt.key] = defaultEmail;
          updated.push(prompt.key);
          autoGenerated.push(prompt.key);
        } else {
          skipped.push(prompt.key);
        }
        continue;
      }

      setUserConfigValue(prompt.key, value);
      process.env[prompt.key] = value;
      updated.push(prompt.key);
    }
  } finally {
    session.close();
  }

  const nextSteps = [
    'Run "paper-search config doctor --pretty" to review masked configuration status.',
    'Run "paper-search search \\"machine learning\\" --platform crossref --max-results 1 --pretty" for a no-key smoke test.'
  ];

  return {
    ok: true,
    path,
    updated,
    kept,
    skipped,
    autoGenerated,
    nextSteps
  };
}

function randomCommonEmail(): string {
  return `paper.search.${randomBytes(6).toString('hex')}@gmail.com`;
}

class PromptSession {
  private rl?: ReturnType<typeof createPromiseInterface>;
  private readonly scriptedAnswers?: string[];

  constructor() {
    if (!process.stdin.isTTY) {
      this.scriptedAnswers = readFileSync(0, 'utf8').split(/\r?\n/);
    }
  }

  async line(question: string): Promise<string> {
    if (this.scriptedAnswers) {
      process.stderr.write(question);
      const answer = this.scriptedAnswers.shift() || '';
      process.stderr.write('\n');
      return answer;
    }

    this.rl ??= createPromiseInterface({
      input: process.stdin,
      output: process.stderr
    });
    return this.rl.question(question);
  }

  async secret(question: string): Promise<string> {
    if (!process.stdin.isTTY || !process.stderr.isTTY || typeof process.stdin.setRawMode !== 'function') {
      return this.line(`${question}: `);
    }

    this.close();
    return readHiddenLine(`${question}: `);
  }

  close(): void {
    this.rl?.close();
    this.rl = undefined;
  }
}

function readHiddenLine(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let value = '';
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    const cleanup = () => {
      stdin.off('keypress', onKeypress);
      if (!wasRaw) stdin.setRawMode(false);
      stdin.pause();
    };

    const onKeypress = (text: string, key: any) => {
      if (key?.ctrl && key.name === 'c') {
        cleanup();
        process.stderr.write('\n');
        reject(new CliError('Interrupted', 'INTERRUPTED', 130));
        return;
      }

      if (key?.name === 'return' || key?.name === 'enter') {
        cleanup();
        process.stderr.write('\n');
        resolve(value);
        return;
      }

      if (key?.name === 'backspace' || key?.name === 'delete') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stderr.write('\b \b');
        }
        return;
      }

      if (text && !key?.ctrl && !key?.meta) {
        value += text;
        process.stderr.write('*');
      }
    };

    process.stderr.write(question);
    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('keypress', onKeypress);
  });
}

function parseConfigAssignment(
  positionals: string[],
  flags: Record<string, FlagValue>
): { key: string; value: string } {
  const first = positionals[0];
  if (!first) throw new CliError('Missing config assignment', 'MISSING_CONFIG_ASSIGNMENT');

  const eqIndex = first.indexOf('=');
  if (eqIndex > 0) {
    return {
      key: first.slice(0, eqIndex),
      value: first.slice(eqIndex + 1)
    };
  }

  const value = positionals[1] ?? flags.value;
  if (typeof value !== 'string') {
    throw new CliError('Missing config value. Use "paper-search config set KEY VALUE".', 'MISSING_CONFIG_VALUE');
  }
  return { key: first, value };
}

async function main() {
  const parsed = parseCli(process.argv.slice(2));

  try {
    maybePrintSetupHint(parsed);
    const result = await run(parsed);
    if (typeof result === 'string') {
      process.stdout.write(`${result}\n`);
    } else {
      process.stdout.write(`${formatOutput(result, parsed.flags)}\n`);
    }
  } catch (error: any) {
    const diagnostic = diagnoseError(
      error,
      diagnosticContextFromCli(parsed.command, parsed.positionals, parsed.flags as Record<string, unknown>)
    );
    const errorPayload = {
      name: error?.name || 'Error',
      code: error?.code || 'ERROR',
      message: error?.message || String(error)
    };
    const payload: Record<string, unknown> = {
      ok: false,
      error: errorPayload
    };
    if (diagnostic) {
      payload.diagnostic = diagnostic;
    }

    process.stderr.write(`${errorPayload.message}\n`);
    if (diagnostic) {
      process.stderr.write(`Diagnostic: ${diagnostic.summary}\n`);
      if (diagnostic.actions[0]) {
        process.stderr.write(`Next: ${diagnostic.actions[0]}\n`);
      }
    }
    process.stdout.write(`${formatOutput(payload, parsed.flags)}\n`);
    process.exitCode = error?.exitCode || 1;
  }
}

function maybePrintSetupHint(parsed: ParsedCli): void {
  if (process.env.PAPER_SEARCH_HIDE_SETUP_HINT === '1') return;
  if (parsed.command !== 'status' && parsed.command !== 'doctor') return;
  if (listConfigEntries(false).length > 0) return;

  process.stderr.write(
    [
      'No Paper Search API credentials are configured yet.',
      'Free metadata search still works, but body-snippet search and higher provider limits need optional keys.',
      'Run "paper-search setup" to add keys, or "paper-search config doctor --pretty" to inspect config.',
      ''
    ].join('\n')
  );
}

main();
