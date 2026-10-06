/* Every page that gets a social card, read from the page sources so
   the cards cannot drift from the site: titles and descriptions come
   from MDX frontmatter or the props an .astro page hands its layout,
   the eyebrow from the page's section in nav.js. */

import { nav } from '../data/nav.js';

const sources = import.meta.glob(['../pages/**/*.{astro,mdx}', '!../pages/examples.astro'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

function meta(path, source) {
  if (path.endsWith('.mdx')) {
    const block = /^---\n([\s\S]*?)\n---\n/.exec(source);
    const read = (key) => {
      const line = block && new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(block[1]);
      return line ? line[1].trim().replace(/^(['"])(.*)\1$/, '$2') : '';
    };
    return { title: read('title'), description: read('description') };
  }
  const tag = /<(?:Base|Doc)\b[^>]*>/.exec(source)?.[0] ?? '';
  const read = (key) => new RegExp(`\\b${key}="([^"]*)"`).exec(tag)?.[1] ?? '';
  return { title: read('title'), description: read('description') };
}

function sectionFor(slug) {
  const section = nav.find((s) => s.groups.some((g) => g.items.some((item) => item.slug === slug)));
  return section?.heading ?? 'Documentation';
}

/* The card's file name for a URL path: "/" is "index",
   "/docs/mobile/buttons/" is "docs/mobile/buttons". */
export function cardSlug(pathname) {
  return pathname.replace(/^\/|\/$/g, '') || 'index';
}

export const cards = Object.entries(sources).map(([path, source]) => {
  const route = path
    .replace('../pages/', '')
    .replace(/\.(astro|mdx)$/, '')
    .replace(/(^|\/)index$/, '');
  const { title, description } = meta(path, source);
  const home = route === '';

  return {
    slug: route || 'index',
    address: `puppertino.com${route ? `/${route}` : ''}`,
    eyebrow: home ? 'CSS framework' : sectionFor(`${route}/`),
    title: home ? 'Puppertino' : title,
    description,
  };
});
