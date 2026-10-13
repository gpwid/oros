import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { WikiEditor } from '../wiki/WikiEditor'
import { 
  Feather, Plus, BookOpen, Search, Eye, Trash2, ChevronRight, Sparkles 
} from 'lucide-react'

export const StudioWriter: React.FC = () => {
  const { 
    manuscripts, entities, activeWorldId, selectedChapterId, setSelectedChapterId,
    createChapter, updateChapter, deleteChapter, setSelectedEntityId, setActiveTab 
  } = useWorldStore()

  const [codexSearch, setCodexSearch] = useState('')
  const [showCodexDrawer, setShowCodexDrawer] = useState(true)

  const worldChapters = activeWorldId ? manuscripts[activeWorldId] || [] : []
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  const currentChapter = worldChapters.find((c) => c.id === selectedChapterId) || worldChapters[0]

  const filteredEntities = worldEntities.filter((e) =>
    codexSearch === '' ||
    e.title.toLowerCase().includes(codexSearch.toLowerCase()) ||
    e.tags.some(t => t.toLowerCase().includes(codexSearch.toLowerCase()))
  )

  const handleCreateChapter = () => {
    const title = prompt('Enter Chapter Title:')
    if (!title?.trim()) return
    createChapter(title.trim())
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-oros-950">
      {/* Chapter Outline Navigation */}
      <aside className="w-64 bg-oros-950/80 border-r border-oros-800/40 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div className="p-3 border-b border-oros-800/40 flex items-center justify-between">
            <div className="text-xs font-serif font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <Feather className="w-3.5 h-3.5 text-gold-400" />
              Manuscript Chapters
            </div>
            <button
              onClick={handleCreateChapter}
              className="p-1 px-2 rounded-md bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Chapter</span>
            </button>
          </div>

          <div className="p-2 space-y-1 overflow-y-auto">
            {worldChapters.map((ch, idx) => {
              const isSelected = ch.id === currentChapter?.id
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-oros-800/80 text-gold-400 font-semibold shadow-inner border border-oros-700/50'
                      : 'text-slate-300 hover:bg-oros-900/60'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="truncate">{ch.title}</div>
                    <div className="text-[10px] text-oros-400 font-mono mt-0.5">
                      {ch.wordCount || 0} words
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Total stats */}
        <div className="p-3 border-t border-oros-800/40 text-[11px] text-oros-400 font-mono">
          {worldChapters.length} Chapters · {worldChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0)} Total Words
        </div>
      </aside>

      {/* Main Manuscript Writing Canvas */}
      <main className="flex-1 overflow-y-auto p-8 select-text">
        {currentChapter ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-oros-800/60">
              <input
                type="text"
                value={currentChapter.title}
                onChange={(e) => updateChapter(currentChapter.id, currentChapter.content, e.target.value)}
                className="font-serif text-2xl font-bold text-slate-100 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-gold-400 rounded px-1 w-full mr-4"
              />

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-oros-400">
                  {currentChapter.wordCount || 0} words
                </span>
                <button
                  onClick={() => setShowCodexDrawer(!showCodexDrawer)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    showCodexDrawer
                      ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
                      : 'bg-oros-900 text-oros-400 border-oros-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Codex</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${currentChapter.title}"?`)) {
                      deleteChapter(currentChapter.id)
                    }
                  }}
                  className="p-1.5 rounded-lg bg-oros-900/60 text-oros-400 hover:text-red-400 border border-oros-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <WikiEditor
              content={currentChapter.content}
              onChange={(newHtml) => updateChapter(currentChapter.id, newHtml)}
              placeholder="Draft your story, campaign log, or lore chronicle..."
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
        <aside className="w-80 bg-oros-950/90 border-l border-oros-800/40 flex flex-col justify-between shrink-0 select-none">
          <div className="p-3 border-b border-oros-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-gold-400" />
                Codex Reference
              </span>
              <button
                onClick={() => setShowCodexDrawer(false)}
                className="text-oros-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-oros-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={codexSearch}
                onChange={(e) => setCodexSearch(e.target.value)}
                placeholder="Search lore references..."
                className="w-full bg-oros-900 border border-oros-800 rounded-md pl-7 pr-2 py-1 text-[11px] text-slate-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
            {filteredEntities.map((ent) => (
              <div
                key={ent.id}
                className="p-2.5 rounded-lg bg-oros-900/60 border border-oros-800/60 text-xs space-y-1 hover:border-oros-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-slate-200">{ent.title}</span>
                  <span className="text-[10px] text-gold-400 uppercase font-mono">{ent.type}</span>
                </div>
                <p className="text-[11px] text-oros-400 line-clamp-2 leading-relaxed">
                  {ent.summary || 'No summary'}
                </p>
                <div className="pt-1 flex items-center justify-between border-t border-oros-800/40 text-[10px]">
                  <span className="text-oros-500">{ent.infobox.sections[0]?.fields[0]?.label}: {ent.infobox.sections[0]?.fields[0]?.value}</span>
                  <button
                    onClick={() => {
                      setSelectedEntityId(ent.id)
                      setActiveTab('wiki')
                    }}
                    className="text-gold-400 hover:underline"
                  >
                    View in Wiki
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}
