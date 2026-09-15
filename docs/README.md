# 文档（docs/）

本目录存放与出版、验证相关的项目文档。

- `publishing-checklist.md` —— 出版流程清单
- `verification-checklist.md` —— 技术验证清单（书中命令与代码的核对项）

## 书稿在哪？

书稿（Markdown 源）**不在本目录**，而是 Starlight 内容集合：

```
src/content/docs/
├── index.mdx        # 封面 + 全书目录
├── brief.md         # 本书内容简介
├── author.md        # 作者简介
├── preface.md       # 自序
├── part1/ch1.md …   # 第一部分
├── part2/ch3.md …   # 第二部分
├── part3/ch5.md …   # 第三部分
├── part4/ch7.md …   # 第四部分
├── epilogue.md      # 结束语
└── appendix.md      # 附录 A–F
```

章节顺序与侧边栏标签在 `astro.config.mjs` 的 `sidebar` 中维护。

在线书使用 Astro + Starlight 构建，详见根目录 `README.md`。
