# Capability: pdf_discovery

`pdf_discovery` 负责对已确认论文进行 PDF 获取和下载。它消费 `source / paperId / doi / title`，按 `DownloadTier` 顺序尝试 fallback，并记录 attempts。

---

## 1. 当前职责

- 执行 source-native download。
- 从平台元数据中的 PDF URL 直接下载。
- 通过 repository source 查找开放获取 PDF。
- 通过 Unpaywall 解析开放获取 PDF。
- 在默认启用时使用 Sci-Hub 作为最终 fallback。
- 支持 `useSciHub:false` 抑制 Sci-Hub。
- 通过 `DownloadTier` 支持未来插入新下载层。

---

## 2. 不负责什么

- 不构建文献列表。
- 不做关键词检索。
- 不查询 citation graph。
- 不查询 journal metrics。
- 不默认启用 `institutional_access`。
- 不接收账号、密码、cookie、token。

---

## 3. 用户入口

| 入口 | 类型 | 说明 |
|---|---|---|
| `paper-search download <paper-id> --platform NAME` | top-level CLI | 下载单篇已知论文 |
| `paper-search run download_paper` | direct tool | source-native download，失败时进入 fallback |
| `paper-search run download_with_fallback` | direct tool | 显式 fallback 漏斗 |

---

## 4. 当前代码入口

| 文件 | 职责 |
|---|---|
| `src/services/OpenAccessFallbackService.ts` | `DownloadTier`、fallback 编排、attempts 输出 |
| `src/utils/PdfDownload.ts` | PDF URL 下载、文件名安全 |
| `src/core/schemas.ts` | `DownloadPaperSchema`、`DownloadWithFallbackSchema` |
| `src/core/tools.ts` | download tools inputSchema |
| `src/core/handleToolCall.ts` | `download_paper` / `download_with_fallback` 分发 |
| `tests/services/OpenAccessFallbackService.test.ts` | fallback 顺序和 tier 插入契约 |

---

## 5. 当前 fallback 顺序

```text
primary -> direct_pdf_url -> repositories -> unpaywall -> scihub
```

当前已支持：

- `createDefaultDownloadTiers()`。
- `insertDownloadTierBefore()`。
- `downloadWithFallback(searchers, options, tiers)`。
- direct metadata fallback 优先使用 `doi || paperId`。
- Unpaywall searcher 缺失时返回 `skipped`。
- 默认 attempts 不包含 `institutional_access`。

---

## 6. attempts 契约

每个 attempt 只允许包含：

```ts
{ stage: string; status: 'ok' | 'error' | 'skipped'; message: string }
```

不得输出：

- cookie
- token
- session
- ticket
- 账号
- 密码
- 未脱敏 URL 凭据

---

## 7. 消费的共享依赖

| 依赖 | 文档 | 使用方式 |
|---|---|---|
| 平台适配器 | `docs/dependencies/platform-adapters.zh.md` | 调用 source-native `downloadPdf()`、`getPaperByDoi()`、repository `search()` |
| PDF 下载基础设施 | `docs/dependencies/pdf-download-infrastructure.zh.md` | 下载 URL、生成安全文件名 |
| 平台注册表 | `docs/dependencies/platform-registry.zh.md` | 未来从 `isRepository` 派生 repository sources |
| JSON 输出契约 | `docs/contracts/json-output-contract.zh.md` | 维护 result / attempts 结构 |
| 未来机构访问 | `docs/roadmap/FUTURE_INSTITUTIONAL_ACCESS.zh.md` | 只作为未来 roadmap |

---

## 8. 不允许的依赖

- 不 import metadata-search 内部实现。
- 不 import citation-expansion。
- 不 import journal-metrics。
- 不 import management layer。
- 不在当前版本读取 browser profile、cookie store 或机构账号信息。

---

## 9. 扩展方式

### 新增普通 fallback tier

1. 实现 `DownloadTier`。
2. 决定插入位置。
3. 通过 `insertDownloadTierBefore()` 插入。
4. 确保默认行为不变，除非用户明确要求启用。
5. 补 attempts 顺序和 skipped/error 测试。

### 未来新增 `institutional_access`

必须遵守：

- 默认不启用。
- 只在 `unpaywall` 后、`scihub` 前插入。
- 不接收账号、密码、cookie、token 参数。
- 登录只能由用户在本机可见浏览器完成。
- 当前 README / Skill 不得把它写成已实现能力。

---

## 10. 测试要求

必跑：

```bash
npm test -- --runInBand tests/services/OpenAccessFallbackService.test.ts tests/core/toolsContract.test.ts
npm run build
```

如果改 `download_paper` handler，还要跑：

```bash
npm test -- --runInBand tests/core/handleToolCall.test.ts
```

---

## 11. Agent checklist

- [ ] 默认顺序仍为 `primary -> direct_pdf_url -> repositories -> unpaywall -> scihub`。
- [ ] `useSciHub:false` 时 Sci-Hub attempt 为 skipped。
- [ ] 默认 attempts 不包含 `institutional_access`。
- [ ] attempts item 没有新增字段。
- [ ] 错误 message 不泄露敏感信息。
- [ ] 没有把 PDF discovery 写成文献搜索。
- [ ] 没有把 future institutional access 写成当前能力。
