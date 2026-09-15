/**
 * 从书稿生成一份用于 pandoc 的合并 Markdown（EPUB 源）。
 * 输出：work/epub/book.md
 *
 * 用法：node scripts/build-epub.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { mergeBook } from './lib/merge-book.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'work', 'epub');
const OUT_FILE = path.join(OUT_DIR, 'book.md');

const { text, chapters } = mergeBook();

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, text, 'utf8');

console.log(`[epub] 已合并 ${chapters.length} 章 -> ${path.relative(ROOT, OUT_FILE)}`);
