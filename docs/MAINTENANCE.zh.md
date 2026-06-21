# paper-search-cli Maintenance Documentation

本文是维护文档入口。当前架构事实源仍是 [`ARCHITECTURE.zh.md`](./ARCHITECTURE.zh.md)；本文件负责把 Agent 引导到能力、依赖、契约和维护流程文档。

---

## 1. Agent 先读顺序

```text
1. ARCHITECTURE.zh.md
2. MAINTENANCE.zh.md
3. agent-maintenance/README.zh.md
4. capabilities/<相关能力>.zh.md
5. dependencies/<相关依赖>.zh.md
6. contracts/<相关契约>.zh.md
7. agent-maintenance/checklists.zh.md
```

---

## 2. 文档分层

| 层 | 目录 | 用途 |
|---|---|---|
| 当前架构 | `ARCHITECTURE.zh.md` | 当前事实源 |
| 后续路线 | `ROADMAP.zh.md`, `roadmap/` | 未来规划，不代表当前能力 |
| Agent 维护流程 | `agent-maintenance/` | 路由、checklist、recipe、禁止项、代码组织升级 |
| 能力编排 | `capabilities/` | 五个主功能和 management layer 的维护边界 |
| 共享依赖 | `dependencies/` | registry、platform adapters、HTTP、PDF、Paper、config、Skill |
| 对外契约 | `contracts/` | CLI tools、JSON output、Capability Profile、Skill、测试矩阵 |

---

## 3. 常见任务入口

| 任务 | 入口文档 |
|---|---|
| 判断能不能改某个功能 | `agent-maintenance/README.zh.md` |
| 新增普通平台 | `agent-maintenance/change-recipes.zh.md` + `dependencies/platform-registry.zh.md` |
| 改搜索能力 | `capabilities/metadata-search.zh.md` |
| 改引文扩展 | `capabilities/citation-expansion.zh.md` |
| 改 PDF fallback | `capabilities/pdf-discovery.zh.md` |
| 改期刊指标 | `capabilities/journal-metrics.zh.md` |
| 改正文片段 | `capabilities/body-snippet-search.zh.md` |
| 改 doctor/smoke/config/skills | `capabilities/management-layer.zh.md` |
| 改工具名或 schema | `contracts/cli-tools-contract.zh.md` |
| 改 JSON 输出 | `contracts/json-output-contract.zh.md` |
| 改测试要求 | `contracts/test-contracts.zh.md` |
| 规划代码目录独立维护 | `agent-maintenance/code-organization-upgrade.zh.md` |

---

## 4. 维护原则

- 当前能力写入 `ARCHITECTURE.zh.md` 和 `capabilities/`。
- 未来能力写入 `ROADMAP.zh.md` 或 `roadmap/`。
- 共享实现写入 `dependencies/`。
- 不能破坏的对外行为写入 `contracts/`。
- Agent 执行步骤、禁止项和 checklist 写入 `agent-maintenance/`。

---

## 5. 代码独立维护结论

代码层面建议继续升级为独立功能目录，但必须分阶段进行，不应一次性大搬迁。具体路线见：

```text
docs/agent-maintenance/code-organization-upgrade.zh.md
```
