# Dependency: Platform Adapters

平台适配器位于数据源轴，负责把外部学术平台转换为统一的 `PaperSource` 接口和 `Paper` 模型。它们不属于单个 capability。

---

## 1. 职责

- 连接外部学术数据源。
- 实现 `search()`、`downloadPdf()`、`readPaper()`、`getCapabilities()` 等平台能力。
- 把平台原始响应归一化成 `Paper`。
- 在能力允许时实现 `getPaperByDoi()`。
- 暴露 source-native download 能力给 `pdf_discovery`。

---

## 2. 主要代码

| 文件 | 职责 |
|---|---|
| `src/platforms/PaperSource.ts` | 平台适配器抽象基类 |
| `src/platforms/*.ts` | 各平台 Searcher 实现 |
| `src/core/platformFactories.ts` | 平台实例化 |
| `src/models/Paper.ts` | 标准返回模型 |

---

## 3. PaperSource 约束

平台适配器应尽量遵循：

```ts
search(query, options): Promise<Paper[]>
downloadPdf(paperId, options): Promise<string>
readPaper(paperId, options): Promise<string>
getCapabilities(): PlatformCapabilities
getPaperByDoi(doi): Promise<Paper | null>
```

不同平台可以不支持所有能力，但必须通过 `getCapabilities()` 清楚表达。

---

## 4. 被哪些能力使用

| 消费者 | 使用方式 |
|---|---|
| metadata_search | 调用 `search()` 和 `getPaperByDoi()` |
| pdf_discovery | 调用 `downloadPdf()`、`getPaperByDoi()`、repository source 的 `search()` |
| body_snippet_search | 当前通过 `SemanticScholarSearcher.searchSnippets()` |
| management_layer | 读取 capabilities 和 status |

---

## 5. 新增 Searcher 要求

新增平台时：

1. 继承 `PaperSource`。
2. 返回标准 `Paper[]`。
3. 实现合理的错误处理：单平台失败不应拖垮多源检索。
4. 提供 `getCapabilities()`。
5. 如需要 key，不要在错误和日志中泄露 key。
6. 在 `platformMetadata` 与 `platformFactories` 中注册。
7. 添加或更新测试。

---

## 6. HTTP 使用规则

当前部分平台可能仍直接使用 axios。后续迁移方向是统一走 `HttpClient`。

规则：

- 新平台优先使用 `HttpClient` 或至少与 `HttpPolicy` 兼容。
- 不复制 retry/cache/rate-limit 横切逻辑。
- 不把 token、cookie、key 写入日志。
- 迁移时一次只迁移少量平台，避免大范围行为变化。

---

## 7. 不变量

- `search()` 返回数组，失败时按平台语义抛错或返回空数组，但多源服务应能隔离失败。
- `Paper.source` 应使用 canonical platform id。
- `paperId` 应可用于该平台的后续操作。
- `doi` 应尽量标准化但不得伪造。
- `pdfUrl` 只能在平台明确提供候选 PDF URL 时设置。

---

## 8. 测试要求

```bash
npm test -- --runInBand tests/core/platformMetadata.test.ts tests/core/handleToolCall.test.ts
npm run build
```

新增平台应补 mock 测试；不要依赖真实平台在线响应作为单元测试。
