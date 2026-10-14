import { contextBridge, ipcRenderer } from 'electron'

export interface OrosBridge {
  loadVault: () => Promise<string | null>;
  saveVault: (content: string) => Promise<boolean>;
  selectImage: () => Promise<string | null>;
  importAsset: () => Promise<string | null>;
  exportWorld: (fileName: string, content: string) => Promise<boolean>;
  openVaultFolder: () => Promise<boolean>;
}

const api: OrosBridge = {
  loadVault: () => ipcRenderer.invoke('oros:load-vault'),
  saveVault: (content: string) => ipcRenderer.invoke('oros:save-vault', content),
  selectImage: () => ipcRenderer.invoke('oros:select-image'),
  importAsset: () => ipcRenderer.invoke('oros:import-asset'),
  exportWorld: (fileName: string, content: string) => ipcRenderer.invoke('oros:export-world', fileName, content),
  openVaultFolder: () => ipcRenderer.invoke('oros:open-vault-folder'),
}

contextBridge.exposeInMainWorld('oros', api)
