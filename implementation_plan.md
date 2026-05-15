# Paper Search CLI Implementation Plan

## Goal

Create a standalone, agent-friendly CLI from the existing Paper Search codebase without modifying the currently installed legacy integration.

## Scope

- Create a new private GitHub repository: `dr-dumpling/paper-search-cli`.
- Copy the current Paper Search source into an independent project.
- Add a CLI entrypoint that calls the existing searchers directly through the existing tool dispatcher.
- Keep stdout JSON by default and reserve stderr for human-readable errors/logs.
- Remove protocol-specific server entrypoints from the CLI project.

## Non-goals

- Do not rewrite the 14 platform searchers.
- Do not migrate local `.env` secrets into the repository.
- Do not change the existing installed legacy integration outside this repository.

## Validation

- `npm exec tsc -- --noEmit`
- `npm run build`
- `node dist/cli.js tools`
- `node dist/cli.js status`
- `node dist/cli.js search "machine learning" --platform crossref --max-results 1`

## Rollback

- Delete the local project directory: `/Users/raintse/Documents/Ai_Agent/paper-search-cli`.
- Delete the private GitHub repository `dr-dumpling/paper-search-cli` if it is no longer needed.
- Existing legacy installations remain untouched.
