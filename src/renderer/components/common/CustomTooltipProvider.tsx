import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'

interface TooltipState {
  text: string
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
      const target = (e.target as HTMLElement)?.closest('[title], [data-tooltip]') as HTMLElement | null
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
          text,
          x,
          y,
          position: placeTop ? 'top' : 'bottom'
        })
      }

      // If another tooltip was active within 200ms, show immediately (warm transition)
      const isWarm = Date.now() - lastHideTimeRef.current < 250
      if (timerRef.current) clearTimeout(timerRef.current)

      if (isWarm) {
        show()
      } else {
        timerRef.current = setTimeout(show, 150)
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-tooltip]')
      if (target && target === lastActiveTargetRef.current) {
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

  return (
    <div
      ref={tooltipRef}
      className="fixed pointer-events-none select-none z-[9999999] opacity-0 transition-opacity duration-100"
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`
      }}
    >
      <div className="bg-oros-900/95 backdrop-blur-md border border-oros-750 text-oros-100 font-sans text-[11px] font-medium px-2.5 py-1 rounded-[3px] shadow-2xl whitespace-nowrap max-w-xs truncate">
        {tooltip.text}
      </div>
    </div>
  )
}
