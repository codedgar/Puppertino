import { generateOgImage, loadLogo } from '../../og/generate.js';
import { pageTemplate } from '../../og/template.js';
import { cards } from '../../og/pages.js';
import { version } from '../../data/llms.js';

/* One 1200×630 social card per page, rendered at build time. Base.astro
   points each page's og:image at the card with the matching path. */
export function getStaticPaths() {
  return cards.map((card) => ({ params: { slug: card.slug }, props: { card } }));
}

export async function GET({ props }) {
  const png = await generateOgImage(pageTemplate({ ...props.card, version, logo: await loadLogo() }));

  return new Response(png, {
    headers: { 'Content-Type': 'image/png' },
  });
}
