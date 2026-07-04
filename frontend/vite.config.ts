import path from 'path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'react-vendor'
          if (id.includes('node_modules/react') && !id.includes('react-router') && !id.includes('react-dom')) return 'react-vendor'
          if (id.includes('node_modules/react-router')) return 'router'
          if (
            id.includes('node_modules/motion') ||
            id.includes('node_modules/sonner') ||
            id.includes('node_modules/lucide-react') ||
            id.includes('node_modules/cmdk')
          ) return 'ui-vendor'
        },
      },
    },
  },
})
