import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hci-nerdz.github.io',
  base: '/context-edge',
  trailingSlash: 'always',
  integrations: [
    solid({ include: ['**/solid/**'] }),
    react({ include: ['**/react/**'] }),
    svelte(),
    sitemap(),
  ],
});
