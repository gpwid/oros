import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { WikiInfobox } from './WikiInfobox'
import { WikiEditor } from './WikiEditor'
import { PromptModal, ConfirmModal } from '../common/PromptModal'
import { QuickPeekCard } from '../common/QuickPeekCard'
import { 
  Plus, Edit, Eye, Trash2, Tag, BookOpen, Link2, Sparkles, Filter 
} from 'lucide-react'
import { EntityType, LoreEntity } from '@shared/types'

export const WikiArticleView: React.FC = () => {
  const { 
    entities, activeWorldId, selectedEntityId, setSelectedEntityId, 
    updateEntity, createEntity, deleteEntity, searchQuery 
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [isEditing, setIsEditing] = useState(false)
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [hoveredEntity, setHoveredEntity] = useState<LoreEntity | null>(null)

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  // Filter entities by search and type
  const filteredEntities = worldEntities.filter((e) => {
    const matchesSearch = searchQuery === '' || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === 'all' || e.type === filterType
    return matchesSearch && matchesType
  })

  const currentEntity = worldEntities.find((e) => e.id === selectedEntityId) || filteredEntities[0]

  // Find backlinks (entities mentioning this entity in infobox or content)
  const backlinks = worldEntities.filter((e) => {
    if (!currentEntity || e.id === currentEntity.id) return false
    const mentionsInInfobox = e.infobox.sections.some(s => 
      s.fields.some(f => f.targetEntityId === currentEntity.id)
    )
    const mentionsInContent = e.content.includes(currentEntity.title)
    return mentionsInInfobox || mentionsInContent
  })

  const handleCreateSubmit = (title: string) => {
    const newEnt = createEntity(filterType === 'all' ? 'character' : filterType, title)
    setSelectedEntityId(newEnt.id)
    setIsEditing(true)
    setShowCreateModal(false)
    addToast(`Created article: ${title}`, 'success')
  }

  const handleDeleteConfirm = () => {
    if (!currentEntity) return
    const title = currentEntity.title
    deleteEntity(currentEntity.id)
    setShowDeleteModal(false)
    addToast(`Deleted article: ${title}`, 'info')
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Left Column: Article Index / Directory */}
      <aside className="w-72 bg-oros-950/70 border-r border-oros-800/40 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div className="p-3 border-b border-oros-800/40 flex items-center justify-between">
            <div className="text-xs font-serif font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-gold-400" />
              Articles Directory
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1 px-2 rounded-md bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="px-2 py-2 flex items-center gap-1 overflow-x-auto text-[11px] border-b border-oros-800/30">
            {(['all', 'character', 'location', 'faction', 'item'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2 py-0.5 rounded capitalize shrink-0 transition-colors ${
                  filterType === t 
                    ? 'bg-gold-500 text-oros-950 font-bold' 
                    : 'text-oros-400 hover:text-slate-200 hover:bg-oros-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Entity List */}
          <div className="overflow-y-auto p-2 space-y-1 max-h-[calc(100vh-140px)]">
            {filteredEntities.map((ent) => {
              const isSelected = ent.id === currentEntity?.id
              return (
                <button
                  key={ent.id}
                  onClick={() => {
                    setSelectedEntityId(ent.id)
                    setIsEditing(false)
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start justify-between group ${
                    isSelected
                      ? 'bg-oros-800/80 text-gold-400 font-semibold shadow-inner border border-oros-700/50'
                      : 'text-slate-300 hover:bg-oros-900/60 hover:text-slate-100'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate">{ent.title}</div>
                    <div className="text-[10px] text-oros-400 font-normal uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400/80"></span>
                      {ent.type}
                    </div>
                  </div>
                </button>
              )
            })}
            {filteredEntities.length === 0 && (
              <div className="p-4 text-center text-xs text-oros-500 italic">
                No matching articles found.
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area: Wikipedia-Style Encyclopedia Article */}
      <main className="flex-1 overflow-y-auto bg-oros-950 p-8 select-text">
        {currentEntity ? (
          <div className="max-w-5xl mx-auto">
            {/* Header: Title, Tags, and Action Controls */}
            <div className="border-b border-oros-800/60 pb-4 mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-oros-900 text-gold-400 border border-oros-800 font-semibold">
                    {currentEntity.type}
                  </span>
                  {currentEntity.aliases.length > 0 && (
                    <span className="text-xs text-oros-400 italic">
                      Also known as: {currentEntity.aliases.join(', ')}
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-3xl font-extrabold text-slate-100 tracking-wide">
                  {currentEntity.title}
                </h1>
                {currentEntity.summary && (
                  <p className="text-sm text-oros-300 mt-1 font-sans leading-relaxed">
                    {currentEntity.summary}
                  </p>
                )}
              </div>

              {/* Mode Toggle & Delete */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isEditing 
                      ? 'bg-gold-500 text-oros-950 hover:bg-gold-400' 
                      : 'bg-oros-900 hover:bg-oros-800 text-slate-200 border border-oros-700/60'
                  }`}
                >
                  {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                  <span>{isEditing ? 'View Article' : 'Edit Article'}</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 rounded-lg bg-oros-900/60 hover:bg-red-950/60 text-oros-400 hover:text-red-400 border border-oros-800 transition-colors"
                  title="Delete article"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Layout: Main Article Body + MediaWiki Infobox Float */}
            <div className="flex items-start gap-6">
              {/* Center Article Content */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-oros-400 mb-1">Article Summary</label>
                      <input
                        type="text"
                        value={currentEntity.summary}
                        onChange={(e) => updateEntity(currentEntity.id, { summary: e.target.value })}
                        className="w-full bg-oros-900 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                        placeholder="A concise, high-level summary..."
                      />
                    </div>
                    <WikiEditor
                      content={currentEntity.content}
                      onChange={(newHtml) => updateEntity(currentEntity.id, { content: newHtml })}
                    />
                  </div>
                ) : (
                  <div>
                    {/* Wikipedia-Style Table of Contents (TOC) Box */}
                    <div className="bg-oros-900/40 border border-oros-800/80 rounded-xl p-3.5 max-w-xs mb-6 text-xs shadow-inner">
                      <div className="font-serif font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-gold-400" />
                        Contents
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-oros-300 font-sans">
                        <li><span className="hover:text-gold-400 cursor-pointer">Overview & Foundations</span></li>
                        <li><span className="hover:text-gold-400 cursor-pointer">Historical Arc</span></li>
                        <li><span className="hover:text-gold-400 cursor-pointer">Political Affiliations</span></li>
                        <li><span className="hover:text-gold-400 cursor-pointer">References & See Also</span></li>
                      </ol>
                    </div>

                    {/* Formatted HTML Wiki Article */}
                    <div 
                      className="oros-wiki-prose"
                      dangerouslySetInnerHTML={{ __html: currentEntity.content }}
                    />
                  </div>
                )}

                {/* Backlinks / What Links Here */}
                <div className="mt-12 pt-6 border-t border-oros-800/60">
                  <h3 className="font-serif text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gold-400" />
                    What Links Here (Backlinks)
                  </h3>
                  {backlinks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {backlinks.map((bl) => (
                        <div
                          key={bl.id}
                          onMouseEnter={() => setHoveredEntity(bl)}
                          onMouseLeave={() => setHoveredEntity(null)}
                          className="relative"
                        >
                          <button
                            onClick={() => setSelectedEntityId(bl.id)}
                            className="w-full text-left p-2.5 rounded-xl bg-oros-900/60 border border-oros-800/60 hover:border-gold-400/50 hover:bg-oros-900 transition-all flex items-center justify-between group"
                          >
                            <div>
                              <div className="text-xs font-medium text-slate-200 group-hover:text-gold-400">
                                {bl.title}
                              </div>
                              <div className="text-[10px] text-oros-400 capitalize">{bl.type}</div>
                            </div>
                            <span className="text-[10px] text-oros-500 font-mono">Reference</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-oros-500 italic">
                      No other articles currently cite or link to this entry.
                    </p>
                  )}
                </div>
              </div>

              {/* Floated MediaWiki Infobox */}
              <WikiInfobox
                entity={currentEntity}
                onUpdate={(updates) => updateEntity(currentEntity.id, updates)}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-md p-6 bg-oros-900/40 border border-oros-800 rounded-xl">
              <BookOpen className="w-10 h-10 text-gold-400 mx-auto mb-3 opacity-80" />
              <h3 className="font-serif text-lg font-bold text-slate-100 mb-1">No Article Selected</h3>
              <p className="text-xs text-oros-400 mb-4">
                Choose an article from the directory on the left or forge a new entry for your realm.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs"
              >
                Create New Article
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating QuickPeek Card on Backlink Hover */}
      {hoveredEntity && (
        <div className="absolute bottom-12 left-80 z-50 pointer-events-none">
          <QuickPeekCard entity={hoveredEntity} />
        </div>
      )}

      {/* Accessible Modals */}
      <PromptModal
        isOpen={showCreateModal}
        title="Forge New Encyclopedia Article"
        description="Enter the title for this persona, location, or lore piece."
        placeholder="e.g. Citadel of the Star-Core"
        confirmLabel="Create Article"
        onConfirm={handleCreateSubmit}
        onCancel={() => setShowCreateModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Article"
        message={`Are you sure you want to permanently delete "${currentEntity?.title}"? All links pointing to this article will be preserved.`}
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}
