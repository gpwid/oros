import React, { useMemo } from 'react'
import { TimelineEvent, WorldCalendarConfig } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { 
  Bookmark, Plus, Edit3, Trash2, ExternalLink, Clock, Zap, Calendar 
} from 'lucide-react'
import { 
  formatTimelineDate, 
  formatPeriodDuration,
  PERIOD_TYPE_CONFIG 
} from '../../utils/calendarDefaults'

interface TimelineChronicleViewProps {
  events: TimelineEvent[]
  calendarConfig: WorldCalendarConfig
  onAddAtYear: (year: number, isPeriod?: boolean, endYear?: number, era?: string) => void
  onEditEvent: (event: TimelineEvent) => void
  onDeleteEvent: (eventId: string) => void
}

export const TimelineChronicleView: React.FC<TimelineChronicleViewProps> = ({
  events,
  calendarConfig,
  onAddAtYear,
  onEditEvent,
  onDeleteEvent
}) => {
  const { entities, activeWorldId, openTab } = useWorldStore()
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  // Group events by era
  const eras = useMemo(() => {
    return Array.from(new Set(events.map((e) => e.era || 'Universal Era')))
  }, [events])

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 select-text">
      {eras.length === 0 ? (
        <div className="text-center py-16 text-oros-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No chronicle entries found matching filters.</p>
        </div>
      ) : (
        eras.map((era) => {
          const eraEvents = events
            .filter((e) => (e.era || 'Universal Era') === era)
            .sort((a, b) => (a.year || 0) - (b.year || 0))

          return (
            <div key={era} className="relative">
              {/* Era Header Banner */}
              <div className="sticky top-0 z-10 py-1.5 px-3 rounded-[3px] bg-oros-900 border border-oros-750 mb-4 inline-flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-accent" />
                  <span className="font-sans font-bold text-xs uppercase tracking-wider text-oros-100">
                    {era}
                  </span>
                  <span className="text-[10px] text-oros-400 font-mono">
                    ({eraEvents.length} {eraEvents.length === 1 ? 'entry' : 'entries'})
                  </span>
                </div>

                <button
                  onClick={() => {
                    const lastYearInEra = eraEvents.length > 0 ? eraEvents[eraEvents.length - 1].year + 1 : 850
                    onAddAtYear(lastYearInEra, false, undefined, era)
                  }}
                  className="text-[10px] font-semibold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
                  title="Add Event to this Era"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add to Era</span>
                </button>
              </div>

              {/* Vertical Spine */}
              <div className="relative pl-6 ml-3 border-l border-oros-800 space-y-4">
                {eraEvents.map((evt, idx) => {
                  const isPeriod = Boolean(evt.isPeriod)
                  const isMythic = evt.importance === 'mythic'
                  const isMajor = evt.importance === 'major'
                  const periodCfg = isPeriod 
                    ? (PERIOD_TYPE_CONFIG[evt.periodType || 'custom'] || PERIOD_TYPE_CONFIG.custom)
                    : null

                  const borderColor = evt.color 
                    ? evt.color 
                    : isPeriod 
                    ? periodCfg?.color 
                    : isMythic 
                    ? '#f59e0b' 
                    : isMajor 
                    ? 'var(--oros-accent)' 
                    : '#475569'

                  // Compute midpoint to next event for in-situ spine add
                  const nextEvt = eraEvents[idx + 1]
                  const midpointYear = nextEvt ? Math.round((evt.year + nextEvt.year) / 2) : evt.year + 5

                  return (
                    <React.Fragment key={evt.id}>
                      <div className="relative group">
                        {/* Milestone Pip at Spine */}
                        <div 
                          className="absolute -left-[30px] top-3 w-2.5 h-2.5 rotate-45 rounded-[1px] border bg-oros-950 transition-transform group-hover:scale-125 shadow-sm"
                          style={{
                            borderColor,
                            backgroundColor: evt.color || (isPeriod ? periodCfg?.color : undefined)
                          }}
                        />

                        {/* Card Container */}
                        <div 
                          className={`p-3.5 rounded-[4px] border bg-oros-900 shadow-sm transition-all hover:border-oros-650 ${
                            isPeriod ? 'border-l-4' : ''
                          }`}
                          style={{
                            borderLeftColor: isPeriod ? borderColor : undefined
                          }}
                        >
                          {/* Card Top Row: Temporal Badge & Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              {isPeriod ? (
                                <span 
                                  className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-[2px] border"
                                  style={{
                                    backgroundColor: periodCfg?.bg,
                                    borderColor: periodCfg?.border,
                                    color: periodCfg?.color
                                  }}
                                >
                                  {formatTimelineDate(evt, calendarConfig)}
                                </span>
                              ) : (
                                <span className="font-mono text-[11px] font-bold text-accent px-1.5 py-0.5 rounded-[2px] bg-accent/10 border border-accent/25">
                                  {formatTimelineDate(evt, calendarConfig)}
                                </span>
                              )}

                              <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-[2px] ${
                                isMythic
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : isMajor
                                  ? 'bg-accent/15 text-accent border border-accent/30'
                                  : 'bg-oros-850 text-oros-400 border border-oros-750'
                              }`}>
                                {evt.importance}
                              </span>

                              {evt.category && (
                                <span className="text-[9px] font-mono uppercase text-oros-400 capitalize">
                                  · {evt.category}
                                </span>
                              )}
                            </div>

                            {/* Edit / Delete Buttons */}
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onEditEvent(evt)}
                                className="p-1 rounded text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
                                title="Edit Entry"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${evt.title}"?`)) {
                                    onDeleteEvent(evt.id)
                                  }
                                }}
                                className="p-1 rounded text-oros-400 hover:text-rose-400 hover:bg-oros-800 transition-colors"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="font-sans font-bold text-sm text-oros-100 mb-1">
                            {evt.title}
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-oros-300 leading-relaxed">
                            {evt.description || 'No chronicle record details.'}
                          </p>

                          {/* Connected Entities */}
                          {evt.entityIds.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-oros-800/80">
                              <span className="text-[9px] font-mono uppercase tracking-wider text-oros-400">
                                Lore Links:
                              </span>
                              {evt.entityIds.map((entId) => {
                                const ent = worldEntities.find((e) => e.id === entId)
                                if (!ent) return null
                                return (
                                  <button
                                    key={ent.id}
                                    onClick={() => openTab({ title: ent.title, type: 'wiki', targetId: ent.id })}
                                    className="text-[10px] px-2 py-0.5 rounded-[2px] bg-oros-850 hover:bg-oros-800 text-oros-200 border border-oros-750 flex items-center gap-1 transition-colors"
                                  >
                                    <span>{ent.title}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* In-Situ Spine Insertion Connector (Between Events) */}
                      {nextEvt && (
                        <div className="relative h-4 group/connector flex items-center">
                          <button
                            onClick={() => onAddAtYear(midpointYear, false, undefined, era)}
                            className="absolute -left-[32px] w-4 h-4 rounded-full bg-oros-900 border border-oros-700 hover:border-accent hover:bg-accent hover:text-oros-950 text-oros-400 flex items-center justify-center transition-all opacity-0 group-hover/connector:opacity-100 z-10 shadow"
                            title={`Insert Event around Year ${midpointYear}`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
