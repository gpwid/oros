import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { 
  Compass, Shield, Download, Plus, Check, Loader2, Sparkles, ChevronDown 
} from 'lucide-react'

export const TitleBar: React.FC = () => {
  const { 
    worlds, activeWorldId, setActiveWorldId, createWorld, 
    exportWorld, isSaving, gmMode, toggleGmMode 
  } = useWorldStore()

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
  }

  return (
    <>
      <header className="h-10 bg-oros-950 border-b border-oros-800/40 flex items-center justify-between px-3 z-50 select-none">
        {/* Left: Brand & World Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-oros-800/60">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-amber-600 to-gold-400 flex items-center justify-center text-oros-950 font-bold text-xs shadow-sm">
              <Compass className="w-3.5 h-3.5 text-oros-950" />
            </div>
            <span className="font-serif font-black tracking-wider text-xs uppercase text-slate-100">
              OROS
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-oros-800/60 text-oros-300 font-mono">
              FOSS
            </span>
          </div>

          {/* World Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded bg-oros-900/80 hover:bg-oros-800/80 border border-oros-700/50 text-xs font-medium text-slate-200 transition-all"
            >
              <Sparkles className="w-3 h-3 text-gold-400" />
              <span className="max-w-[180px] truncate">{activeWorld?.name || 'Select World'}</span>
              <ChevronDown className="w-3 h-3 text-oros-400" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute left-0 mt-1.5 w-64 bg-oros-900 border border-oros-700 rounded-lg shadow-2xl py-1 z-50"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-oros-400 uppercase tracking-wider">
                  Active Worlds
                </div>
                {worlds.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setActiveWorldId(w.id)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-oros-800/60 transition-colors ${
                      w.id === activeWorldId ? 'text-gold-400 font-semibold bg-oros-800/40' : 'text-slate-300'
                    }`}
                  >
                    <div className="truncate">
                      <div>{w.name}</div>
                      <div className="text-[10px] text-oros-400">{w.genre}</div>
                    </div>
                    {w.id === activeWorldId && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
                <div className="border-t border-oros-800 my-1" />
                <button
                  onClick={() => setShowNewModal(true)}
                  className="w-full text-left px-3 py-1.5 text-xs text-gold-400 hover:bg-oros-800/60 flex items-center gap-2 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New World
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Window Dragging Area */}
        <div className="flex-1 text-center text-xs text-oros-400 font-mono tracking-tight opacity-70">
          {activeWorld?.genre ? `[${activeWorld.genre}]` : ''}
        </div>

        {/* Right: Actions & Indicators */}
        <div className="flex items-center gap-2 pr-28">
          {/* Auto-Save Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-oros-400 font-mono">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-gold-400" />
                <span className="text-gold-400">Saving...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Synced</span>
              </>
            )}
          </div>

          {/* GM Secret Mode Toggle */}
          <button
            onClick={toggleGmMode}
            title={gmMode ? "GM Secrets: VISIBLE" : "GM Secrets: HIDDEN (Player Safe)"}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 border transition-all ${
              gmMode 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' 
                : 'bg-oros-900/60 text-oros-400 border-oros-800 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span className="text-[11px] font-medium">{gmMode ? 'GM Mode' : 'Player View'}</span>
          </button>

          {/* Export World */}
          <button
            onClick={exportWorld}
            title="Export World Archive (.oros.json)"
            className="p-1.5 rounded hover:bg-oros-800 text-oros-300 hover:text-slate-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* New World Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-xl shadow-2xl p-6">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              Forge a New Realm
            </h3>
            <p className="text-xs text-oros-300 mb-4">
              Initialize a sovereign world vault with its own encyclopedia, maps, and timeline.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">World Name</label>
                <input
                  type="text"
                  required
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                  placeholder="e.g. Eldoria: The Sunken Archipelago"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Genre</label>
                <input
                  type="text"
                  value={newWorldGenre}
                  onChange={(e) => setNewWorldGenre(e.target.value)}
                  placeholder="e.g. Epic High Fantasy / Cyberpunk / Sci-Fi"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Tagline or Logline</label>
                <textarea
                  rows={2}
                  value={newWorldTagline}
                  onChange={(e) => setNewWorldTagline(e.target.value)}
                  placeholder="A one-sentence summary of the world's core premise..."
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-oros-950 transition-colors shadow-md"
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
