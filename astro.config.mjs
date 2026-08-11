import { defineConfig } from 'astro/config';
import solid from '@astrojs/solid-js';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://hci-nerdz.github.io',
  base: '/context-rails',
  integrations: [
    solid({ include: ['**/solid/**'] }),
    react({ include: ['**/react/**'] }),
    svelte(),
  ],
});
