// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

/**
 * 仓库 / 站点信息全部从环境变量推导，改仓库名不需要改这个文件。
 * 本地开发时回落到默认值。
 */
const OWNER = process.env.GITHUB_REPOSITORY_OWNER ?? 'guotao0628';
const REPO = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'shutongbuddy';
const SITE = process.env.SITE_URL ?? `https://${OWNER}.github.io`;
const BASE = process.env.BASE_PATH ?? `/${REPO}/`;
const GITHUB = `https://github.com/${OWNER}/${REPO}`;

const BOOK_TITLE = 'DeepSeek Harness 应用开发实践';
const BOOK_DESC =
  '基于 DeepSeek Harness 的智能体应用开发实战手册：插件架构、多模型接入、插件开发与多智能体协同。郭涛 著，清华大学出版社。';

export default defineConfig({
  site: SITE,
  base: BASE,
  integrations: [
    starlight({
      title: BOOK_TITLE,
      description: BOOK_DESC,
      logo: { src: './src/assets/logo.svg', alt: 'ShuTongBuddy' },
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: GITHUB }],
      customCss: ['./src/styles/book.css'],
      lastUpdated: true,
      pagination: true,
      credits: false,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      editLink: { baseUrl: `${GITHUB}/edit/main/` },
      components: {
        Head: './src/components/Head.astro',
      },
      sidebar: [
        {
          label: '前置',
          items: [
            { label: '本书内容简介', slug: 'brief' },
            { label: '作者简介', slug: 'author' },
            { label: '自序', slug: 'preface' },
          ],
        },
        {
          label: '第一部分　入门',
          collapsed: false,
          items: [
            { label: '第 1 章 快速上手：十分钟跑通 DeepSeek Harness', slug: 'part1/ch1' },
            { label: '第 2 章 架构解析：万物皆插件意味着什么', slug: 'part1/ch2' },
          ],
        },
        {
          label: '第二部分　部署与模型',
          collapsed: false,
          items: [
            { label: '第 3 章 安装部署与 Web UI', slug: 'part2/ch3' },
            { label: '第 4 章 多模型 API 接入', slug: 'part2/ch4' },
          ],
        },
        {
          label: '第三部分　插件与智能体',
          collapsed: false,
          items: [
            { label: '第 5 章 插件开发实战：ShuTongBuddy 备考助手插件', slug: 'part3/ch5' },
            { label: '第 6 章 智能体构建原理：Turn、装配、上下文与委托', slug: 'part3/ch6' },
          ],
        },
        {
          label: '第四部分　实战案例',
          collapsed: false,
          items: [
            { label: '第 7 章 实例一：备考资料库体检智能体', slug: 'part4/ch7' },
            { label: '第 8 章 实例二：ShuTongBuddy Studio（Web 备考助手）', slug: 'part4/ch8' },
          ],
        },
        {
          label: '结语与附录',
          collapsed: false,
          items: [
            { label: '结束语：智能体工程及其未来发展方向', slug: 'epilogue' },
            { label: '附录：速查表与术语表', slug: 'appendix' },
          ],
        },
      ],
    }),
  ],
});
