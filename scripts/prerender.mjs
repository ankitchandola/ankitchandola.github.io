import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { render, renderHome } from '../.build/entry-server.js';
import projects from '../src/content/projects.json' with { type: 'json' };
const site = 'https://ankitchandola.github.io';
let home = await readFile('dist/index.html', 'utf8');

await writeFile(
  'dist/index.html',
  home
    .replace('<!--home-html-->', renderHome())
    .replace(
      '</head>',
      '<link rel="stylesheet" href="/assets/theme.css"></head>',
    ),
);
const template = (await readFile('dist/case.html', 'utf8')).replace(
  '</head>',
  '<link rel="stylesheet" href="/assets/theme.css"></head>',
);
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const lite =
  'Ankit Chandola’s portfolio without scripts or animation. Current work, selected projects and experience.';
const pages = Object.fromEntries([
  ...projects.map((p) => [
    '/work/' + p.slug,
    {
      title: p.name,
      description: p.summary,
      image: p.images[0] && `/assets/projects/${p.images[0][0]}.png`,
    },
  ]),
  [
    '/play',
    {
      title: 'Ricochet',
      description:
        'A small puzzle: turn the mirrors so the beam bounces into the target.',
    },
  ],
  ['/lite', { title: 'Lite reading version', description: lite }],
  ['/404', { title: 'Page not found' }],
]);
const meta = (route, { title, description, image }) => {
  const full = `${title} — Ankit Chandola`;
  let tags = `<meta property="og:title" content="${esc(full)}"><meta property="og:type" content="website"><meta property="og:url" content="${site}${route}/">`;
  if (description)
    tags += `<meta name="description" content="${esc(description)}"><meta property="og:description" content="${esc(description)}">`;
  tags += image
    ? `<meta property="og:image" content="${site}${image}"><meta name="twitter:card" content="summary_large_image">`
    : '<meta name="twitter:card" content="summary">';
  return [full, tags];
};
for (const [route, page] of Object.entries(pages)) {
  const [title, tags] = meta(route, page);
  const dir = `dist${route}`;
  await mkdir(dir, { recursive: true });
  let html = template
    .replace('<!--app-html-->', render(route))
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`);
  if (route !== '/404')
    html = html.replace(
      '</head>',
      `${tags}<link rel="canonical" href="${site}${route}/"></head>`,
    );
  if (route === '/lite')
    html = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '')
      .replace(/<button class="theme-toggle"[\s\S]*?<\/button>/g, '');
  await writeFile(`${dir}/index.html`, html);
  if (route === '/404') await writeFile('dist/404.html', html);
}
await unlink('dist/case.html');
const sitemap = [
  '/',
  ...Object.keys(pages)
    .filter((route) => route !== '/404')
    .map((route) => route + '/'),
];
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap.map((p) => `<url><loc>${site}${p}</loc></url>`).join('')}</urlset>\n`,
);
console.log(
  'Prerendered interactive v2 homepage, project details, lite, 404 and sitemap.',
);
