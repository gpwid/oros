import React, { useState, useEffect, useMemo } from 'react'
import { TimelineEvent, TimelinePeriodType, TimelineCategory, WorldCalendarConfig } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { 
  X, Zap, Clock, Bookmark, ShieldAlert, Sparkles, Plus,
  ChevronDown, Check
} from 'lucide-react'
import { 
  formatPeriodDuration, 
  PERIOD_TYPE_CONFIG,
  DEFAULT_TIMELINE_CATEGORIES,
  DEFAULT_PERIOD_CLASSIFICATIONS,
  findEraForYear,
  getPeriodTypeConfig
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

export const TimelineEventModal: React.FC<TimelineEventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  initialDate
}) => {
  const { 
    activeWorldId, entities, getCalendarConfig,
    createTimelineEvent, updateTimelineEvent 
  } = useWorldStore()

  const calendarConfig: WorldCalendarConfig = useMemo(() => {
    return getCalendarConfig(activeWorldId || undefined)
  }, [getCalendarConfig, activeWorldId])

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  // Combine default categories with custom world categories
  const categoriesList = useMemo(() => {
    const list = [...DEFAULT_TIMELINE_CATEGORIES]
    if (calendarConfig.customCategories) {
      calendarConfig.customCategories.forEach(custom => {
        if (!list.some(c => c.id === custom.id)) {
          list.push(custom)
        }
      })
    }
    return list
  }, [calendarConfig.customCategories])

  // Combine default period types with custom world period types
  const periodTypesList = useMemo(() => {
    const list = [...DEFAULT_PERIOD_CLASSIFICATIONS]
    if (calendarConfig.customPeriodTypes) {
      calendarConfig.customPeriodTypes.forEach(custom => {
        if (!list.some(p => p.id === custom.id)) {
          list.push(custom)
        }
      })
    }
    return list
  }, [calendarConfig.customPeriodTypes])

  // Form State
  const [isPeriod, setIsPeriod] = useState<boolean>(false)
  const [periodType, setPeriodType] = useState<TimelinePeriodType>('custom')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState<number>(850)
  const [month, setMonth] = useState<number | undefined>(undefined)
  const [day, setDay] = useState<number | undefined>(undefined)
  
  const [endYear, setEndYear] = useState<number>(860)
  const [endMonth, setEndMonth] = useState<number | undefined>(undefined)
  const [endDay, setEndDay] = useState<number | undefined>(undefined)

  const [category, setCategory] = useState<TimelineCategory>('political')
  const [importance, setImportance] = useState<TimelineEvent['importance']>('major')
  const [description, setDescription] = useState('')
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([])
  
  // Historical Era state (auto-detected with manual override)
  const [isEraOverridden, setIsEraOverridden] = useState<boolean>(false)
  const [customEra, setCustomEra] = useState<string>('')

  // Auto-detect era from year
  const detectedEra = useMemo(() => {
    return findEraForYear(year, calendarConfig.eras)
  }, [year, calendarConfig.eras])

  const activeEraName = useMemo(() => {
    if (isEraOverridden && customEra.trim()) return customEra.trim()
    if (detectedEra) return detectedEra.name
    return 'Universal Era'
  }, [isEraOverridden, customEra, detectedEra])

  // Sync state on open/edit
  useEffect(() => {
    if (eventToEdit) {
      setIsPeriod(Boolean(eventToEdit.isPeriod))
      setPeriodType(eventToEdit.periodType || 'custom')
      setTitle(eventToEdit.title)
      setYear(eventToEdit.year)
      setMonth(eventToEdit.month)
      setDay(eventToEdit.day)
      setEndYear(eventToEdit.endYear ?? eventToEdit.year + 10)
      setEndMonth(eventToEdit.endMonth)
      setEndDay(eventToEdit.endDay)
      setCategory(eventToEdit.category || 'political')
      setImportance(eventToEdit.importance || 'major')
      setDescription(eventToEdit.description || '')
      setSelectedEntityIds(eventToEdit.entityIds || [])
      
      // If event era is different from what auto-detection would give for this year, keep it as override
      const autoEra = findEraForYear(eventToEdit.year, calendarConfig.eras)
      if (eventToEdit.era && (!autoEra || autoEra.name !== eventToEdit.era)) {
        setIsEraOverridden(true)
        setCustomEra(eventToEdit.era)
      } else {
        setIsEraOverridden(false)
        setCustomEra('')
      }
    } else if (initialDate) {
      setIsPeriod(Boolean(initialDate.isPeriod))
      setPeriodType('custom')
      setTitle('')
      setYear(initialDate.year ?? 850)
      setMonth(initialDate.month)
      setDay(initialDate.day)
      setEndYear(initialDate.endYear ?? (initialDate.year ? initialDate.year + 10 : 860))
      setEndMonth(undefined)
      setEndDay(undefined)
      setCategory('political')
      setImportance('major')
      setDescription('')
      setSelectedEntityIds([])
      setIsEraOverridden(false)
      setCustomEra('')
    } else {
      setIsPeriod(false)
      setPeriodType('custom')
      setTitle('')
      setYear(850)
      setMonth(undefined)
      setDay(undefined)
      setEndYear(860)
      setEndMonth(undefined)
      setEndDay(undefined)
      setCategory('political')
      setImportance('major')
      setDescription('')
      setSelectedEntityIds([])
      setIsEraOverridden(false)
      setCustomEra('')
    }
  }, [eventToEdit, initialDate, isOpen, calendarConfig.eras])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const periodCfg = getPeriodTypeConfig(periodType, calendarConfig.customPeriodTypes)

    const payload: Omit<TimelineEvent, 'id' | 'worldId'> = {
      isPeriod,
      periodType: isPeriod ? periodType : undefined,
      era: activeEraName,
      year: Number(year),
      month: month ? Number(month) : undefined,
      day: day ? Number(day) : undefined,
      endYear: isPeriod ? Number(endYear) : undefined,
      endMonth: isPeriod && endMonth ? Number(endMonth) : undefined,
      endDay: isPeriod && endDay ? Number(endDay) : undefined,
      category,
      importance,
      title: title.trim(),
      description: description.trim(),
      entityIds: selectedEntityIds,
      color: isPeriod ? periodCfg.color : undefined
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

  const durationStr = isPeriod ? formatPeriodDuration(
    year,
    endYear,
    month,
    endMonth,
    day,
    endDay,
    calendarConfig
  ) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-oros-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl flex flex-col max-h-[480px] overflow-hidden select-text text-oros-100 animate-modal-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Mode Toggle */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-oros-750/80 bg-oros-900 shrink-0">
          <div className="flex items-center gap-2">
            {isPeriod ? (
              <Clock className="w-3.5 h-3.5 text-accent" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-accent" />
            )}
            <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-oros-100">
              {eventToEdit ? (isPeriod ? 'Edit Period Span' : 'Edit Timeline Event') : (isPeriod ? 'New Period Span' : 'New Milestone Event')}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Compact Mode Switcher */}
            <div className="flex items-center bg-oros-850 border border-oros-750 rounded-[2px] p-0.5">
              <button
                type="button"
                onClick={() => setIsPeriod(false)}
                className={`px-2 py-0.5 rounded-[1px] text-[10px] font-sans font-medium transition-colors ${
                  !isPeriod ? 'bg-oros-750 text-oros-100 shadow-sm' : 'text-oros-400 hover:text-oros-200'
                }`}
              >
                Milestone
              </button>
              <button
                type="button"
                onClick={() => setIsPeriod(true)}
                className={`px-2 py-0.5 rounded-[1px] text-[10px] font-sans font-medium transition-colors ${
                  isPeriod ? 'bg-oros-750 text-oros-100 shadow-sm' : 'text-oros-400 hover:text-oros-200'
                }`}
              >
                Period Span
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-oros-400 hover:text-oros-100 p-1 rounded-[2px] hover:bg-oros-800 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form id="timeline-event-form" onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
              Title / Designation *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isPeriod ? "Period title..." : "Milestone title..."}
              className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Date Row: Start (or Milestone) Date */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
              {isPeriod ? 'Start Horizon' : 'Chronology Date'}
            </label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <div className="relative flex items-center">
                  <span className="absolute left-2 font-mono text-[10px] text-oros-400">Yr</span>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] pl-7 pr-2 py-1 text-xs font-mono font-medium text-oros-100 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="col-span-4">
                <select
                  value={month ?? ''}
                  onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-200 focus:border-accent focus:outline-none"
                >
                  <option value="">Month...</option>
                  {calendarConfig.months.map((m, idx) => (
                    <option key={m.id} value={idx + 1}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  placeholder="Day"
                  value={day ?? ''}
                  onChange={(e) => setDay(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Inline Historical Era Badge */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-oros-400">
              <span className="text-oros-400">Era:</span>
              {!isEraOverridden ? (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-oros-850 border border-oros-750 text-oros-200">
                  <span 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: detectedEra?.color || 'var(--oros-accent)' }} 
                  />
                  <span className="font-semibold">{activeEraName}</span>
                  {detectedEra && <span className="text-[9px] text-oros-400">· {detectedEra.startYear}–{detectedEra.endYear}</span>}
                </div>
              ) : (
                <input
                  type="text"
                  value={customEra}
                  onChange={(e) => setCustomEra(e.target.value)}
                  placeholder="Custom Era Name..."
                  className="bg-oros-850 border border-accent rounded-[2px] px-1.5 py-0.5 text-xs text-oros-100 focus:outline-none w-40"
                />
              )}

              <button
                type="button"
                onClick={() => {
                  if (isEraOverridden) {
                    setIsEraOverridden(false)
                    setCustomEra('')
                  } else {
                    setIsEraOverridden(true)
                    setCustomEra(activeEraName)
                  }
                }}
                className="text-[10px] text-accent hover:underline ml-1"
              >
                {isEraOverridden ? 'Auto-detect' : 'Override'}
              </button>
            </div>
          </div>

          {/* Period Range Row (Only if isPeriod) */}
          {isPeriod && (
            <div className="pt-2 border-t border-oros-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase font-semibold text-oros-400">
                  End Horizon & Classification
                </label>
                {durationStr && (
                  <span className="font-mono text-[10px] font-bold text-accent bg-oros-850 px-1.5 py-0.5 rounded-[2px] border border-oros-750">
                    Duration: {durationStr}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 font-mono text-[10px] text-oros-400">End</span>
                    <input
                      type="number"
                      required
                      value={endYear}
                      onChange={(e) => setEndYear(parseInt(e.target.value) || 0)}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] pl-8 pr-2 py-1 text-xs font-mono font-medium text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-4">
                  <select
                    value={endMonth ?? ''}
                    onChange={(e) => setEndMonth(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-200 focus:border-accent focus:outline-none"
                  >
                    <option value="">End Mo...</option>
                    {calendarConfig.months.map((m, idx) => (
                      <option key={m.id} value={idx + 1}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="End Day"
                    value={endDay ?? ''}
                    onChange={(e) => setEndDay(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Period Classification
                </label>
                <div className="flex flex-wrap gap-1">
                  {periodTypesList.map((pt) => {
                    const isSelected = periodType === pt.id
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => setPeriodType(pt.id as TimelinePeriodType)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] text-[11px] font-sans border transition-colors ${
                          isSelected 
                            ? 'bg-oros-800 text-oros-50 border-accent font-semibold shadow-sm' 
                            : 'bg-oros-850 text-oros-400 border-oros-750 hover:text-oros-200 hover:border-oros-700'
                        }`}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: pt.color }} 
                        />
                        <span>{pt.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Unified Metadata Row: Category & Significance */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                Thematic Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TimelineCategory)}
                className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-200 focus:border-accent focus:outline-none"
              >
                {categoriesList.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                Historical Significance
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as TimelineEvent['importance'])}
                className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-200 focus:border-accent focus:outline-none"
              >
                <option value="major">Major Event</option>
                <option value="mythic">Mythic / World-Shaping</option>
                <option value="minor">Minor / Local Record</option>
              </select>
            </div>
          </div>

          {/* Connected Lore Entities (Compact Chip Tag Selector) */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
              Connected Lore Cards ({selectedEntityIds.length})
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-oros-850 border border-oros-750 rounded-[3px] min-h-[32px]">
              {selectedEntityIds.map(id => {
                const ent = worldEntities.find(e => e.id === id)
                if (!ent) return null
                return (
                  <span 
                    key={id} 
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-oros-800 border border-oros-700 text-[11px] text-oros-200"
                  >
                    <span>{ent.title}</span>
                    <button 
                      type="button" 
                      onClick={() => toggleEntity(id)} 
                      className="text-oros-400 hover:text-rose-400 text-xs leading-none ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )
              })}

              {/* Add Entity Picker */}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) toggleEntity(e.target.value)
                }}
                className="text-[11px] bg-oros-900 border border-dashed border-oros-700 rounded-[2px] px-1.5 py-0.5 text-oros-300 hover:text-oros-100 cursor-pointer focus:outline-none"
              >
                <option value="">+ Link Card...</option>
                {worldEntities.filter(e => !selectedEntityIds.includes(e.id)).map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lore Notes / Description */}
          <div>
            <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
              Historical Chronicle Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chronicle notes, historical consequences, or key figures..."
              className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none resize-none"
            />
          </div>
        </form>

        {/* Guaranteed Visible Pinned Footer */}
        <div className="px-4 py-2.5 border-t border-oros-750/80 bg-oros-900 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="timeline-event-form"
            className="btn-accent px-4 py-1 rounded-[3px] text-xs font-bold shadow-sm transition-colors"
          >
            {eventToEdit ? 'Save Changes' : (isPeriod ? 'Record Period' : 'Record Event')}
          </button>
        </div>
      </div>
    </div>
  )
}
