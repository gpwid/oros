import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net, nativeImage } from 'electron'
import { join, dirname, extname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, statSync, promises as fsPromises } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { checkGitHubRelease, downloadAssetToFile, launchInstaller } from './updater.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// Cap decoded image cache and V8 heap overhead to keep idle and canvas memory low
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512')

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

// Isolate Chromium GPU/disk cache in dev mode to prevent Windows (0x5) cache lock collisions
if (process.env.VITE_DEV_SERVER_URL) {
  try {
    app.setPath('sessionData', join(app.getPath('temp'), 'oros-dev-session'))
  } catch {}
}

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
const configFilePath = join(userDataPath, 'vault_config.json')

function getInitialVaultPath(): string {
  try {
    if (existsSync(configFilePath)) {
      const parsed = JSON.parse(readFileSync(configFilePath, 'utf-8'))
      if (parsed.vaultPath && typeof parsed.vaultPath === 'string' && existsSync(parsed.vaultPath)) {
        return parsed.vaultPath
      }
    }
  } catch (err) {
    console.warn('Failed to read vault_config.json:', err)
  }
  return join(userDataPath, 'vault')
}

let activeVaultPath = getInitialVaultPath()
let directoriesEnsuredForPath = ''
let lastBackupTimeMs = 0

function getAssetsPath(): string {
  return join(activeVaultPath, 'assets')
}

function getDataFilePath(): string {
  return join(activeVaultPath, 'oros_vault.json')
}

function getBackupsPath(): string {
  return join(activeVaultPath, 'backups')
}

// Ensure directory tree exists (cached per activeVaultPath to avoid repeated sync stat calls)
function ensureDirectories() {
  if (directoriesEnsuredForPath === activeVaultPath) return
  if (!existsSync(activeVaultPath)) mkdirSync(activeVaultPath, { recursive: true })
  if (!existsSync(getAssetsPath())) mkdirSync(getAssetsPath(), { recursive: true })
  if (!existsSync(getBackupsPath())) mkdirSync(getBackupsPath(), { recursive: true })
  directoriesEnsuredForPath = activeVaultPath
}

async function loadVaultData(): Promise<string | null> {
  try {
    ensureDirectories()
    const dataFilePath = getDataFilePath()
    if (existsSync(dataFilePath)) {
      return await fsPromises.readFile(dataFilePath, 'utf-8')
    }
  } catch (err) {
    console.error('Failed to load vault data:', err)
  }
  return null
}

async function saveVaultData(jsonContent: string): Promise<boolean> {
  try {
    ensureDirectories()
    const dataFilePath = getDataFilePath()
    const now = Date.now()
    // Throttle backup creation to once every 10 minutes instead of on every auto-save
    if (now - lastBackupTimeMs > 10 * 60 * 1000 && existsSync(dataFilePath)) {
      lastBackupTimeMs = now
      const backupFilePath = join(getBackupsPath(), `oros_vault_${new Date().toISOString().slice(0, 10)}.json.bak`)
      fsPromises.copyFile(dataFilePath, backupFilePath).catch((backupErr) => {
        console.warn('Could not write backup file:', backupErr)
      })
    }
    await fsPromises.writeFile(dataFilePath, jsonContent, 'utf-8')
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

let splashWindow: BrowserWindow | null = null
let hasLaunchedMain = false

function launchMainWindow(): void {
  if (hasLaunchedMain) return
  hasLaunchedMain = true

  createWindow()

  mainWindow?.once('ready-to-show', () => {
    mainWindow?.show()
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close()
      splashWindow = null
    }
  })
}

function createSplashWindow(): void {
  const preloadPath = getPreloadPath()
  const icon = getAppIcon()

  splashWindow = new BrowserWindow({
    width: 320,
    height: 200,
    frame: false,
    resizable: false,
    show: false,
    center: true,
    alwaysOnTop: true,
    transparent: true,
    backgroundColor: '#00000000',
    title: 'Oros',
    icon,
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  splashWindow.on('ready-to-show', () => {
    splashWindow?.show()
    runStartupAutoUpdater()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    splashWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/splash.html`)
  } else {
    const splashCandidates = [
      join(__dirname, '../dist/splash.html'),
      join(__dirname, 'splash.html'),
      join(process.cwd(), 'dist/splash.html'),
      join(process.cwd(), 'public/splash.html')
    ]
    const found = splashCandidates.find((p) => existsSync(p))
    if (found) {
      splashWindow.loadFile(found)
    } else {
      launchMainWindow()
    }
  }
}

async function runStartupAutoUpdater(): Promise<void> {
  const currentVer = app.getVersion() || '0.1.0'

  // Tell splash we're checking
  splashWindow?.webContents.send('oros:splash-status', {
    state: 'checking',
    text: 'Checking for updates...',
    currentVersion: currentVer
  })

  try {
    const result = await checkGitHubRelease(3500) // 3.5s timeout for snappy offline experience

    if (result.error && (result.error.includes('Offline') || result.error.includes('timed out') || result.error.includes('HTTP') || result.error.includes('failed'))) {
      splashWindow?.webContents.send('oros:splash-status', {
        state: 'offline',
        text: 'No internet connection — launching offline mode',
        currentVersion: currentVer
      })
      setTimeout(() => {
        launchMainWindow()
      }, 550)
      return
    }

    if (!result.updateAvailable) {
      splashWindow?.webContents.send('oros:splash-status', {
        state: 'up-to-date',
        text: `Oros is up to date (v${currentVer})`,
        currentVersion: currentVer
      })
      setTimeout(() => {
        launchMainWindow()
      }, 450)
      return
    }

    // Update found!
    splashWindow?.webContents.send('oros:splash-status', {
      state: 'found',
      text: `Update found: v${result.latestVersion}!`,
      newVersion: result.latestVersion,
      currentVersion: currentVer
    })

    if (result.installerAsset) {
      const tempPath = join(app.getPath('temp'), result.installerAsset.name)
      splashWindow?.webContents.send('oros:splash-status', {
        state: 'downloading',
        text: `Downloading update v${result.latestVersion}...`,
        percent: 0,
        transferredMb: 0,
        totalMb: result.installerAsset.size / (1024 * 1024)
      })

      const ok = await downloadAssetToFile(result.installerAsset.downloadUrl, tempPath, (progress) => {
        if (!hasLaunchedMain) {
          splashWindow?.webContents.send('oros:splash-status', {
            state: 'downloading',
            text: `Downloading update... (${Math.round(progress.percent)}%)`,
            percent: progress.percent,
            transferredMb: progress.transferredMb,
            totalMb: progress.totalMb
          })
        }
      })

      if (ok && !hasLaunchedMain) {
        splashWindow?.webContents.send('oros:splash-status', {
          state: 'ready-to-install',
          text: 'Update ready! Installing...'
        })
        setTimeout(() => {
          launchInstaller(tempPath)
        }, 700)
        return
      }
    }

    launchMainWindow()
  } catch (err) {
    splashWindow?.webContents.send('oros:splash-status', {
      state: 'offline',
      text: 'Starting Oros Studio...',
      currentVersion: currentVer
    })
    setTimeout(() => {
      launchMainWindow()
    }, 450)
  }
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
      nodeIntegration: false,
      webSecurity: false
    }
  })

  // Support native browser downloads for data/blob URLs
  mainWindow.webContents.session.on('will-download', (_event, item) => {
    item.on('updated', (_event, state) => {
      if (state === 'interrupted') {
        console.warn('Download interrupted')
      }
    })
    item.once('done', (_event, state) => {
      if (state === 'completed') {
        console.log('Download completed:', item.getSavePath())
      }
    })
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
    try {
      const url = new URL(request.url)
      const filename = url.hostname ? `${url.hostname}${url.pathname}` : url.pathname.replace(/^\/+/, '')
      const targetFile = join(getAssetsPath(), decodeURIComponent(filename))

      if (existsSync(targetFile)) {
        const ext = extname(targetFile).toLowerCase()
        const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
        const data = readFileSync(targetFile)
        return new Response(data, {
          headers: { 'Content-Type': mime }
        })
      }
    } catch (e) {
      console.warn('oros-asset protocol handler failed:', e)
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

  // Native Image Importer: Copies file into local vault and returns instant base64 Data URL
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
    const destinationPath = join(getAssetsPath(), targetFilename)

    copyFileSync(sourcePath, destinationPath)
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
    const buf = readFileSync(destinationPath)
    return `data:${mime};base64,${buf.toString('base64')}`
  })

  ipcMain.handle('oros:select-image', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const ext = extname(filePath).toLowerCase()
    const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
    const buf = readFileSync(filePath)
    return `data:${mime};base64,${buf.toString('base64')}`
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

  ipcMain.handle('oros:export-file', async (_event, defaultFileName: string, content: string, extension?: string, filterName?: string) => {
    if (!mainWindow) return false
    const ext = extension || (defaultFileName.includes('.') ? defaultFileName.split('.').pop()! : 'txt')
    const filter = filterName || `${ext.toUpperCase()} File`
    const defaultName = defaultFileName.endsWith(`.${ext}`) ? defaultFileName : `${defaultFileName}.${ext}`

    const result = await dialog.showSaveDialog(mainWindow, {
      title: `Export ${filter}`,
      defaultPath: defaultName,
      filters: [{ name: filter, extensions: [ext] }]
    })
    if (result.canceled || !result.filePath) return false

    if (typeof content === 'string' && content.startsWith('data:')) {
      const match = content.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        writeFileSync(result.filePath, Buffer.from(match[2], 'base64'))
      } else {
        const commaIdx = content.indexOf(',')
        const raw = commaIdx !== -1 ? decodeURIComponent(content.slice(commaIdx + 1)) : content
        writeFileSync(result.filePath, raw, 'utf-8')
      }
    } else {
      writeFileSync(result.filePath, content, 'utf-8')
    }
    return true
  })

  ipcMain.handle('oros:fetch-image-data-url', async (_event, url: string) => {
    try {
      const res = await net.fetch(url)
      if (!res.ok) return null
      const arrayBuffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') || 'image/png'
      const b64 = Buffer.from(arrayBuffer).toString('base64')
      return `data:${contentType};base64,${b64}`
    } catch (err) {
      console.warn('Failed to fetch image via main process:', url, err)
      return null
    }
  })

  ipcMain.handle('oros:open-vault-folder', async () => {
    ensureDirectories()
    const err = await shell.openPath(activeVaultPath)
    if (err) {
      console.error('Failed to open vault path:', err)
      return false
    }
    return true
  })

  ipcMain.handle('oros:get-vault-path', async () => {
    return activeVaultPath
  })

  ipcMain.handle('oros:choose-vault-folder', async () => {
    if (!mainWindow) return { success: false, cancelled: true }
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Oros Vault Storage Folder',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true }
    }

    const newPath = result.filePaths[0]
    const oldDataFile = getDataFilePath()

    activeVaultPath = newPath
    ensureDirectories()

    // If new vault has no data file yet, migrate current one over
    const newDataFile = getDataFilePath()
    if (existsSync(oldDataFile) && !existsSync(newDataFile)) {
      try {
        copyFileSync(oldDataFile, newDataFile)
      } catch (err) {
        console.warn('Could not copy vault to new location:', err)
      }
    }

    // Persist custom vault path in config
    try {
      writeFileSync(configFilePath, JSON.stringify({ vaultPath: activeVaultPath }, null, 2), 'utf-8')
    } catch (err) {
      console.warn('Could not save vault_config.json:', err)
    }

    return { success: true, newPath: activeVaultPath }
  })

  ipcMain.handle('oros:open-assets-folder', async () => {
    ensureDirectories()
    const err = await shell.openPath(getAssetsPath())
    return !err
  })

  ipcMain.handle('oros:get-storage-stats', async () => {
    ensureDirectories()
    const assetsDir = getAssetsPath()
    let assetsCount = 0
    let assetsSizeMb = 0
    try {
      const files = readdirSync(assetsDir)
      assetsCount = files.length
      for (const f of files) {
        const st = statSync(join(assetsDir, f))
        assetsSizeMb += st.size / (1024 * 1024)
      }
    } catch (e) {}

    let backupsCount = 0
    try {
      const bFiles = readdirSync(getBackupsPath())
      backupsCount = bFiles.length
    } catch (e) {}

    return {
      vaultPath: activeVaultPath,
      assetsCount,
      assetsSizeMb: Number(assetsSizeMb.toFixed(2)),
      backupsCount
    }
  })

  ipcMain.handle('oros:create-manual-backup', async () => {
    try {
      ensureDirectories()
      const src = getDataFilePath()
      if (!existsSync(src)) return { success: false }
      const timeStr = new Date().toISOString().replace(/[:.]/g, '-')
      const fname = `oros_snapshot_${timeStr}.json.bak`
      const dest = join(getBackupsPath(), fname)
      copyFileSync(src, dest)
      return { success: true, filename: fname }
    } catch (e) {
      return { success: false }
    }
  })

  ipcMain.handle('oros:get-system-info', async () => {
    return {
      version: app.getVersion() || '0.1.0',
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch
    }
  })

  // Splash & Updater IPC Handlers
  ipcMain.on('oros:splash-skip', () => {
    launchMainWindow()
  })

  ipcMain.handle('oros:check-for-updates', async () => {
    return await checkGitHubRelease(5000)
  })

  ipcMain.handle('oros:open-external', async (_event, url: string) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url)
      return true
    }
    return false
  })

  ipcMain.handle('oros:download-release-asset', async (_event, downloadUrl: string, fileName: string) => {
    const destPath = join(app.getPath('downloads'), fileName)
    const ok = await downloadAssetToFile(downloadUrl, destPath, (progress) => {
      mainWindow?.webContents.send('oros:update-download-progress', progress)
    })
    if (ok) {
      return { success: true, filePath: destPath }
    }
    return { success: false, error: 'Download failed' }
  })

  ipcMain.handle('oros:launch-installer', async (_event, filePath: string) => {
    launchInstaller(filePath)
    return true
  })

  createSplashWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      launchMainWindow()
    }
  })
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
