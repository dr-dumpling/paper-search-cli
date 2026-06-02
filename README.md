# Paper Search CLI

[简体中文](README.zh.md) | English

Paper Search CLI is an agent-facing Skill + CLI package built on a standalone Node.js command line tool for academic literature work. It gives AI agents, terminal users, and scripts one reproducible command layer with agent-friendly JSON output for literature metadata search, journal metrics lookup, PDF discovery/download, and paper body snippet search.

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-25-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)
[![LinuxDo](https://img.shields.io/badge/LinuxDo-community-1f6feb)](https://linux.do)

[Quick Start](#quick-start) | [Architecture](#architecture) | [Configuration](#configuration) | [Agent Skill](#agent-skill) | [Supported Platforms](#supported-platforms) | [Commands](#commands) | [Troubleshooting](#troubleshooting)

## Core Workflows

| Workflow | Primary commands | What it returns |
| --- | --- | --- |
| Literature metadata search | `paper-search search`, `paper-search run search_*` | Paper title, authors, year, journal, DOI, PMID/PMCID, arXiv ID, URL, abstract, and source metadata |
| Journal metrics lookup | `paper-search journal-metrics`, `paper-search run query_journal_metrics` | Impact factor, 5-year IF, JCR/SSCI quartile, CAS zone, JCI, ESI, warning flags, and rank fields |
| PDF discovery and download | `paper-search download`, `paper-search run download_with_fallback` | Verified PDF download paths through native sources, open access, configured entitlement, and Sci-Hub fallback when enabled |
| Body snippet search | `paper-search run search_semantic_snippets` | Semantic Scholar Open Access body snippets for methods, parameters, and wording clues |

## Architecture

`paper-search` is not an MCP server. It is a normal CLI that AI agents can call through the bundled Skill, while terminal users and scripts can call the same `paper-search` command directly.

| Layer | Responsibility |
| --- | --- |
| CLI package body | Executes literature search, journal metrics lookup, PDF discovery/download, body snippet search, and stable JSON output |
| Bundled Skill | Ships `skills/paper-search` with agent routing rules and focused references; it does not store API keys, cookies, or account credentials |
| Friendly Management Layer | Provides `doctor`, `smoke`, `skills`, `config`, and `tools` around the four main capabilities: `metadata_search`, `journal_metrics`, `pdf_discovery`, and `body_snippet_search`. `doctor` health reports include masked configuration, Capability Profile, platform/source status, and missing or degraded items; `smoke` checks command wiring and live readiness; `skills` syncs the bundled Skill |

The four main capabilities are executed by the CLI package body and reported by the management layer. The Capability Profile also reports `entitled_access` so users can see whether publisher API keys, database keys, TDM tokens, or institutional entitlements are configured. Missing or degraded configuration for one workflow does not make unrelated workflows unavailable.

## Quick Start

Requires Node.js >= 18.0.0 and npm.

```bash
npm install -g paper-search-cli
paper-search setup
paper-search doctor --pretty
```

Try the four main workflows:

```bash
paper-search search "machine learning clinical prediction" --platform crossref --max-results 3 --pretty
paper-search journal-metrics "Nature" "BMJ" --pretty
paper-search download 10.48550/arxiv.1201.0490 --platform arxiv --save-path ./downloads
paper-search run search_semantic_snippets --arg query="propensity score matching" --arg maxResults=3 --pretty
```

Useful checks:

```bash
paper-search tools --pretty
paper-search doctor --format text
paper-search smoke --mock --pretty
paper-search skills status --pretty
```

## Supported Platforms

The quick group table helps choose a source family. The capability matrix below is the clearer source of truth for what each platform can actually do.

### Platform Groups

| Family | Platforms | Main use |
| --- | --- | --- |
| General scholarly metadata | Crossref, OpenAlex, Semantic Scholar, Google Scholar | Broad discovery, DOI metadata, citation clues, first-pass screening |
| Journal metrics | EasyScholar | Impact factor, JCR/SSCI quartile, CAS zone, JCI, ESI, warning flags |
| Biomedical and life sciences | PubMed, PubMed Central, Europe PMC | Biomedical metadata, PMID/PMCID verification, open full text |
| Preprints and conference papers | arXiv, bioRxiv, medRxiv, OpenReview, IACR ePrint | Preprints, AI/ML submissions, cryptography ePrints |
| Computer science and engineering | DBLP, ACM metadata, IEEE Xplore, USENIX | CS bibliography, engineering metadata, conference proceedings |
| Open access and repositories | CORE, OpenAIRE, Unpaywall | Repository discovery and open-access PDF fallback |
| Citation indexes and publishers | Web of Science, Scopus, ScienceDirect, Springer Nature/SpringerLink, Wiley | Institution-backed metadata, publisher records, entitled access |
| DOI-targeted fallback | Sci-Hub | DOI-based PDF fallback when enabled |

### Capability Matrix

#### General Scholarly Metadata

| Platform | Metadata search | PDF path | Body/full text | Citation signal | Config | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ None | Default broad metadata source |
| OpenAlex | ✅ Yes | 🟡 Conditional | ❌ No | ✅ Yes | ❌ None | Free metadata; OA links can help PDF fallback |
| Semantic Scholar | ✅ Yes | 🟡 Conditional | ✅ Body snippets | ✅ Yes | 🟡 Optional; snippets require `SEMANTIC_SCHOLAR_API_KEY` | Good for AI/CS and body snippet clues |
| Google Scholar | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ None | Broad discovery through page parsing |

#### Journal Metrics

| Platform | Metadata search | PDF path | Body/full text | Citation signal | Config | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| EasyScholar | 🟡 Journal metrics only | ❌ No | ❌ No | ❌ No | ✅ Required `EASYSCHOLAR_KEY` | Impact factor, JCR/SSCI quartile, CAS zone, JCI, ESI, warnings, rank fields |

#### Biomedical and Life Sciences

| Platform | Metadata search | PDF path | Body/full text | Citation signal | Config | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| PubMed | ✅ Yes | ❌ No | ❌ No | ❌ No | 🟡 Optional `PUBMED_API_KEY`, `NCBI_EMAIL`, `NCBI_TOOL` | NCBI E-utilities biomedical metadata |
| PubMed Central | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ None | Open biomedical full text and PMC PDFs |
| Europe PMC | ✅ Yes | 🟡 Conditional | 🟡 Conditional | ❌ No | ❌ None | Biomedical metadata and open full-text links |

#### Preprints and Conference Papers

| Platform | Metadata search | PDF path | Body/full text | Citation signal | Config | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| arXiv | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ None | Physics, CS, math, quantitative preprints |
| bioRxiv | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ None | Biology preprints |
| medRxiv | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ None | Medical preprints |
| OpenReview | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ None | Public OpenReview notes, reviews, and submissions |
| IACR ePrint | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ None | Cryptography ePrint papers |

#### Computer Science and Engineering

| Platform | Metadata search | PDF path | Body/full text | Citation signal | Config | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| DBLP | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ None | Official DBLP computer-science bibliography |
| ACM metadata | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ❌ None | Uses Crossref ACM DOI-prefix metadata; does not scrape ACM pages |
| USENIX | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ None | Uses DBLP-backed USENIX metadata; does not scrape USENIX search pages |
| IEEE Xplore | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Required `IEEE_API_KEY` | Official IEEE Xplore Metadata API |

#### Open Access and Repositories

| Platform | Metadata search | PDF path | Body/full text | Citation signal | Config | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| CORE | ✅ Yes | 🟡 Conditional | 🟡 Conditional | ❌ No | 🟡 Optional `CORE_API_KEY` | Repository records may expose PDF or full-text links |
| OpenAIRE | ✅ Yes | 🟡 Conditional | ❌ No | ❌ No | 🟡 Optional `OPENAIRE_API_KEY` | Public search usually works without a key |
| Unpaywall | 🟡 DOI lookup only | 🟡 Conditional | ❌ No | ❌ No | ✅ Required `UNPAYWALL_EMAIL` or `PAPER_SEARCH_UNPAYWALL_EMAIL` | Finds DOI-based open-access PDF locations; email, not API key |

#### Citation Indexes and Publishers

| Platform | Metadata search | PDF path | Body/full text | Citation signal | Config | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Web of Science | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Required `WOS_API_KEY` | Citation database metadata, date sorting, year ranges |
| ScienceDirect | ✅ Yes | 🟡 Conditional | ❌ No | ✅ Yes | ✅ Required `ELSEVIER_API_KEY` | Elsevier metadata; product permission is separate from Scopus |
| Springer Nature / SpringerLink | ✅ Yes | 🟡 Conditional | ❌ No | ❌ No | ✅ Required `SPRINGER_API_KEY`; 🟡 Optional `SPRINGER_OPENACCESS_API_KEY` | `springerlink` is an alias for the Springer integration |
| Wiley | ❌ No keyword search | ✅ DOI download | ✅ Yes | ❌ No | ✅ Required `WILEY_TDM_TOKEN` | TDM API; use a DOI found from another metadata source |
| Scopus | ✅ Yes | 🟡 Conditional metadata | ❌ No | ✅ Yes | ✅ Required `ELSEVIER_API_KEY` | Abstract and citation database; product permission is separate from ScienceDirect |

#### DOI-Targeted Fallback

| Platform | Metadata search | PDF path | Body/full text | Citation signal | Config | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Sci-Hub | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ None | DOI/URL-targeted lookup and final PDF fallback when enabled |

Notes:

- `Metadata search` means finding and screening papers; it is not the same as PDF download or body evidence.
- `pdf_discovery` separates open-access sources, configured entitlement sources, and Sci-Hub as a separately identified final fallback.
- EasyScholar is a journal metrics source, not a paper search source.
- Sci-Hub is not part of `metadata_search`; it is DOI/URL-targeted PDF fallback.
- `🟡 Conditional` means the platform can help only when the record exposes a DOI, open-access link, PDF URL, or configured entitlement.
- API keys are only required when you use the corresponding key-backed source or workflow.

## Configuration

Most free metadata sources work without configuration. For stable agent workflows, run setup once and store credentials in the user config file:

```bash
paper-search setup
paper-search config list --pretty
paper-search doctor --pretty
```

Default config path:

```text
~/.config/paper-search-cli/config.json
```

The config file is written with `0600` permissions. `config list`, `doctor`, and related commands mask secrets.

### API Key Tiers

| Tier | Keys | Used for | When to configure |
| --- | --- | --- | --- |
| Recommended for most users | `SEMANTIC_SCHOLAR_API_KEY` | Body snippet search and more stable Semantic Scholar requests | Configure if you use methods/detail searches or high-frequency Semantic Scholar lookup |
| Recommended for most users | `UNPAYWALL_EMAIL` or `PAPER_SEARCH_UNPAYWALL_EMAIL` | DOI-based open-access PDF resolution | Configure during setup; an email is required, not an API key |
| Recommended for most users | `CROSSREF_MAILTO` | Crossref polite pool | Configure for long-running or frequent metadata search |
| Recommended for most users | `CORE_API_KEY` | CORE repository search | Configure if you rely on CORE or hit anonymous rate limits |
| Journal metrics | `EASYSCHOLAR_KEY` | EasyScholar impact factor, JCR/SSCI, CAS, JCI, ESI, warning flags | Configure if you need journal metrics; use `paper-search setup EASYSCHOLAR_KEY` for hidden input |
| Biomedical-heavy use | `PUBMED_API_KEY`, `NCBI_EMAIL`, `NCBI_TOOL` | NCBI E-utilities stability and higher limits | Configure if PubMed is a frequent source |
| Institutional or publisher access | `WOS_API_KEY`, `IEEE_API_KEY`, `ELSEVIER_API_KEY`, `SPRINGER_API_KEY`, `SPRINGER_OPENACCESS_API_KEY`, `WILEY_TDM_TOKEN` | Web of Science, IEEE, Scopus, ScienceDirect, Springer, Wiley metadata or entitled access | Configure only when you have the relevant API or institutional permission |
| Usually optional | `OPENAIRE_API_KEY` | OpenAIRE account/quota use | Usually unnecessary for public search |

Useful key dashboards:

| Service | Link |
| --- | --- |
| EasyScholar | [EasyScholar Open API](https://www.easyscholar.cc/console/user/open) |
| Semantic Scholar | [Semantic Scholar API](https://www.semanticscholar.org/product/api) |
| Unpaywall | [Unpaywall API](https://unpaywall.org/products/api) |
| CORE | [CORE API](https://core.ac.uk/services/api) |
| PubMed | [NCBI API Keys](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/) |
| Web of Science | [Clarivate Developer Portal](https://developer.clarivate.com/apis) |
| IEEE Xplore | [IEEE Xplore Metadata API](https://developer.ieee.org/docs/read/Searching_the_IEEE_Xplore_Metadata_API) |
| Elsevier | [Elsevier Developer Portal](https://dev.elsevier.com/apikey/manage) |
| Springer Nature | [Springer Nature Developers](https://dev.springernature.com/) |
| Wiley TDM | [Wiley Text and Data Mining](https://onlinelibrary.wiley.com/library-info/resources/text-and-datamining) |
| OpenAIRE | [OpenAIRE APIs](https://develop.openaire.eu/) |

## Agent Skill

The npm package ships a bundled agent Skill at `skills/paper-search/SKILL.md`. Terminal users can use the CLI directly; AI agent workflows should install or sync the Skill so the agent can route the four main workflows correctly.

```bash
paper-search setup --install-skills agents
paper-search skills status --pretty
paper-search skills diff --targets agents --format text
paper-search skills update --targets agents --pretty
```

Supported targets include `agents`, `codex`, `claude`, `cursor`, `gemini`, `antigravity`, and `all`. Skill updates overwrite package-managed Skill files while preserving extra files in the installed Skill directory.

The Skill only teaches agents how to call the `paper-search` CLI. API keys still belong in `paper-search setup`, `paper-search config`, `.env`, or shell environment variables.

## Commands

| Command | Purpose |
| --- | --- |
| `paper-search search` | Integrated metadata search |
| `paper-search journal-metrics` | EasyScholar journal metrics lookup |
| `paper-search download` | Direct PDF download for a verified paper ID or DOI |
| `paper-search run` | Precise tool invocation with `--arg` or `--json-args` |
| `paper-search tools` | Runtime tool names and schemas |
| `paper-search doctor` | Masked config, Capability Profile, and platform status |
| `paper-search smoke` | Mock or live self-checks |
| `paper-search skills` | Bundled Skill status, diff, and update |
| `paper-search config` | User-level configuration management |

Full command and tool schema: run `paper-search tools --pretty` or see [`skills/paper-search/references/cli-contract.md`](skills/paper-search/references/cli-contract.md).

## Output

Commands return JSON by default. Use `--pretty` for formatted JSON and `--format text` only when you need a human-readable report.

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --pretty
paper-search doctor --format text
```

## Troubleshooting

| Problem | First check |
| --- | --- |
| Command not found | Reinstall globally with `npm install -g paper-search-cli` |
| Missing capability | Run `paper-search doctor --pretty` and configure the missing key with `paper-search setup` |
| Provider rate limits | Lower `--max-results`, configure the relevant key, or switch sources |
| Skill looks stale | Run `paper-search skills status --pretty`, then `paper-search skills update --targets agents --pretty` |
| Need complete CLI details | Run `paper-search tools --pretty` |

## Usage Boundaries

Some sources may be subject to platform terms, institutional subscriptions, or local law. Use restricted integrations only when you have the appropriate access rights and permission.

## Project Origin

This project acknowledges and thanks the [LinuxDo](https://linux.do) community. The CLI + Skill direction and paper-search workflow refinements were shaped by community discussions and open-source sharing.

It also references ideas from [openags/paper-search-mcp](https://github.com/openags/paper-search-mcp) while adapting the workflow to a standalone CLI.

## License

MIT
