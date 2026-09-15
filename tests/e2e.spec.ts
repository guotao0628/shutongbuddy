import { test, expect, type Page } from '@playwright/test';

/** 站点 base 前缀；PR 预览会通过 BASE_PATH 传入嵌套路径 */
const BASE = process.env.BASE_PATH || '/shutongbuddy/';

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
    expect(await page.locator('.stb-cover-card').count()).toBeGreaterThanOrEqual(10);
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
    await expect(page.locator('.stb-font-dec')).toHaveCount(1);
    await expect(page.locator('.stb-font-inc')).toHaveCount(1);
    await expect(page.locator('.stb-color-btn')).toHaveCount(1);
    await expect(page.locator('.back-to-top')).toHaveCount(1);
    expect(await page.locator('.page-toolbar .stb-tool-btn').count()).toBeGreaterThanOrEqual(5);
  });

  test('A+ / A- 改变正文字号并写入 localStorage', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await page.locator('.stb-font-inc').click();
    expect(await page.evaluate(() => localStorage.getItem('stb-font-size'))).toBe('15');
    expect(
      await page.evaluate(() => getComputedStyle(document.querySelector('.sl-markdown-content p')!).fontSize)
    ).toBe('15px');
    await page.locator('.stb-font-dec').click();
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
    expect(og).toContain('/og/');
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

test.describe('参考答案、订阅与热词', () => {
  test('练习题参考答案默认折叠，可展开与收起', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const panel = page.locator('.exercise-answer').first();
    await expect(panel).toBeHidden();
    const toggle = page.locator('.exercise-toggle').first();
    await expect(toggle).toContainText('显示参考答案');
    await toggle.click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('保存后立即生效');
    await expect(toggle).toContainText('隐藏参考答案');
    await toggle.click();
    await expect(panel).toBeHidden();
  });

  test('参考答案区块内不会混入「会了」按钮', async ({ page }) => {
    await open(page, '/part1/ch1/');
    expect(await page.locator('.exercise-answer .quiz-btn').count()).toBe(0);
  });

  test('订阅表单会校验邮箱格式', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const form = page.locator('.stb-subscribe-form');
    await expect(form).toBeVisible();
    await expect(form.locator('input[type="email"]')).toHaveAttribute('required', '');
    await form.evaluate((f) => f.setAttribute('novalidate', ''));
    await form.locator('input[type="email"]').fill('bad-email');
    await form.locator('button[type="submit"]').click();
    await expect(page.locator('.subscribe-box .stb-error')).toContainText('有效的邮箱');
  });

  test('首页展示本书高频概念与本地最近搜索', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('stb-searches', JSON.stringify(['能力接缝']));
    });
    await open(page, '/');
    const first = page.locator('.stb-chips').first();
    await expect(first).toContainText('本书高频概念');
    await expect(first.locator('.stb-chip')).not.toHaveCount(0);
    await expect(page.locator('.stb-chips-mine')).toContainText('你搜过');
    await expect(page.locator('.stb-chips-mine .stb-chip').first()).toHaveText('能力接缝');
  });
});

test.describe('全书目录封面', () => {
  test('首页目录每个条目都有封面图且能加载', async ({ page }) => {
    await open(page, '/');
    const cards = page.locator('.stb-cover-card');
    await expect(cards).toHaveCount(13);

    // 逐张确认图片真的解码成功（naturalWidth > 0），排除 404 或损坏的 SVG
    const broken = await page.evaluate(async () => {
      const imgs = Array.from(
        document.querySelectorAll<HTMLImageElement>('.stb-cover-media img')
      );
      imgs.forEach((i) => {
        i.loading = 'eager';
      });
      await Promise.all(
        imgs.map(
          (i) =>
            new Promise<void>((res) => {
              if (i.complete) return res();
              i.addEventListener('load', () => res(), { once: true });
              i.addEventListener('error', () => res(), { once: true });
            })
        )
      );
      return imgs
        .filter((i) => !i.complete || i.naturalWidth === 0)
        .map((i) => i.getAttribute('src'));
    });
    expect(broken).toEqual([]);
  });

  test('封面卡片链接指向对应章节', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('.stb-cover-card').first()).toHaveAttribute('href', /brief\/$/);
    await expect(
      page.locator('.stb-cover-card', { hasText: '第 5 章' }).first()
    ).toHaveAttribute('href', /part3\/ch5\/$/);
  });

  test('英文目录同样有封面', async ({ page }) => {
    await page.goto(BASE + 'en/', { waitUntil: 'load' });
    await expect(page.locator('.stb-cover-card')).toHaveCount(13);
  });

  test('封面页不显示章节阅读时长', async ({ page }) => {
    await open(page, '/');
    await expect(page.locator('.stb-chapter-meta')).toHaveCount(0);
    await open(page, '/part1/ch1/');
    await expect(page.locator('.stb-chapter-meta')).toHaveCount(1);
  });
});

test.describe('社交分享卡片', () => {
  test('每页都有专属卡片，且图片可访问、体积可控', async ({ page, request }) => {
    for (const p of ['/', '/part1/ch1/', '/glossary/', '/en/']) {
      await open(page, p);
      const url = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(url, p).toMatch(/^https:\/\//);

      // 用本地路径请求，避免测到线上旧版本
      const localPath = new URL(url!).pathname;
      const res = await request.get(localPath);
      expect(res.status(), p + ' -> ' + localPath).toBe(200);
      expect(res.headers()['content-type'], localPath).toContain('image/jpeg');

      const len = Number(res.headers()['content-length'] || 0);
      if (len) expect(len, localPath).toBeLessThan(300 * 1024);
    }
  });

  test('不同页面用不同卡片', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const a = await page.locator('meta[property="og:image"]').getAttribute('content');
    await open(page, '/glossary/');
    const b = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(a).toContain('og/part1-ch1.jpg');
    expect(b).toContain('og/glossary.jpg');
    expect(a).not.toBe(b);
  });

  test('英文页回落：有译文用自己的卡片，未翻译章节复用中文卡片', async ({ page }) => {
    await open(page, 'en/brief/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\/en-brief\.jpg$/);
    await open(page, 'en/part1/ch1/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\/part1-ch1\.jpg$/);
  });

  test('补齐 og:image:type / secure_url / twitter:image:alt', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg');
    await expect(page.locator('meta[property="og:image:secure_url"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  });
});

test.describe('配色切换（中国传统色）', () => {
  test('面板含 24 色，选色后亮/暗两套令牌都同步', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const btn = page.locator('.stb-color-btn');
    await expect(btn).toBeVisible();
    await btn.click();
    const panel = page.locator('.stb-palette');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.stb-swatch')).toHaveCount(24);

    const before = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--stb-accent').trim()
    );
    await panel.locator('.stb-swatch').last().click();
    const after = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--stb-accent').trim()
    );
    expect(after).not.toBe(before);

    const mapped = await page.evaluate(() => {
      const de = document.documentElement;
      const read = () => getComputedStyle(de).getPropertyValue('--sl-color-accent').trim();
      const prev = de.dataset.theme;
      de.dataset.theme = 'dark';
      const dark = read();
      de.dataset.theme = 'light';
      const light = read();
      de.dataset.theme = prev ?? 'dark';
      return { dark, light };
    });
    expect(mapped.dark).not.toBe(mapped.light);
    expect(mapped.dark.length).toBeGreaterThan(0);

    await expect(page.locator('.stb-swatch[aria-pressed="true"]')).toHaveCount(1);
    expect(await page.locator('meta[name="theme-color"]').getAttribute('content')).toBeTruthy();
  });

  test('选择结果写入本地并在刷新后保持', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await page.locator('.stb-color-btn').click();
    await page.locator('.stb-swatch').nth(5).click();
    expect(await page.evaluate(() => localStorage.getItem('stb-accent'))).toContain('hex');

    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.reading-progress', { state: 'attached' });
    expect(
      await page.evaluate(() => document.documentElement.style.getPropertyValue('--stb-accent'))
    ).not.toBe('');
  });

  test('恢复默认后清空内联变量与本地记录', async ({ page }) => {
    await open(page, '/part1/ch1/');
    await page.locator('.stb-color-btn').click();
    await page.locator('.stb-swatch').last().click();
    await page.locator('.stb-palette-reset').click();
    expect(await page.evaluate(() => localStorage.getItem('stb-accent'))).toBeNull();
    expect(await page.evaluate(() => document.documentElement.style.length)).toBe(0);
    await expect(page.locator('.stb-swatch[aria-pressed="true"]')).toHaveCount(0);
  });

  test('Esc 可关闭面板', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const panel = page.locator('.stb-palette');
    await page.locator('.stb-color-btn').click();
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });

  test('旧的写死配色变量已不存在', async ({ page }) => {
    await open(page, '/part1/ch1/');
    const legacy = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return ['--stb-tsinghua', '--stb-tsinghua-deep', '--stb-tsinghua-soft'].map((v) =>
        cs.getPropertyValue(v).trim()
      );
    });
    expect(legacy).toEqual(['', '', '']);
  });
});
