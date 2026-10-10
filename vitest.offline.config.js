import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Usa la instalación local de Chromium si existe. Una ruta configurada por el
// usuario conserva prioridad; sin caché local, Playwright usa su ubicación normal.
const directorioChromiumLocal = fileURLToPath(new URL('./.cache/playwright/', import.meta.url))
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(directorioChromiumLocal)) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = directorioChromiumLocal
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/offline/**/*.test.js'],
    fileParallelism: false,
    testTimeout: 45_000,
    hookTimeout: 45_000,
  },
})
