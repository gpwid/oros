import React, { useState, useEffect, useRef } from 'react'
import { useWorldStore, ActiveNavTab } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Search, BookOpen, Map, Feather, Shield, Plus, FolderOpen, 
  Download, Sparkles, Layers, ArrowRight, Clock, Users, Network 
} from 'lucide-react'

interface PaletteItem {
  id: string;
  category: 'Articles' | 'Maps' | 'Chapters' | 'Actions';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { 
    entities, maps, manuscripts, activeWorldId, 
    setActiveTab, setSelectedEntityId, setSelectedMapId, setSelectedChapterId,
    toggleGmMode, gmMode, exportWorld, createEntity 
  } = useWorldStore()

  const { addToast } = useToastStore()

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldMaps = activeWorldId ? maps[activeWorldId] || [] : []
  const worldChapters = activeWorldId ? manuscripts[activeWorldId] || [] : []

  // Global keydown shortcut listener
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
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Assemble searchable items
  const items: PaletteItem[] = []

  // 1. Quick Actions
  items.push({
    id: 'act-nav-relations',
    category: 'Actions',
    title: 'Open Character & Social Relations',
    subtitle: 'View and edit familial bonds, alliances, and fealties',
    icon: Users,
    onSelect: () => {
      setActiveTab('relations')
    }
  })
  items.push({
    id: 'act-nav-wiki-network',
    category: 'Actions',
    title: 'Open Wiki Cross-Link Network',
    subtitle: 'Inspect knowledge graph, article mentions, and backlinks',
    icon: Network,
    onSelect: () => {
      setActiveTab('wiki-network')
    }
  })
  items.push({
    id: 'act-new-char',
    category: 'Actions',
    title: 'Create New Character',
    subtitle: 'Add a new persona to the world codex',
    icon: Plus,
    onSelect: () => {
      const ent = createEntity('character', 'Untitled Character')
      setSelectedEntityId(ent.id)
      setActiveTab('wiki')
      addToast('Created new character article', 'success')
    }
  })
  items.push({
    id: 'act-new-loc',
    category: 'Actions',
    title: 'Create New Location',
    subtitle: 'Add a realm, city, or dungeon',
    icon: Plus,
    onSelect: () => {
      const ent = createEntity('location', 'Untitled Location')
      setSelectedEntityId(ent.id)
      setActiveTab('wiki')
      addToast('Created new location article', 'success')
    }
  })
  items.push({
    id: 'act-toggle-gm',
    category: 'Actions',
    title: gmMode ? 'Switch to Player View' : 'Enable GM Secrets Mode',
    subtitle: 'Toggle visibility of hidden GM layers and private notes',
    icon: Shield,
    onSelect: () => {
      toggleGmMode()
      addToast(`Switched to ${!gmMode ? 'GM Secrets Mode' : 'Player View'}`, 'info')
    }
  })
  items.push({
    id: 'act-open-folder',
    category: 'Actions',
    title: 'Open Local Vault Folder',
    subtitle: 'Reveal Oros vault in file explorer',
    icon: FolderOpen,
    onSelect: async () => {
      if (window.oros) {
        await window.oros.openVaultFolder()
        addToast('Opened vault directory in Explorer', 'info')
      } else {
        addToast('Vault folder only available in desktop app', 'warning')
      }
    }
  })
  items.push({
    id: 'act-export',
    category: 'Actions',
    title: 'Export World Archive',
    subtitle: 'Save complete world as .oros.json package',
    icon: Download,
    onSelect: async () => {
      await exportWorld()
      addToast('World exported successfully', 'success')
    }
  })

  // 2. Entities / Articles
  worldEntities.forEach((ent) => {
    items.push({
      id: `ent-${ent.id}`,
      category: 'Articles',
      title: ent.title,
      subtitle: `${ent.type.toUpperCase()} · ${ent.summary || 'Article in Codex'}`,
      icon: BookOpen,
      onSelect: () => {
        setSelectedEntityId(ent.id)
        setActiveTab('wiki')
      }
    })
  })

  // 3. Maps
  worldMaps.forEach((map) => {
    items.push({
      id: `map-${map.id}`,
      category: 'Maps',
      title: map.name,
      subtitle: `${map.pins.length} Pins · Interactive Cartography`,
      icon: Map,
      onSelect: () => {
        setSelectedMapId(map.id)
        setActiveTab('maps')
      }
    })
  })

  // 4. Chapters
  worldChapters.forEach((ch) => {
    items.push({
      id: `ch-${ch.id}`,
      category: 'Chapters',
      title: ch.title,
      subtitle: `${ch.wordCount || 0} words · Studio Manuscript`,
      icon: Feather,
      onSelect: () => {
        setSelectedChapterId(ch.id)
        setActiveTab('writer')
      }
    })
  })

  // Filter items
  const filtered = items.filter((item) =>
    search === '' ||
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(search.toLowerCase())) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 12)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].onSelect()
        setIsOpen(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 p-4 animate-in fade-in duration-100 select-none">
      <div className="bg-oros-900 border border-oros-700/80 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-oros-800 flex items-center gap-3 bg-oros-950/60">
          <Search className="w-4 h-4 text-gold-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search world lore, maps, chapters..."
            className="w-full bg-transparent border-none text-xs text-slate-100 placeholder-oros-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-oros-800/80 text-oros-400 border border-oros-700/60 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.map((item, idx) => {
            const isSelected = idx === selectedIndex
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onSelect()
                  setIsOpen(false)
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all group ${
                  isSelected
                    ? 'bg-gold-500/15 border border-gold-500/40 text-gold-300'
                    : 'text-slate-200 hover:bg-oros-800/50'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`p-1.5 rounded-lg ${
                    isSelected ? 'bg-gold-500 text-oros-950' : 'bg-oros-800 text-oros-400'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium truncate">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-[10px] text-oros-400 truncate mt-0.5">{item.subtitle}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-oros-950 text-oros-400 border border-oros-800">
                    {item.category}
                  </span>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-gold-400" />}
                </div>
              </button>
            )
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-oros-500 italic">
              No matching commands or lore found for "{search}".
            </div>
          )}
        </div>

        {/* Footer Hint Bar */}
        <div className="p-2.5 bg-oros-950/80 border-t border-oros-800/60 text-[10px] text-oros-400 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-gold-400/80">Project Oros Command Palette</span>
        </div>
      </div>
    </div>
  )
}
