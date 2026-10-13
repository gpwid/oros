import { contextBridge, ipcRenderer } from 'electron'

export interface OrosBridge {
  loadVault: () => Promise<string | null>;
  saveVault: (content: string) => Promise<boolean>;
  selectImage: () => Promise<string | null>;
  exportWorld: (fileName: string, content: string) => Promise<boolean>;
}

const api: OrosBridge = {
  loadVault: () => ipcRenderer.invoke('oros:load-vault'),
  saveVault: (content: string) => ipcRenderer.invoke('oros:save-vault', content),
  selectImage: () => ipcRenderer.invoke('oros:select-image'),
  exportWorld: (fileName: string, content: string) => ipcRenderer.invoke('oros:export-world', fileName, content),
}

contextBridge.exposeInMainWorld('oros', api)
