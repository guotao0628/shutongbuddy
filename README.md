# 《DeepSeek Harness 应用开发实践》

[![在线阅读](https://img.shields.io/badge/阅读-在线书-2ea44f?logo=astro)](https://guotao0628.github.io/shutongbuddy/)
[![Build](https://github.com/guotao0628/shutongbuddy/actions/workflows/deploy.yml/badge.svg)](https://github.com/guotao0628/shutongbuddy/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/代码-MIT-yellow.svg)](LICENSE)
[![文档: CC BY 4.0](https://img.shields.io/badge/文档-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![English](https://img.shields.io/badge/README-English-blue.svg)](README.en.md)

一本开源实践手册 + 配套代码仓库：基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（命令行简称 `dsh`）学习如何开发智能体应用——插件架构、多模型接入、插件开发与多智能体协同。

> 📖 **在线阅读**：https://guotao0628.github.io/shutongbuddy/
> 📥 **下载中心**：https://guotao0628.github.io/shutongbuddy/downloads/ （PDF / EPUB / Markdown / ZIP）
> 📚 **术语表**：https://guotao0628.github.io/shutongbuddy/glossary/
>
> **项目代号 / 产品名：ShuTongBuddy（书童）**——一位懂你、陪你备考的伙伴。

## 关于本书

- 书名：《DeepSeek Harness 应用开发实践》
- 作者：郭涛　｜　出版：清华大学出版社
- 结构：前置页 + 四部分（8 章）+ 结束语 + 附录 A–F
- 贯穿案例：**ShuTongBuddy（书童）大学生备考助手**，第 8 章集成为 **ShuTongBuddy Studio**（Web 备考助手）
- 配套代码：`plugins/shu-tong-buddy/`（插件包）、`examples/`（示例工程）、`agents/`（多智能体）

## 站点功能

| 分类 | 功能 |
| --- | --- |
| **阅读** | 侧边栏 + 页内目录、明暗主题、阅读进度条、字号 A-/A+、跨会话位置恢复与「继续阅读」、章节阅读时长估算、打印单章 |
| **学习** | 侧边栏章节已读勾选与进度、书签、最近阅读、正文划重点、练习题「会了」标记、学习时长统计 |
| **我的阅读 / 我的划线** | 进度总览页与划线管理页；划线可导出 **Markdown / Anki(TSV) / JSON**，数据只存本地浏览器 |
| **内容** | 中英双语（站点框架 + 前置页已英文化）、术语表独立页（含 Mermaid 概念图）、正文术语自动双链、图表编号与交叉引用、勘误与更新日志、统一的下载与版本页 |
| **检索** | Pagefind 全文检索（构建期索引）、首页热门搜索词、最近搜索词记录、快捷键 `/` 唤起搜索 |
| **互动** | giscus 评论（GitHub Discussions）、提交勘误、分享、点赞、邮件订阅 |
| **工程** | `astro check` 类型检查、站内死链检查、中文排版检查、Playwright 端到端测试、Lighthouse 预算、Dependabot、PR 校验与预览产物 |
| **PWA** | Web App Manifest、PNG 图标（192/512/maskable/apple-touch）、离线缓存 Service Worker |

## 技术栈

| 能力 | 方案 |
| --- | --- |
| 静态站点 | Astro 7（静态输出，无客户端框架） |
| 文档主题 | Starlight 0.42（侧边栏、页内目录、i18n、明暗主题） |
| 全文检索 | Pagefind（构建期生成索引） |
| 代码高亮 | Expressive Code（Shiki，复制按钮） |
| 图表 | 内联 SVG（随主题换色）+ Mermaid（按需加载） |
| 样式 | `src/styles/book.css`（清华紫主题与图书排版）+ `book-widgets.css`（阅读组件），覆盖 Starlight 设计令牌 |
| 交互 | `src/scripts/book.js`（全站本地化阅读工具，数据仅存 localStorage） |
| 自动部署 | GitHub Actions → GitHub Pages |

## 目录结构

```
.
├── astro.config.mjs               # 站点配置、i18n、侧边栏（章节顺序在此登记）
├── package.json / tsconfig.json
├── playwright.config.ts           # 端到端测试配置
├── lighthouserc.json              # Lighthouse 预算
├── src/
│   ├── consts.ts                  # 图书常量、下载清单、热门搜索词、版本信息
│   ├── content.config.ts          # Starlight 内容集合
│   ├── content/docs/              # ★ 书稿唯一来源
│   │   ├── index.mdx              # 封面 + 全书目录
│   │   ├── brief.md / author.md / preface.md
│   │   ├── part1/ch1.md … part4/ch8.md
│   │   ├── epilogue.md / appendix.md
│   │   ├── glossary.mdx           # 术语表（含 Mermaid 概念图）
│   │   ├── downloads.mdx          # 下载与版本
│   │   ├── errata.mdx             # 勘误与更新日志
│   │   ├── my-reading.mdx         # 我的阅读（客户端渲染）
│   │   ├── my-notes.mdx           # 我的划线（客户端渲染）
│   │   ├── 404.mdx
│   │   └── en/                    # 英文版入口页
│   ├── components/Head.astro      # 覆写 Starlight Head（元信息 / 分享卡片 / PWA / 统计 / 交互脚本）
│   ├── pages/rss.xml.ts           # RSS 订阅
│   ├── pages/robots.txt.ts        # robots.txt
│   ├── scripts/book.js            # 全站交互脚本
│   ├── styles/                    # book.css + book-widgets.css
│   └── assets/logo.svg
├── public/                        # favicon、PNG 图标、og.png、manifest、SW、PDF
├── scripts/                       # 构建期脚本（版本、下载包、品牌图、检查）
├── tests/e2e.spec.ts              # 端到端测试
├── .github/workflows/             # deploy / pr / lighthouse / external-links
├── plugins/shu-tong-buddy/        # 配套插件包（TypeScript）
├── agents/  examples/             # 多智能体与示例工程
└── book_tools/                    # 本地构建辅助（已 gitignore，不发布）
```

## 本地开发

要求 **Node ≥ 22**。

```bash
npm install
npm run dev       # 开发服务器（自动先生成版本信息与下载包）
npm run build     # 构建到 dist/
npm run preview   # 预览构建结果
```

### 校验命令

```bash
npm run check          # astro check 类型检查（0 error 才通过）
npm run check:typo     # 书稿中文排版检查（未闭合围栏、行尾空格、中英文间距等）
npm run check:links    # 站内死链检查（扫描 dist/）
npm run check:links:external   # 外链抽查（联网，慢）
npm run test:e2e       # Playwright 端到端测试（使用系统 Chrome）
npm run verify         # 以上全部串起来跑一遍
```

## 修改书稿

书稿唯一来源是 `src/content/docs/`。每篇以 YAML frontmatter 开头：

```markdown
---
title: "第 1 章 快速上手：十分钟跑通 DeepSeek Harness"
description: "用于搜索结果与 SEO 的摘要"
---

正文从这里开始，使用二级标题 `##` 组织小节。
```

- 新增章节后，需要在 `astro.config.mjs` 的 `sidebar` 中登记（标签、所属部分、阅读顺序，以及英文 `translations`）。
- 正文里的 `图 2-1` 会自动变成指向本章插图的锚点。
- 内联 SVG 插图会被 `book_tools/` 的 PDF/DOCX 生成脚本跳过，因此不影响纸质交付物。

## 可选配置（环境变量）

| 变量 | 用途 |
| --- | --- |
| `PUBLIC_GA_ID` | Google Analytics 4 衡量 ID，配置后才注入统计脚本 |
| `PUBLIC_UMAMI_WEBSITE_ID` / `PUBLIC_UMAMI_SRC` | Umami 统计（默认 `https://cloud.umami.is/script.js`） |
| `SITE_URL` / `BASE_PATH` | 覆盖站点地址与子路径（默认从 `GITHUB_REPOSITORY` 推导） |

> 默认**不采集任何访问数据**；只有显式配置了统计 ID 才会加载脚本。

## 中英双语

站点框架与前置页提供英文版（`/en/`）。八章正文尚未翻译，访问 `/en/part1/ch1/` 时会回落到中文原文并显示提示。补充译文的方式：在 `src/content/docs/en/` 下按相同 slug 新建文件即可。

## 重新生成出版社交付物（本地，不随仓库发布）

`book_tools/` 与 `release/` 均已加入 `.gitignore`，只存在于本地：

1. Word：`python book_tools/markdown_to_docx.py`（依赖 `pip install python-docx`）
2. PDF　：`python book_tools/markdown_to_pdf.py`（依赖 `pip install fpdf2`）

两个脚本直接从 `src/content/docs/` 读取书稿（自动剥离 frontmatter 并把 `title` 还原为章标题），输出到 `release/`。

品牌图片（`og.png`、PNG 图标）由 `npm run brand` 生成，产物已提交仓库，构建流程不依赖它。

## 许可证

- 代码：以 [MIT 许可证](./LICENSE) 开源；
- 文档/文字：采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)（署名）共享。

## 联系方式

- 作者邮箱：**guotao3s@163.com**
- 问题反馈：[GitHub Issues](https://github.com/guotao0628/shutongbuddy/issues)，也欢迎用页面底部的「提交勘误」。

欢迎 fork、分享与贡献。