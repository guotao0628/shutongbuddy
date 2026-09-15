import { test, expect, type Page } from '@playwright/test';

/** 站点 base 前缀；PR 预览会通过 BASE_PATH 传入嵌套路径 */
const BASE = process.env.BASE_PATH || '/shutongbuddy/';

async function open(page: Page, path: string) {
  await page.goto(BASE + path.replace(/^\//, ''), { waitUntil: 'load' });
  await page.waitForSelector('.reading-progress', { state: 'attached', timeout: 15_000 });
}

test.describe('响应式：无横向溢出', () => {
  for (const p of [
    '/',
    '/part1/ch1/',
    '/part1/ch2/',
    '/part2/ch4/',
    '/glossary/',
    '/downloads/',
    '/my-reading/',
    '/en/',
  ]) {
    test(`${p} 不产生横向滚动`, async ({ page }) => {
      await open(page, p);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow, p).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('响应式：触控可用性', () => {
  test('注入的控件都不小于 36px，且没有 26px 的小按钮', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const small = await page.evaluate(() => {
      const sels =
        '.font-ctl button, .back-to-top, .page-toolbar .stb-tool-btn, .stb-chip, .exercise-toggle, .quiz-btn, .code-download-btn';
      return [...document.querySelectorAll(sels)]
        .filter((b) => b.getBoundingClientRect().width > 0)
        .map((b) => {
          const r = b.getBoundingClientRect();
          return {
            label: (b.textContent || b.className).trim().slice(0, 16),
            w: Math.round(r.width),
            h: Math.round(r.height),
          };
        })
        .filter((x) => x.h < 36 || x.w < 32);
    });
    expect(small).toEqual([]);
  });

  test('代码下载按钮在触屏上常显，不依赖 hover', async ({ page }) => {
    await open(page, '/part2/ch3/');
    const btn = page.locator('.code-download-btn').first();
    await expect(btn).toBeVisible();
    expect(await btn.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('代码下载按钮不会盖住代码首行', async ({ page }) => {
    await open(page, '/part2/ch3/');
    const pre = await page.locator('pre').first().boundingBox();
    const btn = await page.locator('.code-download-btn').first().boundingBox();
    expect(pre && btn).toBeTruthy();
    // 按钮底边应落在代码块内
    expect(btn!.y + btn!.height).toBeLessThanOrEqual(pre!.y + pre!.height);
  });

  test('触屏媒体查询生效', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const m = await page.evaluate(() => ({
      coarse: matchMedia('(pointer: coarse)').matches,
      noHover: matchMedia('(hover: none)').matches,
      touch: navigator.maxTouchPoints > 0,
    }));
    expect(m.touch).toBe(true);
    expect(m.coarse || m.noHover).toBe(true);
  });
});

test.describe('响应式：正文可读性', () => {
  test('正文字号 ≥13px，行高 ≥1.6 倍', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const m = await page.evaluate(() => {
      const p = document.querySelector('.sl-markdown-content p') as HTMLElement;
      const cs = getComputedStyle(p);
      return {
        size: parseFloat(cs.fontSize),
        ratio: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize),
      };
    });
    expect(m.size).toBeGreaterThanOrEqual(13);
    expect(m.ratio).toBeGreaterThanOrEqual(1.6);
  });

  test('宽插图放进滚动容器，不被压扁', async ({ page }) => {
    await open(page, '/part1/ch2/');
    const scroller = await page.locator('.stb-figure-scroll').first().boundingBox();
    const svg = await page.locator('.stb-figure-scroll > svg').first().boundingBox();
    expect(scroller && svg).toBeTruthy();
    expect(svg!.width).toBeGreaterThanOrEqual(scroller!.width - 1);
  });

  test('正文段落左对齐而非两端对齐（窄屏避免大间隙）', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const align = await page.evaluate(
      () => getComputedStyle(document.querySelector('.sl-markdown-content p') as HTMLElement).textAlign
    );
    expect(['start', 'left']).toContain(align);
  });

  test('术语每个只链首次出现，避免满篇下划线', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const dup = await page.evaluate(() => {
      const t = [...document.querySelectorAll('a.glossary-term')].map((a) => a.textContent || '');
      return t.length - new Set(t).size;
    });
    expect(dup).toBe(0);
  });
});

test.describe('响应式：目录与导航', () => {
  test('窄屏通过菜单按钮打开章节目录', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const sidebar = page.locator('#starlight__sidebar');
    expect(await sidebar.evaluate((el) => el.getBoundingClientRect().width)).toBe(0);

    await page.locator('button[popovertarget="starlight__sidebar"]').click();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText('第一部分');
  });

  test('封面卡片在窄屏单列、平板双列', async ({ page }) => {
    await open(page, '/');
    const cols = await page.evaluate(() => {
      const g = document.querySelector('.stb-cover-grid') as HTMLElement;
      return getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length;
    });
    expect(cols).toBeGreaterThanOrEqual(1);
    expect(cols).toBeLessThanOrEqual(2);
  });
});

  test('配色色块在触屏上足够大且面板不溢出屏幕', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await page.locator('.stb-color-btn').click();
    const panel = page.locator('.stb-palette');
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(vw + 1);

    const swatch = await page.locator('.stb-swatch').first().boundingBox();
    expect(swatch!.width).toBeGreaterThanOrEqual(30);
    expect(swatch!.height).toBeGreaterThanOrEqual(30);
  });
