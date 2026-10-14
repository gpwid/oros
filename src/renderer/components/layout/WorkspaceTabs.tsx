import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Plus, X, LayoutGrid, BookOpen, Layers, Users, 
  Clock, Map as MapIcon, Feather, Compass, ChevronDown, 
  Check, FolderOpen, Shield, Download, Search, 
  Network, ArrowRight, CornerDownLeft, EyeOff, PlusCircle,
  Palette
} from 'lucide-react'
import { DirectoryItemType, LoreEntity, World } from '@shared/types'

export const WorkspaceTabs: React.FC = () => {
  const { 
    openTabs, activeTabId, setActiveTabId, closeTab, closeOtherTabs,
    closeTabsToTheRight, closeAllTabs, openTab,
    worlds, activeWorldId, setActiveWorldId, createWorld, exportWorld,
    setWorldTheme,
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
  const [newWorldGenre, setNewWorldGenre] = useState('Speculative Fiction')
  const [newWorldTheme, setNewWorldTheme] = useState<World['theme']>('sovereign')
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

  // Unified architectural tone across tab icons that responds to active state
  const getTabIcon = (type: DirectoryItemType, isActive: boolean) => {
    const iconClass = `w-3.5 h-3.5 shrink-0 transition-colors ${
      isActive ? 'text-oros-100' : 'text-oros-400 group-hover:text-oros-200'
    }`
    switch (type) {
      case 'canvas':
        return <LayoutGrid className={iconClass} />
      case 'wiki':
        return <BookOpen className={iconClass} />
      case 'card':
        return <Layers className={iconClass} />
      case 'relations':
        return <Users className={iconClass} />
      case 'timeline':
        return <Clock className={iconClass} />
      case 'map':
        return <MapIcon className={iconClass} />
      case 'writer':
        return <Feather className={iconClass} />
      default:
        return <LayoutGrid className={iconClass} />
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
      { id: 'relations', title: 'Lineage Tree', type: 'relations' as DirectoryItemType, desc: 'Familial and social ties tree' },
      { id: 'wiki', title: 'Encyclopedia (Wiki)', type: 'wiki' as DirectoryItemType, desc: 'Wikipedia-style lore articles & infoboxes' },
      { id: 'card', title: 'Lore Cards Gallery', type: 'card' as DirectoryItemType, desc: 'Filterable entity cards & schemas' },
      { id: 'timeline', title: 'Timeline', type: 'timeline' as DirectoryItemType, desc: 'Chronological eras & event milestones' },
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
        openTab({ title: 'Lineage Tree', type: 'relations' })
        break
      }
      case 'timeline': {
        openTab({ title: 'Timeline', type: 'timeline' })
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
    createWorld(newWorldName.trim(), newWorldTagline.trim(), newWorldGenre.trim(), newWorldTheme)
    setShowNewWorldModal(false)
    setNewWorldName('')
    setNewWorldTagline('')
    setNewWorldGenre('Speculative Fiction')
    setNewWorldTheme('sovereign')
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
      <header className="h-9 bg-oros-950 border-b border-oros-800/70 flex items-center justify-between px-2 select-none z-30 relative">
        {/* Left: World Switcher & Brand Glyph */}
        <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-oros-800/60">
          <div className="w-5 h-5 rounded-[3px] bg-oros-900 border border-oros-700/80 flex items-center justify-center text-oros-200 font-mono font-bold text-[10px] tracking-tight shrink-0 shadow-inner">
            Ω
          </div>

          {/* World Dropdown */}
          <div className="relative" ref={worldMenuRef}>
            <button
              onClick={() => setWorldDropdownOpen(!worldDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-oros-900/80 hover:bg-oros-850 border border-oros-800/80 text-xs font-medium text-oros-200 transition-colors"
            >
              <span className="max-w-[130px] truncate">{activeWorld?.name || 'World'}</span>
              <ChevronDown className="w-3 h-3 text-oros-400" />
            </button>

            {worldDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-oros-900 border border-oros-750 rounded-md shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-mono font-bold text-oros-400 uppercase tracking-wider">
                  World Vaults
                </div>
                {worlds.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setActiveWorldId(w.id)
                      setWorldDropdownOpen(false)
                      addToast(`Switched to vault: ${w.name}`, 'info')
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-oros-800/60 transition-colors ${
                      w.id === activeWorldId ? 'text-oros-100 font-medium bg-oros-850' : 'text-oros-300'
                    }`}
                  >
                    <div className="truncate">
                      <div>{w.name}</div>
                      <div className="text-[10px] text-oros-400 font-mono capitalize">{w.genre || 'General'}</div>
                    </div>
                    {w.id === activeWorldId && <Check className="w-3.5 h-3.5 text-oros-200 shrink-0" />}
                  </button>
                ))}

                {/* Theme Selector for Active World */}
                <div className="border-t border-oros-800/80 my-1 px-3 py-1.5">
                  <div className="text-[10px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3 h-3 text-oros-400" />
                    <span>Atmospheric Accent</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'sovereign', name: 'Platinum', hex: '#e2e8f0' },
                      { id: 'mythic', name: 'Mythic Gold', hex: '#f5c542' },
                      { id: 'cyber', name: 'Cyber Cyan', hex: '#06b6d4' },
                      { id: 'crimson', name: 'Crimson', hex: '#f43f5e' },
                      { id: 'hazard', name: 'Hazard', hex: '#f97316' },
                      { id: 'emerald', name: 'Emerald', hex: '#10b981' }
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => {
                          if (activeWorldId) {
                            setWorldTheme(activeWorldId, th.id as any)
                            addToast(`Applied ${th.name} theme`, 'info')
                          }
                        }}
                        className={`px-1.5 py-1 rounded-[3px] text-[10px] font-mono flex items-center gap-1 border transition-colors ${
                          (activeWorld?.theme || 'sovereign') === th.id
                            ? 'bg-oros-800 border-oros-600 text-oros-100'
                            : 'bg-oros-950/60 border-oros-800 text-oros-400 hover:text-oros-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: th.hex }} />
                        <span className="truncate">{th.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-oros-800/80 my-1" />
                <button
                  onClick={() => {
                    setWorldDropdownOpen(false)
                    setShowNewWorldModal(true)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-oros-200 hover:bg-oros-850 flex items-center gap-2 font-medium"
                >
                  <Plus className="w-3.5 h-3.5 text-oros-400" />
                  Initialize New World
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Archival Workspace Tabs */}
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar mx-1.5 py-0.5">
          {openTabs.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-oros-400/80 font-mono italic px-2">
              <Network className="w-3.5 h-3.5 text-oros-400" />
              <span>Card Relations (Standby Ledger)</span>
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
                  className={`group relative flex items-center gap-2 h-7 px-2.5 rounded-t-[3px] rounded-b-[1px] text-xs cursor-pointer select-none transition-all shrink-0 ${
                    isActive
                      ? 'bg-oros-850 text-oros-100 font-medium border border-oros-700/80 border-b-transparent shadow-sm relative before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-accent'
                      : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900/80 border border-transparent'
                  }`}
                  title="Right-click for tab options"
                >
                  {getTabIcon(tab.type, isActive)}
                  <span className="max-w-[140px] truncate leading-none">{tab.title}</span>
                  
                  {/* Close Button */}
                  {tab.isClosable !== false && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab.id)
                      }}
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all ${
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
          <button
            onClick={() => setPlusModalOpen(true)}
            className="w-6 h-6 rounded-[3px] flex items-center justify-center text-oros-400 hover:text-oros-100 hover:bg-oros-850 border border-transparent hover:border-oros-800 transition-colors shrink-0"
            title="Open Document, Card, or Feature (Ctrl+T)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Instrumentation & Telemetry */}
        <div className="flex items-center gap-1.5 shrink-0 pr-24">
          {/* Quick Search Ctrl+K */}
          <button
            onClick={triggerCommandPalette}
            className="px-2 py-0.5 rounded-[3px] bg-oros-900/80 hover:bg-oros-850 border border-oros-800/80 text-[11px] text-oros-400 hover:text-oros-200 flex items-center gap-1.5 transition-colors"
            title="Global Quick Search (Ctrl+K)"
          >
            <Search className="w-3 h-3 text-oros-400" />
            <span className="hidden md:inline font-sans">Search</span>
            <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-oros-950 text-oros-400 border border-oros-800/80">
              Ctrl+K
            </kbd>
          </button>

          {/* GM Mode Toggle */}
          <button
            onClick={toggleGmMode}
            title={gmMode ? "Director / GM Secrets: VISIBLE" : "Director / GM Secrets: HIDDEN (Player Safe)"}
            className={`px-2 py-0.5 rounded-[3px] text-xs flex items-center gap-1 border transition-all ${
              gmMode 
                ? 'bg-oros-800 text-oros-200 border-oros-700/80 shadow-sm' 
                : 'bg-oros-900/60 text-oros-400 border-oros-800/70 hover:text-oros-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span className="text-[10px] font-mono hidden sm:inline">{gmMode ? 'SECRETS ON' : 'SECRETS OFF'}</span>
          </button>

          {/* Sync Status Readout */}
          <div className="flex items-center gap-1 text-[10px] text-oros-400 font-mono px-1.5 py-0.5 rounded-[3px] bg-oros-900/50 border border-oros-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80"></span>
            <span className="hidden sm:inline tracking-wider uppercase">VAULT READY</span>
          </div>

          {/* Vault Folder */}
          <button
            onClick={handleOpenFolder}
            title="Open Vault in Explorer"
            className="p-1 rounded-[3px] hover:bg-oros-850 text-oros-400 hover:text-oros-200 transition-colors"
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
            className="p-1 rounded-[3px] hover:bg-oros-850 text-oros-400 hover:text-oros-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* COMMAND ATELIER (Pick or Create Document / Card / Feature) */}
      {plusModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setPlusModalOpen(false)}
        >
          <div 
            className="bg-oros-900 border border-oros-750 w-full max-w-2xl rounded-md shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Live Search */}
            <div className="p-3 border-b border-oros-800 bg-oros-950/80 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-oros-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search cards, wiki articles, maps, or studio features..."
                className="w-full bg-transparent text-xs text-oros-100 placeholder-oros-500 outline-none font-sans"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="text-[9px] font-mono text-oros-500 px-1 py-0.5 rounded bg-oros-900 border border-oros-800">
                  ESC
                </kbd>
                <button 
                  onClick={() => setPlusModalOpen(false)}
                  className="p-1 rounded-[3px] text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Creation Row */}
            <div className="px-3 py-2 bg-oros-950/40 border-b border-oros-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono uppercase font-bold text-oros-500 mr-1 shrink-0">
                Create:
              </span>
              <button
                onClick={() => handleQuickCreateEntity('character', 'New Lore Card')}
                className="px-2.5 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-xs text-oros-200 hover:text-oros-100 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Layers className="w-3 h-3 text-oros-400" />
                <span>Lore Card</span>
              </button>
              <button
                onClick={handleQuickCreateCanvas}
                className="px-2.5 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-xs text-oros-200 hover:text-oros-100 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <LayoutGrid className="w-3 h-3 text-oros-400" />
                <span>Whiteboard</span>
              </button>
              <button
                onClick={() => handleCreateNewTab('relations')}
                className="px-2.5 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-xs text-oros-200 hover:text-oros-100 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Users className="w-3 h-3 text-oros-400" />
                <span>Lineage Tree</span>
              </button>
              <button
                onClick={() => handleCreateNewTab('timeline')}
                className="px-2.5 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-xs text-oros-200 hover:text-oros-100 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Clock className="w-3 h-3 text-oros-400" />
                <span>Timeline</span>
              </button>
              <button
                onClick={() => handleQuickCreateEntity('location', 'New Location')}
                className="px-2.5 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-xs text-oros-200 hover:text-oros-100 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <MapIcon className="w-3 h-3 text-oros-400" />
                <span>Map Pin</span>
              </button>
              <button
                onClick={handleQuickCreateChapter}
                className="px-2.5 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-xs text-oros-200 hover:text-oros-100 flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Feather className="w-3 h-3 text-oros-400" />
                <span>Manuscript</span>
              </button>
            </div>

            {/* Modal Body / Search & Browse Results */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {searchResults ? (
                // SEARCH RESULTS
                <div className="space-y-4">
                  {/* Matching Lore Cards & Wiki Articles */}
                  {searchResults.entities.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-2">
                        Cards & Wiki Articles ({searchResults.entities.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {searchResults.entities.map((ent) => (
                          <button
                            key={ent.id}
                            onClick={() => handleOpenEntityTab(ent)}
                            className="text-left p-2 rounded-[3px] bg-oros-950/70 border border-oros-800 hover:border-oros-600 hover:bg-oros-850 transition-colors flex items-center gap-2.5 group"
                          >
                            <img
                              src={ent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={ent.title}
                              className="w-7 h-7 rounded-[2px] object-cover border border-oros-750 shrink-0"
                            />
                            <div className="truncate flex-1">
                              <div className="font-sans font-medium text-xs text-oros-200 group-hover:text-white truncate">
                                {ent.title}
                              </div>
                              <div className="text-[10px] text-oros-400 capitalize font-mono">{ent.type}</div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-oros-600 group-hover:text-oros-300 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Features */}
                  {searchResults.features.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-2">
                        Studio Features
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {searchResults.features.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => handleCreateNewTab(f.type)}
                            className="text-left p-2 rounded-[3px] bg-oros-950/70 border border-oros-800 hover:border-oros-600 hover:bg-oros-850 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              {getTabIcon(f.type, false)}
                              <div>
                                <div className="font-medium text-xs text-oros-200 group-hover:text-white">{f.title}</div>
                                <div className="text-[10px] text-oros-500 font-sans">{f.desc}</div>
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-oros-600 group-hover:text-oros-300" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching Maps */}
                  {searchResults.maps.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-2">
                        Cartography Maps
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {searchResults.maps.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              openTab({ title: m.name, type: 'map', targetId: m.id })
                              setPlusModalOpen(false)
                            }}
                            className="text-left p-2 rounded-[3px] bg-oros-950/70 border border-oros-800 hover:border-oros-600 hover:bg-oros-850 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2.5">
                              <MapIcon className="w-3.5 h-3.5 text-oros-400" />
                              <div className="font-medium text-xs text-oros-200 group-hover:text-white">{m.name}</div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-oros-600 group-hover:text-oros-300" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.entities.length === 0 && 
                   searchResults.features.length === 0 && 
                   searchResults.maps.length === 0 && (
                    <div className="text-center py-10 text-xs text-oros-500 italic">
                      No matching cards or features found for "{searchQuery}".
                    </div>
                  )}
                </div>
              ) : (
                // DEFAULT BROWSE SECTIONS
                <div className="space-y-4">
                  {/* Studio Features Grid */}
                  <div>
                    <div className="text-[10px] font-mono font-bold text-oros-400 uppercase tracking-wider mb-2">
                      Studio Workspaces
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleCreateNewTab('canvas')}
                        className="p-2.5 rounded-[4px] bg-oros-950/70 border border-oros-800/80 hover:border-oros-600 hover:bg-oros-850 transition-colors flex flex-col items-center text-center group"
                      >
                        <LayoutGrid className="w-4 h-4 text-oros-400 mb-1 group-hover:text-oros-200 transition-colors" />
                        <span className="text-xs font-medium text-oros-200 group-hover:text-white">Whiteboard</span>
                        <span className="text-[10px] text-oros-500 font-mono mt-0.5">Cards & sketch</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('wiki-network')}
                        className="p-2.5 rounded-[4px] bg-oros-950/70 border border-oros-800/80 hover:border-oros-600 hover:bg-oros-850 transition-colors flex flex-col items-center text-center group"
                      >
                        <Network className="w-4 h-4 text-oros-400 mb-1 group-hover:text-oros-200 transition-colors" />
                        <span className="text-xs font-medium text-oros-200 group-hover:text-white">Card Relations</span>
                        <span className="text-[10px] text-oros-500 font-mono mt-0.5">Dynamic web</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('relations')}
                        className="p-2.5 rounded-[4px] bg-oros-950/70 border border-oros-800/80 hover:border-oros-600 hover:bg-oros-850 transition-colors flex flex-col items-center text-center group"
                      >
                        <Users className="w-4 h-4 text-oros-400 mb-1 group-hover:text-oros-200 transition-colors" />
                        <span className="text-xs font-medium text-oros-200 group-hover:text-white">Lineage Tree</span>
                        <span className="text-[10px] text-oros-500 font-mono mt-0.5">Dynasty ties</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('wiki')}
                        className="p-2.5 rounded-[4px] bg-oros-950/70 border border-oros-800/80 hover:border-oros-600 hover:bg-oros-850 transition-colors flex flex-col items-center text-center group"
                      >
                        <BookOpen className="w-4 h-4 text-oros-400 mb-1 group-hover:text-oros-200 transition-colors" />
                        <span className="text-xs font-medium text-oros-200 group-hover:text-white">Codex (Wiki)</span>
                        <span className="text-[10px] text-oros-500 font-mono mt-0.5">Encyclopedia</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('card')}
                        className="p-2.5 rounded-[4px] bg-oros-950/70 border border-oros-800/80 hover:border-oros-600 hover:bg-oros-850 transition-colors flex flex-col items-center text-center group"
                      >
                        <Layers className="w-4 h-4 text-oros-400 mb-1 group-hover:text-oros-200 transition-colors" />
                        <span className="text-xs font-medium text-oros-200 group-hover:text-white">Lore Cards</span>
                        <span className="text-[10px] text-oros-500 font-mono mt-0.5">Entity gallery</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('timeline')}
                        className="p-2.5 rounded-[4px] bg-oros-950/70 border border-oros-800/80 hover:border-oros-600 hover:bg-oros-850 transition-colors flex flex-col items-center text-center group"
                      >
                        <Clock className="w-4 h-4 text-oros-400 mb-1 group-hover:text-oros-200 transition-colors" />
                        <span className="text-xs font-medium text-oros-200 group-hover:text-white">Timeline</span>
                        <span className="text-[10px] text-oros-500 font-mono mt-0.5">Chronology eras</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('map')}
                        className="p-2.5 rounded-[4px] bg-oros-950/70 border border-oros-800/80 hover:border-oros-600 hover:bg-oros-850 transition-colors flex flex-col items-center text-center group"
                      >
                        <MapIcon className="w-4 h-4 text-oros-400 mb-1 group-hover:text-oros-200 transition-colors" />
                        <span className="text-xs font-medium text-oros-200 group-hover:text-white">Cartography</span>
                        <span className="text-[10px] text-oros-500 font-mono mt-0.5">Territory maps</span>
                      </button>

                      <button
                        onClick={() => handleCreateNewTab('writer')}
                        className="p-2.5 rounded-[4px] bg-oros-950/70 border border-oros-800/80 hover:border-oros-600 hover:bg-oros-850 transition-colors flex flex-col items-center text-center group"
                      >
                        <Feather className="w-4 h-4 text-oros-400 mb-1 group-hover:text-oros-200 transition-colors" />
                        <span className="text-xs font-medium text-oros-200 group-hover:text-white">Studio Writer</span>
                        <span className="text-[10px] text-oros-500 font-mono mt-0.5">Manuscript draft</span>
                      </button>
                    </div>
                  </div>

                  {/* Lore Cards & Wiki Articles Directory */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-oros-400 uppercase tracking-wider">
                        World Vault Lore Cards ({worldEntities.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {worldEntities.map((ent) => (
                        <button
                          key={ent.id}
                          onClick={() => handleOpenEntityTab(ent)}
                          className="text-left p-2 rounded-[3px] bg-oros-950/70 border border-oros-800 hover:border-oros-600 hover:bg-oros-850 transition-colors flex items-center gap-2.5 group"
                        >
                          <img
                            src={ent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={ent.title}
                            className="w-7 h-7 rounded-[2px] object-cover border border-oros-750 shrink-0"
                          />
                          <div className="truncate flex-1">
                            <div className="font-sans font-medium text-xs text-oros-200 group-hover:text-white truncate">
                              {ent.title}
                            </div>
                            <div className="text-[10px] text-oros-400 capitalize font-mono">{ent.type}</div>
                          </div>
                          <span className="text-[10px] text-oros-500 group-hover:text-oros-200 font-mono">Open</span>
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

      {/* RIGHT-CLICK TAB CONTEXT MENU */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y + 4}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-oros-900 border border-oros-750 rounded-md shadow-2xl py-1 min-w-[190px] animate-in fade-in duration-75 select-none text-xs"
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
            className="w-full px-3 py-1.5 text-left text-oros-200 hover:bg-oros-850 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
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
            className="w-full px-3 py-1.5 text-left text-oros-200 hover:bg-oros-850 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
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
            className="w-full px-3 py-1.5 text-left text-oros-200 hover:bg-oros-850 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
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
            className="w-full px-3 py-1.5 text-left text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Close All Tabs</span>
          </button>
        </div>
      )}

      {/* New World Vault Modal */}
      {showNewWorldModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-md rounded-md shadow-2xl p-5">
            <h3 className="font-sans text-sm font-semibold text-oros-100 mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-oros-300" />
              <span>Initialize World Vault</span>
            </h3>
            <p className="text-xs text-oros-400 mb-4">
              Create an isolated universe repository with its own cards, maps, lineages, and manuscript.
            </p>
            <form onSubmit={handleCreateWorldSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono font-medium text-oros-300 mb-1 uppercase tracking-wider">World Name</label>
                <input
                  type="text"
                  required
                  value={newWorldName}
                  onChange={(e) => setNewWorldName(e.target.value)}
                  placeholder="e.g. Aethelgard / Sector 47 / The Rustbelt"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-oros-300 mb-1 uppercase tracking-wider">Genre & Setting</label>
                <input
                  type="text"
                  value={newWorldGenre}
                  onChange={(e) => setNewWorldGenre(e.target.value)}
                  placeholder="e.g. Hard Sci-Fi, Dark Fantasy, Cyberpunk, Dystopian, Historical"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500"
                />
              </div>

              {/* Theme Preset Selection */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-oros-300 mb-1.5 uppercase tracking-wider">Atmospheric Accent</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'sovereign', name: 'Platinum', hex: '#e2e8f0', desc: 'Universal / Sci-Fi' },
                    { id: 'mythic', name: 'Mythic Gold', hex: '#f5c542', desc: 'Fantasy / Ancient' },
                    { id: 'cyber', name: 'Cyber Cyan', hex: '#06b6d4', desc: 'Futuristic / Tech' },
                    { id: 'crimson', name: 'Crimson Ash', hex: '#f43f5e', desc: 'Dark / Horror' },
                    { id: 'hazard', name: 'Hazard Ochre', hex: '#f97316', desc: 'Dystopian / Grit' },
                    { id: 'emerald', name: 'Verdant', hex: '#10b981', desc: 'Solarpunk / Natural' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewWorldTheme(t.id as any)}
                      className={`p-1.5 rounded-[3px] border text-left transition-colors flex flex-col ${
                        newWorldTheme === t.id
                          ? 'bg-oros-800 border-oros-500 text-oros-100'
                          : 'bg-oros-950/70 border-oros-800 text-oros-400 hover:text-oros-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.hex }} />
                        <span className="truncate">{t.name}</span>
                      </div>
                      <span className="text-[9px] text-oros-500 font-sans mt-0.5">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-oros-300 mb-1 uppercase tracking-wider">Tagline or Logline</label>
                <textarea
                  rows={2}
                  value={newWorldTagline}
                  onChange={(e) => setNewWorldTagline(e.target.value)}
                  placeholder="A one-sentence summary of the world premise..."
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-oros-800/60">
                <button
                  type="button"
                  onClick={() => setShowNewWorldModal(false)}
                  className="px-3 py-1.5 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[3px] text-xs font-medium bg-oros-200 hover:bg-white text-oros-950 transition-colors shadow-sm"
                >
                  Initialize Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
