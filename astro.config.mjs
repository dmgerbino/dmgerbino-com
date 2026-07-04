import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.dmgerbino.com',
  trailingSlash: 'never',
  output: 'static',            // every content page is fully static
  adapter: vercel(),           // needed only for Keystatic's server routes
  integrations: [mdx(), react(), sitemap(), keystatic()],
});
