/**
 * 书稿合并（供 EPUB / Markdown 打包下载 / RSS 共用）
 */
import fs from 'node:fs';
import path from 'node:path';

export const DOCS_DIR = path.join(process.cwd(), 'src', 'content', 'docs');

/** 阅读顺序（与 astro.config.mjs 侧边栏一致） */
export const ORDER = [
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

/** 每章对应的配套代码目录（用于「配套代码」按钮） */
export const CODE_MAP = {
  'part3/ch5.md': 'plugins/shu-tong-buddy',
  'part4/ch7.md': 'examples/scratch-plugin',
  'part4/ch8.md': 'examples/shu-tong-buddy-studio',
};

/** 解析 YAML frontmatter 里的简单标量 */
export function readFrontmatter(raw) {
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

/** 读取单篇书稿 */
export function readChapter(rel) {
  const file = path.join(DOCS_DIR, rel);
  if (!fs.existsSync(file)) return null;
  const { meta, body } = readFrontmatter(fs.readFileSync(file, 'utf8'));
  return { file: rel, slug: rel.replace(/\.md$/, ''), title: meta.title || rel, description: meta.description || '', body: body.trim() };
}

/** 把 index.mdx 的封面正文抽出来（去掉组件与全书目录） */
export function readCover() {
  const file = path.join(DOCS_DIR, 'index.mdx');
  if (!fs.existsSync(file)) return '';
  const { body } = readFrontmatter(fs.readFileSync(file, 'utf8'));
  return body
    .split('## 全书目录')[0]
    .replace(/^import .*$/gm, '')
    .replace(/^export .*$/gm, '')
    .replace(/<CardGrid>[\s\S]*?<\/CardGrid>/g, '')
    .replace(/<p class="stb-cta">[\s\S]*?<\/p>/g, '')
    .replace(/<LinkButton[\s\S]*?<\/LinkButton>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 合并成一份 Markdown，返回 { text, parts } */
export function mergeBook() {
  const parts = [];
  const cover = readCover();
  if (cover) parts.push(cover);
  const chapters = [];
  for (const rel of ORDER) {
    const ch = readChapter(rel);
    if (!ch) {
      console.warn('[merge] 缺少文件：' + rel);
      continue;
    }
    chapters.push(ch);
    parts.push(`# ${ch.title}\n\n${ch.body}`);
  }
  return { text: parts.join('\n\n') + '\n', chapters };
}
