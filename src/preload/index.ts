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
}

contextBridge.exposeInMainWorld('oros', api)
