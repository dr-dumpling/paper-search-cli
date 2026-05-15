# Paper Search CLI Implementation Plan

## Goal

Create a standalone, agent-friendly CLI from the existing Paper Search MCP codebase without modifying the currently installed MCP server.

## Scope

- Create a new private GitHub repository: `dr-dumpling/paper-search-cli`.
- Copy the current Paper Search MCP source into an independent project.
- Add a CLI entrypoint that calls the existing searchers directly through the existing tool dispatcher.
- Keep stdout JSON by default and reserve stderr for human-readable errors/logs.
- Preserve the MCP server entrypoint for now so the code can still be used in MCP mode if needed.

## Non-goals

- Do not rewrite the 14 platform searchers.
- Do not migrate local `.env` secrets into the repository.
- Do not change the existing installed MCP server under `.codex/mcp-servers`.

## Validation

- `npm exec tsc -- --noEmit`
- `npm run build`
- `node dist/cli.js tools`
- `node dist/cli.js status`
- `node dist/cli.js search "machine learning" --platform crossref --max-results 1`

## Rollback

- Delete the local project directory: `/Users/raintse/Documents/Ai_Agent/paper-search-cli`.
- Delete the private GitHub repository `dr-dumpling/paper-search-cli` if it is no longer needed.
- Existing MCP installations remain untouched.
