# Paper Search CLI

Standalone command line tool for academic paper search, metadata lookup, and PDF download across multiple scholarly sources.

This project is designed for direct local use and for agent workflows. It runs as a normal CLI process, exits after each command, and does not require any long-lived background service.

## Features

- Search across Crossref, arXiv, PubMed, Web of Science, Google Scholar, bioRxiv, medRxiv, Semantic Scholar, IACR ePrint, ScienceDirect, Springer, Wiley, Scopus, and Sci-Hub.
- Output JSON by default so agents and scripts can parse results reliably.
- Write human-readable errors to stderr.
- Provide `status`, `tools`, `search`, `download`, and `run` commands.
- Use optional API keys from `.env` for premium providers.

## Install

```bash
git clone https://github.com/dr-dumpling/paper-search-cli.git
cd paper-search-cli
npm install
npm run build
```

Run without global install:

```bash
node dist/cli.js status --pretty
```

Optional local global command:

```bash
npm link
paper-search status --pretty
```

## Quick Use

```bash
paper-search search "large language model evaluation" --platform crossref --max-results 5 --pretty
paper-search search "osteoarthritis occupational exposure" --platform pubmed --max-results 3 --pretty
paper-search status --pretty
paper-search tools --pretty
```

Equivalent direct Node usage:

```bash
node dist/cli.js search "machine learning" --platform crossref --max-results 1 --pretty
```

## Commands

### `search`

Search papers through the unified search entrypoint.

```bash
paper-search search <query> [--platform crossref] [--max-results 10] [--year 2024]
```

Common flags:

- `--platform`: `crossref`, `arxiv`, `pubmed`, `webofscience`, `biorxiv`, `medrxiv`, `semantic`, `iacr`, `googlescholar`, `sciencedirect`, `springer`, `scopus`, `scihub`, or `all`
- `--max-results`: maximum result count
- `--year`: year or year range
- `--author`: author filter
- `--journal`: journal filter
- `--pretty`: pretty-print JSON

### `run`

Run a specific internal tool by name. This is useful for agents that need a stable command surface.

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=5 --pretty
paper-search run search_pubmed --json-args '{"query":"osteoarthritis","maxResults":5}' --pretty
```

List tool names:

```bash
paper-search tools --pretty
```

### `status`

Show platform capabilities and API key status. Secrets are not printed.

```bash
paper-search status --pretty
paper-search status --validate --pretty
```

`--validate` may make live requests to providers, so use it intentionally.

### `download`

Download a paper PDF when the selected platform supports downloads.

```bash
paper-search download 2301.00001 --platform arxiv --save-path ./downloads
paper-search download 10.1000/example --platform scihub --save-path ./downloads
```

## Configuration

No configuration is required for free metadata sources such as Crossref and arXiv.

For providers that require credentials:

```bash
cp .env.example .env
```

Then fill only the keys you use:

- `WOS_API_KEY`
- `PUBMED_API_KEY`
- `SEMANTIC_SCHOLAR_API_KEY`
- `ELSEVIER_API_KEY`
- `SPRINGER_API_KEY`
- `SPRINGER_OPENACCESS_API_KEY`
- `WILEY_TDM_TOKEN`
- `CROSSREF_MAILTO`

`.env` is ignored by git and must not be committed.

## Output Contract

Default output is JSON:

```json
{
  "ok": true,
  "tool": "search_papers",
  "message": "Found 1 papers.",
  "data": []
}
```

Use `--format text` when you need a plain text response:

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --format text
```

## Development

```bash
npm install
npm run build
npm test -- --runInBand
npm audit --omit=dev
```

Project layout:

```text
src/cli.ts               CLI entrypoint
src/core/                Tool registry, schemas, dispatcher, searcher initialization
src/platforms/           Platform-specific search/download implementations
src/models/              Paper data model
src/utils/               Shared utilities
tests/                   Unit and integration tests
```

## Compliance

Some providers have legal, licensing, or terms-of-service restrictions. Use each integration only where you have the right to access and process the content. Prefer official APIs and open metadata sources when compliance matters.

## License

MIT
