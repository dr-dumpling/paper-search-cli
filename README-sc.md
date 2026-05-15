# Paper Search CLI

独立的学术文献检索命令行工具，用于跨多个学术来源检索论文、查询元数据和下载 PDF。

这个项目面向本地直接使用和 agent 工作流。它是普通 CLI 进程，每次命令执行完就退出，不需要长期运行的后台服务。

## 功能

- 支持 Crossref、arXiv、PubMed、Web of Science、Google Scholar、bioRxiv、medRxiv、Semantic Scholar、IACR ePrint、ScienceDirect、Springer、Wiley、Scopus、Sci-Hub 等来源。
- 默认输出 JSON，方便 agent 和脚本稳定解析。
- 人类可读错误写入 stderr。
- 提供 `status`、`tools`、`search`、`download`、`run` 命令。
- 对需要凭证的平台，通过 `.env` 读取可选 API key。

## 安装

```bash
git clone https://github.com/dr-dumpling/paper-search-cli.git
cd paper-search-cli
npm install
npm run build
```

不做全局安装时：

```bash
node dist/cli.js status --pretty
```

可选：注册为本机命令：

```bash
npm link
paper-search status --pretty
```

## 快速使用

```bash
paper-search search "large language model evaluation" --platform crossref --max-results 5 --pretty
paper-search search "osteoarthritis occupational exposure" --platform pubmed --max-results 3 --pretty
paper-search status --pretty
paper-search tools --pretty
```

也可以直接通过 Node 运行：

```bash
node dist/cli.js search "machine learning" --platform crossref --max-results 1 --pretty
```

## 命令

### `search`

统一检索入口：

```bash
paper-search search <query> [--platform crossref] [--max-results 10] [--year 2024]
```

常用参数：

- `--platform`: `crossref`、`arxiv`、`pubmed`、`webofscience`、`biorxiv`、`medrxiv`、`semantic`、`iacr`、`googlescholar`、`sciencedirect`、`springer`、`scopus`、`scihub` 或 `all`
- `--max-results`: 最大返回数量
- `--year`: 年份或年份范围
- `--author`: 作者过滤
- `--journal`: 期刊过滤
- `--pretty`: 格式化 JSON

### `run`

按内部工具名运行。这个入口适合 agent 使用稳定命令面。

```bash
paper-search run search_crossref --arg query="machine learning" --arg maxResults=5 --pretty
paper-search run search_pubmed --json-args '{"query":"osteoarthritis","maxResults":5}' --pretty
```

查看可用工具名：

```bash
paper-search tools --pretty
```

### `status`

查看平台能力和 API key 配置状态。不会打印密钥内容。

```bash
paper-search status --pretty
paper-search status --validate --pretty
```

`--validate` 会对平台发起实时请求，应按需使用。

### `download`

在平台支持时下载论文 PDF：

```bash
paper-search download 2301.00001 --platform arxiv --save-path ./downloads
paper-search download 10.1000/example --platform scihub --save-path ./downloads
```

## 配置

Crossref、arXiv 等免费元数据来源无需配置即可使用。

需要凭证的平台可复制模板：

```bash
cp .env.example .env
```

只填写自己需要的平台：

- `WOS_API_KEY`
- `PUBMED_API_KEY`
- `SEMANTIC_SCHOLAR_API_KEY`
- `ELSEVIER_API_KEY`
- `SPRINGER_API_KEY`
- `SPRINGER_OPENACCESS_API_KEY`
- `WILEY_TDM_TOKEN`
- `CROSSREF_MAILTO`

`.env` 已被 git 忽略，不应提交。

## 输出约定

默认输出 JSON：

```json
{
  "ok": true,
  "tool": "search_papers",
  "message": "Found 1 papers.",
  "data": []
}
```

需要纯文本时可使用：

```bash
paper-search search "machine learning" --platform crossref --max-results 1 --format text
```

## 开发

```bash
npm install
npm run build
npm test -- --runInBand
npm audit --omit=dev
```

目录结构：

```text
src/cli.ts               CLI 入口
src/core/                工具注册、参数 schema、调度器、搜索器初始化
src/platforms/           各平台检索和下载实现
src/models/              论文数据模型
src/utils/               共享工具
tests/                   单元测试和集成测试
```

## 合规说明

部分来源存在法律、授权或服务条款限制。请只在你有权访问和处理内容的场景中使用相应集成；对合规要求高的任务，优先使用官方 API 和开放元数据来源。

## License

MIT
