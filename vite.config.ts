import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig({
  // Baked in at build time so server and client render the same year —
  // no hydration mismatch, refreshed on every deploy.
  define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      // ADR-001: prerender every route at build time (SSG-grade SEO), while
      // the Worker keeps full SSR capability for future dynamic routes.
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoSubfolderIndex: true,
        // Keep hash fragments (/#work) and trailing-slash duplicates
        // (/blog/ vs /blog) out of the page set — and the sitemap.
        filter: (page) =>
          !page.path.includes('#') &&
          (page.path === '/' || !page.path.endsWith('/')),
      },
      // Framework-native sitemap — generated from the prerendered pages.
      sitemap: {
        enabled: true,
        host: 'https://indr.web.id',
      },
    }),
    viteReact(),
  ],
})

export default config
