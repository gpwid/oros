import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { resolveEntityFromLink, resolveConlangTerm, ResolvedConlangTerm } from '../../utils/proseProcessor'
import { getCategoryMeta, getCategoryIconComponent, DEFAULT_PRESET_CATEGORIES } from '../../utils/categoryIcons'
import { LoreEntity } from '@shared/types'
import { Languages, Link2 } from 'lucide-react'

interface TooltipState {
  kind: 'text' | 'entity' | 'entity-stub' | 'conlang'
  text?: string
  entity?: LoreEntity
  stubTitle?: string
  section?: string
  conlang?: ResolvedConlangTerm
  fallbackTerm?: string
  x: number
  y: number
  position: 'top' | 'bottom'
}

export const CustomTooltipProvider: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<any>(null)
  const lastActiveTargetRef = useRef<HTMLElement | null>(null)
  const lastHideTimeRef = useRef<number>(0)

  // Clamp tooltip strictly within screen viewport to prevent left/right screen edge clipping
  useLayoutEffect(() => {
    if (!tooltip || !tooltipRef.current) return
    const el = tooltipRef.current
    const rect = el.getBoundingClientRect()
    const padding = 8

    let left = tooltip.x - rect.width / 2

    // Clamp horizontally
    if (left < padding) {
      left = padding
    } else if (left + rect.width > window.innerWidth - padding) {
      left = window.innerWidth - padding - rect.width
    }

    // Clamp vertically
    let top = tooltip.position === 'top' ? tooltip.y - rect.height : tooltip.y
    if (top < padding) {
      top = padding
    } else if (top + rect.height > window.innerHeight - padding) {
      top = window.innerHeight - padding - rect.height
    }

    el.style.left = `${Math.round(left)}px`
    el.style.top = `${Math.round(top)}px`
    el.style.opacity = '1'
  }, [tooltip])

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return

      // 1. Check for Wiki Link or Mention first
      const wikiEl = el.closest('.oros-wiki-link, .oros-mention') as HTMLElement | null
      if (wikiEl) {
        if (wikiEl.hasAttribute('title')) {
          wikiEl.removeAttribute('title')
        }
        lastActiveTargetRef.current = wikiEl

        const showWikiTooltip = () => {
          if (lastActiveTargetRef.current !== wikiEl) return
          const { entities, activeWorldId } = useWorldStore.getState()
          const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

          const dataId = wikiEl.getAttribute('data-id')
          const dataTitle =
            wikiEl.getAttribute('data-title') ||
            wikiEl.getAttribute('data-label') ||
            wikiEl.textContent?.replace(/^\[\[/, '').replace(/\]\]$/, '').trim() ||
            ''
          const dataSection = wikiEl.getAttribute('data-section') || undefined

          const resolved = resolveEntityFromLink(worldEntities, dataId, dataTitle)
          const rect = wikiEl.getBoundingClientRect()
          const spaceBelow = window.innerHeight - rect.bottom
          const placeTop = spaceBelow < 180 && rect.top > 180
          const y = placeTop ? rect.top - 8 : rect.bottom + 8
          const x = rect.left + rect.width / 2

          if (resolved) {
            setTooltip({
              kind: 'entity',
              entity: resolved,
              section: dataSection,
              x,
              y,
              position: placeTop ? 'top' : 'bottom'
            })
          } else if (dataTitle) {
            setTooltip({
              kind: 'entity-stub',
              stubTitle: dataTitle,
              section: dataSection,
              x,
              y,
              position: placeTop ? 'top' : 'bottom'
            })
          }
        }

        const isWarm = Date.now() - lastHideTimeRef.current < 250
        if (timerRef.current) clearTimeout(timerRef.current)
        if (isWarm) showWikiTooltip()
        else timerRef.current = setTimeout(showWikiTooltip, 120)
        return
      }

      // 2. Check for Conlang Term
      const conlangEl = el.closest('.oros-conlang-term') as HTMLElement | null
      if (conlangEl) {
        if (conlangEl.hasAttribute('title')) {
          conlangEl.removeAttribute('title')
        }
        lastActiveTargetRef.current = conlangEl

        const showConlangTooltip = () => {
          if (lastActiveTargetRef.current !== conlangEl) return
          const { conlangs, activeWorldId } = useWorldStore.getState()
          const worldConlangs = activeWorldId ? conlangs[activeWorldId] || [] : []

          const termAttr = conlangEl.getAttribute('data-conlang-term') || conlangEl.textContent?.trim() || ''
          const langAttr = conlangEl.getAttribute('data-conlang-lang') || null
          const resolved = resolveConlangTerm(worldConlangs, termAttr, langAttr)

          const rect = conlangEl.getBoundingClientRect()
          const spaceBelow = window.innerHeight - rect.bottom
          const placeTop = spaceBelow < 150 && rect.top > 150
          const y = placeTop ? rect.top - 8 : rect.bottom + 8
          const x = rect.left + rect.width / 2

          setTooltip({
            kind: 'conlang',
            conlang: resolved,
            fallbackTerm: termAttr,
            x,
            y,
            position: placeTop ? 'top' : 'bottom'
          })
        }

        const isWarm = Date.now() - lastHideTimeRef.current < 250
        if (timerRef.current) clearTimeout(timerRef.current)
        if (isWarm) showConlangTooltip()
        else timerRef.current = setTimeout(showConlangTooltip, 120)
        return
      }

      // 3. Standard [title] / [data-tooltip] elements
      const target = el.closest('[title], [data-tooltip]') as HTMLElement | null
      if (!target) return

      // Intercept and sanitize native title attribute to prevent Windows OS native tooltip
      if (target.hasAttribute('title')) {
        const titleText = target.getAttribute('title') || ''
        if (titleText.trim()) {
          target.setAttribute('data-tooltip', titleText)
        }
        target.removeAttribute('title')
      }

      const text = target.getAttribute('data-tooltip')?.trim()
      if (!text) return

      lastActiveTargetRef.current = target

      const show = () => {
        if (lastActiveTargetRef.current !== target) return
        const rect = target.getBoundingClientRect()
        
        // Check vertical placement
        const spaceBelow = window.innerHeight - rect.bottom
        const placeTop = spaceBelow < 36 && rect.top > 36
        const y = placeTop ? rect.top - 6 : rect.bottom + 6
        const x = rect.left + rect.width / 2

        setTooltip({
          kind: 'text',
          text,
          x,
          y,
          position: placeTop ? 'top' : 'bottom'
        })
      }

      const isWarm = Date.now() - lastHideTimeRef.current < 250
      if (timerRef.current) clearTimeout(timerRef.current)

      if (isWarm) {
        show()
      } else {
        timerRef.current = setTimeout(show, 150)
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      const target = el.closest('.oros-wiki-link, .oros-mention, .oros-conlang-term, [data-tooltip]')
      const related = (e.relatedTarget as HTMLElement | null)?.closest(
        '.oros-wiki-link, .oros-mention, .oros-conlang-term, [data-tooltip]'
      )
      if (target && target === lastActiveTargetRef.current && target !== related) {
        if (timerRef.current) clearTimeout(timerRef.current)
        lastActiveTargetRef.current = null
        lastHideTimeRef.current = Date.now()
        setTooltip(null)
      }
    }

    const handleDismiss = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      lastActiveTargetRef.current = null
      lastHideTimeRef.current = Date.now()
      setTooltip(null)
    }

    document.addEventListener('mouseover', handleMouseOver, { passive: true })
    document.addEventListener('mouseout', handleMouseOut, { passive: true })
    document.addEventListener('mousedown', handleDismiss, { passive: true })
    document.addEventListener('wheel', handleDismiss, { passive: true })
    document.addEventListener('keydown', handleDismiss, { passive: true })

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('mousedown', handleDismiss)
      document.removeEventListener('wheel', handleDismiss)
      document.removeEventListener('keydown', handleDismiss)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (!tooltip) return null

  const renderTooltipContent = () => {
    if (tooltip.kind === 'entity' && tooltip.entity) {
      const entity = tooltip.entity
      const { categories, activeWorldId } = useWorldStore.getState()
      const worldCategories = (activeWorldId && categories[activeWorldId]) || DEFAULT_PRESET_CATEGORIES
      const catMeta = getCategoryMeta(entity.type, worldCategories)
      const CatIcon = getCategoryIconComponent(catMeta.icon)

      const rawSummary =
        entity.summary ||
        (entity.content ? entity.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '')
      const quickFacts =
        entity.infobox?.sections
          ?.flatMap((s) => s.fields || [])
          .filter((f) => f.value && f.value.trim() !== '')
          .slice(0, 2) || []

      return (
        <div className="bg-oros-900/95 backdrop-blur-md border border-oros-750 text-oros-100 rounded-[4px] shadow-2xl p-2.5 w-64 space-y-1.5 font-sans">
          <div className="flex items-center justify-between gap-2">
            <span
              className="px-1.5 py-0.5 rounded-[2px] text-[9px] uppercase font-mono tracking-wider font-semibold flex items-center gap-1 border"
              style={{
                backgroundColor: `${catMeta.color || '#38bdf8'}18`,
                borderColor: `${catMeta.color || '#38bdf8'}45`,
                color: catMeta.color || '#38bdf8'
              }}
            >
              <CatIcon className="w-2.5 h-2.5" />
              <span>{catMeta.name}</span>
            </span>
            {entity.infobox?.subtitle && (
              <span className="text-[9px] font-mono text-oros-400 truncate max-w-[120px]">
                {entity.infobox.subtitle}
              </span>
            )}
          </div>

          <div>
            <div className="font-serif font-bold text-xs text-oros-100 leading-snug">
              {entity.title}
              {tooltip.section && (
                <span className="text-accent font-mono text-[10px] font-normal ml-1">
                  § {tooltip.section}
                </span>
              )}
            </div>
            {rawSummary && (
              <p className="text-[11px] text-oros-300 line-clamp-2 leading-relaxed mt-0.5">
                {rawSummary}
              </p>
            )}
          </div>

          {quickFacts.length > 0 && (
            <div className="pt-1.5 border-t border-oros-800/80 space-y-0.5">
              {quickFacts.map((fact) => (
                <div key={fact.id} className="flex items-baseline justify-between gap-2 text-[10px]">
                  <span className="text-oros-500 font-mono shrink-0">{fact.label}:</span>
                  <span className="text-oros-200 truncate font-medium">{fact.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (tooltip.kind === 'entity-stub') {
      return (
        <div className="bg-oros-900/95 backdrop-blur-md border border-oros-750 text-oros-100 rounded-[4px] shadow-2xl p-2.5 w-56 space-y-1 font-sans">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-amber-400">
            <Link2 className="w-3 h-3" />
            <span>Wiki Link</span>
          </div>
          <div className="font-serif font-bold text-xs text-oros-100">
            {tooltip.stubTitle}
            {tooltip.section && (
              <span className="text-accent font-mono text-[10px] font-normal ml-1">
                § {tooltip.section}
              </span>
            )}
          </div>
          <p className="text-[10px] text-oros-400">
            Linked lore entry in codex.
          </p>
        </div>
      )
    }

    if (tooltip.kind === 'conlang') {
      const resolved = tooltip.conlang
      if (resolved) {
        const { word, langName } = resolved
        return (
          <div className="bg-oros-900/95 backdrop-blur-md border border-amber-500/40 text-oros-100 rounded-[4px] shadow-2xl p-2.5 w-60 space-y-1 font-sans">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Languages className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="font-serif font-bold text-xs text-amber-300 truncate">
                  {word.term}
                </span>
                {word.phonetic && (
                  <span className="text-[10px] font-mono text-oros-400 shrink-0">
                    /{word.phonetic}/
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-800 text-amber-300/90 shrink-0">
                {langName}
              </span>
            </div>

            <div className="text-[11px] text-oros-200 leading-snug">
              {word.partOfSpeech && (
                <span className="font-mono text-[9px] uppercase text-oros-400 mr-1.5">
                  [{word.partOfSpeech}]
                </span>
              )}
              <span className="font-medium">&ldquo;{word.definition}&rdquo;</span>
            </div>

            {word.etymology && (
              <div className="pt-1 border-t border-oros-800/80 text-[10px] text-oros-400 truncate">
                <span className="font-mono text-oros-500">Root:</span> {word.etymology}
              </div>
            )}
          </div>
        )
      }

      return (
        <div className="bg-oros-900/95 backdrop-blur-md border border-amber-500/40 text-oros-100 rounded-[4px] shadow-2xl px-2.5 py-1.5 font-sans text-[11px] flex items-center gap-1.5">
          <Languages className="w-3 h-3 text-amber-400" />
          <span className="font-serif italic text-amber-300 font-semibold">{tooltip.fallbackTerm}</span>
          <span className="text-oros-400 text-[10px] font-mono">• Conlang Term</span>
        </div>
      )
    }

    return (
      <div className="bg-oros-900/95 backdrop-blur-md border border-oros-750 text-oros-100 font-sans text-[11px] font-medium px-2.5 py-1 rounded-[3px] shadow-2xl whitespace-nowrap max-w-xs truncate">
        {tooltip.text}
      </div>
    )
  }

  return (
    <div
      ref={tooltipRef}
      className="fixed pointer-events-none select-none z-[9999999] opacity-0 transition-opacity duration-100"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`
      }}
    >
      {renderTooltipContent()}
    </div>
  )
}
