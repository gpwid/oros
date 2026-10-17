import React, { useState } from 'react'
import { LoreEntity, InfoboxField } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { Plus, Edit3, Check, Trash2, ExternalLink, Camera, Image as ImageIcon } from 'lucide-react'

interface WikiInfoboxProps {
  entity: LoreEntity;
  onUpdate: (updates: Partial<LoreEntity>) => void;
}

export const WikiInfobox: React.FC<WikiInfoboxProps> = ({ entity, onUpdate }) => {
  const { entities, activeWorldId, setSelectedEntityId, openTab } = useWorldStore()
  const { addToast } = useToastStore()
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

  const handleImportAvatar = async () => {
    if (window.oros) {
      const assetUrl = await window.oros.importAsset()
      if (assetUrl) {
        onUpdate({ avatar: assetUrl })
        addToast('Updated portrait from local vault asset', 'success')
      }
    } else {
      addToast('Local asset importer requires desktop app', 'warning')
    }
  }

  return (
    <aside className="w-full xl:w-80 max-w-sm xl:max-w-none shrink-0 bg-oros-900 border border-oros-750 rounded-[4px] overflow-hidden shadow-xl text-xs select-text my-2 mx-auto xl:mx-0">
      {/* Top Banner / Header */}
      <div className="bg-oros-950 border-b border-oros-800 p-3 text-center">
        <h3 className="font-sans font-semibold text-sm tracking-tight text-oros-100">
          {entity.title}
        </h3>
        {entity.infobox.subtitle && (
          <p className="text-[11px] text-oros-400 font-mono mt-0.5">
            {entity.infobox.subtitle}
          </p>
        )}
      </div>

      {/* Main Portrait / Image */}
      <div className="p-3 text-center border-b border-oros-800 bg-oros-950 relative group">
        {entity.avatar ? (
          <img
            src={entity.avatar}
            alt={entity.title}
            className="w-full h-44 object-cover rounded-[3px] border border-oros-800"
          />
        ) : (
          <div className="w-full h-44 bg-oros-900/60 rounded-[3px] border border-dashed border-oros-800 flex flex-col items-center justify-center text-oros-600">
            <ImageIcon className="w-7 h-7 mb-1 opacity-40" />
            <span className="text-[11px] font-mono">No portrait set</span>
          </div>
        )}

        {/* Change portrait overlay button */}
        <button
          onClick={handleImportAvatar}
          className="absolute inset-x-6 bottom-6 py-1.5 rounded-[3px] bg-oros-950/95 hover:bg-black text-oros-200 font-medium text-[11px] backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 shadow-lg border border-oros-750"
        >
          <Camera className="w-3.5 h-3.5 text-oros-400" />
          <span>Import Local Portrait</span>
        </button>

        <span className="block text-[10px] text-oros-500 font-mono mt-1.5">
          Archival visual record: {entity.title}
        </span>
      </div>

      {/* Sections & Key-Value Attributes */}
      <div className="divide-y divide-oros-800">
        {entity.infobox.sections.map((section, sIdx) => (
          <div key={sIdx} className="p-3">
            <div className="text-[10px] font-mono font-medium tracking-wider uppercase text-oros-400 mb-2 border-b border-oros-800 pb-1 flex items-center justify-between">
              <span>{section.title}</span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-oros-400 hover:text-oros-200 p-0.5 rounded-[2px]"
              >
                {isEditing ? <Check className="w-3 h-3 text-emerald-400" /> : <Edit3 className="w-3 h-3" />}
              </button>
            </div>

            <table className="w-full border-collapse">
              <tbody>
                {section.fields.map((field) => {
                  const targetEntity = field.targetEntityId 
                    ? allEntities.find((e) => e.id === field.targetEntityId) 
                    : null

                  return (
                    <tr key={field.id} className="border-b border-oros-800/40 last:border-none">
                      <th className="py-1.5 pr-2 text-left font-mono font-normal text-oros-400 w-1/3 align-top text-[11px]">
                        {field.label}
                      </th>
                      <td className="py-1.5 pl-2 text-oros-200 align-top text-xs">
                        {targetEntity ? (
                          <button
                            onClick={() => {
                              setSelectedEntityId(targetEntity.id)
                              openTab({
                                title: targetEntity.title,
                                type: 'wiki',
                                targetId: targetEntity.id
                              })
                            }}
                            className="text-oros-300 hover:text-white hover:underline flex items-center gap-1 font-medium inline-flex text-left transition-colors"
                          >
                            <span>{targetEntity.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                          </button>
                        ) : (
                          <span>{field.value}</span>
                        )}
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteField(sIdx, field.id)}
                            className="ml-2 text-rose-400 hover:text-rose-300"
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
              <div className="mt-2.5 pt-2 border-t border-dashed border-oros-800 flex gap-1">
                <input
                  type="text"
                  placeholder="Field label"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-1/2 bg-oros-950 border border-oros-750 rounded-[3px] px-2 py-1 text-[11px] text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-1/2 bg-oros-950 border border-oros-750 rounded-[3px] px-2 py-1 text-[11px] text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                />
                <button
                  onClick={() => handleAddField(sIdx)}
                  className="btn-accent p-1 rounded-[3px] font-semibold shadow-sm transition-colors"
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
