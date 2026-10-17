import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { TimelineEvent, WorldCalendarConfig } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { 
  Plus, ZoomIn, ZoomOut, Maximize2, Calendar, Clock, 
  Swords, Crown, Hourglass, Flame, Shield, Sparkles, Edit3, Trash2, ExternalLink
} from 'lucide-react'
import { 
  formatTimelineDate, 
  formatPeriodDuration, 
  PERIOD_TYPE_CONFIG 
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
  const [panX, setPanX] = useState<number>(100)
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; panX: number } | null>(null)

  // Axis Hover & In-Situ Creation State
  const [hoverYear, setHoverYear] = useState<number | null>(null)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const [dragPeriodStartYear, setDragPeriodStartYear] = useState<number | null>(null)
  const [dragPeriodCurrentYear, setDragPeriodCurrentYear] = useState<number | null>(null)

  // Selected event for quick inspector card
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Calculate year horizon
  const minYear = useMemo(() => {
    const eventMin = events.reduce((min, e) => Math.min(min, e.year), Infinity)
    const base = calendarConfig.firstYear ?? 400
    return Math.min(base, eventMin === Infinity ? base : eventMin - 20)
  }, [events, calendarConfig.firstYear])

  const maxYear = useMemo(() => {
    const eventMax = events.reduce((max, e) => Math.max(max, e.isPeriod ? (e.endYear ?? e.year) : e.year), -Infinity)
    const base = calendarConfig.lastYear ?? 1200
    return Math.max(base, eventMax === -Infinity ? base : eventMax + 20)
  }, [events, calendarConfig.lastYear])

  const totalYears = Math.max(50, maxYear - minYear)
  const pxPerYear = Math.max(4, 14 * zoom)
  const totalWidth = totalYears * pxPerYear + 800

  // Coordinate transforms
  const yearToX = useCallback((yr: number) => {
    return (yr - minYear) * pxPerYear + 200
  }, [minYear, pxPerYear])

  const xToYear = useCallback((x: number) => {
    return Math.round(minYear + (x - 200) / pxPerYear)
  }, [minYear, pxPerYear])

  // Center on events on initial load or Fit
  const handleFit = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth
    if (events.length === 0) {
      setPanX(50)
      setZoom(1)
      return
    }

    const firstEvtYear = Math.min(...events.map(e => e.year))
    const lastEvtYear = Math.max(...events.map(e => e.isPeriod ? (e.endYear ?? e.year) : e.year))
    const span = Math.max(10, lastEvtYear - firstEvtYear)
    
    // Fit span in container width
    const optimalPxPerYear = (containerWidth * 0.7) / span
    const nextZoom = Math.min(3, Math.max(0.3, optimalPxPerYear / 14))
    setZoom(nextZoom)

    const centerYear = firstEvtYear + span / 2
    const centerX = (centerYear - minYear) * (14 * nextZoom) + 200
    setPanX(containerWidth / 2 - centerX)
  }, [events, minYear])

  useEffect(() => {
    handleFit()
  }, [])

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on background drag or middle mouse
    if (e.button === 0 && (e.target === containerRef.current || (e.target as HTMLElement).dataset.panTarget)) {
      setIsPanning(true)
      setDragStart({ x: e.clientX, panX })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && dragStart) {
      const dx = e.clientX - dragStart.x
      setPanX(dragStart.panX + dx)
    }

    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left - panX
    const computedYear = xToYear(mouseX)

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

  // Wheel zoom with Ctrl or horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
      setZoom(prev => Math.min(5, Math.max(0.2, prev * zoomFactor)))
    } else {
      // Horizontal pan with normal wheel / trackpad
      setPanX(prev => prev - e.deltaX - (e.shiftKey ? e.deltaY : 0))
    }
  }

  // Separate periods and single events
  const periods = useMemo(() => events.filter(e => e.isPeriod), [events])
  const singleEvents = useMemo(() => events.filter(e => !e.isPeriod), [events])

  // Eras
  const eraBands = useMemo(() => {
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
    return Array.from(eraMap.entries()).map(([era, data]) => ({
      era,
      start: data.start,
      end: Math.max(data.end, data.start + 5),
      count: data.count
    }))
  }, [events])

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

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="flex-1 w-full h-full relative overflow-hidden select-none bg-oros-950 oros-dotted-surface cursor-grab active:cursor-grabbing"
      data-pan-target="true"
    >
      {/* Zoom / View Instruments Mini Bar (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 bg-oros-900/90 backdrop-blur-md border border-oros-750 rounded-[3px] shadow-lg">
        <button
          onClick={() => setZoom(prev => Math.min(5, prev * 1.25))}
          className="p-1.5 rounded-[2px] text-oros-300 hover:text-oros-100 hover:bg-oros-800 transition-colors"
          title="Zoom In (Ctrl + Wheel)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[10px] text-oros-400 px-1 min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(prev => Math.max(0.2, prev * 0.8))}
          className="p-1.5 rounded-[2px] text-oros-300 hover:text-oros-100 hover:bg-oros-800 transition-colors"
          title="Zoom Out (Ctrl + Wheel)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-oros-750 mx-0.5" />
        <button
          onClick={handleFit}
          className="p-1.5 rounded-[2px] text-oros-300 hover:text-oros-100 hover:bg-oros-800 transition-colors"
          title="Fit All Events"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Axis Instruction Hint */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none text-[11px] font-mono text-oros-400 bg-oros-900/80 backdrop-blur-md px-2.5 py-1 border border-oros-750/70 rounded-[3px] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        <span>Click axis to add event · Drag axis to create period span</span>
      </div>

      {/* Virtual Canvas Layer */}
      <div 
        className="absolute inset-y-0"
        style={{
          width: totalWidth,
          transform: `translateX(${panX}px)`,
          transition: isPanning ? 'none' : 'transform 0.05s ease-out'
        }}
        data-pan-target="true"
      >
        {/* Era Background Bands (Upper Region) */}
        {eraBands.map((band) => {
          const left = yearToX(band.start)
          const right = yearToX(band.end)
          const width = Math.max(60, right - left)
          return (
            <div
              key={band.era}
              className="absolute top-10 h-10 border-l border-r border-oros-750/60 bg-oros-900/30 backdrop-blur-[1px] px-2.5 py-1 flex items-center justify-between"
              style={{ left, width }}
            >
              <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-oros-300 truncate">
                {band.era}
              </span>
              <span className="font-mono text-[9px] text-oros-500">
                {band.count} entries
              </span>
            </div>
          )
        })}

        {/* ======================================================== */}
        {/* PERIODS TRACK (Lanes above the main axis) */}
        {/* ======================================================== */}
        <div className="absolute top-24 left-0 right-0 h-44 pointer-events-none">
          {periods.map((period, idx) => {
            const startX = yearToX(period.year)
            const endX = yearToX(period.endYear ?? period.year)
            const width = Math.max(28, endX - startX)
            const lane = idx % 3
            const topOffset = lane * 42 + 6
            const periodCfg = PERIOD_TYPE_CONFIG[period.periodType || 'custom'] || PERIOD_TYPE_CONFIG.custom
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
        {/* MAIN TIME RULER & AXIS (Center) */}
        {/* ======================================================== */}
        <div className="absolute top-[280px] left-0 right-0 h-16">
          {/* Continuous Axis Line */}
          <div 
            className="absolute top-6 left-0 right-0 h-[2px] bg-oros-700/80 group-hover:bg-accent transition-colors" 
            data-pan-target="true"
          />

          {/* Axis Ticks */}
          {ticks.map((t) => {
            const x = yearToX(t.year)
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
                      ? 'h-4 bg-oros-300' 
                      : t.isDecade 
                      ? 'h-2.5 bg-oros-600' 
                      : 'h-1.5 bg-oros-750'
                  }`} 
                />

                {/* Monospace Year Label */}
                {(t.isMajor || (pxPerYear > 8 && t.isDecade) || pxPerYear > 30) && (
                  <span className="font-mono text-[10px] text-oros-400 mt-1 select-none font-medium">
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
            title="Click to add event here · Drag to create a time period"
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

          {/* Dynamic Hover Cursor on Timeline Axis */}
          {hoverX !== null && hoverYear !== null && dragPeriodStartYear === null && (
            <div
              className="absolute top-1 pointer-events-none z-20 flex flex-col items-center"
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
                onClick={() => {
                  if (confirm(`Delete "${selectedEvent.title}"?`)) {
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
