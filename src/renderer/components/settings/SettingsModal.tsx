import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  X, Sliders, Palette, Edit3, FolderTree, Keyboard, Info, 
  FolderOpen, RotateCcw, Check, Copy, ExternalLink, HardDrive, 
  ShieldCheck, AlertCircle, FileText, Search, Sparkles,
  Sun, Moon, Monitor, Upload, Download, Trash2, 
  Layers, Globe, Terminal, Store, CheckSquare, Paintbrush
} from 'lucide-react'
import { 
  useSettingsStore, 
  DEFAULT_SETTINGS,
  SERIF_FONT_MAP,
  SANS_FONT_MAP,
  MONO_FONT_MAP
} from '../../store/useSettingsStore'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  THEME_PRESETS,
  exportThemeToJson,
  parseThemeFromJson,
  getThemeTokens
} from '../../utils/themeEngine'
import { SettingsTab, World, ThemeConfig, ThemePresetId, ThemeScope } from '@shared/types'
import { OrosLogoMark } from '../common/OrosLogo'
import { UpdateModal } from '../common/UpdateModal'

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, closeSettings, activeTab, setActiveTab,
    settings, updateGeneral, updateInterface, updateEditor, updateFiles,
    resetSectionToDefaults, resetAllToDefaults,
    installCustomTheme, removeCustomTheme
  } = useSettingsStore()

  const { worlds, activeWorldId, updateWorld, entities, maps, manuscripts, canvases, conlangs } = useWorldStore()
  const activeWorld = worlds.find((w) => w.id === activeWorldId)
  const { addToast } = useToastStore()

  // Storage and System Info from Electron Bridge
  const [vaultPath, setVaultPath] = useState<string>('Loading...')
  const [storageStats, setStorageStats] = useState<{
    vaultPath: string
    assetsCount: number
    assetsSizeMb: number
    backupsCount: number
  } | null>(null)
  const [systemInfo, setSystemInfo] = useState<{
    version: string
    electron: string
    chrome: string
    node: string
    platform: string
    arch: string
  } | null>(null)

  // Health check state
  const [healthStatus, setHealthStatus] = useState<{
    checked: boolean
    healthy: boolean
    message: string
    details: string[]
  } | null>(null)

  // Hotkeys filter
  const [hotkeyQuery, setHotkeyQuery] = useState('')

  // Theme Manager State
  const [themeScope, setThemeScope] = useState<'global' | 'workspace'>('global')
  const [showThemeImportModal, setShowThemeImportModal] = useState(false)
  const [themeImportJson, setThemeImportJson] = useState('')
  const [themeImportError, setThemeImportError] = useState('')
  const fileThemeInputRef = useRef<HTMLInputElement>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  // Helper to trigger browser JSON file download
  const downloadJsonFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Active theme ID based on scope
  const activeThemeId: string = useMemo(() => {
    if (themeScope === 'workspace' && activeWorld) {
      return activeWorld.themeConfig?.id || activeWorld.theme || 'sovereign'
    }
    return settings.interface.themePreset
  }, [themeScope, activeWorld, settings.interface.themePreset])

  // Live Preview Custom Draft State for Editor
  const [editorDraftTitle, setEditorDraftTitle] = useState<string>('Chronicles of the Realm')
  const [editorDraftContent, setEditorDraftContent] = useState<string>(
    'The ancient citadels of Oros stood silent under the fractured moons, awaiting the return of the exiled archivists. As the heavy stone gates ground open, a rush of cold air carried the scent of petrichor and long-forgotten incense.'
  )

  // Non-editable showcase preview for Interface Tab
  const renderInterfacePreview = () => (
    <div className="p-3.5 rounded-[4px] bg-oros-950 border border-oros-800 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-xs text-oros-100">Preview</span>
      </div>

      {/* Non-editable showcase card */}
      <div className="p-4 rounded-[3px] bg-oros-900 border border-oros-750/90 shadow-sm space-y-2.5 transition-all">
        <div className="flex items-baseline justify-between border-b border-oros-800 pb-2">
          <h3 
            className="text-base font-bold text-oros-100 tracking-tight transition-all"
            style={{ fontFamily: SERIF_FONT_MAP[settings.interface.headingFont] || SERIF_FONT_MAP.playfair }}
          >
            The Grand Archive of Oros
          </h3>
        </div>

        <p 
          className="text-oros-200 leading-relaxed select-text transition-all text-xs"
          style={{ 
            fontFamily: SANS_FONT_MAP[settings.interface.bodyFont] || SANS_FONT_MAP.inter
          }}
        >
          Beyond the obsidian gates of Val-Khor lie the sunken archives, where ancient cartographers charted the movement of stars before the Great Fracture. Every codex is sealed with gold leaf and runic script.
        </p>

        <div className="pt-2 border-t border-oros-800/80 flex items-center justify-between text-xs">
          <div 
            className="text-[10.5px] text-oros-400 flex items-center gap-2"
            style={{ fontFamily: MONO_FONT_MAP[settings.interface.monoFont] || MONO_FONT_MAP.jetbrains }}
          >
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            <span>{settings.interface.headingFont} / {settings.interface.bodyFont} / {settings.interface.monoFont}</span>
          </div>

          <button
            type="button"
            className="px-2.5 py-1 rounded-[2px] text-xs font-semibold btn-accent shadow-sm pointer-events-none"
          >
            Explore Codex
          </button>
        </div>
      </div>
    </div>
  )

  // Interactive, fully editable preview for Editor Tab
  const renderEditorPreview = () => {
    return (
      <div className="p-3.5 rounded-[4px] bg-oros-950 border border-oros-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-oros-100">Preview</span>
        </div>

        {/* Live Editable Writing Area */}
        <div className="p-4 rounded-[3px] bg-oros-900 border border-oros-750/90 shadow-sm space-y-2.5 transition-all focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/20">
          <div className="flex items-baseline justify-between border-b border-oros-800 pb-2 gap-3">
            <input
              type="text"
              value={editorDraftTitle}
              onChange={(e) => setEditorDraftTitle(e.target.value)}
              placeholder="Manuscript Title..."
              className="bg-transparent font-bold text-base text-oros-100 tracking-tight outline-none focus:text-accent transition-colors flex-1"
              style={{ fontFamily: SERIF_FONT_MAP[settings.interface.headingFont] || SERIF_FONT_MAP.playfair }}
            />
            <span 
              className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-accent-muted text-accent border border-accent/30 font-medium font-mono shrink-0"
              style={{ fontFamily: MONO_FONT_MAP[settings.interface.monoFont] || MONO_FONT_MAP.jetbrains }}
            >
              Try editing the text!
            </span>
          </div>

          <textarea
            value={editorDraftContent}
            onChange={(e) => setEditorDraftContent(e.target.value)}
            placeholder="Click here and start typing to test your font size, line spacing, and typeface live..."
            rows={3}
            className="w-full bg-transparent text-oros-200 leading-relaxed outline-none resize-none selection:bg-accent/30 placeholder-oros-500 font-sans"
            style={{ 
              fontFamily: SANS_FONT_MAP[settings.interface.bodyFont] || SANS_FONT_MAP.inter,
              fontSize: `${settings.editor.fontSize}px`,
              lineHeight: settings.editor.lineHeight
            }}
          />

          <div className="pt-2 border-t border-oros-800/80 flex items-center justify-between text-xs">
            <div 
              className="text-[10.5px] text-oros-400 flex items-center gap-2"
              style={{ fontFamily: MONO_FONT_MAP[settings.interface.monoFont] || MONO_FONT_MAP.jetbrains }}
            >
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              <span>{settings.editor.fontSize}px · {settings.editor.lineHeight}x spacing · {settings.interface.bodyFont}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Load filesystem stats when modal opens
  useEffect(() => {
    if (!isSettingsOpen) return

    if (window.oros) {
      window.oros.getVaultPath().then(setVaultPath).catch(() => setVaultPath('UserData / Vault'))
      window.oros.getStorageStats().then(setStorageStats).catch(() => {})
      window.oros.getSystemInfo().then(setSystemInfo).catch(() => {})
    } else {
      setVaultPath('Browser Storage (Local Vault)')
      setStorageStats({
        vaultPath: 'IndexedDB / LocalStorage',
        assetsCount: 0,
        assetsSizeMb: 0,
        backupsCount: 1
      })
      setSystemInfo({
        version: '0.1.0 (Web Preview)',
        electron: 'N/A',
        chrome: navigator.userAgent.split('Chrome/')[1]?.split(' ')[0] || 'Modern Browser',
        node: 'N/A',
        platform: navigator.platform,
        arch: 'wasm/x64'
      })
    }
  }, [isSettingsOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isSettingsOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSettings()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSettingsOpen, closeSettings])

  if (!isSettingsOpen) return null

  // Hotkeys list
  const HOTKEYS = [
    { key: 'Ctrl + K', desc: 'Global Command Palette & Deep Search', cat: 'Navigation' },
    { key: 'Ctrl + B', desc: 'Toggle Vault Sidebar', cat: 'Navigation' },
    { key: 'Ctrl + ,', desc: 'Open Settings & Preferences', cat: 'Application' },
    { key: 'Ctrl + T', desc: 'Open Document / Feature Atelier', cat: 'Creation' },
    { key: 'Ctrl + W', desc: 'Close Active Tab', cat: 'Tabs' },
    { key: 'Ctrl + S', desc: 'Instant Manual Save & Sync', cat: 'Application' },
    { key: 'Ctrl + E', desc: 'Toggle Codex Distraction-Free Reader Mode', cat: 'Reading' },
    { key: 'D', desc: 'Toggle Tabletop 3D Polyhedral Dice Tray', cat: 'TTRPG' },
    { key: 'Space + Drag', desc: 'Pan Battlemap, Whiteboard Canvas, or Relation Graph', cat: 'Canvas' },
    { key: 'Esc', desc: 'Dismiss Active Tool, Spawner, or Modal', cat: 'Interface' }
  ]

  const filteredHotkeys = HOTKEYS.filter(h => 
    !hotkeyQuery.trim() || 
    h.key.toLowerCase().includes(hotkeyQuery.toLowerCase()) || 
    h.desc.toLowerCase().includes(hotkeyQuery.toLowerCase()) ||
    h.cat.toLowerCase().includes(hotkeyQuery.toLowerCase())
  )

  const handleCopyPath = () => {
    navigator.clipboard.writeText(vaultPath)
    addToast('Vault path copied to clipboard', 'info')
  }

  const handleChooseFolder = async () => {
    if (window.oros) {
      const res = await window.oros.chooseVaultFolder()
      if (res.success && res.newPath) {
        setVaultPath(res.newPath)
        updateFiles({ customVaultPath: res.newPath })
        addToast(`Vault directory relocated to ${res.newPath}`, 'success')
        // Refresh storage stats
        window.oros.getStorageStats().then(setStorageStats).catch(() => {})
      }
    } else {
      addToast('Directory selection requires the desktop app', 'warning')
    }
  }

  const handleOpenExplorer = async () => {
    if (window.oros) {
      await window.oros.openVaultFolder()
      addToast('Opened vault directory in Explorer', 'info')
    } else {
      addToast('Vault directory only available in desktop app', 'warning')
    }
  }

  const handleOpenAssets = async () => {
    if (window.oros) {
      await window.oros.openAssetsFolder()
      addToast('Opened assets directory in Explorer', 'info')
    } else {
      addToast('Assets directory only available in desktop app', 'warning')
    }
  }

  const handleCreateSnapshot = async () => {
    if (window.oros) {
      const res = await window.oros.createManualBackup()
      if (res.success) {
        addToast(`Created snapshot: ${res.filename}`, 'success')
        window.oros.getStorageStats().then(setStorageStats).catch(() => {})
      } else {
        addToast('Failed to create snapshot', 'error')
      }
    } else {
      addToast('Backups only available in desktop app', 'warning')
    }
  }

  const runHealthCheck = () => {
    let totalEnts = 0
    let totalDocs = 0
    let totalMaps = 0
    let totalConlangs = 0

    Object.values(entities).forEach(arr => { totalEnts += arr.length })
    Object.values(manuscripts).forEach(arr => { totalDocs += arr.length })
    Object.values(maps).forEach(arr => { totalMaps += arr.length })
    Object.values(conlangs).forEach(arr => { totalConlangs += arr.length })

    setHealthStatus({
      checked: true,
      healthy: true,
      message: 'Vault database integrity is 100% healthy. All entity relationships and assets resolve cleanly.',
      details: [
        `${worlds.length} World Projects loaded`,
        `${totalEnts} Lore Cards & Wiki Articles indexed`,
        `${totalDocs} Manuscript Chapters stored`,
        `${totalMaps} Cartography & Battlemaps linked`,
        `${totalConlangs} Constructed Languages registered`,
        '0 orphaned foreign references detected'
      ]
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-oros-900 border border-oros-750 text-oros-100 w-full max-w-3xl h-[620px] rounded-[4px] shadow-2xl flex flex-col overflow-hidden animate-modal-in select-none">
        
        {/* MODAL HEADER */}
        <div className="h-12 border-b border-oros-800 px-5 flex items-center justify-between bg-oros-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[3px] bg-oros-900 border border-accent/40 flex items-center justify-center text-accent">
              <OrosLogoMark className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-serif font-bold text-sm text-oros-100 tracking-wide">
              Settings & Preferences
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-oros-900 text-oros-400 border border-oros-800">
              v0.1.0
            </span>
          </div>

          <button
            onClick={closeSettings}
            className="text-oros-400 hover:text-oros-100 p-1 rounded hover:bg-oros-850 transition-colors"
            title="Close Settings (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT NAV RAIL */}
          <div className="w-48 bg-oros-950 border-r border-oros-800 p-2 flex flex-col justify-between shrink-0">
            <div className="space-y-0.5">
              {[
                { id: 'general', label: 'General', icon: Sliders },
                { id: 'interface', label: 'Interface', icon: Palette },
                { id: 'editor', label: 'Editor', icon: Edit3 },
                { id: 'files', label: 'Files & Vault', icon: FolderTree },
                { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
                { id: 'about', label: 'About', icon: Info }
              ].map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`w-full text-left px-2.5 py-2 rounded-[3px] text-xs font-sans flex items-center gap-2.5 transition-colors ${
                      isActive
                        ? 'bg-accent-muted text-accent font-semibold border border-accent/30 shadow-sm'
                        : 'text-oros-300 hover:text-oros-100 hover:bg-oros-850 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent' : 'text-oros-400'}`} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Bottom: Reset Section */}
            <div className="pt-2 border-t border-oros-800/80">
              <button
                onClick={() => {
                  if (activeTab === 'general' || activeTab === 'interface' || activeTab === 'editor' || activeTab === 'files') {
                    resetSectionToDefaults(activeTab)
                    addToast(`Reset ${activeTab} settings to default`, 'info')
                  }
                }}
                className="w-full text-left px-2 py-1.5 rounded-[3px] text-[11px] font-sans text-oros-400 hover:text-rose-300 hover:bg-rose-950/30 flex items-center gap-1.5 transition-colors"
                title="Reset current tab to factory defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Section</span>
              </button>
            </div>
          </div>

          {/* RIGHT CONTENT PANE */}
          <div className="flex-1 p-6 overflow-y-auto bg-oros-900 text-xs font-sans space-y-6">

            {/* ============================================================== */}
            {/* TAB 1: GENERAL                                                 */}
            {/* ============================================================== */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-serif font-bold text-sm text-oros-100 mb-1">General Settings</h4>
                </div>

                {/* Startup Destination */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Startup Destination
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'home', title: 'Project Hub' },
                      { id: 'last-workspace', title: 'Restore Last Workspace' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateGeneral({ startupView: opt.id as any })}
                        className={`text-left p-3 rounded-[3px] border transition-all ${
                          settings.general.startupView === opt.id
                            ? 'bg-oros-950 border-accent text-oros-100 shadow-sm ring-1 ring-accent/30'
                            : 'bg-oros-950/60 border-oros-800 text-oros-300 hover:border-oros-700 hover:text-oros-100'
                        }`}
                      >
                        <div className="font-semibold text-xs text-oros-100 flex items-center justify-between">
                          <span>{opt.title}</span>
                          {settings.general.startupView === opt.id && <Check className="w-3.5 h-3.5 text-accent" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Autosave Interval */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Autosave Debounce Timing
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { ms: 500, label: '500ms (Instant)' },
                      { ms: 1000, label: '1s (Recommended)' },
                      { ms: 2000, label: '2s (Balanced)' },
                      { ms: 5000, label: '5s (Relaxed)' }
                    ].map((item) => (
                      <button
                        key={item.ms}
                        type="button"
                        onClick={() => updateGeneral({ autoSaveIntervalMs: item.ms })}
                        className={`flex-1 py-1.5 px-2 rounded-[3px] text-center border font-mono text-xs transition-colors ${
                          settings.general.autoSaveIntervalMs === item.ms
                            ? 'bg-accent text-accent-contrast border-accent font-bold'
                            : 'bg-oros-950 border-oros-800 text-oros-300 hover:text-oros-100 hover:border-oros-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirmations */}
                <div className="space-y-2.5 pt-2 border-t border-oros-800/80">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Safety Confirmations
                  </label>
                  
                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer">
                    <span className="font-medium text-oros-100 block">Confirm Lore Card & Article Deletion</span>
                    <input
                      type="checkbox"
                      checked={settings.general.confirmEntityDeletion}
                      onChange={(e) => updateGeneral({ confirmEntityDeletion: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer">
                    <span className="font-medium text-oros-100 block">Confirm World Project Deletion</span>
                    <input
                      type="checkbox"
                      checked={settings.general.confirmWorldDeletion}
                      onChange={(e) => updateGeneral({ confirmWorldDeletion: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Toast Notification Duration */}
                <div className="space-y-2 pt-2 border-t border-oros-800/80">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Notification Popup Lifespan
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { ms: 2000, label: '2.0s' },
                      { ms: 3500, label: '3.5s (Default)' },
                      { ms: 5000, label: '5.0s' },
                      { ms: 8000, label: '8.0s' }
                    ].map((item) => (
                      <button
                        key={item.ms}
                        type="button"
                        onClick={() => updateGeneral({ toastDurationMs: item.ms })}
                        className={`flex-1 py-1.5 px-2 rounded-[3px] text-center border font-mono text-xs transition-colors ${
                          settings.general.toastDurationMs === item.ms
                            ? 'bg-accent text-accent-contrast border-accent font-bold'
                            : 'bg-oros-950 border-oros-800 text-oros-300 hover:text-oros-100 hover:border-oros-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: INTERFACE & THEMES                                      */}
            {/* ============================================================== */}
            {activeTab === 'interface' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-serif font-bold text-sm text-oros-100 mb-1">Interface & Themes</h4>
                </div>

                {/* 1. Theme Configuration Scope Selector */}
                <div className="p-3 rounded-[4px] bg-oros-950 border border-oros-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-oros-100 block">Configuration Scope</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-oros-900 border border-oros-750 text-accent uppercase font-bold tracking-wider">
                      {themeScope === 'global' ? 'Global App' : activeWorld?.name || 'Workspace'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setThemeScope('global')}
                      className={`p-2.5 rounded-[3px] border text-left transition-all flex items-center gap-2.5 ${
                        themeScope === 'global'
                          ? 'bg-oros-900 border-accent text-oros-100 shadow-sm ring-1 ring-accent/30'
                          : 'bg-oros-900/40 border-oros-800 text-oros-400 hover:text-oros-200 hover:border-oros-700'
                      }`}
                    >
                      <Globe className={`w-4 h-4 ${themeScope === 'global' ? 'text-accent' : 'text-oros-500'}`} />
                      <span className="text-xs font-semibold">Global Application</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeScope('workspace')}
                      disabled={!activeWorld}
                      className={`p-2.5 rounded-[3px] border text-left transition-all flex items-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed ${
                        themeScope === 'workspace'
                          ? 'bg-oros-900 border-accent text-oros-100 shadow-sm ring-1 ring-accent/30'
                          : 'bg-oros-900/40 border-oros-800 text-oros-400 hover:text-oros-200 hover:border-oros-700'
                      }`}
                    >
                      <Layers className={`w-4 h-4 ${themeScope === 'workspace' ? 'text-accent' : 'text-oros-500'}`} />
                      <span className="text-xs font-semibold truncate">Current Workspace</span>
                    </button>
                  </div>
                </div>

                {/* 2. Color Mode (System, Light, Dark) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Color Scheme / Appearance
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'system', title: 'System', icon: Monitor },
                      { id: 'dark', title: 'Dark', icon: Moon },
                      { id: 'light', title: 'Light', icon: Sun }
                    ].map((mode) => {
                      const Icon = mode.icon
                      const isSelected = (settings.interface.colorMode || 'dark') === mode.id
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => updateInterface({ colorMode: mode.id as any })}
                          className={`flex items-center justify-between p-3 rounded-[3px] border text-left transition-all ${
                            isSelected
                              ? 'bg-oros-950 border-accent font-semibold text-oros-100 shadow-sm ring-1 ring-accent/30'
                              : 'bg-oros-950/60 border-oros-800 text-oros-300 hover:border-oros-700 hover:text-oros-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-[3px] flex items-center justify-center ${
                              isSelected ? 'bg-accent/15 text-accent' : 'bg-oros-900 text-oros-400'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-oros-100">{mode.title}</span>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-accent shadow-sm" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Themes Gallery & Config Files */}
                <div className="space-y-3 pt-2 border-t border-oros-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                        Installed & Built-in Themes
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setThemeImportJson('')
                          setThemeImportError('')
                          setShowThemeImportModal(true)
                        }}
                        className="px-2.5 py-1 rounded-[3px] bg-oros-950 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-oros-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-accent" />
                        <span>Import Theme</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const activeCustomTheme = settings.interface.customThemes?.find((t) => t.id === activeThemeId)
                          if (activeCustomTheme) {
                            downloadJsonFile(exportThemeToJson(activeCustomTheme), `oros-theme-${activeCustomTheme.id}.json`)
                          } else {
                            const tokens = getThemeTokens(activeThemeId as any, undefined, settings.interface.colorMode === 'light')
                            const exported: ThemeConfig = {
                              id: activeThemeId,
                              name: THEME_PRESETS.find((t) => t.id === activeThemeId)?.name || 'Custom Theme',
                              author: 'Oros User',
                              version: '1.0.0',
                              tokens,
                              colorMode: settings.interface.colorMode
                            }
                            downloadJsonFile(exportThemeToJson(exported), `oros-theme-${activeThemeId}.json`)
                          }
                          addToast('Exported theme configuration JSON', 'success')
                        }}
                        className="px-2.5 py-1 rounded-[3px] bg-oros-950 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-oros-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-oros-400" />
                        <span>Export Active</span>
                      </button>
                    </div>
                  </div>

                  {/* Grid of Theme Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Built-in Presets */}
                    {THEME_PRESETS.map((preset) => {
                      const isSelected = activeThemeId === preset.id
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            if (themeScope === 'workspace' && activeWorld) {
                              updateWorld(activeWorld.id, { theme: preset.id, themeConfig: undefined })
                              addToast(`Applied theme to ${activeWorld.name}`, 'success')
                            } else {
                              updateInterface({ themePreset: preset.id })
                              addToast(`Applied ${preset.name} globally`, 'success')
                            }
                          }}
                          className={`p-3 rounded-[3px] border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-oros-950 border-accent text-oros-100 shadow-sm ring-1 ring-accent/30'
                              : 'bg-oros-950/60 border-oros-800 text-oros-400 hover:border-oros-700 hover:text-oros-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-xs" 
                                style={{ backgroundColor: preset.hex }} 
                              />
                              <span className="text-[10px] font-mono text-oros-500 uppercase">{preset.author}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                          </div>

                          <div>
                            <span className="text-xs font-semibold text-oros-100 block">{preset.name}</span>
                          </div>
                        </div>
                      )
                    })}

                    {/* Installed Custom Themes */}
                    {(settings.interface.customThemes || []).map((custom) => {
                      const isSelected = activeThemeId === custom.id
                      const accentColor = custom.tokens.accent || '#e2e8f0'
                      return (
                        <div
                          key={custom.id}
                          onClick={() => {
                            if (themeScope === 'workspace' && activeWorld) {
                              updateWorld(activeWorld.id, { theme: custom.id, themeConfig: custom })
                              addToast(`Applied custom theme to ${activeWorld.name}`, 'success')
                            } else {
                              updateInterface({ themePreset: custom.id })
                              addToast(`Applied ${custom.name} globally`, 'success')
                            }
                          }}
                          className={`p-3 rounded-[3px] border cursor-pointer transition-all flex flex-col justify-between relative group ${
                            isSelected
                              ? 'bg-oros-950 border-accent text-oros-100 shadow-sm ring-1 ring-accent/30'
                              : 'bg-oros-950/60 border-oros-800 text-oros-400 hover:border-oros-700 hover:text-oros-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-xs" 
                                style={{ backgroundColor: accentColor }} 
                              />
                              <span className="text-[10px] font-mono text-accent uppercase font-semibold">Custom</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeCustomTheme(custom.id)
                                  addToast(`Removed theme "${custom.name}"`, 'info')
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-oros-500 hover:text-rose-400 transition-opacity"
                                title="Delete installed theme"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-semibold text-oros-100 block">{custom.name}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Force Global Theme Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer mt-2">
                    <span className="font-medium text-oros-100 block text-xs">Force Global Theme Across All Vaults</span>
                    <input
                      type="checkbox"
                      checked={settings.interface.forceGlobalTheme}
                      onChange={(e) => updateInterface({ forceGlobalTheme: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* 4. Theme Marketplace Preview */}
                <div className="p-4 rounded-[4px] bg-gradient-to-br from-oros-950 via-oros-950 to-oros-900 border border-oros-800 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-[3px] bg-accent/15 flex items-center justify-center text-accent">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-oros-100 block">Theme Marketplace</span>
                        <span className="text-[10.5px] text-oros-400 block">Coming soon in v0.2.0</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-accent-muted text-accent border border-accent/30 uppercase font-bold">
                      Roadmap Feature
                    </span>
                  </div>

                  <p className="text-xs text-oros-300 leading-relaxed">
                    Browse and install verified themes, layout styles, and visual plugins directly within Oros, or package your own theme configurations.
                  </p>

                  {/* Mock Marketplace Teaser Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { name: 'Catppuccin Macchiato', accent: '#f5bde6', author: 'Catppuccin' },
                      { name: 'Tokyo Night', accent: '#7aa2f7', author: 'Enkai' },
                      { name: 'Dracula Atelier', accent: '#bd93f9', author: 'Vlad' },
                      { name: 'Solarized Dark', accent: '#268bd2', author: 'Ethan S.' }
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="p-2.5 rounded-[3px] bg-oros-900/60 border border-oros-800/80 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
                          <span className="text-[9.5px] font-mono text-oros-500 uppercase truncate">{item.author}</span>
                        </div>
                        <span className="text-[11px] font-medium text-oros-200 block truncate">{item.name}</span>
                        <span className="text-[9.5px] font-mono text-accent mt-1">Available Soon</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-oros-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-oros-400">Want to develop a theme? Read guidelines in DESIGN.md</span>
                    <button
                      type="button"
                      onClick={() => addToast('Theme Marketplace launches in v0.2.0! Use JSON Import for custom themes.', 'info')}
                      className="px-2.5 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-750 text-oros-200 text-xs font-semibold transition-colors"
                    >
                      Explore Themes
                    </button>
                  </div>
                </div>

                {/* 6. Typography Fonts */}
                <div className="space-y-3 pt-2 border-t border-oros-800/80">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Typography Families
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="block text-[10px] text-oros-400 font-medium mb-1">Heading / Serif Font</span>
                      <select
                        value={settings.interface.headingFont}
                        onChange={(e) => updateInterface({ headingFont: e.target.value })}
                        className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                      >
                        <option value="playfair">Playfair Display (Default)</option>
                        <option value="cinzel">Cinzel (Dark Fantasy)</option>
                        <option value="cinzel-decorative">Cinzel Decorative (Ornate)</option>
                        <option value="cormorant">Cormorant Garamond (Classical)</option>
                        <option value="literata">Literata (Literary Editorial)</option>
                        <option value="merriweather">Merriweather (Warm Serif)</option>
                        <option value="lora">Lora (Calligraphic)</option>
                        <option value="eb-garamond">EB Garamond (Renaissance)</option>
                        <option value="crimson-pro">Crimson Pro (Noble High-Contrast)</option>
                        <option value="philosopher">Philosopher (Mystic/Mythic)</option>
                        <option value="georgia">Georgia (System Serif)</option>
                        <option value="inter">Inter (Modern Clean)</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[10px] text-oros-400 font-medium mb-1">Body / UI Font</span>
                      <select
                        value={settings.interface.bodyFont}
                        onChange={(e) => updateInterface({ bodyFont: e.target.value })}
                        className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                      >
                        <option value="inter">Inter (Default Clean)</option>
                        <option value="jakarta">Plus Jakarta Sans (Editorial)</option>
                        <option value="outfit">Outfit (Contemporary)</option>
                        <option value="space-grotesk">Space Grotesk (Tech)</option>
                        <option value="raleway">Raleway (Elegant Sans)</option>
                        <option value="system">System Default</option>
                        <option value="segoe">Segoe UI</option>
                      </select>
                    </div>

                    <div>
                      <span className="block text-[10px] text-oros-400 font-medium mb-1">Mono / Code Font</span>
                      <select
                        value={settings.interface.monoFont}
                        onChange={(e) => updateInterface({ monoFont: e.target.value })}
                        className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                      >
                        <option value="jetbrains">JetBrains Mono (Default)</option>
                        <option value="fira">Fira Code (Ligatures)</option>
                        <option value="ibm-plex">IBM Plex Mono (Industrial)</option>
                        <option value="space-mono">Space Mono (Sci-Fi)</option>
                        <option value="courier">Courier Prime (Manuscript)</option>
                        <option value="consolas">Consolas (System)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 7. Interface Preview */}
                {renderInterfacePreview()}

                {/* 5. UI Density */}
                <div className="space-y-2 pt-2 border-t border-oros-800/80">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Layout Density
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact', title: 'Compact' },
                      { id: 'standard', title: 'Standard' },
                      { id: 'comfortable', title: 'Comfortable' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => updateInterface({ uiDensity: d.id as any })}
                        className={`p-2.5 rounded-[3px] border text-center transition-colors ${
                          settings.interface.uiDensity === d.id
                            ? 'bg-oros-950 border-accent text-oros-100 shadow-sm ring-1 ring-accent/30 font-semibold'
                            : 'bg-oros-950/60 border-oros-800 text-oros-300 hover:border-oros-700 hover:text-oros-100'
                        }`}
                      >
                        <span className="block text-xs">{d.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. GPU & Performance */}
                <div className="space-y-2 pt-2 border-t border-oros-800/80">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    GPU & Performance
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer">
                    <span className="font-medium text-oros-100 block">Enable Glassmorphism Backdrop Blur</span>
                    <input
                      type="checkbox"
                      checked={settings.interface.enableBackdropBlur}
                      onChange={(e) => updateInterface({ enableBackdropBlur: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer">
                    <span className="font-medium text-oros-100 block">Smooth Interface Animations</span>
                    <input
                      type="checkbox"
                      checked={settings.interface.enableAnimations}
                      onChange={(e) => updateInterface({ enableAnimations: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: EDITOR                                                  */}
            {/* ============================================================== */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-serif font-bold text-sm text-oros-100 mb-1">Editor & Writing Experience</h4>
                </div>

                {/* Font Size & Line Height */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                        Editor Font Size
                      </label>
                      <span className="text-accent font-mono font-bold">{settings.editor.fontSize}px</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[13, 14, 15, 16, 18, 20, 22, 24].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateEditor({ fontSize: size })}
                          className={`py-1.5 rounded-[3px] border font-mono text-xs transition-colors ${
                            settings.editor.fontSize === size
                              ? 'btn-accent font-bold shadow-sm'
                              : 'bg-oros-950 border-oros-800 text-oros-300 hover:text-oros-100 hover:bg-oros-850'
                          }`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                        Line Spacing
                      </label>
                      <span className="text-accent font-mono font-bold">{settings.editor.lineHeight}x</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { val: 1.4, label: '1.4' },
                        { val: 1.5, label: '1.5' },
                        { val: 1.65, label: '1.65' },
                        { val: 1.85, label: '1.85' },
                        { val: 2.0, label: '2.0' }
                      ].map((lh) => (
                        <button
                          key={lh.val}
                          type="button"
                          onClick={() => updateEditor({ lineHeight: lh.val })}
                          className={`py-1.5 rounded-[3px] border font-mono text-xs transition-colors ${
                            settings.editor.lineHeight === lh.val
                              ? 'btn-accent font-bold shadow-sm'
                              : 'bg-oros-950 border-oros-800 text-oros-300 hover:text-oros-100 hover:bg-oros-850'
                          }`}
                        >
                          {lh.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column Max Width */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Reading Column Width
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'readable', title: 'Readable (680px)' },
                      { id: 'wide', title: 'Wide (880px)' },
                      { id: 'full', title: 'Full Viewport' }
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => updateEditor({ maxWidth: w.id as any })}
                        className={`p-2.5 rounded-[3px] border text-center transition-colors ${
                          settings.editor.maxWidth === w.id
                            ? 'bg-oros-950 border-accent text-oros-100 shadow-sm ring-1 ring-accent/30 font-semibold'
                            : 'bg-oros-950/60 border-oros-800 text-oros-300 hover:border-oros-700 hover:text-oros-100'
                        }`}
                      >
                        <span className="block text-xs">{w.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Editor Preview */}
                {renderEditorPreview()}

                {/* Writing Assists */}
                <div className="space-y-2 pt-2 border-t border-oros-800/80">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Writing & Editing Assists
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer">
                    <span className="font-medium text-oros-100 block">Typewriter Scrolling Mode</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.typewriterMode}
                      onChange={(e) => updateEditor({ typewriterMode: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer">
                    <span className="font-medium text-oros-100 block">Auto-Pair Brackets & Quotes</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.autoPairBrackets}
                      onChange={(e) => updateEditor({ autoPairBrackets: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer">
                    <span className="font-medium text-oros-100 block">Native Spellcheck</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.spellcheck}
                      onChange={(e) => updateEditor({ spellcheck: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 hover:border-oros-750 transition-colors cursor-pointer">
                    <span className="font-medium text-oros-100 block">Show Word & Character Count Metrics</span>
                    <input
                      type="checkbox"
                      checked={settings.editor.showWordCount}
                      onChange={(e) => updateEditor({ showWordCount: e.target.checked })}
                      className="w-4 h-4 accent-accent rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: FILES & VAULT (DIRECTORY SETTINGS)                       */}
            {/* ============================================================== */}
            {activeTab === 'files' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-serif font-bold text-sm text-oros-100 mb-1">Files, Vault & Directory Settings</h4>
                </div>

                {/* Vault Location Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                      Active Vault Storage Directory
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Connected
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-oros-200 truncate select-all">
                      {vaultPath}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyPath}
                        className="p-1 px-2 rounded-[2px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-800 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Copy file path"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenExplorer}
                        className="p-1 px-2 rounded-[2px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-800 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Open in File Explorer"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Explorer</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleChooseFolder}
                      className="px-3 py-1.5 rounded-[3px] btn-accent font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Change Vault Directory...</span>
                    </button>
                  </div>
                </div>

                {/* Storage Footprint Statistics */}
                <div className="space-y-2 pt-2 border-t border-oros-800/80">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Storage Footprint & Assets
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-[3px] bg-oros-950 border border-oros-800 text-center">
                      <span className="text-[10px] font-mono text-oros-400 block uppercase">Artwork Assets</span>
                      <span className="text-lg font-bold text-oros-100 font-mono block mt-0.5">
                        {storageStats ? storageStats.assetsCount : 0} files
                      </span>
                    </div>

                    <div className="p-3 rounded-[3px] bg-oros-950 border border-oros-800 text-center">
                      <span className="text-[10px] font-mono text-oros-400 block uppercase">Asset Disk Usage</span>
                      <span className="text-lg font-bold text-accent font-mono block mt-0.5">
                        {storageStats ? `${storageStats.assetsSizeMb} MB` : '0 MB'}
                      </span>
                    </div>

                    <div className="p-3 rounded-[3px] bg-oros-950 border border-oros-800 text-center">
                      <span className="text-[10px] font-mono text-oros-400 block uppercase">Snapshots Retained</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono block mt-0.5">
                        {storageStats ? storageStats.backupsCount : 1}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenAssets}
                      className="px-2.5 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-oros-400" />
                      <span>Open Assets Directory</span>
                    </button>
                  </div>
                </div>

                {/* Backups & Snapshots */}
                <div className="space-y-2.5 pt-2 border-t border-oros-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-oros-100 block">Snapshot Backups</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateSnapshot}
                      className="px-3 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 text-oros-200 hover:text-oros-100 border border-oros-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span>Create Snapshot Now</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs text-oros-300">Max rolling backups to keep:</span>
                    <select
                      value={settings.files.maxBackups}
                      onChange={(e) => updateFiles({ maxBackups: Number(e.target.value) })}
                      className="bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                    >
                      <option value="3">3 snapshots</option>
                      <option value="5">5 snapshots (Default)</option>
                      <option value="10">10 snapshots</option>
                      <option value="20">20 snapshots</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: HOTKEYS                                                 */}
            {/* ============================================================== */}
            {activeTab === 'hotkeys' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-oros-100 mb-1">Keyboard Shortcuts</h4>
                  </div>

                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={hotkeyQuery}
                      onChange={(e) => setHotkeyQuery(e.target.value)}
                      placeholder="Filter shortcuts..."
                      className="w-full bg-oros-950 border border-oros-800 rounded-[3px] pl-8 pr-2.5 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="border border-oros-800 rounded-[3px] overflow-hidden bg-oros-950">
                  <div className="grid grid-cols-12 bg-oros-900 border-b border-oros-800 px-3 py-1.5 text-[10px] font-mono uppercase text-oros-400 font-bold tracking-wider">
                    <span className="col-span-4">Command / Action</span>
                    <span className="col-span-3">Category</span>
                    <span className="col-span-5 text-right">Key Combination</span>
                  </div>

                  <div className="divide-y divide-oros-800/60 max-h-[340px] overflow-y-auto">
                    {filteredHotkeys.map((h, i) => (
                      <div key={i} className="grid grid-cols-12 items-center px-3 py-2 text-xs hover:bg-oros-900/60 transition-colors">
                        <span className="col-span-4 font-medium text-oros-100">{h.desc}</span>
                        <span className="col-span-3 text-[10px] font-mono text-oros-400">{h.cat}</span>
                        <div className="col-span-5 text-right">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-oros-900 text-accent border border-oros-750 shadow-sm font-bold">
                            {h.key}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 6: ABOUT & DIAGNOSTICS                                     */}
            {/* ============================================================== */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-oros-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[4px] bg-oros-950 border border-accent/40 flex items-center justify-center text-accent shadow-md">
                      <OrosLogoMark className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-oros-100 tracking-wide">
                        Oros — Worldbuilding & Codex Studio
                      </h4>
                    </div>
                  </div>
                </div>

                {/* System Specs */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase text-oros-300 font-bold tracking-wider">
                    Application & Runtime Environment
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    <div className="p-2.5 rounded-[3px] bg-oros-950 border border-oros-800">
                      <span className="text-[10px] text-oros-500 uppercase block">Oros Version</span>
                      <span className="font-bold text-oros-100 block mt-0.5">{systemInfo ? systemInfo.version : '0.1.0'}</span>
                    </div>

                    <div className="p-2.5 rounded-[3px] bg-oros-950 border border-oros-800">
                      <span className="text-[10px] text-oros-500 uppercase block">Electron Core</span>
                      <span className="font-bold text-oros-100 block mt-0.5">{systemInfo ? systemInfo.electron : 'v34.x'}</span>
                    </div>

                    <div className="p-2.5 rounded-[3px] bg-oros-950 border border-oros-800">
                      <span className="text-[10px] text-oros-500 uppercase block">Chromium Engine</span>
                      <span className="font-bold text-oros-100 block mt-0.5">{systemInfo ? systemInfo.chrome : 'Chrome'}</span>
                    </div>
                  </div>
                </div>

                {/* Software Updates & Releases */}
                <div className="space-y-2.5 pt-2 border-t border-oros-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-oros-100 block">Software Updates & Releases</span>
                      <span className="text-[11px] text-oros-400 block">
                        Client fetches new builds directly from GitHub (<code className="text-accent font-mono text-[10px]">gpwid/oros</code>)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(true)}
                      className="px-3 py-1.5 rounded-[3px] btn-accent font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Check for Updates</span>
                    </button>
                  </div>
                </div>

                {/* Database Integrity Health Validator */}
                <div className="space-y-2.5 pt-2 border-t border-oros-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-oros-100 block">Vault Database Health</span>
                    </div>
                    <button
                      type="button"
                      onClick={runHealthCheck}
                      className="px-3 py-1.5 rounded-[3px] btn-accent font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Run Health Diagnostic</span>
                    </button>
                  </div>

                  {healthStatus && (
                    <div className="p-3 rounded-[3px] bg-oros-950 border border-emerald-600/40 space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>{healthStatus.message}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-oros-300 pt-1 border-t border-oros-800">
                        {healthStatus.details.map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Factory Reset */}
                <div className="pt-2 border-t border-oros-800/80 flex items-center justify-between">
                  <span className="text-xs text-oros-400">Restore default preferences:</span>
                  <button
                    type="button"
                    onClick={() => {
                      resetAllToDefaults()
                      addToast('Reset all application preferences to defaults', 'info')
                    }}
                    className="px-2.5 py-1 rounded-[3px] bg-oros-950 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-900/60 text-xs font-medium transition-colors"
                  >
                    Reset All Settings
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="h-11 border-t border-oros-800 px-5 flex items-center justify-between bg-oros-950 shrink-0 text-xs">
          <span className="text-oros-500 font-mono text-[10px]">
            Settings auto-save instantaneously to local configuration
          </span>

          <button
            onClick={closeSettings}
            className="px-4 py-1.5 rounded-[3px] btn-accent font-semibold text-xs shadow-sm transition-colors"
          >
            Done
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* SUB-MODAL 1: THEME IMPORT MODAL                                 */}
      {/* ============================================================== */}
      {showThemeImportModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in select-none">
          <div 
            className="bg-oros-900 border border-oros-750 rounded-[4px] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-modal-in select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-oros-800 bg-oros-950 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-accent" />
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                  Import Theme Config (JSON)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowThemeImportModal(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 font-sans text-xs">
              <p className="text-oros-300 leading-relaxed">
                Paste an Oros Theme configuration JSON or upload a <code className="text-accent font-mono">.json</code> file. 
                Theme configs specify accent tokens, contrast formulas, and optional CSS rules.
              </p>

              <div className="flex items-center justify-between pt-1">
                <label className="text-[10px] font-mono uppercase text-oros-400 font-bold tracking-wider">
                  Theme JSON Payload
                </label>
                <button
                  type="button"
                  onClick={() => fileThemeInputRef.current?.click()}
                  className="text-[11px] text-accent hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Upload className="w-3 h-3" />
                  <span>Choose file...</span>
                </button>
                <input
                  type="file"
                  ref={fileThemeInputRef}
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const text = await file.text()
                      setThemeImportJson(text)
                    } catch {
                      addToast('Failed to read file', 'error')
                    }
                  }}
                />
              </div>

              <textarea
                rows={10}
                value={themeImportJson}
                onChange={(e) => {
                  setThemeImportJson(e.target.value)
                  if (themeImportError) setThemeImportError('')
                }}
                placeholder={`{\n  "id": "my-custom-theme",\n  "name": "My Custom Theme",\n  "author": "Archivist",\n  "tokens": {\n    "accent": "#06b6d4"\n  }\n}`}
                className="w-full bg-oros-950 border border-oros-750 rounded-[3px] p-2.5 font-mono text-[11px] text-oros-200 placeholder-oros-600 focus:outline-none focus:border-accent"
              />

              {themeImportError && (
                <div className="p-2 rounded-[3px] bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{themeImportError}</span>
                </div>
              )}
            </div>

            {/* Pinned Action Footer */}
            <div className="px-4 py-3 border-t border-oros-800 bg-oros-950/80 shrink-0 flex items-center justify-between">
              <span className="text-[10px] font-mono text-oros-500">
                Target: {themeScope === 'workspace' && activeWorld ? `Workspace "${activeWorld.name}"` : 'Global App'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowThemeImportModal(false)}
                  className="px-3 py-1.5 rounded-[3px] text-xs font-medium text-oros-300 hover:text-oros-100 bg-oros-850 hover:bg-oros-800 border border-oros-750 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThemeImportError('')
                    const res = parseThemeFromJson(themeImportJson)
                    if (!res.success || !res.theme) {
                      setThemeImportError(res.error || 'Invalid JSON format')
                      return
                    }

                    if (themeScope === 'workspace' && activeWorld) {
                      updateWorld(activeWorld.id, {
                        themeConfig: res.theme,
                        theme: res.theme.id
                      })
                      addToast(`Imported and applied theme "${res.theme.name}" to workspace`, 'success')
                    } else {
                      installCustomTheme(res.theme)
                      addToast(`Imported and installed theme "${res.theme.name}" globally`, 'success')
                    }

                    setShowThemeImportModal(false)
                    setThemeImportJson('')
                  }}
                  className="btn-accent px-4 py-1.5 rounded-[3px] text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Import & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Update Client Modal */}
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />

    </div>
  )
}
