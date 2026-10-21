import { posts as loadPosts, postHref } from '../../data/blog.js';

const escape = (text) =>
  String(text).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

/* The blog as RSS 2.0: title, summary and date per post. */
export async function GET({ site }) {
  const base = import.meta.env.BASE_URL;
  const posts = await loadPosts();
  const home = new URL(`${base}blog/`, site).href;

  const items = posts
    .map((post) => {
      const url = new URL(postHref(base, post), site).href;
      return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <description>${escape(post.data.description)}</description>
${post.data.tags.map((tag) => `      <category>${escape(tag)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Puppertino blog</title>
    <link>${home}</link>
    <atom:link href="${new URL(`${base}blog/rss.xml`, site).href}" rel="self" type="application/rss+xml" />
    <description>Guides and release notes from Puppertino, the CSS framework for macOS and iOS design on the web.</description>
    <language>en</language>
${posts[0] ? `    <lastBuildDate>${posts[0].data.date.toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
