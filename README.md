# Paper Search CLI

[中文](README-sc.md)

Paper Search CLI is a standalone Node.js command line tool for searching, validating, and downloading academic papers from multiple scholarly sources. It is designed for direct terminal use, automation scripts, and agent workflows that need a stable command surface with predictable JSON output.

It keeps the detailed platform coverage and safety model of the earlier Paper Search implementation, but runs as a normal CLI process. There is no long-running protocol server to configure, start, or keep alive.

![Node.js](https://img.shields.io/badge/node.js->=18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.5.3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platforms](https://img.shields.io/badge/platforms-14-brightgreen.svg)
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)

## Key Features

- **14 academic platforms**: Crossref, arXiv, Web of Science, PubMed, Google Scholar, bioRxiv, medRxiv, Semantic Scholar, IACR ePrint, Sci-Hub, ScienceDirect, Springer Nature, Wiley, and Scopus.
- **Single command interface**: install once, then call `paper-search` from terminal, scripts, or agents.
- **JSON-first output**: stdout is machine-readable JSON by default; stderr is reserved for human-readable diagnostics.
- **Unified paper model**: normalized title, authors, DOI, source, dates, abstract, PDF URL, citation count, and provider-specific metadata where available.
- **Security-first request handling**: DOI validation, query sanitization, sensitive data masking, and structured error handling.
- **Rate limits and retry logic**: platform-specific rate limiting and retryable API error handling.
- **PDF download support**: download from supported sources such as arXiv, bioRxiv, medRxiv, Semantic Scholar, IACR, Sci-Hub, Springer open access, and Wiley DOI-based access.
- **Agent-friendly commands**: `tools`, `status`, `search`, `download`, and `run` cover both simple use and precise advanced calls.

## Supported Platforms

| Platform | Search | Download | Full Text | Citations | API Key | Special Features |
| --- | --- | --- | --- | --- | --- | --- |
| Crossref | Yes | No | No | Yes | No | Default search platform, broad metadata coverage |
| arXiv | Yes | Yes | Yes | No | No | Physics, CS, math, and related preprints |
| Web of Science | Yes | No | No | Yes | Required | Citation database, date sorting, year ranges |
| PubMed | Yes | No | No | No | Optional | Biomedical literature through NCBI E-utilities |
| Google Scholar | Yes | No | No | Yes | No | Broad academic discovery, scrape-based |
| bioRxiv | Yes | Yes | Yes | No | No | Biology preprints |
| medRxiv | Yes | Yes | Yes | No | No | Medical preprints |
| Semantic Scholar | Yes | Yes | No | Yes | Optional | AI-oriented semantic paper search |
| IACR ePrint | Yes | Yes | Yes | No | No | Cryptography papers |
| Sci-Hub | Yes | Yes | No | No | No | DOI-based paper lookup and PDF retrieval |
| ScienceDirect | Yes | No | No | Yes | Required | Elsevier metadata and abstracts |
| Springer Nature | Yes | Open access only | No | No | Required | Metadata API and OpenAccess API |
| Wiley | No keyword search | Yes | Yes | No | Required | TDM API, DOI-based PDF download only |
| Scopus | Yes | No | No | Yes | Required | Abstract and citation database |

Notes:

- Wiley does not support keyword search through the Wiley TDM API. Use `search_crossref` to find Wiley articles and then use `download_paper` with `platform=wiley` and the DOI.
- `platform=all` uses the current dispatcher behavior and may use a focused fallback path rather than querying every source exhaustively.
- Google Scholar and Sci-Hub may have legal, contractual, or rate-limit constraints. See [Compliance](#compliance).

## Quick Start

### Requirements

- Node.js >= 18.0.0
- npm

### Install From GitHub

```bash
git clone https://github.com/dr-dumpling/paper-search-cli.git
cd paper-search-cli
npm install
npm run build
```

### Run Directly

```bash
node dist/cli.js status --pretty
node dist/cli.js search "large language model evaluation" --platform crossref --max-results 5 --pretty
```

### Register The `paper-search` Command

```bash
npm link
paper-search status --pretty
paper-search search "osteoarthritis occupational exposure" --platform pubmed --max-results 3 --pretty
```

`npm link` creates a local command entry for this checkout. Re-run `npm run build` after code changes.

## Configuration

Most free metadata sources work without configuration. Copy `.env.example` only when you need premium providers or higher rate limits.

```bash
cp .env.example .env
```

### Environment Variables

```bash
# Web of Science, required for Web of Science search
WOS_API_KEY=your_web_of_science_api_key_here
WOS_API_VERSION=v1

# PubMed, optional; increases rate limit from 3 requests/sec to 10 requests/sec
PUBMED_API_KEY=your_ncbi_api_key_here

# Semantic Scholar, optional; increases request limits
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_api_key_here

# Elsevier, required for ScienceDirect and Scopus
ELSEVIER_API_KEY=your_elsevier_api_key_here

# Springer Nature, required for Springer search and open access download
SPRINGER_API_KEY=your_springer_api_key_here
SPRINGER_OPENACCESS_API_KEY=your_openaccess_api_key_here

# Wiley TDM, required for Wiley DOI-based PDF download
WILEY_TDM_TOKEN=your_wiley_tdm_token_here

# Crossref polite pool, optional but recommended
CROSSREF_MAILTO=you@example.com
```

### API Key Sources

- Web of Science: [Clarivate Developer Portal](https://developer.clarivate.com/apis)
- PubMed: [NCBI API Keys](https://ncbiinsights.ncbi.nlm.nih.gov/2017/11/02/new-api-keys-for-the-e-utilities/)
- Semantic Scholar: [Semantic Scholar API](https://www.semanticscholar.org/product/api)
- Elsevier: [Elsevier Developer Portal](https://dev.elsevier.com/apikey/manage)
- Springer Nature: [Springer Nature Developers](https://dev.springernature.com/)
- Wiley TDM: [Wiley Text and Data Mining](https://onlinelibrary.wiley.com/library-info/resources/text-and-datamining)

`.env` is ignored by git. Do not commit API keys or tokens.

## Output Contract

By default, every command writes JSON to stdout.

```json
{
  "ok": true,
  "tool": "search_papers",
  "message": "Found 1 papers.",
  "data": []
}
```

Use `--pretty` for formatted JSON:

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --pretty
```

Use `--format text` if you need the raw text response:

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --format text
```

Use `--include-text` to keep the raw response text alongside parsed JSON:

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=3 --include-text --pretty
```

## Commands

### `paper-search search`

Unified search entrypoint.

```bash
paper-search search <query> [options]
```

Examples:

```bash
paper-search search "machine learning" --platform crossref --max-results 10 --pretty
paper-search search "transformer neural networks" --platform arxiv --category cs.AI --year 2023 --pretty
paper-search search "COVID-19 vaccine efficacy" --platform pubmed --max-results 20 --year 2023 --pretty
paper-search search "CRISPR gene editing" --platform webofscience --journal Nature --max-results 15 --pretty
```

Common options:

| Option | Description |
| --- | --- |
| `--platform` | Source platform. Default: `crossref` |
| `--max-results` | Maximum result count |
| `--year` | Year filter, e.g. `2024`, `2020-2024`, `2020-` |
| `--author` | Author name filter |
| `--journal` | Journal name filter |
| `--category` | Category filter, mainly arXiv/bioRxiv/medRxiv |
| `--days` | Days back for bioRxiv/medRxiv |
| `--sort-by` | `relevance`, `date`, or `citations` |
| `--sort-order` | `asc` or `desc` |

### `paper-search run`

Run a specific internal tool by name. This is the most precise command for agent workflows.

```bash
paper-search run <tool-name> --arg key=value --arg key=value
paper-search run <tool-name> --json-args '{"key":"value"}'
paper-search run <tool-name> --json-args @args.json
```

Examples:

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=5 --pretty
paper-search run search_pubmed --json-args '{"query":"osteoarthritis","maxResults":5,"sortBy":"date"}' --pretty
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --pretty
```

### `paper-search tools`

List all available tool names, descriptions, and input schemas.

```bash
paper-search tools --pretty
```

### `paper-search status`

Show platform capabilities and API key status. Secrets are never printed.

```bash
paper-search status --pretty
paper-search status --validate --pretty
```

`--validate` may make live provider requests. Use it when you intentionally want credential validation.

### `paper-search download`

Download a paper PDF through a platform that supports downloads.

```bash
paper-search download <paper-id-or-doi> --platform <platform> [--save-path ./downloads]
```

Examples:

```bash
paper-search download 2301.00001 --platform arxiv --save-path ./downloads
paper-search download 10.1000/example --platform scihub --save-path ./downloads
paper-search download 10.1111/jtsb.12390 --platform wiley --save-path ./downloads
```

## Tool Reference

These names can be used with `paper-search run`.

### `search_papers`

Search across the unified dispatcher.

```bash
paper-search run search_papers --json-args '{"query":"machine learning","platform":"crossref","maxResults":10,"year":"2023","sortBy":"date"}' --pretty
```

Supported platforms:

```text
crossref, arxiv, webofscience, wos, pubmed, biorxiv, medrxiv, semantic,
iacr, googlescholar, scholar, scihub, sciencedirect, springer, scopus, all
```

### `search_crossref`

Search Crossref, the default free metadata source.

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=10 --arg year=2023 --arg sortBy=relevance --arg sortOrder=desc --pretty
```

### `search_arxiv`

Search arXiv preprints.

```bash
paper-search run search_arxiv --arg query="transformer neural networks" --arg maxResults=10 --arg category=cs.AI --arg year=2023 --arg sortBy=date --arg sortOrder=desc --pretty
```

### `search_pubmed`

Search PubMed/MEDLINE biomedical literature.

```bash
paper-search run search_pubmed --json-args '{"query":"COVID-19 vaccine efficacy","maxResults":20,"year":"2023","journal":"New England Journal of Medicine","publicationType":["Journal Article","Clinical Trial"],"sortBy":"date"}' --pretty
```

### `search_webofscience`

Search Web of Science. Requires `WOS_API_KEY`.

```bash
paper-search run search_webofscience --arg query="CRISPR gene editing" --arg maxResults=15 --arg year=2022 --arg journal=Nature --pretty
```

### `search_google_scholar`

Search Google Scholar.

```bash
paper-search run search_google_scholar --arg query="deep learning" --arg maxResults=10 --arg yearLow=2020 --arg yearHigh=2024 --pretty
```

### `search_biorxiv` and `search_medrxiv`

Search preprint servers by recent day window and optional category.

```bash
paper-search run search_biorxiv --arg query="genomics" --arg maxResults=10 --arg days=30 --pretty
paper-search run search_medrxiv --arg query="epidemiology" --arg maxResults=10 --arg days=60 --pretty
```

### `search_semantic_scholar`

Search Semantic Scholar with optional field filters.

```bash
paper-search run search_semantic_scholar --json-args '{"query":"graph neural networks","maxResults":10,"fieldsOfStudy":["Computer Science"]}' --pretty
```

### `search_iacr`

Search IACR ePrint Archive.

```bash
paper-search run search_iacr --arg query="zero knowledge proof" --arg maxResults=10 --arg fetchDetails=true --pretty
```

### `search_sciencedirect`

Search ScienceDirect. Requires `ELSEVIER_API_KEY`.

```bash
paper-search run search_sciencedirect --arg query="materials science" --arg maxResults=10 --arg openAccess=true --pretty
```

### `search_scopus`

Search Scopus. Requires `ELSEVIER_API_KEY`.

```bash
paper-search run search_scopus --arg query="citation analysis" --arg maxResults=10 --arg documentType=ar --pretty
```

### `search_springer`

Search Springer Nature. Requires `SPRINGER_API_KEY`.

```bash
paper-search run search_springer --arg query="machine learning" --arg maxResults=10 --arg type=Journal --arg openAccess=true --pretty
```

### `search_scihub`

Lookup a DOI or article URL through Sci-Hub and optionally download a PDF.

```bash
paper-search run search_scihub --arg doiOrUrl="10.1038/nature12373" --arg downloadPdf=false --pretty
paper-search run search_scihub --arg doiOrUrl="10.1038/nature12373" --arg downloadPdf=true --arg savePath=./downloads --pretty
```

### `check_scihub_mirrors`

Show Sci-Hub mirror health.

```bash
paper-search run check_scihub_mirrors --pretty
paper-search run check_scihub_mirrors --arg forceCheck=true --pretty
```

### `get_paper_by_doi`

Lookup metadata by DOI.

```bash
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --arg platform=all --pretty
paper-search run get_paper_by_doi --arg doi="10.1038/nature12373" --arg platform=arxiv --pretty
```

### `download_paper`

Download PDF files from supported platforms.

```bash
paper-search run download_paper --arg paperId="2301.00001" --arg platform=arxiv --arg savePath=./downloads --pretty
```

Supported download platforms:

```text
arxiv, biorxiv, medrxiv, semantic, iacr, scihub, springer, wiley
```

### `search_wiley`

Wiley keyword search is not supported by the Wiley TDM API. Use Crossref first, then download by DOI:

```bash
paper-search run search_crossref --arg query="site:wiley.com machine learning" --arg maxResults=10 --pretty
paper-search run download_paper --arg paperId="10.1111/example" --arg platform=wiley --pretty
```

### `get_platform_status`

Same as `paper-search status`.

```bash
paper-search run get_platform_status --pretty
paper-search run get_platform_status --arg validate=true --pretty
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test -- --runInBand
```

### Type Check

```bash
npm exec tsc -- --noEmit
```

### Security Audit

```bash
npm audit --omit=dev
```

### Project Layout

```text
src/cli.ts               CLI entrypoint
src/core/                Tool registry, schemas, dispatcher, searcher initialization
src/platforms/           Platform-specific search/download implementations
src/models/              Unified paper model
src/services/            Shared higher-level services
src/utils/               Logging, rate limiting, quota, cache, security, PDF helpers
tests/                   Unit and integration tests
```

### Adding A New Platform

1. Create a new searcher in `src/platforms/`.
2. Extend `PaperSource` and implement `search`, `downloadPdf`, `readPaper`, and `getCapabilities`.
3. Register the searcher in `src/core/searchers.ts`.
4. Add a schema in `src/core/schemas.ts`.
5. Add a tool definition in `src/core/tools.ts`.
6. Add dispatch handling in `src/core/handleToolCall.ts`.
7. Add tests under `tests/platforms/`.
8. Run build, tests, and audit.

## Troubleshooting

### Command Not Found

Run from the project:

```bash
node dist/cli.js status --pretty
```

Or register the local command:

```bash
npm link
paper-search status --pretty
```

### Missing API Key

Run:

```bash
paper-search status --pretty
```

If a provider shows `missing`, add the relevant key to `.env` and rerun the command.

### Provider Rate Limits

Reduce `--max-results`, avoid repeated live validation, and prefer sources with official APIs. PubMed and Semantic Scholar support optional keys for better limits.

### JSON Parsing In Scripts

Use default JSON output and parse stdout. Human diagnostics are written to stderr.

## Compliance

This project includes integrations that may have legal, contractual, or ethical constraints. You are responsible for ensuring usage complies with applicable law, institutional policy, and third-party terms.

- Sci-Hub may provide access to copyrighted works without authorization in many jurisdictions. Use only when you have legal access rights.
- Google Scholar automation may violate Google terms or trigger blocking. Prefer official APIs or open metadata sources for compliance-sensitive work.
- Provider API keys may be subject to institutional terms. Do not share or commit credentials.

## License

MIT
