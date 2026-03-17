import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  server: {
    port: 5174,
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: [
      { find: 'ui/theme.css', replacement: fileURLToPath(new URL('../ui/src/theme.css', import.meta.url)) },
      { find: 'ui/reset.css', replacement: fileURLToPath(new URL('../ui/src/reset.css', import.meta.url)) },
      { find: 'ui', replacement: fileURLToPath(new URL('../ui/src/index.ts', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'schemas', replacement: fileURLToPath(new URL('../schemas/src/index.ts', import.meta.url)) },
      { find: 'api', replacement: fileURLToPath(new URL('../api/src/index.ts', import.meta.url)) },
    ],
  },
})
