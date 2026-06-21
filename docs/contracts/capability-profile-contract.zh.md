# Contract: Capability Profile

Capability Profile 是面向用户和 Agent 的能力可用性摘要。它不是平台清单，也不是密钥列表。

---

## 1. 稳定能力项

当前必须包含六个 entry：

```text
metadata_search
citation_expansion
body_snippet_search
journal_metrics
pdf_discovery
entitled_access
```

新增、删除或重命名能力项属于对外契约改动。

---

## 2. 状态语义

| 状态 | 含义 |
|---|---|
| `available` | 该能力当前配置下可用 |
| `degraded` | 该能力可部分使用，但有来源或配置缺失 |
| `unavailable` | 该能力当前配置下不可用 |

一个能力不可用不得导致其它独立能力整体不可用。

---

## 3. 分组规则

### metadata_search

- 免费 metadata sources 可用时应为 `available`。
- 不包含 Sci-Hub。
- entitled metadata sources 只在 key 配置时列入 configured。

### citation_expansion

- Semantic Scholar Graph API citation expansion 是独立能力。
- `SEMANTIC_SCHOLAR_API_KEY` 是可选 quota key。

### body_snippet_search

- 需要 `SEMANTIC_SCHOLAR_API_KEY`。
- 缺 key 时为 `unavailable`，不影响 metadata_search。

### journal_metrics

- 需要 `EASYSCHOLAR_KEY`。
- 缺 key 时为 `unavailable`，不影响其它能力。

### pdf_discovery

- 包含 open access sources、entitled access sources、Sci-Hub final fallback。
- 无 entitled key 时可以为 `degraded`，因为开放获取和 final fallback 仍可能可用。
- Sci-Hub 必须位于 `scihub_sources`，不得放入 open access 或 entitled access。

### entitled_access

- 表示用户特定权限来源，例如 publisher/database/TDM/institutional entitlement。
- 未配置时为 `unavailable`，但不影响 metadata_search 基本可用性。

---

## 4. 禁止事项

- 不把 Sci-Hub 放入 `metadata_search.configured`。
- 不把 Sci-Hub 放入 `open_access_sources`。
- 不把 future institutional access 写成已配置来源。
- 不用原始 key 名列表替代用户可读 reason。
- 不让单个 key 缺失导致 `profile.ok=false`，只要仍有独立能力可用。

---

## 5. 测试要求

```bash
npm test -- --runInBand tests/core/capabilityProfile.test.ts
npm run build
```
