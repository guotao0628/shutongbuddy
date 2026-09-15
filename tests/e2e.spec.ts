import { test, expect, type Page } from '@playwright/test';

/** 站点 base 前缀，与 astro.config.mjs 保持一致 */
const BASE = '/shutongbuddy/';

/** 打开页面并等待交互脚本执行完 */
async function open(page: Page, path: string) {
  await page.goto(BASE + path.replace(/^\//, ''), { waitUntil: 'load' });
  await page.waitForSelector('.reading-progress', { state: 'attached', timeout: 15_000 });
}

test.describe('封面与导航', () => {
  test('首页有封面、CTA 与目录卡片', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('main h1')).toContainText('DeepSeek Harness');
    await expect(page.locator('.stb-cta a').first()).toBeVisible();
    expect(await page.locator('.card, .sl-link-card').count()).toBeGreaterThanOrEqual(10);
  });

  test('侧边栏包含 4 个部分与阅读工具', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const sidebar = page.locator('#starlight__sidebar');
    for (const label of ['第一部分', '第二部分', '第三部分', '第四部分', '阅读工具']) {
      await expect(sidebar.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });
});

test.describe('章节页核心交互', () => {
  test('正文 14px、标题更大、行高合理', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const sizes = await page.evaluate(() => {
      const p = document.querySelector('.sl-markdown-content p')!;
      const h1 = document.querySelector('main h1')!;
      return {
        p: parseFloat(getComputedStyle(p).fontSize),
        h1: parseFloat(getComputedStyle(h1).fontSize),
        lh: parseFloat(getComputedStyle(p).lineHeight),
      };
    });
    expect(sizes.p).toBe(14);
    expect(sizes.h1).toBeGreaterThan(sizes.p);
    expect(sizes.lh).toBeGreaterThan(sizes.p);
  });

  test('注入阅读进度条、字号控件、返回顶部、章末工具栏', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await expect(page.locator('.reading-progress')).toHaveCount(1);
    await expect(page.locator('.font-ctl button')).toHaveCount(2);
    await expect(page.locator('.back-to-top')).toHaveCount(1);
    expect(await page.locator('.page-toolbar .stb-tool-btn').count()).toBeGreaterThanOrEqual(5);
  });

  test('A+ / A- 改变正文字号并写入 localStorage', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await page.locator('.font-ctl button').nth(1).click();
    expect(await page.evaluate(() => localStorage.getItem('stb-font-size'))).toBe('15');
    expect(
      await page.evaluate(() => getComputedStyle(document.querySelector('.sl-markdown-content p')!).fontSize)
    ).toBe('15px');
    await page.locator('.font-ctl button').nth(0).click();
    expect(await page.evaluate(() => localStorage.getItem('stb-font-size'))).toBe('14');
  });

  test('侧边栏有已读勾选框与阅读进度', async ({ page }) => {
    await open(page, '/part1/ch1/');
    expect(await page.locator('input.chapter-check').count()).toBeGreaterThanOrEqual(13);
    await expect(page.locator('#stb-progress')).toContainText('/');
  });

  test('代码块有语言标签与下载按钮', async ({ page }) => {
    await open(page, '/part2/ch3/');
    expect(await page.locator('.code-lang-tag').count()).toBeGreaterThan(0);
    expect(await page.locator('.code-download-btn').count()).toBeGreaterThan(0);
  });

  test('术语自动双链指向术语表锚点', async ({ page }) => {
    await open(page, '/part1/ch2/');
    const first = page.locator('a.glossary-term').first();
    await expect(first).toBeVisible();
    expect(await first.getAttribute('href')).toContain('/glossary/#');
  });

  test('练习题有「会了」按钮', async ({ page }) => {
    await open(page, '/part1/ch1/');
    expect(await page.locator('.quiz-btn').count()).toBeGreaterThanOrEqual(3);
  });

  test('章节显示阅读时长估算', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await expect(page.locator('.stb-chapter-meta')).toContainText('分钟');
  });

  test('分享按钮复制链接并提示', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, '/part1/ch1/');
    await page.locator('.page-toolbar .stb-tool-btn', { hasText: '分享' }).click();
    await expect(page.locator('.stb-toast.show')).toBeVisible();
  });
});

test.describe('工具页', () => {
  test('首页热门搜索点击后打开搜索框', async ({ page }) => {
    await open(page, '/');
    const chip = page.locator('.stb-chip').first();
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page.locator('.pagefind-ui__search-input').first()).toBeVisible();
  });

  test('我的阅读页渲染进度、最近阅读与时长', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('stb-read', JSON.stringify({ '/shutongbuddy/part1/ch1/': 1 }));
      localStorage.setItem(
        'stb-recent',
        JSON.stringify([{ path: '/shutongbuddy/part1/ch1/', title: '第 1 章', ts: Date.now() }])
      );
      localStorage.setItem('stb-time:/shutongbuddy/part1/ch1/', '605');
    });
    await open(page, '/my-reading/');
    await expect(page.locator('#stb-reading-page')).toContainText('继续阅读');
    await expect(page.locator('#stb-reading-page')).toContainText('最近阅读');
    await expect(page.locator('#stb-reading-page')).toContainText('学习时长');
    await expect(page.locator('.stb-progressbar')).toHaveCount(1);
  });

  test('我的划线页渲染划线并可导出', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'stb-hl:/shutongbuddy/part1/ch1/',
        JSON.stringify(['万物皆插件', '没有特权核心'])
      );
    });
    await open(page, '/my-notes/');
    await expect(page.locator('#stb-notes-page')).toContainText('万物皆插件');
    expect(await page.locator('.stb-hl-list li').count()).toBe(2);

    const [dl] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#stb-export-anki').click(),
    ]);
    expect(dl.suggestedFilename()).toBe('my-highlights-anki.tsv');
  });

  test('术语表页渲染 Mermaid 图与 19 个术语', async ({ page }) => {
    await open(page, '/glossary/');
    await expect(page.locator('.mermaid svg').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.stb-glossary-item')).toHaveCount(19);
  });

  test('下载页列出四种格式与版本号', async ({ page }) => {
    await open(page, '/downloads/');
    await expect(page.locator('.stb-download-list li')).toHaveCount(4);
    await expect(page.locator('.stb-version')).toContainText('v1.0.0');
  });

  test('勘误页有更新日志表', async ({ page }) => {
    await open(page, '/errata/');
    await expect(page.locator('main table')).not.toHaveCount(0);
    await expect(page.locator('main')).toContainText('更新日志');
  });

  test('英文首页与英文侧边栏可用', async ({ page }) => {
    await page.goto(BASE + 'en/', { waitUntil: 'load' });
    await expect(page.locator('main h1')).toContainText('DeepSeek Harness');

    await page.goto(BASE + 'en/preface/', { waitUntil: 'load' });
    await expect(page.locator('#starlight__sidebar')).toContainText('Front Matter');
    await expect(page.locator('#starlight__sidebar')).toContainText('Chapter 1');
  });
});

test.describe('SEO 与元信息', () => {
  test('分享卡片与 RSS 已注入', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toContain('og.png');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
    await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      'href',
      /apple-touch-icon\.png/
    );
  });

  test('sitemap / rss / robots 可访问', async ({ request }) => {
    for (const p of ['sitemap-index.xml', 'rss.xml', 'robots.txt', 'pagefind/pagefind.js']) {
      const res = await request.get(BASE + p);
      expect(res.status(), p).toBe(200);
    }
  });
});

test.describe('键盘快捷键', () => {
  test('/ 打开搜索，- 缩小字号', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await page.keyboard.press('/');
    await expect(page.locator('.pagefind-ui__search-input').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('main h1').click();
    await page.keyboard.press('-');
    expect(await page.evaluate(() => localStorage.getItem('stb-font-size'))).toBe('13');
  });
});

test.describe('全文检索', () => {
  test('中文关键词能检索到结果', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await page.keyboard.press('/');
    const input = page.locator('.pagefind-ui__search-input').first();
    await expect(input).toBeVisible();
    await input.fill('能力接缝');
    await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 30_000 });
    const first = await page.locator('.pagefind-ui__result').first().innerText();
    expect(first.length).toBeGreaterThan(0);
  });

  test('英文关键词同样可检索', async ({ page }) => {
    await open(page, '/part1/ch2/');
    await page.keyboard.press('/');
    const input = page.locator('.pagefind-ui__search-input').first();
    await expect(input).toBeVisible();
    await input.fill('Profile');
    await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 30_000 });
  });
});

test.describe('插图编号与交叉引用', () => {
  test('插图自动编号为「图 N-M」并可被正文引用', async ({ page }) => {
    await open(page, '/part1/ch2/');
    await expect(page.locator('.stb-figure-caption').first()).toContainText('图 2-1');
    const ref = page.locator('a.stb-figref').first();
    await expect(ref).toHaveAttribute('href', '#fig-2-1');
    await expect(page.locator('#fig-2-1')).toHaveCount(1);
  });

  test('第 5、6 章插图同样编号', async ({ page }) => {
    await open(page, '/part3/ch5/');
    await expect(page.locator('.stb-figure-caption').first()).toContainText('图 5-1');
    await open(page, '/part3/ch6/');
    await expect(page.locator('.stb-figure-caption').first()).toContainText('图 6-1');
  });
});
