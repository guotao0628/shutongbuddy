import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { loadJSON, type Mistake } from './state'

export const name = 'stb-review'
export const inject = ['tools']

// 艾宾浩斯遗忘曲线复习间隔（天）
const INTERVALS = [1, 2, 4, 7, 15]

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'review_plan',
    description: '按遗忘曲线为错题生成复习计划：读取错题本，按下次复习日期排程，返回每日复习任务。',
    parameters: {
      workspace: { type: 'string', required: true, description: '工作区绝对路径' },
      days: { type: 'number', description: '排程天数（默认 7）' },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          schedule: { type: 'array' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `待复习错题 ${value.total} 道\n` + (value.schedule || []).map((s: any) =>
          `  ${s.date}：${s.items.length} 道（${s.items.map((i: any) => i.questionId).join('、')}）`).join('\n'),
      }],
    },
    async execute(args, _exec) {
      const mistakes = await loadJSON<Mistake[]>(args.workspace, 'mistakes.json', [])
      const pending = mistakes.filter(m => !m.mastered)
      const today = new Date()
      const schedule: any[] = []
      for (const m of pending) {
        // reviewCount 越大，间隔越长（遗忘曲线）
        const interval = INTERVALS[Math.min(m.reviewCount, INTERVALS.length - 1)]
        const due = new Date(today.getTime() + interval * 86_400_000)
        const date = due.toISOString().slice(0, 10)
        let slot = schedule.find(s => s.date === date)
        if (!slot) { slot = { date, items: [] }; schedule.push(slot) }
        slot.items.push({ questionId: m.questionId, topic: m.topic })
      }
      schedule.sort((a, b) => a.date.localeCompare(b.date))
      return { total: pending.length, schedule }
    },
  }))
}
