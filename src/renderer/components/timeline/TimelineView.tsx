import React, { useState } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { TimelineEvent } from '@shared/types'
import { 
  Clock, Plus, Calendar, Trash2, ExternalLink, Bookmark, Edit3 
} from 'lucide-react'

export const TimelineView: React.FC = () => {
  const { 
    timelines, entities, activeWorldId, setSelectedEntityId, setActiveTab, openTab,
    createTimelineEvent, updateTimelineEvent, deleteTimelineEvent 
  } = useWorldStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEra, setNewEra] = useState('Age of Concord')
  const [newYear, setNewYear] = useState<number>(850)
  const [newDesc, setNewDesc] = useState('')
  const [newImportance, setNewImportance] = useState<TimelineEvent['importance']>('major')
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([])

  // Edit Event State
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editEra, setEditEra] = useState('')
  const [editYear, setEditYear] = useState<number>(0)
  const [editDesc, setEditDesc] = useState('')
  const [editImportance, setEditImportance] = useState<TimelineEvent['importance']>('major')
  const [editEntityIds, setEditEntityIds] = useState<string[]>([])

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

  const openEditModal = (evt: TimelineEvent) => {
    setEditingEvent(evt)
    setEditTitle(evt.title)
    setEditEra(evt.era || 'Universal Era')
    setEditYear(evt.year)
    setEditDesc(evt.description)
    setEditImportance(evt.importance)
    setEditEntityIds([...evt.entityIds])
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent || !editTitle.trim()) return

    updateTimelineEvent(editingEvent.id, {
      era: editEra.trim(),
      year: Number(editYear),
      title: editTitle.trim(),
      description: editDesc.trim(),
      importance: editImportance,
      entityIds: editEntityIds
    })

    setEditingEvent(null)
  }

  const toggleEntityLink = (entId: string) => {
    if (selectedEntityIds.includes(entId)) {
      setSelectedEntityIds(selectedEntityIds.filter(id => id !== entId))
    } else {
      setSelectedEntityIds([...selectedEntityIds, entId])
    }
  }

  const toggleEditEntityLink = (entId: string) => {
    if (editEntityIds.includes(entId)) {
      setEditEntityIds(editEntityIds.filter(id => id !== entId))
    } else {
      setEditEntityIds([...editEntityIds, entId])
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 p-6 select-text">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-oros-800 shrink-0">
        <div>
          <h2 className="font-serif text-lg font-bold text-oros-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-oros-400" />
            Timeline
          </h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-[3px] bg-oros-200 hover:bg-white text-oros-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Main Timeline Stream */}
      <div className="flex-1 overflow-y-auto pr-4 space-y-8">
        {eras.map((era) => {
          const eraEvents = worldEvents
            .filter((e) => (e.era || 'Universal Era') === era)
            .sort((a, b) => (a.year || 0) - (b.year || 0))
          return (
            <div key={era} className="relative">
              {/* Era Header Banner */}
              <div className="sticky top-0 z-10 py-1 px-2.5 rounded-[3px] bg-oros-900 border border-oros-750 mb-4 inline-flex items-center gap-2 shadow-sm">
                <Bookmark className="w-3 h-3 text-oros-400" />
                <span className="font-sans font-semibold text-xs uppercase tracking-wider text-oros-200">
                  {era}
                </span>
                <span className="text-[10px] text-oros-400 font-mono">
                  ({eraEvents.length} events)
                </span>
              </div>

              {/* Vertical Spine */}
              <div className="relative pl-6 ml-3 border-l border-oros-800 space-y-5">
                {eraEvents.map((evt) => {
                  let badgeColor = 'bg-oros-850 text-oros-300 border-oros-700'
                  if (evt.importance === 'mythic') {
                    badgeColor = 'bg-oros-800 text-oros-200 border-oros-600'
                  } else if (evt.importance === 'minor') {
                    badgeColor = 'bg-oros-950 text-oros-400 border-oros-800'
                  }

                  return (
                    <div key={evt.id} className="relative group">
                      {/* Timeline Dot Node */}
                      <div className="absolute -left-[30px] top-2.5 w-2.5 h-2.5 rounded-[1px] bg-oros-950 border border-oros-500" />

                      {/* Event Card */}
                      <div className="bg-oros-900 border border-oros-750 hover:border-oros-600 rounded-[3px] p-3.5 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-oros-300 px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-750 tracking-wide">
                              Year {evt.year} AC
                            </span>
                            <h3 className="font-sans font-semibold text-sm text-oros-100">
                              {evt.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-[2px] border ${badgeColor}`}>
                              {evt.importance}
                            </span>
                            <button
                              onClick={() => openEditModal(evt)}
                              className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 opacity-0 group-hover:opacity-100 transition-all"
                              title="Edit event"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTimelineEvent(evt.id)}
                              className="p-1 rounded-[2px] text-oros-500 hover:text-rose-400 hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition-all"
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
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-oros-800">
                            <span className="text-[10px] text-oros-400 font-mono tracking-wider uppercase mr-1">Involved:</span>
                            {evt.entityIds.map((entId) => {
                              const ent = worldEntities.find(e => e.id === entId)
                              if (!ent) return null
                              return (
                                <button
                                  key={entId}
                                  onClick={() => {
                                    setSelectedEntityId(entId)
                                    openTab({
                                      title: ent.title,
                                      type: 'wiki',
                                      targetId: entId
                                    })
                                  }}
                                  className="text-[11px] px-2 py-0.5 rounded-[2px] bg-oros-950 hover:bg-oros-800 text-oros-200 hover:text-oros-100 border border-oros-750 flex items-center gap-1 transition-colors"
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
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No events recorded yet.</p>
          </div>
        )}
      </div>

      {/* Record Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] p-5 shadow-2xl">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100 mb-3">
              Add Event
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1">Era</label>
                  <input
                    type="text"
                    required
                    value={newEra}
                    onChange={(e) => setNewEra(e.target.value)}
                    placeholder="Era name..."
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Significance</label>
                <select
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value as any)}
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                >
                  <option value="mythic">Mythic</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Event description..."
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Involved Entities</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-oros-950 border border-oros-750 rounded-[3px]">
                  {worldEntities.map((ent) => {
                    const isSelected = selectedEntityIds.includes(ent.id)
                    return (
                      <button
                        type="button"
                        key={ent.id}
                        onClick={() => toggleEntityLink(ent.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
                          isSelected
                            ? 'bg-oros-800 border border-oros-500 text-oros-100 font-medium'
                            : 'bg-oros-900 border border-transparent text-oros-400 hover:text-oros-200'
                        }`}
                      >
                        {ent.title}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-[3px] text-xs text-oros-300 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[3px] text-xs font-semibold bg-oros-200 hover:bg-white text-oros-950 shadow-sm transition-colors"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] p-5 shadow-2xl">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100 mb-3">
              Edit Event
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1">Era</label>
                  <input
                    type="text"
                    required
                    value={editEra}
                    onChange={(e) => setEditEra(e.target.value)}
                    placeholder="Era name..."
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Significance</label>
                <select
                  value={editImportance}
                  onChange={(e) => setEditImportance(e.target.value as any)}
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                >
                  <option value="mythic">Mythic</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Event description..."
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1">Involved Entities</label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-oros-950 border border-oros-750 rounded-[3px]">
                  {worldEntities.map((ent) => {
                    const isSelected = editEntityIds.includes(ent.id)
                    return (
                      <button
                        type="button"
                        key={ent.id}
                        onClick={() => toggleEditEntityLink(ent.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-[2px] transition-colors ${
                          isSelected
                            ? 'bg-oros-800 border border-oros-500 text-oros-100 font-medium'
                            : 'bg-oros-900 border border-transparent text-oros-400 hover:text-oros-200'
                        }`}
                      >
                        {ent.title}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-3 py-1.5 rounded-[3px] text-xs text-oros-300 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[3px] text-xs font-semibold bg-oros-200 hover:bg-white text-oros-950 shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
