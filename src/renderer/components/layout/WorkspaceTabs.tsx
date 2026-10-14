import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Plus, X, LayoutGrid, BookOpen, Layers, Users, 
  Clock, Map as MapIcon, Feather, Compass, ChevronDown, 
  Sparkles, Check, FolderOpen, Shield, Download, Search, 
  Network, ArrowRight, CornerDownLeft, EyeOff, PlusCircle
} from 'lucide-react'
import { DirectoryItemType, LoreEntity } from '@shared/types'

export const WorkspaceTabs: React.FC = () => {
  const { 
    openTabs, activeTabId, setActiveTabId, closeTab, closeOtherTabs,
    closeTabsToTheRight, closeAllTabs, openTab,
    worlds, activeWorldId, setActiveWorldId, createWorld, exportWorld,
    isSaving, gmMode, toggleGmMode, createCanvas, createEntity,
    createMap, createTimelineEvent, createChapter,
    entities, maps, manuscripts, canvases
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [plusModalOpen, setPlusModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [worldDropdownOpen, setWorldDropdownOpen] = useState(false)
  const [showNewWorldModal, setShowNewWorldModal] = useState(false)
  const [newWorldName, setNewWorldName] = useState('')
  const [newWorldGenre, setNewWorldGenre] = useState('Fantasy')
  const [newWorldTagline, setNewWorldTagline] = useState('')

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    tabId: string;
    x: number;
    y: number;
  } | null>(null)

  const contextMenuRef = useRef<HTMLDivElement>(null)
  const worldMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const activeWorld = worlds.find((w) => w.id === activeWorldId) || worlds[0]
  const worldId = activeWorldId || 'world-aethelgard'
  const worldEntities = entities[worldId] || []
  const worldMaps = maps[worldId] || []
  const worldChapters = manuscripts[worldId] || []
  const worldCanvases = canvases[worldId] || []

  // Close dropdowns and context menu on outside click or Esc
  useEffect(() => {
    const handleDocumentMouseDown = (e: MouseEvent) => {
      // Dismiss context menu if click is outside it
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
      // Dismiss world dropdown if click is outside it
      if (worldMenuRef.current && !worldMenuRef.current.contains(e.target as Node)) {
        setWorldDropdownOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlusModalOpen(false)
        setWorldDropdownOpen(false)
        setContextMenu(null)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Auto-focus search input when plus modal opens
  useEffect(() => {
    if (plusModalOpen) {
      setSearchQuery('')
      setTimeout(() => searchInputRef.current?.focus(), 80)
    }
  }, [plusModalOpen])

  // Single unified color across all tab icons (Easier to look at)
  const getTabIcon = (type: DirectoryItemType) => {
    switch (type) {
      case 'canvas':
        return <LayoutGrid className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'wiki':
        return <BookOpen className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'card':
        return <Layers className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'relations':
        return <Users className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'timeline':
        return <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'map':
        return <MapIcon className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      case 'writer':
        return <Feather className="w-3.5 h-3.5 text-gold-400 shrink-0" />
      default:
        return <LayoutGrid className="w-3.5 h-3.5 text-gold-400 shrink-0" />
    }
  }

  // Filtered search results for the Plus Modal
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return null

    const matchedEntities = worldEntities.filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.type.toLowerCase().includes(q) ||
      (e.summary && e.summary.toLowerCase().includes(q))
    )

    const matchedMaps = worldMaps.filter(m => m.name.toLowerCase().includes(q))
    const matchedChapters = worldChapters.filter(c => c.title.toLowerCase().includes(q))
    const matchedCanvases = worldCanvases.filter(c => c.name.toLowerCase().includes(q))

    const features = [
      { id: 'canvas', title: 'Whiteboard Canvas', type: 'canvas' as DirectoryItemType, desc: 'Infinite whiteboard with cards, notes, shapes & sketching' },
      { id: 'wiki-network', title: 'Card Relations Network', type: 'wiki-network' as any, desc: 'Dynamic knowledge graph of card connections with gravity' },
      { id: 'relations', title: 'Baru Pohon Relasi (Lineage)', type: 'relations' as DirectoryItemType, desc: 'Napoleon familial & social ties graph' },
      { id: 'wiki', title: 'Encyclopedia (Wiki)', type: 'wiki' as DirectoryItemType, desc: 'Wikipedia-style lore articles & infoboxes' },
      { id: 'card', title: 'Lore Cards Gallery', type: 'card' as DirectoryItemType, desc: 'Filterable entity cards & schemas' },
      { id: 'timeline', title: 'Baru Linimasa (Timeline)', type: 'timeline' as DirectoryItemType, desc: 'Chronological eras & event milestones' },
      { id: 'map', title: 'Cartography Map', type: 'map' as DirectoryItemType, desc: 'Interactive deep-zoom map with pins' },
      { id: 'writer', title: 'Studio Writer', type: 'writer' as DirectoryItemType, desc: 'Manuscript chapter editor & codex' }
    ].filter(f => f.title.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q))

    return {
      entities: matchedEntities,
      maps: matchedMaps,
      chapters: matchedChapters,
      canvases: matchedCanvases,
      features
    }
  }, [searchQuery, worldEntities, worldMaps, worldChapters, worldCanvases])

  const handleOpenEntityTab = (entity: LoreEntity) => {
    openTab({
      title: entity.title,
      type: 'wiki',
      targetId: entity.id
    })
    setPlusModalOpen(false)
  }

  const handleCreateNewTab = (type: DirectoryItemType | 'wiki-network') => {
    setPlusModalOpen(false)
    switch (type) {
      case 'canvas': {
        const c = createCanvas(`Canvas ${Date.now().toString().slice(-4)}`)
        addToast(`Created Whiteboard: ${c.name}`, 'success')
        break
      }
      case 'wiki-network': {
        openTab({ title: 'Card Relations Network', type: 'wiki' as any, id: 'tab-wiki-network' })
        useWorldStore.getState().setActiveTab('wiki-network')
        break
      }
      case 'wiki': {
        const ent = createEntity('character', 'New Wiki Entry')
        openTab({ title: ent.title, type: 'wiki', targetId: ent.id })
        addToast('Opened new Wiki Article', 'success')
        break
      }
      case 'card': {
        openTab({ title: 'Lore Cards Gallery', type: 'card' })
        break
      }
      case 'relations': {
        openTab({ title: 'Baru Pohon Relasi', type: 'relations' })
        break
      }
      case 'timeline': {
        openTab({ title: 'Baru Linimasa', type: 'timeline' })
        break
      }
      case 'map': {
        openTab({ title: 'Cartography Map', type: 'map' })
        break
      }
      case 'writer': {
        openTab({ title: 'Studio Writer', type: 'writer' })
        break
      }
    }
  }

  // Quick creation handlers inside modal
  const handleQuickCreateEntity = (type: LoreEntity['type'], defaultTitle = 'New Lore Card') => {
    const ent = createEntity(type, defaultTitle)
    openTab({ title: ent.title, type: 'wiki', targetId: ent.id })
    setPlusModalOpen(false)
    addToast(`Created ${type}: ${ent.title}`, 'success')
  }

  const handleQuickCreateCanvas = () => {
    const c = createCanvas(`Canvas ${Date.now().toString().slice(-4)}`)
    setPlusModalOpen(false)
    addToast(`Created Canvas: ${c.name}`, 'success')
  }

  const handleQuickCreateChapter = () => {
    createChapter(`Chapter ${worldChapters.length + 1}`)
    openTab({ title: `Chapter ${worldChapters.length + 1}`, type: 'writer' })
    setPlusModalOpen(false)
    addToast('Created new Manuscript chapter', 'success')
  }

  const handleCreateWorldSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorldName.trim()) return
    createWorld(newWorldName.trim(), newWorldTagline.trim(), newWorldGenre.trim())
    setShowNewWorldModal(false)
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
      <header className="h-10 bg-oros-950/95 border-b border-oros-800/50 flex items-center justify-between px-2 select-none z-30 relative">
        {/* Left: World Switcher / Brand */}
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-oros-800/40">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-amber-600 to-gold-400 flex items-center justify-center text-oros-950 font-bold text-xs shadow-sm">
            <Compass className="w-3.5 h-3.5 text-oros-950" />
          </div>

          {/* World Dropdown */}
          <div className="relative" ref={worldMenuRef}>
            <button
              onClick={() => setWorldDropdownOpen(!worldDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-oros-900/60 hover:bg-oros-800/80 border border-oros-800/60 text-xs font-semibold text-slate-200 transition-all"
            >
              <span className="max-w-[130px] truncate">{activeWorld?.name || 'World'}</span>
              <ChevronDown className="w-3 h-3 text-oros-400" />
            </button>

            {worldDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-oros-900 border border-oros-700/80 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-oros-400 uppercase tracking-wider">
                  Worlds
                </div>
                {worlds.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWorldId(w.id)
                      setWorldDropdownOpen(false)
                      addToast(`Switched to world: ${w.name}`, 'info')
                    }}
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
                  onClick={() => {
                    setWorldDropdownOpen(false)
                    setShowNewWorldModal(true)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gold-400 hover:bg-oros-800/60 flex items-center gap-2 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New World
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Browser Workspace Tabs List */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar mx-2 py-0.5">
          {openTabs.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-oros-400/80 font-mono italic px-2">
              <Network className="w-3.5 h-3.5 text-gold-400" />
              <span>Card Relations (Default View)</span>
            </div>
          ) : (
            openTabs.map((tab) => {
              const isActive = tab.id === activeTabId
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setContextMenu({
                      tabId: tab.id,
                      x: e.clientX,
                      y: e.clientY
                    })
                  }}
                  className={`group relative flex items-center gap-2 h-7 px-3 rounded-lg text-xs cursor-pointer select-none transition-all duration-150 shrink-0 ${
                    isActive
                      ? 'bg-oros-800/90 text-slate-100 font-medium shadow-sm border border-oros-700/60 ring-1 ring-gold-400/20'
                      : 'text-oros-400 hover:text-slate-200 hover:bg-oros-900/60'
                  }`}
                  title="Right-click for tab options"
                >
                  {getTabIcon(tab.type)}
                  <span className="max-w-[140px] truncate leading-none">{tab.title}</span>
                  
                  {/* Close Button */}
                  {tab.isClosable !== false && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab.id)
                      }}
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                        isActive 
                          ? 'text-oros-400 hover:text-white hover:bg-oros-700/70' 
                          : 'opacity-0 group-hover:opacity-100 text-oros-400 hover:text-white hover:bg-oros-800'
                      }`}
                      title="Close tab"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })
          )}

          {/* Plus Tab Button (Opens Centered Modal) */}
          <button
            onClick={() => setPlusModalOpen(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-oros-400 hover:text-gold-400 hover:bg-oros-800/60 transition-colors border border-transparent hover:border-oros-700/40 shrink-0"
            title="Open or Create Document / Card (New Tab)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Actions & Indicators */}
        <div className="flex items-center gap-2 shrink-0 pr-24">
          {/* Quick Search Ctrl+K */}
          <button
            onClick={triggerCommandPalette}
            className="px-2 py-1 rounded-md bg-oros-900/60 hover:bg-oros-900 border border-oros-800 text-[11px] text-oros-400 flex items-center gap-1.5 transition-colors"
            title="Global Quick Search (Ctrl+K)"
          >
            <Search className="w-3 h-3 text-gold-400" />
            <span className="hidden md:inline">Search</span>
            <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-oros-950 text-oros-400 border border-oros-800">
              Ctrl+K
            </kbd>
          </button>

          {/* GM Mode Toggle */}
          <button
            onClick={toggleGmMode}
            title={gmMode ? "GM Secrets: VISIBLE" : "GM Secrets: HIDDEN (Player Safe)"}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 border transition-all ${
              gmMode 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' 
                : 'bg-oros-900/60 text-oros-400 border-oros-800 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span className="text-[10px] font-medium hidden sm:inline">{gmMode ? 'GM Mode' : 'Player View'}</span>
          </button>

          {/* Sync Status */}
          <div className="flex items-center gap-1 text-[11px] text-oros-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden sm:inline">Synced</span>
          </div>

          {/* Vault Folder */}
          <button
            onClick={handleOpenFolder}
            title="Open Vault in Explorer"
            className="p-1.5 rounded hover:bg-oros-800 text-oros-400 hover:text-slate-100 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>

          {/* Export World */}
          <button
            onClick={async () => {
              await exportWorld()
              addToast('World exported as standalone archive', 'success')
            }}
            title="Export World Archive (.oros.json)"
            className="p-1.5 rounded hover:bg-oros-800 text-oros-400 hover:text-slate-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* FULL-SCREEN CENTERED MODAL POPUP (Pick or Create Document/Card/Feature) */}
      {plusModalOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPlusModalOpen(false)}
        >
          <div 
            className="bg-oros-900 border border-oros-700/90 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Live Search */}
            <div className="p-3.5 border-b border-oros-800/80 bg-oros-950/70 flex items-center gap-3">
              <Search className="w-4 h-4 text-gold-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards, wiki articles, maps, or studio features..."
                className="w-full bg-transparent text-sm text-slate-100 placeholder-oros-500 outline-none"
              />
              <button 
                onClick={() => setPlusModalOpen(false)}
                className="p-1 rounded-lg text-oros-400 hover:text-slate-100 hover:bg-oros-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Create Bar */}
            <div className="px-4 py-2.5 bg-oros-950/40 border-b border-oros-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono uppercase font-bold text-oros-400 mr-1 shrink-0">
                Create New:
              </span>
              <button
                onClick={() => handleQuickCreateEntity('character', 'New Character')}
                className="px-2.5 py-1 rounded-lg bg-oros-800/60 hover:bg-oros-700/80 border border-oros-700/50 text-xs text-slate-200 hover:text-gold-400 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3 h-3 text-gold-400" />
                <span>Card</span>
              </button>
              <button
                onClick={handleQuickCreateCanvas}
                className="px-2.5 py-1 rounded-lg bg-oros-800/60 hover:bg-oros-700/80 border border-oros-700/50 text-xs text-slate-200 hover:text-gold-400 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3 h-3 text-gold-400" />
                <span>Canvas</span>
              </button>
              <button
                onClick={() => handleCreateNewTab('relations')}
                className="px-2.5 py-1 rounded-lg bg-oros-800/60 hover:bg-oros-700/80 border border-oros-700/50 text-xs text-slate-200 hover:text-gold-400 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3 h-3 text-gold-400" />
                <span>Lineage Tree</span>
              </button>
              <button
                onClick={() => handleCreateNewTab('timeline')}
                className="px-2.5 py-1 rounded-lg bg-oros-800/60 hover:bg-oros-700/80 border border-oros-700/50 text-xs text-slate-200 hover:text-gold-400 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3 h-3 text-gold-400" />
                <span>Timeline</span>
              </button>
              <button
                onClick={() => handleQuickCreateEntity('location', 'New Location')}
                className="px-2.5 py-1 rounded-lg bg-oros-800/60 hover:bg-oros-700/80 border border-oros-700/50 text-xs text-slate-200 hover:text-gold-400 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3 h-3 text-gold-400" />
                <span>Location</span>
              </button>
              <button
                onClick={handleQuickCreateChapter}
                className="px-2.5 py-1 rounded-lg bg-oros-800/60 hover:bg-oros-700/80 border border-oros-700/50 text-xs text-slate-200 hover:text-gold-400 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Plus className="w-3 h-3 text-gold-400" />
                <span>Chapter</span>
              </button>
            </div>

            {/* Modal Body / Search & Browse Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {searchResults ? (
                // SEARCH RESULTS
                <div className="space-y-4">
                  {/* Matching Lore Cards & Wiki Articles */}
                  {searchResults.entities.length > 0 && (
                    <div>
                      <div className="text-[11px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-2">
                        Cards & Wiki Articles ({searchResults.entities.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.entities.map((ent) => (
                          <button
                            key={ent.id}
                            onClick={() => handleOpenEntityTab(ent)}
                            className="text-left p-2 rounded-xl bg-oros-950/70 border border-oros-800 hover:border-gold-400/80 hover:bg-oros-800/60 transition-all flex items-center gap-2.5 group"
                          >
                            <img
                              src={ent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={ent.title}
                              className="w-8 h-8 rounded-lg object-cover border border-oros-700/60 shrink-0"
                            />
                            <div className="truncate flex-1">
                              <div className="font-serif font-bold text-xs text-slate-200 group-hover:text-gold-300 truncate">
                                {ent.title}
                              </div>
                              <div className="text-[10px] text-oros-400 capitalize">{ent.type}</div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-gold-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Features */}
                  {searchResults.features.length > 0 && (
                    <div>
                      <div className="text-[11px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-2">
                        Studio Features
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.features.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => handleCreateNewTab(f.type)}
                            className="text-left p-2.5 rounded-xl bg-oros-950/70 border border-oros-800 hover:border-gold-400/80 hover:bg-oros-800/60 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              {getTabIcon(f.type)}
                              <div>
                                <div className="font-medium text-xs text-slate-200 group-hover:text-gold-300">{f.title}</div>
                                <div className="text-[10px] text-oros-400">{f.desc}</div>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-gold-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Maps */}
                  {searchResults.maps.length > 0 && (
                    <div>
                      <div className="text-[11px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-2">
                        Cartography Maps
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.maps.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              openTab({ title: m.name, type: 'map', targetId: m.id })
                              setPlusModalOpen(false)
                            }}
                            className="text-left p-2.5 rounded-xl bg-oros-950/70 border border-oros-800 hover:border-gold-400/80 hover:bg-oros-800/60 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              <MapIcon className="w-4 h-4 text-gold-400" />
                              <div className="font-medium text-xs text-slate-200 group-hover:text-gold-300">{m.name}</div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-gold-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.entities.length === 0 && 
                   searchResults.features.length === 0 && 
                   searchResults.maps.length === 0 && (
                    <div className="text-center py-10 text-xs text-oros-400 italic">
                      No matching cards or features found for "{searchQuery}".
                    </div>
                  )}
                </div>
              ) : (
                // DEFAULT BROWSE SECTIONS
                <div className="space-y-5">
                  {/* Studio Features Grid */}
                  <div>
                    <div className="text-[11px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-2.5">
                      Studio Features
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleCreateNewTab('canvas')}
                        className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 hover:border-gold-400 hover:bg-oros-800/60 transition-all flex flex-col items-center text-center group"
                      >
                        <LayoutGrid className="w-5 h-5 text-gold-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-gold-300">Whiteboard Canvas</span>
                        <span className="text-[10px] text-oros-400 mt-0.5">Cards & sketch</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('wiki-network')}
                        className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 hover:border-gold-400 hover:bg-oros-800/60 transition-all flex flex-col items-center text-center group"
                      >
                        <Network className="w-5 h-5 text-gold-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-gold-300">Card Relations</span>
                        <span className="text-[10px] text-oros-400 mt-0.5">Dynamic gravity</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('relations')}
                        className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 hover:border-gold-400 hover:bg-oros-800/60 transition-all flex flex-col items-center text-center group"
                      >
                        <Users className="w-5 h-5 text-gold-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-gold-300">Pohon Relasi</span>
                        <span className="text-[10px] text-oros-400 mt-0.5">Lineage tree</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('wiki')}
                        className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 hover:border-gold-400 hover:bg-oros-800/60 transition-all flex flex-col items-center text-center group"
                      >
                        <BookOpen className="w-5 h-5 text-gold-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-gold-300">Encyclopedia</span>
                        <span className="text-[10px] text-oros-400 mt-0.5">Wikipedia layout</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('card')}
                        className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 hover:border-gold-400 hover:bg-oros-800/60 transition-all flex flex-col items-center text-center group"
                      >
                        <Layers className="w-5 h-5 text-gold-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-gold-300">Lore Cards</span>
                        <span className="text-[10px] text-oros-400 mt-0.5">Entity gallery</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('timeline')}
                        className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 hover:border-gold-400 hover:bg-oros-800/60 transition-all flex flex-col items-center text-center group"
                      >
                        <Clock className="w-5 h-5 text-gold-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-gold-300">Linimasa</span>
                        <span className="text-[10px] text-oros-400 mt-0.5">Chronology eras</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('map')}
                        className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 hover:border-gold-400 hover:bg-oros-800/60 transition-all flex flex-col items-center text-center group"
                      >
                        <MapIcon className="w-5 h-5 text-gold-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-gold-300">Cartography</span>
                        <span className="text-[10px] text-oros-400 mt-0.5">Deep-zoom maps</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('writer')}
                        className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 hover:border-gold-400 hover:bg-oros-800/60 transition-all flex flex-col items-center text-center group"
                      >
                        <Feather className="w-5 h-5 text-gold-400 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-gold-300">Studio Writer</span>
                        <span className="text-[10px] text-oros-400 mt-0.5">Manuscript lore</span>
                      </button>
                    </div>
                  </div>

                  {/* Lore Cards & Wiki Articles Directory */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-bold text-oros-400 uppercase tracking-wider">
                        World Lore Cards & Wiki Articles
                      </span>
                      <span className="text-[10px] text-oros-500 font-mono">
                        {worldEntities.length} entities available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {worldEntities.map((ent) => (
                        <button
                          key={ent.id}
                          onClick={() => handleOpenEntityTab(ent)}
                          className="text-left p-2.5 rounded-xl bg-oros-950/70 border border-oros-800 hover:border-gold-400/80 hover:bg-oros-800/60 transition-all flex items-center gap-2.5 group"
                        >
                          <img
                            src={ent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={ent.title}
                            className="w-9 h-9 rounded-lg object-cover border border-oros-700/60 shrink-0"
                          />
                          <div className="truncate flex-1">
                            <div className="font-serif font-bold text-xs text-slate-200 group-hover:text-gold-300 truncate">
                              {ent.title}
                            </div>
                            <div className="text-[10px] text-oros-400 capitalize">{ent.type}</div>
                          </div>
                          <span className="text-[10px] text-gold-400/70 group-hover:text-gold-400 font-mono">Open</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RIGHT-CLICK TAB CONTEXT MENU (Reliable onMouseDown & Event Handling) */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y + 4}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-oros-900 border border-oros-700/90 rounded-xl shadow-2xl py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close this tab */}
          <button
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeTab(contextMenu.tabId)
              setContextMenu(null)
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeTab(contextMenu.tabId)
              setContextMenu(null)
            }}
            className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-oros-800 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Close Tab</span>
            <span className="text-[10px] text-oros-500 font-mono">Ctrl+W</span>
          </button>

          {/* Close other tabs */}
          <button
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeOtherTabs(contextMenu.tabId)
              setContextMenu(null)
              addToast('Closed other tabs', 'info')
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeOtherTabs(contextMenu.tabId)
              setContextMenu(null)
              addToast('Closed other tabs', 'info')
            }}
            className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-oros-800 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Close Other Tabs</span>
          </button>

          {/* Close tabs to the right */}
          <button
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeTabsToTheRight(contextMenu.tabId)
              setContextMenu(null)
              addToast('Closed tabs to the right', 'info')
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeTabsToTheRight(contextMenu.tabId)
              setContextMenu(null)
              addToast('Closed tabs to the right', 'info')
            }}
            className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-oros-800 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Close Tabs to the Right</span>
          </button>

          <div className="border-t border-oros-800 my-1" />

          {/* Close all tabs */}
          <button
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeAllTabs()
              setContextMenu(null)
              addToast('Cleared all tabs (Displaying Card Relations)', 'info')
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              closeAllTabs()
              setContextMenu(null)
              addToast('Cleared all tabs (Displaying Card Relations)', 'info')
            }}
            className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Close All Tabs</span>
          </button>
        </div>
      )}

      {/* New World Modal */}
      {showNewWorldModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              Forge a New Realm
            </h3>
            <p className="text-xs text-oros-300 mb-4">
              Initialize a sovereign world vault with its own encyclopedia, maps, and timeline.
            </p>
            <form onSubmit={handleCreateWorldSubmit} className="space-y-4">
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
                  onClick={() => setShowNewWorldModal(false)}
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
