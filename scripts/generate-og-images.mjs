/**
 * 生成每页专属的社交分享卡片（Open Graph 图），1200x630。
 * 输出：public/og/<slug>.jpg（JPEG，比 PNG 小一半以上，抓取更快）
 * 用法：node scripts/generate-og-images.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const COVERS = path.join(ROOT, 'src', 'assets', 'covers');
const OUT = path.join(ROOT, 'public', 'og');

const W = 1200;
const H = 630;
const BOOK = 'DeepSeek Harness 应用开发实践';
const AUTHOR = '郭涛　著　·　清华大学出版社';
const DOMAIN = 'guotao0628.github.io/shutongbuddy';
const SANS = "'Microsoft YaHei','PingFang SC','Noto Sans CJK SC','Source Han Sans SC',sans-serif";
const SERIF = "'SimSun','Songti SC','Noto Serif CJK SC',serif";

const PAD = 96;
const THUMB_X = 800;
const THUMB_Y = 182;
const THUMB_W = 400;
const THUMB_H = 225;
const TEXT_RIGHT = THUMB_X - 48;
const TITLE_BASE = 312;

const PAGES = [
  ['index', '', BOOK, null],
  ['brief', '简介', '本书内容简介', 'brief'],
  ['author', '作者', '作者简介', 'author'],
  ['preface', '自序', '自序', 'preface'],
  ['part1-ch1', '第 1 章', '快速上手：十分钟跑通 DeepSeek Harness', 'ch1'],
  ['part1-ch2', '第 2 章', '架构解析：万物皆插件意味着什么', 'ch2'],
  ['part2-ch3', '第 3 章', '安装部署与 Web UI', 'ch3'],
  ['part2-ch4', '第 4 章', '多模型 API 接入', 'ch4'],
  ['part3-ch5', '第 5 章', '插件开发实战：ShuTongBuddy 备考助手插件', 'ch5'],
  ['part3-ch6', '第 6 章', '智能体构建原理：Turn、装配、上下文与委托', 'ch6'],
  ['part4-ch7', '第 7 章', '实例一：备考资料库体检智能体', 'ch7'],
  ['part4-ch8', '第 8 章', '实例二：ShuTongBuddy Studio', 'ch8'],
  ['epilogue', '结语', '智能体工程及其未来发展方向', 'epilogue'],
  ['appendix', '附录', '速查表与术语表', 'appendix'],
  ['glossary', '术语表', '核心术语与概念关系图', 'ch2'],
  ['downloads', '下载', 'PDF · EPUB · Markdown', 'brief'],
  ['errata', '勘误', '勘误与更新日志', 'appendix'],
  ['my-reading', '阅读', '我的阅读进度', 'ch1'],
  ['my-notes', '划线', '我的划线笔记', 'ch7'],
  ['en', '', 'DeepSeek Harness in Practice', null],
  ['en-brief', 'Intro', 'About the Book', 'brief'],
  ['en-author', 'Author', 'About the Author', 'author'],
  ['en-preface', 'Preface', 'Preface', 'preface'],
  ['en-downloads', 'Downloads', 'PDF · EPUB · Markdown', 'brief'],
  ['en-errata', 'Errata', 'Errata & Updates', 'appendix'],
];

function widthEm(s) {
  let w = 0;
  for (const ch of s) {
    if (/[\u2e80-\u9fff\uff00-\uffef\u3000-\u303f]/.test(ch)) w += 1;
    else if (ch === ' ') w += 0.3;
    else w += 0.56;
  }
  return w;
}

function tokenize(text) {
  const tokens = [];
  let buf = '';
  for (const ch of text) {
    if (/[A-Za-z0-9._+#@/-]/.test(ch)) {
      buf += ch;
    } else {
      if (buf) { tokens.push(buf); buf = ''; }
      tokens.push(ch);
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}

function wrap(text, maxEm) {
  const lines = [];
  let cur = '';
  for (const tk of tokenize(text)) {
    if (tk === ' ' && !cur) continue;
    if (cur && widthEm(cur + tk) > maxEm) {
      // 优先在空格处断行，避免把「应用开发实践」「备考助手插件」这类词组切断
      const sp = cur.lastIndexOf(' ');
      if (sp > 0) {
        lines.push(cur.slice(0, sp).replace(/\s+$/, ''));
        cur = cur.slice(sp + 1) + (tk === ' ' ? '' : tk);
      } else {
        lines.push(cur.replace(/\s+$/, ''));
        cur = tk === ' ' ? '' : tk;
      }
    } else {
      cur += tk;
    }
  }
  if (cur) lines.push(cur.replace(/\s+$/, ''));
  return fixLineStart(lines);
}

/** 中文行首禁则：顿号、逗号、句号等标点不能出现在行首（悬挂到上一行行尾） */
const NO_LINE_START = '、。，．；：！？）］｝」』〉》”’·…—～%‰°';
function fixLineStart(lines) {
  for (let i = 1; i < lines.length; i++) {
    let guard = 0;
    while (lines[i] && NO_LINE_START.indexOf(lines[i][0]) >= 0 && guard++ < 4) {
      lines[i - 1] += lines[i][0];
      lines[i] = lines[i].slice(1);
    }
    if (!lines[i]) {
      lines.splice(i, 1);
      i--;
    }
  }
  return lines;
}

function fit(text, maxWidthPx, sizes) {
  let last = { size: sizes[sizes.length - 1], lines: [] };
  for (const size of sizes) {
    const lines = wrap(text, maxWidthPx / size);
    last = { size, lines };
    if (lines.length <= 3) return last;
  }
  return last;
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]
  );
}

function coverInner(slug) {
  if (!slug) return null;
  const file = path.join(COVERS, slug + '.svg');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/id="bg"/g, 'id="cBg"')
    .replace(/url\(#bg\)/g, 'url(#cBg)')
    .replace(/id="glow"/g, 'id="cGlow"')
    .replace(/url\(#glow\)/g, 'url(#cGlow)');
}

function card(art, badge, title) {
  const isCover = !badge;
  const inner = coverInner(art);
  const maxWidth = inner ? TEXT_RIGHT - PAD : W - PAD * 2;
  const sizes = isCover ? [86, 76, 66, 58] : [62, 56, 50, 46, 42, 38];
  const picked = fit(title, maxWidth, sizes);
  const size = picked.size;
  const lines = picked.lines;
  const lineH = size * 1.26;

  const titleSvg = lines
    .map((ln, i) =>
      '<text x="' + PAD + '" y="' + (TITLE_BASE + i * lineH) + '" font-family="' + SERIF +
      '" font-size="' + size + '" font-weight="700" fill="#ffffff">' + escapeXml(ln) + '</text>')
    .join('\n  ');

  const barY = TITLE_BASE + (lines.length - 1) * lineH + 22;
  const badgeW = Math.round(widthEm(badge) * 24 + 48);

  const thumb = inner
    ? '<g clip-path="url(#round)">\n    <svg x="' + THUMB_X + '" y="' + THUMB_Y + '" width="' + THUMB_W +
      '" height="' + THUMB_H + '" viewBox="0 0 640 360">' + inner + '</svg>\n  </g>\n  <rect x="' + THUMB_X +
      '" y="' + THUMB_Y + '" width="' + THUMB_W + '" height="' + THUMB_H +
      '" rx="18" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>'
    : '';

  const badgeSvg = badge
    ? '<rect x="' + PAD + '" y="196" width="' + badgeW + '" height="48" rx="24" fill="#ffffff" fill-opacity="0.93"/>\n  <text x="' +
      (PAD + badgeW / 2) + '" y="228" text-anchor="middle" font-family="' + SANS +
      '" font-size="25" font-weight="700" fill="#660874">' + escapeXml(badge) + '</text>'
    : '';

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">\n' +
  '  <defs>\n' +
  '    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">\n' +
  '      <stop offset="0%" stop-color="#2e0334"/>\n' +
  '      <stop offset="52%" stop-color="#660874"/>\n' +
  '      <stop offset="100%" stop-color="#9c37b3"/>\n' +
  '    </linearGradient>\n' +
  '    <radialGradient id="glow" cx="0.86" cy="0.1" r="0.72">\n' +
  '      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>\n' +
  '      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>\n' +
  '    </radialGradient>\n' +
  '    <clipPath id="round"><rect x="' + THUMB_X + '" y="' + THUMB_Y + '" width="' + THUMB_W + '" height="' + THUMB_H + '" rx="18"/></clipPath>\n' +
  '  </defs>\n\n' +
  '  <rect width="' + W + '" height="' + H + '" fill="url(#bg)"/>\n' +
  '  <rect width="' + W + '" height="' + H + '" fill="url(#glow)"/>\n\n' +
  '  <g transform="translate(' + PAD + ',72)">\n' +
  '    <circle cx="24" cy="24" r="23" fill="none" stroke="#ffffff" stroke-opacity="0.85" stroke-width="2.2"/>\n' +
  '    <path d="M24 12 C 18 10, 13 11, 8 13 L 8 34 C 13 32, 18 30, 24 33 C 30 30, 35 32, 40 34 L 40 13 C 35 11, 30 10, 24 12 Z" fill="none" stroke="#ffffff" stroke-opacity="0.95" stroke-width="2.4" stroke-linejoin="round"/>\n' +
  '    <line x1="24" y1="12" x2="24" y2="33" stroke="#ffffff" stroke-opacity="0.95" stroke-width="2"/>\n' +
  '  </g>\n' +
  '  <text x="' + (PAD + 64) + '" y="105" font-family="' + SANS + '" font-size="25" fill="#ffffff" fill-opacity="0.86" letter-spacing="0.5">' + escapeXml(BOOK) + '</text>\n\n' +
  '  ' + thumb + '\n\n' +
  '  ' + badgeSvg + '\n\n' +
  '  ' + titleSvg + '\n\n' +
  '  <rect x="' + PAD + '" y="' + barY + '" width="120" height="5" rx="2.5" fill="#e0c9ee"/>\n\n' +
  '  <text x="' + PAD + '" y="546" font-family="' + SANS + '" font-size="26" fill="#ffffff" fill-opacity="0.86">' + escapeXml(AUTHOR) + '</text>\n' +
  '  <text x="' + PAD + '" y="590" font-family="' + SANS + '" font-size="21" fill="#ffffff" fill-opacity="0.5" letter-spacing="0.5">' + escapeXml(DOMAIN) + '</text>\n' +
  '</svg>';
}

fs.mkdirSync(OUT, { recursive: true });
let total = 0;
for (const page of PAGES) {
  const slug = page[0], badge = page[1], title = page[2], art = page[3];
  const buf = await sharp(Buffer.from(card(art, badge, title)), { density: 192 })
    .resize(W, H, { fit: 'fill' })
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, slug + '.jpg'), buf);
  total += buf.length;
  console.log('  ' + slug.padEnd(14) + (buf.length / 1024).toFixed(1) + ' KB');
}
console.log('\n[og] 已生成 ' + PAGES.length + ' 张分享卡片 -> public/og/（合计 ' + (total / 1024).toFixed(0) + ' KB）');
