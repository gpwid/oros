import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Plus, X, LayoutGrid, BookOpen, Layers, Users, 
  Clock, Map as MapIcon, Feather, Compass, ChevronDown, 
  Sparkles, Check, FolderOpen, Shield, Download, Search, 
  Network, ArrowRight, CornerDownLeft, EyeOff, Layers2
} from 'lucide-react'
import { DirectoryItemType, LoreEntity } from '@shared/types'

export const WorkspaceTabs: React.FC = () => {
  const { 
    openTabs, activeTabId, setActiveTabId, closeTab, closeOtherTabs,
    closeTabsToTheRight, closeAllTabs, openTab,
    worlds, activeWorldId, setActiveWorldId, createWorld, exportWorld,
    isSaving, gmMode, toggleGmMode, createCanvas, createEntity,
    entities, maps, manuscripts, canvases
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
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

  const menuRef = useRef<HTMLDivElement>(null)
  const worldMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const activeWorld = worlds.find((w) => w.id === activeWorldId) || worlds[0]
  const worldId = activeWorldId || 'world-aethelgard'
  const worldEntities = entities[worldId] || []
  const worldMaps = maps[worldId] || []
  const worldChapters = manuscripts[worldId] || []
  const worldCanvases = canvases[worldId] || []

  // Close dropdowns and context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false)
      }
      if (worldMenuRef.current && !worldMenuRef.current.contains(e.target as Node)) {
        setWorldDropdownOpen(false)
      }
      setContextMenu(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlusMenuOpen(false)
        setWorldDropdownOpen(false)
        setContextMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Auto-focus search input when plus menu opens
  useEffect(() => {
    if (plusMenuOpen) {
      setSearchQuery('')
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [plusMenuOpen])

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

  // Filtered search results for the Plus Menu
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
      { id: 'canvas', title: 'Whiteboard Canvas', type: 'canvas' as DirectoryItemType, desc: 'Infinite board with cards, notes & sketching' },
      { id: 'wiki-network', title: 'Card Relations Network', type: 'wiki-network' as any, desc: 'Entity knowledge graph & cross-references' },
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
    setPlusMenuOpen(false)
  }

  const handleCreateNewTab = (type: DirectoryItemType | 'wiki-network') => {
    setPlusMenuOpen(false)
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
      <header className="h-10 bg-oros-950/95 border-b border-oros-800/50 flex items-center justify-between px-2 select-none z-30">
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
                  title="Right-click for tab actions"
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

          {/* Plus Tab Button */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setPlusMenuOpen(!plusMenuOpen)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-oros-400 hover:text-gold-400 hover:bg-oros-800/60 transition-colors border border-transparent hover:border-oros-700/40"
              title="Open new tab or search wiki cards..."
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* SEARCHABLE PLUS POPOVER (Search cards, wiki, or pick feature) */}
            {plusMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-80 bg-oros-900/95 backdrop-blur-md border border-oros-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Search Header */}
                <div className="p-2.5 border-b border-oros-800/80 bg-oros-950/60">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gold-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cards, wiki, maps, or pick feature..."
                      className="w-full bg-oros-900 border border-oros-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-oros-500 focus:outline-none focus:border-gold-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Popover Content */}
                <div className="max-h-80 overflow-y-auto p-2 space-y-3">
                  {searchResults ? (
                    // SEARCH RESULTS MODE
                    <div>
                      {/* Features Match */}
                      {searchResults.features.length > 0 && (
                        <div className="mb-2">
                          <div className="px-2 py-1 text-[10px] font-semibold text-oros-400 uppercase tracking-wider">
                            Features
                          </div>
                          {searchResults.features.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => handleCreateNewTab(f.type)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-oros-800 flex items-center justify-between text-xs text-slate-200 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                {getTabIcon(f.type)}
                                <span className="font-medium">{f.title}</span>
                              </div>
                              <ArrowRight className="w-3 h-3 text-oros-500" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Wiki & Lore Cards Match */}
                      {searchResults.entities.length > 0 && (
                        <div className="mb-2">
                          <div className="px-2 py-1 text-[10px] font-semibold text-oros-400 uppercase tracking-wider">
                            Wiki Articles & Lore Cards ({searchResults.entities.length})
                          </div>
                          {searchResults.entities.map((ent) => (
                            <button
                              key={ent.id}
                              onClick={() => handleOpenEntityTab(ent)}
                              className="w-full text-left p-1.5 rounded-lg hover:bg-oros-800 flex items-center gap-2 text-xs text-slate-200 transition-colors"
                            >
                              <img
                                src={ent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                                alt={ent.title}
                                className="w-6 h-6 rounded-md object-cover border border-oros-700/50"
                              />
                              <div className="truncate flex-1">
                                <div className="font-medium truncate text-slate-100">{ent.title}</div>
                                <div className="text-[10px] text-oros-400 capitalize">{ent.type}</div>
                              </div>
                              <span className="text-[10px] text-gold-400/80 font-mono">Open</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Maps Match */}
                      {searchResults.maps.length > 0 && (
                        <div className="mb-2">
                          <div className="px-2 py-1 text-[10px] font-semibold text-oros-400 uppercase tracking-wider">
                            Maps
                          </div>
                          {searchResults.maps.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                openTab({ title: m.name, type: 'map', targetId: m.id })
                                setPlusMenuOpen(false)
                              }}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-oros-800 flex items-center justify-between text-xs text-slate-200 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <MapIcon className="w-3.5 h-3.5 text-gold-400" />
                                <span className="font-medium">{m.name}</span>
                              </div>
                              <span className="text-[10px] text-gold-400/80 font-mono">Open</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Empty search state */}
                      {searchResults.entities.length === 0 && 
                       searchResults.features.length === 0 && 
                       searchResults.maps.length === 0 && (
                        <div className="text-center py-6 text-xs text-oros-400 italic">
                          No matching cards, wiki articles, or features found.
                        </div>
                      )}
                    </div>
                  ) : (
                    // DEFAULT BROWSE MODE
                    <>
                      {/* Core Features */}
                      <div>
                        <div className="px-2 py-1 text-[10px] font-semibold text-oros-400 uppercase tracking-wider">
                          Studio Features
                        </div>
                        <div className="space-y-0.5 mt-1">
                          <button
                            onClick={() => handleCreateNewTab('canvas')}
                            className="w-full px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-oros-800 hover:text-gold-400 flex items-center gap-2.5 rounded-lg transition-colors"
                          >
                            <LayoutGrid className="w-3.5 h-3.5 text-gold-400" />
                            <span>New Whiteboard Canvas</span>
                          </button>
                          <button
                            onClick={() => handleCreateNewTab('wiki-network')}
                            className="w-full px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-oros-800 hover:text-gold-400 flex items-center gap-2.5 rounded-lg transition-colors"
                          >
                            <Network className="w-3.5 h-3.5 text-gold-400" />
                            <span>Card Relations Network (Wiki Graph)</span>
                          </button>
                          <button
                            onClick={() => handleCreateNewTab('relations')}
                            className="w-full px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-oros-800 hover:text-gold-400 flex items-center gap-2.5 rounded-lg transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-gold-400" />
                            <span>Baru Pohon Relasi (Lineage)</span>
                          </button>
                          <button
                            onClick={() => handleCreateNewTab('timeline')}
                            className="w-full px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-oros-800 hover:text-gold-400 flex items-center gap-2.5 rounded-lg transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5 text-gold-400" />
                            <span>Baru Linimasa (Timeline)</span>
                          </button>
                          <button
                            onClick={() => handleCreateNewTab('wiki')}
                            className="w-full px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-oros-800 hover:text-gold-400 flex items-center gap-2.5 rounded-lg transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-gold-400" />
                            <span>Encyclopedia (Wiki Article)</span>
                          </button>
                          <button
                            onClick={() => handleCreateNewTab('card')}
                            className="w-full px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-oros-800 hover:text-gold-400 flex items-center gap-2.5 rounded-lg transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5 text-gold-400" />
                            <span>Lore Cards Gallery</span>
                          </button>
                          <button
                            onClick={() => handleCreateNewTab('map')}
                            className="w-full px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-oros-800 hover:text-gold-400 flex items-center gap-2.5 rounded-lg transition-colors"
                          >
                            <MapIcon className="w-3.5 h-3.5 text-gold-400" />
                            <span>Cartography Map</span>
                          </button>
                          <button
                            onClick={() => handleCreateNewTab('writer')}
                            className="w-full px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-oros-800 hover:text-gold-400 flex items-center gap-2.5 rounded-lg transition-colors"
                          >
                            <Feather className="w-3.5 h-3.5 text-gold-400" />
                            <span>Studio Writer</span>
                          </button>
                        </div>
                      </div>

                      {/* Recent Cards & Wiki Articles */}
                      <div className="pt-1 border-t border-oros-800/60">
                        <div className="px-2 py-1 text-[10px] font-semibold text-oros-400 uppercase tracking-wider">
                          Open Lore Card / Article
                        </div>
                        <div className="space-y-0.5 mt-1">
                          {worldEntities.slice(0, 6).map((ent) => (
                            <button
                              key={ent.id}
                              onClick={() => handleOpenEntityTab(ent)}
                              className="w-full text-left p-1.5 rounded-lg hover:bg-oros-800 flex items-center gap-2 text-xs text-slate-200 transition-colors"
                            >
                              <img
                                src={ent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                                alt={ent.title}
                                className="w-6 h-6 rounded-md object-cover border border-oros-700/50"
                              />
                              <div className="truncate flex-1">
                                <div className="font-medium truncate text-slate-100">{ent.title}</div>
                                <div className="text-[10px] text-oros-400 capitalize">{ent.type}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
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
      </header>

      {/* RIGHT-CLICK TAB CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y + 4}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-oros-900/95 backdrop-blur-md border border-oros-700/90 rounded-xl shadow-2xl py-1.5 min-w-[190px] animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close this tab */}
          <button
            onClick={() => {
              closeTab(contextMenu.tabId)
              setContextMenu(null)
            }}
            className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-oros-800 hover:text-white flex items-center justify-between transition-colors"
          >
            <span>Close Tab</span>
            <span className="text-[10px] text-oros-500 font-mono">Ctrl+W</span>
          </button>

          {/* Close other tabs */}
          <button
            onClick={() => {
              closeOtherTabs(contextMenu.tabId)
              setContextMenu(null)
              addToast('Closed other tabs', 'info')
            }}
            className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-oros-800 hover:text-white flex items-center justify-between transition-colors"
          >
            <span>Close Other Tabs</span>
          </button>

          {/* Close tabs to the right */}
          <button
            onClick={() => {
              closeTabsToTheRight(contextMenu.tabId)
              setContextMenu(null)
              addToast('Closed tabs to the right', 'info')
            }}
            className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-oros-800 hover:text-white flex items-center justify-between transition-colors"
          >
            <span>Close Tabs to the Right</span>
          </button>

          <div className="border-t border-oros-800 my-1" />

          {/* Close all tabs */}
          <button
            onClick={() => {
              closeAllTabs()
              setContextMenu(null)
              addToast('Cleared all tabs (Displaying Card Relations)', 'info')
            }}
            className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 flex items-center justify-between transition-colors"
          >
            <span>Close All Tabs</span>
          </button>
        </div>
      )}
    </>
  )
}
