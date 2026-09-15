# 《DeepSeek Harness 应用开发实践》

[![在线阅读](https://img.shields.io/badge/阅读-在线书-2ea44f?logo=astro)](https://guotao0628.github.io/shutongbuddy/)
[![License: MIT](https://img.shields.io/badge/代码-MIT-yellow.svg)](LICENSE)
[![文档: CC BY 4.0](https://img.shields.io/badge/文档-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![English](https://img.shields.io/badge/README-English-blue.svg)](README.en.md)

一本开源实践手册 + 配套代码仓库：基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（命令行简称 `dsh`）学习如何开发智能体应用——插件架构、多模型接入、插件开发与多智能体协同。

> 📖 **在线阅读**：https://guotao0628.github.io/shutongbuddy/
> 📥 **下载 PDF**：https://guotao0628.github.io/shutongbuddy/downloads/deepseek-harness-in-practice.pdf
> 📚 **下载 EPUB**：https://guotao0628.github.io/shutongbuddy/epub/deepseek-harness-in-practice.epub
>
> **项目代号 / 产品名：ShuTongBuddy（书童）**——一位懂你、陪你备考的伙伴。

## 关于本书

- 书名：《DeepSeek Harness 应用开发实践》
- 作者：郭涛　｜　出版：清华大学出版社
- 结构：前置页 + 四部分（8 章）+ 结束语 + 附录
- 贯穿案例：**ShuTongBuddy（书童）大学生备考助手**，第 8 章集成为 **ShuTongBuddy Studio**（Web 备考助手）
- 配套代码：`plugins/`（插件）与 `examples/`（示例工程）

## 技术栈

在线书使用 **Astro + Starlight** 构建：

| 能力 | 方案 |
| --- | --- |
| 静态站点 | Astro 7（静态输出，零客户端框架依赖） |
| 文档主题 | Starlight 0.42（侧边栏、右侧页内目录、明暗主题） |
| 全文检索 | Pagefind（构建期生成索引，支持中文） |
| 代码高亮 | Expressive Code（Shiki，带复制按钮） |
| 样式体系 | 自定义 `book.css`（清华紫主题 + 图书排版），覆盖 Starlight 设计令牌 |
| 交互增强 | `src/scripts/book.js`（阅读进度、字号调节、书签、划重点、评论等） |
| 自动部署 | GitHub Actions → GitHub Pages |

## 目录结构

```
.
├── astro.config.mjs               # 站点配置与侧边栏（章节顺序在此登记）
├── package.json
├── tsconfig.json
├── src/
│   ├── content.config.ts          # Starlight 内容集合定义
│   ├── content/docs/              # ★ 书稿唯一来源
│   │   ├── index.mdx              # 封面 + 全书目录
│   │   ├── brief.md               # 本书内容简介
│   │   ├── author.md              # 作者简介
│   │   ├── preface.md             # 自序
│   │   ├── part1/ch1.md … ch2.md
│   │   ├── part2/ch3.md … ch4.md
│   │   ├── part3/ch5.md … ch6.md
│   │   ├── part4/ch7.md … ch8.md
│   │   ├── epilogue.md            # 结束语
│   │   └── appendix.md            # 附录 A–F
│   ├── components/Head.astro      # 覆写 Starlight Head（元信息 / PWA / 交互脚本）
│   ├── scripts/book.js            # 全站交互脚本
│   ├── styles/book.css            # 主题与排版
│   └── assets/logo.svg
├── public/                        # 静态资源
│   ├── favicon.svg
│   ├── manifest.webmanifest       # PWA
│   ├── service-worker.js          # 离线阅读
│   └── downloads/                 # 可直接下载的 PDF
├── scripts/build-epub.mjs         # 合并书稿（供 pandoc 生成 EPUB）
├── .github/workflows/deploy.yml   # CI：构建并发布 GitHub Pages
├── plugins/shu-tong-buddy/        # 配套插件包（TypeScript）
├── agents/                        # 多智能体代码
├── examples/                      # 示例工程
└── book_tools/                    # 本地构建辅助（已 gitignore，不发布）
```

## 本地开发

```bash
npm install
npm run dev       # 开发服务器
npm run build     # 构建到 dist/
npm run preview   # 预览构建结果
```

Node 版本要求：**≥ 22**。

## 修改书稿

书稿的唯一来源是 `src/content/docs/`。每篇以 YAML frontmatter 开头：

```markdown
---
title: "第 1 章 快速上手：十分钟跑通 DeepSeek Harness"
description: "用于搜索结果与 SEO 的摘要"
---

正文从这里开始，使用二级标题 `##` 组织小节。
```

> 新增章节后，需要在 `astro.config.mjs` 的 `sidebar` 中登记（标签、所属部分、阅读顺序）。

## 重新生成出版社交付物（本地，不随仓库发布）

`book_tools/` 与 `release/` 均已加入 `.gitignore`，只存在于本地：

1. Word：`python book_tools/markdown_to_docx.py`（依赖 `pip install python-docx`）
2. PDF　：`python book_tools/markdown_to_pdf.py`（依赖 `pip install fpdf2`）

两个脚本直接从 `src/content/docs/` 读取书稿（自动剥离 frontmatter 并把 `title` 还原为章标题），输出到 `release/`。

## 许可证

- 代码：以 [MIT 许可证](./LICENSE) 开源；
- 文档/文字：采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)（署名）共享。

## 联系方式

- 作者邮箱：**guotao3s@163.com**
- 问题反馈：欢迎通过 [GitHub Issues](https://github.com/guotao0628/shutongbuddy/issues) 提交。

欢迎 fork、分享与贡献。
