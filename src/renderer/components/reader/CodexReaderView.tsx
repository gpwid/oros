import React, { useState, useMemo, useEffect } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { 
  BookOpen, ChevronLeft, ChevronRight, X, Printer, ArrowLeft,
  Settings2, Eye, Compass, Feather, Layers, Search, Bookmark, Check
} from 'lucide-react'
import { LoreEntity, ManuscriptChapter } from '@shared/types'
import { enrichProseHtml, resolveEntityFromLink } from '../../utils/proseProcessor'

export const CodexReaderView: React.FC = () => {
  const { 
    worlds, activeWorldId, entities, manuscripts, conlangs,
    closeReaderMode, isReaderMode, readerTarget
  } = useWorldStore()

  const world = worlds.find(w => w.id === activeWorldId) || worlds[0]
  const worldEntities = useMemo(() => (activeWorldId ? entities[activeWorldId] : []) || [], [activeWorldId, entities])
  const worldConlangs = useMemo(() => (activeWorldId ? conlangs[activeWorldId] : []) || [], [activeWorldId, conlangs])
  const worldChapters = useMemo(() => {
    return (activeWorldId ? [...(manuscripts[activeWorldId] || [])] : []).sort((a, b) => a.order - b.order)
  }, [activeWorldId, manuscripts])

  // Reading selection
  const [currentSection, setCurrentSection] = useState<{
    type: 'chapter' | 'entity' | 'card';
    id: string;
  }>(() => {
    if (readerTarget) return readerTarget
    if (worldChapters.length > 0) return { type: 'chapter', id: worldChapters[0].id }
    if (worldEntities.length > 0) return { type: 'entity', id: worldEntities[0].id }
    return { type: 'chapter', id: '' }
  })

  // Synchronize if readerTarget changes
  useEffect(() => {
    if (readerTarget) {
      setCurrentSection(readerTarget)
    }
  }, [readerTarget])

  // Reader Settings
  const [fontSize, setFontSize] = useState<number>(18)
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'garamond'>('serif')
  const [columnWidth, setColumnWidth] = useState<'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl'>('max-w-3xl')
  const [isTOCSidebarOpen, setIsTOCSidebarOpen] = useState(true)
  const [tocSearch, setTocSearch] = useState('')

  // Current Content Item
  const activeChapter = currentSection.type === 'chapter' ? worldChapters.find(c => c.id === currentSection.id) : null
  const isEntity = currentSection.type === 'entity' || currentSection.type === 'card'
  const activeEntity = isEntity ? worldEntities.find(e => e.id === currentSection.id) : null

  const enrichedChapterHtml = useMemo(() => {
    if (!activeChapter?.content) return ''
    return enrichProseHtml(activeChapter.content, worldEntities, worldConlangs).processedHtml
  }, [activeChapter?.content, worldEntities, worldConlangs])

  const enrichedEntityHtml = useMemo(() => {
    if (!activeEntity?.content) return ''
    return enrichProseHtml(activeEntity.content, worldEntities, worldConlangs).processedHtml
  }, [activeEntity?.content, worldEntities, worldConlangs])

  const handleReaderProseClick = (e: React.MouseEvent) => {
    const spoiler = (e.target as HTMLElement).closest('.oros-spoiler')
    if (spoiler) {
      spoiler.classList.toggle('is-revealed')
      return
    }

    const linkEl = (e.target as HTMLElement).closest('.oros-wiki-link, .oros-mention') as HTMLElement | null
    if (linkEl) {
      e.preventDefault()
      e.stopPropagation()
      const dataId = linkEl.getAttribute('data-id')
      const dataTitle =
        linkEl.getAttribute('data-title') ||
        linkEl.getAttribute('data-label') ||
        linkEl.textContent?.replace(/^\[\[/, '').replace(/\]\]$/, '').trim()
      const targetEntity = resolveEntityFromLink(worldEntities, dataId, dataTitle)
      if (targetEntity) {
        setCurrentSection({ type: 'entity', id: targetEntity.id })
      }
    }
  }

  // Filtered TOC Items
  const filteredChapters = useMemo(() => {
    if (!tocSearch.trim()) return worldChapters
    return worldChapters.filter(c => c.title.toLowerCase().includes(tocSearch.toLowerCase()))
  }, [worldChapters, tocSearch])

  const filteredEntities = useMemo(() => {
    if (!tocSearch.trim()) return worldEntities
    return worldEntities.filter(e => 
      e.title.toLowerCase().includes(tocSearch.toLowerCase()) ||
      e.type.toLowerCase().includes(tocSearch.toLowerCase())
    )
  }, [worldEntities, tocSearch])

  // Previous & Next navigation
  const navigation = useMemo(() => {
    if (currentSection.type === 'chapter') {
      const idx = worldChapters.findIndex(c => c.id === currentSection.id)
      return {
        prev: idx > 0 ? worldChapters[idx - 1] : null,
        next: idx < worldChapters.length - 1 ? worldChapters[idx + 1] : null
      }
    } else {
      const idx = worldEntities.findIndex(e => e.id === currentSection.id)
      return {
        prev: idx > 0 ? worldEntities[idx - 1] : null,
        next: idx < worldEntities.length - 1 ? worldEntities[idx + 1] : null
      }
    }
  }, [currentSection, worldChapters, worldEntities])

  const typographyStyle = useMemo(() => {
    const fonts = {
      serif: "'Literata', Georgia, serif",
      garamond: "'Cormorant Garamond', Garamond, serif",
      sans: "'Plus Jakarta Sans', system-ui, sans-serif"
    }
    return {
      fontFamily: fonts[fontFamily],
      fontSize: `${fontSize}px`,
      lineHeight: 1.8
    }
  }, [fontSize, fontFamily])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-oros-950 text-oros-100 font-serif select-text">
      {/* Top Header Bar */}
      <header className="no-print shrink-0 h-14 bg-oros-900/90 backdrop-blur-md border-b border-oros-800 px-6 pr-[152px] flex items-center justify-between text-xs font-sans">
        <div className="flex items-center gap-3">
          <button
            onClick={closeReaderMode}
            className="px-3 py-1.5 rounded-[3px] font-sans font-semibold bg-oros-900 hover:bg-oros-850 text-oros-200 hover:text-white border border-oros-750 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Exit Codex Reader (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-oros-400" />
            <span>Exit Codex</span>
          </button>

          <button
            onClick={() => setIsTOCSidebarOpen(!isTOCSidebarOpen)}
            className={`px-2.5 py-1.5 rounded-[3px] border text-xs flex items-center gap-1.5 transition-colors ${
              isTOCSidebarOpen 
                ? 'bg-accent-muted text-accent border-accent/40' 
                : 'bg-oros-900 border-oros-800 text-oros-400 hover:text-oros-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Contents</span>
          </button>

          <span className="font-serif font-bold text-sm text-oros-200 tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <span>{world?.name || 'Codex Compendium'}</span>
          </span>
        </div>

        {/* Reader Controls */}
        <div className="flex items-center gap-3">
          {/* Font Family */}
          <div className="flex items-center rounded border border-oros-800 bg-oros-950 p-0.5 text-xs">
            <button
              onClick={() => setFontFamily('garamond')}
              className={`px-2 py-0.5 rounded-[2px] font-serif ${fontFamily === 'garamond' ? 'bg-oros-800 text-oros-100 font-bold' : 'text-oros-400'}`}
            >
              Garamond
            </button>
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2 py-0.5 rounded-[2px] font-serif ${fontFamily === 'serif' ? 'bg-oros-800 text-oros-100 font-bold' : 'text-oros-400'}`}
            >
              Literata
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2 py-0.5 rounded-[2px] font-sans ${fontFamily === 'sans' ? 'bg-oros-800 text-oros-100 font-bold' : 'text-oros-400'}`}
            >
              Sans
            </button>
          </div>

          {/* Font Size */}
          <div className="flex items-center rounded border border-oros-800 bg-oros-950 p-0.5 font-mono text-xs">
            <button
              onClick={() => setFontSize(prev => Math.max(14, prev - 1))}
              className="px-2 py-0.5 text-oros-400 hover:text-oros-200"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="px-1.5 text-oros-300 text-[11px]">{fontSize}px</span>
            <button
              onClick={() => setFontSize(prev => Math.min(26, prev + 1))}
              className="px-2 py-0.5 text-oros-400 hover:text-oros-200"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="px-2.5 py-1.5 rounded-[3px] border border-oros-800 bg-oros-900 text-oros-300 hover:text-oros-100 flex items-center gap-1.5 transition-colors"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </header>

      {/* Main Reader View Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Table of Contents Drawer */}
        {isTOCSidebarOpen && (
          <aside className="no-print w-72 shrink-0 bg-oros-900 border-r border-oros-800 flex flex-col font-sans text-xs">
            {/* Search */}
            <div className="p-3 border-b border-oros-800">
              <div className="relative">
                <Search className="w-3 h-3 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tocSearch}
                  onChange={(e) => setTocSearch(e.target.value)}
                  placeholder="Filter chapters & lore..."
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] pl-7 pr-2 py-1 text-xs text-oros-200 placeholder-oros-600 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
              {/* Chapters */}
              {filteredChapters.length > 0 && (
                <div>
                  <span className="block font-mono text-[10px] uppercase font-bold tracking-wider text-oros-500 px-2 mb-1.5 flex items-center gap-1.5">
                    <Feather className="w-3 h-3" />
                    <span>Manuscript Chronicles</span>
                  </span>
                  <div className="space-y-0.5">
                    {filteredChapters.map(ch => {
                      const isSelected = currentSection.type === 'chapter' && currentSection.id === ch.id
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setCurrentSection({ type: 'chapter', id: ch.id })}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[3px] truncate transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-accent-muted text-accent font-semibold border border-accent/40 shadow-sm'
                              : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900/60'
                          }`}
                        >
                          <span className="truncate">{ch.title}</span>
                          <span className="text-[10px] font-mono text-oros-600 shrink-0">
                            {ch.wordCount || 0}w
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Lore Entities */}
              {filteredEntities.length > 0 && (
                <div>
                  <span className="block font-mono text-[10px] uppercase font-bold tracking-wider text-oros-500 px-2 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />
                    <span>Lore Encyclopedia</span>
                  </span>
                  <div className="space-y-0.5">
                    {filteredEntities.map(ent => {
                      const isSelected = (currentSection.type === 'entity' || currentSection.type === 'card') && currentSection.id === ent.id
                      return (
                        <button
                          key={ent.id}
                          onClick={() => setCurrentSection({ type: 'entity', id: ent.id })}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[3px] truncate transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-accent-muted text-accent font-semibold border border-accent/40 shadow-sm'
                              : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900/60'
                          }`}
                        >
                          <span className="truncate">{ent.title}</span>
                          <span className="text-[9px] font-mono uppercase text-oros-600 bg-oros-950 px-1 py-0.2 rounded border border-oros-850">
                            {ent.type}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Central Reading Canvas */}
        <main className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center scrollbar-thin">
          <article className={`w-full ${columnWidth} mx-auto transition-all`}>
            {/* Hero Artwork if entity or world banner */}
            {(activeEntity?.banner || activeEntity?.avatar || world?.bannerUrl) && (
              <div className="w-full h-56 sm:h-72 rounded-[4px] overflow-hidden mb-8 border border-oros-800 shadow-2xl relative">
                <img
                  src={activeEntity?.banner || activeEntity?.avatar || world?.bannerUrl}
                  alt={activeEntity?.title || activeChapter?.title || 'Banner'}
                  className="w-full h-full object-cover object-center filter brightness-[0.85]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-black/30" />
              </div>
            )}

            {/* Document Header */}
            <header className="mb-8 pb-6 border-b border-oros-800/80">
              <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest mb-2 font-sans">
                {currentSection.type === 'chapter' ? (
                  <>
                    <span>Manuscript Chapter</span>
                    <span>•</span>
                    <span>{activeChapter?.wordCount || 0} words</span>
                  </>
                ) : (
                  <>
                    <span>{activeEntity?.type || 'Lore Note'}</span>
                    {activeEntity?.infobox.subtitle && (
                      <>
                        <span>•</span>
                        <span>{activeEntity.infobox.subtitle}</span>
                      </>
                    )}
                  </>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#f1f5f9] tracking-tight leading-tight">
                {activeChapter?.title || activeEntity?.title || 'Untitled Document'}
              </h1>

              {activeEntity?.summary && (
                <p className="text-base text-oros-300 mt-3 font-sans italic max-w-2xl leading-relaxed">
                  {activeEntity.summary}
                </p>
              )}
            </header>

            {/* Document Body */}
            <div 
              style={typographyStyle}
              onClick={handleReaderProseClick}
              className="prose-reading oros-wiki-prose text-[#cbd5e1] space-y-6"
            >
              {currentSection.type === 'chapter' && activeChapter ? (
                enrichedChapterHtml ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: enrichedChapterHtml }}
                    className="leading-relaxed [&>p]:mb-5 [&>h2]:font-serif [&>h2]:text-2xl [&>h2]:text-oros-100 [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-3 [&>blockquote]:border-l-2 [&>blockquote]:border-accent [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-oros-300"
                  />
                ) : (
                  <p className="text-oros-500 italic">This chapter contains no written prose yet.</p>
                )
              ) : activeEntity ? (
                enrichedEntityHtml ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: enrichedEntityHtml }}
                    className="leading-relaxed [&>p]:mb-5 [&>h2]:font-serif [&>h2]:text-2xl [&>h2]:text-oros-100 [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-3 [&>blockquote]:border-l-2 [&>blockquote]:border-accent [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-oros-300"
                  />
                ) : (
                  <p className="text-oros-500 italic">No lore content recorded for this entity.</p>
                )
              ) : (
                <p className="text-oros-500 italic">Select a chapter or lore entry from the contents menu.</p>
              )}
            </div>

            {/* Bottom Next/Prev Pagination */}
            <footer className="no-print mt-14 pt-8 border-t border-oros-800/80 flex items-center justify-between text-xs font-sans text-oros-400">
              {navigation.prev ? (
                <button
                  onClick={() => setCurrentSection({ type: currentSection.type, id: navigation.prev!.id })}
                  className="flex items-center gap-2 px-3 py-2 rounded-[3px] border border-oros-800 bg-oros-900/60 hover:bg-oros-850 hover:text-oros-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{navigation.prev.title}</span>
                </button>
              ) : (
                <div />
              )}

              {navigation.next ? (
                <button
                  onClick={() => setCurrentSection({ type: currentSection.type, id: navigation.next!.id })}
                  className="flex items-center gap-2 px-3 py-2 rounded-[3px] border border-oros-800 bg-oros-900/60 hover:bg-oros-850 hover:text-oros-200 transition-colors ml-auto"
                >
                  <span>{navigation.next.title}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div />
              )}
            </footer>
          </article>
        </main>
      </div>
    </div>
  )
}
