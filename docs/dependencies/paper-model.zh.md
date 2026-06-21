# Dependency: Paper Model

`Paper` 是论文元数据的共享模型，是 `metadata_search` 与 `pdf_discovery` 的主要解耦边界。所有平台 Searcher 都应返回标准 `Paper`，再由输出层序列化为 Agent 友好的 JSON。

---

## 1. 职责

- 统一不同平台返回的论文字段。
- 提供 `PaperFactory` 创建和序列化方法。
- 让多源检索、去重、下载和 JSON 输出使用同一数据结构。
- 避免 capability 之间直接依赖内部实现。

---

## 2. 主要代码

| 文件 | 职责 |
|---|---|
| `src/models/Paper.ts` | `Paper` 类型、`PaperFactory`、序列化逻辑 |
| `src/platforms/*.ts` | 生成标准 `Paper` |
| `src/services/MultiSourceSearchService.ts` | 对 `Paper[]` 聚合和去重 |
| `src/core/handleToolCall.ts` | 使用 `PaperFactory.toDict()` 输出 |

---

## 3. 常见字段

字段可能包括：

- `paperId`
- `title`
- `authors`
- `abstract`
- `year`
- `journal`
- `venue`
- `doi`
- `pmid`
- `pmcid`
- `arxivId`
- `url`
- `pdfUrl`
- `source`
- `citationCount`

具体字段以 `src/models/Paper.ts` 为准。

---

## 4. 被哪些能力使用

| 能力 | 使用方式 |
|---|---|
| metadata_search | 返回和去重论文列表 |
| pdf_discovery | 消费 DOI、title、source、pdfUrl 等字段 |
| citation_expansion | 返回 citation paper-like data，但不一定是完整 `Paper` |
| management_layer | 诊断和输出时可能读取 source/capability 关系 |

---

## 5. 不变量

- `source` 应使用 canonical platform id。
- `doi` 不得由模型臆造；平台没提供就不要伪造。
- `pdfUrl` 只能在平台明确提供候选 URL 时设置。
- `PaperFactory.toDict()` 的输出变化属于 JSON contract 改动。
- 去重依赖 DOI、title+author、source id 等字段时，字段语义必须稳定。

---

## 6. 扩展字段流程

1. 在 `Paper` 类型中新增字段。
2. 在需要的平台 adapter 中填充字段。
3. 在 `PaperFactory.toDict()` 中决定是否输出。
4. 更新 `docs/contracts/json-output-contract.zh.md`。
5. 更新相关测试和 README / Skill 示例，如果字段对 Agent 可见。

---

## 7. 禁止事项

- 不把平台原始响应直接透传给 Agent。
- 不把下载 attempts 塞进 `Paper`。
- 不让 `Paper` 依赖某个 capability 的内部类型。
- 不把 secret 或内部请求状态放进 `Paper`。

---

## 8. 测试要求

```bash
npm test -- --runInBand tests/core/handleToolCall.test.ts tests/core/toolsContract.test.ts
npm run build
```

如改 `PaperFactory.toDict()`，必须检查 JSON 输出契约。
