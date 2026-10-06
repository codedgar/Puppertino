import { nav } from '../data/nav.js';
import { pages, name as pkgName, version } from '../data/llms.js';

/* The docs index in the llms.txt format: a summary, the facts needed to
   start, then one link per page with its description. */
export function GET({ site }) {
  const root = new URL(import.meta.env.BASE_URL, site);
  const all = pages(root);
  const cdn = `https://cdn.jsdelivr.net/npm/${pkgName}@${version}`;

  const sections = nav.map((section) => {
    const links = all
      .filter((page) => page.section === section.heading)
      .map((page) => `- [${page.title}](${page.url})${page.description ? `: ${page.description}` : ''}`);
    return `## ${section.heading}\n\n${links.join('\n')}`;
  });

  const text = `# Puppertino

> A CSS framework that brings macOS and iOS aesthetics to the web, following Apple's Human Interface Guidelines. Plain CSS with optional vanilla JavaScript helpers, no dependencies and no build step.

- Version: ${version}
- Full bundle: \`${cdn}/dist/css/puppertino.min.css\`
- Platform bundles: \`puppertino-desktop.min.css\` and \`puppertino-mobile.min.css\` in the same folder
- npm: \`npm install ${pkgName}\`, then \`import '${pkgName}'\`, \`'${pkgName}/desktop'\`, \`'${pkgName}/mobile'\`, or one component such as \`'${pkgName}/buttons'\`
- JavaScript helpers: \`${pkgName}/js/<file>.js\`, each documented on the page of the component it drives
- Every class and custom property is prefixed \`p-\`
- Dark mode: \`.p-auto-dark-mode\` follows the system setting, \`.p-dark-mode\` forces dark, \`.p-light-mode\` pins a region to light

${sections.join('\n\n')}

## Optional

- [Full documentation](${new URL('llms-full.txt', root).href}): every page above in one file, followed by an index of every class in each stylesheet
`;

  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
