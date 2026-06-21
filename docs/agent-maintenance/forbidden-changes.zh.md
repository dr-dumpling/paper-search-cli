# Forbidden Changes

本文列出 Agent 维护项目时不得执行的改动。除非用户明确要求重写项目架构并同步所有契约，否则这些规则视为硬约束。

---

## 1. 安全与凭证

禁止：

- 在代码、文档、测试、Skill、日志、README 或 PR 描述中写入真实 API key、token、cookie、账号、密码、验证码。
- 让 CLI 参数接收账号、密码、验证码、cookie、token。
- 在 doctor、status、smoke、skills diff、error message 中打印未脱敏 secret。
- 读取或展示用户浏览器 profile、cookie store、session 文件的敏感内容。

允许：

- 使用占位符，例如 `your_key`、`sk_xxx`、`10.xxxx/xxxxx`。
- 写明用户应通过 `paper-search setup`、`paper-search config`、`.env` 或环境变量配置密钥。
- 在 roadmap 中规划本机可见浏览器登录，但必须明确当前未实现。

---

## 2. 当前能力边界

禁止：

- 把 WebVPN、CARSI、EZProxy、institutional login、browser session reuse 写成当前能力。
- 把未来 CLI 草案写入当前 `paper-search --help`、Skill 当前能力表、README 当前功能表或 CLI contract。
- 默认启用 `institutional_access`。
- 让 `download_with_fallback` 默认 attempts 出现 `institutional_access`。

允许：

- 在 `docs/roadmap/FUTURE_INSTITUTIONAL_ACCESS.zh.md` 中规划未来机构访问。
- 在 `pdf-discovery` 文档中说明未来 tier 必须插入到 `scihub` 前，并默认不启用。

---

## 3. 能力域边界

禁止：

- 让 `metadata_search` 直接执行 PDF 下载策略。
- 让 `pdf_discovery` 主动扩展关键词搜索或批量构建文献列表。
- 把 `citation_expansion` 当作普通关键词检索源。
- 把 `journal_metrics` 当作论文平台。
- 把 `body_snippet_search` 泛化成普通 platform schema。
- 让 capability import management layer。
- 让 management layer 实现文献任务本身。

允许：

- `pdf_discovery` 消费 `Paper`、DOI、title、source。
- `metadata_search` 返回可供 PDF 下载使用的 `Paper` 元数据。
- management layer 读取 capability 状态并生成 doctor/status/smoke 报告。

---

## 4. 数据源与平台注册表

禁止：

- 只因为平台有 `directTool` 就让它使用 generic schema。
- 把特殊 schema 工具迁移到 generic schema：如 CORE、Google Scholar、Scopus、Semantic snippets、Sci-Hub、Wiley deprecated tool。
- 把 alias 当作 canonical platform 写入 default all source。
- 新增平台时只改 `platforms/`，不更新 metadata/factory/tests。

允许：

- `schemaKind: 'generic'` 的平台走 generic tool/schema 路径。
- 特殊平台保留手写 schema 或 capability 私有 schema。
- alias 通过 `platformMetadata.aliases` 派生。

---

## 5. HTTP 与基础设施

禁止：

- 一次性迁移所有平台到 `HttpClient`。
- 在平台适配器里复制 retry/cache/rate-limit 逻辑而不考虑统一 infrastructure。
- 在日志中输出完整 URL query 中的 key、token、session、cookie。
- 为了测试而发真实大规模外部请求。

允许：

- 先建立 scaffold，再逐平台迁移。
- 优先迁移免费、稳定、容易 mock 的平台。
- 对仍未迁移的平台保留现有行为。

---

## 6. 对外契约

禁止：

- 未同步测试就改工具名集合。
- 未同步 Skill / README / contracts 就改 CLI schema。
- 未同步 JSON contract 就改 `data`、`attempts`、citation result、journal metrics result 的输出结构。
- 改 unknown tool 错误行为而不更新测试。
- 删除兼容 alias。

允许：

- 新增内部 helper。
- 重构目录和 re-export，只要对外工具、schema、输出保持不变。
- 添加更严格的测试来冻结现有行为。

---

## 7. 文档维护

禁止：

- 保留已完成任务书并继续标为“可执行”。
- 在当前架构文档中描述尚未实现的能力为当前能力。
- 让 README、Skill、CLI contract 和源码工具列表互相矛盾。

允许：

- 把未来能力放入 `docs/roadmap/`。
- 把当前事实写入 `docs/ARCHITECTURE.zh.md`。
- 把维护步骤写入 `docs/agent-maintenance/`。

---

## 8. 如果用户要求违反禁止项

处理方式：

1. 指出该请求会破坏哪条边界。
2. 提供安全替代方案。
3. 若只是文档规划，把内容放入 roadmap，明确“当前未实现”。
4. 若是代码能力实现，要求同时更新 contracts、tests、Skill、README，并保持 secrets 边界。
