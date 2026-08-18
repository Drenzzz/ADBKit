import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'bindings']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
      // React Compiler (eslint-plugin-react-hooks v6 RC) advisory perf hints,
      // not correctness bugs — keep visible as warnings, do not block builds.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/incompatible-library': 'warn',
    },
  },
  {
    // shadcn/ui primitives intentionally co-locate cva variant exports with
    // their components; Fast Refresh is irrelevant for these leaf files.
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/App.tsx', 'src/components/scrcpy/EncoderBadge.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
