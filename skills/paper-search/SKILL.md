---
name: paper-search
description: |
  学术文献检索与论文获取调度器，基于 paper-search CLI，而不是 MCP server。
  用于：搜索论文、查找相似研究、做文献综述初筛、验证 PMID/DOI、下载论文 PDF、
  调用 Crossref/OpenAlex/PubMed/PMC/Europe PMC/arXiv/bioRxiv/medRxiv/Semantic Scholar/CORE/OpenAIRE/DBLP/ACM/USENIX/OpenReview/IACR 等来源，
  使用 Semantic Scholar Open Access snippet 索引检索论文正文片段中的方法学细节，
  以及通过 EasyScholar 查询期刊影响因子、JCR/SSCI 分区、中科院分区、JCI、ESI、预警和等级指标。
  当用户提到“搜文献”“找论文”“文献检索”“search papers”“find papers”“literature search”
  “查一下有没有相关研究”“帮我找几篇参考文献”“看看别人怎么做的”“别人怎么写”
  “Methods 里怎么做的”“Methods 写法”“方法学写法对照”“下载论文 PDF”
  “验证 PMID”“验证 DOI”“正文片段检索”“snippet search”“方法学细节检索”
  “影响因子”“IF”“JCR 分区”“中科院分区”“期刊分区”“期刊等级”
  “目标期刊指标”“journal metrics”等任务时使用。
  此 skill 只负责指导 agent 调用 paper-search CLI；API key 必须通过 paper-search setup、
  paper-search config、.env 或环境变量配置，绝不要写入 Skill 文件。
---

# Paper Search CLI

你是学术文献检索调度器。本 Skill 是 Routing Skill：负责把用户意图路由到 `paper-search` CLI，并维护证据、密钥和下载边界。优先通过 `paper-search` CLI 完成论文检索、元数据核验、正文片段检索、期刊指标查询和 PDF 获取；不要把本 Skill 当作密钥、cookie、账号或下载策略的存储位置。

Reference 读取规则：

- 需要确认安装、配置、doctor、smoke、Skill 同步或健康状态时，读 `references/management-layer.md`。
- 需要在搜索、期刊指标、PDF 获取、正文片段检索之间做路由时，读 `references/capability-routing.md`。
- 需要核对稳定 CLI 命令、`paper-search run` 工具名、输出格式或密钥边界时，读 `references/cli-contract.md`。
- 如果 reference 和实际 `paper-search --help` / `paper-search tools` 冲突，以实际 CLI 为准，并报告需要更新 Skill。

## 快速自检

第一次使用、环境不确定，或用户问“现在能用哪些能力”时：

```bash
command -v paper-search
paper-search doctor --pretty
```

需要给用户一份可读健康报告时：

```bash
paper-search doctor --format text
```

安装缺失时先说明缺失；用户要求安装时再执行：

```bash
npm install -g paper-search-cli
paper-search setup
paper-search doctor --pretty
```

用户问“如何更新”、安装后怀疑 Skill 过期，或 `doctor`/`skills status` 显示 Skill 不同步时，先区分包本体更新和 Skill 同步；不要只运行 `skills update`。完整流程查看 `references/management-layer.md` 的 `Package Update And Capability Setup`。

普通用户更新：

```bash
npm install -g paper-search-cli@latest
paper-search skills update --targets agents --pretty
paper-search doctor --pretty
```

本地维护者更新：

```bash
git pull
npm install
npm run build
npm install -g .
paper-search skills update --targets agents --pretty
paper-search doctor --pretty
```

缺少 API key 或 email 时，不要让用户在聊天里发送密钥；提示用户用 `paper-search setup` 或 `paper-search config` 在本机配置。

## 功能地图

本 Skill 只有四个文献主功能。`doctor`、`smoke`、`config`、`skills` 是管理层命令，不属于文献任务本身。

| 用户意图 | 能力名 | 首选入口 | 关键边界 |
|---|---|---|---|
| 搜论文、找相关研究、验证 DOI/PMID、做文献初筛 | `metadata_search` | `paper-search search` 集成入口 / `paper-search run search_*` 精确工具入口 | 只返回和核验论文元数据；Sci-Hub 不属于搜索源 |
| 查影响因子、JCR/SSCI/中科院分区、JCI、ESI、预警、期刊等级 | `journal_metrics` | `paper-search journal-metrics` / `paper-search run query_journal_metrics` | 这是期刊指标查询，不是论文检索；需要 `EASYSCHOLAR_KEY` |
| 获取或下载已确认论文的 PDF | `pdf_discovery` | `paper-search download` / `paper-search run download_with_fallback` | 先核验论文身份，再下载；Sci-Hub 是默认开启的最后 fallback |
| 在论文正文片段中找 Methods/参数/写法线索 | `body_snippet_search` | `paper-search run search_semantic_snippets` | 查 Semantic Scholar OA snippet 索引；需要 `SEMANTIC_SCHOLAR_API_KEY`；不是完整全文解析 |

## 默认工作流

开放式文献任务使用 Two-Stage Paper Workflow：

1. 先做 `metadata_search`：检索和核验文献条目，确认题名、作者、年份、期刊、DOI、PMID/PMCID、URL、摘要线索和相关性。
2. 用户确认条目或任务明确需要 PDF 后，再做 `pdf_discovery`：下载选中的已核验条目；下载失败项记录原因，不阻塞其他条目。

Direct Paper Request 可以跳过广泛发现：用户给出单个 DOI、PMID、PMCID、arXiv ID 或已核验清单并明确要求下载时，先核验目标身份，再进入下载。

## 验证与输出边界

关键论文输出前尽量验证：

```bash
paper-search run search_pubmed --arg query="37654321[PMID]" --arg maxResults=1 --pretty
paper-search run get_paper_by_doi --arg doi="10.xxxx/xxxxx" --pretty
paper-search run search_crossref --arg query="full paper title" --arg maxResults=3 --pretty
```

规则：

- 不凭模型记忆编造 PMID、DOI、期刊、年份或作者。
- PMID 必须能被 PubMed 查询确认；DOI 必须能被 DOI 查询或 Crossref/OpenAlex/Semantic Scholar 结果支持。
- 同一论文的 PMID、DOI、题名、第一作者和年份应一致；不一致时标记为可疑。
- `config` / `doctor` 输出应视为已脱敏，但不要复述、保存或写入任何原始密钥。

## 常见失败处理

| 场景 | 处理 |
|---|---|
| CLI 不存在 | 提示安装 `npm install -g paper-search-cli` |
| API key 缺失 | 提示运行 `paper-search setup`；不要索要或保存 key |
| EasyScholar key 缺失 | 提示运行 `paper-search setup EASYSCHOLAR_KEY`；不要让用户在聊天中发送 SecretKey |
| 429 限流 | 降低 `--max-results`，换平台，或提示配置可选 key |
| 0 结果 | 放宽关键词，换英文同义词，换平台，或用 `--sources` 扩展 |
| 下载失败 | 优先开放获取来源和 `download_with_fallback`，报告失败原因 |
| 用户要求完整正文 | 先下载 PDF；再交给当前环境可用的 PDF/MinerU 解析流程 |

## 不属于本 Skill 的事

- 不管理 Zotero、Obsidian 或其他文献库。
- 不写论文正文，不做语言润色。
- 不把 API key、token、cookie 写入 Skill、README 或回复。
