import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { EntityType, LoreEntity } from '@shared/types'
import { 
  Plus, Search, Tag, ExternalLink, Filter, Layers, User, MapPin, Shield, Sword, Sparkles 
} from 'lucide-react'

export const CardGallery: React.FC = () => {
  const { 
    entities, activeWorldId, setSelectedEntityId, setActiveTab, 
    createEntity, searchQuery, setSearchQuery 
  } = useWorldStore()

  const [activeCategory, setActiveCategory] = useState<EntityType | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<EntityType>('character')

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  const categories: { id: EntityType | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All Entities', icon: Layers },
    { id: 'character', label: 'Characters', icon: User },
    { id: 'location', label: 'Locations', icon: MapPin },
    { id: 'faction', label: 'Factions', icon: Shield },
    { id: 'item', label: 'Relics & Items', icon: Sword },
    { id: 'magic_system', label: 'Magic & Lore', icon: Sparkles },
  ]

  const filteredEntities = worldEntities.filter((e) => {
    const matchesCat = activeCategory === 'all' || e.type === activeCategory
    const matchesSearch = searchQuery === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const newEnt = createEntity(newType, newTitle.trim())
    setSelectedEntityId(newEnt.id)
    setShowCreateModal(false)
    setNewTitle('')
  }

  const navigateToWiki = (entityId: string) => {
    setSelectedEntityId(entityId)
    setActiveTab('wiki')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 p-6">
      {/* Top Controls: Category Tabs & New Card Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-oros-800/60">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold-400" />
            Lore Codex Cards
          </h2>
          <p className="text-xs text-oros-400 mt-0.5">
            Structured building blocks of your world's dramatis personae, settlements, and factions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Forge Lore Card</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-gold-500 text-oros-950 font-bold shadow-sm'
                  : 'bg-oros-900/80 hover:bg-oros-800 text-oros-300 hover:text-slate-100 border border-oros-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-oros-950/20 text-oros-950' : 'bg-oros-800 text-oros-400'
              }`}>
                {cat.id === 'all' 
                  ? worldEntities.length 
                  : worldEntities.filter(e => e.type === cat.id).length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntities.map((ent) => (
            <div
              key={ent.id}
              className="bg-oros-900/70 border border-oros-800 hover:border-gold-400/60 rounded-xl overflow-hidden shadow-lg transition-all hover:-translate-y-0.5 group flex flex-col justify-between"
            >
              <div>
                {/* Card Banner / Portrait */}
                <div className="h-32 bg-oros-950 relative overflow-hidden">
                  {ent.avatar ? (
                    <img
                      src={ent.avatar}
                      alt={ent.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-oros-800 to-oros-900 flex items-center justify-center text-oros-600">
                      <Layers className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-oros-950/85 backdrop-blur-sm text-gold-400 border border-oros-700/60 font-semibold">
                    {ent.type}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <h3 className="font-serif font-bold text-slate-100 text-base mb-1 truncate group-hover:text-gold-400 transition-colors">
                    {ent.title}
                  </h3>
                  <p className="text-xs text-oros-300 line-clamp-2 leading-relaxed mb-3">
                    {ent.summary || 'No summary provided.'}
                  </p>

                  {/* Tags */}
                  {ent.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {ent.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-oros-800/80 text-oros-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Highlights from Infobox */}
                  {ent.infobox.sections[0]?.fields.slice(0, 2).map((f) => (
                    <div key={f.id} className="text-[11px] flex justify-between text-oros-400 border-t border-oros-800/40 pt-1 mt-1">
                      <span>{f.label}:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[120px]">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-oros-950/60 border-t border-oros-800/60 flex items-center justify-between">
                <button
                  onClick={() => navigateToWiki(ent.id)}
                  className="text-xs text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1"
                >
                  <span>Open in Wiki</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-oros-500 font-mono">
                  {new Date(ent.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredEntities.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <Layers className="w-10 h-10 text-oros-600 mb-2" />
            <p className="text-xs text-oros-400">No lore cards found matching criteria.</p>
          </div>
        )}
      </div>

      {/* Modal for Creating Lore Card */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-2">
              Forge New Lore Card
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Entity Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as EntityType)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="character">Character</option>
                  <option value="location">Location / Realm</option>
                  <option value="faction">Faction / Organization</option>
                  <option value="item">Relic / Artifact</option>
                  <option value="magic_system">Magic System / Lore</option>
                  <option value="species">Species / Bloodline</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Title / Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Grand Magus Thorne"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md"
                >
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
