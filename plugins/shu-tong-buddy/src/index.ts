import type { Context } from '@deepseek-ai/cordis'
import { apply as questionBank } from './question-bank'
import { apply as practice } from './practice'
import { apply as mistakeGate } from './mistake-gate'
import { apply as review } from './review'
import { apply as tutor } from './tutor'

export const name = 'shu-tong-buddy'
export const inject = ['tools']

/** ShuTongBuddy 备考助手插件包：题库 + 刷题 + 错题门禁 + 复习计划 + 答疑 */
export function apply(ctx: Context) {
  questionBank(ctx)
  practice(ctx)
  mistakeGate(ctx)
  review(ctx)
  tutor(ctx)
}

export default apply
