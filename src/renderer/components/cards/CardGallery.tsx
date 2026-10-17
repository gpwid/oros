import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { EntityType, LoreEntity } from '@shared/types'
import { 
  Plus, Search, Tag, ExternalLink, Filter, Layers, SlidersHorizontal, X
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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-oros-800">
        <div>
          <h2 className="font-sans text-base font-semibold text-oros-100 flex items-center gap-2 tracking-tight">
            <Layers className="w-4 h-4 text-oros-400" />
            Cards
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="px-2.5 py-1.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-oros-400" />
            <span>Manage Labels</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-oros-800 text-oros-300 font-mono">
              {worldCategories.length}
            </span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-accent px-2.5 sm:px-3 py-1.5 rounded-[3px] font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New Card</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-thin">
        {/* All Entities Pill */}
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-2.5 py-1.5 rounded-[3px] text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
            activeCategory === 'all'
              ? 'bg-accent-muted text-accent border border-accent/40 font-semibold shadow-sm'
              : 'bg-oros-900 hover:bg-oros-850 text-oros-400 hover:text-oros-200 border border-oros-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-[2px] font-mono ${
            activeCategory === 'all' ? 'bg-accent/20 text-accent font-semibold' : 'bg-oros-800 text-oros-400'
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
              className={`px-2.5 py-1.5 rounded-[3px] text-xs font-medium flex items-center gap-2 transition-all shrink-0 ${
                isActive
                  ? 'bg-accent-muted text-accent border border-accent/40 font-semibold shadow-sm'
                  : 'bg-oros-900 hover:bg-oros-850 text-oros-400 hover:text-oros-200 border border-oros-800'
              }`}
            >
              <Icon 
                className="w-3.5 h-3.5" 
                style={{ color: cat.color || 'var(--oros-accent)' }} 
              />
              <span>{cat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-[2px] font-mono ${
                isActive ? 'bg-accent/20 text-accent font-semibold' : 'bg-oros-800 text-oros-400'
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
          className="px-2.5 py-1.5 rounded-[3px] text-xs font-medium bg-oros-950 hover:bg-oros-900 text-oros-400 hover:text-oros-200 border border-dashed border-oros-750 flex items-center gap-1 shrink-0 transition-colors"
        >
          <Plus className="w-3 h-3 text-oros-400" />
          <span>Label</span>
        </button>
      </div>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredEntities.map((ent) => {
            const catMeta = getCategoryMeta(ent.type, worldCategories)
            const CatIcon = getCategoryIconComponent(catMeta.icon)
            return (
              <div
                key={ent.id}
                onClick={() => navigateToWiki(ent)}
                className="card-interactive bg-oros-900 border border-oros-800 hover:border-oros-600 rounded-[4px] overflow-hidden shadow-sm group flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Card Banner / Portrait */}
                  <div className="h-28 bg-oros-950 relative overflow-hidden border-b border-oros-800">
                    {ent.avatar ? (
                      <img
                        src={ent.avatar}
                        alt={ent.title}
                        className="w-full h-full object-cover transition-all duration-300 ease-snappy opacity-90 group-hover:opacity-100 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-oros-950 flex items-center justify-center text-oros-700">
                        <Layers className="w-7 h-7 opacity-30" />
                      </div>
                    )}
                    <span 
                      className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[2px] text-[10px] uppercase font-mono tracking-wider backdrop-blur-sm border font-medium flex items-center gap-1 shadow-sm"
                      style={{
                        backgroundColor: 'rgba(9, 10, 13, 0.92)',
                        borderColor: `${catMeta.color || '#94a3b8'}50`,
                        color: catMeta.color || '#cbd5e1'
                      }}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catMeta.name}</span>
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5">
                    <h3 className="font-sans font-semibold text-oros-100 text-sm mb-1 truncate group-hover:text-white transition-colors">
                      {ent.title}
                    </h3>
                    <p className="text-xs text-oros-400 line-clamp-2 leading-relaxed mb-3">
                      {ent.summary || 'No summary provided.'}
                    </p>

                    {/* Tags */}
                    {ent.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {ent.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-oros-850 text-oros-400 border border-oros-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Highlights from Infobox */}
                    {ent.infobox.sections[0]?.fields.slice(0, 2).map((f) => (
                      <div key={f.id} className="text-[11px] font-mono flex justify-between text-oros-400 border-t border-oros-800/60 pt-1 mt-1">
                        <span>{f.label}:</span>
                        <span className="text-oros-200 truncate max-w-[120px]">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-2.5 bg-oros-950 border-t border-oros-800 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigateToWiki(ent)
                    }}
                    className="text-xs text-oros-400 hover:text-oros-100 font-medium flex items-center gap-1 transition-colors"
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
            <Layers className="w-8 h-8 text-oros-700 mb-2" />
            <p className="text-xs text-oros-400 font-sans">No cards found.</p>
          </div>
        )}
      </div>

      {/* Modal for Creating Card */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-sm rounded-[4px] shadow-2xl flex flex-col max-h-[320px] overflow-hidden select-text text-oros-100 animate-modal-in">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                New Card
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form id="create-card-form" onSubmit={handleCreate} className="p-3.5 space-y-2.5 overflow-y-auto flex-1">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-mono uppercase font-semibold text-oros-400">Category / Label</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setShowCategoryManager(true)
                    }}
                    className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    <span>Manage</span>
                  </button>
                </div>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                >
                  {worldCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isPreset ? '' : '(Custom)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Card Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lord Commander Vael"
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                />
              </div>
            </form>

            {/* Pinned Visible Footer */}
            <div className="px-4 py-2 border-t border-oros-750 bg-oros-900 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-card-form"
                className="btn-accent px-3.5 py-1 rounded-[3px] text-xs font-semibold shadow-sm transition-colors"
              >
                Create Card
              </button>
            </div>
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
