import React, { useState, useEffect, useMemo } from 'react'
import { X, User, MapPin, Shield, Sparkles, Gem, FileText, Check, Tag, Folder, Plus } from 'lucide-react'
import { ENTITY_TEMPLATES, EntityArchetypeTemplate } from '../../utils/entityTemplates'
import { DEFAULT_PRESET_CATEGORIES } from '../../utils/categoryIcons'
import { useWorldStore } from '../../store/useWorldStore'

interface NewEntityModalProps {
  isOpen: boolean;
  defaultType?: string;
  defaultFolderId?: string | null;
  onConfirm: (
    title: string, 
    templateId: string, 
    folderId?: string | null, 
    categoryId?: string | null, 
    tags?: string[]
  ) => void;
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
  const { folders, categories, entities, activeWorldId } = useWorldStore()
  const worldFolders = activeWorldId ? folders[activeWorldId] || [] : []
  const rawCategories = activeWorldId ? categories[activeWorldId] || [] : []
  const worldCategories = rawCategories.length > 0 ? rawCategories : DEFAULT_PRESET_CATEGORIES
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []

  const [title, setTitle] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const matched = ENTITY_TEMPLATES.find(t => t.entityType === defaultType)
    return matched ? matched.id : 'character'
  })
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(defaultFolderId)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultType || 'character')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Compute all existing tags from current world
  const existingTags = useMemo(() => {
    const set = new Set<string>()
    worldEntities.forEach((e) => {
      ;(e.tags || []).forEach((t) => {
        if (t && t.trim()) set.add(t.trim())
      })
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [worldEntities])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      const matched = ENTITY_TEMPLATES.find(t => t.entityType === defaultType)
      setSelectedTemplateId(matched ? matched.id : 'character')
      setSelectedFolderId(defaultFolderId)
      setSelectedCategoryId(defaultType || 'character')
      setSelectedTags([])
      setTagInput('')
    }
  }, [isOpen, defaultType, defaultFolderId])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleAddCustomTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onConfirm(
      title.trim(), 
      selectedTemplateId, 
      selectedFolderId, 
      selectedCategoryId, 
      selectedTags
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div 
        className="bg-oros-900 border border-oros-750 rounded-[4px] max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-oros-800 flex items-center justify-between bg-oros-950 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-oros-100 font-sans">
              Create New Lore Card
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="new-entity-form" onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-oros-200">
          {/* Card Title Input */}
          <div>
            <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider block mb-1">
              Article / Card Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lord Commander Vane, Citadel of Stars..."
              className="w-full px-3 py-2 text-sm bg-oros-950 border border-oros-750 rounded-[3px] text-oros-100 focus:outline-none focus:border-accent font-sans"
              autoFocus
            />
          </div>

          {/* Category / Label Selector */}
          <div>
            <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3 h-3 text-accent" />
              <span>Category / Label</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {worldCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id)
                      // Auto-sync template if matched
                      const matched = ENTITY_TEMPLATES.find((t) => t.entityType === cat.id)
                      if (matched) setSelectedTemplateId(matched.id)
                    }}
                    className={`px-2.5 py-1 rounded-[3px] text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-accent-muted text-accent border-accent/50 font-semibold shadow-sm'
                        : 'bg-oros-950 text-oros-400 border-oros-800 hover:text-oros-200 hover:bg-oros-850'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color || 'var(--oros-accent)' }}
                    />
                    <span>{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Archetype Template Selector */}
          <div>
            <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider block mb-1.5">
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

          {/* Tags Picker & Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-accent" />
                <span>Tags / Keywords ({selectedTags.length})</span>
              </label>
            </div>

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-[3px] bg-oros-950/80 border border-oros-800">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-accent/20 border border-accent/40 text-accent text-xs font-mono"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-400 text-accent/70 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Already Made Tags List to Click and Toggle */}
            {existingTags.length > 0 && (
              <div className="mb-2">
                <span className="text-[10px] font-mono uppercase text-oros-500 block mb-1">
                  Pick from existing tags:
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 rounded-[3px] bg-oros-950 border border-oros-850">
                  {existingTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2 py-0.5 rounded-[2px] text-[11px] font-mono transition-colors flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-accent text-accent-contrast border-accent font-semibold shadow-xs'
                            : 'bg-oros-900 hover:bg-oros-850 text-oros-300 border-oros-800 hover:border-oros-750'
                        }`}
                      >
                        <span>#{tag}</span>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add Custom Tag Input */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomTag()
                  }
                }}
                placeholder="Type new tag and press Enter..."
                className="flex-1 px-2.5 py-1 text-xs bg-oros-950 border border-oros-750 rounded-[3px] text-oros-100 focus:outline-none focus:border-accent font-mono placeholder:text-oros-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!tagInput.trim()}
                className="px-2.5 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 disabled:opacity-40 text-oros-200 border border-oros-750 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Folder Destination (if folders exist) */}
          {worldFolders.length > 0 && (
            <div>
              <label className="text-[11px] font-mono text-oros-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Folder className="w-3 h-3 text-oros-400" />
                <span>Vault Folder Destination (Optional)</span>
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
        </form>

        {/* Pinned Visible Footer Buttons (Anchored outside scrollable body) */}
        <div className="px-4 py-3 border-t border-oros-800 bg-oros-950/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 border border-oros-750 text-oros-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-entity-form"
            disabled={!title.trim()}
            className="px-4 py-1.5 rounded-[3px] btn-accent text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Card</span>
          </button>
        </div>
      </div>
    </div>
  )
}
