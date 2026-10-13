import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { TimelineEvent } from '@shared/types'
import { 
  Clock, Plus, Calendar, Sparkles, Trash2, ExternalLink, Bookmark 
} from 'lucide-react'

export const TimelineView: React.FC = () => {
  const { 
    timelines, entities, activeWorldId, setSelectedEntityId, setActiveTab,
    createTimelineEvent, deleteTimelineEvent 
  } = useWorldStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEra, setNewEra] = useState('Age of Concord')
  const [newYear, setNewYear] = useState<number>(850)
  const [newDesc, setNewDesc] = useState('')
  const [newImportance, setNewImportance] = useState<TimelineEvent['importance']>('major')
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([])

  const worldEvents = activeWorldId ? timelines[activeWorldId] || [] : []
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  // Group events by era
  const eras = Array.from(new Set(worldEvents.map((e) => e.era || 'Universal Era')))

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    createTimelineEvent({
      era: newEra.trim(),
      year: Number(newYear),
      title: newTitle.trim(),
      description: newDesc.trim(),
      importance: newImportance,
      entityIds: selectedEntityIds
    })

    setShowAddModal(false)
    setNewTitle('')
    setNewDesc('')
    setSelectedEntityIds([])
  }

  const toggleEntityLink = (entId: string) => {
    if (selectedEntityIds.includes(entId)) {
      setSelectedEntityIds(selectedEntityIds.filter(id => id !== entId))
    } else {
      setSelectedEntityIds([...selectedEntityIds, entId])
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 p-6 select-text">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-oros-800/60 shrink-0">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-400" />
            Chronological Timelines
          </h2>
          <p className="text-xs text-oros-400 mt-0.5">
            Sequential historical reckoning across cosmic eras and continental dynasties.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Historical Event</span>
        </button>
      </div>

      {/* Main Timeline Stream */}
      <div className="flex-1 overflow-y-auto pr-4 space-y-8">
        {eras.map((era) => {
          const eraEvents = worldEvents.filter((e) => (e.era || 'Universal Era') === era)
          return (
            <div key={era} className="relative">
              {/* Era Header Banner */}
              <div className="sticky top-0 z-10 py-1.5 px-3 rounded-lg bg-oros-900/95 border border-oros-800 backdrop-blur-md mb-4 inline-flex items-center gap-2 shadow-sm">
                <Bookmark className="w-3.5 h-3.5 text-gold-400" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-slate-200">
                  {era}
                </span>
                <span className="text-[10px] text-oros-400 font-mono">
                  ({eraEvents.length} Recorded Epochs)
                </span>
              </div>

              {/* Vertical Spine */}
              <div className="relative pl-6 ml-3 border-l-2 border-oros-800/80 space-y-6">
                {eraEvents.map((evt) => {
                  let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  if (evt.importance === 'mythic') {
                    badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  } else if (evt.importance === 'minor') {
                    badgeColor = 'bg-oros-800 text-oros-300 border-oros-700'
                  }

                  return (
                    <div key={evt.id} className="relative group">
                      {/* Timeline Dot Node */}
                      <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-oros-950 border-2 border-gold-400 group-hover:scale-125 transition-transform" />

                      {/* Event Card */}
                      <div className="bg-oros-900/60 border border-oros-800 hover:border-gold-400/50 rounded-xl p-4 transition-all">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-gold-400 px-2 py-0.5 rounded bg-oros-950 border border-oros-800">
                              Year {evt.year} AC
                            </span>
                            <h3 className="font-serif font-bold text-sm text-slate-100">
                              {evt.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${badgeColor}`}>
                              {evt.importance}
                            </span>
                            <button
                              onClick={() => deleteTimelineEvent(evt.id)}
                              className="text-oros-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-oros-300 leading-relaxed mb-3">
                          {evt.description}
                        </p>

                        {/* Linked Entities */}
                        {evt.entityIds.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-oros-800/40">
                            <span className="text-[10px] text-oros-400 font-mono mr-1">Involved:</span>
                            {evt.entityIds.map((entId) => {
                              const ent = worldEntities.find(e => e.id === entId)
                              if (!ent) return null
                              return (
                                <button
                                  key={entId}
                                  onClick={() => {
                                    setSelectedEntityId(entId)
                                    setActiveTab('wiki')
                                  }}
                                  className="text-[11px] px-2 py-0.5 rounded bg-oros-800/80 hover:bg-gold-500/20 text-slate-200 hover:text-gold-300 border border-oros-700/60 flex items-center gap-1 transition-colors"
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
                  )
                })}
              </div>
            </div>
          )
        })}

        {worldEvents.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center text-oros-500">
            <Clock className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-xs">No chronological events registered yet.</p>
          </div>
        )}
      </div>

      {/* Record Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-lg rounded-xl p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-2">
              Record Historical Event
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-oros-300 mb-1">Era</label>
                  <input
                    type="text"
                    required
                    value={newEra}
                    onChange={(e) => setNewEra(e.target.value)}
                    placeholder="e.g. First Age / Golden Era"
                    className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-oros-300 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. The Siege of the Sunken Citadel"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Significance</label>
                <select
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value as any)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="mythic">Mythic (Cosmic / World-Altering)</option>
                  <option value="major">Major (War, Coronation, Treaties)</option>
                  <option value="minor">Minor (Local conflict, discoveries)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Chronicle the causes and consequences of this event..."
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Involved Entities</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-oros-950 border border-oros-800 rounded-lg">
                  {worldEntities.map((ent) => {
                    const isSelected = selectedEntityIds.includes(ent.id)
                    return (
                      <button
                        type="button"
                        key={ent.id}
                        onClick={() => toggleEntityLink(ent.id)}
                        className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                          isSelected
                            ? 'bg-gold-500 text-oros-950 font-bold'
                            : 'bg-oros-900 text-oros-300 hover:bg-oros-800'
                        }`}
                      >
                        {ent.title}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md"
                >
                  Record Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
