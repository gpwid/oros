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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-oros-900 border border-oros-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-oros-800/80 bg-oros-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-100 flex items-center gap-2">
                Manage Categories & Labels
              </h2>
              <p className="text-xs text-oros-400">
                Create custom lore categories, assign icons & colors, or edit existing presets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-oros-400 hover:text-slate-200 hover:bg-oros-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'list' && (
            <div className="space-y-4">
              {/* Top Bar: Search & New Category Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-oros-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full bg-oros-950/90 border border-oros-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-oros-500 focus:outline-none focus:border-gold-400"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-oros-500 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  onClick={handleStartCreate}
                  className="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Category</span>
                </button>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {filteredCategories.map((cat) => {
                  const IconComp = getCategoryIconComponent(cat.icon)
                  const count = categoryCounts[cat.id] || 0
                  return (
                    <div
                      key={cat.id}
                      className="bg-oros-950/70 border border-oros-800/80 hover:border-oros-700 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${cat.color || '#eab308'}15`,
                              borderColor: `${cat.color || '#eab308'}40`,
                              color: cat.color || '#eab308'
                            }}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-slate-200 truncate">
                                {cat.name}
                              </span>
                              {cat.isPreset ? (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-oros-800 text-oros-400 uppercase tracking-wider font-mono">
                                  Preset
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-gold-500/10 text-gold-400 border border-gold-500/20 uppercase tracking-wider font-mono">
                                  Custom
                                </span>
                              )}
                            </div>
                            {cat.description && (
                              <p className="text-[11px] text-oros-400 line-clamp-1 mt-0.5">
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
                            className="p-1.5 rounded-lg text-oros-400 hover:text-gold-300 hover:bg-oros-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartDelete(cat)}
                            title="Delete Category"
                            className="p-1.5 rounded-lg text-oros-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Count & Quick Select */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-oros-800/40 text-oros-400">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cat.color || '#eab308' }}
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
                            className="text-gold-400 hover:text-gold-300 font-medium text-[11px]"
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
                <div className="p-8 text-center bg-oros-950/40 border border-oros-800/50 rounded-xl">
                  <Layers className="w-8 h-8 text-oros-600 mx-auto mb-2" />
                  <p className="text-xs text-oros-400">No categories found matching "{search}".</p>
                </div>
              )}
            </div>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-oros-800/60">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex items-center gap-1.5 text-xs text-oros-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Categories</span>
                </button>
                <span className="text-xs font-semibold text-slate-300 font-serif">
                  {mode === 'create' ? 'Forge New Category' : `Edit Category: ${editingCategory?.name}`}
                </span>
              </div>

              {/* Name & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-oros-300 mb-1.5">
                    Category Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Deities & Demigods, Airships, Beasts"
                    className="w-full bg-oros-950 border border-oros-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-oros-500 focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-oros-300 mb-1.5">
                    Description <span className="text-oros-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief definition or lore scope"
                    className="w-full bg-oros-950 border border-oros-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-oros-500 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              {/* Color Palette Picker */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-2">
                  Category Color Accent
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {CATEGORY_COLOR_PALETTES.map((color) => {
                    const isSelected = formColor.toLowerCase() === color.hex.toLowerCase()
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setFormColor(color.hex)}
                        title={color.name}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-oros-950 scale-110 shadow-lg'
                            : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-oros-950 stroke-[3]" />}
                      </button>
                    )
                  })}
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-oros-800">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[11px] font-mono text-oros-400">{formColor}</span>
                  </div>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-oros-300">
                    Select Icon
                  </label>
                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-oros-500" />
                    <input
                      type="text"
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      placeholder="Filter icons..."
                      className="w-full bg-oros-950 border border-oros-800 rounded-lg pl-7 pr-2 py-1 text-[11px] text-slate-100 placeholder-oros-500 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2 p-3 bg-oros-950/70 border border-oros-800 rounded-xl max-h-40 overflow-y-auto">
                  {filteredIcons.map((item) => {
                    const Icon = item.icon
                    const isSelected = formIcon === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormIcon(item.id)}
                        title={item.label}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-gold-500/20 text-gold-300 border border-gold-400/60 shadow-md'
                            : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800/60'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[9px] truncate max-w-full">{item.id}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-oros-950/80 border border-oros-800 rounded-xl">
                <span className="text-[10px] font-mono uppercase tracking-wider text-oros-400 block mb-2">
                  Live Preview
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  {/* Badge Preview */}
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-sm"
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
                  <div className="px-3 py-1 rounded-lg text-xs font-medium bg-oros-900 border border-oros-700 text-slate-200 flex items-center gap-1.5">
                    <FormIconComponent className="w-3.5 h-3.5" style={{ color: formColor }} />
                    <span>{formName || 'Category Name'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-oros-800 text-oros-400">
                      0
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-oros-800/80">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-4 py-2 rounded-xl text-xs text-oros-300 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{mode === 'create' ? 'Create Category' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {mode === 'delete' && deletingCategory && (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-200 text-sm mb-1">
                    Delete Category "{deletingCategory.name}"?
                  </h4>
                  <p>
                    Are you sure you want to delete this category? This action removes the label from your world codex.
                  </p>
                </div>
              </div>

              {/* Reassignment Dropdown if cards exist */}
              <div className="p-4 bg-oros-950/70 border border-oros-800 rounded-xl space-y-3">
                <div className="text-xs text-slate-200 font-medium">
                  {categoryCounts[deletingCategory.id] || 0} lore cards are currently filed under this category.
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-oros-300 mb-1">
                    Reassign affected lore cards to:
                  </label>
                  <select
                    value={fallbackCategory}
                    onChange={(e) => setFallbackCategory(e.target.value)}
                    className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingCategory(null)
                    setMode('list')
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-oros-300 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
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
