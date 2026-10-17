import React, { useState, useEffect } from 'react'
import { X, User, MapPin, Shield, Sparkles, Gem, FileText, Check } from 'lucide-react'
import { ENTITY_TEMPLATES, EntityArchetypeTemplate } from '../../utils/entityTemplates'
import { useWorldStore } from '../../store/useWorldStore'

interface NewEntityModalProps {
  isOpen: boolean;
  defaultType?: string;
  defaultFolderId?: string | null;
  onConfirm: (title: string, templateId: string, folderId?: string | null) => void;
  onCancel: () => void;
}

const TEMPLATE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  User,
  MapPin,
  Shield,
  Sparkles,
  Gem,
  FileText
}

export const NewEntityModal: React.FC<NewEntityModalProps> = ({
  isOpen,
  defaultType = 'character',
  defaultFolderId = null,
  onConfirm,
  onCancel
}) => {
  const { folders, activeWorldId } = useWorldStore()
  const worldFolders = activeWorldId ? folders[activeWorldId] || [] : []

  const [title, setTitle] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const matched = ENTITY_TEMPLATES.find(t => t.entityType === defaultType)
    return matched ? matched.id : 'character'
  })
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(defaultFolderId)

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      const matched = ENTITY_TEMPLATES.find(t => t.entityType === defaultType)
      setSelectedTemplateId(matched ? matched.id : 'character')
      setSelectedFolderId(defaultFolderId)
    }
  }, [isOpen, defaultType, defaultFolderId])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter' && title.trim()) {
        e.preventDefault()
        onConfirm(title.trim(), selectedTemplateId, selectedFolderId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, title, selectedTemplateId, selectedFolderId, onConfirm, onCancel])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onConfirm(title.trim(), selectedTemplateId, selectedFolderId)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div 
        className="bg-oros-900 border border-oros-750 rounded-[4px] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-oros-800 flex items-center justify-between bg-oros-950">
          <div>
            <h3 className="text-sm font-semibold text-oros-100 font-sans">
              Create New Lore Card
            </h3>
            <p className="text-[11px] text-oros-400 font-sans mt-0.5">
              Choose an archetype template to pre-populate infobox fields and structure.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Card Title Input */}
          <div>
            <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider block mb-1">
              Article / Card Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lord Commander Vane, Citadel of Stars..."
              className="w-full px-3 py-2 text-sm bg-oros-950 border border-oros-750 rounded-[3px] text-oros-100 focus:outline-none focus:border-accent font-sans"
              autoFocus
            />
          </div>

          {/* Archetype Template Selector */}
          <div>
            <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider block mb-2">
              Select Archetype Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ENTITY_TEMPLATES.map((tmpl) => {
                const IconComponent = TEMPLATE_ICONS[tmpl.icon] || FileText
                const isSelected = tmpl.id === selectedTemplateId
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`p-2.5 rounded-[3px] border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-accent-muted border-accent/60 shadow-sm text-oros-100'
                        : 'bg-oros-950 border-oros-800 hover:border-oros-700 hover:bg-oros-850/80 text-oros-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-oros-400'}`} />
                        <span className="text-xs font-semibold font-sans">
                          {tmpl.name}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-oros-400 font-sans line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Folder Destination (if folders exist) */}
          {worldFolders.length > 0 && (
            <div>
              <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider block mb-1">
                Vault Folder Destination (Optional)
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                className="w-full px-2.5 py-1.5 text-xs bg-oros-950 border border-oros-750 rounded-[3px] text-oros-200 focus:outline-none focus:border-accent font-mono"
              >
                <option value="">(Root Vault)</option>
                {worldFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-oros-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 border border-oros-750 text-oros-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 rounded-[3px] btn-accent text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              Create Card
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
