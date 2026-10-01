import { pages, toMarkdown, classIndex, version } from '../data/llms.js';

/* Every docs page as Markdown in one file, then the class index. */
export function GET({ site }) {
  const root = new URL(import.meta.env.BASE_URL, site);

  const docs = pages(root).map((page) => {
    const heading = page.section === 'Foundations' ? page.title : `${page.section}: ${page.title}`;
    return [
      `# ${heading}`,
      `Source: ${page.url}`,
      page.description,
      toMarkdown(page.body, page.url),
    ]
      .filter(Boolean)
      .join('\n\n');
  });

  const index = classIndex()
    .map(({ file, classes }) => `## ${file}\n\n${classes.join(' ')}`)
    .join('\n\n');

  const text = `# Puppertino ${version}

> The complete Puppertino documentation in one file. Each page starts with a top-level heading and its source URL. An index of every class in each stylesheet closes the file.

${docs.join('\n\n---\n\n')}

---

# Class index

Every \`.p-\` class each stylesheet defines. Import one stylesheet with \`@codedgar/puppertino/css/<file>\`.

${index}
`;

  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
