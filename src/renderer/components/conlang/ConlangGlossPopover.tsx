import React, { useState, useRef, useEffect } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { ConlangWord, ConlangLanguage } from '@shared/types'
import { Languages, BookA, ExternalLink } from 'lucide-react'

interface ConlangGlossPopoverProps {
  term: string;
  children: React.ReactNode;
}

export const ConlangGlossPopover: React.FC<ConlangGlossPopoverProps> = ({ term, children }) => {
  const { conlangs, activeWorldId, openTab, setSelectedLanguageId } = useWorldStore()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const worldId = activeWorldId || 'world-ostergard'
  const worldLanguages = conlangs[worldId] || []

  // Find matching word across all languages
  const match = React.useMemo(() => {
    const clean = term.toLowerCase().trim()
    for (const lang of worldLanguages) {
      for (const w of lang.words) {
        if (w.term.toLowerCase() === clean) {
          return { word: w, lang }
        }
        if (w.aliases && w.aliases.some(a => a.toLowerCase() === clean)) {
          return { word: w, lang }
        }
      }
    }
    return null
  }, [worldLanguages, term])

  if (!match) {
    return <>{children}</>
  }

  const { word, lang } = match

  const handleMouseEnter = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + window.scrollY + 6,
      left: Math.max(16, rect.left + window.scrollX - 40)
    })
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    setIsOpen(false)
  }

  const handleOpenDictionary = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLanguageId(lang.id)
    openTab({
      title: lang.name,
      type: 'dictionary',
      targetId: lang.id
    })
  }

  return (
    <span
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline border-b border-dotted border-accent/80 hover:border-accent text-accent/95 hover:text-accent cursor-help transition-colors"
    >
      {children}

      {isOpen && (
        <span
          ref={popoverRef}
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          className="fixed z-50 w-72 bg-oros-900/95 backdrop-blur-md border border-oros-700/80 rounded-[4px] p-3 shadow-2xl text-left pointer-events-auto animate-fade-in font-sans"
        >
          {/* Header */}
          <span className="flex items-start justify-between gap-1.5 pb-2 border-b border-oros-800">
            <span className="flex-1 min-w-0">
              <span className="flex items-baseline gap-1.5">
                <span className="font-serif font-bold text-sm text-oros-100">
                  {word.term}
                </span>
                {word.phonetic && (
                  <span className="font-mono text-[10px] text-oros-400 bg-oros-950 px-1 py-0.5 rounded border border-oros-800">
                    {word.phonetic}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-oros-800 text-oros-300">
                  {word.partOfSpeech}
                </span>
                <span className="text-[10px] font-mono text-oros-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lang.color || '#38bdf8' }} />
                  {lang.name}
                </span>
              </span>
            </span>

            <button
              onClick={handleOpenDictionary}
              title="Open in Conlang Dictionary"
              className="text-oros-500 hover:text-accent p-0.5 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </span>

          {/* Definition */}
          <span className="block text-xs text-oros-200 mt-2 leading-relaxed">
            {word.definition}
          </span>

          {/* Etymology */}
          {word.etymology && (
            <span className="block mt-2 pt-1.5 border-t border-oros-850 text-[10px] text-oros-400">
              <span className="font-mono uppercase text-oros-500 mr-1">Root:</span>
              <span className="italic text-oros-300">{word.etymology}</span>
            </span>
          )}

          {/* Example */}
          {word.examples && word.examples[0] && (
            <span className="block mt-1.5 p-1.5 rounded bg-oros-950/80 border border-oros-850 text-[11px] text-oros-300 italic">
              "{word.examples[0].original}"
            </span>
          )}
        </span>
      )}
    </span>
  )
}
