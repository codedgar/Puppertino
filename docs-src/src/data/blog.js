/* Shared helpers for the blog pages, the feed and the social cards. */

import { getCollection } from 'astro:content';
import { nav } from './nav.js';

/* Every post that should be visible, newest first. Drafts show in dev
   so they can be previewed, and never reach a production build. */
export async function posts() {
  const all = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const postHref = (base, post) => `${base}blog/${post.id}/`;

export function formatDate(date, month = 'long') {
  return date.toLocaleDateString('en-US', { year: 'numeric', month, day: 'numeric', timeZone: 'UTC' });
}

/* Minutes at 220 words per minute, with code blocks counted as text. */
export function readingTime(body = '') {
  const words = body.replace(/^---[\s\S]*?---/, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/* Labels for the docs slugs a post lists under `related`. */
const flatNav = nav.flatMap((section) => [
  { slug: section.hub, label: `${section.heading} overview`, section: section.heading, icon: section.icon },
  ...section.groups.flatMap((group) =>
    group.items.map((item) => ({ slug: item.slug, label: item.label, section: section.heading, icon: item.icon }))
  ),
]);

export function relatedDocs(base, slugs = []) {
  return slugs
    .map((slug) => flatNav.find((item) => item.slug === slug))
    .filter(Boolean)
    .map((item) => ({ ...item, href: `${base}${item.slug}` }));
}
