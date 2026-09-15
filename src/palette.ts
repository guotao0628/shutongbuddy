/**
 * 中国传统色 · 紫色系（24 色）
 *
 * 这是全站唯一的配色来源：界面强调色、封面插画、分享卡片都从这里取色。
 * 改默认色只需改 DEFAULT_ACCENT；改完请跑 `npm run covers && npm run og && npm run brand`
 * 重新生成插画（插画是预生成后提交的，不在 CI 里现场生成）。
 */

export interface Swatch {
  /** 色名 */
  name: string;
  /** 色值 */
  hex: string;
  /** 明度分档，仅用于面板分组显示 */
  band: 'light' | 'mid' | 'deep';
}

/** 分三档：浅（作暗色主题强调色）、中（作亮色主题强调色）、深 */
export const PALETTE: Swatch[] = [
  // 第一行 · 浅
  { name: '淡牵牛紫', hex: '#d1c2d3', band: 'light' },
  { name: '凤信紫', hex: '#c8adc4', band: 'light' },
  { name: '萝兰紫', hex: '#c08eaf', band: 'light' },
  { name: '青蛤壳紫', hex: '#bc84a8', band: 'light' },
  { name: '豆蔻紫', hex: '#ad6598', band: 'mid' },
  { name: '扁豆紫', hex: '#a35c8f', band: 'mid' },
  { name: '芄紫', hex: '#833c66', band: 'deep' },
  { name: '真紫', hex: '#652a41', band: 'deep' },

  // 第二行 · 中
  { name: '楝花', hex: '#c59ac5', band: 'light' },
  { name: '轻紫', hex: '#c5a4cc', band: 'light' },
  { name: '茄花', hex: '#bb97c5', band: 'light' },
  { name: '槿紫', hex: '#806d9e', band: 'mid' },
  { name: '青莲', hex: '#7b5aa3', band: 'mid' },
  { name: '紫罗兰', hex: '#5f479a', band: 'deep' },
  { name: '蕈紫', hex: '#815c94', band: 'mid' },
  { name: '桔梗紫', hex: '#813c85', band: 'deep' },

  // 第三行 · 深
  { name: '雪青', hex: '#a59aca', band: 'light' },
  { name: '藤萝紫', hex: '#8076a3', band: 'mid' },
  { name: '螺甸紫', hex: '#74759b', band: 'mid' },
  { name: '山梗紫', hex: '#61649f', band: 'mid' },
  { name: '野菊紫', hex: '#525288', band: 'deep' },
  { name: '满天星紫', hex: '#2e317c', band: 'deep' },
  { name: '葡萄青', hex: '#501d46', band: 'deep' },
  { name: '紫茄', hex: '#49214a', band: 'deep' },
];

/** 默认配色 */
export const DEFAULT_ACCENT = '青莲';

export function defaultSwatch(): Swatch {
  return PALETTE.find((s) => s.name === DEFAULT_ACCENT) ?? PALETTE[0];
}

/* ---------------------------------------------------------------------------
 * 由单个色值推导出一整套主题令牌。
 * 亮色主题需要足够暗才在浅底上可读，暗色主题需要足够亮才在深底上可读，
 * 因此按明度做上下钳制，而不是直接用原色。
 * ------------------------------------------------------------------------- */

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = lN - c / 2;
  return (
    '#' +
    rgb
      .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** 六个令牌：亮色 3 个 + 暗色 3 个 */
export function tokensFor(hex: string): Record<string, string> {
  const { h, s, l } = hexToHsl(hex);
  const sat = (k: number, min: number) => Math.max(min, Math.min(80, Math.round(s * k) + 8));
  const hsl = (hh: number, ss: number, ll: number) => `hsl(${hh}, ${ss}%, ${ll}%)`;
  return {
    '--stb-accent': hsl(h, sat(1.1, 24), Math.min(44, l)),
    '--stb-accent-deep': hsl(h, sat(1.1, 24), Math.max(20, Math.min(30, l - 16))),
    '--stb-accent-wash': hsl(h, Math.min(44, Math.round(s * 0.9) + 10), 95),
    '--stb-accent-soft': hsl(h, sat(0.85, 30), Math.max(72, Math.min(80, l + 26))),
    '--stb-accent-pale': hsl(h, Math.max(24, Math.round(s * 0.7)), 87),
    '--stb-accent-shadow': hsl(h, sat(0.9, 26), 20),
  };
}

export const ACCENT_VARS = [
  '--stb-accent',
  '--stb-accent-deep',
  '--stb-accent-wash',
  '--stb-accent-soft',
  '--stb-accent-pale',
  '--stb-accent-shadow',
];
