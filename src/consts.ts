import version from './data/version.json';

/** 图书与仓库的全局常量 */
export const BOOK = {
  title: 'DeepSeek Harness 应用开发实践',
  subtitle: '基于 DeepSeek Harness 的智能体应用开发实战手册',
  author: '郭涛',
  press: '清华大学出版社',
  email: 'guotao3s@163.com',
} as const;

export const REPO = {
  owner: process.env.GITHUB_REPOSITORY_OWNER ?? 'guotao0628',
  name: process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'shutongbuddy',
} as const;

export const REPO_URL = `https://github.com/${REPO.owner}/${REPO.name}`;

/** 构建期写入的版本信息（scripts/prepare-assets.mjs 生成） */
export const VERSION = version as {
  version: string;
  commit: string;
  updatedAt: string;
  builtAt: string;
};

/** 下载资源（放在 public/downloads/） */
export const DOWNLOADS = [
  {
    name: 'PDF（A5 印刷版式）',
    file: 'downloads/deepseek-harness-in-practice.pdf',
    note: '仿清华社版式，A5 / 宋体 9.5pt，含页码目录，适合打印',
  },
  {
    name: 'EPUB（电子书）',
    file: 'epub/deepseek-harness-in-practice.epub',
    note: '每次构建自动生成，适配手机与电纸书阅读器',
  },
  {
    name: 'Markdown（单文件全文）',
    file: 'downloads/deepseek-harness-in-practice.md',
    note: '合并后的纯 Markdown，便于二次加工与离线检索',
  },
  {
    name: 'Markdown 打包（ZIP）',
    file: 'downloads/shutongbuddy-book.zip',
    note: '全书 Markdown + 说明文件',
  },
] as const;

/**
 * 首页人工置顶的搜索词（会排在构建期统计出的高频概念之前）。
 * 其余热词由 scripts/prepare-assets.mjs 从书稿实际词频生成。
 */
export const PINNED_SEARCHES = ['能力接缝', 'PTC', 'settings.yaml'] as const;
