/**
 * 生成品牌图片资源（一次性运行，产物提交到仓库）：
 *   public/og.png                 1200x630  社交分享卡片
 *   public/icon-192.png           192x192   PWA 图标
 *   public/icon-512.png           512x512   PWA 图标
 *   public/apple-touch-icon.png   180x180   iOS 主屏图标
 *
 * 用法：node scripts/generate-brand-assets.mjs
 *
 * 注意：SVG 里的中文需要系统装了中文字体；CI 上若要重跑，
 * 需先 `apt-get install -y fonts-noto-cjk`。因此产物直接提交仓库，
 * 构建流程不依赖本脚本。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');

const TITLE_1 = 'DeepSeek Harness';
const TITLE_2 = '应用开发实践';
const SUB = '基于 DeepSeek Harness 的智能体应用开发实战手册';
const META = '郭涛　著　·　清华大学出版社';
const DOMAIN = 'guotao0628.github.io/shutongbuddy';

const FONT = "'Microsoft YaHei','PingFang SC','Noto Sans CJK SC','Source Han Sans SC',sans-serif";
const SERIF = "'SimSun','Songti SC','Noto Serif CJK SC',serif";

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3d0446"/>
      <stop offset="55%" stop-color="#660874"/>
      <stop offset="100%" stop-color="#8e2ba6"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.7">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- 书本标记 -->
  <g transform="translate(88,74) scale(1.05)">
    <circle cx="32" cy="32" r="30" fill="none" stroke="#ffffff" stroke-opacity="0.85" stroke-width="2.5"/>
    <path d="M32 18 C 24 15, 17 17, 11 20 L 11 44 C 17 41, 24 39, 32 42 C 40 39, 47 41, 53 44 L 53 20 C 47 17, 40 15, 32 18 Z"
          fill="none" stroke="#ffffff" stroke-opacity="0.95" stroke-width="3" stroke-linejoin="round"/>
    <line x1="32" y1="18" x2="32" y2="42" stroke="#ffffff" stroke-opacity="0.95" stroke-width="2.5"/>
  </g>

  <text x="176" y="112" font-family="${FONT}" font-size="26" fill="#ffffff" fill-opacity="0.82" letter-spacing="1">ShuTongBuddy · 书童</text>

  <text x="88" y="268" font-family="${SERIF}" font-size="82" font-weight="700" fill="#ffffff">${TITLE_1}</text>
  <text x="88" y="366" font-family="${SERIF}" font-size="82" font-weight="700" fill="#ffffff">${TITLE_2}</text>

  <rect x="88" y="408" width="132" height="5" rx="2.5" fill="#e0c9ee"/>

  <text x="88" y="474" font-family="${FONT}" font-size="28" fill="#ffffff" fill-opacity="0.9">${SUB}</text>
  <text x="88" y="530" font-family="${FONT}" font-size="26" fill="#ffffff" fill-opacity="0.75">${META}</text>

  <text x="88" y="586" font-family="${FONT}" font-size="20" fill="#ffffff" fill-opacity="0.55" letter-spacing="0.5">${DOMAIN}</text>
</svg>`;

const faviconSvg = fs.readFileSync(path.join(PUBLIC, 'favicon.svg'), 'utf8');

async function writePng(svg, size, outFile) {
  const buf = await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(outFile, buf);
  console.log(`[brand] ${path.relative(ROOT, outFile)} (${(buf.length / 1024).toFixed(1)} KB)`);
}

fs.writeFileSync(
  path.join(PUBLIC, 'og.png'),
  await sharp(Buffer.from(ogSvg), { density: 192 })
    .resize(1200, 630, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer()
);
console.log(`[brand] public/og.png (${(fs.statSync(path.join(PUBLIC, 'og.png')).size / 1024).toFixed(1)} KB)`);

await writePng(faviconSvg, 192, path.join(PUBLIC, 'icon-192.png'));
await writePng(faviconSvg, 512, path.join(PUBLIC, 'icon-512.png'));
await writePng(faviconSvg, 180, path.join(PUBLIC, 'apple-touch-icon.png'));
