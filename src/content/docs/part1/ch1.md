---
title: "第 1 章 快速上手：十分钟跑通 DeepSeek Harness"
description: "本章目标只有一个：让你在最短时间内把 DeepSeek Harness 跑起来，并完成第一个智能体任务。跑通之后，我们再在第 2 章回过头解释背后发生了什么。"
---

本章目标只有一个：让你在最短时间内把 DeepSeek Harness 跑起来，并完成第一个智能体任务。跑通之后，我们再在第 2 章回过头解释背后发生了什么。

## 1.1 DeepSeek Harness 是什么

DeepSeek Harness（命令行简称 `dsh`）是 DeepSeek 官方开源的智能体基座（Agent Harness），以 MIT 协议发布。一句话概括它的设计哲学：**Everything is a Plugin——万物皆插件**。

注意它与 DeepSeek 大模型的区别：

- DeepSeek V4 Pro/Flash、DeepSeek-R1 是模型，是"大脑"；
- DeepSeek Harness 是承载大脑的"身体"——模型适配、工具调用、会话管理、人机交互界面的完整骨架。

更确切地说，Harness 里连"骨架"本身也是插件：模型适配器、工具注册表、会话日志，乃至驱动智能体运转的 Agent 循环（Agent Loop）本身，都是可以从配置层替换的插件。整个系统建立在 Cordis 插件框架之上（其设计论文《A Programming Paradigm for Spatiotemporal Composability》已公开发表），没有任何一个"特权核心"需要你打补丁——扩展 Harness 的方式，永远是把你的插件挂载到官方插件旁边。

这个设计带来两个直接好处：

- 换模型不改代码。DeepSeek、Kimi、GLM、OpenAI、Anthropic……接入新模型只是注册或配置一个适配器；
- 加能力不动主干。加工具、加钩子、加界面，都是写插件，而不是 Fork 改源码。

**版本提示**：DeepSeek Harness 处于开发者预览阶段，官方明确声明"会存在破坏兼容性的变更"。学习它，既是学一个工具，也是学一套正在成形的智能体工程范式。

## 1.2 环境准备

开始之前，请确认两样东西：

**（1）Node.js 22.19+ 或 24 及以上。** 在终端执行：

```bash
node -v
```
输出 v22.19.0 或更高即可。如果没有安装，请到 nodejs.org 下载 LTS 版本。

**（2）一个 DeepSeek API Key。** 登录 DeepSeek 开放平台（platform.deepseek.com）创建。没有它也能启动界面，但无法发起真实的模型请求。

## 1.3 三分钟启动 Web UI

确保网络畅通，执行：

```bash
npx @deepseek-ai/dsh web
```
npx 会自动下载并运行 dsh 命令。首次运行稍慢，稍候你会看到终端打印出访问地址，默认是：

```text
http://127.0.0.1:3080
```
本地启动时浏览器会自动打开该地址；如果你不想要这个行为，加 --no-open：

```bash
npx @deepseek-ai/dsh web --no-open
```
在 SSH 远程会话中，dsh 不会尝试打开浏览器（转发地址由你的 SSH 客户端或编辑器管理），只打印 URL，你在本地浏览器手动访问即可。

想停止服务，回到终端按 `Ctrl+C`。

**端口冲突怎么办**：`dsh web` 是 `--profile web` 的别名，Web 应用自己的参数（如 `--port 8080`）跟在 profile 之后传入。第 3 章会详细解释这套命令语法。

## 1.4 配置第一个模型

界面打开后，第一件事是告诉 Harness 用哪个"大脑"。

1. 打开 Settings → Models（设置 → 模型）页面；
2. 找到 DeepSeek 卡片，它只暴露一个 API Key 输入框；
3. 粘贴你的 Key，保存。

保存后模型路由**立即生效，无需重启服务**。这里有一个值得注意的设计：Key 是"只写"的——保存之后，页面只会收到一个打码后的描述符，永远不会回显你的明文密钥。密钥本体存放在 Harness 主目录的 `$DSH_HOME/.credentials.yaml` 中，设置文件里只保留对它的引用。

此时模型选择器中已经出现 DeepSeek 的模型目录（如 `deepseek-v4-pro`、`deepseek-flash`），任选一个作为默认模型。第 4 章会展开讲 DeepSeek V4 Pro/Flash 的差异与 Kimi 等其他模型的接入。

## 1.5 选择工作区，下达第一个任务

刚启动的 Web UI 还没有"工作区"的概念——`dsh` 进程虽然以启动目录为默认文件位置，但你需要显式地把一个目录交给它：

1. 点击 Choose workspace（选择工作区）；
2. 添加你启动 dsh 时所在的项目目录（或任意一个你希望智能体操作的目录）；
3. 选中它。

选好工作区之前，会话输入框是不可用的——这是一道刻意的安全闸：没有工作区，智能体就没有可操作的边界。

现在，在输入框里发出你的第一个任务。可以用英文，也可以用中文：

```text
总结这个仓库的结构，找出主要的包，并说明它们各自的职责。
```
（官方指南给出的经典示例是："Summarize this repository and identify its main packages."）

接下来你会看到 Harness 的典型工作方式：

- 智能体开始规划（Plan），把任务拆成若干步骤；
- 它调用工具读取工作区文件、执行命令——每一次工具调用在界面上都有卡片式的呈现；
- 涉及需要审批的操作时（按当前权限策略），界面会停下来询问你，确认后才继续；
- 最终产出一段结构化的仓库摘要。

这个过程中发生了的一切——每一条消息、每一次工具调用、每一个中间状态——都被写进了会话日志。这是 Harness 的核心不变量：**"模型可见的，必须已落日志"（Model-visible means logged）**。第 2 章会解释这条不变量为什么是整个架构的基石。

## 1.6 核心概念速览

第一个任务跑完了。趁印象深刻，把后面会反复打交道的八个概念一次看清楚：

| 概念 | 一句话解释 |
| --- | --- |
| Plugin（插件） | Harness 的一切都是插件：一个导出 apply 函数的模块，向共享上下文注册能力 |
| ctx（上下文） | Cordis 提供的共享上下文，插件通过它注册服务、监听事件、声明效果 |
| Session（会话） | 一次持续的人机协作；底层是一份只追加的事件日志 |
| Turn（轮次） | 从零到多个 Step 构成；在首个输入被认领前开启，在"不再欠任何工作"时关闭 |
| Step（步骤） | 一次模型请求加上它所触发的工具调用 |
| Tool（工具） | 面向模型的能力单元（读文件、跑命令、搜索……），注册到 ctx.tools |
| Profile（运行配置） | 一组命名好的插件树组合：web、headless、sdk、sdk-minimal、acp |
| Seam（能力接缝） | 一个可替换能力的三角色契约：接口定义、提供者、消费者 |


现在你只需要对这张表有印象。第 2 章会逐一展开。

## 本章小结

本章你完成了：

- 理解 DeepSeek Harness 的定位——模型之上的开源智能体基座，万物皆插件；
- 用 npx @deepseek-ai/dsh web 启动了 Web UI；
- 在 Settings → Models 中配置了 DeepSeek API Key（只写存储，无需重启）；
- 选择工作区并跑通了第一个智能体任务；

建立了八个核心概念的初步印象。

## 练习题

1. 启动 `dsh web`，在 Settings → Models 中配置一个 DeepSeek API Key，观察保存后模型路由是否立即生效。
2. 选择一个工作区，下达任务"总结这个仓库的结构"，观察规划、工具调用、审批、产出四类卡片。
3. 不看正文，用一句话分别解释 Plugin、ctx、Session、Turn、Step、Tool、Profile、Seam 八个概念。
