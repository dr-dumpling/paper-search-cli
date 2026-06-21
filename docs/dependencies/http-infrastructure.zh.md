# Dependency: HTTP Infrastructure

HTTP 基础设施属于基础设施轴，负责常规外部请求的 proxy、timeout、user-agent、rate limit、cache、retry 和错误分类。当前 `HttpClient` 仍是最小 scaffold，后续需要逐步完善。

---

## 1. 当前职责

- 保留 `setupGlobalProxy()`，兼容 CLI 启动流程。
- 提供 `HttpPolicy` 类型。
- 提供 `HttpRequestConfig` 类型。
- 提供 `HttpClient.request<T>()` 最小包装。
- 在 `httpPolicies.ts` 中记录少量平台策略示例。

---

## 2. 主要代码

| 文件 | 职责 |
|---|---|
| `src/utils/HttpClient.ts` | `HttpClient`、`HttpPolicy`、proxy setup |
| `src/core/httpPolicies.ts` | 平台 HTTP policy registry |
| `src/utils/RateLimiter.ts` | 限流工具 |
| `src/utils/RequestCache.ts` | 请求缓存 |
| `src/utils/ErrorHandler.ts` | 错误分类和 retry helper |
| `src/utils/SecurityUtils.ts` | 超时、脱敏、安全工具 |

---

## 3. 目标职责

后续 `HttpClient` 应逐步实现：

- proxy；
- timeout；
- user-agent；
- validateStatus；
- rate limit；
- cache；
- retry；
- error classification；
- sensitive logging mask。

---

## 4. 被哪些能力使用

| 能力 | 使用方式 |
|---|---|
| metadata_search | 平台 API / HTML 请求 |
| citation_expansion | Semantic Scholar Graph API |
| body_snippet_search | Semantic Scholar snippet API |
| journal_metrics | EasyScholar 请求 |
| pdf_discovery | PDF URL 下载和 fallback 查询 |
| management_layer | live smoke、platform validation |

---

## 5. 迁移规则

- 不一次性迁移所有平台。
- 优先迁移免费、稳定、容易 mock 的平台，如 Crossref、OpenAlex、arXiv。
- 每次迁移只改变一个或少数平台。
- 迁移前后保持 `Paper` 输出和 CLI JSON 输出不变。
- 为迁移平台提供 mock 测试。
- 未迁移平台保持现有行为。

---

## 6. HttpPolicy 语义

| 字段 | 说明 |
|---|---|
| `rateLimit` | 请求速率和 burst 限制 |
| `cache` | TTL 和 max size |
| `timeoutMs` | 默认请求超时 |
| `retry` | 最大重试次数 |
| `userAgent` | 平台指定 UA |
| `validateStatus` | 平台指定 HTTP status 判断 |

---

## 7. 禁止事项

- 不在日志中输出 token、cookie、session、ticket、key。
- 不让 HttpClient 依赖某个 capability。
- 不在平台里复制粘贴 retry/cache/rate-limit 逻辑。
- 不把浏览器自动化、复杂认证会话强行塞进通用 HttpClient。
- 不用 live 外部请求作为单元测试。

---

## 8. 测试要求

修改 HttpClient 或 policy 后：

```bash
npm test -- --runInBand
npm run build
```

迁移具体平台时，应额外补平台 mock 测试，并确认相关 capability contract 测试通过。
