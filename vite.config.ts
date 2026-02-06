import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
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
