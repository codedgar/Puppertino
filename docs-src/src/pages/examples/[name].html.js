/* The v1 docs pages lived at /examples/<name>.html. Each one is emitted
   here as a static page that forwards to its v2 equivalent. An endpoint
   is used because Astro's `redirects` config would build these as
   /examples/<name>.html/index.html. */
const redirects = {
  'getting-started': 'docs/getting-started/',
  'color_palette': 'docs/colors/',
  'shadows': 'docs/materials/',
  'layout': 'docs/typography/',
  'dark_mode': 'docs/dark-mode/',
  'icons': 'docs/icons/',
  'buttons': 'docs/mobile/buttons/',
  'forms': 'docs/mobile/forms/',
  'modals': 'docs/mobile/modals/',
  'actions': 'docs/mobile/actions/',
  'tabs': 'docs/mobile/tabs/',
  'segmented_controls': 'docs/desktop/segmented-controls/',
};

export function getStaticPaths() {
  return Object.entries(redirects).map(([name, target]) => ({
    params: { name },
    props: { target },
  }));
}

export function GET({ props, site }) {
  const path = `${import.meta.env.BASE_URL}${props.target}`;
  const canonical = new URL(path, site);

  const html = `<!doctype html>
<meta charset="utf-8">
<title>Redirecting to ${path}</title>
<meta http-equiv="refresh" content="0;url=${path}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${canonical}">
<a href="${path}">This page has moved to ${path}</a>
`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
