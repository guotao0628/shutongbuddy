import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 4321);
const BASE_PATH = process.env.BASE_PATH || '/shutongbuddy/';
const BASE_URL = `http://localhost:${PORT}${BASE_PATH}`;

/**
 * 三个项目：
 *   desktop  —— 桌面全量用例
 *   phone    —— iPhone SE 375×667（最窄的常见机型，触发 ≤380px 断点）
 *   tablet   —— iPad Mini 768×1024（竖屏，正好压在 Starlight 的 800px 导航断点上）
 * 移动端只跑 responsive.spec.ts：桌面用例里有些断言在窄屏本就不成立。
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 浏览器用例在 build 紧邻运行时偶发超时，本地也给一次重试（不是掩盖失败：稳定失败仍会失败）
  retries: 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        // 直接使用系统 / CI 预装的 Chrome，避免下载 ~200MB 的专用浏览器
        channel: 'chrome',
      },
      testIgnore: /responsive\.spec\.ts/,
    },
    // 手机 / 平板：不套用 Playwright 的设备描述符（它们会带上 webkit 浏览器类型，
    // 与 channel: 'chrome' 冲突），直接显式声明视口与触控能力。
    {
      name: 'phone',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
      testMatch: /responsive\.spec\.ts/,
    },
    {
      name: 'tablet',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
      testMatch: /responsive\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
