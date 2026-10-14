import React from 'react'
import { useWorldStore, ActiveNavTab } from '../../store/useWorldStore'
import { 
  BookOpen, Layers, Map, Network, Users, Clock, Feather, Search, Sparkles
} from 'lucide-react'

interface NavItem {
  id: ActiveNavTab;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'wiki', label: 'Encyclopedia', sublabel: 'Wikipedia layout', icon: BookOpen },
  { id: 'cards', label: 'Lore Cards', sublabel: 'Entities & schemas', icon: Layers },
  { id: 'relations', label: 'Relations', sublabel: 'People & social ties', icon: Users },
  { id: 'wiki-network', label: 'Wiki Network', sublabel: 'Cross-links & mentions', icon: Network },
  { id: 'maps', label: 'Cartography', sublabel: 'Deep-zoom & pins', icon: Map },
  { id: 'timeline', label: 'Chronology', sublabel: 'Eras & timelines', icon: Clock },
  { id: 'writer', label: 'Studio Writer', sublabel: 'Manuscript & lore', icon: Feather },
]

export const Sidebar: React.FC = () => {
  const { 
    activeTab, setActiveTab, activeWorldId, entities, maps, manuscripts,
    searchQuery, setSearchQuery 
  } = useWorldStore()

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldMaps = activeWorldId ? maps[activeWorldId] || [] : []
  const worldChapters = activeWorldId ? manuscripts[activeWorldId] || [] : []
  const totalWords = worldChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0)

  return (
    <aside className="w-60 bg-oros-950 border-r border-oros-800/40 flex flex-col justify-between select-none">
      <div>
        {/* Search input */}
        <div className="p-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-oros-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lore, places, clans..."
              className="w-full bg-oros-900/90 border border-oros-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-oros-500 focus:outline-none focus:border-gold-400/80 transition-colors"
            />
          </div>
        </div>

        {/* Navigation list */}
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id || (item.id === 'relations' && activeTab === 'graph')
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all group ${
                  isActive
                    ? 'bg-oros-800/80 text-gold-400 font-semibold shadow-inner'
                    : 'text-oros-300 hover:text-slate-100 hover:bg-oros-900/60'
                }`}
              >
                <div className={`p-1.5 rounded-md ${
                  isActive 
                    ? 'bg-gold-500/20 text-gold-400' 
                    : 'bg-oros-900 text-oros-400 group-hover:text-slate-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs leading-none mb-0.5">{item.label}</div>
                  <div className="text-[10px] text-oros-500 font-normal">{item.sublabel}</div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* World Vault Metadata & Quick Stats */}
      <div className="p-3 border-t border-oros-800/40 text-[11px] text-oros-400 space-y-1.5 bg-oros-950/60">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-oros-400">
            <Sparkles className="w-3 h-3 text-gold-400" />
            Lore Articles
          </span>
          <span className="font-mono text-slate-300 font-semibold">{worldEntities.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-oros-400">
            <Map className="w-3 h-3 text-teal-400" />
            World Maps
          </span>
          <span className="font-mono text-slate-300 font-semibold">{worldMaps.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-oros-400">
            <Feather className="w-3 h-3 text-indigo-400" />
            Total Words
          </span>
          <span className="font-mono text-slate-300 font-semibold">{totalWords.toLocaleString()}</span>
        </div>
      </div>
    </aside>
  )
}
