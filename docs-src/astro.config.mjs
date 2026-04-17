import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const puppertinoCss = resolve(__dirname, '../dist/css')

export default defineConfig({
  site: 'https://codedgar.github.io',
  base: '/Puppertino/',
  trailingSlash: 'always',
  integrations: [mdx()],
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
