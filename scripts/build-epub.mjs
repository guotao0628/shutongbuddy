/**
 * 从 Starlight 内容集合生成一份用于 pandoc 的合并 Markdown（EPUB 源）。
 * 输出：work/epub/book.md
 *
 * 用法：node scripts/build-epub.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'src', 'content', 'docs');
const OUT_DIR = path.join(ROOT, 'work', 'epub');
const OUT_FILE = path.join(OUT_DIR, 'book.md');

/** 阅读顺序（与 astro.config.mjs 侧边栏一致；首页封面单独处理） */
const ORDER = [
  'brief.md',
  'author.md',
  'preface.md',
  'part1/ch1.md',
  'part1/ch2.md',
  'part2/ch3.md',
  'part2/ch4.md',
  'part3/ch5.md',
  'part3/ch6.md',
  'part4/ch7.md',
  'part4/ch8.md',
  'epilogue.md',
  'appendix.md',
];

/** 取出 YAML frontmatter 中的简单标量字段 */
function readFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta = {};
  let body = raw;
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (!kv) continue;
      let v = kv[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) {
        v = v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
      meta[kv[1]] = v;
    }
    body = raw.slice(m[0].length);
  }
  return { meta, body };
}

const parts = [];
const warnings = [];

for (const rel of ORDER) {
  const file = path.join(DOCS, rel);
  if (!fs.existsSync(file)) {
    warnings.push(`缺少文件：${rel}`);
    continue;
  }
  const { meta, body } = readFrontmatter(fs.readFileSync(file, 'utf8'));
  const title = meta.title || rel;
  parts.push(`# ${title}\n\n${body.trim()}\n`);
}

// 封面页的简介作为前言
const homeFile = path.join(DOCS, 'index.mdx');
if (fs.existsSync(homeFile)) {
  const raw = fs.readFileSync(homeFile, 'utf8');
  const { body } = readFrontmatter(raw);
  // 去掉 MDX 的 import / export 语句与 JSX 组件块，并只保留封面正文（砍掉全书目录区）
  const cleaned = body
    .split('## 全书目录')[0]
    .replace(/^import .*$/gm, '')
    .replace(/^export .*$/gm, '')
    .replace(/<CardGrid>[\s\S]*?<\/CardGrid>/g, '')
    .replace(/<p class="stb-cta">[\s\S]*?<\/p>/g, '')
    .replace(/<LinkButton[\s\S]*?<\/LinkButton>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (cleaned) parts.unshift(cleaned + '\n');
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, parts.join('\n\n'), 'utf8');

console.log(`[epub] 已合并 ${parts.length} 个片段 -> ${path.relative(ROOT, OUT_FILE)}`);
if (warnings.length) warnings.forEach((w) => console.warn('[epub] ' + w));
