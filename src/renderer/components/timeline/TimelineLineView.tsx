import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { TimelineEvent, WorldCalendarConfig } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { 
  Plus, ZoomIn, ZoomOut, Maximize2, Calendar, Clock, 
  Swords, Crown, Hourglass, Flame, Shield, Sparkles, Edit3, Trash2, ExternalLink,
  MousePointer, MoveHorizontal
} from 'lucide-react'
import { 
  formatTimelineDate, 
  formatPeriodDuration, 
  PERIOD_TYPE_CONFIG,
  getPeriodTypeConfig
} from '../../utils/calendarDefaults'

interface TimelineLineViewProps {
  events: TimelineEvent[]
  calendarConfig: WorldCalendarConfig
  onAddAtYear: (year: number, isPeriod?: boolean, endYear?: number) => void
  onEditEvent: (event: TimelineEvent) => void
  onDeleteEvent: (eventId: string) => void
}

export const TimelineLineView: React.FC<TimelineLineViewProps> = ({
  events,
  calendarConfig,
  onAddAtYear,
  onEditEvent,
  onDeleteEvent
}) => {
  const { entities, activeWorldId, openTab } = useWorldStore()
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  const containerRef = useRef<HTMLDivElement>(null)

  // Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1) // 1x = ~14px per year
  const [panX, setPanX] = useState<number>(120)
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; panX: number } | null>(null)
  const [wheelMode, setWheelMode] = useState<'zoom' | 'pan'>('zoom')
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false)

  // Keep refs in sync for high-frequency wheel and drag callbacks
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const panXRef = useRef(panX)
  panXRef.current = panX
  const wheelModeRef = useRef(wheelMode)
  wheelModeRef.current = wheelMode

  // Axis Hover & In-Situ Creation State
  const [hoverYear, setHoverYear] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const [isNearAxis, setIsNearAxis] = useState<boolean>(false)
  const [dragPeriodStartYear, setDragPeriodStartYear] = useState<number | null>(null)
  const [dragPeriodCurrentYear, setDragPeriodCurrentYear] = useState<number | null>(null)

  // Selected event for quick inspector card
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Calendar horizons
  const firstYear = calendarConfig.firstYear ?? 400
  const lastYear = calendarConfig.lastYear ?? 1200

  // Calculate year horizon with margins
  const minYear = useMemo(() => {
    const eventMin = events.reduce((min, e) => Math.min(min, e.year), Infinity)
    return Math.min(firstYear, eventMin === Infinity ? firstYear : eventMin - 10)
  }, [events, firstYear])

  const maxYear = useMemo(() => {
    const eventMax = events.reduce((max, e) => Math.max(max, e.isPeriod ? (e.endYear ?? e.year) : e.year), -Infinity)
    return Math.max(lastYear, eventMax === -Infinity ? lastYear : eventMax + 10)
  }, [events, lastYear])

  const totalYears = Math.max(50, maxYear - minYear)
  const pxPerYear = Math.max(2, 14 * zoom)
  const totalWidth = totalYears * pxPerYear + 2000

  // Coordinate transforms
  const yearToX = useCallback((yr: number) => {
    return (yr - minYear) * pxPerYear + 300
  }, [minYear, pxPerYear])

  const xToYear = useCallback((x: number) => {
    return Math.round(minYear + (x - 300) / pxPerYear)
  }, [minYear, pxPerYear])

  // Boundary clamp function so the ruler can NEVER be scrolled into an empty black void
  const clampPan = useCallback((targetPanX: number, targetZoom: number) => {
    if (!containerRef.current) return targetPanX
    const containerW = containerRef.current.clientWidth
    const curPxPerYear = 14 * targetZoom
    const rStartX = (firstYear - minYear) * curPxPerYear + 300
    const rEndX = (lastYear - minYear) * curPxPerYear + 300

    // Keep at least 140px of the ruler visible inside the viewport
    const minAllowed = 140 - rEndX
    const maxAllowed = containerW - 140 - rStartX

    if (minAllowed > maxAllowed) {
      // If the entire horizon fits inside the viewport, center it
      return (containerW - (rStartX + rEndX)) / 2
    }
    return Math.min(maxAllowed, Math.max(minAllowed, targetPanX))
  }, [firstYear, lastYear, minYear])

  // Zoom keeping the year at focalX strictly motionless (zero drift)
  const zoomAtFocalPoint = useCallback((targetZoom: number, focalXOverride?: number) => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth
    const focalX = focalXOverride ?? (containerWidth / 2) // Defaults to screen center if no mouse position provided

    const curZoom = zoomRef.current
    const curPanX = panXRef.current

    const clampedZoom = Math.min(6, Math.max(0.1, targetZoom))
    if (Math.abs(clampedZoom - curZoom) < 0.0001) return

    const zoomRatio = clampedZoom / curZoom

    // Mathematical formula to lock the year at focalX in place:
    // (yearAtFocal - minYear) * 14 * curZoom = focalX - curPanX - 300
    // newPanX = focalX - 300 - (focalX - curPanX - 300) * zoomRatio
    const rawPanX = focalX - 300 - (focalX - curPanX - 300) * zoomRatio
    const nextPanX = clampPan(rawPanX, clampedZoom)

    setZoom(clampedZoom)
    setPanX(nextPanX)
    zoomRef.current = clampedZoom
    panXRef.current = nextPanX
  }, [clampPan])

  // Center on calendar horizon on initial load or Fit
  const handleFit = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth
    
    // Fit the world calendar configuration horizon nicely with 140px padding on each side
    const targetSpan = Math.max(20, lastYear - firstYear)
    const availableWidth = Math.max(300, containerWidth - 280)
    const optimalPxPerYear = availableWidth / targetSpan
    const nextZoom = Math.min(4, Math.max(0.12, optimalPxPerYear / 14))

    const centerYear = firstYear + targetSpan / 2
    const nextPxPerYear = 14 * nextZoom
    const centerX = (centerYear - minYear) * nextPxPerYear + 300
    const nextPanX = containerWidth / 2 - centerX

    setIsTransitioning(true)
    setZoom(nextZoom)
    setPanX(nextPanX)
    zoomRef.current = nextZoom
    panXRef.current = nextPanX

    setTimeout(() => {
      setIsTransitioning(false)
    }, 260)
  }, [firstYear, lastYear, minYear])

  useEffect(() => {
    handleFit()
  }, [])

  // High-performance, non-passive Native Wheel Listener focused at mouse position
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const shouldZoom = wheelModeRef.current === 'zoom' ? !e.shiftKey : (e.ctrlKey || e.metaKey)

      if (shouldZoom) {
        // Continuous, responsive exponential zoom focused at the mouse cursor
        const rect = el.getBoundingClientRect()
        const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))

        const delta = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX
        const zoomSensitivity = 0.002
        const factor = Math.exp(-delta * zoomSensitivity)
        const nextZoom = zoomRef.current * factor
        zoomAtFocalPoint(nextZoom, mouseX)
      } else {
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
        const nextPanX = clampPan(panXRef.current - delta, zoomRef.current)
        setPanX(nextPanX)
        panXRef.current = nextPanX
      }
    }

    el.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheelNative)
    }
  }, [zoomAtFocalPoint, clampPan])

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target === containerRef.current || (e.target as HTMLElement).dataset.panTarget)) {
      setIsPanning(true)
      setIsTransitioning(false)
      setDragStart({ x: e.clientX, panX: panXRef.current })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && dragStart) {
      const dx = e.clientX - dragStart.x
      const nextPanX = clampPan(dragStart.panX + dx, zoomRef.current)
      setPanX(nextPanX)
      panXRef.current = nextPanX
    }

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left - panXRef.current
    const mouseY = e.clientY - rect.top
    const computedYear = xToYear(mouseX)

    // Check if mouse is vertically near the timeline ruler (top: 280px ± 50px)
    const isNear = mouseY >= 230 && mouseY <= 330 && computedYear >= (firstYear - 20) && computedYear <= (lastYear + 20)
    setIsNearAxis(isNear)

    setHoverX(mouseX)
    setHoverYear(computedYear)

    if (dragPeriodStartYear !== null) {
      setDragPeriodCurrentYear(computedYear)
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDragStart(null)

    if (dragPeriodStartYear !== null && dragPeriodCurrentYear !== null) {
      const start = Math.min(dragPeriodStartYear, dragPeriodCurrentYear)
      const end = Math.max(dragPeriodStartYear, dragPeriodCurrentYear)
      if (end - start >= 1) {
        onAddAtYear(start, true, end)
      } else {
        onAddAtYear(start, false)
      }
      setDragPeriodStartYear(null)
      setDragPeriodCurrentYear(null)
    }
  }

  // Separate periods and single events
  const periods = useMemo(() => events.filter(e => e.isPeriod), [events])
  const singleEvents = useMemo(() => events.filter(e => !e.isPeriod), [events])

  // Era bands: Prioritize configured Eras from calendarConfig with epoch boundaries
  const eraBands = useMemo(() => {
    if (calendarConfig.eras && calendarConfig.eras.length > 0) {
      return calendarConfig.eras.map(era => {
        const count = events.filter(e => {
          if (e.era && e.era === era.name) return true
          return e.year >= era.startYear && e.year <= era.endYear
        }).length
        return {
          id: era.id,
          name: era.name,
          start: era.startYear,
          end: era.endYear,
          color: era.color || '#6366f1',
          count
        }
      })
    }

    // Fallback: build from existing event eras
    const eraMap = new Map<string, { start: number; end: number; count: number }>()
    events.forEach(e => {
      const era = e.era || 'Universal Era'
      const start = e.year
      const end = e.isPeriod ? (e.endYear ?? e.year) : e.year
      if (!eraMap.has(era)) {
        eraMap.set(era, { start, end, count: 1 })
      } else {
        const entry = eraMap.get(era)!
        entry.start = Math.min(entry.start, start)
        entry.end = Math.max(entry.end, end)
        entry.count += 1
      }
    })
    return Array.from(eraMap.entries()).map(([era, data], idx) => ({
      id: `fallback-era-${idx}`,
      name: era,
      start: data.start,
      end: Math.max(data.end, data.start + 50),
      color: '#6366f1',
      count: data.count
    }))
  }, [calendarConfig.eras, events])

  // Tick generator
  const ticks = useMemo(() => {
    const result: { year: number; isMajor: boolean; isDecade: boolean }[] = []
    
    // Choose step based on zoom
    let step = 10
    if (pxPerYear < 6) step = 50
    if (pxPerYear < 2) step = 100
    if (pxPerYear > 25) step = 5
    if (pxPerYear > 50) step = 1

    const start = Math.floor(minYear / step) * step
    for (let yr = start; yr <= maxYear; yr += step) {
      const isMajor = yr % 100 === 0
      const isDecade = yr % 10 === 0
      result.push({ year: yr, isMajor, isDecade })
    }
    return result
  }, [minYear, maxYear, pxPerYear])

  const selectedEvent = events.find(e => e.id === selectedEventId)

  // Ruler boundary coordinates
  const rulerStartX = yearToX(firstYear)
  const rulerEndX = yearToX(lastYear)
  const rulerWidth = Math.max(10, rulerEndX - rulerStartX)

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsNearAxis(false)
        setHoverX(null)
        setHoverYear(null)
        if (isPanning) {
          setIsPanning(false)
          setDragStart(null)
        }
      }}
      className="flex-1 w-full h-full relative overflow-hidden select-none bg-oros-950 oros-dotted-surface cursor-grab active:cursor-grabbing"
      data-pan-target="true"
    >
      {/* Zoom / View Instruments Mini Bar (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 bg-oros-900/90 backdrop-blur-md border border-oros-750 rounded-[3px] shadow-lg">
        {/* Wheel Mode Segmented Toggle */}
        <div className="flex items-center bg-oros-850 border border-oros-750/80 rounded-[2px] p-0.5 mr-1">
          <button
            onClick={() => setWheelMode('zoom')}
            className={`px-1.5 py-0.5 rounded-[1px] text-[10px] font-mono font-medium transition-colors ${
              wheelMode === 'zoom'
                ? 'bg-oros-750 text-oros-100'
                : 'text-oros-400 hover:text-oros-200'
            }`}
            title="Scroll wheel zooms timeline focused at mouse cursor"
          >
            Wheel: Zoom
          </button>
          <button
            onClick={() => setWheelMode('pan')}
            className={`px-1.5 py-0.5 rounded-[1px] text-[10px] font-mono font-medium transition-colors ${
              wheelMode === 'pan'
                ? 'bg-oros-750 text-oros-100'
                : 'text-oros-400 hover:text-oros-200'
            }`}
            title="Scroll wheel pans timeline horizontally"
          >
            Pan
          </button>
        </div>

        <button
          onClick={() => zoomAtFocalPoint(zoom * 1.25)}
          className="p-1.5 rounded-[2px] text-oros-300 hover:text-oros-100 hover:bg-oros-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[10px] text-oros-400 px-1 min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => zoomAtFocalPoint(zoom * 0.8)}
          className="p-1.5 rounded-[2px] text-oros-300 hover:text-oros-100 hover:bg-oros-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-oros-750 mx-0.5" />
        <button
          onClick={handleFit}
          className="p-1.5 rounded-[2px] text-oros-300 hover:text-oros-100 hover:bg-oros-800 transition-colors flex items-center gap-1"
          title="Fit world horizon centered"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-sans font-medium hidden sm:inline">Center Horizon</span>
        </button>
      </div>

      {/* Axis Instruction Hint */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none text-[11px] font-mono text-oros-400 bg-oros-900/80 backdrop-blur-md px-2.5 py-1 border border-oros-750/70 rounded-[3px] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span>Click axis to add event · Drag to create period</span>
      </div>

      {/* Virtual Canvas Layer */}
      <div 
        className="absolute inset-y-0"
        style={{
          width: totalWidth,
          transform: `translateX(${panX}px)`,
          transition: isTransitioning ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
        }}
        data-pan-target="true"
      >
        {/* Era Background Bands (Upper Region spanning epoch boundaries) */}
        {eraBands.map((band) => {
          const left = yearToX(band.start)
          const right = yearToX(band.end)
          const width = Math.max(32, right - left)
          const isCompact = width < 120
          const isVeryCompact = width < 60

          return (
            <div
              key={band.id || band.name}
              className="absolute top-8 h-10 border-l border-r border-oros-750/80 px-2 py-1 flex items-center justify-between overflow-hidden shadow-sm"
              style={{ 
                left, 
                width,
                backgroundColor: band.color ? `${band.color}14` : 'rgba(30, 41, 54, 0.4)',
                borderLeftColor: band.color || '#6366f1',
                borderRightColor: band.color || '#6366f1'
              }}
              title={`${band.name} (${band.start} – ${band.end} · ${band.count} events)`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span 
                  className="w-1.5 h-1.5 rounded-full shrink-0" 
                  style={{ backgroundColor: band.color || '#6366f1' }}
                />
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-oros-200 truncate">
                  {isVeryCompact ? band.name.slice(0, 3) : band.name}
                </span>
              </div>
              {!isCompact && (
                <span className="font-mono text-[9px] text-oros-400 shrink-0 ml-2 bg-oros-950/80 px-1 py-0.5 rounded-[2px] border border-oros-800">
                  {band.count} {band.count === 1 ? 'entry' : 'entries'}
                </span>
              )}
            </div>
          )
        })}

        {/* ======================================================== */}
        {/* PERIODS TRACK (Lanes above the main axis) */}
        {/* ======================================================== */}
        <div className="absolute top-22 left-0 right-0 h-44 pointer-events-none">
          {periods.map((period, idx) => {
            const startX = yearToX(period.year)
            const endX = yearToX(period.endYear ?? period.year)
            const width = Math.max(28, endX - startX)
            const lane = idx % 3
            const topOffset = lane * 42 + 6
            const periodCfg = getPeriodTypeConfig(period.periodType || 'custom', calendarConfig.customPeriodTypes)
            const barColor = period.color || periodCfg.color

            const durationStr = formatPeriodDuration(
              period.year, 
              period.endYear ?? period.year, 
              period.month, 
              period.endMonth, 
              period.day, 
              period.endDay, 
              calendarConfig
            )

            return (
              <div
                key={period.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEventId(period.id)
                }}
                className="absolute pointer-events-auto cursor-pointer group transition-transform hover:-translate-y-0.5"
                style={{
                  left: startX,
                  width,
                  top: topOffset
                }}
              >
                {/* Horizontal Period Bar */}
                <div 
                  className="h-8 rounded-[3px] border px-2 flex items-center justify-between gap-1 shadow-md transition-all group-hover:brightness-125"
                  style={{
                    backgroundColor: periodCfg.bg,
                    borderColor: barColor
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-2 h-2 rounded-[1px] shrink-0"
                      style={{ backgroundColor: barColor }}
                    />
                    <span className="font-sans text-xs font-semibold text-oros-100 truncate">
                      {period.title}
                    </span>
                  </div>

                  <span className="font-mono text-[9px] font-bold text-oros-300 px-1 py-0.5 rounded-[2px] bg-oros-950/70 border border-oros-800 shrink-0">
                    {durationStr}
                  </span>
                </div>

                {/* Range Bracket Notches */}
                <div 
                  className="w-full h-1 border-l-2 border-r-2 mt-0.5 opacity-60"
                  style={{ borderColor: barColor }}
                />
              </div>
            )
          })}
        </div>

        {/* ======================================================== */}
        {/* MAIN TIME RULER & AXIS (Center with boundary caps) */}
        {/* ======================================================== */}
        <div className="absolute top-[280px] left-0 right-0 h-16">
          {/* Subtle Horizon Guide Background */}
          <div 
            className="absolute top-6 h-[2px] bg-oros-850/60"
            style={{
              left: yearToX(minYear),
              width: (maxYear - minYear) * pxPerYear
            }}
          />

          {/* Active Bounded Ruler Line (firstYear to lastYear) */}
          <div 
            className="absolute top-6 h-[2px] bg-oros-600/90 shadow-sm" 
            style={{
              left: rulerStartX,
              width: rulerWidth
            }}
            data-pan-target="true"
          />

          {/* Left Boundary Cap (Start of Chronology Horizon) */}
          <div 
            className="absolute top-2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: rulerStartX, transform: 'translateX(-50%)' }}
          >
            <div className="h-6 w-[2px] bg-accent shadow" />
            <span className="font-mono text-[9px] font-bold text-accent bg-oros-900 border border-accent/60 px-1.5 py-0.5 rounded-[2px] mt-1 whitespace-nowrap shadow-md">
              | START: {firstYear} {calendarConfig.yearSuffix}
            </span>
          </div>

          {/* Right Boundary Cap (End of Chronology Horizon) */}
          <div 
            className="absolute top-2 flex flex-col items-center pointer-events-none z-10"
            style={{ left: rulerEndX, transform: 'translateX(-50%)' }}
          >
            <div className="h-6 w-[2px] bg-accent shadow" />
            <span className="font-mono text-[9px] font-bold text-accent bg-oros-900 border border-accent/60 px-1.5 py-0.5 rounded-[2px] mt-1 whitespace-nowrap shadow-md">
              END: {lastYear} {calendarConfig.yearSuffix} |
            </span>
          </div>

          {/* Axis Ticks */}
          {ticks.map((t) => {
            const x = yearToX(t.year)
            const isWithinHorizon = t.year >= firstYear && t.year <= lastYear
            return (
              <div
                key={t.year}
                className="absolute top-6 flex flex-col items-center pointer-events-none"
                style={{ left: x, transform: 'translateX(-50%)' }}
              >
                {/* Tick Mark */}
                <div 
                  className={`w-[1px] transition-colors ${
                    t.isMajor 
                      ? (isWithinHorizon ? 'h-4 bg-oros-200' : 'h-3 bg-oros-500') 
                      : t.isDecade 
                      ? (isWithinHorizon ? 'h-2.5 bg-oros-500' : 'h-2 bg-oros-700') 
                      : 'h-1.5 bg-oros-800'
                  }`} 
                />

                {/* Monospace Year Label */}
                {(t.isMajor || (pxPerYear > 8 && t.isDecade) || pxPerYear > 30) && (
                  <span className={`font-mono text-[10px] mt-1 select-none font-medium ${
                    isWithinHorizon ? 'text-oros-300' : 'text-oros-600'
                  }`}>
                    {t.year}
                  </span>
                )}
              </div>
            )
          })}

          {/* Interactive In-Situ Axis Hover & Drag Layer */}
          <div 
            onMouseDown={(e) => {
              if (e.button === 0 && hoverYear !== null) {
                e.stopPropagation()
                setDragPeriodStartYear(hoverYear)
                setDragPeriodCurrentYear(hoverYear)
              }
            }}
            onClick={(e) => {
              if (dragPeriodStartYear === null && hoverYear !== null) {
                e.stopPropagation()
                onAddAtYear(hoverYear, false)
              }
            }}
            className="absolute top-0 left-0 right-0 h-12 cursor-pointer z-10"
            title="Click axis to add event · Drag to create a time period span"
          />

          {/* Active Period Drag Highlight */}
          {dragPeriodStartYear !== null && dragPeriodCurrentYear !== null && (
            <div
              className="absolute top-4 h-5 bg-accent/25 border-2 border-accent rounded-[2px] pointer-events-none z-20 flex items-center justify-center"
              style={{
                left: yearToX(Math.min(dragPeriodStartYear, dragPeriodCurrentYear)),
                width: Math.max(12, Math.abs(yearToX(dragPeriodCurrentYear) - yearToX(dragPeriodStartYear)))
              }}
            >
              <span className="font-mono text-[9px] font-bold text-accent bg-oros-950 px-1 rounded shadow">
                {Math.abs(dragPeriodCurrentYear - dragPeriodStartYear)} yrs
              </span>
            </div>
          )}

          {/* Dynamic Hover Cursor on Timeline Axis (Only visible when hovering near the ruler) */}
          {hoverX !== null && hoverYear !== null && dragPeriodStartYear === null && isNearAxis && (
            <div
              className="absolute top-1 pointer-events-none z-20 flex flex-col items-center animate-in fade-in duration-75"
              style={{ left: hoverX, transform: 'translateX(-50%)' }}
            >
              {/* Tooltip Pill */}
              <div className="px-2 py-0.5 rounded-[2px] bg-oros-900 border border-accent/80 text-accent font-mono text-[10px] font-bold shadow-xl whitespace-nowrap mb-1">
                {calendarConfig.yearPrefix} {hoverYear} {calendarConfig.yearSuffix} · Click to add
              </div>

              {/* Cursor Vertical Indicator */}
              <div className="w-[1.5px] h-6 bg-accent" />
              <div className="w-2.5 h-2.5 rotate-45 bg-accent rounded-[1px] -mt-1 shadow" />
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SINGLE EVENT NODES (Lower Region below axis) */}
        {/* ======================================================== */}
        <div className="absolute top-[340px] left-0 right-0 bottom-4 pointer-events-none">
          {singleEvents.map((evt, idx) => {
            const x = yearToX(evt.year)
            // Alternate vertical height to prevent card collisions
            const lane = idx % 3
            const cardTop = lane * 76 + 28

            const isMythic = evt.importance === 'mythic'
            const isMajor = evt.importance === 'major'
            const isSelected = evt.id === selectedEventId

            const borderColor = evt.color 
              ? evt.color 
              : isMythic 
              ? '#f59e0b' 
              : isMajor 
              ? 'var(--oros-accent)' 
              : '#475569'

            return (
              <div
                key={evt.id}
                className="absolute pointer-events-auto"
                style={{ left: x }}
              >
                {/* Vertical Stem from Axis */}
                <div 
                  className="absolute left-0 w-[1.5px] bg-oros-700/80 transition-colors"
                  style={{
                    top: 0,
                    height: cardTop,
                    backgroundColor: isSelected ? 'var(--oros-accent)' : undefined
                  }}
                />

                {/* Milestone Pip at Axis intersection */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEventId(evt.id)
                  }}
                  className="absolute -top-[60px] -left-[4px] w-2.5 h-2.5 rotate-45 rounded-[1px] border cursor-pointer transition-transform hover:scale-125 z-10"
                  style={{
                    backgroundColor: isSelected ? borderColor : '#0e141c',
                    borderColor
                  }}
                  title={`${evt.title} (${evt.year})`}
                />

                {/* Milestone Event Card */}
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEventId(evt.id)
                  }}
                  className={`absolute -left-20 w-44 p-2.5 rounded-[3px] border bg-oros-900/95 backdrop-blur-sm shadow-md cursor-pointer transition-all hover:-translate-y-1 ${
                    isSelected ? 'ring-1 ring-accent border-accent shadow-xl' : 'border-oros-750 hover:border-oros-600'
                  }`}
                  style={{ top: cardTop }}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[9px] font-bold text-accent">
                      {calendarConfig.yearPrefix} {evt.year} {calendarConfig.yearSuffix}
                    </span>
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                      style={{ backgroundColor: borderColor }}
                    />
                  </div>

                  <h4 className="font-sans text-xs font-semibold text-oros-100 line-clamp-1 mb-1">
                    {evt.title}
                  </h4>

                  <p className="text-[10px] text-oros-400 line-clamp-2 leading-tight">
                    {evt.description || 'No chronicle record.'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Event / Period Inspector Drawer (Bottom Left) */}
      {selectedEvent && (
        <div className="absolute bottom-16 left-6 z-30 w-80 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-4 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-oros-800">
            <div className="flex items-center gap-1.5">
              {selectedEvent.isPeriod ? (
                <Clock className="w-3.5 h-3.5 text-accent" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-accent" />
              )}
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-oros-300">
                {selectedEvent.isPeriod ? 'Period Horizon' : 'Milestone Moment'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditEvent(selectedEvent)}
                className="p-1 rounded text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
                title="Edit Entry"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={async () => {
                  const confirmed = await confirmDialog({
                    title: 'Delete Chronicle Entry',
                    message: `Delete "${selectedEvent.title}" from timeline?`,
                    confirmText: 'Delete',
                    variant: 'danger'
                  })
                  if (confirmed) {
                    onDeleteEvent(selectedEvent.id)
                    setSelectedEventId(null)
                  }
                }}
                className="p-1 rounded text-oros-400 hover:text-rose-400 hover:bg-oros-800 transition-colors"
                title="Delete Entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedEventId(null)}
                className="text-oros-400 hover:text-oros-200 text-xs ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-sans font-bold text-sm text-oros-100">
              {selectedEvent.title}
            </h3>

            <div className="font-mono text-xs text-accent">
              {formatTimelineDate(selectedEvent, calendarConfig)}
            </div>

            <p className="text-xs text-oros-300 leading-relaxed">
              {selectedEvent.description || 'No lore description provided.'}
            </p>

            {selectedEvent.entityIds.length > 0 && (
              <div className="pt-2 border-t border-oros-800/80">
                <span className="text-[9px] font-mono uppercase tracking-wider text-oros-400 block mb-1">
                  Connected Lore Entities:
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedEvent.entityIds.map(entId => {
                    const ent = worldEntities.find(e => e.id === entId)
                    if (!ent) return null
                    return (
                      <button
                        key={ent.id}
                        onClick={() => openTab({ title: ent.title, type: 'wiki', targetId: ent.id })}
                        className="text-[10px] px-2 py-0.5 rounded-[2px] bg-oros-800 hover:bg-oros-750 text-oros-200 border border-oros-700 flex items-center gap-1 transition-colors"
                      >
                        <span>{ent.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
