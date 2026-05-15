---
name: paper-search
description: |
  学术文献检索与论文获取调度器，基于 paper-search CLI，而不是 MCP server。
  用于：搜索论文、查找相似研究、做文献综述初筛、验证 PMID/DOI、下载论文 PDF、
  调用 Crossref/OpenAlex/PubMed/PMC/Europe PMC/arXiv/bioRxiv/medRxiv/Semantic Scholar/CORE/OpenAIRE/IACR 等来源，
  以及使用 Semantic Scholar Open Access snippet 索引检索论文正文片段中的方法学细节。
  当用户提到“搜文献”“找论文”“文献检索”“search papers”“find papers”“literature search”
  “查一下有没有相关研究”“帮我找几篇参考文献”“看看别人怎么做的”“下载论文 PDF”
  “验证 PMID”“验证 DOI”“正文片段检索”“snippet search”“Methods 里怎么做的”
  “方法学细节检索”等任务时使用。
  此 skill 只负责指导 agent 调用 paper-search CLI；API key 必须通过 paper-search setup、
  paper-search config、.env 或环境变量配置，绝不要写入 Skill 文件。
---

# Paper Search CLI

你是学术文献检索调度器。所有检索、验证和下载动作优先通过 `paper-search` CLI 完成。Skill 只说明如何调用 CLI，不保存 API key，也不替用户生成或暴露密钥。

## 先做配置检查

处理检索任务前，先确认 CLI 可用：

```bash
command -v paper-search
paper-search status --pretty
```

如果涉及 Semantic Scholar 正文片段、CORE、Unpaywall、Web of Science、Scopus、ScienceDirect、Springer 或 Wiley 等需要 key/邮箱的能力，再运行：

```bash
paper-search config doctor --pretty
```

缺少 key 时，不要让用户把 key 发给 agent。提示用户在本机运行：

```bash
paper-search setup
paper-search config set SEMANTIC_SCHOLAR_API_KEY your_key
paper-search config doctor --pretty
```

CLI 的配置优先级：

1. shell 环境变量
2. 当前目录 `.env`
3. 用户级配置 `~/.config/paper-search-cli/config.json`
4. 免费来源的内置默认值

## 安装缺失时

如果 `paper-search` 不存在，先告知用户需要安装。用户要求你安装时再执行：

```bash
npm install -g github:dr-dumpling/paper-search-cli
paper-search setup
paper-search status --pretty
```

## 常用命令

### 快速检索

```bash
paper-search search "machine learning" --platform crossref --max-results 5 --pretty
paper-search search "osteoarthritis occupational exposure" --platform pubmed --max-results 10 --pretty
paper-search search "transformer attention mechanism" --sources arxiv,semantic,crossref --max-results 5 --pretty
```

`--platform all` 或 `--sources all` 只用于需要广覆盖召回时。精确任务优先指定平台或 `--sources`。

### 精确工具调用

```bash
paper-search run search_pubmed --arg query="osteoarthritis occupational exposure" --arg maxResults=10 --pretty
paper-search run search_openalex --arg query="causal inference target trial emulation" --arg maxResults=5 --pretty
paper-search run get_paper_by_doi --arg doi="10.xxxx/xxxxx" --pretty
```

复杂参数使用 JSON：

```bash
paper-search run search_semantic_scholar --json-args '{"query":"graph neural network medicine","maxResults":5,"year":"2020-2025"}' --pretty
```

### 下载 PDF

```bash
paper-search download 2301.12345 --platform arxiv --save-path ./downloads --pretty
paper-search run download_paper --arg paperId="10.xxxx/xxxxx" --arg platform=springer --arg savePath="./downloads" --pretty
paper-search run download_with_fallback --json-args '{"doi":"10.xxxx/xxxxx","title":"Paper title","savePath":"./downloads","useSciHub":false}' --pretty
```

默认不要启用 Sci-Hub；只有用户明确要求并承担相应访问边界时，才把 `useSciHub` 设为 `true`。

## 平台选择

| 任务 | 首选 | 补充 |
|---|---|---|
| 生物医学、临床、药学、公卫 | `pubmed` | `pmc`, `europepmc`, `semantic`, `crossref` |
| 正文方法学片段 | `search_semantic_snippets` | 先用 `pubmed`/`semantic` 找题名和同义词 |
| 计算机、AI、数学、物理 | `arxiv` | `semantic`, `crossref`, `openalex` |
| 跨学科广覆盖 | `crossref` | `openalex`, `semantic` |
| 开放获取全文发现 | `pmc`, `europepmc`, `core`, `openaire`, `unpaywall` | `download_with_fallback` |
| 密码学 | `iacr` | `arxiv` |
| 引用统计排序 | `semantic`, `crossref`, `openalex` | `webofscience`, `scopus` 需要 key |
| 出版商/付费数据库 | `webofscience`, `scopus`, `sciencedirect`, `springer`, `wiley` | 仅在 key 已配置时使用 |

查询构建规则：

- 默认把中文问题转为英文关键词。
- 用 3-8 个核心概念词，不要写成长句。
- 医学主题可加入 MeSH 或标准术语。
- 找方法细节时加入软件名、参数名、模型名、章节词，例如 `methods`, `statistical analysis`, `adjusted for`, `bootstrap`, `sensitivity analysis`。

## 正文片段检索

PubMed 只提供题名、作者、摘要、PMID、DOI、期刊和年份等元数据，不提供论文正文抓取。

正文片段检索使用：

```bash
paper-search run search_semantic_snippets --arg query="CMAverse mediation bootstrap confidence interval" --arg limit=5 --arg fieldsOfStudy=Medicine --pretty
```

使用规则：

1. 该工具需要 `SEMANTIC_SCHOLAR_API_KEY`。
2. 它检索 Semantic Scholar Open Access snippet 索引，不等于完整全文解析。
3. 只有 `snippetKind="body"` 的结果才能作为正文片段证据；`title` 或 `abstract` 只能作为线索。
4. 输出正文片段前，必须补齐和核验标题、作者、年份、期刊、DOI 或 PMID。
5. 如果 snippet 无结果，不代表研究不存在；回退到 `search_pubmed`、`search_semantic_scholar` 或 `search_crossref` 做摘要级检索。

## 验证规范

输出给用户前，关键论文必须尽量验证：

```bash
paper-search run search_pubmed --arg query="37654321[PMID]" --arg maxResults=1 --pretty
paper-search run get_paper_by_doi --arg doi="10.xxxx/xxxxx" --pretty
paper-search run search_crossref --arg query="full paper title" --arg maxResults=3 --pretty
```

规则：

- 不凭模型记忆编造 PMID、DOI、期刊、年份或作者。
- PMID 必须能被 PubMed 查询确认。
- DOI 必须能被 DOI 查询或 Crossref/OpenAlex/Semantic Scholar 结果支持。
- 同一论文的 PMID、DOI、题名、第一作者和年份应一致；不一致时标记为可疑。
- snippet 结果缺少元数据时，先用完整标题二次检索补齐。

## 输出格式

### 文献列表

```markdown
| # | 标题 | 作者 | 年份 | 期刊/来源 | DOI | PMID | 验证 |
|---|---|---|---:|---|---|---|---|
| 1 | [Title](URL) | First Author et al. | 2024 | Journal | 10.xxxx/xxxxx | 12345678 | 已验证 |
```

### 正文片段结果

```markdown
### 发现 1

**论文：** Full paper title  
**引用：** Author et al. Journal. Year. DOI/PMID.  
**片段类型：** body  
**章节：** Methods / Statistical Analysis  
**来源：** Semantic Scholar URL

> snippet text
```

## 错误处理

| 场景 | 处理 |
|---|---|
| CLI 不存在 | 提示安装 `npm install -g github:dr-dumpling/paper-search-cli` |
| API key 缺失 | 提示运行 `paper-search setup`；不要索要或保存 key |
| 429 限流 | 降低 `--max-results`，换平台，或提示配置可选 key |
| 0 结果 | 放宽关键词，换英文同义词，换平台，或用 `--sources` 扩展 |
| 下载失败 | 优先开放获取来源和 `download_with_fallback`，报告失败原因 |
| 用户要求完整正文 | 先下载 PDF；再交给当前环境可用的 PDF/MinerU 解析流程 |

## 不属于本 Skill 的事

- 不管理 Zotero、Obsidian 或其他文献库。
- 不写论文正文，不做语言润色。
- 不把 API key、token、cookie 写入 Skill、README 或回复。
- 当前公开 CLI 不提供期刊 IF、JCR 分区或中科院分区查询；遇到这类请求时说明能力边界，除非用户另行指定本地私有工具。
