---
title: "第 7 章 实例一：备考资料库体检智能体"
description: "第一个实例不急着写插件——先用 Harness 开箱即用的能力，完成一个真实任务：对大学生的备考资料库做一次\"体检\"，产出一份结构化报告。你会发现，仅靠内置工具与一个好模型，事情已经能做成八成；剩下两成，再用一个自定义工……"
---

> **本章目标**：用内置能力完成备考资料库体检，掌握 headless 批量化运行与自定义统计工具的编写。

第一个实例不急着写插件——先用 Harness 开箱即用的能力，完成一个真实任务：对大学生的备考资料库做一次"体检"，产出一份结构化报告。你会发现，仅靠内置工具与一个好模型，事情已经能做成八成；剩下两成，再用一个自定义工具补上。

## 7.1 任务定义

输入：一个备考资料库（本地目录，含教材 PDF、课堂笔记、历年试卷、错题集等，建议先用一门课的小型资料库练手）。

产出：一份 `STUDY_REPORT.md`，包含：

1. 资料库结构总览与主要科目/章节识别；
2. 资料盘点与潜在缺口（缺失章节、过期资料、薄弱知识点）；
3. 资料规模统计（文件数、类型分布、主要科目占比）。

模型选择：`deepseek-v4-pro`，推理挡位 `high`——体检是分析型任务，值得用 Pro 的深度。

## 7.2 准备工作

```bash
cd /path/to/course-materials   # 在资料库目录启动，便于圈定工作区
npx @deepseek-ai/dsh web
```

界面中完成三件事：确认 DeepSeek 路由可用（第 4 章）；Choose workspace 选中该资料库；模型选择器切到 deepseek-v4-pro，Effort 选 high。

**安全提示**：体检涉及读取资料库里的文件，Harness 会按权限策略处理。对一个陌生资料库，建议先只允许"读取类"操作、拒绝"执行/改写类"操作——这正是 3.7 节"先审后放"的实战。

## 7.3 第一轮：结构总览

发送：

```text
总结这个资料库的结构，找出主要的科目和章节，说明它们各自的覆盖范围，并指出入口文件（如课程大纲、目录）。
```

观察过程（对照第 2.6 节的事件序列）：

- 智能体规划出"先看目录树 → 读大纲/目录文件 → 抽样读笔记与试卷"的步骤；
- 工具调用卡片逐条出现：列目录、读文件、搜索关键词；
- 最终给出分层的结构说明。

如果它漏掉了某个重要科目目录，**直接在同一会话里追问纠偏**——会话日志忠实记录了它已经看过什么，追问不会让它重复劳动：

```text
「概率论」目录下还有一个往年真题子目录你没有分析，补上。
```

## 7.4 第二轮：缺口盘点与报告落盘

继续在同一会话发送：

```text
基于你已掌握的情况，盘点以下问题：1) 哪些章节缺教材或缺笔记；2) 哪些知识点没有对应练习题；3) 哪些资料明显过期或与大纲不符。把三轮分析汇总成一份中文报告，写入 STUDY_REPORT.md，结构：总览 / 科目与章节 / 资料缺口与风险 / 复习建议。
```

两个看点：

- 写文件是 diff 卡片：write 工具的调用在界面上呈现为逐文件的差异卡片，落盘前你能清楚看到它打算写什么；
- 报告质量取决于你已给的上下文：因为它"记得"前两轮看到的一切，报告会引用具体文件与章节，而不是空泛的套话。

如果任务中断（网络抖动、主动取消），会话仍在日志里——重开界面回到该会话即可继续，这就是"模型可见即落账"的日常红利。

## 7.5 批量化：headless 一键体检

交互式跑顺之后，把它变成可重复的命令——`headless` Profile 就是干这个的：开一个全新持久会话，打印最终答案，然后退出。

```bash
dsh --profile headless "阅读当前目录的备考资料库，生成中文体检报告写入 STUDY_REPORT.md，包含：结构总览、科目与章节、资料缺口与风险、复习建议。"
```

脚本化后，体检可以挂进学期初的资料整理流程或定时任务。注意 headless 只在启动时应用一次补丁层（第 2.3 节），且没有人在审批提示前把关——只在可信资料库上这样跑，或先配合第 5 章的权限门插件收紧策略。

## 7.6 补上短板：自定义资料统计工具

到这里你会发现一个短板：让模型一行行"数文件、算大小"既慢又不准。正确的做法是把确定性工作交给确定性工具——写一个 `material_stats` 工具插件，把第 5 章的知识用一遍。

在源码检出下创建 `scratch-plugin/src/material-stats.ts`：

```typescript
import { readdir, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

const SKIP = new Set(['node_modules', '.git', '.obsidian', '.trash'])
const TYPE: Record<string, string> = {
  '.pdf': 'PDF 教材/试卷', '.md': 'Markdown 笔记', '.docx': 'Word 文档',
  '.txt': '纯文本', '.pptx': '课件', '.png': '图片', '.jpg': '图片',
}

async function walk(dir: string, acc: Record<string, { files: number; bytes: number }>) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { await walk(full, acc); continue }
    const type = TYPE[extname(entry.name).toLowerCase()]
    if (!type) continue
    const s = await stat(full)
    const slot = (acc[type] ??= { files: 0, bytes: 0 })
    slot.files += 1
    slot.bytes += s.size
  }
  return acc
}

export const name = 'material-stats'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'material_stats',
    description: '统计备考资料库中各类型文件的数量与总大小。',
    parameters: {
      path: { type: 'string', required: true, description: '资料库目录绝对路径' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: { files: { type: 'number' }, bytes: { type: 'number' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: Object.entries(value)
          .map(([t, s]) => `${t}: ${s.files} 个文件, ${(s.bytes / 1024 / 1024).toFixed(1)} MB`)
          .join('\n'),
      }],
    },
    async execute(args, exec) {
      return walk(args.path, {})
    },
  }))
}
```

【待核：output.schema 的 additionalProperties 写法以你所用版本的 ValueSchemaSpec 为准；若不被接受，可改为返回数组 [{ type, files, bytes }]。】

挂上去重跑体检：

```text
# scratch-plugin/cordis.yml
- insert:
    - id: material-stats
      name: '/absolute/path/to/deepseek-harness/scratch-plugin/src/material-stats.ts'
```

然后在会话里说：

```text
调用 material_stats 工具统计当前资料库，把结果并入 STUDY_REPORT.md 的「资料规模」一节。
```

模型会在下一轮看到新工具的模式并主动调用它——注册即装配，不需要你改任何提示词。

## 本章小结

| 用到的能力 | 出处 |
| --- | --- |
| 工作区与权限审批 | 第 1、3 章 |
| DeepSeek V4 Pro + 推理挡位 | 第 4 章 |
| 多轮会话与上下文记忆 | 第 2.7、6.4 节 |
| headless 一次性运行 | 第 3.4 节 |
| defineTool 自定义工具 + Patch 挂载 | 第 5 章 |
| 注册即装配（模型自动发现新工具） | 第 6.3 节 |

一个"备考资料库体检智能体"就这样从纯交互式使用，渐进增强为"交互 + 自定义工具 + 可脚本化"的完整方案——全程没有修改 Harness 一行源码。

## 练习题

1. 对自己的备考资料库跑一次 headless 体检，生成 STUDY_REPORT.md。
2. 给 material_stats 增加"按一级子目录（科目）分组"的输出。
3. 把体检结果与错题本（mistakes.json）结合，产出一份"薄弱知识点"复习建议。

**参考答案**

1. 用 headless Profile 跑一遍：`dsh --profile headless "<体检任务>"`，让它调用 `material_stats` 并把结论落盘为 `STUDY_REPORT.md`。跑完务必**人工核对**报告里的数字与实际文件数是否一致——工具返回的是事实，叙述可能失真。
2. 关键改动是把统计的 key 从“扩展名”换成“资料库根目录下的一级子目录名”：对每个文件取相对路径的第一段再聚合，输出形如

```json
{ "数学": { "files": 128, "bytes": 10485760 }, "英语": { "files": 64, "bytes": 5242880 } }
```

这样报告才能直接回答“哪一科资料多、哪一科资料少”。
3. 交叉分析：读 `mistakes.json` 统计每个 topic 的错题数，与体检报告里各科目的题量/资料量对照——**错题多而资料少**的科目就是薄弱环节。建议按“错题数 ÷ 资料量”排序，先补资料缺口，再排复习顺序，最后把结论写回 `review-plan.json` 让复习计划直接消费。
