import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

export default defineConfig({
  site: 'https://codedgar.github.io',
  base: '/Puppertino/',
  trailingSlash: 'always',
  integrations: [mdx()],
})
