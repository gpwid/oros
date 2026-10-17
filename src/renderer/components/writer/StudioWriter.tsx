import React, { useState, useEffect, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { WikiEditor } from '../wiki/WikiEditor'
import { PromptModal, ConfirmModal } from '../common/PromptModal'
import { 
  Feather, Plus, Trash2, ChevronRight,
  ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown, Maximize2, Minimize2, BookDown,
  BookMarked, Target, Pin, PinOff, Search, RotateCcw, X, ExternalLink, Check
} from 'lucide-react'
import { getCategoryMeta, getCategoryIconComponent } from '../../utils/categoryIcons'
import { LoreEntity } from '@shared/types'

export const StudioWriter: React.FC = () => {
  const { 
    manuscripts, entities, activeWorldId, selectedChapterId, setSelectedChapterId,
    openTab, setSelectedEntityId,
    createChapter, updateChapter, deleteChapter,
    moveChapter, compileManuscript
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [isChapterSidebarOpen, setIsChapterSidebarOpen] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)

  // Reference Drawer ("Codex Peek") State
  const [isReferenceDrawerOpen, setIsReferenceDrawerOpen] = useState(false)
  const [selectedReferenceEntityId, setSelectedReferenceEntityId] = useState<string | null>(null)
  const [isReferencePinned, setIsReferencePinned] = useState(false)
  const [referenceTab, setReferenceTab] = useState<'infobox' | 'lore'>('infobox')
  const [referenceSearch, setReferenceSearch] = useState('')
  const [isBrowsingReferences, setIsBrowsingReferences] = useState(false)

  // Session Sprint Goal State
  const [sprintGoal, setSprintGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('oros_writer_sprint_goal')
      return saved ? parseInt(saved, 10) : 500
    } catch {
      return 500
    }
  })
  const [showSprintModal, setShowSprintModal] = useState(false)
  const [customSprintInput, setCustomSprintInput] = useState('')
  const [sessionStartWords, setSessionStartWords] = useState<number | null>(null)

  const worldChapters = activeWorldId ? [...(manuscripts[activeWorldId] || [])].sort((a, b) => a.order - b.order) : []
  const currentChapter = worldChapters.find((c) => c.id === selectedChapterId) || worldChapters[0]
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  // Default reference selection if none selected
  useEffect(() => {
    if (!selectedReferenceEntityId && worldEntities.length > 0) {
      setSelectedReferenceEntityId(worldEntities[0].id)
    }
  }, [worldEntities, selectedReferenceEntityId])

  const currentReferenceEntity = worldEntities.find(e => e.id === selectedReferenceEntityId) || worldEntities[0]

  // Calculate total manuscript words and session progress
  const totalManuscriptWords = useMemo(() => {
    return worldChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0)
  }, [worldChapters])

  // Initialize session baseline on initial mount
  useEffect(() => {
    if (sessionStartWords === null && totalManuscriptWords >= 0) {
      setSessionStartWords(totalManuscriptWords)
    }
  }, [totalManuscriptWords, sessionStartWords])

  const effectiveStart = sessionStartWords ?? totalManuscriptWords
  const sessionWordsWritten = Math.max(0, totalManuscriptWords - effectiveStart)
  const sprintProgress = Math.min(100, Math.round((sessionWordsWritten / Math.max(1, sprintGoal)) * 100))

  // Global Hotkeys: Esc for Zen Mode, Alt+R for Reference Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZenMode) setIsZenMode(false)
        if (showSprintModal) setShowSprintModal(false)
      }
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        setIsReferenceDrawerOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isZenMode, showSprintModal])

  const handleCreateSubmit = (title: string) => {
    createChapter(title)
    setShowCreateModal(false)
    addToast(`Created chapter: ${title}`, 'success')
  }

  const handleDeleteConfirm = () => {
    if (!currentChapter) return
    const title = currentChapter.title
    deleteChapter(currentChapter.id)
    setShowDeleteModal(false)
    addToast(`Deleted chapter: ${title}`, 'info')
  }

  const handleSetSprintGoal = (goal: number) => {
    setSprintGoal(goal)
    try {
      localStorage.setItem('oros_writer_sprint_goal', goal.toString())
    } catch {}
    setShowSprintModal(false)
    addToast(`Sprint goal set to ${goal} words`, 'info')
  }

  const handleResetSessionSprint = () => {
    setSessionStartWords(totalManuscriptWords)
    setShowSprintModal(false)
    addToast('Session word count reset to 0', 'info')
  }

  // Filter reference cards
  const filteredReferenceEntities = worldEntities.filter(e => {
    if (!referenceSearch) return true
    const q = referenceSearch.toLowerCase()
    return e.title.toLowerCase().includes(q) || 
      e.type.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
  })

  return (
    <div className="flex-1 flex overflow-hidden bg-oros-950 relative">
      {/* Animated Chapter Sidebar Container */}
      <aside 
        className={`h-full bg-oros-950 border-r border-oros-800 shrink-0 select-none transition-all duration-250 ease-snappy overflow-hidden relative ${
          isChapterSidebarOpen ? 'w-64' : 'w-8'
        }`}
      >
        {/* Collapsed Chapter Rail */}
        <div 
          className={`w-8 h-full bg-oros-950 flex flex-col items-center py-2.5 absolute inset-y-0 left-0 transition-opacity duration-200 z-10 ${
            !isChapterSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={() => setIsChapterSidebarOpen(true)}
            title="Open Chapters"
            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors mb-3 btn-interactive"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsChapterSidebarOpen(true)}
            className="text-[10px] tracking-wider uppercase text-oros-500 hover:text-oros-300 font-medium select-none py-2 cursor-pointer"
            style={{ writingMode: 'vertical-rl' }}
          >
            Chapters
          </button>
        </div>

        {/* Expanded Chapter Outline */}
        <div 
          className={`w-64 h-full flex flex-col justify-between transition-opacity duration-200 shrink-0 ${
            isChapterSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div>
            <div className="p-3 border-b border-oros-800 flex items-center justify-between">
              <div className="text-xs font-sans font-semibold text-oros-100 uppercase tracking-wide flex items-center gap-2">
                <Feather className="w-3.5 h-3.5 text-oros-400" />
                Chapters
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-750 text-oros-200 hover:text-oros-100 text-xs font-medium flex items-center gap-1 transition-colors btn-interactive"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
                <button
                  onClick={() => setIsChapterSidebarOpen(false)}
                  title="Close Chapters Sidebar"
                  className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors btn-interactive"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
              {worldChapters.map((ch, idx) => {
                const isSelected = ch.id === currentChapter?.id
                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`w-full text-left p-2 rounded-[3px] text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-accent-muted text-oros-100 font-medium border border-accent/40 shadow-sm'
                        : 'text-oros-300 hover:bg-oros-900 border border-transparent'
                    }`}
                  >
                    <div className="truncate pr-2 flex-1">
                      <div className="truncate">{ch.title}</div>
                      <div className="text-[10px] text-oros-400 font-mono mt-0.5">
                        {ch.wordCount || 0} words
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            moveChapter(ch.id, 'up')
                          }}
                          className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 disabled:opacity-20 disabled:hover:text-oros-400 transition-colors"
                          title="Move Chapter Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === worldChapters.length - 1}
                          onClick={(e) => {
                            e.stopPropagation()
                            moveChapter(ch.id, 'down')
                          }}
                          className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 disabled:opacity-20 disabled:hover:text-oros-400 transition-colors"
                          title="Move Chapter Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'opacity-100 text-accent' : 'opacity-0 group-hover:opacity-60 text-oros-500'}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total stats */}
          <div className="p-3 border-t border-oros-800 text-[10px] text-oros-400 font-mono tracking-wider uppercase">
            {worldChapters.length} Chapters · {totalManuscriptWords} Total Words
          </div>
        </div>
      </aside>

      {/* Main Manuscript Writing Canvas */}
      <main 
        className="flex-1 overflow-y-auto p-8 select-text"
        onClick={(e) => {
          // Click-to-peek on any mention in the prose
          const mention = (e.target as HTMLElement).closest('.oros-mention')
          if (mention) {
            const entityId = mention.getAttribute('data-id')
            if (entityId) {
              setSelectedReferenceEntityId(entityId)
              setIsReferenceDrawerOpen(true)
              setIsBrowsingReferences(false)
            }
          }
        }}
      >
        {currentChapter ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-oros-800">
              <div className="flex items-center gap-2 mr-2 flex-1 min-w-[200px]">
                {!isChapterSidebarOpen && (
                  <button
                    onClick={() => setIsChapterSidebarOpen(true)}
                    className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 btn-interactive"
                    title="Open Chapters Sidebar"
                  >
                    <Feather className="w-3.5 h-3.5 text-oros-400" />
                    <span>Chapters</span>
                  </button>
                )}
                <input
                  type="text"
                  value={currentChapter.title}
                  onChange={(e) => updateChapter(currentChapter.id, currentChapter.content, e.target.value)}
                  className="font-serif text-2xl font-bold text-oros-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded-[2px] px-1 w-full"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Chapter Word Count Badge */}
                <span className="text-xs font-mono text-oros-300 px-2 py-1 rounded-[2px] bg-oros-900 border border-oros-750">
                  {currentChapter.wordCount || 0} words
                </span>

                {/* Session Sprint Progress Pill */}
                <button
                  type="button"
                  onClick={() => setShowSprintModal(true)}
                  className="px-2.5 py-1 rounded-[3px] text-xs font-mono flex items-center gap-1.5 border bg-oros-900 border-oros-750 hover:bg-oros-850 hover:border-oros-700 transition-colors group cursor-pointer relative overflow-hidden"
                  title="Writing Session Sprint Goal. Click to configure."
                >
                  <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-oros-200">
                    +{sessionWordsWritten} / {sprintGoal}w
                  </span>
                  <span className="text-[10px] text-oros-400">
                    ({sprintProgress}%)
                  </span>
                  {/* Subtle Sprint Progress Bar Underlay */}
                  <div 
                    className="absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-300"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </button>

                {/* Reference Drawer Toggle */}
                <button
                  onClick={() => {
                    setIsReferenceDrawerOpen(prev => !prev)
                    setIsBrowsingReferences(false)
                  }}
                  className={`px-2.5 py-1 rounded-[3px] text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                    isReferenceDrawerOpen
                      ? 'btn-accent shadow-sm'
                      : 'bg-oros-900 text-oros-300 hover:text-oros-100 border-oros-750 hover:bg-oros-850'
                  }`}
                  title="Toggle Lore Reference Drawer (Alt+R)"
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  <span>Reference</span>
                </button>

                {/* Compile Book */}
                <button
                  onClick={async () => {
                    const success = await compileManuscript()
                    if (success) {
                      addToast('Manuscript exported as Markdown (.md)', 'success')
                    } else {
                      addToast('Failed to compile manuscript', 'error')
                    }
                  }}
                  className="px-2.5 py-1 rounded-[3px] text-xs font-medium flex items-center gap-1.5 border bg-oros-900 text-oros-300 hover:text-oros-100 border-oros-750 hover:bg-oros-850 transition-colors"
                  title="Compile & Export Complete Manuscript to Markdown (.md)"
                >
                  <BookDown className="w-3.5 h-3.5 text-oros-400" />
                  <span className="hidden sm:inline">Compile Book</span>
                </button>

                {/* Zen Mode */}
                <button
                  onClick={() => setIsZenMode(true)}
                  className="p-1.5 rounded-[3px] bg-oros-900 text-oros-400 hover:text-oros-100 border border-oros-750 hover:bg-oros-850 transition-colors"
                  title="Distraction-Free Zen Mode (Esc to exit)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Chapter */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 rounded-[3px] bg-oros-900 text-oros-400 hover:text-rose-400 border border-oros-750 hover:bg-oros-850 transition-colors"
                  title="Delete chapter"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <WikiEditor
              content={currentChapter.content}
              onChange={(newHtml) => updateChapter(currentChapter.id, newHtml)}
              placeholder="Write chapter prose here... (Type @ to link cards)"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-oros-500 text-xs">
            No chapter selected.
          </div>
        )}
      </main>

      {/* Right-Side Codex Reference Drawer */}
      <aside 
        className={`h-full bg-oros-950 border-l border-oros-800 shrink-0 select-none transition-all duration-250 ease-snappy overflow-hidden flex flex-col z-20 ${
          isReferenceDrawerOpen ? 'w-80 lg:w-96' : 'w-0 border-l-0 pointer-events-none'
        }`}
      >
        <div className="w-80 lg:w-96 h-full flex flex-col">
          {/* Reference Drawer Header */}
          <div className="p-3 border-b border-oros-800 flex items-center justify-between bg-oros-950 shrink-0">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-accent" />
              <span className="text-xs font-sans font-semibold text-oros-100 uppercase tracking-wide">
                Codex Reference
              </span>
            </div>

            <div className="flex items-center gap-1">
              {currentReferenceEntity && (
                <>
                  <button
                    onClick={() => setIsReferencePinned(!isReferencePinned)}
                    className={`p-1 rounded-[3px] transition-colors ${
                      isReferencePinned 
                        ? 'text-accent bg-accent-muted border border-accent/40' 
                        : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
                    }`}
                    title={isReferencePinned ? "Pinned: retains this card when clicking others" : "Pin this card to reference"}
                  >
                    {isReferencePinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEntityId(currentReferenceEntity.id)
                      openTab({ title: currentReferenceEntity.title, type: 'wiki', targetId: currentReferenceEntity.id })
                    }}
                    className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors"
                    title="Open in Full Wiki Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                onClick={() => setIsReferenceDrawerOpen(false)}
                className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors"
                title="Close Reference Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Entity Selector / Switcher */}
          <div className="p-2 border-b border-oros-800 bg-oros-900/60 shrink-0">
            {isBrowsingReferences ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={referenceSearch}
                    onChange={(e) => setReferenceSearch(e.target.value)}
                    placeholder="Search world cards..."
                    className="w-full pl-8 pr-2 py-1 text-xs bg-oros-950 border border-oros-750 rounded-[3px] text-oros-200 focus:outline-none focus:border-accent"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-oros-400 font-mono">
                  <span>{filteredReferenceEntities.length} cards found</span>
                  <button
                    onClick={() => setIsBrowsingReferences(false)}
                    className="text-accent hover:underline cursor-pointer"
                  >
                    Back to card
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {currentReferenceEntity ? (
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-800 text-oros-400 shrink-0">
                      {currentReferenceEntity.type}
                    </span>
                    <span className="text-xs font-semibold text-oros-100 truncate">
                      {currentReferenceEntity.title}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-oros-400 italic">No card selected</span>
                )}
                <button
                  onClick={() => setIsBrowsingReferences(true)}
                  className="px-2 py-0.5 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-300 hover:text-oros-100 text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                >
                  Switch
                </button>
              </div>
            )}
          </div>

          {/* Reference Drawer Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {isBrowsingReferences ? (
              /* Browsing / Card Picker Mode */
              <div className="space-y-1">
                {filteredReferenceEntities.map((ent) => {
                  const meta = getCategoryMeta(ent.type)
                  const Icon = getCategoryIconComponent(meta.icon)
                  const isSelected = ent.id === currentReferenceEntity?.id
                  return (
                    <div
                      key={ent.id}
                      onClick={() => {
                        setSelectedReferenceEntityId(ent.id)
                        setIsBrowsingReferences(false)
                      }}
                      className={`w-full p-2 rounded-[3px] border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-accent-muted border-accent/40 text-oros-100'
                          : 'bg-oros-900 border-oros-800 hover:bg-oros-850 hover:border-oros-700 text-oros-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <Icon className="w-3.5 h-3.5 text-oros-400 shrink-0" />
                        <span className="text-xs font-medium truncate">{ent.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-oros-500 uppercase shrink-0">
                        {ent.type}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : currentReferenceEntity ? (
              /* Card View Mode */
              <div>
                {/* Reference Card Header & Tabs */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-oros-100 font-serif">
                      {currentReferenceEntity.title}
                    </h4>
                    {currentReferenceEntity.infobox?.subtitle && (
                      <span className="text-[10px] font-mono text-oros-400 truncate max-w-[140px]">
                        {currentReferenceEntity.infobox.subtitle}
                      </span>
                    )}
                  </div>

                  {/* Tab Selector: Infobox Specs vs Lore Text */}
                  <div className="flex items-center gap-1 border-b border-oros-800 pb-1.5">
                    <button
                      onClick={() => setReferenceTab('infobox')}
                      className={`px-2.5 py-1 rounded-[2px] text-xs font-mono uppercase tracking-wider transition-colors ${
                        referenceTab === 'infobox'
                          ? 'btn-accent font-semibold shadow-sm'
                          : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
                      }`}
                    >
                      Infobox Specs
                    </button>
                    <button
                      onClick={() => setReferenceTab('lore')}
                      className={`px-2.5 py-1 rounded-[2px] text-xs font-mono uppercase tracking-wider transition-colors ${
                        referenceTab === 'lore'
                          ? 'btn-accent font-semibold shadow-sm'
                          : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
                      }`}
                    >
                      Lore Text
                    </button>
                  </div>
                </div>

                {/* Tab 1: Infobox Specs */}
                {referenceTab === 'infobox' && (
                  <div className="space-y-3 select-text">
                    {/* Tags */}
                    {currentReferenceEntity.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {currentReferenceEntity.tags.map((t, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-oros-900 border border-oros-800 text-oros-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Infobox Sections */}
                    {currentReferenceEntity.infobox?.sections?.map((sec, sIdx) => (
                      <div key={sIdx} className="border border-oros-800 rounded-[3px] bg-oros-900/60 overflow-hidden">
                        <div className="px-2.5 py-1 bg-oros-850/80 border-b border-oros-800 text-[10px] font-mono text-oros-300 uppercase tracking-wider font-semibold">
                          {sec.title}
                        </div>
                        <div className="p-2 space-y-1.5">
                          {sec.fields?.map((f, fIdx) => (
                            <div key={fIdx} className="flex items-start justify-between text-xs gap-2">
                              <span className="text-oros-400 font-mono text-[11px] shrink-0">
                                {f.label}:
                              </span>
                              <span className="text-oros-200 font-sans text-right break-words font-medium">
                                {f.value || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 2: Lore Prose Text */}
                {referenceTab === 'lore' && (
                  <div className="select-text">
                    <div 
                      className="oros-wiki-prose text-xs text-oros-300 leading-relaxed max-h-[calc(100vh-220px)] overflow-y-auto pr-1"
                      dangerouslySetInnerHTML={{ __html: currentReferenceEntity.content || '<p class="text-oros-500 italic">No lore notes written yet.</p>' }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-oros-500 text-xs italic">
                Select a lore card above to consult while writing.
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Writing Session Sprint Target Goal Modal */}
      {showSprintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 rounded-[4px] p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-oros-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="font-sans text-sm font-semibold text-oros-100">
                  Writing Sprint Target
                </h3>
              </div>
              <button
                onClick={() => setShowSprintModal(false)}
                className="text-oros-400 hover:text-oros-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-oros-950 border border-oros-800 rounded-[3px] text-center">
                <div className="text-2xl font-bold font-mono text-oros-100">
                  +{sessionWordsWritten} words
                </div>
                <div className="text-[11px] text-oros-400 font-mono mt-0.5">
                  Written this session · Goal: {sprintGoal}w ({sprintProgress}%)
                </div>
                <div className="w-full bg-oros-900 h-1.5 rounded-full overflow-hidden mt-2 border border-oros-800">
                  <div 
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${sprintProgress}%` }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider block mb-1.5">
                  Set Target Word Goal
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[250, 500, 1000, 2000].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleSetSprintGoal(count)}
                      className={`py-1.5 rounded-[2px] text-xs font-mono border transition-colors ${
                        sprintGoal === count
                          ? 'btn-accent font-semibold shadow-sm'
                          : 'bg-oros-950 hover:bg-oros-850 text-oros-300 border-oros-750'
                      }`}
                    >
                      {count}w
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={customSprintInput}
                    onChange={(e) => setCustomSprintInput(e.target.value)}
                    placeholder="Custom goal (e.g. 750)..."
                    className="flex-1 px-2 py-1 text-xs bg-oros-950 border border-oros-750 rounded-[2px] text-oros-200 focus:outline-none focus:border-accent font-mono"
                  />
                  <button
                    onClick={() => {
                      const num = parseInt(customSprintInput, 10)
                      if (num && num > 0) {
                        handleSetSprintGoal(num)
                      }
                    }}
                    className="px-3 py-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-700 text-xs font-medium text-oros-200 transition-colors"
                  >
                    Set
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-oros-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetSessionSprint}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  title="Reset counter for a new sprint"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Session (+0)</span>
                </button>

                <button
                  onClick={() => setShowSprintModal(false)}
                  className="px-3 py-1 rounded-[2px] btn-accent text-xs font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Modals */}
      <PromptModal
        isOpen={showCreateModal}
        title="New Chapter"
        description="Enter chapter title."
        placeholder="Chapter title..."
        confirmLabel="Create Chapter"
        onConfirm={handleCreateSubmit}
        onCancel={() => setShowCreateModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Chapter"
        message={`Are you sure you want to permanently delete "${currentChapter?.title}"?`}
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Distraction-Free Zen Mode Overlay */}
      {isZenMode && currentChapter && (
        <div className="fixed inset-0 z-50 bg-oros-950 flex flex-col p-8 overflow-y-auto select-text animate-fade-in">
          <div className="flex items-center justify-between max-w-3xl mx-auto w-full mb-6 pb-2 border-b border-oros-850">
            <span className="text-xs font-mono text-oros-400 uppercase tracking-wider">
              Zen Mode · {currentChapter.wordCount || 0} words · Session: +{sessionWordsWritten}w
            </span>
            <button
              onClick={() => setIsZenMode(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium transition-colors"
              title="Exit Zen Mode (Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-oros-400" />
              <span>Exit Zen (Esc)</span>
            </button>
          </div>
          <div className="max-w-2xl mx-auto w-full pb-32">
            <input
              type="text"
              value={currentChapter.title}
              onChange={(e) => updateChapter(currentChapter.id, currentChapter.content, e.target.value)}
              className="font-serif text-3xl font-bold text-oros-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-oros-500 rounded-[2px] px-1 w-full mb-8 text-center"
            />
            <WikiEditor
              content={currentChapter.content}
              onChange={(newHtml) => updateChapter(currentChapter.id, newHtml)}
              placeholder="Write in uninterrupted focus... (Type @ to link cards)"
            />
          </div>
        </div>
      )}
    </div>
  )
}
