import React, { useState, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { EntityCategory } from '@shared/types'
import { 
  DEFAULT_PRESET_CATEGORIES, 
  CATEGORY_ICONS, 
  CATEGORY_COLOR_PALETTES, 
  getCategoryIconComponent 
} from '../../utils/categoryIcons'
import { 
  X, Plus, Edit2, Trash2, Search, Check, Layers, AlertCircle, ArrowLeft, Tag
} from 'lucide-react'

interface CategoryManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCategory?: (categoryId: string) => void
  initialMode?: 'list' | 'create'
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  initialMode = 'list'
}) => {
  const { 
    activeWorldId, categories, entities, 
    createCategory, updateCategory, deleteCategory 
  } = useWorldStore()

  const worldId = activeWorldId || 'world-aethelgard'
  const worldCategories = categories[worldId] || DEFAULT_PRESET_CATEGORIES
  const worldEntities = entities[worldId] || []

  // Count entities for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const ent of worldEntities) {
      counts[ent.type] = (counts[ent.type] || 0) + 1
    }
    return counts
  }, [worldEntities])

  // UI state
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'delete'>(initialMode)
  const [search, setSearch] = useState('')
  const [editingCategory, setEditingCategory] = useState<EntityCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<EntityCategory | null>(null)
  const [fallbackCategory, setFallbackCategory] = useState<string>('character')

  // Form state
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('Layers')
  const [formColor, setFormColor] = useState('#eab308')
  const [formDesc, setFormDesc] = useState('')
  const [iconSearch, setIconSearch] = useState('')

  if (!isOpen) return null

  // Reset to create form
  const handleStartCreate = () => {
    setFormName('')
    setFormIcon('Layers')
    setFormColor('#eab308')
    setFormDesc('')
    setIconSearch('')
    setEditingCategory(null)
    setMode('create')
  }

  // Populate edit form
  const handleStartEdit = (cat: EntityCategory) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormIcon(cat.icon || 'Layers')
    setFormColor(cat.color || '#eab308')
    setFormDesc(cat.description || '')
    setIconSearch('')
    setMode('edit')
  }

  // Start delete confirmation
  const handleStartDelete = (cat: EntityCategory) => {
    setDeletingCategory(cat)
    // Find a fallback that isn't the one being deleted
    const fallback = worldCategories.find((c) => c.id !== cat.id)
    setFallbackCategory(fallback?.id || 'character')
    setMode('delete')
  }

  // Submit create or edit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    if (mode === 'create') {
      const created = createCategory(formName.trim(), formIcon, formColor, formDesc.trim())
      if (onSelectCategory) {
        onSelectCategory(created.id)
      }
      setMode('list')
    } else if (mode === 'edit' && editingCategory) {
      updateCategory(editingCategory.id, {
        name: formName.trim(),
        icon: formIcon,
        color: formColor,
        description: formDesc.trim()
      })
      setMode('list')
    }
  }

  // Submit deletion
  const handleDeleteConfirm = () => {
    if (!deletingCategory) return
    deleteCategory(deletingCategory.id, fallbackCategory)
    setDeletingCategory(null)
    setMode('list')
  }

  // Filtered categories for list
  const filteredCategories = worldCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  )

  // Filtered icons for picker
  const filteredIcons = CATEGORY_ICONS.filter(
    (item) =>
      item.id.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.label.toLowerCase().includes(iconSearch.toLowerCase())
  )

  const FormIconComponent = getCategoryIconComponent(formIcon)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 px-5 border-b border-oros-800 bg-oros-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[3px] bg-oros-850 border border-oros-750 text-oros-300 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5 text-oros-400" />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-oros-100 flex items-center gap-2 tracking-tight">
                Manage Categories & Labels
              </h2>
              <p className="text-xs text-oros-400 font-sans">
                Define classification taxonomy, assign icons & tone accents across your world.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'list' && (
            <div className="space-y-3.5">
              {/* Top Bar: Search & New Category Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-oros-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] pl-8 pr-3 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 font-sans"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-oros-500 hover:text-oros-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  onClick={handleStartCreate}
                  className="px-3 py-1.5 rounded-[3px] bg-oros-200 hover:bg-white text-oros-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {filteredCategories.map((cat) => {
                  const IconComp = getCategoryIconComponent(cat.icon)
                  const count = categoryCounts[cat.id] || 0
                  return (
                    <div
                      key={cat.id}
                      className="bg-oros-950 border border-oros-800 hover:border-oros-700 rounded-[3px] p-3 flex flex-col justify-between gap-2 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-[2px] flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${cat.color || '#94a3b8'}15`,
                              borderColor: `${cat.color || '#94a3b8'}40`,
                              color: cat.color || '#cbd5e1'
                            }}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs text-oros-200 truncate">
                                {cat.name}
                              </span>
                              {cat.isPreset ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-oros-850 text-oros-400 uppercase tracking-wider font-mono">
                                  Preset
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-oros-800 text-oros-300 border border-oros-700 uppercase tracking-wider font-mono">
                                  Custom
                                </span>
                              )}
                            </div>
                            {cat.description && (
                              <p className="text-[11px] text-oros-400 line-clamp-1 mt-0.5 font-sans">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            title="Edit Category"
                            className="p-1 rounded-[3px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartDelete(cat)}
                            title="Delete Category"
                            className="p-1 rounded-[3px] text-oros-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Count & Quick Select */}
                      <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-oros-800 text-oros-400">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cat.color || '#94a3b8' }}
                          />
                          <span>
                            {count} {count === 1 ? 'card' : 'cards'}
                          </span>
                        </span>

                        {onSelectCategory && (
                          <button
                            onClick={() => {
                              onSelectCategory(cat.id)
                              onClose()
                            }}
                            className="text-oros-300 hover:text-oros-100 font-medium text-[11px] font-sans flex items-center gap-1"
                          >
                            Select & Filter →
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="p-8 text-center bg-oros-950 border border-oros-800 rounded-[3px]">
                  <Layers className="w-6 h-6 text-oros-700 mx-auto mb-2" />
                  <p className="text-xs text-oros-400 font-sans">No categories found matching "{search}".</p>
                </div>
              )}
            </div>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-oros-800">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex items-center gap-1.5 text-xs text-oros-400 hover:text-oros-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Categories</span>
                </button>
                <span className="text-xs font-semibold text-oros-200 font-sans tracking-tight">
                  {mode === 'create' ? 'Create New Category' : `Edit Category: ${editingCategory?.name}`}
                </span>
              </div>

              {/* Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1">
                    Category Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Deities & Demigods, Airships, Beasts"
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1">
                    Description <span className="text-oros-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief definition or lore scope"
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 font-sans"
                  />
                </div>
              </div>

              {/* Color Palette Picker */}
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1.5">
                  Category Color Tone
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {CATEGORY_COLOR_PALETTES.map((color) => {
                    const isSelected = formColor.toLowerCase() === color.hex.toLowerCase()
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setFormColor(color.hex)}
                        title={color.name}
                        className={`w-6 h-6 rounded-[2px] flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-oros-100 ring-offset-1 ring-offset-oros-950'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-oros-950 stroke-[3]" />}
                      </button>
                    )
                  })}
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-oros-800">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-6 h-6 rounded-[2px] cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[11px] font-mono text-oros-400">{formColor}</span>
                  </div>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-oros-300">
                    Select Icon
                  </label>
                  <div className="relative w-40">
                    <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-oros-500" />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="Filter icons..."
                      className="w-full bg-oros-950 border border-oros-750 rounded-[3px] pl-6 pr-2 py-1 text-[11px] text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-1.5 p-2 bg-oros-950 border border-oros-800 rounded-[3px] max-h-36 overflow-y-auto">
                  {filteredIcons.map((item) => {
                    const Icon = item.icon
                    const isSelected = formIcon === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormIcon(item.id)}
                        title={item.label}
                        className={`p-1.5 rounded-[2px] flex flex-col items-center justify-center gap-0.5 transition-all ${
                          isSelected
                            ? 'bg-oros-800 text-oros-100 border border-oros-600'
                            : 'text-oros-400 hover:text-oros-200 hover:bg-oros-900'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[9px] truncate max-w-full font-mono">{item.id}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-oros-950 border border-oros-800 rounded-[3px]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-oros-500 block mb-1.5">
                  Live Preview
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Badge Preview */}
                  <div
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-xs font-medium border"
                    style={{
                      backgroundColor: `${formColor}15`,
                      borderColor: `${formColor}40`,
                      color: formColor
                    }}
                  >
                    <FormIconComponent className="w-3.5 h-3.5" />
                    <span>{formName || 'Category Name'}</span>
                  </div>

                  {/* Filter Pill Preview */}
                  <div className="px-2.5 py-1 rounded-[3px] text-xs font-medium bg-oros-900 border border-oros-750 text-oros-200 flex items-center gap-1.5">
                    <FormIconComponent className="w-3.5 h-3.5" style={{ color: formColor }} />
                    <span>{formName || 'Category Name'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-[2px] bg-oros-800 text-oros-400 font-mono">
                      0
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-3 py-1.5 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[3px] bg-oros-200 hover:bg-white text-oros-950 font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{mode === 'create' ? 'Create Category' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {mode === 'delete' && deletingCategory && (
            <div className="space-y-3.5 py-1">
              <div className="flex items-start gap-3 p-3 bg-rose-950/40 border border-rose-900/60 rounded-[3px] text-rose-300 text-xs leading-relaxed font-sans">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-200 text-xs mb-0.5">
                    Delete Category "{deletingCategory.name}"?
                  </h4>
                  <p>
                    Are you sure you want to delete this category? This action removes the label from your world codex.
                  </p>
                </div>
              </div>

              {/* Reassignment Dropdown if cards exist */}
              <div className="p-3 bg-oros-950 border border-oros-800 rounded-[3px] space-y-2.5">
                <div className="text-xs text-oros-200 font-medium font-sans">
                  {categoryCounts[deletingCategory.id] || 0} lore cards are currently filed under this category.
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-oros-300 mb-1 font-sans">
                    Reassign affected lore cards to:
                  </label>
                  <select
                    value={fallbackCategory}
                    onChange={(e) => setFallbackCategory(e.target.value)}
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                  >
                    {worldCategories
                      .filter((c) => c.id !== deletingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingCategory(null)
                    setMode('list')
                  }}
                  className="px-3 py-1.5 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-3.5 py-1.5 rounded-[3px] bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete & Reassign</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
