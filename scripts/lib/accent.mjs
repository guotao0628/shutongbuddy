/**
 * 插画取色中枢。
 *
 * 插画（目录封面 / 分享卡片 / 品牌图）是预生成后提交仓库的位图与 SVG，
 * 无法跟随运行时的配色切换，因此这里统一取「默认配色」生成。
 * 改默认色后请重跑：npm run covers && npm run og && npm run brand
 */

/** 与 src/palette.ts 的 DEFAULT_ACCENT 保持一致 */
export const DEFAULT_ACCENT = { name: '青莲', hex: '#7b5aa3' };

export function hexToHsl(hex) {
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

export function hslHex(h, s, l) {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb;
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = lN - c / 2;
  return (
    '#' +
    rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')
  );
}

export const clampSat = (s, add, max = 78) => Math.min(max, s + add);

/** 插画用的三段渐变色与若干强调色，全部由默认色推导 */
export function accentSet(hex = DEFAULT_ACCENT.hex) {
  const c = hexToHsl(hex);
  return {
    name: DEFAULT_ACCENT.name,
    hex,
    /** 渐变深端 */
    dark: hslHex(c.h, clampSat(c.s, 16), 12),
    /** 渐变中段 = 原色 */
    main: hex,
    /** 渐变亮端 */
    light: hslHex(c.h, clampSat(c.s, 14), 62),
    /** 极浅，用于浅色文字/描边 */
    pale: hslHex(c.h, Math.max(24, c.s - 6), 88),
    /** 更深，用于浅底上的文字（如角标） */
    deep: hslHex(c.h, clampSat(c.s, 10), 30),
  };
}

export const ACCENT = accentSet();
