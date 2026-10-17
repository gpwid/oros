import React, { useState, useEffect } from 'react'
import { WorldCalendarConfig, WorldCalendarMonth } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { 
  X, Calendar, Sliders, Plus, Trash2, ArrowUp, ArrowDown, 
  RotateCcw, Sparkles, Sun, Compass, Check 
} from 'lucide-react'
import { 
  DEFAULT_FANTASY_CALENDAR_CONFIG, 
  GREGORIAN_CALENDAR_CONFIG, 
  SCIFI_SOL_CALENDAR_CONFIG 
} from '../../utils/calendarDefaults'

interface TimelineCalendarSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const TimelineCalendarSettingsModal: React.FC<TimelineCalendarSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { activeWorldId, getCalendarConfig, updateCalendarConfig } = useWorldStore()

  const currentConfig = getCalendarConfig(activeWorldId || undefined)

  // Local state for configuration
  const [firstYear, setFirstYear] = useState<number>(400)
  const [lastYear, setLastYear] = useState<number>(1200)
  const [yearPrefix, setYearPrefix] = useState<string>('Year')
  const [yearSuffix, setYearSuffix] = useState<string>('AC')
  const [hoursInDay, setHoursInDay] = useState<number>(24)
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([])
  const [months, setMonths] = useState<WorldCalendarMonth[]>([])
  const [newWeekday, setNewWeekday] = useState('')

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setFirstYear(currentConfig.firstYear ?? 400)
      setLastYear(currentConfig.lastYear ?? 1200)
      setYearPrefix(currentConfig.yearPrefix ?? 'Year')
      setYearSuffix(currentConfig.yearSuffix ?? 'AC')
      setHoursInDay(currentConfig.hoursInDay ?? 24)
      setDaysOfWeek([...(currentConfig.daysOfWeek || DEFAULT_FANTASY_CALENDAR_CONFIG.daysOfWeek)])
      setMonths(currentConfig.months ? currentConfig.months.map(m => ({ ...m })) : DEFAULT_FANTASY_CALENDAR_CONFIG.months)
    }
  }, [isOpen, currentConfig])

  if (!isOpen) return null

  // Month reordering
  const moveMonth = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === months.length - 1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const copy = [...months]
    const temp = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = temp
    setMonths(copy)
  }

  const updateMonth = (index: number, updates: Partial<WorldCalendarMonth>) => {
    setMonths(months.map((m, i) => i === index ? { ...m, ...updates } : m))
  }

  const addMonth = () => {
    const newMonthNum = months.length + 1
    const newMonth: WorldCalendarMonth = {
      id: `m-${Date.now()}`,
      name: `Month ${newMonthNum}`,
      days: 30,
      season: 'Neutral'
    }
    setMonths([...months, newMonth])
  }

  const removeMonth = (index: number) => {
    if (months.length <= 1) return
    setMonths(months.filter((_, i) => i !== index))
  }

  // Weekday management
  const addWeekday = () => {
    if (!newWeekday.trim()) return
    setDaysOfWeek([...daysOfWeek, newWeekday.trim()])
    setNewWeekday('')
  }

  const removeWeekday = (index: number) => {
    if (daysOfWeek.length <= 1) return
    setDaysOfWeek(daysOfWeek.filter((_, i) => i !== index))
  }

  // Preset loaders
  const applyPreset = (preset: WorldCalendarConfig) => {
    setFirstYear(preset.firstYear)
    setLastYear(preset.lastYear)
    setYearPrefix(preset.yearPrefix || '')
    setYearSuffix(preset.yearSuffix || '')
    setHoursInDay(preset.hoursInDay)
    setDaysOfWeek([...preset.daysOfWeek])
    setMonths(preset.months.map(m => ({ ...m })))
  }

  const handleSave = () => {
    if (!activeWorldId) return
    updateCalendarConfig(activeWorldId, {
      firstYear: Number(firstYear),
      lastYear: Number(lastYear),
      yearPrefix: yearPrefix.trim(),
      yearSuffix: yearSuffix.trim(),
      hoursInDay: Math.max(1, Number(hoursInDay)),
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
      months: months.length > 0 ? months : DEFAULT_FANTASY_CALENDAR_CONFIG.months
    })
    onClose()
  }

  const totalDaysInYear = months.reduce((acc, m) => acc + (Number(m.days) || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-oros-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-text text-oros-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-oros-750 bg-oros-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            <h3 className="font-sans font-bold text-sm tracking-wide text-oros-100">
              World Chronology & Calendar Engine Settings
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

        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-oros-950/60 border-b border-oros-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-oros-400">
            Quick Architecture Presets:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => applyPreset(DEFAULT_FANTASY_CALENDAR_CONFIG)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-200 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>High Fantasy (12 Seasons)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset(GREGORIAN_CALENDAR_CONFIG)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-200 transition-colors flex items-center gap-1"
            >
              <Sun className="w-3 h-3 text-sky-400" />
              <span>Solar Gregorian</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset(SCIFI_SOL_CALENDAR_CONFIG)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-200 transition-colors flex items-center gap-1"
            >
              <Compass className="w-3 h-3 text-emerald-400" />
              <span>Planetary Sol Cycle</span>
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Section 1: Timeline Horizon Bounds */}
          <div className="p-3.5 bg-oros-850/50 border border-oros-750 rounded-[3px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-oros-200 uppercase tracking-wider">
                1. Timeline Ruler Horizons & Epoch Labels
              </span>
              <span className="text-[10px] font-mono text-oros-400">
                Range: {yearPrefix} {firstYear} {yearSuffix} → {yearPrefix} {lastYear} {yearSuffix} ({lastYear - firstYear} yrs)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-oros-400 mb-1">First Year</label>
                <input
                  type="number"
                  value={firstYear}
                  onChange={(e) => setFirstYear(Number(e.target.value))}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-oros-400 mb-1">Last Year</label>
                <input
                  type="number"
                  value={lastYear}
                  onChange={(e) => setLastYear(Number(e.target.value))}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-oros-400 mb-1">Year Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. Year, Sol"
                  value={yearPrefix}
                  onChange={(e) => setYearPrefix(e.target.value)}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-oros-400 mb-1">Year Suffix</label>
                <input
                  type="text"
                  placeholder="e.g. AC, BCE, CE"
                  value={yearSuffix}
                  onChange={(e) => setYearSuffix(e.target.value)}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Diurnal & Planetary Day Cycle */}
          <div className="p-3.5 bg-oros-850/50 border border-oros-750 rounded-[3px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-oros-200 uppercase tracking-wider">
                2. Diurnal & Week Cycle
              </span>
              <span className="text-[10px] font-mono text-oros-400">
                {daysOfWeek.length} days/week · {hoursInDay}h/day
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-oros-400 mb-1">
                  Hours in a Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={hoursInDay}
                  onChange={(e) => setHoursInDay(Number(e.target.value))}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                />
                <span className="text-[9px] text-oros-500 mt-1 block">Standard Earth day is 24; fantasy/planetary cycles can be 20h, 28h, etc.</span>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-[10px] font-mono text-oros-400">
                  Custom Weekday Names ({daysOfWeek.length})
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-oros-850/90 border border-oros-750 rounded-[3px]">
                  {daysOfWeek.map((dayName, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-oros-800 border border-oros-700 text-oros-200 px-2 py-0.5 rounded-[2px]"
                    >
                      <span>{dayName}</span>
                      {daysOfWeek.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWeekday(idx)}
                          className="text-oros-400 hover:text-rose-400 transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New weekday name..."
                    value={newWeekday}
                    onChange={(e) => setNewWeekday(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWeekday())}
                    className="flex-1 bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1 text-xs text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addWeekday}
                    className="px-2.5 py-1 rounded-[3px] bg-oros-800 hover:bg-oros-750 border border-oros-700 text-xs font-semibold text-oros-200 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Day</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Months & Seasons Almanac */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-oros-200 uppercase tracking-wider block">
                  3. Months & Lore Almanac Structure
                </span>
                <span className="text-[10px] font-mono text-oros-400">
                  {months.length} months · Total {totalDaysInYear} days per solar year
                </span>
              </div>

              <button
                type="button"
                onClick={addMonth}
                className="btn-accent px-2.5 py-1 rounded-[3px] text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Add Month</span>
              </button>
            </div>

            {/* Months Table */}
            <div className="border border-oros-750 rounded-[3px] overflow-hidden bg-oros-850/40">
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-oros-850 border-b border-oros-750 text-[10px] font-mono uppercase tracking-wider text-oros-400">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Month Name</span>
                <span className="col-span-2">Days</span>
                <span className="col-span-3">Season</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              <div className="divide-y divide-oros-800 max-h-64 overflow-y-auto">
                {months.map((m, idx) => (
                  <div key={m.id || idx} className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center hover:bg-oros-800/30 transition-colors">
                    <span className="col-span-1 font-mono text-xs text-oros-400">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMonth(idx, { name: e.target.value })}
                      className="col-span-4 bg-oros-850 border border-oros-750 rounded-[2px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    />

                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={m.days}
                      onChange={(e) => updateMonth(idx, { days: Math.max(1, Number(e.target.value)) })}
                      className="col-span-2 bg-oros-850 border border-oros-750 rounded-[2px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="e.g. Winter"
                      value={m.season || ''}
                      onChange={(e) => updateMonth(idx, { season: e.target.value })}
                      className="col-span-3 bg-oros-850 border border-oros-750 rounded-[2px] px-2 py-1 text-xs text-oros-200 placeholder-oros-500 focus:border-accent focus:outline-none"
                    />

                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => moveMonth(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-oros-400 hover:text-oros-100 disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMonth(idx, 'down')}
                        disabled={idx === months.length - 1}
                        className="p-1 rounded text-oros-400 hover:text-oros-100 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMonth(idx)}
                        disabled={months.length <= 1}
                        className="p-1 rounded text-oros-400 hover:text-rose-400 disabled:opacity-20 transition-colors ml-1"
                        title="Delete Month"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-oros-750 bg-oros-900/90 shrink-0">
          <button
            type="button"
            onClick={() => applyPreset(DEFAULT_FANTASY_CALENDAR_CONFIG)}
            className="text-xs text-oros-400 hover:text-oros-200 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Standard Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[3px] border border-oros-700 bg-oros-850 hover:bg-oros-800 text-oros-300 hover:text-oros-100 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-accent px-4 py-1.5 rounded-[3px] text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Calendar Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
