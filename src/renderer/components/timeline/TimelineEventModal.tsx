import React, { useState, useEffect, useMemo } from 'react'
import { TimelineEvent, TimelinePeriodType, TimelineCategory, WorldCalendarConfig } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { 
  X, Zap, Clock, Calendar, Bookmark, ShieldAlert, Sparkles, 
  Swords, Crown, Hourglass, Flame, Shield, Users 
} from 'lucide-react'
import { 
  formatPeriodDuration, 
  PERIOD_TYPE_CONFIG 
} from '../../utils/calendarDefaults'

interface TimelineEventModalProps {
  isOpen: boolean
  onClose: () => void
  eventToEdit?: TimelineEvent | null
  initialDate?: {
    year?: number
    month?: number
    day?: number
    isPeriod?: boolean
    endYear?: number
    era?: string
  } | null
}

const CATEGORY_OPTIONS: { id: TimelineCategory; label: string }[] = [
  { id: 'political', label: 'Political & Governance' },
  { id: 'war', label: 'Military & War' },
  { id: 'astronomical', label: 'Astronomical & Celestial' },
  { id: 'birth-death', label: 'Birth & Mortality' },
  { id: 'discovery', label: 'Scientific / Discovery' },
  { id: 'arcane', label: 'Arcane & Magical' },
  { id: 'cultural', label: 'Cultural & Societal' }
]

const COLOR_PRESETS = [
  '#f59e0b', // Amber/Gold
  '#ef4444', // Crimson
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#ec4899', // Pink
]

export const TimelineEventModal: React.FC<TimelineEventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  initialDate
}) => {
  const { 
    activeWorldId, entities, timelines, getCalendarConfig,
    createTimelineEvent, updateTimelineEvent 
  } = useWorldStore()

  const calendarConfig: WorldCalendarConfig = useMemo(() => {
    return getCalendarConfig(activeWorldId || undefined)
  }, [getCalendarConfig, activeWorldId])

  const worldEvents = activeWorldId ? timelines[activeWorldId] || [] : []
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  // Known eras for autocomplete
  const existingEras = useMemo(() => {
    return Array.from(new Set(worldEvents.map(e => e.era || 'Universal Era'))).filter(Boolean)
  }, [worldEvents])

  // Form State
  const [isPeriod, setIsPeriod] = useState<boolean>(false)
  const [periodType, setPeriodType] = useState<TimelinePeriodType>('custom')
  const [title, setTitle] = useState('')
  const [era, setEra] = useState('Age of Concord')
  const [year, setYear] = useState<number>(850)
  const [month, setMonth] = useState<number | undefined>(undefined)
  const [day, setDay] = useState<number | undefined>(undefined)
  const [hour, setHour] = useState<number | undefined>(undefined)
  
  const [endYear, setEndYear] = useState<number>(860)
  const [endMonth, setEndMonth] = useState<number | undefined>(undefined)
  const [endDay, setEndDay] = useState<number | undefined>(undefined)

  const [category, setCategory] = useState<TimelineCategory>('political')
  const [importance, setImportance] = useState<TimelineEvent['importance']>('major')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>('')
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([])
  const [entityFilter, setEntityFilter] = useState('')

  // Sync state on open/edit
  useEffect(() => {
    if (eventToEdit) {
      setIsPeriod(Boolean(eventToEdit.isPeriod))
      setPeriodType(eventToEdit.periodType || 'custom')
      setTitle(eventToEdit.title)
      setEra(eventToEdit.era || existingEras[0] || 'Universal Era')
      setYear(eventToEdit.year)
      setMonth(eventToEdit.month)
      setDay(eventToEdit.day)
      setHour(eventToEdit.hour)
      setEndYear(eventToEdit.endYear ?? eventToEdit.year + 5)
      setEndMonth(eventToEdit.endMonth)
      setEndDay(eventToEdit.endDay)
      setCategory(eventToEdit.category || 'political')
      setImportance(eventToEdit.importance)
      setDescription(eventToEdit.description)
      setColor(eventToEdit.color || '')
      setSelectedEntityIds([...eventToEdit.entityIds])
    } else {
      // New Event / Period with optional initial dates
      const defEra = initialDate?.era || existingEras[0] || 'Age of Concord'
      const defYear = initialDate?.year !== undefined ? initialDate.year : 850
      const defIsPeriod = Boolean(initialDate?.isPeriod)
      const defEndYear = initialDate?.endYear !== undefined ? initialDate.endYear : defYear + 10

      setIsPeriod(defIsPeriod)
      setPeriodType('custom')
      setTitle('')
      setEra(defEra)
      setYear(defYear)
      setMonth(initialDate?.month)
      setDay(initialDate?.day)
      setHour(undefined)
      setEndYear(defEndYear)
      setEndMonth(initialDate?.month)
      setEndDay(initialDate?.day)
      setCategory('political')
      setImportance('major')
      setDescription('')
      setColor('')
      setSelectedEntityIds([])
    }
    setEntityFilter('')
  }, [eventToEdit, initialDate, isOpen])

  if (!isOpen) return null

  // Live duration calculation
  const computedDuration = isPeriod 
    ? formatPeriodDuration(year, endYear, month, endMonth, day, endDay, calendarConfig)
    : null

  // Days in selected start and end months
  const startMonthDays = month ? calendarConfig.months[month - 1]?.days || 30 : 30
  const endMonthDays = endMonth ? calendarConfig.months[endMonth - 1]?.days || 30 : 30

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload: Omit<TimelineEvent, 'id' | 'worldId'> = {
      isPeriod,
      periodType: isPeriod ? periodType : undefined,
      era: era.trim() || 'Universal Era',
      year: Number(year),
      month: month ? Number(month) : undefined,
      day: day ? Number(day) : undefined,
      hour: hour !== undefined ? Number(hour) : undefined,
      endYear: isPeriod ? Number(endYear) : undefined,
      endMonth: isPeriod && endMonth ? Number(endMonth) : undefined,
      endDay: isPeriod && endDay ? Number(endDay) : undefined,
      category,
      importance,
      title: title.trim(),
      description: description.trim(),
      entityIds: selectedEntityIds,
      color: color || (isPeriod ? PERIOD_TYPE_CONFIG[periodType]?.color : undefined)
    }

    if (eventToEdit) {
      updateTimelineEvent(eventToEdit.id, payload)
    } else {
      createTimelineEvent(payload)
    }

    onClose()
  }

  const toggleEntity = (id: string) => {
    if (selectedEntityIds.includes(id)) {
      setSelectedEntityIds(selectedEntityIds.filter(eId => eId !== id))
    } else {
      setSelectedEntityIds([...selectedEntityIds, id])
    }
  }

  const filteredEntities = worldEntities.filter(ent => 
    ent.title.toLowerCase().includes(entityFilter.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-oros-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-text text-oros-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-oros-750/80 bg-oros-900/90 shrink-0">
          <div className="flex items-center gap-2">
            {isPeriod ? (
              <Clock className="w-4 h-4 text-accent" />
            ) : (
              <Zap className="w-4 h-4 text-accent" />
            )}
            <h3 className="font-sans font-bold text-sm tracking-wide text-oros-100">
              {eventToEdit ? (isPeriod ? 'Edit Time Period' : 'Edit Timeline Event') : (isPeriod ? 'Record Time Period' : 'Record Milestone Event')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-oros-400 hover:text-oros-100 p-1 rounded-[3px] hover:bg-oros-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="px-5 pt-4 pb-2 border-b border-oros-800/80 bg-oros-950/40">
          <div className="flex items-center gap-1 p-0.5 bg-oros-850/80 border border-oros-750 rounded-[3px] w-fit">
            <button
              type="button"
              onClick={() => setIsPeriod(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold transition-all ${
                !isPeriod 
                  ? 'bg-oros-800 text-oros-50 border border-oros-700/80 shadow-sm' 
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Single Event (Milestone)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPeriod(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold transition-all ${
                isPeriod 
                  ? 'bg-oros-800 text-oros-50 border border-oros-700/80 shadow-sm' 
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Time Period (Duration Span)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-oros-300 uppercase tracking-wider mb-1.5">
              {isPeriod ? 'Period Name / Title *' : 'Event Title *'}
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={isPeriod ? 'e.g. The Obsidian War, Reign of Katherine II' : 'e.g. Coronation of the Sunken Throne'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-3 py-2 text-xs text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Era & Period Classification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-oros-300 uppercase tracking-wider mb-1.5">
                Historical Era
              </label>
              <input
                type="text"
                list="timeline-eras-list"
                value={era}
                onChange={(e) => setEra(e.target.value)}
                placeholder="e.g. Age of Concord, First Age"
                className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none"
              />
              <datalist id="timeline-eras-list">
                {existingEras.map((er) => (
                  <option key={er} value={er} />
                ))}
              </datalist>
            </div>

            {isPeriod ? (
              <div>
                <label className="block text-[11px] font-semibold text-oros-300 uppercase tracking-wider mb-1.5">
                  Period Classification
                </label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as TimelinePeriodType)}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 focus:border-accent focus:outline-none"
                >
                  {Object.entries(PERIOD_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-oros-300 uppercase tracking-wider mb-1.5">
                  Thematic Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TimelineCategory)}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 focus:border-accent focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Temporal Coordinates */}
          {!isPeriod ? (
            /* Single Event Date Fields */
            <div className="p-3 bg-oros-850/50 border border-oros-750/70 rounded-[3px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-oros-400">
                  Milestone Date Coordinates
                </span>
                <span className="text-[10px] font-mono text-oros-400">
                  {calendarConfig.yearPrefix} {year} {calendarConfig.yearSuffix}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-oros-400 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-oros-400 mb-1">
                    Month (Optional)
                  </label>
                  <select
                    value={month || ''}
                    onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 focus:border-accent focus:outline-none"
                  >
                    <option value="">-- No Month --</option>
                    {calendarConfig.months.map((m, idx) => (
                      <option key={m.id} value={idx + 1}>
                        {m.name} ({m.days}d)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-oros-400 mb-1">
                    Day (1..{startMonthDays})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={startMonthDays}
                    placeholder="Day"
                    value={day || ''}
                    onChange={(e) => setDay(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-oros-400 mb-1">
                    Hour (0..{calendarConfig.hoursInDay - 1})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={calendarConfig.hoursInDay - 1}
                    placeholder="Hour"
                    value={hour !== undefined ? hour : ''}
                    onChange={(e) => setHour(e.target.value !== '' ? Number(e.target.value) : undefined)}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Period Duration Fields */
            <div className="p-3 bg-oros-850/50 border border-oros-750/70 rounded-[3px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-oros-400">
                  Duration Span Coordinates
                </span>
                {computedDuration && (
                  <span className="text-[11px] font-mono font-bold text-accent px-2 py-0.5 bg-accent/10 border border-accent/30 rounded-[2px]">
                    Span: {computedDuration}
                  </span>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-oros-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Start Horizon</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono text-oros-400 mb-0.5">Start Year *</label>
                    <input
                      type="number"
                      required
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-oros-400 mb-0.5">Start Month</label>
                    <select
                      value={month || ''}
                      onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-1.5 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    >
                      <option value="">Month</option>
                      {calendarConfig.months.map((m, idx) => (
                        <option key={m.id} value={idx + 1}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-oros-400 mb-0.5">Start Day</label>
                    <input
                      type="number"
                      min={1}
                      max={startMonthDays}
                      placeholder="Day"
                      value={day || ''}
                      onChange={(e) => setDay(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-1.5 pt-1 border-t border-oros-800">
                <div className="text-[10px] font-semibold text-oros-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Conclusion / End Horizon</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono text-oros-400 mb-0.5">End Year *</label>
                    <input
                      type="number"
                      required
                      value={endYear}
                      onChange={(e) => setEndYear(Number(e.target.value))}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-oros-400 mb-0.5">End Month</label>
                    <select
                      value={endMonth || ''}
                      onChange={(e) => setEndMonth(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-1.5 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    >
                      <option value="">Month</option>
                      {calendarConfig.months.map((m, idx) => (
                        <option key={m.id} value={idx + 1}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-oros-400 mb-0.5">End Day</label>
                    <input
                      type="number"
                      min={1}
                      max={endMonthDays}
                      placeholder="Day"
                      value={endDay || ''}
                      onChange={(e) => setEndDay(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Importance & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-oros-300 uppercase tracking-wider mb-1.5">
                Historical Significance
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['mythic', 'major', 'minor'] as const).map((imp) => (
                  <button
                    key={imp}
                    type="button"
                    onClick={() => setImportance(imp)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-[3px] border transition-all text-center capitalize ${
                      importance === imp
                        ? imp === 'mythic'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                          : imp === 'major'
                          ? 'bg-accent/20 text-accent border-accent/50 shadow-sm'
                          : 'bg-oros-800 text-oros-200 border-oros-650 shadow-sm'
                        : 'bg-oros-850 text-oros-400 border-oros-750 hover:bg-oros-800/60'
                    }`}
                  >
                    {imp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-oros-300 uppercase tracking-wider mb-1.5">
                Accent / Milestone Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    className={`w-6 h-6 rounded-[2px] transition-transform ${
                      color === preset ? 'ring-2 ring-oros-100 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset }}
                  />
                ))}
                {color && (
                  <button
                    type="button"
                    onClick={() => setColor('')}
                    className="text-[10px] text-oros-400 hover:text-oros-200 underline ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-oros-300 uppercase tracking-wider mb-1.5">
              Historical Chronicle Entry & Lore Notes
            </label>
            <textarea
              rows={3}
              placeholder="Describe the diplomatic, military, or metaphysical repercussions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-3 py-2 text-xs text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Connected Lore Entities */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-oros-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-oros-400" />
                <span>Connected Lore Entities ({selectedEntityIds.length})</span>
              </label>
              {worldEntities.length > 6 && (
                <input
                  type="text"
                  placeholder="Filter entities..."
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="bg-oros-850 border border-oros-750 rounded-[2px] px-2 py-0.5 text-[10px] text-oros-200 placeholder-oros-500 focus:outline-none w-32"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-oros-850/60 border border-oros-750/80 rounded-[3px]">
              {filteredEntities.length === 0 ? (
                <span className="text-[11px] text-oros-500 italic">No matching entities in world archive.</span>
              ) : (
                filteredEntities.map((ent) => {
                  const isSelected = selectedEntityIds.includes(ent.id)
                  return (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() => toggleEntity(ent.id)}
                      className={`text-[11px] px-2 py-0.5 rounded-[2px] border transition-colors flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-accent/20 text-accent border-accent/50 font-semibold' 
                          : 'bg-oros-800 text-oros-300 border-oros-750 hover:bg-oros-750'
                      }`}
                    >
                      <span>{ent.title}</span>
                      <span className="text-[9px] text-oros-400 capitalize">({ent.type})</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-oros-750">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[3px] border border-oros-700 bg-oros-850 hover:bg-oros-800 text-oros-300 hover:text-oros-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-accent px-4 py-1.5 rounded-[3px] text-xs font-bold shadow-sm transition-colors"
            >
              {eventToEdit ? 'Save Changes' : (isPeriod ? 'Record Period' : 'Record Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
