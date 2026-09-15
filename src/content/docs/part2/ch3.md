---
title: "第 3 章 安装部署与 Web UI"
description: "第 1 章用的是最省事的路径。本章把安装部署这件事讲完整：两种安装方式、五种运行 Profile、命令行语法，以及必须认真对待的安全基线。"
---

> **本章目标**：掌握 npx 与源码两种安装方式、五种运行 Profile、命令行参数规则、$DSH_HOME 目录结构与安全基线。

第 1 章用的是最省事的路径。本章把安装部署这件事讲完整：两种安装方式、五种运行 Profile、命令行语法，以及必须认真对待的安全基线。

## 3.1 环境要求

| 项目 | 要求 |
| --- | --- |
| Node.js | ^22.19.0 或 >=24.0.0 |
| 包管理器（仅源码方式） | pnpm 11.7.0（仓库 packageManager 字段锁定） |
| 操作系统 | Windows / macOS / Linux 均可 |
| 网络 | npx 方式需访问 npm registry；运行期需访问模型 API |


**Windows 用户提示**：命令示例中的 `npx`、`pnpm` 在 PowerShell 与 Git Bash 中均可直接使用。

## 3.2 方式一：npx 直接运行（推荐日常使用）

```bash
npx @deepseek-ai/dsh web
```
这是官方给出的标准入口：无需克隆仓库，npx 拉取发布包后直接启动 Web UI，默认地址 http://127.0.0.1:3080。常用变体：

```bash
npx @deepseek-ai/dsh web --no-open   # 不自动打开浏览器
```
适合：日常使用、快速体验、跟随本册绝大多数章节操作。

## 3.3 方式二：源码构建（推荐给要改代码的读者）

```bash
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```
两个要点：

- pnpm run build 负责准备仓库构建产物（宿主库、客户端库、前端），先构建再运行，pnpm dsh web 直接使用已构建的产物，不会重复构建；
- pnpm dsh <args...> 运行的是 TypeScript 入口并原样转发所有参数——也就是说，本册所有 dsh 命令在源码树下写成 pnpm dsh 即可。

适合：第 5 章插件开发（教程要求从完成源码构建的仓库检出开始）、阅读源码、向官方贡献代码。

## 3.4 五种运行 Profile

`dsh` 命令是唯一的 Node 应用启动器，所有运行形态都是"profile + 参数"：

| 命令 | 用途 |
| --- | --- |
| dsh web | --profile web 的别名：启动 Web UI 服务 |
| dsh --profile headless "任务" | 一次性运行：开一个全新持久会话，打印最终答案后退出 |
| dsh --profile sdk | 以 JSON-RPC stdio 服务 SDK 客户端，直到关闭或断开 |
| dsh --profile sdk-minimal | 用独立的最小插件树服务 SDK 客户端 |
| dsh --profile acp | 以 ACP stdio 服务自动化客户端，直到断开 |


五个官方 Profile 首次使用时会从内置模板自动初始化。`desktop` 这个名称保留给 Electron 桌面应用，CLI 会拒绝以它启动或管理插件。

**创建自己的 Profile**——这是定制 Harness 的正道：

```bash
dsh --profile mylab --from-default-profile web
```
该命令以官方 web 为模板创建一个名为 mylab 的新 Profile 并启动它。此后你可以修改 $DSH_HOME/profiles/mylab/ 下的 package.json（声明外部插件依赖与 Bundle 顺序）和 cordis.patch.yml（你的补丁层），而不污染官方模板。

**管理 Profile 的外部插件**：

```bash
dsh plugin --profile mylab add some-dsh-plugin
```
dsh plugin 会把参数原样转发给 pnpm，在该 Profile 的目录里执行——安装、移除、更新外部插件都走这条路。

**检视而不启动**：

```bash
dsh --profile mylab --dump-config           # 查看实际组合的插件树
dsh --profile mylab --dump-default-config   # 查看默认组合
```

## 3.5 命令行语法的两条规则

`dsh` 的参数解析有一个容易踩的坑，记住两条规则就不会错：

1. 启动器只解析自己的旗标（--profile、--patch、--dump-config 等），第一个不认识的参数开始，全部交给被启动的应用；
2. 同一个词，位置不同，含义不同：

```bash
dsh --profile web --port 8080    # --port 属于 Web 应用
dsh --profile web --help         # 显示 Web 应用的帮助
dsh --help                       # 显示启动器自身的帮助
dsh --profile headless "run the tests"   # 引号内是交给一次性会话的任务
```
无效命令、张冠李戴的参数、配置错误、启动失败，都会以非零码退出——写脚本时可以依赖这一点。

## 3.6 Harness 主目录（$DSH_HOME）

运行期的一切用户态数据都在 `$DSH_HOME` 下，值得熟悉的四个位置：

| 路径 | 内容 |
| --- | --- |
| settings.yaml | 全部设置，包括模型路由的进阶字段（第 4 章的主角） |
| .credentials.yaml | API 密钥本体（设置文件里只存引用） |
| cordis.patch.yml | 主目录级别的补丁层，对所有 Profile 生效 |
| `profiles/<name>/` | 各 Profile 的目录：自己的 package.json 与 cordis.patch.yml |


浏览器与服务同机时，可以在 Settings 页头部点 **Open configuration file** 直接打开 `settings.yaml`；适配器会在下一次请求时重读它，**改配置不需要重启服务**。

## 3.7 安全基线：必须照做的六条

Harness 能执行模型生成的代码与命令、加载第三方插件、访问网络与文件。官方 SAFETY.md 的措辞非常直白：它是开发者预览软件，**未经安全审计，不得视为安全或生产就绪**；沙箱、审批提示、权限控制能降低风险，但不保证隔离。请把下面六条当作使用前置条件：

1. 最小权限：以完成工作所需的最小权限与最小访问面运行；
2. 一次性环境：优先使用可丢弃的虚拟机、容器或专用环境，不要在存有重要数据的主力机上裸跑高风险任务；
3. 备份：Harness 可触及的文件，事前有备份；
4. 凭据自律：不接受风险，就不要把敏感凭据与数据暴露给它；
5. 先审后放：允许插件、配置、待执行命令生效前，先审查——界面的审批提示不是摆设；
6. 不依赖单一防线：不要把 Harness 自身的限制当作不可信负载的唯一安全控制。

第 5 章会教你用 `tools/pre-execute` 写一个权限门插件，把"先审后放"从人工动作变成可编程策略。

## 本章小结

- 日常使用走 npx @deepseek-ai/dsh web；改代码走源码构建 pnpm install && pnpm run build && pnpm dsh web；
- 五种 Profile 覆盖 Web、一次性、SDK、最小 SDK、自动化五类场景；自定义 Profile 用 --from-default-profile 创建，dsh plugin 管理其外部插件；
- 命令行两条规则：启动器只认自己的旗标；同一参数位置不同含义不同；
- $DSH_HOME 集中存放设置、凭据、补丁层与 Profile，配置改动热生效；

安全六条基线是使用 Harness 的前置条件，不是可选项。

## 练习题

1. 用 `--dump-config` 查看 web Profile 实际组合的插件树，找到模型适配器所在的那一行。
2. 列出五种运行 Profile（web/headless/sdk/sdk-minimal/acp）各自适用的一次性任务场景。
3. 复述六条安全基线，并说明"先审后放"在陌生仓库上的落地方式。

**参考答案**

1. `dsh --profile web --dump-config` 会打印本机实际启动的整棵插件树；模型适配器位于底座 `dsh-base` 这一组里（模型适配层 `ctx.llm` 那一行）。记住这条推论：输出里的**任何一行**都可以被你自己的 Patch 替换——定制之前先 dump，是 Harness 的标准动作。
2. **web**：交互式浏览器使用；**headless**：一次性批处理，跑完即退（第 7 章的体检就是它）；**sdk**：供宿主程序调用的 JSON-RPC 服务；**sdk-minimal**：只要最小能力集、自带显式插件树的嵌入式场景；**acp**：供编辑器/自动化工具驱动的 stdio 服务。
3. 六条基线：最小权限、一次性环境、备份、凭据自律、先审后放、不依赖单一防线。在陌生仓库上落地“先审后放”：先在**无凭据的一次性容器或虚拟机**里打开它，用 `tools/pre-execute` 钩子（第 5 章）做白名单——只放行读操作，写入与执行一律转人工审批；确认无害后再逐条放宽，而不是先放开再观察。
