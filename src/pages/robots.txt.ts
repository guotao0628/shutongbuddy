import type { APIContext } from 'astro';

export function GET(context: APIContext) {
  const base = import.meta.env.BASE_URL;
  const site = (context.site ?? new URL('https://guotao0628.github.io')).href.replace(/\/$/, '');
  const sitemap = `${site}${base}sitemap-index.xml`;

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# 全书正文均可公开检索',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
