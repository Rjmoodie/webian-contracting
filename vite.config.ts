import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

/**
 * Strip the `crossorigin` attribute from built HTML.
 *
 * Vite adds `crossorigin` to <script type="module">, <link rel="modulepreload">,
 * and <link rel="stylesheet"> tags. For same-origin hosting on SiteGround (and
 * similar hosts that don't send Access-Control-Allow-Origin), Safari silently
 * refuses to load those resources in CORS mode, resulting in a blank page.
 * Chrome is more lenient and still loads them.
 */
function stripCrossOrigin(): Plugin {
  return {
    name: 'strip-crossorigin',
    enforce: 'post',
    transformIndexHtml(html: string) {
      return html.replace(/ crossorigin/g, '')
    },
  }
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    stripCrossOrigin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    // Explicit Safari 14+ target for cross-browser compatibility
    target: ['es2020', 'chrome87', 'firefox78', 'safari14', 'edge88'],
    // Prevent crossorigin attribute on scripts (causes issues on some hosts with Safari)
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        // Single vendor chunk: React + React-DOM + all Radix in one chunk so
        // there is only one React instance. Prevents "r is not a function" on
        // Hostinger (and any host) when chunks load in different order or cache.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom/') || id.includes('react-dom\\')) return 'vendor'
            if ((id.includes('/react/') || id.includes('\\react\\')) && !id.includes('react-')) return 'vendor'
            if (id.includes('@radix-ui/')) return 'vendor'
          }
          return undefined
        },
      },
    },
  },
})
