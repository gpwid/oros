import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { WikiEditor } from '../wiki/WikiEditor'
import { PromptModal, ConfirmModal } from '../common/PromptModal'
import { QuickPeekCard } from '../common/QuickPeekCard'
import { 
  Feather, Plus, BookOpen, Search, Eye, Trash2, ChevronRight, X,
  ChevronsLeft, ChevronsRight
} from 'lucide-react'
import { LoreEntity } from '@shared/types'

export const StudioWriter: React.FC = () => {
  const { 
    manuscripts, entities, activeWorldId, selectedChapterId, setSelectedChapterId,
    createChapter, updateChapter, deleteChapter, setSelectedEntityId, setActiveTab, openTab 
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [isChapterSidebarOpen, setIsChapterSidebarOpen] = useState(true)
  const [codexSearch, setCodexSearch] = useState('')
  const [showCodexDrawer, setShowCodexDrawer] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [hoveredEntity, setHoveredEntity] = useState<LoreEntity | null>(null)

  const worldChapters = activeWorldId ? manuscripts[activeWorldId] || [] : []
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  const currentChapter = worldChapters.find((c) => c.id === selectedChapterId) || worldChapters[0]

  const filteredEntities = worldEntities.filter((e) =>
    codexSearch === '' ||
    e.title.toLowerCase().includes(codexSearch.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(codexSearch.toLowerCase()))
  )

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

  return (
    <div className="flex-1 flex overflow-hidden bg-oros-950 relative">
      {/* Collapsed Chapter Sidebar Rail */}
      {!isChapterSidebarOpen ? (
        <div className="w-8 bg-oros-950 border-r border-oros-800 flex flex-col items-center py-2.5 shrink-0 select-none">
          <button
            onClick={() => setIsChapterSidebarOpen(true)}
            title="Open Chapters"
            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors mb-3"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsChapterSidebarOpen(true)}
            className="text-[10px] tracking-wider uppercase text-oros-500 hover:text-oros-300 font-medium select-none py-2"
            style={{ writingMode: 'vertical-rl' }}
          >
            Chapters
          </button>
        </div>
      ) : (
        /* Chapter Outline Navigation */
        <aside className="w-64 bg-oros-950 border-r border-oros-800 flex flex-col justify-between shrink-0 select-none">
          <div>
            <div className="p-3 border-b border-oros-800 flex items-center justify-between">
              <div className="text-xs font-sans font-semibold text-oros-100 uppercase tracking-wide flex items-center gap-2">
                <Feather className="w-3.5 h-3.5 text-oros-400" />
                Chapters
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-750 text-oros-200 hover:text-oros-100 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
                <button
                  onClick={() => setIsChapterSidebarOpen(false)}
                  title="Close Chapters Sidebar"
                  className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto">
              {worldChapters.map((ch) => {
                const isSelected = ch.id === currentChapter?.id
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`w-full text-left p-2 rounded-[3px] text-xs transition-colors flex items-center justify-between group ${
                      isSelected
                        ? 'bg-oros-800 text-oros-100 font-medium border border-oros-600 shadow-sm'
                        : 'text-oros-300 hover:bg-oros-900 border border-transparent'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{ch.title}</div>
                      <div className="text-[10px] text-oros-400 font-mono mt-0.5">
                        {ch.wordCount || 0} words
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'opacity-100 text-oros-300' : 'opacity-0 group-hover:opacity-60 text-oros-500'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Total stats */}
          <div className="p-3 border-t border-oros-800 text-[10px] text-oros-400 font-mono tracking-wider uppercase">
            {worldChapters.length} Chapters · {worldChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0)} Total Words
          </div>
        </aside>
      )}

      {/* Main Manuscript Writing Canvas */}
      <main className="flex-1 overflow-y-auto p-8 select-text">
        {currentChapter ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-oros-800">
              <div className="flex items-center gap-2 mr-4 flex-1">
                {!isChapterSidebarOpen && (
                  <button
                    onClick={() => setIsChapterSidebarOpen(true)}
                    className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
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
                  className="font-serif text-2xl font-bold text-oros-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-oros-500 rounded-[2px] px-1 w-full"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-oros-300 px-2 py-1 rounded-[2px] bg-oros-900 border border-oros-750">
                  {currentChapter.wordCount || 0} words
                </span>
                <button
                  onClick={() => setShowCodexDrawer(!showCodexDrawer)}
                  className={`px-2.5 py-1 rounded-[3px] text-xs font-medium flex items-center gap-1.5 border transition-colors ${
                    showCodexDrawer
                      ? 'bg-oros-800 text-oros-100 border-oros-600 shadow-sm'
                      : 'bg-oros-900 text-oros-300 hover:text-oros-100 border-oros-750 hover:bg-oros-850'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>References</span>
                </button>
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
              placeholder="Write here... (Type @ to link cards)"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-oros-500 text-xs">
            No chapter selected.
          </div>
        )}
      </main>

      {/* Right Drawer: Live World Codex Quick Reference */}
      {showCodexDrawer && (
        <aside className="w-80 bg-oros-950 border-l border-oros-800 flex flex-col justify-between shrink-0 select-none">
          <div className="p-3 border-b border-oros-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-oros-400" />
                References
              </span>
              <button
                onClick={() => setShowCodexDrawer(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-oros-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={codexSearch}
                onChange={(e) => setCodexSearch(e.target.value)}
                placeholder="Search references..."
                className="w-full bg-oros-900 border border-oros-750 rounded-[3px] pl-7 pr-2 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 font-sans"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
            {filteredEntities.map((ent) => (
              <div
                key={ent.id}
                onMouseEnter={() => setHoveredEntity(ent)}
                onMouseLeave={() => setHoveredEntity(null)}
                className="p-2.5 rounded-[3px] bg-oros-900 border border-oros-750 text-xs space-y-1 hover:border-oros-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-medium text-oros-100">{ent.title}</span>
                  <span className="text-[10px] text-oros-400 uppercase font-mono">{ent.type}</span>
                </div>
                <p className="text-[11px] text-oros-300 line-clamp-2 leading-relaxed">
                  {ent.summary || 'No summary'}
                </p>
                <div className="pt-1 flex items-center justify-between border-t border-oros-800 text-[10px]">
                  <span className="text-oros-400 truncate max-w-[140px]">
                    {ent.infobox.sections[0]?.fields[0]?.label}: {ent.infobox.sections[0]?.fields[0]?.value}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedEntityId(ent.id)
                      openTab({
                        title: ent.title,
                        type: 'wiki',
                        targetId: ent.id
                      })
                    }}
                    className="text-oros-300 hover:text-oros-100 font-medium transition-colors"
                  >
                    View in Wiki
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Hover QuickPeek Card */}
      {hoveredEntity && (
        <div className="absolute top-20 right-84 z-50 pointer-events-none">
          <QuickPeekCard entity={hoveredEntity} />
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
    </div>
  )
}
