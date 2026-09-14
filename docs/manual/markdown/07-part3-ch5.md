# 第 5 章 插件开发实战：ShuTongBuddy 备考助手插件

本章以一个贯穿始终的真实项目学习插件开发：**为大学生备考助手 ShuTongBuddy 开发一组 DeepSeek Harness 插件**。这个插件包将在第 8 章被 ShuTongBuddy Studio（Web 备考助手）直接调用。学完本章，你不仅掌握了插件开发的全部基本功，还得到了一个可以立刻投入使用的备考智能体后端。

## 5.1 从业务到插件：备考助手需要什么

先把备考的业务流程摆出来——这是一名大学生准备一门考试时的经典闭环：

```
知识点梳理 → 题库刷题 → AI 答疑 → 错题分析 → 复习计划 → 学习报告
```

逐步映射到 Harness 的机制（第 2、6 章的知识在这里全部派上用场）：

| 业务阶段 | 智能体行为 | Harness 机制 |
| --- | --- | --- |
| 知识点梳理 | 读教材与笔记，产出知识图谱与章节清单 | 会话 + fs 工具 |
| 题库刷题 | 按知识点抽题、判分、记录成绩 | 自定义工具 question_bank / practice |
| AI 答疑 | 讲解错题、举一反三、扩展同类题 | 子智能体 + 模型 |
| 错题分析 | 归类错因、定位薄弱知识点 | 钩子插件（错题门禁） |
| 复习计划 | 按遗忘曲线排程，生成每日任务 | review 工具（确定性排程） |
| 学习报告 | 汇总进度、导出周报 | 报告汇总工具 |

可以看到：模型负责"讲解与出题"这类语言工作，插件负责"确定性保障"——题目不走样、判分不遗漏、错题必归档、计划可复现。这就是本章要写的三类插件：**工具插件 ×2、钩子插件 ×1，外加一套子智能体协同编排**。

## 5.2 热身：插件的最小形态

在 Harness 里，插件是一个导出 `apply` 函数的 TypeScript 模块。框架加载时调用 `apply` 并传入共享上下文 `ctx`，能力全部通过 `ctx` 注册：

```
import type { Context } from '@deepseek-ai/cordis'

export const name = 'my-plugin'

export function apply(ctx: Context) {
  // 在这里注册能力
}
```

name 是插件标识；要消费别的服务（如工具表 tools、模型层 llm），用 inject 声明依赖，框架会等齐依赖再加载它：

```
export const name = 'my-tool-plugin'
export const inject = ['tools']

export function apply(ctx: Context) {
  // 此处 ctx.tools 已就绪
  ctx.tools.register(/* ... */)
}
```

开发闭环三步走（假定你从源码方式运行，见 3.3 节）：

```
mkdir -p scratch-plugin/src          # 1. 建插件目录
```

写 scratch-plugin/cordis.yml 覆盖层（路径用绝对路径，先在仓库根 pwd）：

```
- insert:
    - id: hello
      name: '/absolute/path/to/deepseek-harness/scratch-plugin/src/my-plugin.ts'
```

终端打印出你插件里的日志，说明它已挂进官方插件树。回顾第 2.3 节的层序：--patch 覆盖层最后应用，因此它总是最后说话。

**可逆效果**：通过 `ctx` 注册的一切（监听器、工具、定时器）随插件卸载自动清理；需要显式收尾的资源用 `ctx.effect()` 提供清理器：

```
export function apply(ctx: Context) {
  ctx.effect(() => {
    const timer = setInterval(() => console.log('heartbeat'), 5000)
    return () => clearInterval(timer)   // 插件卸载时执行
  })
}
```

web Profile 默认实时重载：改完插件代码，旧效果自动回退、新效果自动挂上，调试反馈环极短。除函数形态外，插件还有对象形态与类形态（插件要作为服务提供给他人时，用继承 Service 的类形态）。

## 5.3 平台骨架：shu-tong-buddy 插件包

进入正题。规划插件包结构（一个包内多个模块，按职责拆分）：

```
shu-tong-buddy/
  src/
    question-bank.ts   # 题库工具
    practice.ts        # 刷题组卷工具
    mistake-gate.ts    # 错题门禁钩子
    state.ts           # 类型与 JSON 持久化
    index.ts           # 插件包汇总入口
```

备考数据的存储选型：直接用一个 JSON 文件放在工作区内（如 question-bank.json、mistakes.json）。理由：① 刷题中途换会话/换智能体时题库与错题不丢——它们是工作区事实，不属于任何单一对话；② 人类可以随时手工编辑；③ 第 8 章的 ShuTongBuddy Studio 前端可以直接读写同一个文件做题库与错题本面板。这正体现了 Harness 的设计哲学：持久事实落盘，模型上下文从事实投影。

## 5.4 工具插件一：题库 question_bank

用 `defineTool` 实现一个多动作题库工具（`add` / `search` / `list` / `stats`）：

```
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { loadJSON, saveJSON, type Question } from './state'

export const name = 'stb-question-bank'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'question_bank',
    description: '备考题库：登记、检索、列出、统计题目。刷题前必须先检索目标知识点。',
    parameters: {
      action: { type: 'string', required: true, description: 'add | search | list | stats' },
      workspace: { type: 'string', required: true, description: '工作区绝对路径' },
      id: { type: 'string', description: '题目 id（add 时必填）' },
      subject: { type: 'string', description: '学科（add 时必填）' },
      topic: { type: 'string', description: '知识点（add / search 时使用）' },
      question: { type: 'string', description: '题干（add 时必填）' },
      answer: { type: 'string', description: '参考答案（add 时必填）' },
      difficulty: { type: 'number', description: '难度 1-3（add 时使用）' },
    },
    output: {
      schema: { type: 'object' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute(args, _exec) {
      const bank = await loadJSON<Question[]>(args.workspace, 'question-bank.json', [])
      switch (args.action) {
        case 'add': {
          const q: Question = {
            id: args.id!, subject: args.subject!, topic: args.topic ?? '',
            question: args.question!, answer: args.answer!,
            difficulty: (args.difficulty as 1 | 2 | 3) ?? 2,
          }
          const i = bank.findIndex(e => e.id === q.id)
          if (i >= 0) bank[i] = q; else bank.push(q)
          await saveJSON(args.workspace, 'question-bank.json', bank)
          return { ok: true, total: bank.length, upserted: q }
        }
        case 'search': {
          const kw = (args.topic ?? '').toLowerCase()
          return {
            hits: bank.filter(q =>
              !kw || q.topic.toLowerCase().includes(kw) || q.question.toLowerCase().includes(kw)),
          }
        }
        case 'list':
          return { total: bank.length, questions: bank }
        case 'stats': {
          const bySubject: Record<string, number> = {}
          for (const q of bank) bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1
          return { total: bank.length, bySubject }
        }
        default:
          throw new Error(`unknown action: ${args.action}`)
      }
    },
  }))
}
```

对照第 6 章工具契约检查一遍：parameters 里 action/workspace 必填；execute 返回规范 JSON（命中列表、总数），渲染文本交给 output.render；模型看到的 description 明确写了"刷题前必须先检索目标知识点"——工具描述本身就是提示词工程，注册即装配，它会自动进入系统提示词。

## 5.5 工具插件二：practice 抽题组卷

`practice` 的设计要点：**出题与判分由模型完成，工具负责确定性部分**——按条件抽题、返回题单、约定落盘路径：

```
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { loadJSON, type Question } from './state'

export const name = 'stb-practice'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'practice',
    description: '抽题组卷：按学科 / 知识点 / 难度抽取题目组成一次练习，返回题单供逐题作答与判分。',
    parameters: {
      workspace: { type: 'string', required: true, description: '工作区绝对路径' },
      subject: { type: 'string', description: '学科（可选）' },
      topic: { type: 'string', description: '知识点（可选）' },
      difficulty: { type: 'number', description: '难度 1-3（可选）' },
      count: { type: 'number', required: true, description: '抽题数量' },
      session: { type: 'string', required: true, description: '本次练习标识' },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          session: { type: 'string' },
          picked: { type: 'array' },
          out_path: { type: 'string' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `已抽取 ${value.picked.length} 题，题单写入 ${value.out_path}`,
      }],
    },
    async execute(args, _exec) {
      const bank = await loadJSON<Question[]>(args.workspace, 'question-bank.json', [])
      let pool = bank
      if (args.subject) pool = pool.filter(q => q.subject === args.subject)
      if (args.topic) pool = pool.filter(q => q.topic.includes(args.topic))
      if (args.difficulty) pool = pool.filter(q => q.difficulty === args.difficulty)
      const picked = pool.slice(0, args.count)
      return {
        session: args.session,
        picked,
        out_path: `practice/${args.session}.json`,
      }
    },
  }))
}
```

配套地，模型在下一轮逐题作答，并把判分结果用内置 write 工具写入 `practice/<session>-result.json`——判分结果的约定结构（`results` 数组，含 `correct` 布尔）成为第 5.6 节错题门禁拦截的依据。工具的返回值（out_path、picked）进入会话日志，成为后续错题分析与复习计划的事实依据。

## 5.6 钩子插件：错题门禁 mistake_gate

错题管理的硬指标——**答错的题必须进错题本**——不该靠模型自觉，而该写成门禁。用 `tools/pre-execute` 瀑布拦截判分落盘的动作，发现答错的题就自动归档：

```
import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision } from '@deepseek-ai/dsh-tools'
import { loadJSON, saveJSON, type Mistake } from './state'

export const name = 'stb-mistake-gate'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    // 只拦截判分结果落盘
    if (exec.name !== 'write') return next()
    const path = String(exec.arguments.path ?? '')
    if (!path.includes('-result.json')) return next()

    const content = String(exec.arguments.content ?? '')
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch {
      return next()   // 非法 JSON 交给下游正常处理
    }

    const results: any[] = parsed?.results ?? []
    const wrong = results.filter(r => r && r.correct === false)
    if (wrong.length === 0) return next()

    // 确定性归档：把错题追加进错题本，作为工作区事实
    const ws = String(exec.arguments.workspace ?? process.cwd())
    const mistakes = await loadJSON<Mistake[]>(ws, 'mistakes.json', [])
    for (const r of wrong) {
      mistakes.push({
        questionId: String(r.questionId),
        userAnswer: String(r.userAnswer ?? ''),
        correctAnswer: String(r.correctAnswer ?? ''),
        topic: String(r.topic ?? ''),
        recordedAt: new Date().toISOString(),
        reviewCount: 0,
        mastered: false,
      })
    }
    await saveJSON(ws, 'mistakes.json', mistakes)

    // 放行，归档结果已落盘，成为后续阶段的事实
    return next()
  })
}
```

这是第 5.6 节权限门的同款机制用在错题场景：门禁不打断正常流程，而是把"错题必归档"这条确定性规则焊死在落盘路径上——无论模型记不记得整理错题，错题本都一定更新。审查阶段的其余项目（错因归类、薄弱知识点定位）建议放在 tools/result 观察点上做记录，或者用第 5.7 节的选择规则：tools/post-execute 附加"本次 N 道错题已入库"的模型可见上下文。

## 5.7 多智能体协同：备考任务的分工

备考六阶段 → 智能体分工与模型配置（第 8 章的 ShuTongBuddy Studio 就按这张表调度）：

| 阶段 | 智能体 | 建议模型 | 协同机制 |
| --- | --- | --- | --- |
| 知识点梳理 | librarian | DeepSeek V4 Pro（high） | 主会话，产出 outline.json（知识图谱+章节清单） |
| 题库刷题 | drill | DeepSeek Flash | 主会话调用 question_bank / practice |
| AI 答疑 | tutor | DeepSeek V4 Pro | ctx.subagents 进程内分身，错题逐一讲解 |
| 错题分析 | analyst | DeepSeek V4 Pro（max） | 主会话 + stb-mistake-gate 门禁 |
| 复习计划 | planner | Flash | review 工具确定性排程 |
| 学习报告 | reporter | Flash | 汇总进度、导出周报 |

并发讲解多道错题时，每个子智能体持有自己的会话日志，错题约束却来自同一份 `mistakes.json`——**状态共享走文件，上下文隔离走会话**，这是多智能体协同不打架的关键设计。子智能体提供者的选择参考第 6.5 节：本地分身用 `spawn-in-process`，需要绑定不同模型（如答疑给 V4 Pro、刷题给 Flash）的环节用 `acp`/`dsh-sdk` 委托给另一个配置好的 dsh 实例。

## 5.8 加载、调试与持久安装

**开发期**：`pnpm dsh web --patch ./shu-tong-buddy/cordis.yml` 加实时重载；`--dump-config` 确认插件挂树；临时写一个挂 `session/event` 的插件观察全量事件流，是排查"工具没被调用"类问题的杀手锏。

**持久安装**（给第 8 章的 ShuTongBuddy Studio 用）：

```
export DSH_HOME=/absolute/path/to/app-dsh-home
dsh plugin --profile sdk add file:/absolute/path/to/shu-tong-buddy
```

dsh plugin 转发 pnpm 完成安装，并把导出 dsh.bundle 层的包登记进该 Profile——之后 SDK 启动 sdk Profile 时，备考助手插件自动就位。

**生态**：仓库打上 `dsh-plugin` 主题标签即可被社区检索。官方的 `dsh-tool-*`、`dsh-plan-mode`、`dsh-compaction-basic` 都是可照抄的生产级范例。

## 本章小结

- 插件 = 导出 apply(ctx) 的模块；inject 声明依赖；ctx.effect() 让注册可逆；
- 备考助手的插件化拆解：讲解与出题归模型，确定性保障（题库、判分、错题归档）归插件；
- question_bank / practice 展示了 defineTool 契约的实战用法：参数校验、规范 JSON、"描述即提示词"、按条件抽题以节约上下文；
- stb-mistake-gate 展示了钩子插件的实战用法：tools/pre-execute 拦截判分落盘，把"错题必归档"焊死在确定性路径上；
- 多智能体协同的核心设计：状态共享走文件，上下文隔离走会话；

持久安装走 `dsh plugin`，为第 8 章的 ShuTongBuddy Studio 铺平了道路。
