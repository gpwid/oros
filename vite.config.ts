import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/index.ts',
        onstart({ startup }) {
          const hasDisplay =
            process.platform === 'win32' ||
            process.platform === 'darwin' ||
            Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY)
          if (hasDisplay && !process.env.OROS_SKIP_ELECTRON_AUTOSTART) {
            startup()
          }
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      preload: {
        input: 'src/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: 'preload.cjs'
              }
            }
          }
        }
      },
      renderer: {}
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
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
