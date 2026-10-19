import React, { useState, useEffect } from 'react'
import { 
  X, RefreshCw, Download, ExternalLink, CheckCircle2, 
  AlertCircle, Sparkles, ShieldCheck, ArrowRight, HardDrive, Package
} from 'lucide-react'
import { AppUpdateInfo, UpdateDownloadProgress } from '@shared/types'
import { useToastStore } from '../../store/useToastStore'

interface UpdateModalProps {
  isOpen: boolean
  onClose: () => void
  initialUpdateInfo?: AppUpdateInfo | null
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, initialUpdateInfo }) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(initialUpdateInfo || null)
  const [downloading, setDownloading] = useState<boolean>(false)
  const [downloadProgress, setDownloadProgress] = useState<UpdateDownloadProgress | null>(null)
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null)
  const { addToast } = useToastStore()

  useEffect(() => {
    if (isOpen && !updateInfo) {
      handleCheckForUpdates()
    }
  }, [isOpen])

  // Subscribe to download progress
  useEffect(() => {
    if (typeof window !== 'undefined' && window.oros?.onUpdateDownloadProgress) {
      const unsubscribe = window.oros.onUpdateDownloadProgress((progress) => {
        setDownloadProgress(progress)
      })
      return () => {
        unsubscribe()
      }
    }
  }, [])

  const handleCheckForUpdates = async () => {
    setLoading(true)
    setDownloadedFilePath(null)
    try {
      if (window.oros?.checkForUpdates) {
        const info = await window.oros.checkForUpdates()
        setUpdateInfo(info)
        if (info.updateAvailable) {
          addToast(`New release found: v${info.latestVersion}`, 'info')
        } else if (!info.error) {
          addToast('Oros is up to date!', 'success')
        }
      } else {
        // Fallback in web preview mode
        setTimeout(() => {
          setUpdateInfo({
            updateAvailable: false,
            currentVersion: '0.1.0',
            latestVersion: '0.1.0',
            releaseTitle: 'Oros v0.1.0',
            releaseNotes: 'You are using the latest version of Oros Studio.',
            publishedAt: new Date().toISOString(),
            releaseUrl: 'https://github.com/gpwid/oros/releases',
            allAssets: [],
            checkedAt: new Date().toISOString()
          })
          setLoading(false)
        }, 800)
        return
      }
    } catch (err: any) {
      setUpdateInfo({
        updateAvailable: false,
        currentVersion: '0.1.0',
        latestVersion: '0.1.0',
        releaseTitle: '',
        releaseNotes: '',
        publishedAt: '',
        releaseUrl: 'https://github.com/gpwid/oros/releases',
        allAssets: [],
        checkedAt: new Date().toISOString(),
        error: err.message || 'Failed to check updates'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadAsset = async (assetUrl: string, assetName: string) => {
    if (!window.oros?.downloadReleaseAsset) {
      window.open(assetUrl, '_blank')
      return
    }

    setDownloading(true)
    setDownloadProgress({ percent: 0, transferredBytes: 0, totalBytes: 0 })
    try {
      const res = await window.oros.downloadReleaseAsset(assetUrl, assetName)
      if (res.success && res.filePath) {
        setDownloadedFilePath(res.filePath)
        addToast(`Downloaded ${assetName} to Downloads folder`, 'success')
      } else {
        addToast('Download failed. Please download directly from GitHub.', 'error')
      }
    } catch (e: any) {
      addToast(e.message || 'Download failed', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleLaunchInstaller = () => {
    if (downloadedFilePath && window.oros?.launchDownloadedInstaller) {
      window.oros.launchDownloadedInstaller(downloadedFilePath)
    }
  }

  const handleOpenGitHub = () => {
    const url = updateInfo?.releaseUrl || 'https://github.com/gpwid/oros/releases'
    if (window.oros?.openExternal) {
      window.oros.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div 
        className="bg-oros-900 border border-oros-750 rounded-[6px] w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-modal-in select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-oros-800 bg-oros-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[3px] bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-oros-100 tracking-wide">
                Oros Studio — Updates & Releases
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-3 text-center">
              <RefreshCw className="w-7 h-7 text-accent animate-spin" />
              <div>
                <p className="text-xs font-medium text-oros-100">Checking for updates...</p>
                <p className="text-[11px] font-mono text-oros-400 mt-0.5">Contacting github.com/gpwid/oros</p>
              </div>
            </div>
          ) : updateInfo?.error ? (
            <div className="p-4 rounded-[4px] bg-amber-950/40 border border-amber-800/60 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Offline or Connection Notice</span>
              </div>
              <p className="text-xs text-oros-300 leading-relaxed">
                Could not fetch release information from GitHub. Oros runs completely locally and will continue operating offline without any disruption.
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] font-mono text-oros-500">{updateInfo.error}</span>
                <button
                  type="button"
                  onClick={handleCheckForUpdates}
                  className="px-3 py-1 rounded-[3px] btn-accent text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Check</span>
                </button>
              </div>
            </div>
          ) : updateInfo?.updateAvailable ? (
            <div className="space-y-4">
              {/* Highlight Card */}
              <div className="p-4 rounded-[4px] bg-accent/10 border border-accent/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider font-mono">
                    New Release Available
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-oros-950 text-accent font-bold border border-accent/30">
                    v{updateInfo.latestVersion}
                  </span>
                </div>
                <h4 className="text-base font-serif font-bold text-oros-100">
                  {updateInfo.releaseTitle || `Oros v${updateInfo.latestVersion}`}
                </h4>
                {updateInfo.publishedAt && (
                  <p className="text-[11px] font-mono text-oros-400">
                    Published: {new Date(updateInfo.publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </p>
                )}
              </div>

              {/* Release Notes */}
              {updateInfo.releaseNotes && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase text-oros-400 font-bold tracking-wider">
                    Changelog & Notes
                  </label>
                  <div className="p-3 rounded-[3px] bg-oros-950 border border-oros-800 text-xs text-oros-200 font-sans leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}

              {/* Download / Installation Progress */}
              {downloading && downloadProgress && (
                <div className="p-3.5 rounded-[4px] bg-oros-950 border border-oros-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-oros-100">
                    <span>Downloading update...</span>
                    <span className="font-mono text-accent font-bold">
                      {Math.round(downloadProgress.percent)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-oros-900 border border-oros-800 overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-200" 
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Download Finished Card */}
              {downloadedFilePath && (
                <div className="p-3.5 rounded-[4px] bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Installer ready to install!</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLaunchInstaller}
                    className="px-3.5 py-1.5 rounded-[3px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Install & Restart</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Assets & Actions */}
              {!downloadedFilePath && (
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-mono uppercase text-oros-400 font-bold tracking-wider">
                    Available Downloads
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {updateInfo.installerAsset && (
                      <button
                        type="button"
                        disabled={downloading}
                        onClick={() => handleDownloadAsset(updateInfo.installerAsset!.downloadUrl, updateInfo.installerAsset!.name)}
                        className="p-2.5 rounded-[4px] bg-oros-950 hover:bg-oros-850 border border-accent/40 text-left transition-all group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-accent" />
                          <span className="text-xs font-bold text-oros-100 group-hover:text-accent">
                            Windows Installer (.exe)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-oros-400 block">
                          {(updateInfo.installerAsset.size / (1024 * 1024)).toFixed(1)} MB • Direct Setup
                        </span>
                      </button>
                    )}

                    {updateInfo.portableAsset && (
                      <button
                        type="button"
                        disabled={downloading}
                        onClick={() => handleDownloadAsset(updateInfo.portableAsset!.downloadUrl, updateInfo.portableAsset!.name)}
                        className="p-2.5 rounded-[4px] bg-oros-950 hover:bg-oros-850 border border-oros-750 text-left transition-all group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <HardDrive className="w-4 h-4 text-oros-300" />
                          <span className="text-xs font-bold text-oros-100 group-hover:text-accent">
                            Portable ZIP (.zip)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-oros-400 block">
                          {(updateInfo.portableAsset.size / (1024 * 1024)).toFixed(1)} MB • No install required
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-center text-emerald-400 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-oros-100">
                  Oros Studio is Up to Date
                </h4>
                <p className="text-xs text-oros-400 mt-1 font-mono">
                  Current Version: v{updateInfo?.currentVersion || '0.1.0'}
                </p>
              </div>
              <p className="text-xs text-oros-400 max-w-sm leading-relaxed">
                You are running the latest stable release. When new versions are published to GitHub, Oros will notify you on launch.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-oros-800 bg-oros-950/90 flex items-center justify-between text-xs font-sans">
          <button
            type="button"
            onClick={handleOpenGitHub}
            className="text-oros-400 hover:text-accent flex items-center gap-1.5 transition-colors text-[11px] cursor-pointer"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckForUpdates}
              disabled={loading}
              className="px-3 py-1.5 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Check Again</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[3px] btn-accent font-semibold text-xs shadow-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
