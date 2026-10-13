/**
 * Oros Desktop Dev Launcher
 * Starts the Vite dev server then launches Electron pointing at it.
 * Usage: node scripts/electron-dev.mjs  (or pnpm electron:dev)
 */

import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

let electronProcess = null

async function startVite() {
  const server = await createServer({
    configFile: path.join(root, 'vite.config.ts'),
    root
  })
  await server.listen()
  const info = server.resolvedUrls
  const url = info?.local[0] ?? 'http://localhost:5173'
  console.log(`\n  🏔  Oros Vite server running at: ${url}\n`)
  return url
}

function launchElectron(viteUrl) {
  const electronBin = path.join(root, 'node_modules', '.bin', 'electron')

  // Build preload first so it's available
  console.log('  📦  Pre-building Electron processes...\n')
  const { spawnSync } = await import('node:child_process').then(m => m)

  electronProcess = spawn(
    electronBin,
    ['.'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_DEV_SERVER_URL: viteUrl
      },
      cwd: root
    }
  )

  electronProcess.on('close', (code) => {
    console.log(`\n  Electron closed with code ${code}`)
    process.exit(code ?? 0)
  })
}

// ---- Main ----
const url = await startVite()

// We need to build preload/main first for the IPC bridge to be available.
// The vite-plugin-electron handles this when vite runs — just launch electron.
setTimeout(() => launchElectron(url), 3500)
