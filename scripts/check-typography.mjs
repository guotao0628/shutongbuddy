/**
 * 书稿排版检查：
 *   错误（阻断）：未闭合代码围栏 / frontmatter 缺 title / 文件末尾无换行 / 行尾空格 / 制表符
 *   警告（默认不阻断）：中英文之间缺空格、中文里用了半角标点、连续空行过多
 *
 * 用法：
 *   node scripts/check-typography.mjs           # 有错误则 exit 1
 *   node scripts/check-typography.mjs --strict  # 有警告也 exit 1
 */
import fs from 'node:fs';
import path from 'node:path';

const DOCS = path.join(process.cwd(), 'src', 'content', 'docs');
const STRICT = process.argv.includes('--strict');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.mdx?$/.test(e.name)) out.push(full);
  }
  return out;
}

/** 去掉代码围栏、行内代码、frontmatter、JSX 表达式与标签，只留正文文本 */
function plainText(raw) {
  const noFm = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const noFence = noFm.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
  return noFence
    .replace(/`[^`]*`/g, '')
    .replace(/\{[^{}]*\}/g, ' ') // MDX 表达式
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    // 书名号 / 引号 / 括号内属于专名或补充说明，不参与中英文间距检查
    .replace(/《[^》]*》/g, ' ')
    .replace(/「[^」]*」/g, ' ')
    .replace(/“[^”]*”/g, ' ')
    .replace(/（[^）]*）/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[*_~]{1,3}/g, '');
}

const CJK = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
const errors = [];
const warnings = [];

for (const file of walk(DOCS)) {
  const rel = path.relative(process.cwd(), file).split(path.sep).join('/');
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);

  /* ---- 错误级 ---- */
  if (!/^---\r?\n[\s\S]*?\btitle:/.test(raw)) errors.push(`${rel}: frontmatter 缺少 title`);
  if (!raw.endsWith('\n')) errors.push(`${rel}: 文件末尾缺少换行`);
  if (raw.includes('\t')) errors.push(`${rel}: 含制表符（Tab），请用空格`);

  const fences = (raw.match(/^\s*```/gm) || []).length;
  if (fences % 2 !== 0) errors.push(`${rel}: 代码围栏数量为奇数（${fences}），疑似未闭合`);

  lines.forEach((line, i) => {
    if (/\s+$/.test(line)) errors.push(`${rel}:${i + 1}: 行尾有多余空格`);
  });

  /* ---- 警告级 ---- */
  const text = plainText(raw);
  const noSpaceCjkLatin = [
    ...text.matchAll(new RegExp(`[${CJK}][A-Za-z0-9]`, 'g')),
    ...text.matchAll(new RegExp(`[A-Za-z0-9][${CJK}]`, 'g')),
  ];
  if (noSpaceCjkLatin.length) {
    warnings.push(
      `${rel}: 中英文之间缺空格 ${noSpaceCjkLatin.length} 处，例：${noSpaceCjkLatin
        .slice(0, 3)
        .map((m) => m[0])
        .join(' / ')}`
    );
  }

  const halfPunct = [...text.matchAll(new RegExp(`[${CJK}][,;:!?]`, 'g'))];
  if (halfPunct.length) {
    warnings.push(
      `${rel}: 中文里出现半角标点 ${halfPunct.length} 处，例：${halfPunct
        .slice(0, 3)
        .map((m) => m[0])
        .join(' / ')}`
    );
  }

  const tripleBlank = (raw.match(/\n{4,}/g) || []).length;
  if (tripleBlank) warnings.push(`${rel}: 连续空行过多 ${tripleBlank} 处`);
}

console.log(`[typo] 检查完毕：错误 ${errors.length}，警告 ${warnings.length}`);

if (warnings.length) {
  console.log('\n警告：');
  warnings.forEach((w) => console.log('  ! ' + w));
}
if (errors.length) {
  console.error('\n错误：');
  errors.forEach((e) => console.error('  x ' + e));
}

if (errors.length || (STRICT && warnings.length)) process.exitCode = 1;
