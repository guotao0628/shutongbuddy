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
