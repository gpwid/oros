import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { EntityType, LoreEntity } from '@shared/types'
import { 
  Plus, Search, Tag, ExternalLink, Filter, Layers, SlidersHorizontal
} from 'lucide-react'
import { 
  DEFAULT_PRESET_CATEGORIES, 
  getCategoryIconComponent, 
  getCategoryMeta 
} from '../../utils/categoryIcons'
import { CategoryManagerModal } from '../common/CategoryManagerModal'

export const CardGallery: React.FC = () => {
  const { 
    entities, categories, activeWorldId, setSelectedEntityId, openTab, 
    createEntity, searchQuery, setSearchQuery 
  } = useWorldStore()

  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<string>('character')

  const worldId = activeWorldId || 'world-aethelgard'
  const worldEntities = entities[worldId] || []
  const worldCategories = categories[worldId] || DEFAULT_PRESET_CATEGORIES

  const filteredEntities = worldEntities.filter((e) => {
    const matchesCat = activeCategory === 'all' || e.type === activeCategory
    const matchesSearch = searchQuery === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const navigateToWiki = (entity: LoreEntity) => {
    setSelectedEntityId(entity.id)
    openTab({
      title: entity.title,
      type: 'wiki',
      targetId: entity.id
    })
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const newEnt = createEntity(newType, newTitle.trim())
    navigateToWiki(newEnt)
    setShowCreateModal(false)
    setNewTitle('')
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="px-3 py-2 rounded-lg bg-oros-900 hover:bg-oros-800 text-oros-300 hover:text-slate-100 border border-oros-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-gold-400" />
            <span>Manage Labels</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-oros-800 text-gold-400 font-mono">
              {worldCategories.length}
            </span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Forge Lore Card</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-thin">
        {/* All Entities Pill */}
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
            activeCategory === 'all'
              ? 'bg-gold-500 text-oros-950 font-bold shadow-sm'
              : 'bg-oros-900/80 hover:bg-oros-800 text-oros-300 hover:text-slate-100 border border-oros-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Entities</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            activeCategory === 'all' ? 'bg-oros-950/20 text-oros-950' : 'bg-oros-800 text-oros-400'
          }`}>
            {worldEntities.length}
          </span>
        </button>

        {/* Dynamic Category Pills */}
        {worldCategories.map((cat) => {
          const Icon = getCategoryIconComponent(cat.icon)
          const isActive = activeCategory === cat.id
          const count = worldEntities.filter((e) => e.type === cat.id).length
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
              <Icon 
                className="w-3.5 h-3.5" 
                style={{ color: isActive ? '#020617' : (cat.color || '#eab308') }} 
              />
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-oros-950/20 text-oros-950' : 'bg-oros-800 text-oros-400'
              }`}>
                {count}
              </span>
            </button>
          )
        })}

        {/* Quick Add / Manage Button */}
        <button
          onClick={() => setShowCategoryManager(true)}
          title="Create or edit categories"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-oros-950/70 hover:bg-oros-800 text-oros-400 hover:text-gold-300 border border-dashed border-oros-700/80 flex items-center gap-1 shrink-0 transition-colors"
        >
          <Plus className="w-3 h-3 text-gold-400" />
          <span>Label</span>
        </button>
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntities.map((ent) => {
            const catMeta = getCategoryMeta(ent.type, worldCategories)
            const CatIcon = getCategoryIconComponent(catMeta.icon)
            return (
              <div
                key={ent.id}
                onClick={() => navigateToWiki(ent)}
                className="bg-oros-900/70 border border-oros-800 hover:border-gold-400/60 rounded-xl overflow-hidden shadow-lg transition-all hover:-translate-y-0.5 group flex flex-col justify-between cursor-pointer"
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
                    <span 
                      className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider backdrop-blur-sm border font-semibold flex items-center gap-1 shadow-sm"
                      style={{
                        backgroundColor: 'rgba(2, 6, 23, 0.88)',
                        borderColor: `${catMeta.color || '#eab308'}60`,
                        color: catMeta.color || '#eab308'
                      }}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catMeta.name}</span>
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
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateToWiki(ent)
                    }}
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
            )
          })}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-oros-300">Category / Label</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setShowCategoryManager(true)
                    }}
                    className="text-[11px] text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    <span>+ Manage Labels</span>
                  </button>
                </div>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                >
                  {worldCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isPreset ? '' : '(Custom)'}
                    </option>
                  ))}
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

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onSelectCategory={(catId) => {
          setActiveCategory(catId)
          setNewType(catId)
        }}
      />
    </div>
  )
}
