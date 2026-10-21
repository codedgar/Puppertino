import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Blog posts: one MDX file per post in src/content/blog/. The file name
   is the URL slug, so "liquid-glass-in-css.mdx" is /blog/liquid-glass-in-css/. */
const blog = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      /* Shown as "Updated" and sent as dateModified when set. */
      updated: z.coerce.date().optional(),
      author: z.string().default('Edgar Pérez'),
      tags: z.array(z.string()).default([]),
      /* Featured image, relative to the post file. Drawn above the post,
         on the index cards and on the social card. */
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /* Phosphor icon for posts without a cover (ph-article, ph-drop…). */
      icon: z.string().default('ph-article'),
      /* Lead card on the blog index. The newest featured post wins. */
      featured: z.boolean().default(false),
      /* Drafts build in dev and are left out of production builds. */
      draft: z.boolean().default(false),
      /* Docs pages the post builds on, as nav.js slugs ("docs/materials/"). */
      related: z.array(z.string()).default([]),
      /* Questions people type, answered in one paragraph each. Rendered
         at the end of the post and sent as FAQPage structured data. */
      faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    }),
});

export const collections = { blog };
