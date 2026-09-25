import { defineConfig } from 'vite'

export default defineConfig({
  // MapLibre alone is ~1 MB minified (~280 kB gzipped), so the default 500 kB warning always fires.
  build: { chunkSizeWarningLimit: 1200 },
})
