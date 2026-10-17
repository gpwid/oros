import React, { useState, useEffect } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { WikiEditor } from '../wiki/WikiEditor'
import { PromptModal, ConfirmModal } from '../common/PromptModal'
import { 
  Feather, Plus, Trash2, ChevronRight,
  ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown, Maximize2, Minimize2, BookDown
} from 'lucide-react'

export const StudioWriter: React.FC = () => {
  const { 
    manuscripts, activeWorldId, selectedChapterId, setSelectedChapterId,
    createChapter, updateChapter, deleteChapter,
    moveChapter, compileManuscript
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [isChapterSidebarOpen, setIsChapterSidebarOpen] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isZenMode, setIsZenMode] = useState(false)

  // Listen for Escape key to exit Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isZenMode])

  const worldChapters = activeWorldId ? [...(manuscripts[activeWorldId] || [])].sort((a, b) => a.order - b.order) : []

  const currentChapter = worldChapters.find((c) => c.id === selectedChapterId) || worldChapters[0]

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
              {worldChapters.map((ch, idx) => {
                const isSelected = ch.id === currentChapter?.id
                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`w-full text-left p-2 rounded-[3px] text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-oros-800 text-oros-100 font-medium border border-oros-600 shadow-sm'
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
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'opacity-100 text-oros-300' : 'opacity-0 group-hover:opacity-60 text-oros-500'}`} />
                    </div>
                  </div>
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
                <button
                  onClick={() => setIsZenMode(true)}
                  className="p-1.5 rounded-[3px] bg-oros-900 text-oros-400 hover:text-oros-100 border border-oros-750 hover:bg-oros-850 transition-colors"
                  title="Distraction-Free Zen Mode (Esc to exit)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-oros-950 flex flex-col p-8 overflow-y-auto select-text animate-in fade-in duration-150">
          <div className="flex items-center justify-between max-w-3xl mx-auto w-full mb-6 pb-2 border-b border-oros-850">
            <span className="text-xs font-mono text-oros-400 uppercase tracking-wider">
              Zen Mode · {currentChapter.wordCount || 0} words
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
