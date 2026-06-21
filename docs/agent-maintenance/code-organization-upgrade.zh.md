# Code Organization Upgrade Plan

本文说明是否需要进一步把代码升级为独立功能目录，以及如何在不破坏 CLI 契约的前提下逐步迁移。

---

## 1. 结论

需要，但不应一次性完成。

当前业务能力边界已经清楚，但代码物理组织仍处于过渡态：

```text
src/core/
src/services/
src/platforms/
src/utils/
```

后续建议逐步迁移为：

```text
src/capabilities/
src/registry/
src/platforms/
src/infrastructure/
src/management/
src/models/
src/config/
```

迁移目标不是改变功能，而是让每个能力可以独立维护、独立扩展、独立测试。

---

## 2. 目标目录

建议最终结构：

```text
src/
├── capabilities/
│   ├── metadata-search/
│   ├── citation-expansion/
│   ├── pdf-discovery/
│   ├── journal-metrics/
│   └── body-snippet-search/
├── management/
├── registry/
├── platforms/
├── infrastructure/
├── config/
└── models/
```

---

## 3. 什么可以进 capability 目录

每个 capability 目录可以拥有：

```text
handler.ts
service.ts
schemas.ts
tools.ts
types.ts
index.ts
__tests__/
```

可以放入：

- 该能力的工具 handler。
- 该能力的私有 schema。
- 该能力的 service 编排。
- 该能力的 tool definitions。
- 该能力的内部类型。
- 该能力的测试。

---

## 4. 什么不能进 capability 目录

不得把以下共享层放进某个 capability：

- `platforms/*`
- `platformMetadata`
- `platformFactories`
- `httpPolicies`
- `HttpClient`
- `RateLimiter`
- `RequestCache`
- `ErrorHandler`
- `Paper` 模型
- `ConfigService`
- `SkillInstaller`

这些属于共享依赖或管理支线，不属于单个能力。

---

## 5. 推荐迁移顺序

按风险从低到高：

| 顺序 | 能力 | 原因 |
|---|---|---|
| 1 | `journal-metrics` | 最独立，只依赖 EasyScholar 和 config |
| 2 | `citation-expansion` | 边界清楚，只处理 citation graph |
| 3 | `pdf-discovery` | DownloadTier 已独立，适合拆 tiers |
| 4 | `body-snippet-search` | 当前仍挂在 SemanticScholarSearcher，需要 wrapper 过渡 |
| 5 | `metadata-search` | 涉及平台最多，最后迁移 |
| 6 | `management-layer` | 涉及 CLI 多个管理命令，适合最后整理 |

---

## 6. 安全迁移模式

每个能力迁移都必须采用两阶段方式。

### Phase A：re-export 过渡

先创建目录但不移动实现：

```text
src/capabilities/citation-expansion/index.ts
```

内容示例：

```ts
export { default as CitationService } from '../../services/CitationService.js';
```

目的：建立新路径，但不改变行为。

### Phase B：移动实现

测试通过后再移动：

```text
src/services/CitationService.ts
→ src/capabilities/citation-expansion/CitationService.ts
```

旧路径可以保留 compatibility re-export：

```ts
export { default } from '../capabilities/citation-expansion/CitationService.js';
```

等所有 imports 更新后，再删除旧文件。

---

## 7. 每个能力的目标内容

### journal-metrics

```text
src/capabilities/journal-metrics/
├── index.ts
├── JournalMetricsService.ts
├── handler.ts
├── schemas.ts
├── tools.ts
└── types.ts
```

### citation-expansion

```text
src/capabilities/citation-expansion/
├── index.ts
├── CitationService.ts
├── handler.ts
├── schemas.ts
├── tools.ts
└── types.ts
```

### pdf-discovery

```text
src/capabilities/pdf-discovery/
├── index.ts
├── OpenAccessFallbackService.ts
├── DownloadTier.ts
├── handler.ts
├── schemas.ts
├── tools.ts
├── types.ts
└── tiers/
    ├── primary.ts
    ├── directPdfUrl.ts
    ├── repositories.ts
    ├── unpaywall.ts
    └── scihub.ts
```

### body-snippet-search

```text
src/capabilities/body-snippet-search/
├── index.ts
├── service.ts
├── handler.ts
├── schemas.ts
├── tools.ts
└── types.ts
```

第一阶段可以 wrapper `searchers.semantic.searchSnippets()`，不要立即拆 Semantic Scholar 平台适配器。

### metadata-search

```text
src/capabilities/metadata-search/
├── index.ts
├── MultiSourceSearchService.ts
├── handler.ts
├── schemas.ts
├── tools.ts
└── types.ts
```

metadata search 最后迁移，因为它与平台 registry、generic tools 和 source parsing 关系最密。

---

## 8. core 层最终目标

迁移后 `src/core/` 应变薄，只做汇总和兼容：

```text
src/core/
├── tools.ts          # 汇总 capabilities/*/tools
├── schemas.ts        # 过渡期 re-export 或汇总 schemas
├── handleToolCall.ts # 薄路由层
└── diagnostics / liveSmoke 等可逐步进入 management
```

`handleToolCall()` 最终应接近：

```ts
const handlers = {
  ...metadataHandlers,
  ...citationHandlers,
  ...pdfHandlers,
  ...journalHandlers,
  ...snippetHandlers,
  ...managementHandlers
};
```

---

## 9. registry 和 infrastructure 目标

### registry

```text
src/registry/
├── platformMetadata.ts
├── platformFactories.ts
├── httpPolicies.ts
└── aliases.ts
```

短期可以继续放在 `src/core/`，等 capability 迁移稳定后再移动。

### infrastructure

```text
src/infrastructure/
├── http/
├── cache/
├── rate-limit/
├── security/
└── pdf/
```

短期可以继续使用 `src/utils/`，不要同时做 capability 迁移和 infrastructure 大迁移。

---

## 10. 迁移验收

每迁移一个 capability，必须满足：

- [ ] 工具名集合不变。
- [ ] inputSchema 不变。
- [ ] JSON 输出不变。
- [ ] Skill Direct Run Tools 不变。
- [ ] Capability Profile 不变，除非该 PR 明确修改 profile。
- [ ] 相关测试通过。
- [ ] build 通过。

必跑：

```bash
npm test -- --runInBand
npm run build
```

如果只是 re-export 阶段，也至少跑：

```bash
npm run build
```

---

## 11. 不建议同时做的事

不要在同一个 PR 中同时做：

- capability 目录迁移；
- 平台大规模迁移到 HttpClient；
- JSON 输出改动；
- Skill 契约改动；
- 机构访问实现；
- 删除兼容 alias；
- 删除旧路径且未更新所有 import。

---

## 12. 推荐 PR 切分

建议按 PR 分割：

1. `refactor: create capability re-export directories`
2. `refactor: move journal metrics capability`
3. `refactor: move citation expansion capability`
4. `refactor: move pdf discovery capability`
5. `refactor: wrap body snippet search capability`
6. `refactor: move metadata search capability`
7. `refactor: thin core tool routing`
8. `refactor: move registry from core to registry`
9. `refactor: move utils http to infrastructure`

每个 PR 都应小而可回滚。
