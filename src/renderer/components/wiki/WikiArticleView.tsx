import React, { useState, useEffect, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { WikiInfobox } from './WikiInfobox'
import { WikiEditor } from './WikiEditor'
import { PromptModal, ConfirmModal } from '../common/PromptModal'
import { QuickPeekCard } from '../common/QuickPeekCard'
import { 
  Plus, Edit, Eye, Trash2, Tag, BookOpen, Link2, List, Filter, ChevronDown, SlidersHorizontal,
  ChevronsLeft, ChevronsRight
} from 'lucide-react'
import { EntityType, LoreEntity } from '@shared/types'
import { 
  DEFAULT_PRESET_CATEGORIES, 
  getCategoryIconComponent, 
  getCategoryMeta 
} from '../../utils/categoryIcons'
import { CategoryManagerModal } from '../common/CategoryManagerModal'

interface WikiArticleViewProps {
  entityId?: string
}

export const WikiArticleView: React.FC<WikiArticleViewProps> = ({ entityId }) => {
  const { 
    entities, categories, activeWorldId, selectedEntityId, setSelectedEntityId, openTab,
    updateEntity, createEntity, deleteEntity, searchQuery 
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [isEditing, setIsEditing] = useState(false)
  const [filterType, setFilterType] = useState<string | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [hoveredEntity, setHoveredEntity] = useState<LoreEntity | null>(null)
  const [isTocCollapsed, setIsTocCollapsed] = useState(false)
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(true)

  const worldId = activeWorldId || 'world-aethelgard'
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldCategories = categories[worldId] || DEFAULT_PRESET_CATEGORIES

  // Prioritize entityId prop if passed from active workspace tab
  const effectiveId = entityId || selectedEntityId

  // Synchronize store selectedEntityId when entityId prop changes
  useEffect(() => {
    if (entityId && entityId !== selectedEntityId) {
      setSelectedEntityId(entityId)
    }
  }, [entityId, selectedEntityId, setSelectedEntityId])

  // Filter entities by search and type
  const filteredEntities = worldEntities.filter((e) => {
    const matchesSearch = searchQuery === '' || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === 'all' || e.type === filterType
    return matchesSearch && matchesType
  })

  const currentEntity = worldEntities.find((e) => e.id === effectiveId) || worldEntities.find((e) => e.id === selectedEntityId) || filteredEntities[0]

  // Dynamically extract real headings from article HTML and inject unique IDs
  const { processedHtml, tocItems } = useMemo(() => {
    if (!currentEntity?.content) return { processedHtml: '', tocItems: [] }

    const parser = new DOMParser()
    const doc = parser.parseFromString(currentEntity.content, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4')
    const items: { id: string; text: string; level: number }[] = []

    headings.forEach((heading, idx) => {
      const text = heading.textContent?.trim() || ''
      if (!text) return
      const slug = `sec-${idx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      heading.setAttribute('id', slug)
      heading.classList.add('scroll-mt-6')
      items.push({
        id: slug,
        text,
        level: parseInt(heading.tagName.substring(1), 10)
      })
    })

    return {
      processedHtml: doc.body.innerHTML,
      tocItems: items
    }
  }, [currentEntity?.content])

  // Compute hierarchical numbers (1, 2, 2.1, 2.2, 3...)
  const numberedTocItems = useMemo(() => {
    let h2Count = 0
    let h3Count = 0
    return tocItems.map((item) => {
      let numberStr = ''
      if (item.level <= 2) {
        h2Count++
        h3Count = 0
        numberStr = `${h2Count}`
      } else {
        h3Count++
        numberStr = `${h2Count}.${h3Count}`
      }
      return { ...item, numberStr }
    })
  }, [tocItems])

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.classList.add('text-gold-400')
      setTimeout(() => el.classList.remove('text-gold-400'), 1400)
    }
  }

  // Find backlinks (entities mentioning this entity in infobox or content)
  const backlinks = useMemo(() => {
    if (!currentEntity) return []
    return worldEntities.filter((e) => {
      if (e.id === currentEntity.id) return false
      const mentionsInInfobox = e.infobox.sections.some(s => 
        s.fields.some(f => f.targetEntityId === currentEntity.id)
      )
      const mentionsInContent = e.content.includes(currentEntity.title)
      return mentionsInInfobox || mentionsInContent
    })
  }, [currentEntity?.id, currentEntity?.title, worldEntities])

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
      {/* Collapsed Directory Rail */}
      {!isDirectoryOpen ? (
        <div className="w-8 bg-oros-950 border-r border-oros-800 flex flex-col items-center py-2.5 shrink-0 select-none">
          <button
            onClick={() => setIsDirectoryOpen(true)}
            title="Open Articles Directory"
            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors mb-3"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsDirectoryOpen(true)}
            className="text-[10px] tracking-wider uppercase text-oros-500 hover:text-oros-300 font-medium select-none py-2"
            style={{ writingMode: 'vertical-rl' }}
          >
            Articles
          </button>
        </div>
      ) : (
        /* Left Column: Article Index / Directory */
        <aside className="w-72 bg-oros-950 border-r border-oros-800 flex flex-col justify-between shrink-0 select-none">
          <div>
            <div className="p-3 border-b border-oros-800 flex items-center justify-between">
              <div className="text-xs font-sans font-semibold text-oros-100 tracking-tight flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-oros-400" />
                Articles
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-200 border border-oros-750 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3 text-oros-400" />
                  <span>New</span>
                </button>
                <button
                  onClick={() => setIsDirectoryOpen(false)}
                  title="Close Directory"
                  className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-2 py-1.5 flex items-center gap-1 overflow-x-auto text-[11px] border-b border-oros-800 scrollbar-thin">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded-[2px] capitalize shrink-0 font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-oros-200 text-oros-950 font-semibold' 
                    : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
                }`}
              >
                All
              </button>
              {worldCategories.map((cat) => {
                const isActive = filterType === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilterType(cat.id)}
                    className={`px-2 py-0.5 rounded-[2px] shrink-0 flex items-center gap-1 transition-colors font-medium ${
                      isActive 
                        ? 'bg-oros-200 text-oros-950 font-semibold' 
                        : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isActive ? '#090a0d' : (cat.color || '#94a3b8') }}
                    />
                    <span>{cat.name}</span>
                  </button>
                )
              })}
              <button
                onClick={() => setShowCategoryManager(true)}
                title="Manage Categories"
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 shrink-0 transition-colors ml-auto"
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
            </div>

            {/* Entity List */}
            <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-[calc(100vh-140px)]">
              {filteredEntities.map((ent) => {
                const isSelected = ent.id === currentEntity?.id
                const catMeta = getCategoryMeta(ent.type, worldCategories)
                const CatIcon = getCategoryIconComponent(catMeta.icon)
                return (
                  <button
                    key={ent.id}
                    onClick={() => {
                      setSelectedEntityId(ent.id)
                      openTab({ title: ent.title, type: 'wiki', targetId: ent.id })
                      setIsEditing(false)
                    }}
                    className={`w-full text-left p-2 rounded-[3px] text-xs transition-all flex items-start justify-between group ${
                      isSelected
                        ? 'bg-oros-850 text-oros-100 font-medium border border-oros-750'
                        : 'text-oros-300 hover:bg-oros-900 hover:text-oros-100'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{ent.title}</div>
                      <div className="text-[10px] text-oros-500 font-mono uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: catMeta.color || '#94a3b8' }}
                        />
                        <CatIcon className="w-2.5 h-2.5 opacity-70" />
                        <span>{catMeta.name}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
              {filteredEntities.length === 0 && (
                <div className="p-4 text-center text-xs text-oros-500 font-sans">
                  No matching articles found.
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area: Article */}
      <main className="flex-1 overflow-y-auto bg-oros-950 p-8 select-text">
        {currentEntity ? (
          <div className="max-w-5xl mx-auto">
            {/* Header: Title, Tags, and Action Controls */}
            <div className="border-b border-oros-800 pb-4 mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {!isDirectoryOpen && (
                    <button
                      onClick={() => setIsDirectoryOpen(true)}
                      className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium flex items-center gap-1.5 transition-colors mr-1"
                      title="Open Articles Directory"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-oros-400" />
                      <span>Articles</span>
                    </button>
                  )}
                  {(() => {
                    const currentCatMeta = getCategoryMeta(currentEntity.type, worldCategories)
                    const CurrentCatIcon = getCategoryIconComponent(currentCatMeta.icon)
                    return (
                      <div className="relative inline-block">
                        <button
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="px-2 py-0.5 rounded-[2px] text-[10px] uppercase font-mono tracking-wider border font-medium flex items-center gap-1.5 transition-all shadow-sm"
                          style={{
                            backgroundColor: `${currentCatMeta.color || '#94a3b8'}15`,
                            borderColor: `${currentCatMeta.color || '#94a3b8'}40`,
                            color: currentCatMeta.color || '#cbd5e1'
                          }}
                          title="Click to reclassify category / label"
                        >
                          <CurrentCatIcon className="w-3 h-3" />
                          <span>{currentCatMeta.name}</span>
                          <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                        </button>

                        {/* Category Reassignment Dropdown */}
                        {showCategoryDropdown && (
                          <div 
                            className="absolute top-full left-0 mt-1.5 w-56 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl py-1 z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-oros-400 font-mono border-b border-oros-800 flex items-center justify-between">
                              <span>Change Label</span>
                              <button
                                onClick={() => {
                                  setShowCategoryDropdown(false)
                                  setShowCategoryManager(true)
                                }}
                                className="text-oros-300 hover:text-oros-100 font-sans normal-case text-[10px] font-medium flex items-center gap-1"
                              >
                                <SlidersHorizontal className="w-2.5 h-2.5" />
                                <span>Manage</span>
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                              {worldCategories.map((c) => {
                                const Icon = getCategoryIconComponent(c.icon)
                                const isSelected = c.id === currentEntity.type
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      updateEntity(currentEntity.id, { type: c.id })
                                      setShowCategoryDropdown(false)
                                      addToast(`Reassigned to ${c.name}`, 'success')
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-[3px] text-xs flex items-center justify-between transition-colors ${
                                      isSelected
                                        ? 'bg-oros-800 text-oros-100 font-medium'
                                        : 'text-oros-300 hover:bg-oros-850 hover:text-oros-100'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: c.color || '#94a3b8' }}
                                      />
                                      <Icon className="w-3.5 h-3.5" style={{ color: c.color || '#94a3b8' }} />
                                      <span>{c.name}</span>
                                    </div>
                                    {isSelected && <span className="text-[10px] text-oros-300 font-mono">✓</span>}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                  {currentEntity.isSecret && (
                    <span className="px-1.5 py-0.5 rounded-[2px] bg-rose-950/70 border border-rose-800/80 text-[10px] font-mono font-medium text-rose-300 uppercase tracking-wider">
                      Secret
                    </span>
                  )}
                  {currentEntity.aliases && currentEntity.aliases.length > 0 && (
                    <span 
                      onClick={() => setIsEditing(true)}
                      className="text-xs text-oros-400 italic font-sans cursor-pointer hover:text-oros-200 transition-colors"
                      title="Click to edit aliases"
                    >
                      Also known as: {currentEntity.aliases.join(', ')}
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-2xl font-bold text-oros-100 tracking-tight">
                  {currentEntity.title}
                </h1>
                {currentEntity.summary && (
                  <p className="text-xs text-oros-300 mt-1 font-sans leading-relaxed">
                    {currentEntity.summary}
                  </p>
                )}
              </div>

              {/* Mode Toggle & Delete */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isEditing 
                      ? 'bg-oros-200 text-oros-950 hover:bg-white' 
                      : 'bg-oros-900 hover:bg-oros-850 text-oros-200 border border-oros-750'
                  }`}
                >
                  {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                  <span>{isEditing ? 'View Article' : 'Edit Article'}</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 rounded-[3px] bg-oros-900 hover:bg-rose-950/60 text-oros-400 hover:text-rose-400 border border-oros-750 transition-colors"
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
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-oros-400 mb-1 font-sans">Article Summary</label>
                        <input
                          type="text"
                          value={currentEntity.summary}
                          onChange={(e) => updateEntity(currentEntity.id, { summary: e.target.value })}
                          className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                          placeholder="A concise, high-level summary..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-oros-400 mb-1 font-sans">
                          Also known as / Aliases <span className="text-oros-500 font-normal">(comma-separated)</span>
                        </label>
                        <input
                          type="text"
                          value={currentEntity.aliases ? currentEntity.aliases.join(', ') : ''}
                          onChange={(e) => {
                            const val = e.target.value
                            const parsed = val.split(',').map((s) => s.trim()).filter(Boolean)
                            updateEntity(currentEntity.id, { aliases: parsed })
                          }}
                          className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                          placeholder="E.g. The Silk Seer, Master Weaver (leave empty to hide)"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-oros-300 select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(currentEntity.isSecret)}
                          onChange={(e) => updateEntity(currentEntity.id, { isSecret: e.target.checked })}
                          className="rounded border-oros-750 bg-oros-900 text-oros-300 focus:ring-0"
                        />
                        <span>Mark as Secret / Spoiler Note (distinguished for GM / Director view)</span>
                      </label>
                    </div>
                    <WikiEditor
                      content={currentEntity.content}
                      onChange={(newHtml) => updateEntity(currentEntity.id, { content: newHtml })}
                    />
                  </div>
                ) : (
                  <div>
                    {/* Dynamic Wikipedia Table of Contents (TOC) */}
                    {tocItems.length >= 2 && (
                      <div className="bg-oros-900 border border-oros-800 rounded-[4px] p-3 max-w-sm mb-6 text-xs shadow-sm">
                        <div className="flex items-center justify-between border-b border-oros-800 pb-1.5 mb-2">
                          <div className="font-mono text-oros-300 uppercase tracking-wider text-[11px] font-medium flex items-center gap-1.5">
                            <List className="w-3.5 h-3.5 text-oros-400" />
                            Contents
                          </div>
                          <button
                            onClick={() => setIsTocCollapsed(!isTocCollapsed)}
                            className="text-[10px] font-mono text-oros-400 hover:text-oros-200 transition-colors"
                          >
                            [{isTocCollapsed ? 'show' : 'hide'}]
                          </button>
                        </div>

                        {!isTocCollapsed && (
                          <nav className="space-y-0.5">
                            {numberedTocItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => scrollToHeading(item.id)}
                                style={{ paddingLeft: item.level > 2 ? '1rem' : '0rem' }}
                                className="w-full text-left py-0.5 text-xs text-oros-400 hover:text-oros-100 hover:underline flex items-baseline gap-1.5 transition-colors group"
                              >
                                <span className="font-mono text-[10px] text-oros-500 group-hover:text-oros-300 shrink-0">
                                  {item.numberStr}
                                </span>
                                <span className="truncate">{item.text}</span>
                              </button>
                            ))}
                          </nav>
                        )}
                      </div>
                    )}

                    {/* Formatted HTML Wiki Article with Injected Anchor IDs */}
                    <div 
                      className="oros-wiki-prose"
                      dangerouslySetInnerHTML={{ __html: processedHtml }}
                    />
                  </div>
                )}

                {/* Backlinks / What Links Here */}
                <div className="mt-12 pt-6 border-t border-oros-800">
                  <h3 className="font-sans text-xs font-semibold text-oros-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-oros-400" />
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
                            onClick={() => {
                              setSelectedEntityId(bl.id)
                              openTab({ title: bl.title, type: 'wiki', targetId: bl.id })
                            }}
                            className="w-full text-left p-2.5 rounded-[3px] bg-oros-900 border border-oros-800 hover:border-oros-700 hover:bg-oros-850 transition-all flex items-center justify-between group"
                          >
                            <div>
                              <div className="text-xs font-medium text-oros-200 group-hover:text-white">
                                {bl.title}
                              </div>
                              <div className="text-[10px] text-oros-500 font-mono capitalize">{bl.type}</div>
                            </div>
                            <span className="text-[10px] text-oros-500 font-mono">Reference</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-oros-500 font-sans">
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
            <div className="max-w-md p-6 bg-oros-900 border border-oros-750 rounded-[4px] shadow-sm">
              <BookOpen className="w-8 h-8 text-oros-500 mx-auto mb-3" />
              <h3 className="font-sans text-sm font-semibold text-oros-100 mb-1">No Article Selected</h3>
              <p className="text-xs text-oros-400 mb-4 font-sans">
                Select an article from the directory or create a new entry.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 rounded-[3px] bg-oros-200 hover:bg-white text-oros-950 font-semibold text-xs shadow-sm transition-colors"
              >
                New Article
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
        title="New Article"
        description="Enter article title."
        placeholder="Article title..."
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

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onSelectCategory={(catId) => {
          setFilterType(catId)
        }}
      />
    </div>
  )
}
