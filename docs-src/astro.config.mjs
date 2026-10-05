import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const puppertinoCss = resolve(__dirname, '../dist/css')

export default defineConfig({
  site: 'https://puppertino.com',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    // /examples/ only forwards v1 URLs to the docs, so it stays out.
    sitemap({ filter: (page) => !page.includes('/examples/') }),
  ],
  vite: {
    // Allow Vite to serve files from outside the project root.
    // This is required so the docs site can import CSS directly from
    // the package's `dist/css/` directory without copying files.
    server: {
      fs: {
        allow: [
          resolve(__dirname, '..'), // the entire Puppertino repo
        ],
      },
      // Watch the dist/css directory so HMR fires on edits
      watch: {
        ignored: ['!**/dist/css/**'],
      },
    },
    resolve: {
      alias: {
        '@puppertino': puppertinoCss,
      },
    },
  },
})
