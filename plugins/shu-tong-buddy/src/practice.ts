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
