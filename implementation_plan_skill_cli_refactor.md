# Skill + CLI Refactor Implementation Plan

## Goal

Refactor the stable `paper-search-cli` package to follow a CLI + bundled Skill distribution model inspired by smartsearch, while preserving Paper Search's own domain model:

1. Ship a Bundled Skill in the npm package.
2. Install or update the Skill only through explicit user actions.
3. Report workflow readiness through an independent Capability Profile.
4. Add offline smoke checks for the new wiring.
5. Fix EasyScholar configuration so only `EASYSCHOLAR_KEY` is accepted.

## Scope

### Skill installation

- Add a Skill installer module that loads `skills/paper-search/**` from the package.
- Add Skill Target support for:
  - `agents` -> `~/.agents/skills`
  - `codex` -> `~/.codex/skills`
  - `claude` -> `~/.claude/skills`
  - `cursor` -> `~/.cursor/skills`
  - `gemini` -> `~/.gemini/skills`
  - `antigravity` -> `~/.gemini/antigravity/skills`
- Default target selection:
  - use `agents` when `~/.agents/skills` exists
  - otherwise use `codex,claude,cursor`
- Add:
  - `paper-search skills status`
  - `paper-search skills update`
  - `paper-search setup --install-skills <targets>`
  - `paper-search setup --skip-skills`
- Show Installation Destinations before or during Skill installation.
- Match smartsearch update semantics:
  - overwrite Managed Skill Files
  - report but do not delete Extra Skill Files

### Capability Profile

- Add a Capability Profile with these entries:
  - `metadata_search`
  - `body_snippet_search`
  - `journal_metrics`
  - `pdf_discovery`
  - `entitled_access`
- Each entry must include:
  - `status`: `available | degraded | unavailable`
  - `reason`
  - configured and missing source/key details where applicable
- `metadata_search` must not include Sci-Hub.
- `pdf_discovery` must distinguish:
  - `open_access_sources`
  - `entitled_access_sources`
  - `scihub_sources`
- Keep Sci-Hub as the default final fallback in the existing download funnel.

### Doctor and smoke

- Make top-level `paper-search doctor` the main Doctor Report for masked configuration, Capability Profile, and platform status.
- Keep `paper-search config doctor` only as a compatibility surface; it should direct users toward top-level `doctor` for capability and health checks.
- Add `paper-search smoke --mock`.
- Do not add live smoke checks in this phase.

### EasyScholar key cleanup

- Remove the legacy EasyScholar alias from supported configuration.
- Read only `EASYSCHOLAR_KEY` at runtime.
- Update docs, Skill text, diagnostics, setup prompts, and tests accordingly.

## Out of Scope

- Live provider smoke checks.
- Changing the Sci-Hub default fallback behavior.
- Reworking publisher download logic beyond Capability Profile reporting.
- Replacing the existing CLI parser with a new framework.
- Porting unfinished code from `paper-search-cli-latest`.

## Expected Files

Likely touched:

- `src/cli.ts`
- `src/config/ConfigService.ts`
- `src/core/diagnostics.ts`
- `src/services/JournalMetricsService.ts`
- new `src/core/capabilityProfile.ts`
- new `src/skills/SkillInstaller.ts`
- `skills/paper-search/SKILL.md`
- `README.md`
- `README-en.md`
- tests under `tests/cli`, `tests/core`, `tests/config`, `tests/services`, and new `tests/skills`

Already added during design:

- `CONTEXT.md`
- `docs/adr/0001-explicit-skill-installation.md`
- `docs/adr/0002-independent-capability-profile.md`

## Risks

- Skill installation writes user-level agent directories; tests must use temporary roots.
- Removing the legacy EasyScholar alias is a breaking cleanup; docs and diagnostics must make the accepted key unambiguous.
- Capability Profile source grouping can drift from platform metadata; tests should lock key grouping rules.
- Setup is interactive; automated tests must use stdin-driven non-TTY behavior.

## Rollback

- Revert this branch/worktree changes with git if needed.
- No implementation step should write real user Skill directories during tests.
- Manual Skill installation can be repaired by rerunning `paper-search skills update --targets <target>`.

## Acceptance Criteria

1. `npm test -- --runInBand` passes.
2. `npm run build` passes.
3. `paper-search skills status --targets agents --skills-root <temp-root> --pretty` reports missing/up-to-date/stale/extra_files correctly in tests.
4. `paper-search skills update --targets agents --skills-root <temp-root> --pretty` installs bundled Skill files and preserves Extra Skill Files.
5. `paper-search setup --install-skills agents --skills-root <temp-root>` writes config and installs the Skill into the shown destination.
6. `paper-search doctor --pretty` includes Capability Profile with reasons.
7. `paper-search smoke --mock --pretty` verifies profile and Skill installer logic without network access.
8. The legacy EasyScholar alias no longer appears as a supported config key or runtime fallback.
