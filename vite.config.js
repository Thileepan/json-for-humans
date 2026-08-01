import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      // Multi-page site: the marketing landing page + the app itself.
      input: {
        landing: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app.html', import.meta.url)),
      },
      output: {
        manualChunks: {
          codemirror: [
            'codemirror',
            '@codemirror/lang-json',
            '@codemirror/lint',
            '@codemirror/view',
            '@codemirror/state',
            '@codemirror/language',
            '@codemirror/commands',
            '@codemirror/theme-one-dark',
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.js'],
    css: false,
  },
})
