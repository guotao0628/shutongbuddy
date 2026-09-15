import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { BOOK, VERSION } from '../consts';

/** 阅读顺序（与 astro.config.mjs 侧边栏一致） */
const ORDER = [
  'brief',
  'author',
  'preface',
  'part1/ch1',
  'part1/ch2',
  'part2/ch3',
  'part2/ch4',
  'part3/ch5',
  'part3/ch6',
  'part4/ch7',
  'part4/ch8',
  'epilogue',
  'appendix',
  'glossary',
  'downloads',
  'errata',
];

export async function GET(context: APIContext) {
  const base = import.meta.env.BASE_URL;
  const docs = await getCollection('docs');
  const pubDate = new Date(VERSION.updatedAt);

  const items = ORDER.map((slug) => {
    const entry = docs.find((d) => d.id === slug);
    if (!entry) return null;
    return {
      title: entry.data.title ?? slug,
      description: entry.data.description ?? '',
      link: `${base}${slug}/`,
      pubDate,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return rss({
    title: `${BOOK.title} · 更新`,
    description: BOOK.subtitle,
    site: context.site ?? 'https://guotao0628.github.io',
    items,
    customData: '<language>zh-CN</language>',
  });
}
