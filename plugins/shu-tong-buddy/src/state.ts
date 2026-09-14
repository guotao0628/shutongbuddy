import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** 题目：备考题库的一条记录 */
export type Question = {
  id: string
  subject: string        // 学科，如 高数 / 大学英语 / 专业课
  topic: string          // 知识点
  question: string       // 题干
  answer: string         // 参考答案
  difficulty: 1 | 2 | 3  // 难度 1-3
  tags?: string[]
}

/** 错题：错题本的一条记录 */
export type Mistake = {
  questionId: string
  userAnswer: string
  correctAnswer: string
  topic: string
  recordedAt: string
  reviewCount: number
  mastered: boolean
}

/** 读工作区 JSON 文件，不存在时返回 fallback */
export async function loadJSON<T>(ws: string, file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(join(ws, file), 'utf8'))
  } catch {
    return fallback
  }
}

/** 写工作区 JSON 文件（覆盖） */
export async function saveJSON(ws: string, file: string, data: unknown): Promise<void> {
  await writeFile(join(ws, file), JSON.stringify(data, null, 2), 'utf8')
}
