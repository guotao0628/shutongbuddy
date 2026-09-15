# DeepSeek Harness in Practice

An open-source practical handbook and companion codebase for building agent applications with [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) — plugin architecture, multi-model integration, plugin development, and multi-agent collaboration.

> 📖 **Read online**: https://guotao0628.github.io/shutongbuddy/
> 📥 **PDF**: https://guotao0628.github.io/shutongbuddy/downloads/deepseek-harness-in-practice.pdf
> 📚 **EPUB**: https://guotao0628.github.io/shutongbuddy/epub/deepseek-harness-in-practice.epub
>
> Product / codename: **ShuTongBuddy** — an exam-prep companion for college students.

## About the Book

- Title: *DeepSeek Harness 应用开发实践* (DeepSeek Harness in Practice)
- Author: 郭涛 (Guo Tao)
- Publisher: 清华大学出版社 (Tsinghua University Press)
- Structure: front matter + 4 parts (8 chapters) + epilogue + appendix
- Running case: **ShuTongBuddy**, integrated into **ShuTongBuddy Studio** (a web-based exam-prep assistant)

## Tech Stack

The online book is built with **Astro + Starlight**:

| Concern | Solution |
| --- | --- |
| Static site | Astro 7 (static output, no client framework) |
| Docs theme | Starlight 0.42 (sidebar, in-page TOC, light/dark themes) |
| Search | Pagefind (index built at build time) |
| Syntax highlighting | Expressive Code (Shiki) with copy buttons |
| Styling | Custom `book.css` overriding Starlight design tokens |
| Interactions | `src/scripts/book.js` (reading progress, font size, bookmarks, highlights, comments) |
| Deployment | GitHub Actions → GitHub Pages |

## Repository Layout

```
.
├── astro.config.mjs               # site config and sidebar (chapter order)
├── src/
│   ├── content/docs/              # ★ single source of truth for the book
│   │   ├── index.mdx              # cover + full table of contents
│   │   ├── brief.md / author.md / preface.md
│   │   ├── part1/ch1.md … part4/ch8.md
│   │   └── epilogue.md / appendix.md
│   ├── components/Head.astro      # Starlight Head override (meta / PWA / scripts)
│   ├── scripts/book.js            # site-wide interaction script
│   └── styles/book.css            # theme and typography
├── public/                        # favicon, manifest, service worker, PDF
├── scripts/build-epub.mjs         # merges chapters for pandoc (EPUB)
├── .github/workflows/deploy.yml   # CI: build & deploy to GitHub Pages
├── plugins/shu-tong-buddy/        # exam-prep plugin package (TypeScript)
├── agents/                        # multi-agent code
└── examples/                      # sample projects
```

## Development

```bash
npm install
npm run dev       # dev server
npm run build     # build to dist/
npm run preview   # preview the build
```

Requires **Node ≥ 22**.

## License

- Code: [MIT License](./LICENSE)
- Documentation: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
