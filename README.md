# 《DeepSeek Harness 应用开发实践》

一本开源实践手册 + 配套代码仓库：基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（命令行简称 `dsh`）学习如何开发智能体应用——插件架构、多模型接入、插件开发与多智能体协同。

> 📖 **在线阅读**：https://guotao0628.github.io/shutongbuddy/（mdBook 构建，部署于 GitHub Pages）
>
> **GitHub 仓库名：`shutongbuddy`**
> 项目代号 / 产品名：**ShuTongBuddy**（书童）——一位懂你、陪你备考的伙伴。

## 关于本书

- 书名：《DeepSeek Harness 应用开发实践》
- 结构：前置页 + 四部分（8 章）+ 结束语 + 附录
- 贯穿案例：**ShuTongBuddy（书童）大学生备考助手**，第 8 章集成为 **ShuTongBuddy Studio**（Web 备考助手）
- 配套代码：`plugins/`（插件）与 `agents/`（多智能体）

## 目录结构

```
.
├── book.toml                      # mdBook 配置
├── .github/workflows/mdbook.yml   # CI：自动构建并发布 GitHub Pages
├── docs/
│   └── manual/markdown/           # Markdown 书稿（mdBook 源）
│       ├── SUMMARY.md             # mdBook 目录（章节顺序）
│       └── 00-content-brief.md … 12-appendix.md
├── release/                       # 出版社交付物（已 gitignore）
│   ├── DeepSeek Harness 应用开发实践.docx
│   └── DeepSeek Harness 应用开发实践.pdf
├── plugins/                       # 配套插件代码（TypeScript）
│   └── shu-tong-buddy/           # 备考助手插件包
├── agents/                        # 多智能体代码
└── book_tools/                    # 本地构建辅助（已 gitignore，勿上传）
    ├── markdown_to_docx.py
    └── markdown_to_pdf.py
```

## 重新生成（本地，不随仓库发布）

书稿以 `docs/manual/markdown/` 下的 Markdown 为源，用 `book_tools/` 里的脚本重新生成出版社交付物（该目录已加入 .gitignore，仅存在于本地）：

1. Word：`python book_tools/markdown_to_docx.py`（依赖 `pip install python-docx`）
2. PDF：`python book_tools/markdown_to_pdf.py`（依赖 `pip install fpdf2`）

## 许可证

- 代码：以 [MIT 许可证](./LICENSE) 开源；
- 文档/文字：采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)（署名）共享。

欢迎 fork、分享与贡献。
