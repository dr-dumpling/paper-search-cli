# Paper Search CLI 上游差异报告

日期：2026-05-15

对比对象：

- 本地仓库：`paper-search-cli`，Node.js CLI，当前远端 `dr-dumpling/paper-search-cli`
- 上游仓库：`openags/paper-search-mcp`，临时只读 clone commit `d499d01`，版本 `0.1.4`

本报告最初用于差异分析和纳入决策。2026-05-15 本轮实现后，本地 CLI 已吸纳第一批低风险高价值能力：OpenAlex、Unpaywall、PubMed Central、Europe PMC、CORE、OpenAIRE、多源检索去重，以及开放获取优先下载回退链。README 应以“已实现第一批 + 其余候选/风险能力”表述，不再把这些能力写成未实现。

本轮已实现：

- `search_openalex`、`search_unpaywall`、`search_pmc`、`search_europepmc`、`search_core`、`search_openaire`
- `search_papers` 的 `sources` 逗号列表和整理过的 `platform=all`
- DOI 优先、标题+作者其次的跨源去重
- `download_with_fallback`：原生下载 -> 结果 PDF URL -> PMC/Europe PMC/CORE/OpenAIRE -> Unpaywall -> 显式 opt-in Sci-Hub

## 1. 纳入规则

### 当前可用

只有本地 Node CLI 中真实注册、能通过 `paper-search status`、`paper-search tools` 或实际调用验证的能力，才能写入 README 的“当前支持”。

本地当前注册来源：

```text
crossref, arxiv, webofscience/wos, pubmed, biorxiv, medrxiv, semantic,
iacr, googlescholar/scholar, scihub, sciencedirect, springer, wiley, scopus,
openalex, unpaywall, pmc, europepmc, core, openaire
```

本地当前 `platform=all` 已改为整理过的多源并发检索：Crossref、OpenAlex、PubMed、PMC、Europe PMC、arXiv、bioRxiv、medRxiv、IACR、CORE、OpenAIRE。Google Scholar、Sci-Hub、付费 key 平台、DOI-only Unpaywall 和容易限流的 Semantic Scholar 不进入默认 `all`。

### 候选纳入

上游已有但本地未实现的能力，应写入“候选纳入”或“路线图”，不得写成当前可用。每个候选能力必须说明：

- 实现方式：官方 API、OAI-PMH、页面解析、镜像下载、付费 API skeleton 等。
- 依赖：API key、email、proxy、机构 IP、显式启用开关等。
- 失败模式：429、403、空结果、重定向、非 PDF、代理失败、下载不可用等。
- 保护策略：默认是否启用、是否 opt-in、错误如何返回、是否允许自动兜底。
- 纳入等级：推荐纳入、可选纳入、仅实验、暂不实现。

### 高风险能力

需要付费 key、访问不稳定、依赖页面抓取、法律或服务条款风险高的能力不排除，但必须放在“需解释后再决定”区域，不能静默混入默认工作流。

## 2. 当前 CLI 与上游架构差异

| 项目 | 本地 Node CLI | 上游 Python 实现 | 影响 |
| --- | --- | --- | --- |
| 搜索调度 | `platform` 单源为主，已新增 `sources` 逗号选择和整理过的 `all` | `sources` 支持逗号分隔和 `all`，并发调用多个来源 | 本地已吸纳核心思路，但默认 `all` 更保守 |
| 去重 | 已新增 DOI 优先、标题+作者其次的跨源去重 | 按 DOI 优先，其次标题+作者，最后 paper_id 去重 | 已迁移 |
| 下载路径 | `download_paper` 指定平台下载；新增 `download_with_fallback` | 原生下载 -> 仓储发现 -> Unpaywall -> 可选 Sci-Hub | 已迁移为开放获取优先链 |
| 输出 | CLI 包装后输出统一 JSON | CLI 搜索输出 JSON，read 输出纯文本 | 本地输出更适合脚本和 agent 稳定解析 |
| 配置 | 平台原生命名，如 `SEMANTIC_SCHOLAR_API_KEY` | 支持 `PAPER_SEARCH_MCP_` 前缀和 legacy 名称 | 本地可采用 CLI 前缀，但不应照搬服务端命名 |
| 风险来源 | Google Scholar、Sci-Hub 已存在 | Google Scholar、SSRN、Sci-Hub、BASE、CiteSeerX 等更广 | 需要显式风险分层 |

建议架构迁移顺序：

1. 先迁移跨源去重和 `--sources` 逗号选择。
2. 再迁移 OpenAlex、Unpaywall、PMC、Europe PMC。
3. 最后实现开放获取优先下载链。
4. 高风险来源只做 opt-in，不进入默认 `all`。

## 3. 优先候选

### OpenAlex

纳入等级：推荐纳入。

实现方式：

- 使用官方 OpenAlex Works API：`https://api.openalex.org/works`
- 请求参数是 `search=<query>` 和 `per_page=<max_results>`
- 从 `abstract_inverted_index` 重建摘要
- DOI 来自 `doi` 字段，若缺失则尝试从摘要提取
- PDF URL 来自 `primary_location.pdf_url`，或 `open_access.oa_url`

依赖：

- 不需要 API key
- 上游只设置 polite User-Agent

失败模式：

- 非 200 状态直接返回空结果
- OpenAlex 不托管 PDF，`download_pdf` 和 `read_paper` 不应作为原生能力
- `oa_url` 可能是 landing page，不一定是可直接下载 PDF

迁移建议：

- 新增 `search_openalex`
- 在 `Paper.extra` 中保留 `open_access`、concepts、OpenAlex ID
- 不新增 `download_openalex` 作为真正下载入口；如结果有 `pdfUrl`，交给统一下载链处理
- 可以加入默认推荐检索源，但不应自动下载

### Unpaywall

纳入等级：推荐纳入。

实现方式：

- 使用 Unpaywall DOI API：`https://api.unpaywall.org/v2/{doi}`
- 只支持 DOI 查询，不支持普通关键词搜索
- 从 `best_oa_location.url_for_pdf` / `url` 和 `oa_locations` 中解析开放获取 URL
- 上游有 `resolve_best_pdf_url(doi)`，专门给下载回退链使用

依赖：

- 需要 contact email：上游变量为 `PAPER_SEARCH_MCP_UNPAYWALL_EMAIL` 或 `UNPAYWALL_EMAIL`
- 本地 CLI 迁移时建议改成 `PAPER_SEARCH_UNPAYWALL_EMAIL`，同时兼容 `UNPAYWALL_EMAIL`

失败模式：

- 没有 email 时跳过，返回空结果
- HTTP 404 表示 DOI 无记录
- HTTP 422 表示 email 无效
- OA URL 可能不是 PDF，仍需下载前检查 Content-Type 或 PDF magic bytes

迁移建议：

- 新增 `search_unpaywall` 或 `resolve_oa_url`
- 不把它当作通用搜索平台，而是 DOI 解析器
- 优先用于 `download_with_fallback` 的 DOI OA 解析阶段

### PubMed Central

纳入等级：推荐纳入，尤其适合生物医学全文场景。

实现方式：

- 使用 NCBI E-utilities 检索 PMC 数据库：`esearch.fcgi?db=pmc`
- 再用 `esummary.fcgi?db=pmc&id=...` 获取摘要元数据
- 构造标准 PMC 页面和 PDF URL：`https://www.ncbi.nlm.nih.gov/pmc/articles/{PMCID}/pdf/`
- 下载后用 `pypdf` 提取全文

依赖：

- 不强制 API key
- 请求带 `tool` 和 `email` 参数；本地迁移时应使用可配置的 `NCBI_TOOL`/`NCBI_EMAIL` 或沿用 PubMed 配置

失败模式：

- 查询无 PMCID 返回空结果
- PDF URL 可能返回 HTML，而不是 PDF
- 代理环境可能阻断 NCBI PDF 下载
- PDF 提取文本可能过短

迁移建议：

- 新增 `search_pmc`、`download_pmc`、`read_pmc_paper`
- 和现有 PubMed 区分：PubMed 负责摘要/PMID，PMC 负责开放全文
- 加入开放获取下载链的仓储候选

### Europe PMC

纳入等级：推荐纳入。

实现方式：

- 使用 Europe PMC REST API：`https://www.ebi.ac.uk/europepmc/webservices/rest/search`
- 参数包括 `query`、`pageSize`、`format=json`、`resultType=core`
- 从 `fullTextUrlList.fullTextUrl` 解析 HTML/PDF 链接
- 若无 PDF URL，但有 PMCID，则尝试 PMC 标准 PDF URL
- 下载后用 PDF parser 提取全文

依赖：

- 不需要 API key

失败模式：

- 部分记录只有 metadata，无开放全文
- PDF URL 可能不是直接 PDF
- 代理或远端策略可能导致下载失败
- `read` 依赖 PDF 可下载和可解析

迁移建议：

- 新增 `search_europepmc`、`download_europepmc`、`read_europepmc_paper`
- 适合作为 biomedical OA fallback，优先级可放在 PMC 附近

### CORE

纳入等级：推荐纳入，但建议 API key 可选、非必需。

实现方式：

- 使用 CORE API v3：`https://api.core.ac.uk/v3/search/works`
- 可按 query、year、language、repository、has_fulltext 等检索
- PDF URL 从 `downloadUrl` 或 `fullTextUrls` 中取
- `read_paper` 优先用 CORE API 的 `fullText`，否则下载 PDF 再提取文本
- 对 429/500/502/503/504 做 3 次重试和指数退避
- 如果配置的 key 被 401/403 拒绝，上游会去掉 key 再试一次

依赖：

- `CORE_API_KEY` 可选但推荐
- 本地迁移时建议支持 `PAPER_SEARCH_CORE_API_KEY` 和 `CORE_API_KEY`

失败模式：

- 无 key 时可能限流、返回受限或 500
- 记录未必有 PDF
- `downloadUrl` 可能失效或不是 PDF
- PDF 文本提取可能失败

迁移建议：

- 新增 `search_core`
- 下载能力标记为 record-dependent
- 放入开放获取回退链，但失败时只返回清晰错误，不阻断后续来源

### OpenAIRE

纳入等级：推荐作为检索和回退发现层；暂不作为直接下载平台。

实现方式：

- 主要使用 OpenAIRE API：`https://api.openaire.eu/search/researchProducts`
- 上游有三组请求 profile：普通 JSON/XML、XML Accept header、Mozilla User-Agent 原始请求
- 对 403、429、5xx 做重试
- XML 解析中从 `pid`、`identifier`、`url`、`webresource`、`bestaccessright` 等字段提取 DOI、URL、PDF 候选
- 如果新版接口失败，再尝试 legacy `search/publications`

依赖：

- API key 可选，上游支持 `OPENAIRE_API_KEY`

失败模式：

- 403 较常见，上游靠多 profile 重试缓解
- XML 结构复杂，解析可能脆弱
- 直接 `download_pdf` 和 `read_paper` 仍是 NotImplemented

迁移建议：

- 新增 `search_openaire`
- 作为 PDF URL 发现层，而不是直接下载平台
- 只把真实 `pdfUrl` 交给统一下载链

## 4. 需解释后再决定

### Google Scholar

当前状态：本地 Node CLI 已支持；上游也支持。

上游实现方式：

- 请求 `https://scholar.google.com/scholar`
- 通过 BeautifulSoup 解析 HTML 结果块 `.gs_ri`
- 随机 User-Agent、随机 sleep、403/429/503 退避重试
- 可配置代理：`GOOGLE_SCHOLAR_PROXY_URL`
- 检测 captcha 页面后停止

依赖：

- 不需要 API key
- 稳定使用通常需要代理或低频请求

失败模式：

- CAPTCHA / bot detection
- 403、429、503
- HTML 结构变化导致解析失败
- DOI 通常缺失，结果多为 discovery metadata

迁移建议：

- 保留当前能力，但 README 必须标为 best-effort
- 不进入默认高频自动检索
- 增加 captcha/空结果的明确错误说明
- 可迁移上游的 captcha 检测和 proxy env 支持

纳入判断：可选纳入增强，不作为可靠主源。

### SSRN

当前状态：本地 Node CLI 未实现。

上游实现方式：

- SSRN 没有公共 API，上游使用公开 HTML 搜索页
- 尝试两个 endpoint：`www.ssrn.com/.../rps-stage1-results/` 和 `papers.ssrn.com/sol3/results.cfm`
- BeautifulSoup 解析标题、作者、摘要、日期、abstract id
- 2 秒请求间隔
- PDF 下载是 best-effort：只在页面暴露直接 public PDF 或 `Delivery.cfm` 链接时尝试

依赖：

- 不需要 API key
- 不处理登录态

失败模式：

- Cloudflare / bot detection 403
- 429 限流
- 页面结构变化
- 多数 PDF 需要登录或受限

迁移建议：

- 如果纳入，只做 `search_ssrn` metadata-first
- `download_ssrn` 必须默认 best-effort，不能尝试绕过登录
- 不加入默认 `all`
- README 必须说明“公开元数据发现，不保证 PDF”

纳入判断：仅实验或可选纳入，取决于是否需要社科/经济/法律预印本。

### CiteSeerX

当前状态：本地 Node CLI 未实现。

上游实现方式：

- 使用 `https://citeseerx.ist.psu.edu/api/search` 和 `/api/papers/{id}`
- 可选 `CITESEERX_API_KEY`
- JSON 解析标题、作者、摘要、DOI、引用数、PDF URL
- 检测 endpoint 是否重定向到 Web Archive；若重定向，视为 live API 不可用
- SSL 失败时会关闭证书校验重试

依赖：

- API 通常公开，但上游保留 key 支持

失败模式：

- endpoint 不稳定或重定向到 archive
- JSON parse 失败
- 429 限流
- PDF URL 经常缺失

迁移建议：

- 可以作为计算机科学补充元数据源
- 不应默认启用
- 不建议迁移关闭 SSL 校验的逻辑，除非用户显式允许

纳入判断：仅实验。

### BASE

当前状态：本地 Node CLI 未实现。

上游实现方式：

- 继承 OAI-PMH 通用实现
- endpoint：`https://api.base-search.net/cgi-bin/BaseHttpSearchInterface.fcgi`
- OAI-PMH 不支持全文关键词搜索，上游先 `ListRecords`，再在本地按标题、摘要、作者过滤
- PDF URL 从 Dublin Core identifier/format 中推断

依赖：

- README 说明 BASE OAI-PMH endpoint 可能需要机构 IP 注册

失败模式：

- 未注册 IP 时可能空结果
- OAI-PMH 全量拉取再本地过滤，效率低
- 记录未必有 PDF

迁移建议：

- 不适合做默认来源
- 如果纳入，应增加超时、最大页数、禁用默认全量拉取
- 更适合做手动 opt-in 仓储检索

纳入判断：仅实验，暂不优先。

### Sci-Hub

当前状态：本地 Node CLI 已支持；上游也有可选下载器。

上游实现方式：

- 默认 base URL 为 `https://sci-hub.se`
- 用 DOI、PMID 或 URL 拼接到 mirror URL
- 解析页面中的 `embed[type=application/pdf]`、iframe、button onclick、PDF link
- 下载时关闭 TLS 校验，并要求响应 Content-Type 为 `application/pdf`

本地实现补充：

- 本地 Node CLI 已有多镜像列表、健康检查、失败切换和 `check_scihub_mirrors`

依赖：

- 不需要 API key
- 需要用户自己承担法律、机构政策和网络访问风险

失败模式：

- 镜像不可用
- 文章找不到
- 返回 HTML 而不是 PDF
- 法律/服务条款风险高

迁移建议：

- 保留现有实现即可，不需要照搬上游单 mirror 下载器
- 必须保持显式调用，不作为默认开放获取回退链的静默兜底
- 如果未来有 `download_with_fallback`，`useSciHub` 默认建议为 false 或需要显式参数

纳入判断：保留但强 opt-in。

### IEEE Xplore

当前状态：本地 Node CLI 未实现。

上游实现方式：

- 只是 skeleton
- 只有在 `IEEE_API_KEY` / prefixed key 存在时注册
- 实际 search/download/read 都还是 NotImplemented
- 下载还需要机构访问

依赖：

- IEEE API key
- PDF/full text 还可能需要机构订阅

失败模式：

- 没 key 时不可用
- 有 key 也还没有实现真实请求
- 全文下载不等同于 API key 可用

迁移建议：

- 不应写入当前能力
- 如果纳入路线图，标为“付费/机构访问占位，不是可用功能”

纳入判断：暂不实现。

### ACM Digital Library

当前状态：本地 Node CLI 未实现。

上游实现方式：

- 只是 skeleton
- 只有在 `ACM_API_KEY` / prefixed key 存在时注册
- 实际 search/download/read 都还是 NotImplemented
- 注释中说明 full text/PDF 需要 ACM membership 或机构访问

依赖：

- ACM API key
- 机构或会员访问

失败模式：

- 没 key 时不可用
- 有 key 也没有真实实现
- PDF/full text 受访问权限限制

迁移建议：

- 不应写入当前能力
- 可在路线图中保留为远期占位

纳入判断：暂不实现。

## 5. 其他可迁移来源

这些来源不在第一批优先候选中，但可以作为第二阶段候选：

| 来源 | 上游状态 | 价值 | 建议 |
| --- | --- | --- | --- |
| dblp | 官方 API，元数据为主，CS 覆盖好 | 计算机科学文献补充 | 可选纳入 |
| DOAJ | 开放期刊 API，key 可提高限额，PDF 依记录而定 | 开放获取期刊补充 | 第二阶段纳入 |
| Zenodo | 官方 REST API，record-dependent PDF/read | 数据集、预印本、软件产物 | 第二阶段纳入 |
| HAL | HAL 公共 API，record-dependent PDF/read | 欧洲开放仓储 | 第二阶段纳入 |
| ChemRxiv | 文件存在但未注册进 CLI/server 的主 source list | 化学预印本 | 先不纳入，除非有明确需求 |

## 6. 推荐迁移路线

### 第一阶段：搜索质量和开放获取解析

- 新增 OpenAlex，提升免费元数据召回和引用/开放获取字段。
- 新增 Unpaywall DOI 解析器，为后续下载链提供 OA URL。
- 新增跨源去重函数，按 DOI -> title+authors -> paper_id。
- 增加 `--sources` 或 `sources` 参数，允许逗号分隔多来源。

### 第二阶段：生物医学开放全文

- 新增 PMC 和 Europe PMC。
- 将 PMC/Europe PMC 与 PubMed 的关系写清楚：PubMed 是摘要/PMID，PMC/Europe PMC 是开放全文。
- 支持 PDF 下载前的 Content-Type 和 PDF magic bytes 检查。

### 第三阶段：开放获取下载链

新增 `download_with_fallback`，建议顺序：

1. 指定平台原生下载。
2. 已有 `pdfUrl` 直链下载。
3. PMC / Europe PMC / CORE / OpenAIRE 仓储发现。
4. Unpaywall DOI OA URL。
5. 可选 Sci-Hub，必须显式启用。

默认策略：

- `useSciHub=false`
- 每一步失败都记录原因
- 最终返回结构化错误，不静默吞错

### 第四阶段：高风险和低稳定来源

- Google Scholar：保留 best-effort；可迁移上游 proxy/captcha 检测。
- SSRN：仅 metadata-first，PDF best-effort。
- CiteSeerX/BASE：实验性 opt-in，不进默认 all。
- IEEE/ACM：暂不实现，只保留路线图说明。

## 7. README 后续修改清单

确认本报告后，建议按以下方式重写 README：

- 保留“当前 CLI 可用能力”主线，不把上游候选能力混进支持矩阵。
- 新增“上游候选能力与纳入状态”章节。
- 新增“风险能力说明”：Google Scholar、Sci-Hub、SSRN、CiteSeerX、BASE、IEEE、ACM。
- 新增“推荐迁移顺序”。
- 删除或避免服务端配置叙述，只保留 CLI 安装、运行、配置和调用。
- 环境变量命名建议统一为 `PAPER_SEARCH_*`，并可兼容上游 legacy 变量。

## 8. 已试跑验证

上游临时 clone 试跑：

```bash
uv run --directory /tmp/paper-search-mcp-upstream-readonly paper-search sources
```

结果确认返回 21 个来源：

```text
arxiv, base, biorxiv, citeseerx, core, crossref, dblp, doaj, europepmc,
google_scholar, hal, iacr, medrxiv, openaire, openalex, pmc, pubmed,
semantic, ssrn, unpaywall, zenodo
```

上游搜索试跑：

```bash
uv run --directory /tmp/paper-search-mcp-upstream-readonly paper-search search "machine learning" -n 1 -s openalex,crossref
```

结果确认 OpenAlex 和 Crossref 均返回结构化 JSON，OpenAlex 返回 `Scikit-learn: Machine Learning in Python`，包含 DOI、PDF URL、OpenAlex ID 和 citation count。

上游下载/读取试跑：

```bash
uv run --directory /tmp/paper-search-mcp-upstream-readonly paper-search download arxiv 1201.0490 -o /tmp/paper-search-upstream-downloads
uv run --directory /tmp/paper-search-mcp-upstream-readonly paper-search read arxiv 1201.0490 -o /tmp/paper-search-upstream-downloads
```

结果确认 arXiv PDF 下载成功，读取输出论文文本开头。

本地 CLI 试跑：

```bash
node dist/cli.js status --pretty
node dist/cli.js search "machine learning" --platform crossref --max-results 1 --pretty
```

结果确认本地 CLI 正常返回平台状态和 Crossref JSON 搜索结果。
