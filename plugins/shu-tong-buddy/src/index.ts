import type { Context } from '@deepseek-ai/cordis'
import { apply as questionBank } from './question-bank'
import { apply as practice } from './practice'
import { apply as mistakeGate } from './mistake-gate'

export const name = 'shu-tong-buddy'
export const inject = ['tools']

/** ShuTongBuddy 备考助手插件包：题库 + 刷题 + 错题门禁 */
export function apply(ctx: Context) {
  questionBank(ctx)
  practice(ctx)
  mistakeGate(ctx)
}

export default apply
