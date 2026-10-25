import React, { useState, useEffect } from 'react'
import { 
  WorldCalendarConfig, 
  WorldCalendarMonth, 
  WorldEraDefinition, 
  TimelineCategoryDefinition, 
  TimelinePeriodClassification,
  CalendarPreset,
  CalendarLeapRule,
  IntercalaryDay,
  CelestialMoonConfig
} from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { 
  X, Sliders, Plus, Trash2, ArrowUp, ArrowDown, 
  Sparkles, Clock, Calendar, Bookmark, Save, Check, RefreshCw, Moon
} from 'lucide-react'
import { 
  DEFAULT_FANTASY_CALENDAR_CONFIG, 
  DEFAULT_TIMELINE_CATEGORIES,
  DEFAULT_PERIOD_CLASSIFICATIONS,
  getAllCalendarPresets,
  saveCalendarPreset,
  deleteCalendarPreset
} from '../../utils/calendarDefaults'

interface TimelineCalendarSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsTab = 'horizons' | 'months' | 'leapRules' | 'intercalary' | 'moons' | 'eras' | 'categories' | 'presets'

export const TimelineCalendarSettingsModal: React.FC<TimelineCalendarSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { activeWorldId, getCalendarConfig, updateCalendarConfig } = useWorldStore()

  const currentConfig = getCalendarConfig(activeWorldId || undefined)

  // Active Tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('horizons')

  // Local state for configuration
  const [firstYear, setFirstYear] = useState<number>(400)
  const [lastYear, setLastYear] = useState<number>(1200)
  const [yearPrefix, setYearPrefix] = useState<string>('Year')
  const [yearSuffix, setYearSuffix] = useState<string>('AC')
  const [hoursInDay, setHoursInDay] = useState<number>(24)
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([])
  const [months, setMonths] = useState<WorldCalendarMonth[]>([])
  const [eras, setEras] = useState<WorldEraDefinition[]>([])
  const [customCategories, setCustomCategories] = useState<TimelineCategoryDefinition[]>([])
  const [customPeriodTypes, setCustomPeriodTypes] = useState<TimelinePeriodClassification[]>([])
  const [hasYearZero, setHasYearZero] = useState<boolean>(false)
  const [weekdayEpochOffset, setWeekdayEpochOffset] = useState<number>(0)
  const [leapRules, setLeapRules] = useState<CalendarLeapRule[]>([])
  const [intercalaryDays, setIntercalaryDays] = useState<IntercalaryDay[]>([])
  const [moons, setMoons] = useState<CelestialMoonConfig[]>([])
  
  const [newWeekday, setNewWeekday] = useState('')

  // Leap rule creation state
  const [newLeapName, setNewLeapName] = useState('')
  const [newLeapInterval, setNewLeapInterval] = useState<number>(4)
  const [newLeapOffset, setNewLeapOffset] = useState<number>(0)
  const [newLeapExtraDays, setNewLeapExtraDays] = useState<number>(1)
  const [newLeapTargetMonthId, setNewLeapTargetMonthId] = useState<string>('')
  const [newLeapExcludeInterval, setNewLeapExcludeInterval] = useState<number | ''>('')
  const [newLeapReinstateInterval, setNewLeapReinstateInterval] = useState<number | ''>('')

  // Intercalary day creation state
  const [newIntercalaryName, setNewIntercalaryName] = useState('')
  const [newIntercalaryAfterMonthId, setNewIntercalaryAfterMonthId] = useState<string>('')
  const [newIntercalaryIsLeapOnly, setNewIntercalaryIsLeapOnly] = useState<boolean>(false)
  const [newIntercalaryAdvancesWeekday, setNewIntercalaryAdvancesWeekday] = useState<boolean>(false)
  const [newIntercalaryDescription, setNewIntercalaryDescription] = useState('')

  // Celestial moon creation state
  const [newMoonName, setNewMoonName] = useState('')
  const [newMoonPeriod, setNewMoonPeriod] = useState<number>(28.0)
  const [newMoonEpochPhase, setNewMoonEpochPhase] = useState<number>(0.0)
  const [newMoonColor, setNewMoonColor] = useState('#e2e8f0')
  const [newMoonDescription, setNewMoonDescription] = useState('')

  // Presets state
  const [presetsList, setPresetsList] = useState<CalendarPreset[]>([])
  const [newPresetName, setNewPresetName] = useState('')
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null)

  // New Category / Period Type / Era inline creation state
  const [newEraName, setNewEraName] = useState('')
  const [newEraStart, setNewEraStart] = useState<number>(400)
  const [newEraEnd, setNewEraEnd] = useState<number>(650)
  const [newEraColor, setNewEraColor] = useState('#6366f1')

  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#3b82f6')

  const [newPeriodTypeName, setNewPeriodTypeName] = useState('')
  const [newPeriodTypeColor, setNewPeriodTypeColor] = useState('#f87171')

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
      setEras(currentConfig.eras ? currentConfig.eras.map(e => ({ ...e })) : (DEFAULT_FANTASY_CALENDAR_CONFIG.eras || []))
      setCustomCategories(currentConfig.customCategories ? [...currentConfig.customCategories] : [...DEFAULT_TIMELINE_CATEGORIES])
      setCustomPeriodTypes(currentConfig.customPeriodTypes ? [...currentConfig.customPeriodTypes] : [...DEFAULT_PERIOD_CLASSIFICATIONS])
      setHasYearZero(currentConfig.hasYearZero ?? false)
      setWeekdayEpochOffset(currentConfig.weekdayEpochOffset ?? 0)
      setLeapRules(currentConfig.leapRules ? currentConfig.leapRules.map(r => ({ ...r })) : (DEFAULT_FANTASY_CALENDAR_CONFIG.leapRules ? DEFAULT_FANTASY_CALENDAR_CONFIG.leapRules.map(r => ({ ...r })) : []))
      setIntercalaryDays(currentConfig.intercalaryDays ? currentConfig.intercalaryDays.map(i => ({ ...i })) : (DEFAULT_FANTASY_CALENDAR_CONFIG.intercalaryDays ? DEFAULT_FANTASY_CALENDAR_CONFIG.intercalaryDays.map(i => ({ ...i })) : []))
      setMoons(currentConfig.moons ? currentConfig.moons.map(m => ({ ...m })) : (DEFAULT_FANTASY_CALENDAR_CONFIG.moons ? DEFAULT_FANTASY_CALENDAR_CONFIG.moons.map(m => ({ ...m })) : []))
      setPresetsList(getAllCalendarPresets())
      setPresetFeedback(null)
    }
  }, [isOpen, currentConfig])

  if (!isOpen) return null

  // Month handlers
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

  // Era management
  const addEra = () => {
    if (!newEraName.trim()) return
    const newEra: WorldEraDefinition = {
      id: `era-${Date.now()}`,
      name: newEraName.trim(),
      startYear: Number(newEraStart),
      endYear: Number(newEraEnd),
      color: newEraColor
    }
    setEras([...eras, newEra])
    setNewEraName('')
  }

  const removeEra = (id: string) => {
    setEras(eras.filter(e => e.id !== id))
  }

  // Custom Category management
  const addCategory = () => {
    if (!newCatName.trim()) return
    const id = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    if (customCategories.some(c => c.id === id)) return
    setCustomCategories([...customCategories, { id, name: newCatName.trim(), color: newCatColor }])
    setNewCatName('')
  }

  const removeCategory = (id: string) => {
    setCustomCategories(customCategories.filter(c => c.id !== id))
  }

  // Custom Period Type management
  const addPeriodType = () => {
    if (!newPeriodTypeName.trim()) return
    const id = newPeriodTypeName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    if (customPeriodTypes.some(p => p.id === id)) return
    setCustomPeriodTypes([...customPeriodTypes, { id, name: newPeriodTypeName.trim(), color: newPeriodTypeColor }])
    setNewPeriodTypeName('')
  }

  const removePeriodType = (id: string) => {
    setCustomPeriodTypes(customPeriodTypes.filter(p => p.id !== id))
  }

  // Leap Rules management
  const addLeapRule = () => {
    if (!newLeapName.trim() || newLeapInterval <= 0) return
    const targetMonth = newLeapTargetMonthId || (months[0]?.id ?? 'm-1')
    const rule: CalendarLeapRule = {
      id: `lr-${Date.now()}`,
      name: newLeapName.trim(),
      interval: Number(newLeapInterval),
      offsetYear: Number(newLeapOffset) || 0,
      extraDays: Number(newLeapExtraDays) || 1,
      targetMonthId: targetMonth,
      excludeInterval: newLeapExcludeInterval ? Number(newLeapExcludeInterval) : undefined,
      reinstateInterval: newLeapReinstateInterval ? Number(newLeapReinstateInterval) : undefined
    }
    setLeapRules([...leapRules, rule])
    setNewLeapName('')
    setNewLeapInterval(4)
    setNewLeapOffset(0)
    setNewLeapExtraDays(1)
    setNewLeapExcludeInterval('')
    setNewLeapReinstateInterval('')
  }

  const removeLeapRule = (id: string) => {
    setLeapRules(leapRules.filter(r => r.id !== id))
  }

  // Intercalary Days management
  const addIntercalaryDay = () => {
    if (!newIntercalaryName.trim()) return
    const targetMonth = newIntercalaryAfterMonthId || (months[0]?.id ?? 'm-1')
    const item: IntercalaryDay = {
      id: `ic-${Date.now()}`,
      name: newIntercalaryName.trim(),
      occursAfterMonthId: targetMonth,
      isLeapOnly: newIntercalaryIsLeapOnly,
      advancesWeekday: newIntercalaryAdvancesWeekday,
      description: newIntercalaryDescription.trim() || undefined
    }
    setIntercalaryDays([...intercalaryDays, item])
    setNewIntercalaryName('')
    setNewIntercalaryDescription('')
    setNewIntercalaryIsLeapOnly(false)
    setNewIntercalaryAdvancesWeekday(false)
  }

  const removeIntercalaryDay = (id: string) => {
    setIntercalaryDays(intercalaryDays.filter(i => i.id !== id))
  }

  // Celestial Moons management
  const addMoon = () => {
    if (!newMoonName.trim() || newMoonPeriod <= 0) return
    const moon: CelestialMoonConfig = {
      id: `moon-${Date.now()}`,
      name: newMoonName.trim(),
      synodicPeriodDays: Number(newMoonPeriod),
      epochPhase: Math.max(0, Math.min(1, Number(newMoonEpochPhase))),
      color: newMoonColor || '#e2e8f0',
      radiusPixels: 8,
      description: newMoonDescription.trim() || undefined
    }
    setMoons([...moons, moon])
    setNewMoonName('')
    setNewMoonPeriod(28.0)
    setNewMoonEpochPhase(0.0)
    setNewMoonDescription('')
  }

  const removeMoon = (id: string) => {
    setMoons(moons.filter(m => m.id !== id))
  }

  // Current config as preset object
  const getCurrentDraftConfig = (): Omit<WorldCalendarConfig, 'worldId'> => ({
    firstYear: Number(firstYear),
    lastYear: Number(lastYear),
    yearPrefix: yearPrefix.trim(),
    yearSuffix: yearSuffix.trim(),
    hoursInDay: Math.max(1, Number(hoursInDay)),
    daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    months: months.length > 0 ? months : DEFAULT_FANTASY_CALENDAR_CONFIG.months,
    eras: eras.length > 0 ? eras : (DEFAULT_FANTASY_CALENDAR_CONFIG.eras || []),
    customCategories,
    customPeriodTypes,
    hasYearZero,
    weekdayEpochOffset: Number(weekdayEpochOffset) || 0,
    leapRules,
    intercalaryDays,
    moons
  })

  // Presets actions
  const applyPreset = (preset: CalendarPreset) => {
    const cfg = preset.config
    setFirstYear(cfg.firstYear)
    setLastYear(cfg.lastYear)
    setYearPrefix(cfg.yearPrefix || '')
    setYearSuffix(cfg.yearSuffix || '')
    setHoursInDay(cfg.hoursInDay)
    setDaysOfWeek([...cfg.daysOfWeek])
    setMonths(cfg.months.map(m => ({ ...m })))
    if (cfg.eras) setEras(cfg.eras.map(e => ({ ...e })))
    if (cfg.customCategories) setCustomCategories([...cfg.customCategories])
    if (cfg.customPeriodTypes) setCustomPeriodTypes([...cfg.customPeriodTypes])
    setHasYearZero(cfg.hasYearZero ?? false)
    setWeekdayEpochOffset(cfg.weekdayEpochOffset ?? 0)
    setLeapRules(cfg.leapRules ? cfg.leapRules.map(r => ({ ...r })) : [])
    setIntercalaryDays(cfg.intercalaryDays ? cfg.intercalaryDays.map(i => ({ ...i })) : [])
    setMoons(cfg.moons ? cfg.moons.map(m => ({ ...m })) : [])
    setPresetFeedback(`Applied preset: ${preset.name}`)
    setTimeout(() => setPresetFeedback(null), 3000)
  }

  const handleUpdatePreset = (preset: CalendarPreset) => {
    const updated: CalendarPreset = {
      ...preset,
      config: getCurrentDraftConfig()
    }
    saveCalendarPreset(updated)
    setPresetsList(getAllCalendarPresets())
    setPresetFeedback(`Updated preset "${preset.name}" with current settings`)
    setTimeout(() => setPresetFeedback(null), 3000)
  }

  const handleSaveAsNewPreset = () => {
    if (!newPresetName.trim()) return
    const newPreset: CalendarPreset = {
      id: `preset-custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: `Custom world configuration (${firstYear} - ${lastYear} ${yearSuffix})`,
      isBuiltIn: false,
      config: getCurrentDraftConfig()
    }
    saveCalendarPreset(newPreset)
    setPresetsList(getAllCalendarPresets())
    setNewPresetName('')
    setPresetFeedback(`Saved new preset: ${newPreset.name}`)
    setTimeout(() => setPresetFeedback(null), 3000)
  }

  const handleDeletePreset = (id: string) => {
    deleteCalendarPreset(id)
    setPresetsList(getAllCalendarPresets())
  }

  const handleSave = () => {
    if (!activeWorldId) return
    updateCalendarConfig(activeWorldId, getCurrentDraftConfig())
    onClose()
  }

  const totalDaysInYear = months.reduce((acc, m) => acc + (Number(m.days) || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-oros-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl flex flex-col max-h-[500px] overflow-hidden select-text text-oros-100 animate-modal-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-oros-750 bg-oros-900 shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-accent" />
            <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-oros-100">
              World Chronology & Calendar Settings
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-oros-400 hover:text-oros-100 p-1 rounded-[2px] hover:bg-oros-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-1 px-4 py-1.5 bg-oros-950/70 border-b border-oros-800 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('horizons')}
            className={`px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
              activeTab === 'horizons' 
                ? 'bg-oros-800 text-oros-50 border border-oros-700 shadow-sm' 
                : 'text-oros-400 hover:text-oros-200'
            }`}
          >
            Horizons & Cycle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('months')}
            className={`px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
              activeTab === 'months' 
                ? 'bg-oros-800 text-oros-50 border border-oros-700 shadow-sm' 
                : 'text-oros-400 hover:text-oros-200'
            }`}
          >
            Months ({months.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leapRules')}
            className={`px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
              activeTab === 'leapRules' 
                ? 'bg-oros-800 text-oros-50 border border-oros-700 shadow-sm' 
                : 'text-oros-400 hover:text-oros-200'
            }`}
          >
            Leap Rules ({leapRules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intercalary')}
            className={`px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
              activeTab === 'intercalary' 
                ? 'bg-oros-800 text-oros-50 border border-oros-700 shadow-sm' 
                : 'text-oros-400 hover:text-oros-200'
            }`}
          >
            Festival Days ({intercalaryDays.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('moons')}
            className={`px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
              activeTab === 'moons' 
                ? 'bg-oros-800 text-oros-50 border border-oros-700 shadow-sm' 
                : 'text-oros-400 hover:text-oros-200'
            }`}
          >
            Celestial Moons ({moons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('eras')}
            className={`px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
              activeTab === 'eras' 
                ? 'bg-oros-800 text-oros-50 border border-oros-700 shadow-sm' 
                : 'text-oros-400 hover:text-oros-200'
            }`}
          >
            Historical Eras ({eras.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
              activeTab === 'categories' 
                ? 'bg-oros-800 text-oros-50 border border-oros-700 shadow-sm' 
                : 'text-oros-400 hover:text-oros-200'
            }`}
          >
            Categories & Types
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1 rounded-[2px] text-[11px] font-sans font-medium whitespace-nowrap transition-colors ${
              activeTab === 'presets' 
                ? 'bg-oros-800 text-oros-50 border border-oros-700 shadow-sm' 
                : 'text-oros-400 hover:text-oros-200'
            }`}
          >
            Presets ({presetsList.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* TAB 1: HORIZONS & CYCLE */}
          {activeTab === 'horizons' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Timeline Ruler Horizons ({firstYear} → {lastYear} {yearSuffix})
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">First Year</span>
                    <input
                      type="number"
                      value={firstYear}
                      onChange={(e) => setFirstYear(Number(e.target.value))}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Last Year</span>
                    <input
                      type="number"
                      value={lastYear}
                      onChange={(e) => setLastYear(Number(e.target.value))}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Prefix</span>
                    <input
                      type="text"
                      placeholder="e.g. Year"
                      value={yearPrefix}
                      onChange={(e) => setYearPrefix(e.target.value)}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Suffix</span>
                    <input
                      type="text"
                      placeholder="e.g. AC, CE"
                      value={yearSuffix}
                      onChange={(e) => setYearSuffix(e.target.value)}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-oros-800">
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Planetary Day & Hours
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-36">
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Hours in a Day</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={hoursInDay}
                      onChange={(e) => setHoursInDay(Number(e.target.value))}
                      className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="text-[11px] text-oros-400 pt-3">
                    Standard Earth is 24 hours. Planetary fantasy worlds can have custom diurnal durations.
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-oros-800">
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Days of the Week ({daysOfWeek.length})
                </label>
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  {daysOfWeek.map((day, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-oros-850 border border-oros-750 text-xs text-oros-200">
                      <span>{day}</span>
                      <button
                        type="button"
                        onClick={() => removeWeekday(idx)}
                        className="text-oros-400 hover:text-rose-400 text-xs ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 max-w-xs">
                  <input
                    type="text"
                    placeholder="New day name..."
                    value={newWeekday}
                    onChange={(e) => setNewWeekday(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addWeekday(); } }}
                    className="flex-1 bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addWeekday}
                    className="px-2 py-1 bg-oros-800 hover:bg-oros-750 border border-oros-700 rounded-[3px] text-xs text-oros-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-oros-800 space-y-2">
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400">
                  Astronomical & Epoch Reckoning
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-start gap-2 cursor-pointer bg-oros-850 p-2 rounded-[3px] border border-oros-750 hover:border-oros-700">
                    <input
                      type="checkbox"
                      checked={hasYearZero}
                      onChange={(e) => setHasYearZero(e.target.checked)}
                      className="mt-0.5 rounded text-accent focus:ring-0 bg-oros-900 border-oros-700"
                    />
                    <div>
                      <span className="text-xs font-semibold text-oros-100 block">Astronomical Year Zero</span>
                      <span className="text-[10px] text-oros-400 block leading-tight">
                        If enabled, Year 0 exists (-1, 0, 1). If disabled, historical (1 BCE → 1 CE).
                      </span>
                    </div>
                  </label>

                  <div className="bg-oros-850 p-2 rounded-[3px] border border-oros-750">
                    <span className="text-xs font-semibold text-oros-100 block mb-0.5">Weekday Epoch Offset</span>
                    <input
                      type="number"
                      value={weekdayEpochOffset}
                      onChange={(e) => setWeekdayEpochOffset(Number(e.target.value))}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-0.5 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                    <span className="text-[10px] text-oros-400 block mt-0.5 leading-tight">
                      Weekday index shift at epoch anchor Day 0
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONTHS ALMANAC */}
          {activeTab === 'months' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-semibold text-oros-400">
                  Total Solar Span: {totalDaysInYear} days / year across {months.length} months
                </span>
                <button
                  type="button"
                  onClick={addMonth}
                  className="px-2 py-1 bg-oros-800 hover:bg-oros-750 border border-oros-700 rounded-[3px] text-xs font-semibold text-oros-100 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-accent" />
                  <span>Add Month</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {months.map((month, idx) => (
                  <div key={month.id} className="flex items-center gap-2 p-1.5 bg-oros-850 border border-oros-750 rounded-[3px]">
                    <span className="font-mono text-[10px] text-oros-500 w-4 text-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={month.name}
                      onChange={(e) => updateMonth(idx, { name: e.target.value })}
                      className="flex-1 bg-oros-900 border border-oros-750 rounded-[2px] px-2 py-0.5 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={month.days}
                        onChange={(e) => updateMonth(idx, { days: Number(e.target.value) })}
                        className="w-16 bg-oros-900 border border-oros-750 rounded-[2px] px-1.5 py-0.5 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none text-right"
                      />
                      <span className="text-[10px] font-mono text-oros-400">days</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Season"
                      value={month.season || ''}
                      onChange={(e) => updateMonth(idx, { season: e.target.value })}
                      className="w-20 bg-oros-900 border border-oros-750 rounded-[2px] px-1.5 py-0.5 text-xs text-oros-300 focus:border-accent focus:outline-none"
                    />
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveMonth(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-oros-400 hover:text-oros-100 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMonth(idx, 'down')}
                        disabled={idx === months.length - 1}
                        className="p-1 text-oros-400 hover:text-oros-100 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMonth(idx)}
                        className="p-1 text-oros-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: LEAP RULES */}
          {activeTab === 'leapRules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-semibold text-oros-400">
                  Configured Leap Year Rules ({leapRules.length})
                </span>
                <span className="text-[10px] text-oros-400">
                  Multi-tier calendar exceptions & intercalary extensions
                </span>
              </div>

              {/* Add Leap Rule Card */}
              <div className="p-3 bg-oros-850 border border-oros-750 rounded-[3px] space-y-2.5">
                <span className="text-xs font-semibold text-oros-100 block">Create New Leap Year Rule</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Rule Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Quadrennial Leap"
                      value={newLeapName}
                      onChange={(e) => setNewLeapName(e.target.value)}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Target Month</span>
                    <select
                      value={newLeapTargetMonthId || (months[0]?.id ?? '')}
                      onChange={(e) => setNewLeapTargetMonthId(e.target.value)}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    >
                      {months.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.days}d)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Every N Years</span>
                    <input
                      type="number"
                      min="1"
                      value={newLeapInterval}
                      onChange={(e) => setNewLeapInterval(Number(e.target.value))}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Offset Year</span>
                    <input
                      type="number"
                      value={newLeapOffset}
                      onChange={(e) => setNewLeapOffset(Number(e.target.value))}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Extra Days</span>
                    <input
                      type="number"
                      min="0"
                      value={newLeapExtraDays}
                      onChange={(e) => setNewLeapExtraDays(Number(e.target.value))}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Skip Every N (Opt)</span>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={newLeapExcludeInterval}
                      onChange={(e) => setNewLeapExcludeInterval(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="w-48">
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Reinstate Every N (Opt)</span>
                    <input
                      type="number"
                      placeholder="e.g. 400"
                      value={newLeapReinstateInterval}
                      onChange={(e) => setNewLeapReinstateInterval(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addLeapRule}
                    className="btn-accent px-3 py-1 rounded-[3px] text-xs font-bold flex items-center gap-1 shadow-sm mt-3"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Leap Rule</span>
                  </button>
                </div>
              </div>

              {/* Leap Rules List */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {leapRules.length === 0 ? (
                  <p className="text-center py-6 text-oros-500 text-xs">No leap year rules configured. Years will have fixed day lengths.</p>
                ) : (
                  leapRules.map(r => {
                    const targetMonth = months.find(m => m.id === r.targetMonthId)
                    return (
                      <div key={r.id} className="p-2.5 bg-oros-850 border border-oros-750 rounded-[3px] flex items-center justify-between gap-2 shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-semibold text-xs text-oros-100">{r.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-accent/20 text-accent font-bold">
                              Every {r.interval} yrs ({r.extraDays >= 0 ? `+${r.extraDays}` : r.extraDays}d)
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-oros-400 block mt-0.5">
                            Targets: {targetMonth ? targetMonth.name : r.targetMonthId}
                            {r.offsetYear ? ` · Offset: Yr ${r.offsetYear}` : ''}
                            {r.excludeInterval ? ` · Skip every ${r.excludeInterval}y` : ''}
                            {r.reinstateInterval ? ` · Reinstate every ${r.reinstateInterval}y` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLeapRule(r.id)}
                          className="p-1 text-oros-400 hover:text-rose-400 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: INTERCALARY FESTIVAL DAYS */}
          {activeTab === 'intercalary' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-semibold text-oros-400">
                  Intercalary & Festival Days ({intercalaryDays.length})
                </span>
                <span className="text-[10px] text-oros-400">
                  Special celebration days occurring between standard months
                </span>
              </div>

              {/* Add Intercalary Day Card */}
              <div className="p-3 bg-oros-850 border border-oros-750 rounded-[3px] space-y-2.5">
                <span className="text-xs font-semibold text-oros-100 block">Add Intercalary Festival Day</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Festival Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Midsummer Feast, Shieldmeet"
                      value={newIntercalaryName}
                      onChange={(e) => setNewIntercalaryName(e.target.value)}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Occurs After Month</span>
                    <select
                      value={newIntercalaryAfterMonthId || (months[0]?.id ?? '')}
                      onChange={(e) => setNewIntercalaryAfterMonthId(e.target.value)}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    >
                      {months.map(m => (
                        <option key={m.id} value={m.id}>After {m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Description (Optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. Traditional Solstice celebration of love and music"
                    value={newIntercalaryDescription}
                    onChange={(e) => setNewIntercalaryDescription(e.target.value)}
                    className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-oros-300">
                      <input
                        type="checkbox"
                        checked={newIntercalaryIsLeapOnly}
                        onChange={(e) => setNewIntercalaryIsLeapOnly(e.target.checked)}
                        className="rounded text-accent focus:ring-0 bg-oros-900 border-oros-700"
                      />
                      <span>Leap Years Only</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-oros-300">
                      <input
                        type="checkbox"
                        checked={newIntercalaryAdvancesWeekday}
                        onChange={(e) => setNewIntercalaryAdvancesWeekday(e.target.checked)}
                        className="rounded text-accent focus:ring-0 bg-oros-900 border-oros-700"
                      />
                      <span>Advances Weekday Progression</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={addIntercalaryDay}
                    className="btn-accent px-3 py-1 rounded-[3px] text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Festival Day</span>
                  </button>
                </div>
              </div>

              {/* Intercalary Days List */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {intercalaryDays.length === 0 ? (
                  <p className="text-center py-6 text-oros-500 text-xs">No intercalary festival days configured.</p>
                ) : (
                  intercalaryDays.map(ic => {
                    const afterMonth = months.find(m => m.id === ic.occursAfterMonthId)
                    return (
                      <div key={ic.id} className="p-2.5 bg-oros-850 border border-oros-750 rounded-[3px] flex items-center justify-between gap-2 shadow-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-semibold text-xs text-oros-100">{ic.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-accent/20 text-accent font-bold">
                              After {afterMonth ? afterMonth.name : ic.occursAfterMonthId}
                            </span>
                            {ic.isLeapOnly && (
                              <span className="text-[9px] font-mono px-1 py-0.5 rounded-[2px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Leap Only
                              </span>
                            )}
                          </div>
                          {ic.description && (
                            <p className="text-[10px] text-oros-400 mt-0.5">{ic.description}</p>
                          )}
                          <span className="text-[9px] font-mono text-oros-500 block mt-0.5">
                            {ic.advancesWeekday ? 'Advances standard weekly calendar' : 'Outside weekly progression (uncounted weekday)'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIntercalaryDay(ic.id)}
                          className="p-1 text-oros-400 hover:text-rose-400 transition-colors"
                          title="Delete festival day"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: CELESTIAL MOONS */}
          {activeTab === 'moons' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-semibold text-oros-400">
                  Celestial Moons & Orbits ({moons.length})
                </span>
                <span className="text-[10px] text-oros-400">
                  Multi-moon synodic cycles & syzygy alignment calculations
                </span>
              </div>

              {/* Add Moon Card */}
              <div className="p-3 bg-oros-850 border border-oros-750 rounded-[3px] space-y-2.5">
                <span className="text-xs font-semibold text-oros-100 block">Add Celestial Body</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Moon Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Selûne, Luna"
                      value={newMoonName}
                      onChange={(e) => setNewMoonName(e.target.value)}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Synodic Cycle (Days)</span>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="e.g. 28.0 or 29.53"
                      value={newMoonPeriod}
                      onChange={(e) => setNewMoonPeriod(Number(e.target.value))}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Epoch Phase (0=New, 0.5=Full)</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={newMoonEpochPhase}
                      onChange={(e) => setNewMoonEpochPhase(Number(e.target.value))}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Display Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newMoonColor}
                        onChange={(e) => setNewMoonColor(e.target.value)}
                        className="w-8 h-7 bg-transparent border-0 cursor-pointer rounded"
                      />
                      <input
                        type="text"
                        value={newMoonColor}
                        onChange={(e) => setNewMoonColor(e.target.value)}
                        className="flex-1 bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-oros-400 block mb-0.5">Description (Optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. The Silver Maiden of the night"
                      value={newMoonDescription}
                      onChange={(e) => setNewMoonDescription(e.target.value)}
                      className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={addMoon}
                    className="btn-accent px-3 py-1 rounded-[3px] text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Celestial Body</span>
                  </button>
                </div>
              </div>

              {/* Moons List */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {moons.length === 0 ? (
                  <p className="text-center py-6 text-oros-500 text-xs">No celestial bodies configured for this world.</p>
                ) : (
                  moons.map(m => (
                    <div key={m.id} className="p-2.5 bg-oros-850 border border-oros-750 rounded-[3px] flex items-center justify-between gap-2 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full border border-black/50 shrink-0 shadow-sm"
                          style={{ backgroundColor: m.color || '#e2e8f0' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-semibold text-xs text-oros-100">{m.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-[2px] bg-accent/20 text-accent font-bold">
                              Period: {m.synodicPeriodDays}d
                            </span>
                            <span className="text-[9px] font-mono text-oros-400">
                              Epoch: {m.epochPhase === 0 ? 'New' : m.epochPhase === 0.5 ? 'Full' : `${Math.round(m.epochPhase * 100)}%`}
                            </span>
                          </div>
                          {m.description && (
                            <p className="text-[10px] text-oros-400 mt-0.5">{m.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMoon(m.id)}
                        className="p-1 text-oros-400 hover:text-rose-400 transition-colors"
                        title="Delete moon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HISTORICAL ERAS */}
          {activeTab === 'eras' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-semibold text-oros-400">
                  World Epochs & Eras ({eras.length})
                </span>
                <span className="text-[10px] text-oros-400">
                  Auto-detected when adding timeline records
                </span>
              </div>

              {/* Add Era Row */}
              <div className="flex items-center gap-2 p-2 bg-oros-850/70 border border-oros-750 rounded-[3px]">
                <input
                  type="text"
                  placeholder="New Era Name (e.g. Dawn Epoch)"
                  value={newEraName}
                  onChange={(e) => setNewEraName(e.target.value)}
                  className="flex-1 bg-oros-900 border border-oros-750 rounded-[2px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Start"
                  value={newEraStart}
                  onChange={(e) => setNewEraStart(Number(e.target.value))}
                  className="w-18 bg-oros-900 border border-oros-750 rounded-[2px] px-1.5 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                />
                <span className="text-oros-500 text-xs">→</span>
                <input
                  type="number"
                  placeholder="End"
                  value={newEraEnd}
                  onChange={(e) => setNewEraEnd(Number(e.target.value))}
                  className="w-18 bg-oros-900 border border-oros-750 rounded-[2px] px-1.5 py-1 text-xs font-mono text-oros-100 focus:border-accent focus:outline-none"
                />
                <input
                  type="color"
                  value={newEraColor}
                  onChange={(e) => setNewEraColor(e.target.value)}
                  className="w-6 h-6 rounded bg-transparent cursor-pointer border-0 p-0"
                  title="Era Color Badge"
                />
                <button
                  type="button"
                  onClick={addEra}
                  className="px-2.5 py-1 bg-oros-800 hover:bg-oros-750 border border-oros-700 rounded-[2px] text-xs font-semibold text-oros-100 shrink-0"
                >
                  Add Era
                </button>
              </div>

              {/* Eras Table */}
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {eras.map(era => (
                  <div key={era.id} className="flex items-center justify-between p-2 bg-oros-850 border border-oros-750 rounded-[3px]">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: era.color || '#6366f1' }} 
                      />
                      <span className="text-xs font-semibold text-oros-100">{era.name}</span>
                      <span className="font-mono text-[10px] text-oros-400 bg-oros-900 px-1.5 py-0.5 rounded-[2px] border border-oros-800">
                        {era.startYear} → {era.endYear} ({era.endYear - era.startYear} yrs)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeEra(era.id)}
                      className="p-1 text-oros-400 hover:text-rose-400 transition-colors"
                      title="Remove Era"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES & PERIOD TYPES */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              {/* Thematic Categories */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Thematic Categories ({customCategories.length})
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="New category name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 bg-oros-850 border border-oros-750 rounded-[2px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                  />
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-6 h-6 rounded bg-transparent cursor-pointer border-0 p-0"
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="px-2.5 py-1 bg-oros-800 hover:bg-oros-750 border border-oros-700 rounded-[2px] text-xs font-semibold text-oros-100"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {customCategories.map(cat => (
                    <span key={cat.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-oros-850 border border-oros-750 text-xs text-oros-200">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                      <button
                        type="button"
                        onClick={() => removeCategory(cat.id)}
                        className="text-oros-400 hover:text-rose-400 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Period Classifications */}
              <div className="pt-3 border-t border-oros-800">
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Period Classifications ({customPeriodTypes.length})
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="New period type (e.g. Arcane Incursion)..."
                    value={newPeriodTypeName}
                    onChange={(e) => setNewPeriodTypeName(e.target.value)}
                    className="flex-1 bg-oros-850 border border-oros-750 rounded-[2px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                  />
                  <input
                    type="color"
                    value={newPeriodTypeColor}
                    onChange={(e) => setNewPeriodTypeColor(e.target.value)}
                    className="w-6 h-6 rounded bg-transparent cursor-pointer border-0 p-0"
                  />
                  <button
                    type="button"
                    onClick={addPeriodType}
                    className="px-2.5 py-1 bg-oros-800 hover:bg-oros-750 border border-oros-700 rounded-[2px] text-xs font-semibold text-oros-100"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {customPeriodTypes.map(pt => (
                    <span key={pt.id} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-oros-850 border border-oros-750 text-xs text-oros-200">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pt.color }} />
                      <span>{pt.name}</span>
                      <button
                        type="button"
                        onClick={() => removePeriodType(pt.id)}
                        className="text-oros-400 hover:text-rose-400 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRESETS MANAGER */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              {presetFeedback && (
                <div className="p-2 rounded-[2px] bg-accent/15 border border-accent/40 text-accent text-xs flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{presetFeedback}</span>
                </div>
              )}

              {/* Save Current as New Preset */}
              <div className="p-2.5 bg-oros-850/80 border border-oros-750 rounded-[3px] space-y-1.5">
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400">
                  Save Current Configuration as Preset
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Preset name (e.g. My Custom World Calendar)..."
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="flex-1 bg-oros-900 border border-oros-750 rounded-[2px] px-2 py-1 text-xs text-oros-100 focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAsNewPreset}
                    className="btn-accent px-3 py-1 rounded-[2px] text-xs font-semibold flex items-center gap-1 shrink-0"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Preset</span>
                  </button>
                </div>
              </div>

              {/* Presets List with Load, Update & Delete */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {presetsList.map(preset => (
                  <div key={preset.id} className="p-2.5 bg-oros-850 border border-oros-750 rounded-[3px] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-oros-100">{preset.name}</span>
                        {preset.isBuiltIn && (
                          <span className="text-[9px] font-mono px-1 py-0.2 bg-oros-800 text-oros-400 rounded">Built-in</span>
                        )}
                      </div>
                      <p className="text-[10px] text-oros-400 truncate mt-0.5">{preset.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="px-2 py-1 rounded-[2px] bg-oros-800 hover:bg-oros-750 text-oros-200 border border-oros-700 text-[11px] font-medium transition-colors"
                        title="Load this preset into current configuration"
                      >
                        Load
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdatePreset(preset)}
                        className="px-2 py-1 rounded-[2px] bg-oros-800 hover:bg-oros-750 text-oros-300 hover:text-accent border border-oros-700 text-[11px] font-medium transition-colors flex items-center gap-1"
                        title="Update this preset with current settings"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Update</span>
                      </button>

                      {!preset.isBuiltIn && (
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(preset.id)}
                          className="p-1 rounded-[2px] text-oros-400 hover:text-rose-400 hover:bg-oros-800 transition-colors"
                          title="Delete custom preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Guaranteed Visible Pinned Footer */}
        <div className="px-4 py-2.5 border-t border-oros-750/80 bg-oros-900 flex items-center justify-between shrink-0">
          <span className="font-mono text-[10px] text-oros-400">
            {months.length} months · {leapRules.length} leap rules · {moons.length} moons · {firstYear}–{lastYear} {yearSuffix}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-accent px-4 py-1 rounded-[3px] text-xs font-bold shadow-sm transition-colors"
            >
              Apply to World
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
