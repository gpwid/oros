import React, { useState } from 'react'
import { LoreEntity, InfoboxField } from '@shared/types'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { Plus, Trash2, ExternalLink, Camera, Image as ImageIcon, Edit2 } from 'lucide-react'
import { OrosLogoMark } from '../common/OrosLogo'

interface WikiInfoboxProps {
  entity: LoreEntity;
  isEditing?: boolean;
  onUpdate: (updates: Partial<LoreEntity>) => void;
}

export const WikiInfobox: React.FC<WikiInfoboxProps> = ({ entity, isEditing = false, onUpdate }) => {
  const { entities, activeWorldId, setSelectedEntityId, openTab } = useWorldStore()
  const { addToast } = useToastStore()
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [isEditingImageLabel, setIsEditingImageLabel] = useState(false)

  const allEntities = activeWorldId ? entities[activeWorldId] || [] : []

  const handleUpdateSectionTitle = (sectionIdx: number, newTitle: string) => {
    const updatedSections = [...entity.infobox.sections]
    updatedSections[sectionIdx] = {
      ...updatedSections[sectionIdx],
      title: newTitle
    }
    onUpdate({
      infobox: {
        ...entity.infobox,
        sections: updatedSections
      }
    })
  }

  const handleAddSection = () => {
    const newSection = {
      title: 'Attributes',
      fields: []
    }
    onUpdate({
      infobox: {
        ...entity.infobox,
        sections: [...entity.infobox.sections, newSection]
      }
    })
    addToast('Added new infobox section', 'success')
  }

  const handleDeleteSection = (sectionIdx: number) => {
    if (entity.infobox.sections.length <= 1) {
      addToast('Infobox must have at least one section', 'warning')
      return
    }
    const updatedSections = entity.infobox.sections.filter((_, idx) => idx !== sectionIdx)
    onUpdate({
      infobox: {
        ...entity.infobox,
        sections: updatedSections
      }
    })
    addToast('Section removed', 'info')
  }

  const handleUpdateField = (sectionIdx: number, fieldId: string, updates: Partial<InfoboxField>) => {
    const updatedSections = [...entity.infobox.sections]
    updatedSections[sectionIdx] = {
      ...updatedSections[sectionIdx],
      fields: updatedSections[sectionIdx].fields.map((f) => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    }
    onUpdate({
      infobox: {
        ...entity.infobox,
        sections: updatedSections
      }
    })
  }

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
      <div className="bg-oros-950 border-b border-oros-800 p-3 relative flex flex-col items-center">
        {isEditing ? (
          <input
            type="text"
            value={entity.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Card Title..."
            className="font-sans font-semibold text-sm tracking-tight text-oros-100 text-center bg-oros-900 border border-oros-750 focus:border-accent rounded px-2 py-0.5 w-full max-w-[240px] focus:outline-none shadow-sm"
          />
        ) : (
          <h3 className="font-sans font-semibold text-sm tracking-tight text-oros-100 text-center">
            {entity.title}
          </h3>
        )}
        {isEditing ? (
          <input
            type="text"
            value={entity.infobox.subtitle || ''}
            placeholder="Subtitle / Epithet..."
            onChange={(e) => onUpdate({ infobox: { ...entity.infobox, subtitle: e.target.value } })}
            className="text-[11px] text-center text-oros-200 bg-oros-900/90 border border-oros-750 rounded px-2 py-0.5 font-mono mt-1.5 w-full max-w-[220px] focus:outline-none focus:border-accent"
          />
        ) : entity.infobox.subtitle ? (
          <p className="text-[11px] text-oros-400 font-mono mt-0.5">
            {entity.infobox.subtitle}
          </p>
        ) : null}
      </div>

      {/* Main Portrait / Image */}
      <div className="p-3 text-center border-b border-oros-800 bg-oros-950 flex flex-col items-center">
        <div className="relative w-full h-44 rounded-[3px] overflow-hidden border border-oros-800 bg-oros-900/60 group/image">
          {Boolean(entity.avatar && typeof entity.avatar === 'string' && entity.avatar.trim() !== '') ? (
            <img
              src={entity.avatar}
              alt={entity.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full border border-dashed border-oros-800/80 flex flex-col items-center justify-center text-oros-600">
              <OrosLogoMark className="w-8 h-8 mb-1 text-oros-700/60" aria-label="Oros Brand Sigil" />
              <span className="text-[11px] font-mono text-oros-500">No portrait set</span>
            </div>
          )}

          {/* Change portrait overlay button - strictly inside the image container */}
          {isEditing && (
            <button
              onClick={handleImportAvatar}
              className="absolute inset-x-3 bottom-2 py-1.5 rounded-[3px] bg-oros-950/90 hover:bg-black/95 text-oros-200 hover:text-white font-medium text-[11px] backdrop-blur-md opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-1.5 shadow-md border border-oros-750 z-10"
            >
              <Camera className="w-3.5 h-3.5 text-oros-400" />
              <span>Import Local Portrait</span>
            </button>
          )}
        </div>

        {/* Editable Image Label / Caption */}
        {isEditing || isEditingImageLabel ? (
          <input
            type="text"
            autoFocus={isEditingImageLabel}
            value={entity.infobox.imageCaption !== undefined ? entity.infobox.imageCaption : `Archival visual record: ${entity.title}`}
            placeholder="Image caption or label..."
            onChange={(e) => onUpdate({ infobox: { ...entity.infobox, imageCaption: e.target.value } })}
            onBlur={() => setIsEditingImageLabel(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingImageLabel(false)
            }}
            className="text-[10px] text-center text-oros-200 bg-oros-900 border border-oros-750 focus:border-accent rounded px-2 py-0.5 font-mono mt-1.5 w-full focus:outline-none shadow-sm"
          />
        ) : (
          <div
            onClick={() => setIsEditingImageLabel(true)}
            className="group/caption flex items-center justify-center gap-1 cursor-pointer py-0.5 px-1 rounded hover:bg-oros-900/60 transition-colors mt-1.5"
            title="Click to edit image label"
          >
            <span className="text-[10px] text-oros-400 group-hover/caption:text-oros-200 font-mono truncate max-w-full">
              {entity.infobox.imageCaption || `Archival visual record: ${entity.title}`}
            </span>
            <Edit2 className="w-2.5 h-2.5 text-oros-500 opacity-0 group-hover/caption:opacity-100 transition-opacity shrink-0" />
          </div>
        )}
      </div>

      {/* Sections & Key-Value Attributes */}
      <div className="divide-y divide-oros-800">
        {entity.infobox.sections.map((section, sIdx) => (
          <div key={sIdx} className="p-3">
            <div className="text-[10px] font-mono font-medium tracking-wider uppercase text-oros-400 mb-2 border-b border-oros-800 pb-1 flex items-center justify-between gap-2">
              {isEditing ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSectionTitle(sIdx, e.target.value)}
                    placeholder="Section Name"
                    className="flex-1 bg-oros-950 border border-oros-750 focus:border-accent rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-oros-100 uppercase focus:outline-none"
                  />
                  {entity.infobox.sections.length > 1 && (
                    <button
                      onClick={() => handleDeleteSection(sIdx)}
                      className="p-1 text-oros-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete this section"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <span>{section.title}</span>
              )}
            </div>

            <table className="w-full border-collapse">
              <tbody>
                {section.fields.map((field) => {
                  const targetEntity = field.targetEntityId 
                    ? allEntities.find((e) => e.id === field.targetEntityId) 
                    : null

                  if (isEditing) {
                    return (
                      <tr key={field.id} className="border-b border-oros-800/40 last:border-none">
                        <td className="py-1.5 pr-1 w-2/5 align-top">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(sIdx, field.id, { label: e.target.value })}
                            placeholder="Label"
                            className="w-full bg-oros-950 border border-oros-750 focus:border-accent rounded px-1.5 py-0.5 font-mono text-[11px] text-oros-300 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 pl-1 align-top">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdateField(sIdx, field.id, { value: e.target.value })}
                              placeholder="Value"
                              className="flex-1 bg-oros-950 border border-oros-750 focus:border-accent rounded px-1.5 py-0.5 text-xs text-oros-100 focus:outline-none"
                            />
                            <button
                              onClick={() => handleDeleteField(sIdx, field.id)}
                              className="p-1 text-oros-500 hover:text-rose-400 rounded transition-colors shrink-0"
                              title="Delete attribute"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

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
                  placeholder="New label"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-1/2 bg-oros-950 border border-oros-750 rounded-[3px] px-2 py-1 text-[11px] text-oros-100 focus:outline-none focus:border-accent font-sans"
                />
                <input
                  type="text"
                  placeholder="New value"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="w-1/2 bg-oros-950 border border-oros-750 rounded-[3px] px-2 py-1 text-[11px] text-oros-100 focus:outline-none focus:border-accent font-sans"
                />
                <button
                  onClick={() => handleAddField(sIdx)}
                  className="btn-accent px-2 py-1 rounded-[3px] font-semibold shadow-sm transition-colors flex items-center gap-1 shrink-0"
                  title="Add Attribute"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Add</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Edit Mode Bottom Actions */}
        {isEditing && (
          <div className="p-3 bg-oros-950/60 border-t border-oros-800 flex items-center justify-start">
            <button
              onClick={handleAddSection}
              className="text-xs font-medium text-oros-300 hover:text-accent flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-accent" />
              <span>Add New Section</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
