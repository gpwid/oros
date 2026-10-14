import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Compass, Shield, Download, Plus, Check, Loader2, 
  ChevronDown, Search, FolderOpen 
} from 'lucide-react'

export const TitleBar: React.FC = () => {
  const { 
    worlds, activeWorldId, setActiveWorldId, createWorld, 
    exportWorld, isSaving, gmMode, toggleGmMode 
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newWorldName, setNewWorldName] = useState('')
  const [newWorldGenre, setNewWorldGenre] = useState('Fantasy')
  const [newWorldTagline, setNewWorldTagline] = useState('')

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
        <div className="flex items-center gap-2 pr-28">
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
              await exportWorld()
              addToast('World exported as standalone archive', 'success')
            }}
            title="Export World Archive (.oros.json)"
            className="p-1.5 rounded-[2px] hover:bg-oros-850 text-oros-400 hover:text-oros-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* New World Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-md rounded-[4px] shadow-2xl p-5">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100 mb-1 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-oros-400" />
              <span>Forge a New Realm</span>
            </h3>
            <p className="text-xs text-oros-400 mb-4">
              Initialize a sovereign world vault with its own encyclopedia, maps, and timeline.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">World Name</label>
                <input
                  type="text"
                  required
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                  placeholder="e.g. Eldoria: The Sunken Archipelago"
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Genre</label>
                <input
                  type="text"
                  value={newWorldGenre}
                  onChange={(e) => setNewWorldGenre(e.target.value)}
                  placeholder="e.g. Epic High Fantasy / Cyberpunk / Sci-Fi"
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Tagline or Logline</label>
                <textarea
                  rows={2}
                  value={newWorldTagline}
                  onChange={(e) => setNewWorldTagline(e.target.value)}
                  placeholder="A one-sentence summary of the world's core premise..."
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 resize-none font-sans"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded-[3px] text-xs text-oros-300 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[3px] text-xs font-semibold bg-oros-200 hover:bg-white text-oros-950 transition-colors shadow-sm"
                >
                  Initialize World
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
