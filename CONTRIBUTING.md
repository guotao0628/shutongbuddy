# 贡献指南

感谢你对《DeepSeek Harness 应用开发实践》的关注与贡献！本书是一本开源实践手册 + 配套代码仓库，欢迎任何形式的参与。

## 你可以贡献什么

- **报告问题**：内容错误、代码 bug、排版问题、链接失效；
- **修正笔误**：错别字、术语不一致、格式问题；
- **补充示例**：新增示例代码、完善 `plugins/` 或 `agents/`；
- **改进内容**：补充章节、完善讲解、更新【待核】标记。

## 贡献流程

1. **Fork** 本仓库到你的账号；
2. 创建特性分支：`git checkout -b fix/xxx`；
3. 做出修改（书稿在 `docs/manual/markdown/`，代码在 `plugins/`、`agents/`）；
4. 提交并推送：`git push origin fix/xxx`；
5. 发起 **Pull Request**，简要说明改动内容。

## 目录约定

| 路径 | 内容 | 修改说明 |
|------|------|----------|
| `docs/manual/markdown/` | 书稿 Markdown（mdBook 源） | 改内容在这里 |
| `docs/manual/markdown/SUMMARY.md` | mdBook 目录 | 增删章节时同步更新 |
| `plugins/shu-tong-buddy/` | 备考助手插件包（TypeScript） | 第 5 章配套代码 |
| `agents/` | 多智能体代码 | 第 8 章配套代码 |
| `book.toml` | mdBook 配置 | 一般无需改动 |

## 本地构建在线书

```bash
mdbook serve --open    # 需先安装 mdBook（cargo install mdbook）
```

## 本地生成出版社交付物（可选）

`release/` 下的 Word/PDF 由 `book_tools/` 脚本生成，该目录**不随仓库发布**（已 gitignore）：

```bash
python book_tools/markdown_to_docx.py
python book_tools/markdown_to_pdf.py
```

## 写作规范

- 术语统一：**ShuTongBuddy**（产品名）、`dsh`（命令行）、**DeepSeek Harness**（框架全称）；
- 代码块标注语言（`bash` / `python` / `typescript` / `yaml`）；
- 每章末尾保留「本章小结」；
- 不确定的细节用 `【待核】` 标出。

感谢每一位贡献者！
