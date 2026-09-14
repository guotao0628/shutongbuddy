import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { loadJSON, type Mistake } from './state'

export const name = 'stb-tutor'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'explain_mistake',
    description: '讲解错题：读取错题本中的一道错题，返回题干、用户答案与正确答案，供模型讲解错因并给出同类题。',
    parameters: {
      workspace: { type: 'string', required: true, description: '工作区绝对路径' },
      questionId: { type: 'string', required: true, description: '错题 id' },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          questionId: { type: 'string' },
          topic: { type: 'string' },
          userAnswer: { type: 'string' },
          correctAnswer: { type: 'string' },
          reviewCount: { type: 'number' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `错题 ${value.questionId}（${value.topic}）：你的答案「${value.userAnswer}」，正确答案「${value.correctAnswer}」`,
      }],
    },
    async execute(args, _exec) {
      const mistakes = await loadJSON<Mistake[]>(args.workspace, 'mistakes.json', [])
      const m = mistakes.find(x => x.questionId === args.questionId)
      if (!m) return { error: `错题不存在：${args.questionId}` }
      return {
        questionId: m.questionId,
        topic: m.topic,
        userAnswer: m.userAnswer,
        correctAnswer: m.correctAnswer,
        reviewCount: m.reviewCount,
      }
    },
  }))
}
