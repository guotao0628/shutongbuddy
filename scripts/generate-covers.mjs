/**
 * 生成《全书目录》各条目对应的封面插画（矢量 SVG）。
 *
 * 设计语言：清华紫斜向渐变底 + 白色线性图标 + 低透明度编号，
 * 自包含（不依赖 CSS 变量与外部字体），因此在明暗主题下表现一致。
 *
 * 用法：node scripts/generate-covers.mjs
 * 输出：src/assets/covers/*.svg
 */
import fs from 'node:fs';
import path from 'node:path';
import { ACCENT } from './lib/accent.mjs';

const OUT = path.join(process.cwd(), 'src', 'assets', 'covers');

const W = 640;
const H = 360;

/** 画布外框（渐变背景 + 右上柔光 + 右下大号编号） */
function frame(label) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ACCENT.dark}"/>
      <stop offset="55%" stop-color="${ACCENT.main}"/>
      <stop offset="100%" stop-color="${ACCENT.light}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.12" r="0.75">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="${W - 40}" y="${H - 34}" text-anchor="end"
        font-family="Georgia, 'Times New Roman', serif" font-size="150" font-weight="700"
        fill="#ffffff" fill-opacity="0.13">${label}</text>`;
}

/** 图标绘制包裹：线宽/圆角/白色描边统一在这里设置 */
function motif(inner) {
  return `
  <g transform="translate(238,168)" fill="none" stroke="#ffffff" stroke-width="4.2"
     stroke-linecap="round" stroke-linejoin="round">${inner}
  </g>`;
}

const COVERS = {
  /* ---------- 前置 ---------- */
  brief: {
    label: 'i',
    aria: '一本打开的书',
    inner: `
    <path d="M-86 -42 C -54 -58, -22 -58, 0 -44 C 22 -58, 54 -58, 86 -42 L 86 52 C 54 36, 22 36, 0 50 C -22 36, -54 36, -86 52 Z"/>
    <line x1="0" y1="-44" x2="0" y2="50"/>
    <path d="M-64 -22 h38 M-64 -2 h38 M-64 18 h38" stroke-opacity=".5" stroke-width="3.4"/>
    <path d="M26 -22 h38 M26 -2 h38 M26 18 h38" stroke-opacity=".5" stroke-width="3.4"/>
    <path d="M-30 -78 L -18 -66 M 0 -88 L 0 -72 M 30 -78 L 18 -66" stroke-opacity=".7" stroke-width="3.6"/>`,
  },

  author: {
    label: 'ii',
    aria: '作者与笔',
    inner: `
    <circle cx="-26" cy="-34" r="30"/>
    <path d="M-78 66 C -78 16, -58 -6, -26 -6 C 6 -6, 26 16, 26 66"/>
    <path d="M40 -70 L 96 34 L 78 46 L 26 -58 Z" stroke-opacity=".9"/>
    <path d="M40 -70 L 52 -46 L 26 -58 Z" fill="#ffffff" fill-opacity=".25"/>
    <line x1="30" y1="6" x2="62" y2="-12" stroke-opacity=".5" stroke-width="3.4"/>`,
  },

  preface: {
    label: 'iii',
    aria: '信纸与羽毛笔',
    inner: `
    <path d="M-72 -74 h108 l36 36 v112 h-144 Z"/>
    <path d="M36 -74 v36 h36" stroke-opacity=".8"/>
    <path d="M-50 -12 h84 M-50 12 h84 M-50 36 h56" stroke-opacity=".5" stroke-width="3.4"/>
    <path d="M66 -56 C 108 -24, 116 30, 74 74 C 96 26, 92 -18, 66 -56 Z" fill="#ffffff" fill-opacity=".22" stroke-width="3.6"/>
    <line x1="88" y1="-30" x2="60" y2="42" stroke-opacity=".7" stroke-width="3.2"/>`,
  },

  /* ---------- 四部分 · 8 章 ---------- */
  ch1: {
    label: '01',
    aria: '终端窗口与闪电',
    inner: `
    <rect x="-130" y="-74" width="176" height="148" rx="14"/>
    <line x1="-130" y1="-38" x2="46" y2="-38" stroke-opacity=".6"/>
    <circle cx="-112" cy="-56" r="4.5" fill="#ffffff" stroke="none"/>
    <circle cx="-94" cy="-56" r="4.5" fill="#ffffff" stroke="none" stroke-opacity=".6"/>
    <path d="M-106 2 l22 18 l-22 18" stroke-width="5"/>
    <line x1="-66" y1="38" x2="-10" y2="38" stroke-width="5"/>
    <path d="M86 -98 L 52 -22 L 82 -22 L 62 58 L 112 -32 L 80 -32 Z"
          fill="#ffffff" fill-opacity=".9" stroke="none"/>`,
  },

  ch2: {
    label: '02',
    aria: '微内核与环绕的插件',
    inner: `
    <rect x="-34" y="-34" width="68" height="68" rx="12" fill="#ffffff" fill-opacity=".18"/>
    <rect x="-118" y="-104" width="52" height="52" rx="10"/>
    <rect x="66" y="-104" width="52" height="52" rx="10"/>
    <rect x="-118" y="52" width="52" height="52" rx="10"/>
    <rect x="66" y="52" width="52" height="52" rx="10"/>
    <line x1="-66" y1="-66" x2="-30" y2="-30" stroke-opacity=".65" stroke-width="3.6"/>
    <line x1="66" y1="-66" x2="30" y2="-30" stroke-opacity=".65" stroke-width="3.6"/>
    <line x1="-66" y1="66" x2="-30" y2="30" stroke-opacity=".65" stroke-width="3.6"/>
    <line x1="66" y1="66" x2="30" y2="30" stroke-opacity=".65" stroke-width="3.6"/>`,
  },

  ch3: {
    label: '03',
    aria: '服务器与浏览器窗口',
    inner: `
    <rect x="-104" y="-84" width="132" height="38" rx="9"/>
    <rect x="-104" y="-36" width="132" height="38" rx="9"/>
    <rect x="-104" y="12" width="132" height="38" rx="9"/>
    <circle cx="-84" cy="-65" r="5" fill="#ffffff" stroke="none"/>
    <circle cx="-84" cy="-17" r="5" fill="#ffffff" stroke="none" stroke-opacity=".7"/>
    <circle cx="-84" cy="31" r="5" fill="#ffffff" stroke="none" stroke-opacity=".45"/>
    <rect x="44" y="-42" width="76" height="96" rx="10" stroke-opacity=".95"/>
    <line x1="44" y1="-16" x2="120" y2="-16" stroke-opacity=".6"/>
    <path d="M58 6 h48 M58 28 h34" stroke-opacity=".55" stroke-width="3.4"/>`,
  },

  ch4: {
    label: '04',
    aria: '多个模型汇聚到路由',
    inner: `
    <circle cx="-108" cy="-66" r="27"/>
    <circle cx="-108" cy="0" r="27"/>
    <circle cx="-108" cy="66" r="27"/>
    <circle cx="-108" cy="-66" r="7" fill="#ffffff" fill-opacity=".5" stroke="none"/>
    <circle cx="-108" cy="0" r="7" fill="#ffffff" fill-opacity=".8" stroke="none"/>
    <circle cx="-108" cy="66" r="7" fill="#ffffff" fill-opacity=".35" stroke="none"/>
    <rect x="26" y="-52" width="104" height="104" rx="22" fill="#ffffff" fill-opacity=".18"/>
    <circle cx="78" cy="0" r="14" fill="#ffffff" fill-opacity=".85" stroke="none"/>
    <path d="M78 -24 v-12 M78 24 v12 M54 0 h-12 M102 0 h12" stroke-width="4.5"/>
    <path d="M-80 -66 C -30 -66, -24 -34, 22 -22" stroke-opacity=".7" stroke-width="3.6"/>
    <path d="M-80 0 H 22" stroke-opacity=".9" stroke-width="3.8"/>
    <path d="M-80 66 C -30 66, -24 34, 22 22" stroke-opacity=".7" stroke-width="3.6"/>
    <path d="M22 -22 l-14 -3 M22 -22 l-5 13" stroke-width="3.4"/>
    <path d="M22 22 l-14 3 M22 22 l-5 -13" stroke-width="3.4"/>`,
  },

  ch5: {
    label: '05',
    aria: '嵌合的拼图块',
    inner: `
    <rect x="-124" y="-58" width="112" height="116" rx="14" fill="#ffffff" fill-opacity=".16"/>
    <circle cx="-68" cy="-58" r="19"/>
    <circle cx="-12" cy="0" r="19" stroke-opacity=".7"/>
    <rect x="24" y="-34" width="86" height="68" rx="14" stroke-opacity=".9"/>
    <circle cx="67" cy="-34" r="15" stroke-opacity=".7"/>
    <path d="M-64 -12 h44 M-64 14 h44 M-64 -12 v26" stroke-opacity=".5" stroke-width="3.2"/>`,
  },

  ch6: {
    label: '06',
    aria: '循环与步骤',
    inner: `
    <path d="M 81 -29 A 86 86 0 1 1 29 -81" stroke-width="5"/>
    <path d="M 15.7 -89 L 45.9 -74.9 L 26 -73.1" stroke-width="5"/>
    <circle cx="-86" cy="0" r="11" fill="#ffffff" fill-opacity=".8" stroke="none"/>
    <circle cx="0" cy="86" r="11" fill="#ffffff" fill-opacity=".55" stroke="none"/>
    <circle cx="86" cy="0" r="11" fill="#ffffff" fill-opacity=".35" stroke="none"/>
    <rect x="-30" y="-30" width="60" height="60" rx="14" fill="#ffffff" fill-opacity=".16"/>
    <path d="M-14 -6 h28 M-14 8 h18" stroke-opacity=".65" stroke-width="3.2"/>`,
  },

  ch7: {
    label: '07',
    aria: '放大镜审视资料',
    inner: `
    <path d="M-96 -84 h96 l40 40 v128 h-136 Z"/>
    <path d="M0 -84 v40 h40" stroke-opacity=".8"/>
    <path d="M-74 -14 h74 M-74 12 h74 M-74 38 h44" stroke-opacity=".5" stroke-width="3.4"/>
    <circle cx="46" cy="16" r="52" fill="#ffffff" fill-opacity=".16"/>
    <line x1="84" y1="54" x2="124" y2="94" stroke-width="8" stroke-opacity=".9"/>`,
  },

  ch8: {
    label: '08',
    aria: '浏览器与对话气泡',
    inner: `
    <rect x="-116" y="-88" width="228" height="152" rx="14"/>
    <line x1="-116" y1="-56" x2="112" y2="-56" stroke-opacity=".6"/>
    <circle cx="-98" cy="-72" r="4.5" fill="#ffffff" stroke="none"/>
    <circle cx="-80" cy="-72" r="4.5" fill="#ffffff" stroke="none" stroke-opacity=".6"/>
    <rect x="-96" y="-38" width="104" height="42" rx="12" stroke-opacity=".9"/>
    <path d="M-72 -17 h56" stroke-opacity=".5" stroke-width="3.4"/>
    <rect x="-4" y="18" width="104" height="42" rx="12" fill="#ffffff" fill-opacity=".18"/>
    <path d="M20 39 h56" stroke-opacity=".55" stroke-width="3.4"/>
    <path d="M-96 -38 l0 -14 M-4 60 l0 14" stroke-opacity="0"/>`,
  },

  /* ---------- 结语与附录 ---------- */
  epilogue: {
    label: '→',
    aria: '向前的路径',
    inner: `
    <circle cx="46" cy="-46" r="34" fill="#ffffff" fill-opacity=".18"/>
    <path d="M-118 78 C -46 78, -28 30, 22 18 C 72 6, 92 -18, 118 -46" stroke-width="5"/>
    <path d="M92 -52 l26 6 l-14 24" stroke-width="5"/>
    <line x1="-118" y1="78" x2="118" y2="78" stroke-opacity=".35" stroke-width="3.2"/>`,
  },

  appendix: {
    label: 'A',
    aria: '索引卡片',
    inner: `
    <rect x="-84" y="-76" width="164" height="118" rx="12" transform="rotate(-7)"/>
    <rect x="-96" y="-52" width="164" height="118" rx="12" fill="#ffffff" fill-opacity=".16" transform="rotate(4)"/>
    <path d="M-72 -18 h84 M-72 8 h84 M-72 34 h52" stroke-opacity=".55" stroke-width="3.4" transform="rotate(4)"/>
    <path d="M84 -84 l0 46 l-16 -14 l-16 14 l0 -46 Z" fill="#ffffff" fill-opacity=".8" stroke="none"/>`,
  },
};

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [name, c] of Object.entries(COVERS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${c.aria}">
${frame(c.label)}
${motif(c.inner)}
</svg>
`;
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg, 'utf8');
  n++;
}
console.log(`[covers] 已生成 ${n} 张封面插画 -> src/assets/covers/`);
