import { h } from './h.js';
import { FONT } from './generate.js';

const COLORS = {
  text: '#FFFFFF',
  secondary: 'rgba(235, 235, 245, 0.6)',
  tertiary: 'rgba(235, 235, 245, 0.4)',
  blue: '#0A84FF',
  backdrop: '#0E0E10',
  window: '#1C1C1E',
  titlebar: '#2A2A2C',
  hairline: 'rgba(255, 255, 255, 0.1)',
  trafficLights: ['#FF5F57', '#FEBC2E', '#28C840'],
};

/* Cuts at the last whole word that fits. */
function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[.,;:]$/, '')}…`;
}

function titlebar(address) {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: 56,
        backgroundColor: COLORS.titlebar,
        borderBottom: `1px solid ${COLORS.hairline}`,
      },
    },
    h(
      'div',
      { style: { display: 'flex', gap: 9, position: 'absolute', left: 22, top: 21 } },
      COLORS.trafficLights.map((color) =>
        h('div', { style: { width: 14, height: 14, borderRadius: 7, backgroundColor: color } })
      )
    ),
    h('span', { style: { fontSize: 17, fontWeight: 600, color: COLORS.secondary } }, address)
  );
}

/* One card for every page: the page drawn as a macOS window over a
   tinted backdrop.

   ┌──────────────────────────────────────────┐
   │ ● ● ●        puppertino.com/docs/…       │  title bar
   │──────────────────────────────────────────│
   │  Eyebrow                                 │
   │  Title                                   │
   │  Description                             │
   │                                          │
   │  [logo] Puppertino            Version x  │
   └──────────────────────────────────────────┘ */
export function pageTemplate({ eyebrow, title, description, address, version, logo }) {
  const body = h(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        padding: '40px 56px 36px',
      },
    },
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h('span', { style: { fontSize: 26, fontWeight: 600, color: COLORS.blue } }, eyebrow),
      h(
        'span',
        {
          style: {
            fontSize: title.length > 20 ? 68 : 80,
            fontWeight: 700,
            letterSpacing: title.length > 20 ? -2.4 : -3,
            lineHeight: 1.1,
            color: COLORS.text,
            marginTop: 10,
          },
        },
        truncate(title, 40)
      ),
      h(
        'span',
        {
          style: {
            fontSize: 28,
            lineHeight: 1.36,
            letterSpacing: -0.3,
            color: COLORS.secondary,
            marginTop: 18,
            maxWidth: 900,
          },
        },
        truncate(description, 165)
      )
    ),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 14 } },
        h('img', { src: logo, width: 48, height: 48 }),
        h('span', { style: { fontSize: 28, fontWeight: 600, letterSpacing: -0.6, color: COLORS.text } }, 'Puppertino')
      ),
      h('span', { style: { fontSize: 20, color: COLORS.tertiary } }, `Version ${version}`)
    )
  );

  return h(
    'div',
    {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: 48,
        fontFamily: FONT,
        backgroundColor: COLORS.backdrop,
        backgroundImage:
          'radial-gradient(circle at 0% 0%, rgba(10, 132, 255, 0.14) 0%, rgba(10, 132, 255, 0) 55%), radial-gradient(circle at 100% 100%, rgba(191, 90, 242, 0.1) 0%, rgba(191, 90, 242, 0) 55%)',
      },
    },
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          borderRadius: 26,
          border: `1px solid ${COLORS.hairline}`,
          backgroundColor: COLORS.window,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 24px 60px rgba(0, 0, 0, 0.5)',
        },
      },
      titlebar(address),
      body
    )
  );
}
