import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let mainWindow: BrowserWindow | null = null

const userDataPath = app.getPath('userData')
const dataFilePath = join(userDataPath, 'oros_vault.json')

function loadVaultData(): string | null {
  try {
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
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }
    writeFileSync(dataFilePath, jsonContent, 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to save vault data:', err)
    return false
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0e141c',
    title: 'Oros — Worldbuilding Studio',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0e141c',
      symbolColor: '#cbd4df',
      height: 36
    },
    webPreferences: {
      preload: join(__dirname, '../dist-electron/index.js'),
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

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('oros:load-vault', async () => {
    return loadVaultData()
  })

  ipcMain.handle('oros:save-vault', async (_event, content: string) => {
    return saveVaultData(content)
  })

  ipcMain.handle('oros:select-image', async () => {
    if (!mainWindow) return null
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'webp', 'svg', 'gif'] }]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
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
