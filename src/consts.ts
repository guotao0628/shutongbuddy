import version from './data/version.json';

/**
 * 图书与仓库的全局常量。
 *
 * 注意：本手册不是清华大学出版社的出版物，而是《大模型Agent应用开发》的辅助读物。
 * 因此全站不得再出现「清华大学出版社」作为本书出版方的表述，
 * 统一改为 COMPANION.statement。
 */
export const BOOK = {
  title: 'DeepSeek Harness 应用开发实践',
  subtitle: '基于 DeepSeek Harness 的智能体应用开发实战手册',
  author: '郭涛、李勇永',
  /** 署名用（封面、分享卡片、元信息） */
  authors: ['郭涛', '李勇永'] as const,
  email: 'guotao3s@163.com',
} as const;

/** 本手册的定位：配套读物 + 主书链接与声明文案 */
export const COMPANION = {
  title: '大模型Agent应用开发',
  url: 'https://www.tup.tsinghua.edu.cn/booksCenter/book_10674101.html',
  /** 纯文本场景（分享卡片、PDF/DOCX 封面、meta 描述）用这句 */
  statement: '本手册是《大模型Agent应用开发》辅助读物。',
} as const;

/** 声明文案里的书名部分，供 Markdown/MDX 做超链接时复用 */
export const COMPANION_LINK = `[《${COMPANION.title}》](${COMPANION.url})`;

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
    note: 'A5 书版印刷版式，宋体 9.5pt，含页码目录，适合打印',
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
