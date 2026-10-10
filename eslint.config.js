import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['node_modules', 'dist', 'build', 'coverage', '.vitest', '.cache']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['*.config.js', 'scripts/**/*.js', 'tests/**/*.js', 'tests/**/*.jsx'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['src/main.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
