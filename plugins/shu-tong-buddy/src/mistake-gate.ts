import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision } from '@deepseek-ai/dsh-tools'
import { loadJSON, saveJSON, type Mistake } from './state'

export const name = 'stb-mistake-gate'
export const inject = ['tools']

/**
 * 错题门禁：拦截判分落盘动作，把答错的题自动归档到错题本（mistakes.json）。
 *
 * 判分结果约定：写入 practice/<session>-result.json 的 JSON，形如
 *   { "results": [{ "questionId", "userAnswer", "correctAnswer", "correct" }] }
 */
export function apply(ctx: Context) {
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
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

    // 放行，但把归档结果作为模型可见上下文注入
    return next()
  })
}
