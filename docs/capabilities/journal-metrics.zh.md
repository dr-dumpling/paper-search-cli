# Capability: journal_metrics

`journal_metrics` 负责期刊级指标查询。它只处理期刊，不处理论文元数据，不进入论文数据源注册表。

---

## 1. 当前职责

- 查询期刊影响因子。
- 查询 JCR / SSCI 分区。
- 查询中科院分区、JCI、ESI、预警和等级字段。
- 支持单个期刊、多个期刊和文件批量输入。
- 支持可选 raw 字段输出。

---

## 2. 不负责什么

- 不检索论文。
- 不返回论文 metadata。
- 不执行 DOI lookup。
- 不下载 PDF。
- 不进入 `platformMetadata` 论文平台清单。
- 不并行轰炸 EasyScholar API。

---

## 3. 用户入口

| 入口 | 类型 | 说明 |
|---|---|---|
| `paper-search journal-metrics <journal...>` | top-level CLI | 期刊指标主入口 |
| `paper-search metrics ...` | top-level CLI alias | `journal-metrics` alias |
| `paper-search run query_journal_metrics` | direct tool | direct run 工具 |

---

## 4. 当前代码入口

| 文件 | 职责 |
|---|---|
| `src/services/JournalMetricsService.ts` | EasyScholar 查询和结果解析 |
| `src/core/schemas.ts` | `QueryJournalMetricsSchema` |
| `src/core/tools.ts` | `query_journal_metrics` 工具定义 |
| `src/core/handleToolCall.ts` | journal list 解析和 handler 分发 |
| `src/config/ConfigService.ts` | `EASYSCHOLAR_KEY` 管理 |

---

## 5. 数据流

```text
paper-search journal-metrics "Nature" "BMJ"
  → query_journal_metrics
  → QueryJournalMetricsSchema
  → parse journal list / file
  → queryJournalMetrics({ journals, includeRaw })
  → EasyScholar
  → rows[]
```

---

## 6. 消费的共享依赖

| 依赖 | 文档 | 使用方式 |
|---|---|---|
| 配置与密钥 | `docs/dependencies/config-and-secrets.zh.md` | 读取 `EASYSCHOLAR_KEY`，不得泄露 |
| HTTP 基础设施 | `docs/dependencies/http-infrastructure.zh.md` | 未来可迁移请求层 |
| JSON 输出契约 | `docs/contracts/json-output-contract.zh.md` | 保持 journal metrics rows 输出稳定 |
| CLI 工具契约 | `docs/contracts/cli-tools-contract.zh.md` | 维护 `query_journal_metrics` schema |

---

## 7. 不允许的依赖

- 不 import metadata-search。
- 不 import pdf-discovery。
- 不 import citation-expansion。
- 不 import platforms registry 作为论文数据源。
- 不 import management layer。

---

## 8. 扩展方式

### 新增字段

1. 在 service parser 中解析字段。
2. 决定是否默认输出或仅 `includeRaw` 输出。
3. 更新 JSON contract 和 README 示例。
4. 补测试。

### 新增 provider

当前不建议立即做。若未来支持多个期刊指标 provider，应建立 `journal-metrics` 私有 provider registry，而不是复用论文 `platformMetadata`。

---

## 9. 测试要求

必跑：

```bash
npm test -- --runInBand tests/core/schemas.test.ts tests/core/handleToolCall.test.ts tests/core/toolsContract.test.ts
npm run build
```

如果新增 provider，必须补 mock 测试，不得依赖真实 EasyScholar 请求。

---

## 10. Agent checklist

- [ ] 没有把期刊指标当作论文搜索。
- [ ] 没有把 EasyScholar 放进论文平台 registry。
- [ ] 没有泄露 `EASYSCHOLAR_KEY`。
- [ ] 批量查询没有引入不受控并发。
- [ ] `journal-metrics` 和 `metrics` alias 仍可用。
- [ ] `query_journal_metrics` schema 与 Skill / README 同步。
