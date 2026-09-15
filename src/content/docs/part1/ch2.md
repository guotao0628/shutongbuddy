---
title: "第 2 章 架构解析：万物皆插件意味着什么"
description: "第 1 章你已经把 Harness 跑了起来。这一章回答一个问题：你启动的那个进程，内部到底长什么样？理解这一章，后面的安装、接模型、写插件都会变成\"顺理成章\"的事。"
---

> **本章目标**：理解"万物皆插件"的微内核主张，掌握 Cordis、Profile/Bundle/Patch、能力接缝、事件系统、Turn/Step 与会话日志。

第 1 章你已经把 Harness 跑了起来。这一章回答一个问题：你启动的那个进程，内部到底长什么样？理解这一章，后面的安装、接模型、写插件都会变成"顺理成章"的事。

## 2.1 没有特权核心的微内核

大多数智能体框架的扩展方式是"留钩子"：框架作者预判你可能想改哪里，在那里埋一个回调点。预判错了，你就只能 Fork 源码。

Harness 走了一条更彻底的路：**微内核（Microkernel）**。整个系统中没有一个"特权核心"可以被打补丁——模型适配器、工具注册表、会话日志、权限策略，甚至驱动智能体运转的 Agent 循环本身，统统是插件。官方架构文档对每个产品功能做了一张"功能 → 机制"对照表，每一行都对应某个公开扩展点上的监听器，**没有一行需要修改循环本体**。这是可检验的微内核主张。三层之间的相对位置见 图 2-1。

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 306" role="img" aria-label="声明层、插件树与 Cordis 上下文的分层结构">
  <defs>
    <marker id="stbArrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--sl-color-gray-3)"/>
    </marker>
  </defs>

  <text x="20" y="26" font-size="12" fill="var(--sl-color-gray-3)">声明层</text>
  <rect x="108" y="8" width="132" height="38" rx="8" fill="var(--sl-color-accent-low)" stroke="var(--sl-color-accent)" stroke-width="1.2"/>
  <text x="174" y="32" font-size="13" text-anchor="middle" fill="var(--sl-color-white)">Profile</text>
  <rect x="256" y="8" width="132" height="38" rx="8" fill="var(--sl-color-accent-low)" stroke="var(--sl-color-accent)" stroke-width="1.2"/>
  <text x="322" y="32" font-size="13" text-anchor="middle" fill="var(--sl-color-white)">Bundle</text>
  <rect x="404" y="8" width="132" height="38" rx="8" fill="var(--sl-color-accent-low)" stroke="var(--sl-color-accent)" stroke-width="1.2"/>
  <text x="470" y="32" font-size="13" text-anchor="middle" fill="var(--sl-color-white)">Patch</text>

  <line x1="240" y1="27" x2="256" y2="27" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow2)"/>
  <line x1="388" y1="27" x2="404" y2="27" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow2)"/>

  <line x1="280" y1="52" x2="280" y2="92" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow2)"/>
  <text x="292" y="76" font-size="11" fill="var(--sl-color-gray-3)">叠加 / 覆写</text>

  <text x="20" y="118" font-size="12" fill="var(--sl-color-gray-3)">插件树</text>
  <rect x="108" y="96" width="100" height="44" rx="8" fill="var(--sl-color-gray-6)" stroke="var(--sl-color-gray-4)" stroke-width="1.2"/>
  <text x="158" y="123" font-size="12" text-anchor="middle" fill="var(--sl-color-white)">模型适配器</text>
  <rect x="218" y="96" width="100" height="44" rx="8" fill="var(--sl-color-gray-6)" stroke="var(--sl-color-gray-4)" stroke-width="1.2"/>
  <text x="268" y="123" font-size="12" text-anchor="middle" fill="var(--sl-color-white)">工具注册表</text>
  <rect x="328" y="96" width="100" height="44" rx="8" fill="var(--sl-color-gray-6)" stroke="var(--sl-color-gray-4)" stroke-width="1.2"/>
  <text x="378" y="123" font-size="12" text-anchor="middle" fill="var(--sl-color-white)">会话日志</text>
  <rect x="438" y="96" width="100" height="44" rx="8" fill="var(--sl-color-gray-6)" stroke="var(--sl-color-gray-4)" stroke-width="1.2"/>
  <text x="488" y="123" font-size="12" text-anchor="middle" fill="var(--sl-color-white)">Agent 循环</text>

  <line x1="280" y1="146" x2="280" y2="186" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow2)"/>
  <text x="292" y="170" font-size="11" fill="var(--sl-color-gray-3)">注册 / 监听</text>

  <text x="20" y="216" font-size="12" fill="var(--sl-color-gray-3)">Cordis</text>
  <rect x="108" y="190" width="430" height="48" rx="8" fill="var(--sl-color-accent-low)" stroke="var(--sl-color-accent)" stroke-width="1.4"/>
  <text x="323" y="220" font-size="13" text-anchor="middle" fill="var(--sl-color-white)">共享上下文 ctx —— 服务 · 事件 · 可逆效果</text>

  <text x="280" y="272" font-size="11.5" text-anchor="middle" fill="var(--sl-color-gray-3)">没有特权核心：所有层都由同一批公开扩展点组成</text>
  <text x="280" y="292" font-size="11.5" text-anchor="middle" fill="var(--sl-color-gray-3)">卸载插件 = 回退它的全部效果</text>
</svg>

对使用者的现实意义：

- 官方能做到的，你也能做到——因为官方用的扩展点和你用的是同一批；
- 升级框架不破坏你的扩展——只要扩展点契约稳定，你的插件就能跟着升级；
- 出问题时边界清晰——能力来自哪个插件，就从哪个插件查起。

## 2.2 Cordis：插件框架底座

Harness 建立在 Cordis 之上。Cordis 的设计来自论文《A Programming Paradigm for Spatiotemporal Composability》，它给插件提供了三样原语，全部挂在共享上下文 `ctx` 上：

| 原语 | 作用 | 例子 |
| --- | --- | --- |
| Service（服务） | 插件向全局发布的能力接口 | ctx.tools（工具注册表）、ctx.llm（模型适配层） |
| Typed Events（类型化事件） | 插件间通信与拦截的通道 | tools/pre-execute、agent/assistant-stream |
| Reversible Effects（可逆效果） | 注册即效果，卸载即回退 | 插件卸载时，它注册的工具、监听器、定时器自动清理 |


第三点尤其值得强调。在 Harness 里，"注册"不是往一个全局表里塞东西、再手动移除，而是声明一个**效果（Effect）**：插件存活时效果存在，插件卸载（或热重载）时效果自动回退。因此"插件热重载"在 Harness 里不是特殊功能，而是架构的自然结果——官方文档的原话是：每一次注册都是一个 `ctx.effect`，所以热替换"自然而然就能工作"。

## 2.3 Profile、Bundle 与 Patch：插件树如何组合

一个运行中的 `dsh`，是一棵**启动时按序组合出来的插件树**。理解这棵树的三层结构，就理解了 Harness 的部署与定制方式。

**Bundle（功能包）**：能力的分发单位。官方提供的核心 Bundle 有：

- dsh-base：所有运行形态共享的底座——模型适配器、工具、持久化、沙箱与审批策略、设置、凭据、遥测；
- dsh-web-app：在底座上叠加浏览器应用；
- dsh-headless：叠加一次性运行器（无服务器，跑完即退出）；
- dsh-sdk-app：叠加 SDK 的 JSON-RPC 服务；
- dsh-sdk-minimal：一个刻意的例外——自带完整显式的插件树，不叠加 dsh-base；
- dsh-acp-app：叠加仅供自动化使用的 ACP 服务。

**Profile（运行配置）**：存放在 Harness 主目录中的命名组合，声明它叠加哪些 Bundle、持有哪些外部插件、以及用户自己的补丁文件。官方模板有五个：`web`、`headless`、`sdk`、`sdk-minimal`、`acp`。你在第 1 章执行的 `dsh web`，就是 `--profile web` 的别名。

**Patch（补丁层）**：对插件树的声明式覆写。补丁按 id 定位插件树中的某一行，整体替换其配置，或插入新行。层的应用顺序是：

```text
Profile 中按序列出的每个 Bundle 的补丁
  → Profile 自己的 cordis.patch.yml
  → 主目录级别的 $DSH_HOME/cordis.patch.yml
  → 启动时通过 --patch 传入的覆盖层
```
两个实用推论：

1. 可检视：执行 dsh --profile web --dump-config，你能看到本机实际启动的整棵插件树；输出里的任何一行，都可以被你自己的 Patch 替换。定制之前先 dump，是 Harness 玩家的标准动作。
2. 可热更：自定义 Profile 默认开启实时补丁重载（live patch reload），web Profile 也是实时的；而 headless、sdk、sdk-minimal、acp 只在启动时应用一次——因为一次性任务或 stdio 服务在占用工作期间换依赖，会破坏其生命周期。

## 2.4 能力接缝：一次替换，全局生效

Harness 扩展设计里最重要的概念是**能力接缝（Capability Seam）**。一个接缝是可替换能力的完整契约，包含三个角色：

1. Service Definition——声明接口；
2. Service Provider——实现接口；
3. Consumer——消费接口，通常是面向模型的工具。

一个包可以身兼多个角色，但单独一个角色不构成接缝。**添加一项能力 = 设计全部三个角色**。

接缝的威力用一个例子就能说透：文件系统提供者（`ctx.fs`）和子进程提供者（`ctx.subprocess`）共享同一个"执行世界"。把这两个提供者指向一个远程沙箱，Bash 工具、终端工具、LSP 工具就**一起**迁到了远程——不需要逐个 Fork 修改。这就是"一次提供者替换，改变整个产品"。

子智能体提供者（`ctx.subagents`）是另一个典型接缝：同一个接口背后，可以是全新的进程内子智能体、Fork 出的分支智能体，甚至是委托给另一个产品（Codex、Claude Code）的一轮对话。此外还有一个实验性的 **Agent Teams** 接缝（`ctx.agentTeams`），在可持续的子智能体之上提供持久名册、任务看板和信箱的多智能体协调。

## 2.5 事件系统：扩展点就是事件

在 Harness 里，**事件就是扩展点**。大多数改动的第一个决策，是"该挂到哪个事件域"。一共三个域：

- 会话事件（Session events）：追加到日志并通过 session/event 广播的持久事实。凡是重载后必须存活的信息，走这个域；
- 智能体事件（agent/*）：携带实时 Agent 对象——收件箱、步骤、状态、请求、校验、续接。要观察或拦截"正在进行的工作"，走这个域；
- 能力事件（fs/*、tools/*、telemetry/*）：把策略和适配器挂到接缝上，且不会产生 import 循环。

事件里有一类特殊的 **Waterfall（瀑布）事件**：监听器必须调用 `next()` 才会把控制权交下去，因此可以在中途改写或拒绝——`agent/pre-step`、`agent/request`、`llm/stream` 和三个 `tools/*` 事件都属于此类。第 5 章的权限门插件，用的正是 `tools/pre-execute` 这个瀑布。

## 2.6 Turn 与 Step：一次任务的完整解剖

第 1 章你发出的"总结仓库"，在 Harness 内部经历了一段精确的旅程。先记住两个定义：

**Step（步骤）= 一次模型请求 + 它调用的工具。Turn（轮次）= 零到多个 Step：在第一个输入被认领前开启，在"不再欠任何工作"时关闭。**

完整事件序列如下（括号里是简要注释）：

```text
turn/start
  认领下一步输入 + 一条排队消息
  装配提示词各节 + 工具模式；投影运行时上下文
  -> agent/pre-step                    （可重写或拒绝输入）
     step/start
     agent/request -> prepareCall      （解析模型路由；取消不落任何内容）
     追加 user/message；冻结模型历史
     流式调用 -> llm/stream -> agent/assistant-stream start
       agent/assistant-stream chunk*   （实时 token 流）
       assistant/message -> agent/assistant-stream end
     tool/call* -> tools/pre-execute -> tools/execute
                -> tools/post-execute -> tool/result*
     step/end
     工具还欠一次请求，或有新输入 -> 认领 -> 下一个 step
  -> agent/turn-stopping
turn/end
```
留意三个设计细节：

- 不可变请求 + 实时取消：循环发出的请求是冻结的，但取消信号始终有效；agent/request 和 prepareCall() 在系统提示词和用户消息提交之前解析路由，任一阶段取消都不会落下半个请求；
- 输入走单一收件箱（Inbox）：有些消息立即唤醒循环，注入的上下文则在收件箱里等待，直到下一条消息到达；
- 重试不重复装配：失败重试不会重新执行装配和 agent/pre-step。

## 2.7 会话日志：唯一的事实来源

Harness 有一条贯穿全局的核心不变量：

**Model-visible means logged.（凡模型可见的，必须已落日志。）**

任何进入模型请求的内容，都必须能从事伴日志（Session Log）重建出来——而且有运行时断言守着这条线。会话日志是一份只追加（append-only）的 `SessionEvent` 流，模型上下文由 `deriveMessages()` 从日志投影而来。

这条不变量换来了一连串能力：

- 分叉与续跑：fork、resume 都是"从日志重放到某点，再继续"；
- 回放与审计：assistant/message 内嵌了产生它的精确流式内容，assistant/attempt 保留了失败、重试、取消的完整痕迹；
- 遥测与持久化：全部派生自这些持久落账，不需要第二套数据源。

推论也很直接：**想给模型喂新的输入类型，就得先定义新的会话事件**——扩展 `SessionEventMap`，再从日志渲染。日志的物理格式由 JSONL 提供者管理（`session.vN.jsonl[.zstd]`），版本迁移按 `vN → vN+1` 单步进行，已提交的历史文件永不改名、替换或删除。

## 本章小结

本章拆解了 Harness 的五块基石：

- 微内核：没有特权核心，每个产品功能都挂在公开扩展点上；
- Cordis 三原语：服务、类型化事件、可逆效果——热重载是架构的自然结果；
- Profile / Bundle / Patch：插件树按层组合，可 dump、可覆写、可热更；
- 能力接缝：定义/提供者/消费者三角色，一次替换全局生效；

**事件与日志**：三个事件域 + "模型可见即已落日志"的不变量，支撑分叉、续跑、回放与审计。

## 练习题

1. 用自己的话说清"微内核"与"留钩子"式扩展的根本区别，并举一个 Harness 里的例子。
2. 写出 Profile 补丁的层序（从低到高），并说明 `--patch` 为什么"总是最后说话"。
3. 解释"模型可见的，必须已落日志"（Model-visible means logged）为什么是整个架构的基石。

**参考答案**

1. “留钩子”是框架作者**预判**你可能想改哪里，在那里预留回调点——预判不到就只能 Fork 源码。微内核**没有特权核心**：模型适配器、工具注册表、会话日志、权限策略乃至 Agent 循环本身都是插件，官方与你用的是同一批公开扩展点。例子：把 `ctx.fs`（文件系统提供者）与 `ctx.subprocess`（子进程提供者）一起指向远程沙箱，Bash、终端、LSP 工具就**整体**迁到远程执行，不需要逐个改代码。
2. 由低到高：① Profile 中按序列出的每个 Bundle 的补丁 → ② Profile 自己的 `cordis.patch.yml` → ③ 主目录级的 `$DSH_HOME/cordis.patch.yml` → ④ 启动时通过 `--patch` 传入的覆盖层。`--patch` 之所以“总是最后说话”，是因为它排在层序最末：后应用的层覆写先前的层，而命令行参数是用户当下最明确的意图表达。
3. 因为**模型能依据的一切都必须先是可复核的事实**。上下文由会话日志投影而来（`deriveMessages()`），压缩、注入、委托全都只操作这份日志。一旦允许“模型看得见、但日志里没有”的内容，会话就无法完整重放、审计与压缩，能力接缝也就失去了共同基准——可替换性正是建立在“唯一事实来源”之上的。
