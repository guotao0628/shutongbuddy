/**
 * 内部链接检查：扫描 dist/ 下所有 HTML，校验站内链接与静态资源是否存在。
 *
 * 用法：
 *   node scripts/check-links.mjs            # 只查站内（CI 硬门禁）
 *   node scripts/check-links.mjs --external # 同时抽查外链（会联网，慢）
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const CHECK_EXTERNAL = process.argv.includes('--external');

if (!fs.existsSync(DIST)) {
  console.error('dist/ 不存在，请先运行 npm run build');
  process.exit(1);
}

/** 目录下所有文件（相对 dist 的 posix 路径） */
function walk(dir, base = DIST, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

const files = walk(DIST);
const fileSet = new Set(files);

/** 判断站内路径是否可解析到真实文件 */
function resolvesToFile(urlPath) {
  let p = urlPath;
  if (p.startsWith('/')) {
    // dist 里的文件不带 base 前缀，这里按配置的 base 剥离
    const base = process.env.BASE_PATH || '/shutongbuddy/';
    if (p.startsWith(base)) p = '/' + p.slice(base.length);
    else if (base !== '/' && p !== '/') {
      // 允许不带 base 的写法
    }
  }
  p = decodeURIComponent(p.split('#')[0].split('?')[0]);
  if (p === '/' || p === '') return fileSet.has('index.html');
  const rel = p.replace(/^\//, '').replace(/\/$/, '');
  return (
    fileSet.has(rel) ||
    fileSet.has(rel + '/index.html') ||
    fileSet.has(rel + '.html') ||
    [...fileSet].some((f) => f.startsWith(rel + '/'))
  );
}

const htmlFiles = files.filter((f) => f.endsWith('.html'));
const broken = [];
const external = new Map();
const skipped = new Set();
let internalCount = 0;

/** 构建期才生成的资源（本地检查时可能尚不存在） */
const GENERATED = [/\/epub\//];

for (const rel of htmlFiles) {
  const html = fs.readFileSync(path.join(DIST, rel), 'utf8');
  const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('data:')) continue;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (CHECK_EXTERNAL) external.set(href, rel);
      continue;
    }
    if (href.startsWith('//')) continue;
    if (GENERATED.some((re) => re.test(href))) {
      skipped.add(href);
      continue;
    }
    internalCount++;
    if (!resolvesToFile(href)) broken.push({ page: rel, href });
  }
}

console.log(`[links] 扫描 ${htmlFiles.length} 个页面，站内链接 ${internalCount} 条`);
if (skipped.size) {
  console.log(`[links] 跳过 ${skipped.size} 条构建期生成的资源（CI 会先构建 EPUB 再检查）`);
}

if (broken.length) {
  console.error(`[links] 发现 ${broken.length} 条失效站内链接：`);
  const seen = new Set();
  for (const b of broken) {
    const k = b.page + '|' + b.href;
    if (seen.has(k)) continue;
    seen.add(k);
    console.error(`  - ${b.page}  ->  ${b.href}`);
  }
  process.exitCode = 1;
} else {
  console.log('[links] 站内链接全部有效 ✅');
}

if (CHECK_EXTERNAL) {
  console.log(`[links] 抽查 ${external.size} 条外链 …`);
  let bad = 0;
  for (const [url, page] of external) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 stb-link-check' } });
      if (res.status === 405 || res.status === 403) {
        res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': 'Mozilla/5.0 stb-link-check' } });
      }
      clearTimeout(timer);
      if (res.status >= 400) {
        console.warn(`  ! ${res.status}  ${url}   (${page})`);
        bad++;
      }
    } catch (e) {
      console.warn(`  ! ERR  ${url}   (${page})  ${e.message}`);
      bad++;
    }
  }
  console.log(`[links] 外链检查完成，可疑 ${bad} 条（不阻断构建）`);
}
