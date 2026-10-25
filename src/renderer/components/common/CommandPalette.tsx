import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Search, BookOpen, Map, Feather, Shield, Plus, FolderOpen, 
  Download, ArrowRight, Calendar, FileText, Sparkles, X,
  Layers, Users, Network, Languages, Settings, Swords, Landmark
} from 'lucide-react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { searchDeepVault, SearchDomain, DeepSearchResult } from '../../utils/deepSearchEngine'
import { useTtrpgStore } from '../../store/useTtrpgStore'

interface PaletteActionItem {
  id: string;
  category: 'Actions';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<SearchDomain>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  const battlemaps = useTtrpgStore((s) => s.battlemaps)
  const setActiveCampaignId = useTtrpgStore((s) => s.setActiveCampaignId)
  const setActiveBattlemapId = useTtrpgStore((s) => s.setActiveBattlemapId)

  // Scroll active item into view on keyboard arrow navigation
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const { 
    entities, maps, manuscripts, timelines, conlangs, activeWorldId, 
    setActiveTab, setSelectedEntityId, setSelectedMapId, setSelectedChapterId,
    toggleGmMode, gmMode, exportWorld, createEntity, openTab 
  } = useWorldStore()

  const { addToast } = useToastStore()
  const { openSettings } = useSettingsStore()

  const worldEntities = useMemo(() => activeWorldId ? entities[activeWorldId] || [] : [], [activeWorldId, entities])
  const worldMaps = useMemo(() => activeWorldId ? maps[activeWorldId] || [] : [], [activeWorldId, maps])
  const worldChapters = useMemo(() => activeWorldId ? manuscripts[activeWorldId] || [] : [], [activeWorldId, manuscripts])
  const worldTimelines = useMemo(() => activeWorldId ? timelines[activeWorldId] || [] : [], [activeWorldId, timelines])
  const worldConlangs = useMemo(() => activeWorldId ? conlangs[activeWorldId] || [] : [], [activeWorldId, conlangs])

  // Global keydown shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedDomain('all')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Quick Actions List
  const quickActions = useMemo<PaletteActionItem[]>(() => {
    const acts: PaletteActionItem[] = [
      {
        id: 'act-new-char',
        category: 'Actions',
        title: 'New Character Article',
        icon: Plus,
        onSelect: () => {
          const ent = createEntity('character', 'Untitled Character')
          setSelectedEntityId(ent.id)
          openTab({ title: ent.title, type: 'wiki', targetId: ent.id })
          addToast('Created new character article', 'success')
        }
      },
      {
        id: 'act-new-loc',
        category: 'Actions',
        title: 'New Settlement / Location',
        icon: Plus,
        onSelect: () => {
          const ent = createEntity('location', 'Untitled Location')
          setSelectedEntityId(ent.id)
          openTab({ title: ent.title, type: 'wiki', targetId: ent.id })
          addToast('Created new location article', 'success')
        }
      },
      {
        id: 'act-new-conlang',
        category: 'Actions',
        title: 'New Conlang / Constructed Language',
        icon: Languages,
        onSelect: () => {
          openTab({ title: 'Conlang Lexicon', type: 'dictionary' })
          addToast('Opened Conlang Lexicon — add words or configure languages', 'info')
        }
      },
      {
        id: 'act-nav-writer',
        category: 'Actions',
        title: 'Open Studio Writer',
        icon: Feather,
        onSelect: () => {
          openTab({ title: 'Studio Writer', type: 'writer' })
        }
      },
      {
        id: 'act-nav-timeline',
        category: 'Actions',
        title: 'Open Timeline & Chronicles',
        icon: Calendar,
        onSelect: () => {
          openTab({ title: 'Timeline & Chronicles', type: 'timeline' })
        }
      },
      {
        id: 'act-nav-relations',
        category: 'Actions',
        title: 'Open Relationship Graph',
        icon: Users,
        onSelect: () => {
          openTab({ title: 'Relation Network', type: 'relations' })
        }
      },
      {
        id: 'act-toggle-gm',
        category: 'Actions',
        title: gmMode ? 'Switch to Reader / Player Mode' : 'Enable Director / GM Mode',
        icon: Shield,
        onSelect: () => {
          toggleGmMode()
          addToast(`Switched to ${!gmMode ? 'Director / GM Mode' : 'Reader Mode'}`, 'info')
        }
      },
      {
        id: 'act-open-folder',
        category: 'Actions',
        title: 'Open Local Vault Directory',
        icon: FolderOpen,
        onSelect: async () => {
          if (window.oros) {
            await window.oros.openVaultFolder()
            addToast('Opened vault directory in Explorer', 'info')
          } else {
            addToast('Vault directory explorer requires desktop app', 'warning')
          }
        }
      },
      {
        id: 'act-export',
        category: 'Actions',
        title: 'Export World Archive',
        icon: Download,
        onSelect: async () => {
          await exportWorld()
          addToast('World exported successfully', 'success')
        }
      },
      {
        id: 'act-open-settings',
        category: 'Actions',
        title: 'Open App Settings',
        icon: Settings,
        onSelect: () => {
          setIsOpen(false)
          openSettings()
        }
      }
    ]
    return acts
  }, [createEntity, exportWorld, gmMode, openTab, setSelectedEntityId, toggleGmMode, addToast, openSettings])

  // Deep Vault Search Results
  const deepResults = useMemo(() => {
    if (!search.trim()) return []
    return searchDeepVault(
      search,
      selectedDomain,
      worldEntities,
      worldChapters,
      worldTimelines,
      worldMaps,
      worldConlangs,
      battlemaps
    )
  }, [search, selectedDomain, worldEntities, worldChapters, worldTimelines, worldMaps, worldConlangs, battlemaps])

  // Filter actions if searching
  const matchingActions = useMemo(() => {
    if (!search.trim()) return quickActions
    const q = search.toLowerCase()
    return quickActions.filter(a => 
      a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q))
    )
  }, [search, quickActions])

  // Unified list for keyboard navigation
  type CombinedItem = 
    | { type: 'action'; data: PaletteActionItem }
    | { type: 'deep'; data: DeepSearchResult }

  const combinedItems = useMemo<CombinedItem[]>(() => {
    const list: CombinedItem[] = []
    if (search.trim()) {
      deepResults.slice(0, 16).forEach(r => list.push({ type: 'deep', data: r }))
      matchingActions.slice(0, 4).forEach(a => list.push({ type: 'action', data: a }))
    } else {
      matchingActions.forEach(a => list.push({ type: 'action', data: a }))
    }
    return list
  }, [search, deepResults, matchingActions])

  const handleSelectResult = (item: CombinedItem) => {
    if (item.type === 'action') {
      item.data.onSelect()
    } else {
      const res = item.data
      switch (res.domain) {
        case 'lore':
          setSelectedEntityId(res.targetId)
          openTab({ title: res.title, type: 'wiki', targetId: res.targetId })
          break
        case 'manuscript':
          setSelectedChapterId(res.targetId)
          openTab({ title: res.title, type: 'writer', targetId: res.targetId })
          break
        case 'timeline':
          openTab({ title: 'Timeline & Chronicles', type: 'timeline' })
          break
        case 'map':
          setSelectedMapId(res.targetId)
          openTab({ title: res.title, type: 'map', targetId: res.targetId })
          break
        case 'conlang':
          openTab({ title: 'Conlang Lexicon', type: 'dictionary' })
          break
        case 'battlemap': {
          for (const [cId, bmaps] of Object.entries(battlemaps)) {
            if (bmaps?.some(bm => bm.id === res.targetId)) {
              setActiveCampaignId(cId)
              break
            }
          }
          setActiveBattlemapId(res.targetId)
          openTab({ title: res.title, type: 'map', targetId: res.targetId })
          break
        }
      }
    }
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(combinedItems.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % Math.max(combinedItems.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (combinedItems[selectedIndex]) {
        handleSelectResult(combinedItems[selectedIndex])
      }
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fade-in select-none"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 border-b border-oros-800 flex items-center gap-2.5 bg-oros-950">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search whole vault (prose, cards, timelines, commands)..."
            className="flex-1 bg-transparent border-none text-xs text-oros-100 placeholder-oros-500 focus:outline-none font-sans"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setSelectedIndex(0)
              }}
              className="text-oros-500 hover:text-oros-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-mono text-oros-500 px-1.5 py-0.5 rounded-[2px] bg-oros-900 border border-oros-800">
            Esc
          </span>
        </div>

        {/* Filter Domain Pills (when search query is entered) */}
        {search.trim() && (
          <div className="px-3 py-1.5 border-b border-oros-850 bg-oros-950/60 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
            <span className="text-oros-500 mr-1">Filter:</span>
            {(['all', 'lore', 'manuscript', 'timeline', 'map', 'battlemap', 'conlang'] as SearchDomain[]).map((dom) => (
              <button
                key={dom}
                onClick={() => {
                  setSelectedDomain(dom)
                  setSelectedIndex(0)
                }}
                className={`px-2 py-0.5 rounded-[2px] transition-colors ${
                  selectedDomain === dom
                    ? 'btn-accent font-semibold shadow-sm'
                    : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850'
                }`}
              >
                {dom === 'all' ? 'All Domains' : dom === 'lore' ? 'Cards' : dom === 'manuscript' ? 'Prose' : dom === 'timeline' ? 'Timeline' : dom === 'map' ? 'Maps' : dom === 'battlemap' ? 'Battlemaps' : 'Conlang'}
              </button>
            ))}
            <span className="ml-auto text-oros-500 font-mono">
              {deepResults.length} matches
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {combinedItems.length === 0 ? (
            <div className="p-8 text-center text-oros-500 text-xs font-sans">
              No results found for <span className="text-oros-300">"{search}"</span>.
            </div>
          ) : (
            combinedItems.map((item, idx) => {
              const isSelected = idx === selectedIndex

              if (item.type === 'action') {
                const act = item.data
                const IconComponent = act.icon
                return (
                  <div
                    key={act.id}
                    ref={(el) => { itemRefs.current[idx] = el }}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2.5 rounded-[3px] flex items-center justify-between text-xs cursor-pointer transition-colors border ${
                      isSelected
                        ? 'bg-accent-muted border-accent/40 text-oros-100 shadow-sm'
                        : 'border-transparent text-oros-300 hover:bg-oros-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <div className={`p-1.5 rounded-[2px] shrink-0 ${isSelected ? 'btn-accent' : 'bg-oros-950 text-oros-400 border border-oros-800'}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-medium truncate">{act.title}</div>
                        {act.subtitle && (
                          <div className="text-[10px] text-oros-400 font-sans truncate">
                            {act.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-oros-500 shrink-0">
                      Action
                    </span>
                  </div>
                )
              }

              // Deep Search Item
              const res = item.data
              let Icon = FileText
              let iconColor = 'text-sky-400'
              if (res.domain === 'manuscript') {
                Icon = Feather
                iconColor = 'text-amber-400'
              } else if (res.domain === 'timeline') {
                Icon = Calendar
                iconColor = 'text-purple-400'
              } else if (res.domain === 'map') {
                Icon = Map
                iconColor = 'text-emerald-400'
              } else if (res.domain === 'battlemap') {
                Icon = Swords
                iconColor = 'text-rose-400'
              } else if (res.domain === 'conlang') {
                Icon = Languages
                iconColor = 'text-cyan-400'
              }

              return (
                <div
                  key={res.id}
                  ref={(el) => { itemRefs.current[idx] = el }}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-[3px] text-xs cursor-pointer transition-colors border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-accent-muted border-accent/40 text-oros-100 shadow-sm'
                      : 'border-transparent text-oros-300 hover:bg-oros-850'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
                      <span className="font-semibold text-oros-100 truncate font-sans">
                        {res.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-oros-400 px-1.5 py-0.2 rounded-[2px] bg-oros-950 border border-oros-800 shrink-0">
                      {res.badge}
                    </span>
                  </div>

                  {res.snippet && (
                    <div className="text-[11px] text-oros-400 font-serif italic line-clamp-1 bg-oros-950/40 p-1 rounded-[2px] border border-oros-850 mt-0.5">
                      "{res.snippet}"
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="p-2 border-t border-oros-800 bg-oros-950 flex items-center justify-between text-[10px] font-mono text-oros-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Deep Search across {worldChapters.length} chapters · {worldEntities.length} cards</span>
        </div>
      </div>
    </div>
  )
}
