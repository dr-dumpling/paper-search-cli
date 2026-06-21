# 03 - Skill And CLI Contract Update

状态：已完成。CLI、Skill、README 和 `cli-contract.md` 已同步 citation expansion 契约；本文保留为历史执行依据。

## 目标

让 citation expansion 的新工具进入 CLI、Skill、README 的稳定契约，并保证 `TOOLS` 与 `cli-contract.md` 同步。

## 改动点

- `src/core/tools.ts`: `TOOLS` 输出包含 `get_paper_citations` 和 `get_paper_references`。
- `src/core/schemas.ts`: `parseToolArgs` 支持两个 citation 工具。
- `src/core/handleToolCall.ts`: `handleToolCall` 支持两个 citation 工具。
- `skills/paper-search/references/cli-contract.md`: Direct Run Tools 增加两个工具。
- `skills/paper-search/SKILL.md`: 功能地图增加 `citation_expansion`。
- `skills/paper-search/references/capability-routing.md`: 增加 citation expansion 的使用边界和示例。
- `README.md`、`README.zh.md`: 增加简短功能说明和 `paper-search run` 示例。

## 文案边界

新增能力命名为 citation expansion，避免与普通 metadata search 混淆：

- `citations`: 施引文献 / citing papers。
- `references`: 参考文献 / cited references。

机构权限访问只写为 `DownloadTier` 预留接口，不写成可用下载能力。

## 执行步骤

1. 运行 `paper-search tools --pretty`，确认两个 citation 工具从 `TOOLS` 输出。
2. 更新 `skills/paper-search/references/cli-contract.md` 的 Direct Run Tools 列表和工具说明。
3. 更新 `skills/paper-search/SKILL.md` 的功能地图，把 citation expansion 作为独立能力。
4. 更新 `skills/paper-search/references/capability-routing.md`，写明 citation expansion 不等同于 metadata search。
5. 更新 `README.md` 和 `README.zh.md`，只放简短说明和两条 `paper-search run` 示例。
6. 更新 `tests/skills/SkillContract.test.ts` 中关于能力数量或名称的断言。

## 非目标

- 不新增顶层 `paper-search citations` 命令；第一版只使用 `paper-search run`。
- 不把 citation expansion 计入 `metadata_search` 的平台列表。
- 不更改现有工具名、参数名或默认 JSON 输出。

## 验收标准

- `paper-search tools --pretty` 输出包含两个新工具及 inputSchema。
- `tests/skills/SkillContract.test.ts` 中 Direct Run Tools 与 `TOOLS` 保持一致。
- README 和 Skill 文档不声称 WebVPN/CARSI/EZProxy 已实现。
- `paper-search run` 对未知工具的错误行为不变。
