import React, { useState, useMemo } from 'react'
import { TimelineEvent, WorldCalendarConfig } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  Calendar as CalendarIcon, Clock, Plus, Edit3, Trash2, ExternalLink, 
  Sparkles, Bookmark, Sun, Compass, Moon 
} from 'lucide-react'
import {
  getDaysInMonth,
  calculateAbsoluteDay,
  calculateDayOfWeek,
  calculateMoonPhases,
  detectCelestialConjunctions,
  isLeapYear
} from '../../utils/calendarMath'
import { 
  formatTimelineDate, 
  formatPeriodDuration, 
  isEventInYearMonth,
  getPeriodTypeConfig 
} from '../../utils/calendarDefaults'

interface TimelineCalendarViewProps {
  events: TimelineEvent[]
  calendarConfig: WorldCalendarConfig
  onAddAtDate: (year: number, month: number, day: number) => void
  onEditEvent: (event: TimelineEvent) => void
  onDeleteEvent: (eventId: string) => void
}

export const TimelineCalendarView: React.FC<TimelineCalendarViewProps> = ({
  events,
  calendarConfig,
  onAddAtDate,
  onEditEvent,
  onDeleteEvent
}) => {
  const { entities, activeWorldId, openTab } = useWorldStore()
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  // Current calendar coordinates
  const initialYear = useMemo(() => {
    if (events.length > 0) {
      return events[events.length - 1].year
    }
    return calendarConfig.firstYear ?? 828
  }, [events, calendarConfig.firstYear])

  const [activeYear, setActiveYear] = useState<number>(initialYear)
  const [activeMonthIndex, setActiveMonthIndex] = useState<number>(1) // 1-indexed (1..months.length)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const activeMonth = calendarConfig.months[activeMonthIndex - 1] || calendarConfig.months[0] || { id: 'm-1', name: 'Month 1', days: 30 }
  const isLeap = useMemo(() => isLeapYear(activeYear, calendarConfig), [activeYear, calendarConfig])
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(activeYear, activeMonthIndex - 1, calendarConfig)
  }, [activeYear, activeMonthIndex, calendarConfig])
  const daysOfWeek = calendarConfig.daysOfWeek?.length > 0 
    ? calendarConfig.daysOfWeek 
    : ['Moonday', 'Trueday', 'Windsday', 'Thornsday', 'Fireday', 'Starday', 'Sundown']

  // Find all active periods overlapping this activeYear and activeMonthIndex
  const activePeriodsThisMonth = useMemo(() => {
    return events.filter(e => e.isPeriod && isEventInYearMonth(e, activeYear, activeMonthIndex))
  }, [events, activeYear, activeMonthIndex])

  // Map events of current month by day number
  const eventsByDay = useMemo(() => {
    const map = new Map<number, TimelineEvent[]>()
    events.forEach(e => {
      // Single events that match this year and month
      if (!e.isPeriod && e.year === activeYear && (e.month === activeMonthIndex || (!e.month && activeMonthIndex === 1))) {
        const d = e.day || 1
        if (!map.has(d)) map.set(d, [])
        map.get(d)!.push(e)
      }
    })
    return map
  }, [events, activeYear, activeMonthIndex])

  // Intercalary festival days occurring after activeMonth
  const intercalaryDaysThisMonth = useMemo(() => {
    if (!calendarConfig.intercalaryDays) return []
    return calendarConfig.intercalaryDays.filter(ic => {
      if (ic.occursAfterMonthId !== activeMonth.id) return false
      if (ic.isLeapOnly && !isLeap) return false
      return true
    })
  }, [calendarConfig.intercalaryDays, activeMonth.id, isLeap])

  // Compute first day of week offset (deterministic cyclic calculation via calendarMath)
  const firstDayOfWeekOffset = useMemo(() => {
    const absDay = calculateAbsoluteDay(activeYear, activeMonthIndex, 1, 0, calendarConfig)
    return calculateDayOfWeek(absDay, calendarConfig).index
  }, [activeYear, activeMonthIndex, calendarConfig])

  // Precompute celestial day data for the active month
  const monthDaysData = useMemo(() => {
    const map = new Map<number, {
      absDay: number
      weekday: { index: number; name: string }
      moonPhases: ReturnType<typeof calculateMoonPhases>
      conjunction: ReturnType<typeof detectCelestialConjunctions>
    }>()
    for (let d = 1; d <= daysInMonth; d++) {
      const absDay = calculateAbsoluteDay(activeYear, activeMonthIndex, d, 0, calendarConfig)
      const weekday = calculateDayOfWeek(absDay, calendarConfig)
      const moonPhases = (calendarConfig.moons && calendarConfig.moons.length > 0)
        ? calculateMoonPhases(absDay, calendarConfig.moons)
        : []
      const conjunction = moonPhases.length >= 2 ? detectCelestialConjunctions(moonPhases) : null
      map.set(d, { absDay, weekday, moonPhases, conjunction })
    }
    return map
  }, [activeYear, activeMonthIndex, daysInMonth, calendarConfig])

  // Events on the currently selected day
  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay) || [] : []
  const selectedDayInfo = selectedDay ? monthDaysData.get(selectedDay) : null

  return (
    <div className="flex-1 flex overflow-hidden bg-oros-950 select-text">
      {/* Main Calendar Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Navigation Bar (Year & Month controls) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-oros-900 border border-oros-750 rounded-[4px] shadow-sm">
          {/* Year Navigator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveYear(prev => prev - 10)}
              className="p-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-300 hover:text-oros-100 transition-colors"
              title="-10 Years"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveYear(prev => prev - 1)}
              className="p-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-300 hover:text-oros-100 transition-colors"
              title="-1 Year"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 px-2.5 py-1 bg-oros-850 border border-oros-750 rounded-[3px]">
              <span className="font-mono text-xs text-oros-400">
                {calendarConfig.yearPrefix}
              </span>
              <input
                type="number"
                value={activeYear}
                onChange={(e) => setActiveYear(Number(e.target.value))}
                className="w-16 bg-transparent text-center font-mono font-bold text-xs text-oros-100 focus:outline-none"
              />
              <span className="font-mono text-xs text-oros-400">
                {calendarConfig.yearSuffix}
              </span>
            </div>

            <button
              onClick={() => setActiveYear(prev => prev + 1)}
              className="p-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-300 hover:text-oros-100 transition-colors"
              title="+1 Year"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveYear(prev => prev + 10)}
              className="p-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-300 hover:text-oros-100 transition-colors"
              title="+10 Years"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Month Title & Season */}
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-base font-bold text-oros-100">
              {activeMonth.name}
            </h2>
            {activeMonth.season && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[2px] bg-oros-850 border border-oros-700 text-oros-300">
                {activeMonth.season}
              </span>
            )}
            <span className="text-[10px] font-mono text-oros-400">
              ({daysInMonth} days)
            </span>
          </div>
        </div>

        {/* Month Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {calendarConfig.months.map((m, idx) => {
            const isSelected = idx + 1 === activeMonthIndex
            return (
              <button
                key={m.id || idx}
                onClick={() => {
                  setActiveMonthIndex(idx + 1)
                  setSelectedDay(null)
                }}
                className={`px-3 py-1.5 rounded-[3px] text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-oros-800 text-oros-50 border-oros-650 shadow-sm'
                    : 'bg-oros-900/60 text-oros-400 border-oros-800/80 hover:bg-oros-850 hover:text-oros-200'
                }`}
              >
                <span>{m.name}</span>
                <span className="text-[9px] font-mono text-oros-500 ml-1.5">
                  ({m.days}d)
                </span>
              </button>
            )
          })}
        </div>

        {/* Ongoing Periods Banner (if any active during this month) */}
        {activePeriodsThisMonth.length > 0 && (
          <div className="space-y-1.5 animate-fade-in">
            {activePeriodsThisMonth.map((period) => {
              const cfg = getPeriodTypeConfig(period.periodType || 'custom', calendarConfig.customPeriodTypes)
              const duration = formatPeriodDuration(
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
                  onClick={() => onEditEvent(period)}
                  className="px-3 py-1.5 rounded-[3px] border flex items-center justify-between gap-2 cursor-pointer transition-colors hover:brightness-110 shadow-sm"
                  style={{
                    backgroundColor: cfg.bg,
                    borderColor: cfg.border
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider" style={{ color: cfg.color }}>
                      Active Horizon:
                    </span>
                    <span className="font-sans text-xs font-bold text-oros-100 truncate">
                      {period.title}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-oros-300 shrink-0">
                    {period.year} → {period.endYear} ({duration})
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Calendar Day Grid */}
        <div className="border border-oros-750 rounded-[4px] overflow-hidden bg-oros-900 shadow-sm">
          {/* Day of Week Headers */}
          <div 
            className="grid border-b border-oros-750 bg-oros-850 text-oros-300 font-mono text-[10px] font-semibold uppercase tracking-wider text-center py-2"
            style={{ gridTemplateColumns: `repeat(${daysOfWeek.length}, minmax(0, 1fr))` }}
          >
            {daysOfWeek.map((dow, idx) => (
              <span key={idx} className="truncate px-1">
                {dow}
              </span>
            ))}
          </div>

          {/* Month Day Cells */}
          <div 
            className="grid bg-oros-950 divide-x divide-y divide-oros-800/80"
            style={{ gridTemplateColumns: `repeat(${daysOfWeek.length}, minmax(0, 1fr))` }}
          >
            {/* Leading empty offset cells */}
            {Array.from({ length: firstDayOfWeekOffset }).map((_, idx) => (
              <div 
                key={`empty-${idx}`} 
                className="min-h-[85px] bg-oros-950/40 p-1.5 opacity-30 select-none"
              />
            ))}

            {/* Actual day cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1
              const dayEvents = eventsByDay.get(dayNum) || []
              const isSelected = selectedDay === dayNum
              const dayInfo = monthDaysData.get(dayNum)

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`min-h-[85px] p-1.5 flex flex-col justify-between transition-colors relative group cursor-pointer ${
                    isSelected 
                      ? 'bg-oros-850 ring-1 ring-inset ring-accent' 
                      : 'hover:bg-oros-900/80'
                  }`}
                >
                  {/* Day Number, Celestial Moons & Quick Add Button */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-mono text-xs font-semibold ${
                        dayEvents.length > 0 ? 'text-accent font-bold' : 'text-oros-300'
                      }`}>
                        {dayNum}
                      </span>

                      {/* Celestial Moons & Syzygy Indicators */}
                      {dayInfo && dayInfo.moonPhases.length > 0 && (
                        <div className="flex items-center gap-1">
                          {dayInfo.conjunction && (
                            <span 
                              className="p-0.5 rounded-[2px] bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center shrink-0" 
                              title={dayInfo.conjunction.description}
                            >
                              <Sparkles className="w-2.5 h-2.5 animate-pulse text-amber-400" />
                            </span>
                          )}
                          {dayInfo.moonPhases.map(mp => (
                            <span
                              key={mp.moonId}
                              className={`inline-block w-2 h-2 rounded-full border border-black/40 shrink-0 transition-transform hover:scale-125 ${
                                mp.isMajorPhase ? 'ring-1 ring-white/60' : ''
                              }`}
                              style={{
                                backgroundColor: mp.color || '#fff',
                                opacity: Math.max(0.25, mp.illuminationPercent / 100)
                              }}
                              title={`${mp.moonName}: ${mp.phaseName} (${mp.illuminationPercent}% illuminated)`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick hover add button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddAtDate(activeYear, activeMonthIndex, dayNum)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-oros-800 hover:bg-accent hover:text-accent-contrast text-oros-300 transition-all shadow"
                      title={`Add Event on Day ${dayNum}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Event Chips List */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded-[2px] truncate border font-medium ${
                          evt.importance === 'mythic'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : evt.importance === 'major'
                            ? 'bg-accent/20 text-accent border-accent/40'
                            : 'bg-oros-850 text-oros-300 border-oros-750'
                        }`}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-mono text-oros-400 font-semibold pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Intercalary Festival Days Section (when configured after this month) */}
        {intercalaryDaysThisMonth.length > 0 && (
          <div className="p-3 bg-oros-900 border border-accent/30 rounded-[4px] space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent">
                Intercalary Festival Days Following {activeMonth.name}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {intercalaryDaysThisMonth.map(ic => (
                <div key={ic.id} className="p-2.5 bg-oros-850 border border-oros-750 rounded-[3px] shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif font-bold text-xs text-oros-100">{ic.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-accent/20 text-accent font-semibold">
                      {ic.isLeapOnly ? 'Leap Festival' : 'Annual Feast'}
                    </span>
                  </div>
                  {ic.description && (
                    <p className="text-[10px] text-oros-400 mt-1 line-clamp-2">{ic.description}</p>
                  )}
                  <span className="text-[9px] font-mono text-oros-500 mt-1 block">
                    {ic.advancesWeekday ? 'Standard weekday progression' : 'Outside weekly cycle'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Day Almanac Lore Drawer */}
      {selectedDay && (
        <div className="w-80 border-l border-oros-750 bg-oros-900/95 flex flex-col shrink-0 animate-slide-in-right">
          {/* Drawer Header */}
          <div className="p-4 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-accent tracking-wider block">
                {selectedDayInfo?.weekday.name || 'Almanac Day'} · {calendarConfig.yearPrefix} {activeYear} {calendarConfig.yearSuffix}
              </span>
              <h3 className="font-serif text-sm font-bold text-oros-100">
                {activeMonth.name} {selectedDay}
              </h3>
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="text-oros-400 hover:text-oros-100 text-xs p-1 rounded hover:bg-oros-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Drawer Body: Events on this Day & Celestial Phases */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Celestial & Lunar Status Card */}
            {selectedDayInfo && (selectedDayInfo.moonPhases.length > 0 || selectedDayInfo.conjunction) && (
              <div className="p-2.5 bg-oros-850 border border-oros-750 rounded-[3px] space-y-2">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-accent" />
                  <span className="font-mono text-[10px] uppercase font-bold text-oros-300">
                    Celestial Almanack
                  </span>
                </div>

                {selectedDayInfo.conjunction && (
                  <div className="p-2 rounded-[2px] bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-bold block text-[10px] uppercase text-amber-300">
                        {selectedDayInfo.conjunction.type === 'grand_full_conjunction'
                          ? 'Grand Full Conjunction'
                          : selectedDayInfo.conjunction.type === 'dark_solar_conjunction'
                          ? 'Dark Solar Conjunction'
                          : 'Partial Celestial Alignment'}
                      </span>
                      <p className="text-[10px] leading-tight text-amber-200/90 mt-0.5">
                        {selectedDayInfo.conjunction.description}
                      </p>
                    </div>
                  </div>
                )}

                {selectedDayInfo.moonPhases.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {selectedDayInfo.moonPhases.map(mp => (
                      <div key={mp.moonId} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/50"
                            style={{
                              backgroundColor: mp.color || '#fff',
                              opacity: Math.max(0.3, mp.illuminationPercent / 100)
                            }}
                          />
                          <span className="text-oros-200 font-medium">{mp.moonName}</span>
                        </div>
                        <span className="font-mono text-[10px] text-oros-400">
                          {mp.phaseName} ({mp.illuminationPercent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => onAddAtDate(activeYear, activeMonthIndex, selectedDay)}
              className="w-full btn-accent py-1.5 px-3 rounded-[3px] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Event on this Day</span>
            </button>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-oros-500 text-xs">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No historical events recorded on this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-oros-850 border border-oros-750 rounded-[3px] space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded-[2px] ${
                        evt.importance === 'mythic' 
                          ? 'bg-amber-500/20 text-amber-300' 
                          : 'bg-accent/20 text-accent'
                      }`}>
                        {evt.importance}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditEvent(evt)}
                          className="p-1 rounded text-oros-400 hover:text-oros-100 hover:bg-oros-750 transition-colors"
                          title="Edit Event"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await confirmDialog({
                              title: 'Delete Event',
                              message: `Delete event "${evt.title}" from timeline?`,
                              confirmText: 'Delete',
                              variant: 'danger'
                            })
                            if (confirmed) {
                              onDeleteEvent(evt.id)
                            }
                          }}
                          className="p-1 rounded text-oros-400 hover:text-rose-400 hover:bg-oros-750 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-sans text-xs font-bold text-oros-100">
                      {evt.title}
                    </h4>

                    <p className="text-[11px] text-oros-300 leading-relaxed">
                      {evt.description || 'No lore description recorded.'}
                    </p>

                    {evt.entityIds.length > 0 && (
                      <div className="pt-2 border-t border-oros-800">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-oros-400 block mb-1">
                          Connected Entities:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {evt.entityIds.map(entId => {
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
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
