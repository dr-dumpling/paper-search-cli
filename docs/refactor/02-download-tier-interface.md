# 02 - DownloadTier Interface

状态：已完成。`download_with_fallback` 已重排为 `DownloadTier` 顺序执行；本文保留为历史执行依据。

## 目标

把 `download_with_fallback` 的 PDF 回退漏斗重排为可插拔 `DownloadTier` 接口，同时保持现有行为不变，并预留 `institutional_access` 插入点。

## 改动点

- `src/services/OpenAccessFallbackService.ts`: 定义轻量 `DownloadTier` 接口。
- `src/services/OpenAccessFallbackService.ts`: 把现有步骤组织为有序 tiers。
- `tests/services/OpenAccessFallbackService.test.ts`: 固定 attempts 顺序和 Sci-Hub disabled 行为。

当前执行顺序必须保持不变：

```text
primary -> direct_pdf_url -> repositories -> unpaywall -> scihub
```

未来机构访问插入点固定为：

```text
primary -> direct_pdf_url -> repositories -> unpaywall -> institutional_access -> scihub
```

本阶段不把 `institutional_access` 放进默认 tiers，因此未启用时 attempts 不新增该 stage。

## 接口契约

```ts
export interface DownloadTier {
  id: string;
  stage: string;
  run(context: DownloadTierContext): Promise<DownloadTierResult>;
}

export interface DownloadTierContext {
  searchers: Searchers;
  source: string;
  paperId: string;
  doi?: string;
  title?: string;
  savePath: string;
  useSciHub: boolean;
}

export interface DownloadTierResult {
  status: 'ok' | 'error' | 'skipped';
  path?: string;
  message: string;
}
```

最终对外 `DownloadWithFallbackResult.attempts` 字段保持现有结构：

```ts
Array<{ stage: string; status: 'ok' | 'error' | 'skipped'; message: string }>
```

## 执行步骤

1. 保留 `DownloadWithFallbackOptions` 和 `DownloadWithFallbackResult` 的公开字段。
2. 在 `downloadWithFallback()` 开头归一化 `savePath`、`source`，构造 `DownloadTierContext`。
3. 把现有 primary、direct metadata URL、repository、Unpaywall、Sci-Hub 五段逻辑包成五个 `DownloadTier`。
4. 用一个固定数组顺序执行 tiers；任一 tier 返回 `status: "ok"` 且有 `path` 时立即返回成功。
5. 所有 tier 失败或跳过后返回 `{ status: "error", attempts }`。
6. 导出 `INSTITUTIONAL_ACCESS_TIER_ID = "institutional_access"` 和插入位置说明，供未来计划接入；当前默认数组不包含该 tier。

## 机构权限插入点

`institutional_access` 是未来 tier id，不是当前下载能力。当前任务只保留类型和插入位置，不读取 cookie、账号、密码或浏览器会话。

## 非目标

- 不实现 WebVPN、CARSI、EZProxy 登录。
- 不接入 `scansci-pdf`。
- 不改变 Sci-Hub 默认 fallback 行为。
- 不迁移所有平台下载逻辑。

## 验收标准

- `download_with_fallback` attempts 顺序保持 `primary -> direct_pdf_url -> repositories -> unpaywall -> scihub`。
- `download_paper` 对不支持原生下载的平台仍能进入同一 fallback 漏斗。
- 关闭 Sci-Hub 时仍记录 `scihub` skipped。
- 默认 attempts 中不出现 `institutional_access`。
