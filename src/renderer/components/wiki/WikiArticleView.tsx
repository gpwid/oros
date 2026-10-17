import React, { useState, useEffect, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { WikiInfobox } from './WikiInfobox'
import { WikiEditor } from './WikiEditor'
import { PromptModal, ConfirmModal } from '../common/PromptModal'
import { NewEntityModal } from '../common/NewEntityModal'
import { QuickPeekCard } from '../common/QuickPeekCard'
import { 
  Plus, Edit, Eye, Trash2, Tag, BookOpen, Link2, List, Filter, ChevronDown, SlidersHorizontal,
  ChevronsLeft, ChevronsRight, EyeOff, Feather, MapPin, Calendar, GitFork, FileText, ExternalLink
} from 'lucide-react'
import { EntityType, LoreEntity } from '@shared/types'
import { 
  DEFAULT_PRESET_CATEGORIES, 
  getCategoryIconComponent, 
  getCategoryMeta 
} from '../../utils/categoryIcons'
import { CategoryManagerModal } from '../common/CategoryManagerModal'
import { findBacklinksForEntity } from '../../utils/backlinksEngine'

interface WikiArticleViewProps {
  entityId?: string
}

export const WikiArticleView: React.FC<WikiArticleViewProps> = ({ entityId }) => {
  const { 
    entities, categories, activeWorldId, selectedEntityId, setSelectedEntityId, openTab,
    updateEntity, createEntity, deleteEntity, searchQuery, gmMode,
    manuscripts, maps, timelines, relations, setSelectedChapterId, setSelectedMapId
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
  const [backlinkFilter, setBacklinkFilter] = useState<'all' | 'chapters' | 'lore' | 'maps' | 'timelines' | 'relations'>('all')

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
      el.classList.add('text-accent')
      setTimeout(() => el.classList.remove('text-accent'), 1400)
    }
  }

  const worldChapters = useMemo(() => activeWorldId ? manuscripts[activeWorldId] || [] : [], [activeWorldId, manuscripts])
  const worldMaps = useMemo(() => activeWorldId ? maps[activeWorldId] || [] : [], [activeWorldId, maps])
  const worldTimelines = useMemo(() => activeWorldId ? timelines[activeWorldId] || [] : [], [activeWorldId, timelines])
  const worldRelations = useMemo(() => activeWorldId ? relations[activeWorldId] || [] : [], [activeWorldId, relations])

  // Multi-domain bidirectional backlinks index
  const backlinksData = useMemo(() => {
    if (!currentEntity) {
      return { totalCount: 0, chapters: [], lore: [], maps: [], timelines: [], relations: [] }
    }
    return findBacklinksForEntity(
      currentEntity,
      worldEntities,
      worldChapters,
      worldMaps,
      worldTimelines,
      worldRelations
    )
  }, [currentEntity, worldEntities, worldChapters, worldMaps, worldTimelines, worldRelations])

  const handleCreateSubmit = (title: string, templateId: string, folderId?: string | null) => {
    const newEnt = createEntity(filterType === 'all' ? 'character' : filterType, title, folderId, templateId)
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
      {/* Animated Article Directory Sidebar Container */}
      <aside 
        className={`h-full bg-oros-950 border-r border-oros-800 shrink-0 select-none transition-all duration-250 ease-snappy overflow-hidden relative ${
          isDirectoryOpen ? 'w-72' : 'w-8'
        }`}
      >
        {/* Collapsed Directory Rail */}
        <div 
          className={`w-8 h-full bg-oros-950 flex flex-col items-center py-2.5 absolute inset-y-0 left-0 transition-opacity duration-200 z-10 ${
            !isDirectoryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={() => setIsDirectoryOpen(true)}
            title="Open Articles Directory"
            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors mb-3 btn-interactive"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsDirectoryOpen(true)}
            className="text-[10px] tracking-wider uppercase text-oros-500 hover:text-oros-300 font-medium select-none py-2 cursor-pointer"
            style={{ writingMode: 'vertical-rl' }}
          >
            Articles
          </button>
        </div>

        {/* Expanded Directory Content (Fixed w-72 to prevent wrapping during width transition) */}
        <div 
          className={`w-72 h-full flex flex-col justify-between transition-opacity duration-200 shrink-0 ${
            isDirectoryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div>
            <div className="p-3 border-b border-oros-800 flex items-center justify-between">
              <div className="text-xs font-sans font-semibold text-oros-100 tracking-tight flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-oros-400" />
                Articles
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-200 border border-oros-750 text-xs font-medium flex items-center gap-1 transition-colors btn-interactive"
                >
                  <Plus className="w-3 h-3 text-oros-400" />
                  <span>New</span>
                </button>
                <button
                  onClick={() => setIsDirectoryOpen(false)}
                  title="Close Directory"
                  className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors btn-interactive"
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
                    ? 'bg-accent-muted text-accent border border-accent/40 font-semibold shadow-sm' 
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
                        ? 'bg-accent-muted text-accent border border-accent/40 font-semibold shadow-sm' 
                        : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: cat.color || 'var(--oros-accent)' }}
                    />
                    <span>{cat.name}</span>
                  </button>
                )
              })}
              <button
                onClick={() => setShowCategoryManager(true)}
                title="Manage Categories"
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 shrink-0 transition-colors ml-auto btn-interactive"
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
                        ? 'bg-accent-muted text-oros-100 font-medium border border-accent/40 shadow-sm'
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
        </div>
      </aside>

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
                      className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium flex items-center gap-1.5 transition-colors mr-1 btn-interactive"
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
                          className="px-2 py-0.5 rounded-[2px] text-[10px] uppercase font-mono tracking-wider border font-medium flex items-center gap-1.5 transition-all shadow-sm btn-interactive"
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
                            className="absolute top-full left-0 mt-1.5 w-56 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl py-1 z-50 animate-dropdown-in"
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
                      ? 'btn-accent' 
                      : 'bg-oros-900 hover:bg-oros-850 text-oros-200 border border-oros-750 hover:border-accent/40'
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
            <div className="flex flex-col xl:flex-row items-start gap-6">
              {/* Center Article Content */}
              <div className="flex-1 min-w-0 w-full">
                {isEditing ? (
                  <div className="space-y-3.5">
                    {/* Responsive Metadata Inputs: Flex-wrap/stack so boxes never squish */}
                    <div className="flex flex-col xl:flex-row gap-3">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-oros-400 mb-1 font-sans">
                          Article Summary
                        </label>
                        <input
                          type="text"
                          value={currentEntity.summary}
                          onChange={(e) => updateEntity(currentEntity.id, { summary: e.target.value })}
                          className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                          placeholder="A concise, high-level summary..."
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-oros-400 mb-1 font-sans flex items-center justify-between">
                          <span>Also known as / Aliases</span>
                          <span className="text-[10px] text-oros-500 font-mono">comma-separated</span>
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
                          placeholder="E.g. The Dawn King, Ronald the Steadfast"
                        />
                      </div>
                    </div>

                    {/* Sovereign Confidential / Secret Lore Switch (Replacing raw checkbox) */}
                    <div className="flex items-center justify-between p-2.5 rounded-[3px] bg-oros-900 border border-oros-800 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-[2px] transition-colors ${
                          currentEntity.isSecret 
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/80 shadow-sm' 
                            : 'bg-oros-850 text-oros-400 border border-oros-750'
                        }`}>
                          <EyeOff className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-oros-200 flex items-center gap-2">
                            <span>Confidential Lore Entry</span>
                            {currentEntity.isSecret && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase tracking-wider">
                                Secret
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-oros-400 font-sans">
                            Mask this entire lore entry when Director / GM Secrets are switched off
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(currentEntity.isSecret)}
                        onClick={() => updateEntity(currentEntity.id, { isSecret: !currentEntity.isSecret })}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          currentEntity.isSecret ? 'bg-rose-600' : 'bg-oros-800'
                        }`}
                        title="Toggle Confidential / Secret Status"
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            currentEntity.isSecret ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <WikiEditor
                      content={currentEntity.content}
                      onChange={(newHtml) => updateEntity(currentEntity.id, { content: newHtml })}
                    />
                  </div>
                ) : (
                  <div>
                    {/* Secret Notice when entity is confidential and reader mode is active */}
                    {currentEntity.isSecret && !gmMode && (
                      <div className="mb-4 p-2.5 rounded-[3px] bg-rose-950/30 border border-rose-800/50 flex items-center justify-between text-xs text-rose-300">
                        <div className="flex items-center gap-2">
                          <EyeOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Confidential lore entry. Toggle <strong>SECRETS ON</strong> in the top bar to view in Director Mode.</span>
                        </div>
                      </div>
                    )}

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

                    {/* Formatted HTML Wiki Article with Injected Anchor IDs & Interactive Discord-style Spoilers */}
                    <div 
                      className={`oros-wiki-prose ${gmMode ? 'oros-gm-revealed' : ''}`}
                      onClick={(e) => {
                        const target = (e.target as HTMLElement).closest('.oros-spoiler')
                        if (target) {
                          target.classList.toggle('is-revealed')
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: processedHtml }}
                    />
                  </div>
                )}

                {/* Bidirectional Backlinks / Mentioned In Engine */}
                <div className="mt-12 pt-6 border-t border-oros-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-accent" />
                      <h3 className="font-sans text-xs font-semibold text-oros-200 uppercase tracking-wider">
                        Mentioned In & Reciprocal Backlinks
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-oros-900 border border-oros-750 text-oros-300">
                        {backlinksData.totalCount} {backlinksData.totalCount === 1 ? 'reference' : 'references'}
                      </span>
                    </div>

                    {/* Filter Pills */}
                    {backlinksData.totalCount > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          onClick={() => setBacklinkFilter('all')}
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider transition-colors ${
                            backlinkFilter === 'all'
                              ? 'btn-accent font-semibold shadow-sm'
                              : 'bg-oros-900 hover:bg-oros-850 text-oros-400 hover:text-oros-200 border border-oros-800'
                          }`}
                        >
                          All ({backlinksData.totalCount})
                        </button>
                        {backlinksData.chapters.length > 0 && (
                          <button
                            onClick={() => setBacklinkFilter('chapters')}
                            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                              backlinkFilter === 'chapters'
                                ? 'btn-accent font-semibold shadow-sm'
                                : 'bg-oros-900 hover:bg-oros-850 text-oros-400 hover:text-oros-200 border border-oros-800'
                            }`}
                          >
                            <Feather className="w-3 h-3" />
                            Chapters ({backlinksData.chapters.length})
                          </button>
                        )}
                        {backlinksData.lore.length > 0 && (
                          <button
                            onClick={() => setBacklinkFilter('lore')}
                            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                              backlinkFilter === 'lore'
                                ? 'btn-accent font-semibold shadow-sm'
                                : 'bg-oros-900 hover:bg-oros-850 text-oros-400 hover:text-oros-200 border border-oros-800'
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            Articles ({backlinksData.lore.length})
                          </button>
                        )}
                        {backlinksData.maps.length > 0 && (
                          <button
                            onClick={() => setBacklinkFilter('maps')}
                            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                              backlinkFilter === 'maps'
                                ? 'btn-accent font-semibold shadow-sm'
                                : 'bg-oros-900 hover:bg-oros-850 text-oros-400 hover:text-oros-200 border border-oros-800'
                            }`}
                          >
                            <MapPin className="w-3 h-3" />
                            Maps ({backlinksData.maps.length})
                          </button>
                        )}
                        {backlinksData.timelines.length > 0 && (
                          <button
                            onClick={() => setBacklinkFilter('timelines')}
                            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                              backlinkFilter === 'timelines'
                                ? 'btn-accent font-semibold shadow-sm'
                                : 'bg-oros-900 hover:bg-oros-850 text-oros-400 hover:text-oros-200 border border-oros-800'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            Timelines ({backlinksData.timelines.length})
                          </button>
                        )}
                        {backlinksData.relations.length > 0 && (
                          <button
                            onClick={() => setBacklinkFilter('relations')}
                            className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                              backlinkFilter === 'relations'
                                ? 'btn-accent font-semibold shadow-sm'
                                : 'bg-oros-900 hover:bg-oros-850 text-oros-400 hover:text-oros-200 border border-oros-800'
                            }`}
                          >
                            <GitFork className="w-3 h-3" />
                            Relations ({backlinksData.relations.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {backlinksData.totalCount > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {/* Chapter Mentions */}
                      {(backlinkFilter === 'all' || backlinkFilter === 'chapters') &&
                        backlinksData.chapters.map((ch) => (
                          <div
                            key={`ch-${ch.id}`}
                            onClick={() => {
                              setSelectedChapterId(ch.id)
                              openTab({ title: ch.title, type: 'writer', targetId: ch.id })
                            }}
                            className="p-3 rounded-[3px] bg-oros-900/90 border border-oros-800 hover:border-accent/50 hover:bg-oros-850/80 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-oros-100 group-hover:text-accent transition-colors">
                                  <Feather className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="truncate">{ch.title}</span>
                                </div>
                                <span className="text-[10px] font-mono text-oros-400 px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-800 shrink-0">
                                  Ch. {ch.order + 1} · {ch.wordCount} words
                                </span>
                              </div>
                              {ch.snippet && (
                                <p className="text-xs text-oros-400 font-serif italic line-clamp-2 leading-relaxed bg-oros-950/40 p-2 rounded-[2px] border border-oros-850">
                                  "{ch.snippet}"
                                </p>
                              )}
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-oros-850 flex items-center justify-between text-[10px] font-mono text-oros-500">
                              <span>Manuscript Prose</span>
                              <span className="group-hover:text-accent flex items-center gap-1 transition-colors">
                                Open Chapter <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}

                      {/* Lore Entity Mentions */}
                      {(backlinkFilter === 'all' || backlinkFilter === 'lore') &&
                        backlinksData.lore.map((l) => (
                          <div
                            key={`lore-${l.id}`}
                            onClick={() => {
                              setSelectedEntityId(l.id)
                              openTab({ title: l.title, type: 'wiki', targetId: l.id })
                            }}
                            className="p-3 rounded-[3px] bg-oros-900/90 border border-oros-800 hover:border-accent/50 hover:bg-oros-850/80 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-oros-100 group-hover:text-accent transition-colors">
                                  <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  <span className="truncate">{l.title}</span>
                                </div>
                                <span className="text-[10px] font-mono capitalize text-oros-400 px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-800 shrink-0">
                                  {l.entityType}
                                </span>
                              </div>
                              {l.snippet && (
                                <p className="text-xs text-oros-400 font-sans line-clamp-2 leading-relaxed bg-oros-950/40 p-2 rounded-[2px] border border-oros-850">
                                  "{l.snippet}"
                                </p>
                              )}
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-oros-850 flex items-center justify-between text-[10px] font-mono text-oros-500">
                              <span className="capitalize">{l.reason === 'infobox' ? 'Infobox Link' : l.reason === 'mention' ? '@Mention Tag' : 'Cites in Content'}</span>
                              <span className="group-hover:text-accent flex items-center gap-1 transition-colors">
                                View Card <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}

                      {/* Map Pins / Regions */}
                      {(backlinkFilter === 'all' || backlinkFilter === 'maps') &&
                        backlinksData.maps.map((m) => (
                          <div
                            key={`map-${m.targetId}`}
                            onClick={() => {
                              setSelectedMapId(m.mapId)
                              openTab({ title: m.mapName, type: 'map', targetId: m.mapId })
                            }}
                            className="p-3 rounded-[3px] bg-oros-900/90 border border-oros-800 hover:border-accent/50 hover:bg-oros-850/80 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-oros-100 group-hover:text-accent transition-colors">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="truncate">{m.name}</span>
                                </div>
                                <span className="text-[10px] font-mono uppercase text-oros-400 px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-800 shrink-0">
                                  {m.targetType === 'pin' ? 'Map Pin' : 'Region'}
                                </span>
                              </div>
                              <p className="text-xs text-oros-400 font-sans">
                                Pinned on atlas map: <strong className="text-oros-200">{m.mapName}</strong>
                              </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-oros-850 flex items-center justify-between text-[10px] font-mono text-oros-500">
                              <span>Cartography Atlas</span>
                              <span className="group-hover:text-accent flex items-center gap-1 transition-colors">
                                Open Map <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}

                      {/* Timeline Events */}
                      {(backlinkFilter === 'all' || backlinkFilter === 'timelines') &&
                        backlinksData.timelines.map((ev) => (
                          <div
                            key={`tl-${ev.id}`}
                            onClick={() => {
                              openTab({ title: 'Timeline & Chronicles', type: 'timeline' })
                            }}
                            className="p-3 rounded-[3px] bg-oros-900/90 border border-oros-800 hover:border-accent/50 hover:bg-oros-850/80 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-oros-100 group-hover:text-accent transition-colors">
                                  <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  <span className="truncate">{ev.title}</span>
                                </div>
                                <span className="text-[10px] font-mono text-oros-400 px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-800 shrink-0">
                                  Year {ev.year} · {ev.era}
                                </span>
                              </div>
                              {ev.descriptionSnippet && (
                                <p className="text-xs text-oros-400 font-sans line-clamp-2 leading-relaxed bg-oros-950/40 p-2 rounded-[2px] border border-oros-850">
                                  {ev.descriptionSnippet}
                                </p>
                              )}
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-oros-850 flex items-center justify-between text-[10px] font-mono text-oros-500">
                              <span className="capitalize">{ev.importance} Event</span>
                              <span className="group-hover:text-accent flex items-center gap-1 transition-colors">
                                Open Timeline <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}

                      {/* Direct Relation Graph Edges */}
                      {(backlinkFilter === 'all' || backlinkFilter === 'relations') &&
                        backlinksData.relations.map((rel) => (
                          <div
                            key={`rel-${rel.id}`}
                            onClick={() => {
                              setSelectedEntityId(rel.relatedEntityId)
                              openTab({ title: rel.relatedEntityTitle, type: 'wiki', targetId: rel.relatedEntityId })
                            }}
                            className="p-3 rounded-[3px] bg-oros-900/90 border border-oros-800 hover:border-accent/50 hover:bg-oros-850/80 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-oros-100 group-hover:text-accent transition-colors">
                                  <GitFork className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span className="truncate">{rel.relatedEntityTitle}</span>
                                </div>
                                <span className="text-[10px] font-mono uppercase text-oros-400 px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-800 shrink-0">
                                  {rel.label || rel.relationType}
                                </span>
                              </div>
                              <p className="text-xs text-oros-400 font-sans">
                                {rel.isIncoming ? 'Incoming link from' : 'Connected directly to'}: <strong className="text-oros-200">{rel.relatedEntityTitle}</strong>
                              </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-oros-850 flex items-center justify-between text-[10px] font-mono text-oros-500">
                              <span>Relationship Graph</span>
                              <span className="group-hover:text-accent flex items-center gap-1 transition-colors">
                                View Linked Card <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-[3px] bg-oros-900/50 border border-oros-800 text-center">
                      <p className="text-xs text-oros-400 font-sans">
                        No other chapters, articles, map pins, or timeline events currently cite or link to this entry.
                      </p>
                      <p className="text-[11px] text-oros-500 font-mono mt-1">
                        Use <strong className="text-oros-300">@{currentEntity.title}</strong> while writing chapters or lore cards to create instant reciprocal links.
                      </p>
                    </div>
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
                className="btn-accent px-3.5 py-1.5 rounded-[3px] font-semibold text-xs shadow-sm transition-colors"
              >
                New Article
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating QuickPeek Card on Backlink Hover */}
      {hoveredEntity && (
        <div className="absolute bottom-12 left-80 z-50 pointer-events-none animate-dropdown-in">
          <QuickPeekCard entity={hoveredEntity} />
        </div>
      )}

      {/* Accessible Modals */}
      <NewEntityModal
        isOpen={showCreateModal}
        defaultType={filterType === 'all' ? 'character' : filterType}
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
