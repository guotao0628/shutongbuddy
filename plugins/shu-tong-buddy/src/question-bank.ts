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
            id: args.id!,
            subject: args.subject!,
            topic: args.topic ?? '',
            question: args.question!,
            answer: args.answer!,
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
