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

declare global {
  interface Window {
    oros?: OrosBridge;
  }
}
