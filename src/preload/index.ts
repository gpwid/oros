import { contextBridge, ipcRenderer } from 'electron'

export interface OrosBridge {
  loadVault: () => Promise<string | null>;
  saveVault: (content: string) => Promise<boolean>;
  selectImage: () => Promise<string | null>;
  importAsset: () => Promise<string | null>;
  exportWorld: (fileName: string, content: string) => Promise<boolean>;
  importWorld: () => Promise<string | null>;
  exportFile: (defaultFileName: string, content: string, extension?: string, filterName?: string) => Promise<boolean>;
  fetchImageDataUrl: (url: string) => Promise<string | null>;
  openVaultFolder: () => Promise<boolean>;
  getVaultPath: () => Promise<string>;
  chooseVaultFolder: () => Promise<{ success: boolean; newPath?: string; cancelled?: boolean }>;
  openAssetsFolder: () => Promise<boolean>;
  getStorageStats: () => Promise<{ vaultPath: string; assetsCount: number; assetsSizeMb: number; backupsCount: number }>;
  createManualBackup: () => Promise<{ success: boolean; filename?: string }>;
  getSystemInfo: () => Promise<{ version: string; electron: string; chrome: string; node: string; platform: string; arch: string }>;
  checkForUpdates: () => Promise<any>;
  openExternal: (url: string) => Promise<boolean>;
  downloadReleaseAsset: (downloadUrl: string, fileName: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  onUpdateDownloadProgress: (callback: (data: { percent: number; transferredBytes: number; totalBytes: number }) => void) => () => void;
  launchDownloadedInstaller: (filePath: string) => Promise<boolean>;
}

const api: OrosBridge = {
  loadVault: () => ipcRenderer.invoke('oros:load-vault'),
  saveVault: (content: string) => ipcRenderer.invoke('oros:save-vault', content),
  selectImage: () => ipcRenderer.invoke('oros:select-image'),
  importAsset: () => ipcRenderer.invoke('oros:import-asset'),
  exportWorld: (fileName: string, content: string) => ipcRenderer.invoke('oros:export-world', fileName, content),
  importWorld: () => ipcRenderer.invoke('oros:import-world'),
  exportFile: (defaultFileName: string, content: string, extension?: string, filterName?: string) => 
    ipcRenderer.invoke('oros:export-file', defaultFileName, content, extension, filterName),
  fetchImageDataUrl: (url: string) => ipcRenderer.invoke('oros:fetch-image-data-url', url),
  openVaultFolder: () => ipcRenderer.invoke('oros:open-vault-folder'),
  getVaultPath: () => ipcRenderer.invoke('oros:get-vault-path'),
  chooseVaultFolder: () => ipcRenderer.invoke('oros:choose-vault-folder'),
  openAssetsFolder: () => ipcRenderer.invoke('oros:open-assets-folder'),
  getStorageStats: () => ipcRenderer.invoke('oros:get-storage-stats'),
  createManualBackup: () => ipcRenderer.invoke('oros:create-manual-backup'),
  getSystemInfo: () => ipcRenderer.invoke('oros:get-system-info'),
  checkForUpdates: () => ipcRenderer.invoke('oros:check-for-updates'),
  openExternal: (url: string) => ipcRenderer.invoke('oros:open-external', url),
  downloadReleaseAsset: (downloadUrl: string, fileName: string) => 
    ipcRenderer.invoke('oros:download-release-asset', downloadUrl, fileName),
  onUpdateDownloadProgress: (callback) => {
    const handler = (_event: any, data: any) => callback(data)
    ipcRenderer.on('oros:update-download-progress', handler)
    return () => {
      ipcRenderer.removeListener('oros:update-download-progress', handler)
    }
  },
  launchDownloadedInstaller: (filePath: string) => ipcRenderer.invoke('oros:launch-installer', filePath)
}

contextBridge.exposeInMainWorld('oros', api)

const splashApi = {
  onStatus: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status)
    ipcRenderer.on('oros:splash-status', handler)
    return () => {
      ipcRenderer.removeListener('oros:splash-status', handler)
    }
  },
  skipUpdate: () => ipcRenderer.send('oros:splash-skip'),
  startUpdate: () => ipcRenderer.send('oros:splash-start-download')
}

contextBridge.exposeInMainWorld('orosSplash', splashApi)


