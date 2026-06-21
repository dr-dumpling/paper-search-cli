# Capabilities Maintenance Index

本文索引 `paper-search-cli` 的能力编排层文档。能力文档只描述用户可见功能如何编排；共享依赖实现放在 `docs/dependencies/`；对外契约放在 `docs/contracts/`。

---

## 能力列表

| 能力 | 文档 | 当前入口 | 维护边界 |
|---|---|---|---|
| 文献元数据检索 | [`metadata-search.zh.md`](./metadata-search.zh.md) | `paper-search search`, `paper-search run search_*` | 构建和核验论文元数据列表，不负责 PDF fallback |
| 引文扩展 | [`citation-expansion.zh.md`](./citation-expansion.zh.md) | `get_paper_citations`, `get_paper_references` | 已知论文的施引 / 参考文献扩展，不做关键词检索 |
| PDF 发现 / 下载 | [`pdf-discovery.zh.md`](./pdf-discovery.zh.md) | `paper-search download`, `download_with_fallback` | 已确认论文的 PDF fallback，不做文献初筛 |
| 期刊指标 | [`journal-metrics.zh.md`](./journal-metrics.zh.md) | `journal-metrics`, `query_journal_metrics` | 只处理期刊指标，不处理论文元数据 |
| 正文片段检索 | [`body-snippet-search.zh.md`](./body-snippet-search.zh.md) | `search_semantic_snippets` | 查 OA snippet，不是完整全文解析 |
| 管理层 | [`management-layer.zh.md`](./management-layer.zh.md) | `doctor`, `status`, `smoke`, `config`, `skills`, `tools` | 读取状态和同步 Skill，不实现文献任务 |

---

## 维护原则

1. 每个能力可以单独维护，但只能拥有自己的编排逻辑、schema、handler、service 和测试。
2. 共享平台、registry、HttpClient、Paper 模型、配置、Skill 分发不属于单个能力。
3. 能力之间不得直接互相调用内部实现；应通过稳定数据模型和 CLI/tool contract 交互。
4. management layer 可以读取能力状态；能力不得反向依赖 management layer。
5. 新增能力入口时必须同步 `TOOLS`、schema、handler、Skill、README 和契约测试。

---

## 推荐代码目录演进

后续代码可逐步迁移到：

```text
src/capabilities/
├── metadata-search/
├── citation-expansion/
├── pdf-discovery/
├── journal-metrics/
├── body-snippet-search/
└── management-layer/
```

迁移时保持对外工具名、schema、JSON 输出和测试不变。优先迁移最独立的 `journal-metrics` 和 `citation-expansion`。
