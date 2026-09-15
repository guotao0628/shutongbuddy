import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 4321);
const BASE_PATH = process.env.BASE_PATH || '/shutongbuddy/';
const BASE_URL = `http://localhost:${PORT}${BASE_PATH}`;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'chromium',
      // 直接用系统 / CI 预装的 Chrome，避免下载 ~200MB 的专用浏览器
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
