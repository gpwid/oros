import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('node_modules/react/')) {
              return 'vendor-react'
            }
            if (id.includes('@xyflow')) {
              return 'vendor-xyflow'
            }
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'vendor-tiptap'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide'
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 650
  }
})
