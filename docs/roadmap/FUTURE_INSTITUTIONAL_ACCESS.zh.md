# Future Institutional Access Roadmap

状态：未来规划。本文不是当前实现文档；当前版本不包含 WebVPN、CARSI、EZProxy、机构登录、浏览器会话复用或机构权限下载能力。

---

## 目标

在 `DownloadTier` 扩展点稳定后，未来可以接入 WebVPN、CARSI、EZProxy、出版商机构登录和本机浏览器会话复用，用于访问用户所在机构已经订阅或授权的付费文献全文。

机构访问属于 PDF 下载层，只能作为显式启用的 `institutional_access` tier 进入 `download_with_fallback`。

---

## 当前边界

当前版本只具备以下基础条件：

- `OpenAccessFallbackService` 已定义 `DownloadTier`。
- 默认 fallback 顺序为：

```text
primary -> direct_pdf_url -> repositories -> unpaywall -> scihub
```

- `createDefaultDownloadTiers()` 可生成默认下载层。
- `insertDownloadTierBefore()` 可在未来把新 tier 插入到 `scihub` 前。
- 默认 attempts 中不包含 `institutional_access`。

当前版本不得把机构访问写成已实现功能。

---

## 未来下载顺序

未来若实现机构访问，目标顺序为：

```text
primary -> direct_pdf_url -> repositories -> unpaywall -> institutional_access -> scihub
```

`institutional_access` 是 composite tier，内部可以再分发到：

- `webvpn`
- `carsi`
- `ezproxy`
- `browser_session`

---

## 未来 CLI 草案

以下命令只是未来草案，当前版本不得写入 `paper-search --help`、Skill 当前能力说明或 README 当前功能表：

```bash
paper-search institutional status --pretty
paper-search institutional providers --pretty
paper-search institutional set-provider webvpn --pretty
paper-search institutional login --provider webvpn --pretty
paper-search institutional login --provider carsi --publisher sciencedirect --pretty
paper-search institutional test --doi 10.xxxx/xxxxx --pretty
```

下载仍应通过 `download_with_fallback` 进入，并由配置或请求参数显式启用。默认不得参与下载。

---

## 分阶段计划

### Phase 0：接口预留

- 依赖当前 `DownloadTier` 扩展点。
- 增加 disabled-by-default 的 `institutional_access` tier。
- 保持未启用时 attempts 不出现 `institutional_access`。

### Phase 1：本机状态与诊断

- 增加机构访问配置读取。
- 输出 provider、登录状态、可用入口和脱敏错误。
- 检测 browser profile / cookie store 是否存在，但不读取或打印敏感内容。

### Phase 2：WebVPN Provider

- 支持学校配置、WebVPN 入口 URL、目标 URL transform。
- 登录由用户在本机可见浏览器完成。
- 下载时把 publisher URL 通过 WebVPN URL transform 访问。

### Phase 3：CARSI Provider

- 支持 publisher -> CARSI login route 映射。
- 支持用户配置 IdP 名称。
- 登录由用户在本机可见浏览器完成。

### Phase 4：EZProxy / Browser Session Provider

- 支持 EZProxy URL 模板。
- 支持用户显式指定浏览器 profile。
- 只复用用户已授权的本机会话。

---

## 凭证边界

- CLI 不接收账号、密码、验证码、cookie、token 参数。
- 登录由用户在本机可见浏览器完成。
- status / test 输出必须脱敏 URL、cookie、session、ticket、token。
- 不把账号、密码、cookie、token 写入 Skill、README、测试、日志或聊天回复。
- 不做大规模并行抓取。

---

## 非目标

- 不在当前版本实现机构登录。
- 不默认启用机构访问。
- 不保存或传输用户密码。
- 不把机构权限层纳入 `platformMetadata` 数据源注册表。
- 不把机构权限层写成 Open Access source。
- 不把未来 CLI 草案写成当前稳定 CLI contract。

---

## 验收标准

未来实现时必须满足：

- 机构权限层只能在显式启用且本机状态存在时参与下载。
- 未登录时返回清晰 `skipped` 或 `error`，并提示下一步。
- 所有状态和错误输出均脱敏。
- 未启用 provider 前，`download_with_fallback` 行为与当前版本一致。
- `institutional_access` 位于 `unpaywall` 之后、`scihub` 之前。
