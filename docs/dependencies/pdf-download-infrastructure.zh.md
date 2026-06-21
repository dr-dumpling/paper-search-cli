# Dependency: PDF Download Infrastructure

PDF 下载基础设施是底层文件下载和文件名安全工具。它不同于 `pdf_discovery` 能力；`pdf_discovery` 负责 fallback 编排，PDF 下载基础设施只负责单个 URL / 文件的安全处理。

---

## 1. 当前职责

- 从候选 PDF URL 下载文件。
- 生成安全文件名。
- 保存到指定目录。
- 提供 PDF 解析或文本提取辅助，如果代码中启用。
- 对下载错误进行基础处理。

---

## 2. 主要代码

| 文件 | 职责 |
|---|---|
| `src/utils/PdfDownload.ts` | `downloadPdfFromUrl`、`safeFilename` 等下载工具 |
| `src/utils/PDFExtractor.ts` | PDF 文本提取辅助，若当前功能使用 |
| `src/services/OpenAccessFallbackService.ts` | 消费下载工具，但不属于 infrastructure 本身 |

---

## 3. 被哪些能力使用

| 能力 | 使用方式 |
|---|---|
| pdf_discovery | 下载 source metadata、repository、Unpaywall 或最终 fallback 发现的 PDF |
| future institutional access | 未来 provider 成功拿到 PDF URL 或文件后可复用 |

---

## 4. 不变量

- `safeFilename()` 必须避免不安全路径字符。
- 下载路径必须尊重用户传入的 `savePath`。
- 下载失败不得泄露敏感 URL 片段。
- 不应在这里实现 fallback 顺序。
- 不应在这里处理用户登录或会话状态。

---

## 5. 扩展方式

### 改下载实现

1. 保持函数签名兼容，除非同步更新所有调用方和 JSON contract。
2. 补 mock 下载测试。
3. 确认文件名安全。
4. 确认错误 message 脱敏。

### 增加 PDF 解析

1. 保持与下载分离。
2. 不让解析失败破坏下载成功结果。
3. 对大文件和加密 PDF 做错误分类。

---

## 6. 禁止事项

- 不在基础设施里决定 fallback 顺序。
- 不把具体 provider 的特殊逻辑写入通用下载工具。
- 不把机构访问逻辑写入 PDF download util。
- 不打印完整敏感 URL。

---

## 7. 测试要求

```bash
npm test -- --runInBand tests/services/OpenAccessFallbackService.test.ts
npm run build
```

如新增独立 util 测试，应补 `tests/utils/PdfDownload.test.ts` 或等价测试文件。
