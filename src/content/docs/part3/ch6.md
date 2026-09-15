---
title: "第 6 章 智能体构建原理：Turn、装配、上下文与委托"
description: "第 2 章看了架构全景，第 5 章学会了自己动手。本章聚焦一个问题：一个\"智能体\"在 Harness 里究竟由哪些可替换的部件构成？ 读完你会得到一张\"能力地图\"——想实现任何智能体行为，先查地图找机制，而不是改循环。"
---

> **本章目标**：理解 Agent 的接口/驱动器分离、提示词装配、PTC 模式、上下文工程与子智能体委托，建立"能力地图"。

第 2 章看了架构全景，第 5 章学会了自己动手。本章聚焦一个问题：**一个"智能体"在 Harness 里究竟由哪些可替换的部件构成？** 读完你会得到一张"能力地图"——想实现任何智能体行为，先查地图找机制，而不是改循环。

## 6.1 Agent 的两半：接口与驱动器

智能体能力由两个包分治：

- core/agent：定义 Agent 接口、实时注册表和 agent/* 事件，服务键 ctx.agents；
- core/agent-loop：实现该接口的默认驱动器，服务键 ctx.agentLoop。

"接口"与"驱动"分离意味着：驱动器可以整体替换（比如换成你自己的调度策略），而所有消费 `ctx.agents` 的界面与协议桥——Web UI、ACP、SDK——完全无感。UI 集成的官方路径也由此而来：**驱动 **`ctx.agents`**，从 **`session/event`** 渲染**。

驱动器的输入只有一个收件箱（Inbox）：用户消息、注入的上下文、插件的跟进消息，都从这一个口子进入循环。输入被认领后，第 2.6 节那张 Turn/Step 事件序列开始运转，完整时序见 图 6-1。

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 262" role="img" aria-label="Turn 与 Step 的执行时序">
  <defs>
    <marker id="stbArrow6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--sl-color-gray-3)"/>
    </marker>
  </defs>

  <rect x="12" y="52" width="596" height="112" rx="10" fill="none" stroke="var(--sl-color-accent)" stroke-width="1.4" stroke-dasharray="6 4"/>
  <text x="28" y="44" font-size="12" fill="var(--sl-color-accent)">Turn（轮次）</text>

  <rect x="30" y="80" width="150" height="60" rx="8" fill="var(--sl-color-gray-6)" stroke="var(--sl-color-gray-4)" stroke-width="1.2"/>
  <text x="105" y="104" font-size="12" text-anchor="middle" fill="var(--sl-color-white)">Step 1</text>
  <text x="105" y="124" font-size="11" text-anchor="middle" fill="var(--sl-color-gray-3)">模型请求 → 工具调用</text>

  <rect x="204" y="80" width="150" height="60" rx="8" fill="var(--sl-color-gray-6)" stroke="var(--sl-color-gray-4)" stroke-width="1.2"/>
  <text x="279" y="104" font-size="12" text-anchor="middle" fill="var(--sl-color-white)">Step 2</text>
  <text x="279" y="124" font-size="11" text-anchor="middle" fill="var(--sl-color-gray-3)">模型请求 → 工具调用</text>

  <rect x="378" y="80" width="150" height="60" rx="8" fill="var(--sl-color-gray-6)" stroke="var(--sl-color-gray-4)" stroke-width="1.2"/>
  <text x="453" y="104" font-size="12" text-anchor="middle" fill="var(--sl-color-white)">Step n</text>
  <text x="453" y="124" font-size="11" text-anchor="middle" fill="var(--sl-color-gray-3)">模型请求 → 产出</text>

  <line x1="180" y1="110" x2="204" y2="110" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow6)"/>
  <line x1="354" y1="110" x2="378" y2="110" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow6)"/>

  <rect x="30" y="8" width="240" height="32" rx="8" fill="var(--sl-color-accent-low)" stroke="var(--sl-color-accent)" stroke-width="1.2"/>
  <text x="150" y="29" font-size="11.5" text-anchor="middle" fill="var(--sl-color-white)">Inbox：用户消息 / 注入 / 跟进</text>
  <line x1="150" y1="40" x2="150" y2="76" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow6)"/>

  <line x1="528" y1="110" x2="566" y2="110" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow6)"/>
  <text x="566" y="106" font-size="11" text-anchor="end" fill="var(--sl-color-gray-3)"> </text>

  <rect x="12" y="188" width="596" height="60" rx="10" fill="var(--sl-color-gray-6)" stroke="var(--sl-color-gray-4)" stroke-width="1.2"/>
  <text x="310" y="212" font-size="12" text-anchor="middle" fill="var(--sl-color-white)">不再欠任何工作 → Turn 关闭</text>
  <text x="310" y="234" font-size="11" text-anchor="middle" fill="var(--sl-color-gray-3)">全过程写入 session/event 事件日志（唯一事实来源）</text>
  <line x1="453" y1="140" x2="453" y2="188" stroke="var(--sl-color-gray-3)" stroke-width="1.2" marker-end="url(#stbArrow6)"/>
</svg>

## 6.2 系统提示词：装配而非拼接

系统提示词由 `core/system-prompt` 包负责组装（`ctx.systemPrompt`），单位是**节（Section）**：任何插件都可以注册一节提示词，带排序与作用域。两个现成例子：

- AGENTS.md（根目录）：一个读取该文件的节提供者——你在仓库根放一份 AGENTS.md，它的内容自动成为提示词的一节；
- 子目录 AGENTS.md 与文件变更提醒：由 watcher 或工具结果监听器通过 agent.inject() 注入，进入下一个被认领的请求。

装配本身也是一个可挂的扩展点（`system-prompt/assemble`），属于"专家级"的整体变换：它的返回值是权威装配结果，监听者要负责保留进行中的 PTC 模式与结构化输出协议的贡献。只想过滤工具时，官方建议用 `ctx.tools.restrict()`——它能让"呈现给模型的集合、查找、执行"三者始终对齐，这也是 ToolSearch（渐进式披露）的实现机制。

## 6.3 工具系统与 PTC 模式

第 5 章从生产者角度看了工具；本章从消费者角度补两块。

**作用域与对齐**：工具注册表是带作用域的。想让某个会话只看到一部分工具（ToolSearch 场景），替换该作用域的 `ctx.tools.restrict()` 注册即可；注册表保证呈现、查找、执行三者一致——不会出现"模型看见了却调不到"或"能调用却看不见"的错位。

**PTC 模式（程序化工具调用）**：在 PTC 模式下，每个可见的注册工具自动成为 `await tools.<name>(args)`，无需额外集成。参数与返回值的精确类型从同一套模式推导，调用重新进入正常执行管线——策略、审批、审计一个不少。成功时拿到的是**规范 JSON 值**（不是渲染文本），失败时拒绝的是真实 `ToolCallError`。这就是为什么第 5 章强调"把 `output.schema` 当程序 API 来设计"。

## 6.4 上下文工程：投影、注入与压缩

长任务最大的敌人是上下文窗口。Harness 给出三件武器：

**（1）投影（Projection）**：模型上下文从会话日志派生（`deriveMessages()`），运行时状态由 `dsh-session-projection` 接缝（`ctx.sessionProjections`）把已提交事件折叠成类型化状态——Agent 循环就为它的读者注册了共享的 `turnBoundary` 状态。宿主消费者要么在激活时拿到该服务，要么在缺失时显式失败，不存在"读到半个状态"。

**（2）注入（Injection）**：`agent.inject()` 追加持久上下文，进入下一个模型请求。它是"给进行中的智能体递纸条"的标准方式：定时器触发、watcher 发现文件变化、后台任务完成，都走这条路。注意它不是唤醒器——空闲的智能体保持空闲，直到下一条真实输入到来。

**（3）压缩（Compaction）**：上下文压缩是一个能力接缝（`ctx.compaction`），默认实现是 `dsh-compaction-basic`。三条触发路径分工明确：

- 自动压力压缩：在串行的 agent/pre-step 上运行——每步之前评估压力，防患于未然；
- 溢出恢复：模型请求因超长被拒时，在 agent/request-error 上运行规范恢复；
- 手动压缩：用户手动调用的是同一个 compact 服务。

接缝意味着压缩策略可替换：换成"按主题分段压缩""保留代码块优先压缩叙述"都只需要换一个 Provider。

## 6.5 子智能体与多智能体协作

复杂任务的解法是分解。**子智能体委托**是一个提供者注册表（`ctx.subagents`），官方自带六种提供者：

| 提供者 | 语义 |
| --- | --- |
| dsh-subagent-spawn-in-process | 进程内新建子智能体 |
| dsh-subagent-fork-in-process | 进程内 Fork 分支（带上下文） |
| dsh-subagent-acp | 委托给 ACP 对端 |
| dsh-subagent-codex | 委托给 Codex 的一轮 |
| dsh-subagent-claude-code | 委托给 Claude Code 的一轮 |
| dsh-subagent-dsh-sdk | 委托给另一个 dsh SDK 实例 |


`dsh-tool-subagent` 把配置好的一个提供者暴露给模型——于是"把子任务委派出去"成为模型自己可调用的工具。同一个接口后面，可以是本地的分身，也可以是另一个产品里的同事：这正是能力接缝"一次替换、全局生效"的又一例证。回到 ShuTongBuddy：答疑阶段就是每道错题 spawn 一个子智能体并行讲解，同一个 `ctx.subagents` 接口既可以是进程内分身，也可以是另一个 dsh 实例里的同事。

再往上是实验性的 **Agent Teams**（`ctx.agentTeams`）：在可续接的子智能体之上，提供持久名册（roster）、任务看板（task board）与信箱（mailbox）的多智能体协调。想给单个会话配不同能力集，则通过组合 Agent 预设（preset）实现——其中的服务行需要 `isolate` 域。

## 6.6 计划、目标与循环：给智能体装上"工作习惯"

一批实用的"工作习惯"功能，同样全部落在扩展点上：

- 计划模式（Plan Mode）：dsh-plan-mode 包——落账的 plan/mode 状态、plan:policy 指导节、/plan [message] 进入、/plan off 直接退出，以及经用户评审的 exit_plan_mode。执行约束保持在独立的沙箱与审批轴上，计划模式本身只管"先规划、后动手"的行为约定；
- 目标（/goal）：ctx.goals 持有持久状态，dsh-goal-round-driver 通过公开 Agent 接口调度同会话的推进轮次，命令与工具两个入口分别面向人和模型；
- 循环（/loop）：在 turn/end 会话事件上 followup() 下一轮，或强制续接——十几行逻辑就是一个定时迭代器；
- 定时任务：插件注册模型可调度的工具，时间到则 followup()（空闲时）或 inject() 通知（忙碌时）；
- 技能（Skills）与记忆（Memory）：均为"节提供者 + 工具"的组合——技能在被调用时把内容 inject() 进去，记忆则同时维护提示词节与读写工具。

把这张表和第 2 章的"功能 → 机制"对照表连起来看，你会发现一个惊人的事实：**这些都不是框架内置的特例，而是插件**。这正是微内核主张最有说服力的证据，也是你设计自己的智能体行为时的范本库。

## 本章小结

- Agent = 接口（ctx.agents）+ 可替换驱动器（ctx.agentLoop）；输入走单一收件箱；
- 提示词是"节"的装配：AGENTS.md、技能、记忆都是节提供者；
- 工具的作用域限制用 ctx.tools.restrict()；PTC 模式让工具成为可编程 API；
- 上下文三件套：日志投影、inject() 注入、可替换的压缩接缝；
- 子智能体是提供者注册表，六种官方实现覆盖本地分身到跨产品委托；Agent Teams 提供实验性多智能体协调；
- 计划、目标、循环、定时、技能、记忆——全是插件，全部可仿写。

## 练习题

1. 说明 PTC 模式下工具调用与普通工具调用的区别，以及它为什么要求把 output.schema 当程序 API 设计。
2. 列举上下文压缩的三条触发路径（自动压力、溢出恢复、手动），各举一个场景。
3. 六种子智能体提供者（spawn-in-process 等）分别适合什么场景？备考答疑该用哪个？
