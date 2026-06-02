# Friendly Management Layer Implementation Plan

## Goal

Extend the existing smartsearch-inspired management surface with the next Friendly Management Layer features:

1. Add `paper-search skills diff`.
2. Add `paper-search doctor --format text`.
3. Add `paper-search smoke --live` with scoped live checks and Smoke Severity.

These features must not change the paper-search literature domain, provider routing, or default JSON output contract.

## Scope

### Skill diff

- Add `paper-search skills diff [--targets ...]`.
- Default output stays JSON.
- `--format text` outputs a Skill Diff Text Report.
- Diff only Managed Skill Files.
- Extra Skill Files are reported by name and count only; their contents are not displayed.
- Include target status, missing managed files, stale managed files, extra files, and unified diff hunks for managed file changes.
- Preserve current `skills status/update` behavior.

### Doctor text report

- Add explicit `paper-search doctor --format text`.
- Keep JSON as the default for `paper-search doctor`.
- Text output should summarize:
  - config path and configured/missing counts
  - Capability Profile entries with status and reason
  - selected platform status counts
  - next suggested commands
- Do not print secrets.
- Existing `config doctor` remains a compatibility surface that points to top-level `doctor`.

### Live smoke

- Add `paper-search smoke --live`.
- Keep `paper-search smoke --mock` offline and unchanged.
- Live smoke should always run a tiny free-source metadata query.
- Live smoke should add key-backed checks only when the relevant key is configured:
  - `SEMANTIC_SCHOLAR_API_KEY` -> body snippet or lightweight Semantic Scholar check
  - `EASYSCHOLAR_KEY` -> `journal-metrics "Nature"`
  - publisher/database keys -> lightweight metadata checks, not paid/full-text downloads
- Unconfigured key-backed checks are `skipped`, not failures.
- Include a lightweight Sci-Hub availability check by default, but do not download PDFs.
- Use Smoke Severity:
  - `critical` makes overall `ok=false` and exits non-zero
  - `degraded` means a configured or enabled capability failed its live check while fallback/core capability remains usable; it must include user-facing remediation guidance and does not fail the command
  - `warning` and `skipped` are informational and do not fail the command
- Default live smoke should use small limits and avoid downloading large files.

## Out of Scope

- Changing search provider routing.
- Adding web/docs/deep research providers from smartsearch.
- Making text output the default.
- Displaying Extra Skill File contents.
- Exhaustive provider validation.
- Default Sci-Hub PDF downloads during live smoke.

## Expected Files

Likely touched:

- `src/cli.ts`
- `src/skills/SkillInstaller.ts`
- possibly new `src/core/reporting.ts` or `src/core/textReports.ts`
- tests under `tests/cli`, `tests/skills`, and possibly `tests/core`
- `README.md`
- `README-en.md`
- `skills/paper-search/SKILL.md`
- `walkthrough.md`
- `dist/` after build

Already updated during grill:

- `CONTEXT.md`
- `docs/adr/0003-friendly-management-layer.md`

## Risks

- `smoke --live` can become flaky if external providers are too broad; keep live checks small and severity-aware.
- Text renderers can accidentally expose secrets if they render raw config values; use existing masked entries only.
- `skills diff` can expose local user content if it reads Extra Skill Files; only list extra filenames.
- Default JSON output must remain stable for agent/script callers.

## Rollback

- Revert this plan's source/test/docs changes with git.
- No live smoke test should write persistent user data.
- Skill diff is read-only.

## Acceptance Criteria

1. `npm test -- --runInBand` passes.
2. `npm run build` passes.
3. `paper-search skills diff --targets agents --skills-root <temp-root> --pretty` reports missing/stale/extra managed state in JSON.
4. `paper-search skills diff --targets agents --skills-root <temp-root> --format text` renders a Skill Diff Text Report with managed diffs and extra filenames only.
5. `paper-search doctor --format text` renders a human-readable Doctor Text Report and does not print secrets.
6. `paper-search doctor --pretty` remains JSON.
7. `paper-search smoke --mock --pretty` remains offline and passing.
8. `paper-search smoke --live --pretty` runs scoped live checks, uses Smoke Severity, skips unconfigured key-backed checks, checks Sci-Hub availability by default, and does not download PDFs.
9. README and Skill docs describe the new management commands and preserve the default JSON contract.
