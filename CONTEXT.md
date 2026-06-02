# Paper Search CLI

Paper Search CLI is an agent-facing academic literature toolchain. This context captures the project language used to describe how the CLI and agent Skill fit together.

## Language

**Bundled Skill**:
A Skill directory shipped inside the npm package so the CLI can distribute agent instructions with the same version as the executable.
_Avoid_: Embedded prompt, copied docs

**Installed Skill**:
A Bundled Skill that has been explicitly written into a user's agent Skill directory for a specific agent runtime to discover.
_Avoid_: Auto-installed skill, postinstall skill

**Skill Target**:
An agent runtime and its selected Skill directory where a Bundled Skill may become an Installed Skill.
_Avoid_: Platform, provider

**Installation Destination**:
The concrete filesystem location shown to the user before or during Skill installation.
_Avoid_: Hidden path, implicit target

**Setup Session**:
A user-facing configuration session that may also offer Skill installation after showing the relevant Installation Destinations.
_Avoid_: Silent bootstrap, automatic install

**Package Update Flow**:
A user-facing sequence for updating the CLI package body, syncing the Bundled Skill into an Installed Skill, checking the Capability Profile, and running setup or smoke checks when needed.
_Avoid_: Skill update, setup session, package install

**Friendly Management Layer**:
The user-facing command layer for installing Skills, inspecting health, previewing updates, and running smoke checks without changing the literature search domain itself.
_Avoid_: Provider routing layer, search capability layer

**Doctor Report**:
The top-level health report that combines masked configuration, Capability Profile, and platform status.
_Avoid_: Config doctor, key list

**Doctor Text Report**:
An explicitly requested human-readable rendering of the Doctor Report, enabled with a format flag while JSON remains the default command output.
_Avoid_: Default doctor output, separate health command

**Mock Smoke Check**:
An offline self-check that validates command wiring, Capability Profile logic, and Skill installation status logic without calling external academic providers or downloading PDFs.
_Avoid_: Live provider test, network check

**Live Smoke Check**:
An explicitly requested network self-check that always runs a small free-source metadata query, adds configured key-backed capability checks, marks unconfigured key-backed capabilities as skipped, and includes a lightweight Sci-Hub availability check without downloading PDFs by default.
_Avoid_: Full integration test, exhaustive provider validation

**Smoke Severity**:
The outcome level for a Smoke Check case: critical fails the command, degraded means a configured or enabled capability did not work as expected but a fallback or core path remains usable, and warning or skipped are informational. Degraded cases must include user-facing remediation guidance.
_Avoid_: Binary provider failure, unclassified smoke result

**Managed Skill File**:
A file that exists in the Bundled Skill and is therefore owned by the package during Skill installation or update.
_Avoid_: User file, extra file

**Managed Skill Diff**:
A preview of changes between Bundled Skill files and the corresponding Installed Skill managed files; Extra Skill Files are reported by name only and their contents are not read for display.
_Avoid_: Whole directory diff, user file diff

**Skill Diff Text Report**:
An explicitly requested human-readable Skill diff rendering that summarizes Skill Target status and shows unified diffs only for Managed Skill Files.
_Avoid_: Default diff output, extra file content dump

**Extra Skill File**:
A file found inside an Installed Skill directory that is not part of the Bundled Skill and is not removed by package updates.
_Avoid_: Stale file, orphan

**Routing Skill**:
A Skill whose responsibility is to route agent intent to the CLI, enforce evidence and secret-handling boundaries, and point to health checks without becoming a second implementation spec.
_Avoid_: Command manual, implementation spec

**CLI Contract**:
A reference document that records the stable command surface, output expectations, and agent-facing usage boundaries for the CLI so the Routing Skill can stay short and accurate.
_Avoid_: README copy, implementation notes

**Management Layer Reference**:
A reference document that explains how an agent uses health, smoke, configuration, and Skill sync commands to assess readiness without performing a literature task.
_Avoid_: Capability routing guide, command dump

**Capability Routing Reference**:
A reference document that maps user literature intents to workflow capabilities, command entrypoints, source boundaries, and evidence rules.
_Avoid_: Capability Profile, platform inventory, README copy

**Two-Stage Paper Workflow**:
The default workflow for open-ended literature tasks: first build and verify a paper metadata list, then download PDFs only for selected verified items.
_Avoid_: Immediate batch PDF download, search-and-download loop

**Direct Paper Request**:
A request for one explicitly identified paper, such as a DOI, PMID, PMCID, or arXiv ID, where the agent may skip broad metadata discovery while still verifying the target identity before download.
_Avoid_: Literature search, batch discovery

**Capability Profile**:
A user-facing summary of which literature workflow capabilities are available from the current configuration, independent of the individual platform names or credential keys.
_Avoid_: Key list, platform list

**Capability Degradation**:
The state where one workflow capability is unavailable or partial while other independent capabilities remain usable.
_Avoid_: Whole-tool failure, raw provider error

**Capability Reason**:
The human-readable explanation attached to a Capability Profile entry that says why the capability is available, degraded, or unavailable.
_Avoid_: Raw flag, unexplained status

**pdf_discovery**:
The capability for finding or downloading paper PDFs through the full configured PDF funnel, including source-native downloads, metadata PDF URLs, repository sources, Unpaywall, and Sci-Hub when enabled.
_Avoid_: oa_pdf_discovery

**Open Access Source**:
A PDF source class or source mode that can provide open-access PDFs or OA PDF metadata without relying on user-specific publisher entitlement.
_Avoid_: Sci-Hub source, entitled access source, native open source

**Entitled Access Source**:
A PDF source mode that depends on a publisher API key, subscription database key, TDM token, institution entitlement, or other user-specific permission to retrieve content beyond generic open access.
_Avoid_: open access source, Sci-Hub source, publisher API source

**entitled_access**:
The capability for using user-specific access rights such as publisher API keys, database keys, TDM tokens, or institutional entitlements.
_Avoid_: publisher_api

**Sci-Hub Source**:
A PDF source class used as a separately identified final fallback rather than as an open-access or official API source.
_Avoid_: open access source, entitled access source

**Sci-Hub Fallback**:
The default enabled final fallback stage of pdf_discovery, shown separately from Open Access Sources and Entitled Access Sources and suppressible per request.
_Avoid_: open access fallback, entitled fallback

**Canonical Config Key**:
The single accepted environment or user-config key for a credential.
_Avoid_: Duplicate key, parallel key, legacy alias
