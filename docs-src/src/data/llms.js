/* Plain-text renditions of the docs, generated at build time for the
   /llms.txt and /llms-full.txt endpoints. Everything here is derived:
   page order and labels from nav.js, titles and prose from the MDX
   sources, variants from the component data modules, and the class
   index from the framework CSS. Nothing is written by hand, so the
   text files cannot drift from the site. */

import { nav } from './nav.js';
import pkg from '../../../package.json';

const sources = import.meta.glob('../pages/docs/**/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const dataModules = import.meta.glob('./components/*.js', {
  import: 'default',
  eager: true,
});

const stylesheets = import.meta.glob(['@puppertino/*.css', '!@puppertino/*.min.css'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const { name, version } = pkg;

/* Entry stylesheets and v1 files superseded by the v2 foundations stay
   out of the class index; their classes are listed under the files that
   replace them. */
const INDEX_SKIP = /^(puppertino(-desktop|-mobile)?|newfull|full|color_palette|layout|shadows)\.css$/;

const WRAPPERS = /^[ \t]*<\/?(SwatchGrid|MaterialGrid|ShadowGrid)>[ \t]*\n/gm;

function sourceFor(slug) {
  return sources[`../pages/${slug.replace(/\/$/, '')}.mdx`];
}

function frontmatter(source) {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(source);
  const read = (key) => {
    const line = block && new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(block[1]);
    return line ? line[1].trim().replace(/^(['"])(.*)\1$/, '$2') : '';
  };
  return {
    title: read('title'),
    description: read('description'),
    body: block ? source.slice(block[0].length) : source,
  };
}

/* Every documented page in sidebar order. Hub pages are tile grids over
   the same links, so they are left out. */
export function pages(root) {
  return nav.flatMap((section) =>
    section.groups.flatMap((group) =>
      group.items.flatMap((item) => {
        const source = sourceFor(item.slug);
        if (!source) return [];
        const { title, description, body } = frontmatter(source);
        return [
          {
            section: section.heading,
            title: title || item.label,
            description,
            url: new URL(item.slug, root).href,
            body,
          },
        ];
      })
    )
  );
}

/* Reads one JSX tag starting at `start` and returns its name, props and
   end offset. Showcase snippets contain "/>" and braces of their own,
   so the tag is scanned rather than matched with a pattern. */
function readTag(text, start) {
  const name = /^<([A-Z]\w*)/.exec(text.slice(start))[1];
  const props = {};
  let i = start + name.length + 1;

  while (i < text.length) {
    while (/\s/.test(text[i])) i++;
    if (text.startsWith('/>', i)) return { name, props, end: i + 2 };
    if (text[i] === '>') return { name, props, end: i + 1 };

    const key = /^[\w-]+/.exec(text.slice(i));
    if (!key) return { name, props, end: i + 1 };
    i += key[0].length;

    if (text[i] !== '=') {
      props[key[0]] = true;
      continue;
    }
    i++;

    if (text[i] === '"' || text[i] === "'") {
      const close = text.indexOf(text[i], i + 1);
      props[key[0]] = text.slice(i + 1, close);
      i = close + 1;
      continue;
    }

    /* {expression}: walk to the matching brace, skipping template
       literals and quoted strings. */
    let depth = 0;
    let quote = null;
    const open = i;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = null;
      } else if (ch === '`' || ch === '"' || ch === "'") quote = ch;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) break;
    }
    const expression = text.slice(open + 1, i).trim();
    i++;
    props[key[0]] = /^`[\s\S]*`$/.test(expression)
      ? expression.slice(1, -1).replace(/\\([`$\\])/g, '$1')
      : expression === 'false'
        ? false
        : { expression };
  }
  return { name, props, end: i };
}

const words = (key) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

/* A demo component becomes one list line built from its props, e.g.
   "- Red: css var `--p-sys-red`, light hex #FF383C, dark hex #FF4245". */
function describe(props) {
  const { name, label, sample, ...rest } = props;
  const head = name || label;
  const parts = Object.entries(rest).flatMap(([key, value]) => {
    if (value === true || value === false) return [];
    if (typeof value === 'object') {
      const rows = value.expression.match(/\{[^{}]*\}/g) || [];
      return rows.map((row) =>
        (row.match(/'[^']*'|"[^"]*"/g) || [])
          .map((v) => v.slice(1, -1))
          .map((v) => (v.startsWith('--') ? `\`${v}\`` : v))
          .join(' ')
      );
    }
    if (key === 'className') return [`\`.${value}\``];
    return [`${words(key)} ${value.startsWith('--') ? `\`${value}\`` : value}`];
  });
  if (!head && !parts.length) return '';
  return `- ${[head, parts.join(', ')].filter(Boolean).join(': ')}`;
}

/* Generated code blocks sit behind a placeholder until the raw-markup
   pass has run, so it cannot mistake their contents for page markup. */
const held = [];
const hold = (block) => `\u0000${held.push(block) - 1}\u0000`;
const release = (text) => text.replace(/\u0000(\d+)\u0000/g, (_, n) => held[n]);

function variantSections(moduleName) {
  const data = dataModules[`./components/${moduleName}.js`];
  if (!data) return '';
  return data.variants
    .map((v) => `### ${v.label}\n\n${hold(`\`\`\`html\n${v.code}\n\`\`\``)}\n\n${v.use}\n`)
    .join('\n');
}

function replaceTags(text) {
  let out = '';
  let cursor = 0;
  const opener = /<[A-Z]\w*/g;
  let match;
  while ((match = opener.exec(text))) {
    const tag = readTag(text, match.index);
    out += text.slice(cursor, match.index).replace(/[ \t]+$/, '');
    if (tag.name === 'Showcase') {
      const markup = typeof tag.props.snippet === 'string' ? tag.props.snippet : tag.props.code;
      out += hold(`\`\`\`html\n${markup}\n\`\`\``);
    } else {
      out += describe(tag.props);
    }
    cursor = opener.lastIndex = tag.end;
  }
  return out + text.slice(cursor);
}

/* Bespoke preview markup (an element opening a line of its own, outside
   any code fence) is staging for the browser: wallpapers, inline demo
   styles, ids. The page's code blocks carry the canonical markup, so the
   whole element is dropped. */
function dropRawBlocks(text) {
  const lines = text.split('\n');
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    /* A bare wrapper around Markdown ("<div class="p-type">", a blank
       line, content, "</div>") loses its two tag lines and keeps the
       content. */
    if (/^<\/[a-z][\w-]*>\s*$/.test(lines[i])) continue;
    if (/^<[a-z][^>]*>\s*$/.test(lines[i]) && lines[i + 1] === '') continue;

    const open = /^<([a-z][\w-]*)\b/.exec(lines[i]);
    if (!open) {
      kept.push(lines[i]);
      continue;
    }
    const tag = open[1];
    const opens = new RegExp(`<${tag}\\b(?![^>]*/>)`, 'g');
    const closes = new RegExp(`</${tag}>`, 'g');
    let depth = 0;
    let j = i;
    for (; j < lines.length; j++) {
      depth += (lines[j].match(opens) || []).length - (lines[j].match(closes) || []).length;
      if (depth <= 0) break;
    }
    /* An inline element that opens a paragraph ("<kbd>K</kbd> opens…")
       closes on its own line with prose after it: keep those. */
    if (j === i && !new RegExp(`</${tag}>\\s*$|/>\\s*$`).test(lines[i])) {
      kept.push(lines[i]);
      continue;
    }
    i = j;
  }
  return kept.join('\n');
}

/* MDX → Markdown: fenced code passes through untouched; everywhere
   else, imports and scripts go, demos become their markup or a list
   line, and relative links become absolute. */
export function toMarkdown(body, pageUrl) {
  return body
    .split(/(^```[\s\S]*?^```[ \t]*$)/m)
    .map((chunk) => {
      if (chunk.startsWith('```')) return chunk;
      let text = chunk
        .replace(/^(import|export) .*\n/gm, '')
        .replace(/^<(script|style)\b[\s\S]*?<\/\1>[ \t]*\n/gm, '')
        .replace(WRAPPERS, '')
        .replace(/^\{(\w+)\.variants\.map\(.*\)\}[ \t]*$/gm, (_, name) => variantSections(name));
      text = release(dropRawBlocks(replaceTags(text))).replace(/^(- .*)\n\n(?=- )/gm, '$1\n');
      return text.replace(/\]\((\.{1,2}\/[^)\s]*)\)/g, (_, href) => `](${new URL(href, pageUrl).href})`);
    })
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* Every `.p-` class each stylesheet defines, in bundle order. */
export function classIndex() {
  return Object.entries(stylesheets)
    .map(([path, css]) => [path.split('/').pop(), css])
    .filter(([file]) => !INDEX_SKIP.test(file))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, css]) => {
      const found = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.p-[a-zA-Z][\w-]*/g) || [];
      return { file, classes: [...new Set(found)].sort() };
    })
    .filter(({ classes }) => classes.length);
}
