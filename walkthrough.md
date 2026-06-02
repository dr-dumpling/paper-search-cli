# Skill + CLI Refactor Walkthrough

## Result

Implemented the confirmed smartsearch-inspired management layer for the stable `paper-search-cli` package:

- Bundled Skill installation and update through explicit CLI commands.
- Skill diff preview for managed Skill files, with extra user files listed by name only.
- Top-level Doctor Report with masked config, Capability Profile, and platform status.
- Explicit Doctor Text Report through `doctor --format text`.
- Offline `smoke --mock` checks for wiring, profile grouping, and Skill status logic.
- Live `smoke --live` checks with Smoke Severity, including default Sci-Hub mirror availability without PDF downloads.
- EasyScholar cleanup so only `EASYSCHOLAR_KEY` is accepted.
- Documentation, Skill instructions, `.env.example`, tests, and built `dist/` output updated.

## Key Commands

```bash
paper-search doctor --pretty
paper-search doctor --format text
paper-search smoke --mock --pretty
paper-search smoke --live --pretty
paper-search skills status --pretty
paper-search skills diff --targets agents --format text
paper-search skills update --targets agents --pretty
paper-search setup --install-skills agents
```

`setup` and `skills status/update` show installation destinations. Managed Skill files are overwritten during update; extra user files inside the installed Skill directory are reported and preserved. `skills diff` previews only managed file differences and never displays extra file contents.

## Live Smoke Severity

`smoke --live` treats severity as an operator-facing signal:

- `critical`: core free metadata live check failed; overall `ok=false` and the command exits non-zero.
- `degraded`: a configured or default-enabled capability failed its live verification while core metadata remains usable. This includes configured keys that cannot trigger their API and default Sci-Hub fallback mirror availability failures. Degraded cases include `remediation` and are reported to the user, but do not fail the command.
- `warning` and `skipped`: informational.

## Capability Profile

The profile now reports independent entries:

- `metadata_search`
- `body_snippet_search`
- `journal_metrics`
- `pdf_discovery`
- `entitled_access`

Every entry has `status`, `reason`, configured details, and missing details where relevant. `metadata_search` excludes Sci-Hub. `pdf_discovery` separates:

- `open_access_sources`
- `entitled_access_sources`
- `scihub_sources`

Publisher open-access paths remain listed under `open_access_sources`; publisher/API-key or entitlement paths are reported under `entitled_access_sources`.

## Verification

Passed:

```bash
npm test -- --runInBand
npm run build
```

Additional built-CLI checks passed:

```bash
node dist/cli.js skills status --targets agents --skills-root <temp-root> --pretty
node dist/cli.js skills update --targets agents --skills-root <temp-root> --pretty
node dist/cli.js skills diff --targets agents --skills-root <temp-root> --format text
node dist/cli.js smoke --mock --skills-root <temp-root> --pretty
node dist/cli.js smoke --live --pretty
node dist/cli.js doctor --pretty
node dist/cli.js doctor --format text
node dist/cli.js setup --install-skills agents --skills-root <temp-root> --pretty
```

Final scan confirmed the removed EasyScholar alias is no longer present in supported config/runtime/docs/tests/build output.

## Follow-Up Smartsearch Ideas

- Add richer provider-specific smoke checks only where they remain lightweight and do not imply paid/full-text downloads.
- Add a compact `skills diff --format text` summary-only mode if the unified diff becomes too verbose for interactive setup.
