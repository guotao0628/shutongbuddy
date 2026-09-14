# DeepSeek Harness in Practice

An open-source practical handbook and companion codebase for building agent applications with [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) — plugin architecture, multi-model integration, plugin development, and multi-agent collaboration.

> 📖 **Read online**: https://guotao0628.github.io/shutongbuddy/ (built with mdBook, deployed on GitHub Pages)
>
> Product / codename: **ShuTongBuddy** — an exam-prep companion for college students.

## About the Book

- Title: *DeepSeek Harness 应用开发实践* (DeepSeek Harness in Practice)
- Author: 郭涛 (Guo Tao)
- Publisher: 清华大学出版社 (Tsinghua University Press)
- Structure: front matter + 4 parts (8 chapters) + epilogue + appendix
- Running case: **ShuTongBuddy**, integrated into **ShuTongBuddy Studio** (a web-based exam-prep assistant)

## Repository Layout

```
.
├── book.toml                      # mdBook configuration
├── .github/workflows/mdbook.yml   # CI: build & deploy to GitHub Pages
├── docs/manual/markdown/          # book source (Markdown)
│   ├── SUMMARY.md                 # mdBook table of contents
│   └── 00-content-brief.md … 12-appendix.md
├── plugins/shu-tong-buddy/        # exam-prep plugin package (TypeScript)
├── agents/                        # multi-agent code
└── release/                       # publisher deliverables (gitignored)
```

## License

- Code: [MIT License](./LICENSE)
- Documentation: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).
