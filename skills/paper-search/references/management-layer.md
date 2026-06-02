# Management Layer Reference

Use this reference when checking whether `paper-search` is installed, configured, healthy, and synchronized with the installed agent Skill. These commands help the agent decide readiness; they do not perform literature tasks.

## Management Commands

```bash
paper-search doctor --pretty
paper-search doctor --format text
paper-search smoke --mock --pretty
paper-search smoke --live --pretty
paper-search skills status --pretty
paper-search skills diff --targets agents --format text
paper-search skills update --targets agents --pretty
paper-search tools --pretty
paper-search config list --pretty
```

| Command | Purpose | Use When |
|---|---|---|
| `paper-search doctor --pretty` | Complete health report: masked config, Capability Profile, platform status, and missing items | First use, uncertain environment, or user asks what capabilities are available |
| `paper-search doctor --format text` | Human-readable health report | You need to summarize health for the user |
| `paper-search smoke --mock --pretty` | Offline check of CLI wiring, Capability Profile logic, and Skill sync status logic | After code/install changes, or when network is unavailable |
| `paper-search smoke --live --pretty` | Small real checks of free metadata, configured key-backed capabilities, and Sci-Hub mirror availability | User asks for local live verification or provider/network issues are suspected |
| `paper-search skills status --pretty` | Shows whether Installed Skill files match the Bundled Skill | Install/update checks or debugging why an agent reads old Skill text |
| `paper-search skills diff --targets agents --format text` | Previews managed-file diffs between Bundled Skill and Installed Skill | Before updating Skill files |
| `paper-search skills update --targets agents --pretty` | Syncs package-managed Skill files into the user Skill directory while preserving Extra Skill Files | After the user confirms Skill update |
| `paper-search tools --pretty` | Lists `paper-search run` tool names and argument schemas | Unsure about exact tool name or arguments |
| `paper-search config list --pretty` | Shows masked configuration status | Need to confirm whether key/email/caps are configured |

## Doctor

`paper-search doctor` is the main health report. It combines masked configuration, Capability Profile, and platform status.

Capability Profile entries are independent workflow capabilities:

- `metadata_search`: metadata search through configured/free literature sources. Sci-Hub must not be included in metadata search.
- `body_snippet_search`: Semantic Scholar Open Access snippet search. It requires `SEMANTIC_SCHOLAR_API_KEY`.
- `journal_metrics`: EasyScholar journal metrics. It requires `EASYSCHOLAR_KEY`.
- `pdf_discovery`: PDF discovery and download through source-native download, metadata PDF URLs, open-access sources, entitled-access sources when configured, and the default enabled Sci-Hub Fallback.
- `entitled_access`: user-specific access rights such as publisher API keys, database keys, TDM tokens, or institutional entitlements.

Use JSON output for agent decisions. Use `--format text` only when the user needs a readable report.

## Smoke

`paper-search smoke --mock` is offline and should pass without provider keys.

`paper-search smoke --live` performs small real checks:

- free metadata check always runs
- Sci-Hub mirror availability is checked by default without downloading PDFs
- configured key-backed capabilities get lightweight checks
- unconfigured key-backed capabilities are marked `skipped`

Live smoke severity:

- `critical` failures make the command fail.
- `degraded` means a configured or default-enabled capability did not work as expected and must include remediation, but it is not the same as whole-tool failure.
- `warning` and `skipped` are informational.

When reporting live smoke results, include any `message` and `remediation` for degraded cases.

## Skill Sync

The npm package ships a Bundled Skill under `skills/paper-search`. Installing or updating user-visible Skill files is explicit.

Supported targets:

- `agents`
- `codex`
- `claude`
- `cursor`
- `gemini`
- `antigravity`

Routine sync after package updates:

```bash
paper-search skills status --targets agents --pretty
paper-search skills diff --targets agents --format text
paper-search skills update --targets agents --pretty
```

`skills update` overwrites package-managed files and preserves Extra Skill Files. `skills diff` may show diffs only for Managed Skill Files; extra files are listed by name only.

## Package Update And Capability Setup

`skills update` only syncs Bundled Skill files into the selected Installed Skill directory. It does not update the npm package, GitHub checkout, compiled CLI files, or provider configuration.

`paper-search setup` only configures keys, email, and install destinations for the currently installed CLI. It does not update the package body.

Ordinary user update path:

```bash
npm install -g paper-search-cli@latest
paper-search skills update --targets agents --pretty
paper-search doctor --pretty
paper-search setup
paper-search smoke --mock --pretty
```

Use `doctor` before or after `setup` to inspect the Capability Profile. Missing, unavailable, or degraded capability entries should tell the agent which key, email, source, or environment item the user needs to configure.

Maintainer or local-dev update path:

```bash
git pull
npm install
npm run build
npm install -g .
paper-search skills update --targets agents --pretty
paper-search doctor --pretty
paper-search setup
paper-search smoke --mock --pretty
```

Use the local-dev path when validating this repository checkout before publishing or before installing a local build globally.

## Configuration Checks

Configuration sources, in priority order:

1. Shell environment variables
2. Current directory `.env`
3. User config file under `~/.config/paper-search-cli/config.json`
4. Free-source built-in defaults

Useful commands:

```bash
paper-search setup
paper-search config list --pretty
paper-search config get SEMANTIC_SCHOLAR_API_KEY --pretty
paper-search config get EASYSCHOLAR_KEY --pretty
paper-search doctor --pretty
```

Do not ask users to paste secrets into chat. Do not write secrets into Skill, README, tests, or logs. `doctor` and `config` output should mask configured secret values.
