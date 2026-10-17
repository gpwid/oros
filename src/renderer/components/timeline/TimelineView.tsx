import React, { useState, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { TimelineEvent } from '@shared/types'
import { 
  Clock, Plus, Calendar, Settings, List, Activity, 
  Search, Filter, ChevronDown, Sparkles 
} from 'lucide-react'
import { TimelineLineView } from './TimelineLineView'
import { TimelineCalendarView } from './TimelineCalendarView'
import { TimelineChronicleView } from './TimelineChronicleView'
import { TimelineEventModal } from './TimelineEventModal'
import { TimelineCalendarSettingsModal } from './TimelineCalendarSettingsModal'

export type TimelineViewMode = 'line' | 'calendar' | 'chronicle'

export const TimelineView: React.FC = () => {
  const { 
    timelines, activeWorldId, getCalendarConfig,
    deleteTimelineEvent 
  } = useWorldStore()

  const calendarConfig = useMemo(() => {
    return getCalendarConfig(activeWorldId || undefined)
  }, [getCalendarConfig, activeWorldId])

  const worldEvents = activeWorldId ? timelines[activeWorldId] || [] : []

  // Active View Mode
  const [viewMode, setViewMode] = useState<TimelineViewMode>('line')

  // Modals State
  const [showEventModal, setShowEventModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [initialDateForModal, setInitialDateForModal] = useState<{
    year?: number
    month?: number
    day?: number
    isPeriod?: boolean
    endYear?: number
    era?: string
  } | null>(null)

  // Top Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'events' | 'periods'>('all')
  const [filterEra, setFilterEra] = useState<string>('all')
  const [filterImportance, setFilterImportance] = useState<string>('all')

  // Eras list
  const existingEras = useMemo(() => {
    return Array.from(new Set(worldEvents.map(e => e.era || 'Universal Era'))).filter(Boolean)
  }, [worldEvents])

  // Filtered events
  const filteredEvents = useMemo(() => {
    return worldEvents.filter((evt) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = evt.title.toLowerCase().includes(q)
        const matchesDesc = (evt.description || '').toLowerCase().includes(q)
        const matchesEra = (evt.era || '').toLowerCase().includes(q)
        if (!matchesTitle && !matchesDesc && !matchesEra) return false
      }

      // Type filter (single event vs period)
      if (filterType === 'events' && evt.isPeriod) return false
      if (filterType === 'periods' && !evt.isPeriod) return false

      // Era filter
      if (filterEra !== 'all' && (evt.era || 'Universal Era') !== filterEra) return false

      // Importance filter
      if (filterImportance !== 'all' && evt.importance !== filterImportance) return false

      return true
    })
  }, [worldEvents, searchQuery, filterType, filterEra, filterImportance])

  // Handlers for in-situ creation
  const handleAddAtYear = (year: number, isPeriod = false, endYear?: number, era?: string) => {
    setEditingEvent(null)
    setInitialDateForModal({
      year,
      isPeriod,
      endYear: endYear ?? (isPeriod ? year + 10 : undefined),
      era
    })
    setShowEventModal(true)
  }

  const handleAddAtDate = (year: number, month: number, day: number) => {
    setEditingEvent(null)
    setInitialDateForModal({
      year,
      month,
      day,
      isPeriod: false
    })
    setShowEventModal(true)
  }

  const handleEditEvent = (evt: TimelineEvent) => {
    setEditingEvent(evt)
    setInitialDateForModal(null)
    setShowEventModal(true)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-oros-950 relative select-text">
      {/* Top Filter & Query Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-oros-800 bg-oros-900/80 backdrop-blur-sm shrink-0 z-20">
        {/* Title & Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h2 className="font-sans font-bold text-sm tracking-wide text-oros-100">
              World Chronology
            </h2>
          </div>

          <span className="font-mono text-[10px] text-oros-400 px-2 py-0.5 rounded-[2px] bg-oros-850 border border-oros-750">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-oros-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search historical lore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-oros-850 border border-oros-750 rounded-[3px] pl-8 pr-3 py-1 text-xs text-oros-100 placeholder-oros-500 focus:border-accent focus:outline-none w-44 sm:w-56"
            />
          </div>

          {/* Type Segmented Filter (All | Events | Periods) */}
          <div className="flex items-center gap-0.5 p-0.5 bg-oros-850 border border-oros-750 rounded-[3px]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded-[2px] text-[11px] font-semibold transition-colors ${
                filterType === 'all' 
                  ? 'bg-oros-800 text-oros-100 shadow-sm' 
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('events')}
              className={`px-2 py-0.5 rounded-[2px] text-[11px] font-semibold transition-colors ${
                filterType === 'events' 
                  ? 'bg-oros-800 text-oros-100 shadow-sm' 
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setFilterType('periods')}
              className={`px-2 py-0.5 rounded-[2px] text-[11px] font-semibold transition-colors ${
                filterType === 'periods' 
                  ? 'bg-oros-800 text-oros-100 shadow-sm' 
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              Periods
            </button>
          </div>

          {/* Era Filter Dropdown */}
          {existingEras.length > 1 && (
            <select
              value={filterEra}
              onChange={(e) => setFilterEra(e.target.value)}
              className="bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-200 focus:border-accent focus:outline-none"
            >
              <option value="all">All Eras</option>
              {existingEras.map((er) => (
                <option key={er} value={er}>{er}</option>
              ))}
            </select>
          )}

          {/* Importance Filter */}
          <select
            value={filterImportance}
            onChange={(e) => setFilterImportance(e.target.value)}
            className="bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-200 focus:border-accent focus:outline-none"
          >
            <option value="all">All Importance</option>
            <option value="mythic">Mythic</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'line' && (
          <TimelineLineView
            events={filteredEvents}
            calendarConfig={calendarConfig}
            onAddAtYear={handleAddAtYear}
            onEditEvent={handleEditEvent}
            onDeleteEvent={deleteTimelineEvent}
          />
        )}

        {viewMode === 'calendar' && (
          <TimelineCalendarView
            events={filteredEvents}
            calendarConfig={calendarConfig}
            onAddAtDate={handleAddAtDate}
            onEditEvent={handleEditEvent}
            onDeleteEvent={deleteTimelineEvent}
          />
        )}

        {viewMode === 'chronicle' && (
          <TimelineChronicleView
            events={filteredEvents}
            calendarConfig={calendarConfig}
            onAddAtYear={handleAddAtYear}
            onEditEvent={handleEditEvent}
            onDeleteEvent={deleteTimelineEvent}
          />
        )}
      </div>

      {/* ======================================================== */}
      {/* FLOATING BOTTOM INSTRUMENT DOCK */}
      {/* (Matches user reference image specifications) */}
      {/* ======================================================== */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1 bg-oros-900/95 backdrop-blur-md border border-oros-750/90 shadow-2xl rounded-[4px]">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-0.5 p-0.5 bg-oros-850/90 border border-oros-750 rounded-[3px]">
          <button
            onClick={() => setViewMode('line')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold transition-all ${
              viewMode === 'line'
                ? 'bg-oros-800 text-oros-50 border border-oros-700/80 shadow-sm'
                : 'text-oros-400 hover:text-oros-200'
            }`}
            title="Interactive Line View (Continuous Timeline Axis)"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Line</span>
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-oros-800 text-oros-50 border border-oros-700/80 shadow-sm'
                : 'text-oros-400 hover:text-oros-200'
            }`}
            title="World Almanac Calendar View"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          <button
            onClick={() => setViewMode('chronicle')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[2px] text-xs font-semibold transition-all ${
              viewMode === 'chronicle'
                ? 'bg-oros-800 text-oros-50 border border-oros-700/80 shadow-sm'
                : 'text-oros-400 hover:text-oros-200'
            }`}
            title="Narrative Chronicle Stream View"
          >
            <List className="w-3.5 h-3.5" />
            <span>Chronicle</span>
          </button>
        </div>

        {/* Calendar Settings Cog Button */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-1.5 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-300 hover:text-oros-100 transition-colors"
          title="World Chronology & Calendar Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Primary Action Button (Add Event / Period) */}
        <button
          onClick={() => {
            setEditingEvent(null)
            setInitialDateForModal(null)
            setShowEventModal(true)
          }}
          className="btn-accent px-3 py-1 rounded-[3px] text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to Timeline</span>
        </button>
      </div>

      {/* Modals */}
      <TimelineEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        eventToEdit={editingEvent}
        initialDate={initialDateForModal}
      />

      <TimelineCalendarSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  )
}
