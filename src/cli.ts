#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { TOOLS } from './core/tools.js';
import { initializeSearchers } from './core/searchers.js';
import { handleToolCall } from './core/handleToolCall.js';
import type { ToolName } from './core/schemas.js';

dotenv.config();

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

const GLOBAL_FLAGS = new Set(['pretty', 'format', 'includeText', 'include-text', 'help', 'h']);

function usage(): string {
  return `paper-search - agent-friendly academic paper search CLI

Usage:
  paper-search search <query> [--platform crossref] [--max-results 10] [--year 2024]
  paper-search run <tool-name> --json-args '{"query":"machine learning","maxResults":5}'
  paper-search status [--validate]
  paper-search tools
  paper-search download <paper-id> --platform arxiv [--save-path ./downloads]

Global flags:
  --pretty         Pretty-print JSON output
  --format text    Print only the human-readable tool text
  --include-text   Include raw tool response text in JSON output

Examples:
  paper-search search "large language model evaluation" --platform crossref --max-results 5 --pretty
  paper-search run search_pubmed --arg query="osteoarthritis occupational exposure" --arg maxResults=3
  paper-search status --pretty
`;
}

function parseCli(argv: string[]): ParsedCli {
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
    args[key] = coerceValue(entry.slice(eqIndex + 1));
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

async function main() {
  const parsed = parseCli(process.argv.slice(2));

  try {
    const result = await run(parsed);
    if (typeof result === 'string') {
      process.stdout.write(`${result}\n`);
    } else {
      process.stdout.write(`${formatOutput(result, parsed.flags)}\n`);
    }
  } catch (error: any) {
    const payload = {
      ok: false,
      error: {
        name: error?.name || 'Error',
        code: error?.code || 'ERROR',
        message: error?.message || String(error)
      }
    };

    process.stderr.write(`${payload.error.message}\n`);
    process.stdout.write(`${formatOutput(payload, parsed.flags)}\n`);
    process.exitCode = error?.exitCode || 1;
  }
}

main();
