import React, { useState } from 'react'
import { LoreEntity, InfoboxField } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { Plus, Edit3, Check, Trash2, ExternalLink } from 'lucide-react'

interface WikiInfoboxProps {
  entity: LoreEntity;
  onUpdate: (updates: Partial<LoreEntity>) => void;
}

export const WikiInfobox: React.FC<WikiInfoboxProps> = ({ entity, onUpdate }) => {
  const { entities, activeWorldId, setSelectedEntityId } = useWorldStore()
  const [isEditing, setIsEditing] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')

  const allEntities = activeWorldId ? entities[activeWorldId] || [] : []

  const handleAddField = (sectionIdx: number) => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) return

    const newField: InfoboxField = {
      id: `f-${Date.now()}`,
      label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
      type: 'text'
    }

    const updatedSections = [...entity.infobox.sections]
    updatedSections[sectionIdx] = {
      ...updatedSections[sectionIdx],
      fields: [...updatedSections[sectionIdx].fields, newField]
    }

    onUpdate({
      infobox: {
        ...entity.infobox,
        sections: updatedSections
      }
    })

    setNewFieldLabel('')
    setNewFieldValue('')
  }

  const handleDeleteField = (sectionIdx: number, fieldId: string) => {
    const updatedSections = [...entity.infobox.sections]
    updatedSections[sectionIdx] = {
      ...updatedSections[sectionIdx],
      fields: updatedSections[sectionIdx].fields.filter((f) => f.id !== fieldId)
    }

    onUpdate({
      infobox: {
        ...entity.infobox,
        sections: updatedSections
      }
    })
  }

  return (
    <aside className="w-80 shrink-0 bg-oros-900/90 border border-oros-700/60 rounded-xl overflow-hidden shadow-xl text-xs select-text my-2 ml-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-oros-800 to-oros-900 border-b border-oros-700/60 p-3 text-center">
        <h3 className="font-serif font-bold text-sm tracking-wide text-slate-100">
          {entity.title}
        </h3>
        {entity.infobox.subtitle && (
          <p className="text-[11px] text-gold-400/90 font-medium mt-0.5">
            {entity.infobox.subtitle}
          </p>
        )}
      </div>

      {/* Main Portrait / Image */}
      {entity.avatar && (
        <div className="p-3 text-center border-b border-oros-800/60 bg-oros-950/40">
          <img
            src={entity.avatar}
            alt={entity.title}
            className="w-full h-44 object-cover rounded-lg border border-oros-700/50 shadow-inner"
          />
          <span className="block text-[10px] text-oros-400 mt-1.5 italic">
            Official archival depiction of {entity.title}
          </span>
        </div>
      )}

      {/* Sections & Key-Value Attributes */}
      <div className="divide-y divide-oros-800/60">
        {entity.infobox.sections.map((section, sIdx) => (
          <div key={sIdx} className="p-3">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-oros-300 mb-2 border-b border-oros-800 pb-1 flex items-center justify-between">
              <span>{section.title}</span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-oros-400 hover:text-gold-400"
              >
                {isEditing ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              </button>
            </div>

            <table className="w-full border-collapse">
              <tbody>
                {section.fields.map((field) => {
                  const targetEntity = field.targetEntityId 
                    ? allEntities.find((e) => e.id === field.targetEntityId) 
                    : null

                  return (
                    <tr key={field.id} className="border-b border-oros-800/30 last:border-none">
                      <th className="py-1.5 pr-2 text-left font-medium text-oros-400 w-1/3 align-top">
                        {field.label}
                      </th>
                      <td className="py-1.5 pl-2 text-slate-200 align-top">
                        {targetEntity ? (
                          <button
                            onClick={() => setSelectedEntityId(targetEntity.id)}
                            className="text-gold-400 hover:underline flex items-center gap-1 font-medium inline-flex text-left"
                          >
                            <span>{targetEntity.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                          </button>
                        ) : (
                          <span>{field.value}</span>
                        )}
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteField(sIdx, field.id)}
                            className="ml-2 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-2.5 h-2.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Quick Add Field while editing */}
            {isEditing && (
              <div className="mt-3 pt-2 border-t border-dashed border-oros-800 flex gap-1">
                <input
                  type="text"
                  placeholder="Field label"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-1/2 bg-oros-950 border border-oros-700 rounded px-1.5 py-1 text-[11px] text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-1/2 bg-oros-950 border border-oros-700 rounded px-1.5 py-1 text-[11px] text-slate-100"
                />
                <button
                  onClick={() => handleAddField(sIdx)}
                  className="p-1 rounded bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
