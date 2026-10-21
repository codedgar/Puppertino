import { h } from './h.js';
import { FONT, LOGO_WIDTH, LOGO_HEIGHT, OG_WIDTH } from './generate.js';
import { pageTemplate } from './template.js';

/* A blog post's card. With a cover, the photo fills the top and the
   title sits in a black band under it, so nothing overlaps the art:

   ┌──────────────────────────────────────────┐
   │ [cover, cropped]                         │
   │──────────────────────────────────────────│
   │ [logo] Puppertino · BLOG · OCT 20, 2026  │
   │ Title                                    │
   └──────────────────────────────────────────┘

   Without one, the post uses the same window card as the docs. */

function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[.,;:]$/, '')}…`;
}

export function postTemplate({ title, description, date, cover, logo, version }) {
  if (!cover) {
    return pageTemplate({ eyebrow: 'Blog', title, description, address: 'puppertino.com/blog', version, logo });
  }

  const when = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const long = title.length > 44;

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', fontFamily: FONT, backgroundColor: '#000000' } },
    h('img', { src: cover, width: OG_WIDTH, height: 372 }),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 56px', borderTop: '1px solid rgba(255,255,255,0.12)' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        h('img', { src: logo, width: LOGO_WIDTH * 0.6, height: LOGO_HEIGHT * 0.6 }),
        h('span', { style: { fontSize: 20, fontWeight: 600, color: '#FFFFFF' } }, 'Puppertino'),
        h('span', { style: { fontSize: 20, fontWeight: 600, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' } }, `·  BLOG  ·  ${when.toUpperCase()}`)
      ),
      h(
        'span',
        { style: { fontSize: long ? 42 : 50, fontWeight: 700, letterSpacing: long ? -1.2 : -1.6, lineHeight: 1.12, color: '#FFFFFF', marginTop: 12, maxWidth: 1088 } },
        truncate(title, 80)
      )
    )
  );
}
