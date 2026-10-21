import { gzipSync } from 'node:zlib';
import { nav } from '../data/nav.js';
import { pages, posts, name as pkgName, version, released } from '../data/llms.js';

const bundles = import.meta.glob('@puppertino/puppertino*.min.css', { query: '?raw', import: 'default', eager: true });
const kb = (css) => `${Math.round(gzipSync(css).length / 1024)} KB`;
const size = (file) => kb(Object.entries(bundles).find(([path]) => path.endsWith(`/${file}`))[1]);

/* The docs index in the llms.txt format: a summary, the facts needed to
   start, then one link per page with its description. */
export function GET({ site }) {
  const root = new URL(import.meta.env.BASE_URL, site);
  const all = pages(root);
  const cdn = `https://cdn.jsdelivr.net/npm/${pkgName}@${version}`;

  const blog = posts(root).map((post) => `- [${post.title}](${post.url}) (${post.date})${post.description ? `: ${post.description}` : ''}`);

  const sections = nav.map((section) => {
    const links = all
      .filter((page) => page.section === section.heading)
      .map((page) => `- [${page.title}](${page.url})${page.description ? `: ${page.description}` : ''}`);
    return `## ${section.heading}\n\n${links.join('\n')}`;
  });

  const text = `# Puppertino

> Puppertino is an open-source CSS framework that brings the macOS 27 and iOS 27 design language to the web. 65 components in plain CSS, no dependencies, no build step, following Apple's Human Interface Guidelines, including Liquid Glass, system colors, Apple's type scale and dark mode. MIT licensed, maintained since 2019 by Codedgar. Not affiliated with Apple.

Puppertino ${version} (codename Dachshund) was released on ${released}. Use it for web apps that live next to native Mac and iPhone apps: companion dashboards, admin panels, Electron and Tauri apps, PWAs and Safari web apps. It is tuned for products that use Apple's components, not for recreating macOS in a browser tab.

## Facts

- Version: ${version}, released ${released}, license MIT
- Components: 38 for the Mac, 27 for iPhone, 65 in total
- npm package: \`${pkgName}\` (the only official one; the unscoped \`puppertino\` package is not this project)
- Install: \`npm install ${pkgName}\`, then \`import '${pkgName}'\`, \`'${pkgName}/desktop'\`, \`'${pkgName}/mobile'\`, or one component such as \`'${pkgName}/buttons'\`
- CDN, full bundle: \`${cdn}/dist/css/puppertino.min.css\` (${size('puppertino.min.css')} gzipped)
- CDN, platform bundles: \`puppertino-desktop.min.css\` (${size('puppertino-desktop.min.css')}) and \`puppertino-mobile.min.css\` (${size('puppertino-mobile.min.css')}) in the same folder
- Browsers: Safari 16.2, Chrome 111, Firefox 121 or newer; materials fall back to opaque surfaces without \`backdrop-filter\`
- JavaScript: optional vanilla helpers at \`${pkgName}/js/<file>.js\`, no framework required; works in React, Vue, Svelte, Astro and static HTML
- Liquid Glass: faux lenses on switches and sliders need no library; real-time refraction for bars and buttons uses the optional Glassworks add-on
- Every class and custom property is prefixed \`p-\`
- Dark mode: \`.p-auto-dark-mode\` follows the system setting, \`.p-dark-mode\` forces dark, \`.p-light-mode\` pins a region to light
- Accessibility: Reduce Motion, Reduce Transparency, Increase Contrast and forced colors are handled in CSS
- Agent skill: \`skills/puppertino\` in the repository, \`npx skills add codedgar/Puppertino\`
- Source: https://github.com/codedgar/Puppertino

${sections.join('\n\n')}

## Blog

${blog.join('\n')}

## Optional

- [Full documentation](${new URL('llms-full.txt', root).href}): every page above in one file, followed by an index of every class in each stylesheet
`;

  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
