# Agent Maintenance Guide

本文是 Agent 维护 `paper-search-cli` 的总入口。任何代码或文档修改前，先按本文路由到对应能力、依赖和契约文档。

---

## 1. 维护总原则

Agent 必须先判断用户请求属于哪一类：

1. **能力编排层改动**：改某个用户可见功能，例如搜索、引文扩展、PDF 下载、期刊指标、正文片段、管理层。
2. **共享依赖改动**：改平台注册表、平台适配器、HTTP、PDF 下载工具、配置、Skill 分发或模型。
3. **对外契约改动**：改工具名、schema、JSON 输出、Capability Profile、Skill 文档或测试断言。
4. **路线规划改动**：只改 roadmap，不改变当前实现。

默认规则：

- 能只改一个能力目录，就不要改共享依赖。
- 能只改共享依赖，就不要改 CLI 对外契约。
- 改对外契约前必须同时改测试和 Skill / README / contract 文档。
- 不确定影响面时，先读 `docs/ARCHITECTURE.zh.md` 和本文，不要直接改代码。

---

## 2. 必读顺序

每次维护按此顺序读取：

```text
1. docs/ARCHITECTURE.zh.md
2. docs/agent-maintenance/README.zh.md
3. 根据任务读取 docs/capabilities/*.zh.md
4. 如果触及共享实现，读取 docs/dependencies/*.zh.md
5. 如果触及对外行为，读取 docs/contracts/*.zh.md
6. 按 docs/agent-maintenance/checklists.zh.md 收尾
```

---

## 3. 任务路由表

| 用户请求 | 先读能力文档 | 可能还要读 |
|---|---|---|
| 改论文搜索、多源检索、source 解析、去重 | `docs/capabilities/metadata-search.zh.md` | `dependencies/platform-registry.zh.md`, `dependencies/platform-adapters.zh.md`, `contracts/cli-tools-contract.zh.md` |
| 改施引文献 / 参考文献 | `docs/capabilities/citation-expansion.zh.md` | `dependencies/http-infrastructure.zh.md`, `contracts/json-output-contract.zh.md` |
| 改 PDF 下载、fallback、Sci-Hub 抑制、DownloadTier | `docs/capabilities/pdf-discovery.zh.md` | `dependencies/pdf-download-infrastructure.zh.md`, `contracts/json-output-contract.zh.md` |
| 改期刊指标 | `docs/capabilities/journal-metrics.zh.md` | `dependencies/config-and-secrets.zh.md`, `contracts/json-output-contract.zh.md` |
| 改正文片段检索 | `docs/capabilities/body-snippet-search.zh.md` | `dependencies/http-infrastructure.zh.md`, `contracts/cli-tools-contract.zh.md` |
| 改 doctor/status/smoke/config/skills/tools | `docs/capabilities/management-layer.zh.md` | `dependencies/config-and-secrets.zh.md`, `dependencies/skill-distribution.zh.md`, `contracts/capability-profile-contract.zh.md` |
| 新增普通论文平台 | `docs/capabilities/metadata-search.zh.md` | `dependencies/platform-registry.zh.md`, `dependencies/platform-adapters.zh.md`, `contracts/test-contracts.zh.md` |
| 改平台 alias / default all source / generic tools | `docs/dependencies/platform-registry.zh.md` | `contracts/cli-tools-contract.zh.md`, `contracts/test-contracts.zh.md` |
| 改 HTTP、proxy、retry、cache、rate limit | `docs/dependencies/http-infrastructure.zh.md` | 受影响 capability 文档和测试契约 |
| 改 Paper 模型或 JSON 序列化 | `docs/dependencies/paper-model.zh.md` | `contracts/json-output-contract.zh.md` |
| 改 Skill 或 Agent instructions | `docs/dependencies/skill-distribution.zh.md` | `contracts/skill-contract.zh.md` |
| 规划 WebVPN / CARSI / EZProxy | `docs/roadmap/FUTURE_INSTITUTIONAL_ACCESS.zh.md` | 不得改当前 README / Skill 当前能力表 |

---

## 4. 安全等级

| 等级 | 说明 | 允许动作 |
|---|---|---|
| S0 文档说明 | 不改代码，不改契约 | 修改 docs / README 中的说明性内容 |
| S1 单能力内部改动 | 只影响一个能力，工具名和 JSON 输出不变 | 改单个 capability service/handler/schema 的内部逻辑，补测试 |
| S2 共享依赖改动 | 影响多个能力 | 改 registry、platform adapters、HttpClient、Paper、config，必须跑相关测试 |
| S3 对外契约改动 | 影响工具、schema、JSON、Skill | 必须同步 contracts、Skill、README、tests，慎用 |
| S4 未来能力规划 | 当前不可用能力 | 只能写 roadmap，不得写成当前能力 |

默认尽量把改动控制在 S0–S2。S3 必须有明确用户要求。S4 只能进入 roadmap。

---

## 5. 强制禁止项

维护时不得：

- 把 WebVPN、CARSI、EZProxy、institutional login 写成当前能力。
- 让 CLI 接收账号、密码、验证码、cookie、token 参数。
- 把真实 API key、token、cookie、账号、密码写入代码、文档、测试、Skill、日志或回复。
- 把 `citation_expansion` 当作普通关键词检索。
- 把 `journal_metrics` 放进论文平台注册表。
- 把 `body_snippet_search` 泛化成普通 platform schema。
- 把 Sci-Hub 写成 Open Access source 或 Entitled Access source。
- 让 capability 反向依赖 management layer。
- 不更新测试就改工具名、schema 或 JSON 输出。
- 一次性迁移所有平台到 HttpClient。

更完整禁止清单见 `docs/agent-maintenance/forbidden-changes.zh.md`。

---

## 6. 修改收尾流程

每次改动完成后执行：

1. 根据 `docs/agent-maintenance/checklists.zh.md` 找到对应 checklist。
2. 根据 `docs/contracts/test-contracts.zh.md` 跑必需测试。
3. 如改动触及 CLI / Skill / README / docs，检查对应文档是否同步。
4. 如改动触及 secrets、配置、URL、cookie、token，确认输出脱敏。
5. 在 PR 描述中说明：改动范围、非目标、测试结果、是否改变对外契约。

---

## 7. 代码独立维护路线

当前业务能力边界已经足够清楚，但代码物理目录仍处于过渡状态。后续可以逐步迁移到 `src/capabilities/` 独立目录。

建议顺序：

1. `journal-metrics`
2. `citation-expansion`
3. `pdf-discovery`
4. `body-snippet-search`
5. `metadata-search`
6. `management-layer`

迁移时必须保持现有工具名、schema、JSON 输出、测试和 Skill contract 不变。具体操作见 `docs/agent-maintenance/change-recipes.zh.md`。
