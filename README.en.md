# DeepSeek Harness in Practice

[![Read online](https://img.shields.io/badge/Read-online-2ea44f?logo=astro)](https://guotao0628.github.io/shutongbuddy/)
[![Build](https://github.com/guotao0628/shutongbuddy/actions/workflows/deploy.yml/badge.svg)](https://github.com/guotao0628/shutongbuddy/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/Code-MIT-yellow.svg)](LICENSE)
[![Docs: CC BY 4.0](https://img.shields.io/badge/Docs-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

An open-source practical handbook and companion codebase for building agent applications with [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) — plugin architecture, multi-model integration, plugin development, and multi-agent collaboration.

> 📖 **Read online**: https://guotao0628.github.io/shutongbuddy/
> 📥 **Downloads**: https://guotao0628.github.io/shutongbuddy/downloads/ (PDF / EPUB / Markdown / ZIP)
> 📚 **Glossary**: https://guotao0628.github.io/shutongbuddy/glossary/
>
> Product / codename: **ShuTongBuddy** — an exam-prep companion for college students.

## About the Book

- Title: *DeepSeek Harness 应用开发实践* (DeepSeek Harness in Practice)
- Author: 郭涛 (Guo Tao) ｜ Publisher: 清华大学出版社 (Tsinghua University Press)
- Structure: front matter + 4 parts (8 chapters) + epilogue + appendices A–F
- Running case: **ShuTongBuddy**, integrated into **ShuTongBuddy Studio** (a web-based exam-prep assistant)
- Companion code: `plugins/shu-tong-buddy/`, `examples/`, `agents/`

## Site Features

| Area | Features |
| --- | --- |
| **Reading** | Sidebar + in-page TOC, light/dark themes, reading progress bar, font size controls, cross-session position restore, per-chapter reading-time estimate, print a chapter |
| **Study tools** | Per-chapter read checkboxes with progress, bookmarks, recently read, text highlighting, exercise "got it" marks, time tracking |
| **My Reading / My Highlights** | Progress overview and highlight manager; highlights export to **Markdown / Anki (TSV) / JSON** — all data stays in your browser |
| **Content** | Bilingual site chrome and front matter, standalone glossary with a Mermaid concept map, automatic glossary cross-links, figure numbering and cross-references, errata page with changelog, unified downloads and version page |
| **Search** | Pagefind full-text search (index built at build time), popular searches, recent searches, `/` shortcut |
| **Community** | giscus comments, report errata, share, like, email subscription |
| **Engineering** | `astro check`, internal link check, Chinese typography check, Playwright e2e, Lighthouse budgets, Dependabot, PR checks and preview artifacts |
| **PWA** | Web App Manifest, PNG icons (192/512/maskable/apple-touch), offline service worker |

## Tech Stack

| Concern | Solution |
| --- | --- |
| Static site | Astro 7 (static output, no client framework) |
| Docs theme | Starlight 0.42 (sidebar, TOC, i18n, light/dark) |
| Search | Pagefind (index built at build time) |
| Syntax highlighting | Expressive Code (Shiki) with copy buttons |
| Diagrams | Inline SVG (theme-aware) + Mermaid (lazy-loaded) |
| Styling | `src/styles/book.css` + `book-widgets.css`, overriding Starlight design tokens |
| Interactions | `src/scripts/book.js` (local-only reading tools, localStorage) |
| Deployment | GitHub Actions → GitHub Pages |

## Development

Requires **Node ≥ 22**.

```bash
npm install
npm run dev       # dev server
npm run build     # build to dist/
npm run preview   # preview the build
```

### Checks

```bash
npm run check          # astro check (type checking)
npm run check:typo     # manuscript typography check
npm run check:links    # internal link check over dist/
npm run test:e2e       # Playwright end-to-end tests
npm run verify         # all of the above
```

Install the browser once before running e2e: `npx playwright install chromium`.

## Optional configuration (environment variables)

| Variable | Purpose |
| --- | --- |
| `PUBLIC_GA_ID` | Google Analytics 4 measurement ID |
| `PUBLIC_UMAMI_WEBSITE_ID` / `PUBLIC_UMAMI_SRC` | Umami analytics |
| `SITE_URL` / `BASE_PATH` | Override site URL and sub-path |

> No analytics script is loaded by default.

## Translation status

The site chrome and front matter are available in English (`/en/`). The eight chapters are still Chinese only and fall back to the original text with a notice. To add a translation, create a file with the same slug under `src/content/docs/en/`.

## License

- Code: [MIT License](./LICENSE)
- Documentation: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
