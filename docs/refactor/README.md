# paper-search-cli Refactor Execution Index

本目录是 `ARCHITECTURE_REFACTOR.zh.md` 的执行入口。总架构只保留边界；这里的每个 Markdown 都是一份可直接执行的功能任务书。

## 当前状态

| 文档 | 状态 | 执行结论 |
| --- | --- | --- |
| [01-citation-tools.md](./01-citation-tools.md) | 已完成 | `get_paper_citations` / `get_paper_references` 已接入 `TOOLS`、schema、handler 和 `CitationService`。 |
| [02-download-tier-interface.md](./02-download-tier-interface.md) | 已完成 | `download_with_fallback` 已改为 `DownloadTier` 顺序执行，默认 attempts 不包含 `institutional_access`。 |
| [03-skill-cli-contract-update.md](./03-skill-cli-contract-update.md) | 已完成 | Skill、README、`cli-contract.md` 已同步 citation expansion 契约。 |
| [04-citation-tests-and-acceptance.md](./04-citation-tests-and-acceptance.md) | 已完成 | 已补 citation schema / handler / Skill contract / fallback attempts 测试。 |
| [05-agent-repair-plan.md](./05-agent-repair-plan.md) | 可执行 | 收敛文档状态、冻结契约、修补 `DownloadTier` 插拔点，并启动下一阶段架构准备。 |
| [future-webvpn-carsi-ezproxy.md](./future-webvpn-carsi-ezproxy.md) | 未来执行 | 只能在 `DownloadTier` 稳定后，通过 `institutional_access` tier 显式启用。 |

## 当前执行顺序

1. 执行 [05-agent-repair-plan.md](./05-agent-repair-plan.md)。
2. `05` 完成后，再按 `ARCHITECTURE_REFACTOR.zh.md` 的三轴边界拆分后续任务：平台注册表派生、Searcher factory registry、统一 HttpClient。

历史任务 `01` 到 `04` 已完成，不应重复执行。若需要回看实现边界，只把它们作为记录和验收依据。

## 未来执行

WebVPN / CARSI / EZProxy 接入只走 [future-webvpn-carsi-ezproxy.md](./future-webvpn-carsi-ezproxy.md)。该任务依赖 `DownloadTier`，不得跳过 `DownloadTier` 直接写机构登录逻辑。

## 文档关系

- 当前现状：[../ARCHITECTURE.zh.md](../ARCHITECTURE.zh.md)
- 目标总架构：[../ARCHITECTURE_REFACTOR.zh.md](../ARCHITECTURE_REFACTOR.zh.md)
- 当前执行：本目录 `05-agent-repair-plan.md`
- 历史完成：本目录 `01` 到 `04`
- 未来执行：本目录 `future-webvpn-carsi-ezproxy.md`

## 非目标

- 不在索引里重复实现细节。
- 不把未来机构访问写成当前能力。
- 不把已完成任务继续标记为待执行。

## 验收标准

- `01` 到 `04` 明确标为已完成。
- `05-agent-repair-plan.md` 包含目标、边界、阶段、验收标准和非目标。
- `future-webvpn-carsi-ezproxy.md` 明确依赖 `DownloadTier`。
- `../ARCHITECTURE.zh.md` 描述当前 v0.3.1 架构。
- `../ARCHITECTURE_REFACTOR.zh.md` 继续作为三轴目标态总览。
