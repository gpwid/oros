import React, { useState, useRef } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Compass, Shield, Download, Upload, Plus, Check, Loader2, 
  ChevronDown, Search, FolderOpen, X 
} from 'lucide-react'

export const TitleBar: React.FC = () => {
  const { 
    worlds, activeWorldId, setActiveWorldId, createWorld, 
    exportWorld, importWorld, isSaving, gmMode, toggleGmMode 
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newWorldName, setNewWorldName] = useState('')
  const [newWorldGenre, setNewWorldGenre] = useState('Fantasy')
  const [newWorldTagline, setNewWorldTagline] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeWorld = worlds.find((w) => w.id === activeWorldId) || worlds[0]

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorldName.trim()) return
    createWorld(newWorldName.trim(), newWorldTagline.trim(), newWorldGenre.trim())
    setShowNewModal(false)
    setNewWorldName('')
    setNewWorldTagline('')
    addToast(`Initialized world vault: ${newWorldName}`, 'success')
  }

  const handleOpenFolder = async () => {
    if (window.oros) {
      await window.oros.openVaultFolder()
      addToast('Opened vault directory in Explorer', 'info')
    } else {
      addToast('Vault folder only available in desktop app', 'warning')
    }
  }

  const handleImportWorld = async () => {
    if (typeof window !== 'undefined' && window.oros) {
      const success = await importWorld()
      if (success) {
        addToast('World archive imported successfully', 'success')
      } else {
        addToast('Import cancelled or failed', 'info')
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const success = await importWorld(text)
      if (success) {
        addToast('World archive imported successfully', 'success')
      } else {
        addToast('Failed to import world archive', 'error')
      }
    } catch (err) {
      console.error('File import error:', err)
      addToast('Error reading file for import', 'error')
    }
    e.target.value = ''
  }

  const triggerCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

  return (
    <>
      <header className="h-9 bg-oros-950 border-b border-oros-800 flex items-center justify-between px-3 z-40 select-none">
        {/* Left: Brand & World Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-oros-800">
            <div className="w-5 h-5 rounded-[2px] bg-oros-900 border border-oros-750 flex items-center justify-center text-oros-100 font-bold text-xs">
              <Compass className="w-3.5 h-3.5 text-oros-300" />
            </div>
            <span className="font-serif font-black tracking-wider text-xs uppercase text-oros-100">
              OROS
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded-[2px] bg-oros-900 text-oros-400 font-mono border border-oros-750">
              VAULT
            </span>
          </div>

          {/* World Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-750 text-xs font-medium text-oros-200 transition-colors"
            >
              <Compass className="w-3 h-3 text-oros-400" />
              <span className="max-w-[180px] truncate">{activeWorld?.name || 'Select World'}</span>
              <ChevronDown className="w-3 h-3 text-oros-400" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute left-0 mt-1 w-64 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl py-1 z-50 animate-in fade-in duration-100"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] font-mono font-medium text-oros-400 uppercase tracking-wider">
                  Active Worlds
                </div>
                {worlds.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWorldId(w.id)
                      addToast(`Switched to world: ${w.name}`, 'info')
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-oros-800 transition-colors ${
                      w.id === activeWorldId ? 'text-oros-100 font-medium bg-oros-800/60' : 'text-oros-300'
                    }`}
                  >
                    <div className="truncate">
                      <div>{w.name}</div>
                      <div className="text-[10px] text-oros-400 font-mono">{w.genre}</div>
                    </div>
                    {w.id === activeWorldId && <Check className="w-3.5 h-3.5 shrink-0 text-oros-200" />}
                  </button>
                ))}
                <div className="border-t border-oros-800 my-1" />
                <button
                  onClick={() => setShowNewModal(true)}
                  className="w-full text-left px-3 py-1.5 text-xs text-oros-300 hover:text-oros-100 hover:bg-oros-800 flex items-center gap-2 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New World
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    handleImportWorld()
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-oros-300 hover:text-oros-100 hover:bg-oros-800 flex items-center gap-2 font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import World Archive
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Command Palette Trigger Bar */}
        <div className="flex-1 max-w-sm mx-4">
          <button
            onClick={triggerCommandPalette}
            className="w-full py-1 px-2.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-750 hover:border-oros-600 text-xs text-oros-400 flex items-center justify-between transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3 h-3 text-oros-400" />
              <span className="truncate">Search lore, maps, chapters...</span>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-oros-950 text-oros-400 border border-oros-750">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions & Indicators */}
        <div 
          className="flex items-center gap-2 pr-[148px]"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          {/* Auto-Save Indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-oros-400 font-mono uppercase tracking-wider">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-oros-300" />
                <span className="text-oros-300">Saving...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Synced</span>
              </>
            )}
          </div>

          {/* Open Vault Folder */}
          <button
            onClick={handleOpenFolder}
            title="Open Local Vault Folder in Explorer"
            className="p-1.5 rounded-[2px] hover:bg-oros-850 text-oros-400 hover:text-oros-100 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>

          {/* GM Secret Mode Toggle */}
          <button
            onClick={toggleGmMode}
            title={gmMode ? "GM Secrets: VISIBLE" : "GM Secrets: HIDDEN (Player Safe)"}
            className={`px-2 py-0.5 rounded-[3px] text-xs flex items-center gap-1.5 border transition-colors ${
              gmMode 
                ? 'bg-oros-800 text-oros-100 border-oros-600 shadow-sm font-medium' 
                : 'bg-oros-900 text-oros-400 border-oros-750 hover:text-oros-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span className="text-[11px]">{gmMode ? 'GM Mode' : 'Player View'}</span>
          </button>

          {/* Export World */}
          <button
            onClick={async () => {
              const success = await exportWorld()
              if (success) {
                addToast('World exported as standalone archive', 'success')
              }
            }}
            title="Export World Archive (.oros.json)"
            className="p-1.5 rounded-[2px] hover:bg-oros-850 text-oros-400 hover:text-oros-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Import World */}
          <button
            onClick={handleImportWorld}
            title="Import World Archive (.oros.json)"
            className="p-1.5 rounded-[2px] hover:bg-oros-850 text-oros-400 hover:text-oros-100 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Hidden File Input Fallback */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,.oros.json"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      </header>

      {/* New World Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-100">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-sm rounded-[4px] shadow-2xl flex flex-col max-h-[380px] overflow-hidden select-text text-oros-100">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-accent" />
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                  New World
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form id="create-world-form" onSubmit={handleCreate} className="p-3.5 space-y-2.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">World Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                  placeholder="e.g. Aethelgard"
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Genre</label>
                <input
                  type="text"
                  value={newWorldGenre}
                  onChange={(e) => setNewWorldGenre(e.target.value)}
                  placeholder="e.g. Dark Fantasy, Cyberpunk"
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Tagline / Description</label>
                <textarea
                  rows={2}
                  value={newWorldTagline}
                  onChange={(e) => setNewWorldTagline(e.target.value)}
                  placeholder="Brief world premise..."
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent resize-none font-sans"
                />
              </div>
            </form>

            {/* Pinned Visible Footer */}
            <div className="px-4 py-2 border-t border-oros-750 bg-oros-900 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-world-form"
                className="btn-accent px-3.5 py-1 rounded-[3px] text-xs font-semibold transition-colors shadow-sm"
              >
                Create World
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
