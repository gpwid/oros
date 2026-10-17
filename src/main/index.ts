import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net, nativeImage } from 'electron'
import { join, dirname, extname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Register privileged custom protocol for local world assets
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'oros-asset',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

let mainWindow: BrowserWindow | null = null

// Enforce single-instance lock to avoid Windows GPU/Cache access collision
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

const userDataPath = app.getPath('userData')
const vaultPath = join(userDataPath, 'vault')
const assetsPath = join(vaultPath, 'assets')
const dataFilePath = join(vaultPath, 'oros_vault.json')
const backupFilePath = join(vaultPath, 'oros_vault.json.bak')

// Ensure directory tree exists
function ensureDirectories() {
  if (!existsSync(vaultPath)) mkdirSync(vaultPath, { recursive: true })
  if (!existsSync(assetsPath)) mkdirSync(assetsPath, { recursive: true })
}

function loadVaultData(): string | null {
  try {
    ensureDirectories()
    if (existsSync(dataFilePath)) {
      return readFileSync(dataFilePath, 'utf-8')
    }
  } catch (err) {
    console.error('Failed to load vault data:', err)
  }
  return null
}

function saveVaultData(jsonContent: string): boolean {
  try {
    ensureDirectories()
    // Create backup before writing
    if (existsSync(dataFilePath)) {
      try {
        copyFileSync(dataFilePath, backupFilePath)
      } catch (backupErr) {
        console.warn('Could not write backup file:', backupErr)
      }
    }
    writeFileSync(dataFilePath, jsonContent, 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to save vault data:', err)
    return false
  }
}

function getPreloadPath(): string {
  const candidates = [
    join(__dirname, 'preload.cjs'),
    join(__dirname, 'index.cjs'),
    join(__dirname, 'index.mjs')
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return join(__dirname, 'preload.cjs')
}

function getAppIcon(): Electron.NativeImage | undefined {
  const candidates = [
    join(__dirname, '../public/icon.png'),
    join(__dirname, '../dist/icon.png'),
    join(__dirname, '../build/icon.png'),
    join(__dirname, 'icon.png'),
    join(process.cwd(), 'public/icon.png')
  ]
  for (const c of candidates) {
    if (existsSync(c)) {
      try {
        const icon = nativeImage.createFromPath(c)
        if (!icon.isEmpty()) return icon
      } catch (err) {
        console.warn('Failed to load icon from', c, err)
      }
    }
  }
  return undefined
}

function createWindow(): void {
  const preloadPath = getPreloadPath()
  const icon = getAppIcon()

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0e141c',
    title: 'Oros — Worldbuilding Studio',
    icon,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0e141c',
      symbolColor: '#cbd4df',
      height: 36
    },
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.oros.studio')
  }
  ensureDirectories()

  // Protocol handler for oros-asset://<assetFilename>
  protocol.handle('oros-asset', (request) => {
    const url = new URL(request.url)
    // Handle oros-asset://filename.png or oros-asset:///filename.png
    const filename = url.hostname ? `${url.hostname}${url.pathname}` : url.pathname.replace(/^\/+/, '')
    const targetFile = join(assetsPath, decodeURIComponent(filename))

    if (existsSync(targetFile)) {
      return net.fetch(pathToFileURL(targetFile).toString())
    }
    return new Response('Asset not found', { status: 404 })
  })

  // Vault loading & saving
  ipcMain.handle('oros:load-vault', async () => {
    return loadVaultData()
  })

  ipcMain.handle('oros:save-vault', async (_event, content: string) => {
    return saveVaultData(content)
  })

  // Native Image Importer: Copies file into local vault and returns oros-asset:// URL
  ipcMain.handle('oros:import-asset', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Artwork into Oros Vault',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'] }]
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const sourcePath = result.filePaths[0]
    const ext = extname(sourcePath).toLowerCase()
    const id = randomUUID()
    const targetFilename = `${id}${ext}`
    const destinationPath = join(assetsPath, targetFilename)

    copyFileSync(sourcePath, destinationPath)
    return `oros-asset://${targetFilename}`
  })

  ipcMain.handle('oros:select-image', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('oros:export-world', async (_event, fileName: string, content: string) => {
    if (!mainWindow) return false
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Oros World Archive',
      defaultPath: `${fileName}.oros.json`,
      filters: [{ name: 'Oros World Archive', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return false
    writeFileSync(result.filePath, content, 'utf-8')
    return true
  })

  ipcMain.handle('oros:import-world', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Oros World Archive',
      properties: ['openFile'],
      filters: [{ name: 'Oros World Archive', extensions: ['json', 'oros.json'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    try {
      const content = readFileSync(result.filePaths[0], 'utf-8')
      return content
    } catch (err) {
      console.error('Failed to read imported world archive:', err)
      return null
    }
  })

  ipcMain.handle('oros:export-file', async (_event, defaultFileName: string, content: string, extension: string = 'md', filterName: string = 'Markdown Document') => {
    if (!mainWindow) return false
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Document',
      defaultPath: `${defaultFileName}.${extension}`,
      filters: [{ name: filterName, extensions: [extension] }]
    })
    if (result.canceled || !result.filePath) return false
    writeFileSync(result.filePath, content, 'utf-8')
    return true
  })

  ipcMain.handle('oros:open-vault-folder', async () => {
    ensureDirectories()
    const err = await shell.openPath(vaultPath)
    if (err) {
      console.error('Failed to open vault path:', err)
      return false
    }
    return true
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
