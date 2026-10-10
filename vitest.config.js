import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}', 'test/**/*.test.{js,jsx}'],
    exclude: ['tests/offline/**'],
    setupFiles: ['./tests/setup.js'],
  },
}))
