# PR 预览

每个 PR 都会自动构建一份预览，包含两种获取方式。

## 方式一：构建产物（默认可用，无需任何设置）

`PR preview` 工作流会把构建结果上传为 artifact：

> PR 页面的评论 → **Actions run** → 页面底部 **Artifacts** → 下载 `preview-pr<N>` → 解压后打开 `index.html`

因为是纯静态站点，双击 `index.html` 即可浏览（部分站内链接以 `/` 开头，本地直接打开时可能跳不到对应页；此时用下面的托管预览更合适）。

## 方式二：托管预览 URL（需一次性设置）

工作流同时把预览发布到 `gh-pages` 分支的 `pr-preview/pr-<n>/` 目录。要让这个目录真的能被浏览器访问，需要把 GitHub Pages 的部署源切换为分支模式：

1. 打开仓库 **Settings → Pages**；
2. 把 **Source** 从 *GitHub Actions* 改为 **Deploy from a branch**；
3. **Branch** 选 `gh-pages`，目录选 **/ (root)**，保存；
4. 打开 **Settings → Secrets and variables → Actions → Variables**，新建变量：
   - 名称 `PAGES_DEPLOY_MODE`，值 `branch`

第 4 步会启用 `deploy-branch.yml` —— 它负责把主站发布到 `gh-pages` 根目录，并用 `keep_files: true` 保留 `pr-preview/` 下的预览目录。

设置完成后的地址形态：

| 内容 | URL |
| --- | --- |
| 主站 | `https://<owner>.github.io/<repo>/` |
| PR #123 预览 | `https://<owner>.github.io/<repo>/pr-preview/pr-123/` |

> 预览构建时会把 `BASE_PATH` 设为 `/​<repo>/pr-preview/pr-<n>/`，因此预览站内的所有相对资源都能正确解析。

## 清理

PR 被关闭（合并或关闭）时，`cleanup-preview` 作业会从 `gh-pages` 分支删除该 PR 的预览目录。

## 为什么默认不这么做

主站的默认部署走 `deploy.yml`（GitHub Actions 源），这是官方推荐且最省心的方式。分支模式是在"主站 + PR 预览共用同一个 Pages 站点"这一约束下的替代方案——GitHub Pages 本身不支持在同一站点内为 PR 分配独立预览环境。

如果你有 Netlify / Cloudflare Pages / Vercel 的账号，也可以在那边的控制台直接接入本仓库，它们的 PR 预览体验更好（自动 URL、自动清理），此时可以完全不启用上面的分支模式。

## 相关文件

| 文件 | 作用 |
| --- | --- |
| `.github/workflows/preview.yml` | PR 预览：构建 + 产物上传 + 发布到 gh-pages + 评论 + 关闭时清理 |
| `.github/workflows/deploy-branch.yml` | 可选的 gh-pages 分支部署（仅当 `PAGES_DEPLOY_MODE=branch` 时运行） |
| `.github/workflows/deploy.yml` | 默认部署（GitHub Actions 源，始终保持可用） |
