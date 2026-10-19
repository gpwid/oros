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
  X, Plus, Edit2, Trash2, Search, Check, AlertCircle, ArrowLeft, Tag
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
  const [formColor, setFormColor] = useState('#f5c542')
  const [formDesc, setFormDesc] = useState('')
  const [iconSearch, setIconSearch] = useState('')

  if (!isOpen) return null

  const handleStartCreate = () => {
    setFormName('')
    setFormIcon('Layers')
    setFormColor('#f5c542')
    setFormDesc('')
    setIconSearch('')
    setEditingCategory(null)
    setMode('create')
  }

  const handleStartEdit = (cat: EntityCategory) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormIcon(cat.icon || 'Layers')
    setFormColor(cat.color || '#f5c542')
    setFormDesc(cat.description || '')
    setIconSearch('')
    setMode('edit')
  }

  const handleStartDelete = (cat: EntityCategory) => {
    setDeletingCategory(cat)
    const fallback = worldCategories.find((c) => c.id !== cat.id)
    setFallbackCategory(fallback?.id || 'character')
    setMode('delete')
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const sanitizedColor = formColor.trim().startsWith('#') ? formColor.trim() : `#${formColor.trim()}`

    if (mode === 'create') {
      const created = createCategory(formName.trim(), formIcon, sanitizedColor, formDesc.trim())
      if (onSelectCategory) {
        onSelectCategory(created.id)
      }
      setMode('list')
    } else if (mode === 'edit' && editingCategory) {
      updateCategory(editingCategory.id, {
        name: formName.trim(),
        icon: formIcon,
        color: sanitizedColor,
        description: formDesc.trim()
      })
      setMode('list')
    }
  }

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return
    deleteCategory(deletingCategory.id, fallbackCategory)
    setDeletingCategory(null)
    setMode('list')
  }

  const filteredCategories = worldCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  )

  const filteredIcons = CATEGORY_ICONS.filter(
    (item) =>
      item.id.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.label.toLowerCase().includes(iconSearch.toLowerCase())
  )

  const FormIconComponent = getCategoryIconComponent(formIcon)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-oros-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] select-text text-oros-100 animate-modal-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-accent" />
            <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-oros-100">
              {mode === 'list' ? 'Lore Categories' : mode === 'delete' ? 'Delete Category' : mode === 'create' ? 'New Category' : 'Edit Category'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {mode === 'list' && (
            <div className="space-y-2.5">
              {/* Search & Action Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-oros-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] pl-7 pr-2.5 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                  />
                </div>

                <button
                  onClick={handleStartCreate}
                  className="btn-accent px-2.5 py-1 rounded-[3px] font-semibold text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>

              {/* Categories List */}
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-0.5">
                {filteredCategories.map((cat) => {
                  const IconComp = getCategoryIconComponent(cat.icon)
                  const count = categoryCounts[cat.id] || 0
                  return (
                    <div
                      key={cat.id}
                      className="bg-oros-850/80 hover:bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || '#94a3b8' }}
                        />
                        <IconComp className="w-3.5 h-3.5 shrink-0 text-oros-300" />
                        <span className="text-xs font-medium text-oros-100 truncate">{cat.name}</span>
                        <span className="font-mono text-[10px] text-oros-400 bg-oros-900 px-1 py-0.2 rounded border border-oros-800">
                          {count}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-1 rounded text-oros-400 hover:text-oros-100 hover:bg-oros-800"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleStartDelete(cat)}
                          className="p-1 rounded text-oros-400 hover:text-rose-400 hover:bg-oros-800"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(mode === 'create' || mode === 'edit') && (
            <form id="category-form" onSubmit={handleFormSubmit} className="space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-oros-800">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="flex items-center gap-1 text-[11px] text-oros-400 hover:text-oros-200"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Categories</span>
                </button>
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-medium border"
                  style={{
                    backgroundColor: `${formColor}18`,
                    borderColor: `${formColor}50`,
                    color: formColor
                  }}
                >
                  <FormIconComponent className="w-3 h-3" />
                  <span>{formName || 'Preview'}</span>
                </div>
              </div>

              {/* Name & Desc */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Factions, Deities"
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Brief lore scope"
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Revamped Atmospheric Accent / Color Selection (matching our Vault UI) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400">
                    Atmospheric Accent
                  </label>
                  <span className="text-[9px] font-mono text-oros-400 uppercase tracking-wider">
                    {CATEGORY_COLOR_PALETTES.find(c => c.hex.toLowerCase() === formColor.toLowerCase())?.name || 'Custom'}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {CATEGORY_COLOR_PALETTES.map((color) => {
                    const isSelected = formColor.toLowerCase() === color.hex.toLowerCase()
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setFormColor(color.hex)}
                        className={`px-2 py-1.5 rounded-[3px] text-[10px] font-mono flex items-center gap-1.5 border transition-all text-left ${
                          isSelected
                            ? 'bg-accent-muted border-accent/60 text-accent font-medium shadow-sm ring-1 ring-accent/30'
                            : 'bg-oros-950/80 border-oros-800 text-oros-400 hover:text-oros-200 hover:bg-oros-850'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color.hex }} />
                        <span className="truncate">{color.name.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Custom Hex Row (Identical to our Vault menu) */}
                <div className="mt-2 pt-1.5 border-t border-oros-800/60 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-oros-400 shrink-0">Custom Hex:</span>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <label 
                      className="w-5 h-5 rounded-[3px] border border-oros-700 cursor-pointer overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-all hover:border-oros-500"
                      style={{ backgroundColor: formColor }}
                      title="Click to pick custom color"
                    >
                      <input
                        type="color"
                        value={formColor.startsWith('#') && formColor.length === 7 ? formColor : '#f5c542'}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="opacity-0 w-0 h-0 cursor-pointer"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="#f5c542"
                      maxLength={7}
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-full min-w-0 bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-0.5 text-[10px] font-mono text-oros-200 placeholder-oros-600 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Revamped Icon Picker (Expanded library, icon-only grid without labels) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] font-mono uppercase font-semibold text-oros-400">
                      Icon
                    </label>
                    <span className="text-[9px] font-mono text-oros-500">
                      ({filteredIcons.length})
                    </span>
                  </div>
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Search icons..."
                    className="w-32 bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-0.5 text-[10px] text-oros-200 placeholder-oros-500 focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-2 bg-oros-950/80 border border-oros-750 rounded-[3px] max-h-40 overflow-y-auto">
                  {filteredIcons.map((item) => {
                    const Icon = item.icon
                    const isSelected = formIcon === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormIcon(item.id)}
                        title={`${item.label} (${item.id})`}
                        className={`h-8 rounded-[3px] flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-accent-muted border border-accent text-accent shadow-sm ring-1 ring-accent/40'
                            : 'text-oros-400 hover:text-oros-100 hover:bg-oros-850 border border-transparent'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    )
                  })}
                  {filteredIcons.length === 0 && (
                    <div className="col-span-full py-4 text-center text-[11px] text-oros-500 font-mono">
                      No icons match "{iconSearch}"
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}

          {mode === 'delete' && deletingCategory && (
            <div className="space-y-3 py-1">
              <div className="flex items-start gap-2 p-2.5 bg-rose-950/40 border border-rose-900/60 rounded-[3px] text-rose-300 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-rose-200 text-xs">
                    Delete "{deletingCategory.name}"?
                  </h4>
                  <p className="text-[11px] text-rose-300/80">
                    {categoryCounts[deletingCategory.id] || 0} cards will be reassigned.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Reassign affected cards to:
                </label>
                <select
                  value={fallbackCategory}
                  onChange={(e) => setFallbackCategory(e.target.value)}
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none"
                >
                  {worldCategories
                    .filter((c) => c.id !== deletingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Guaranteed Visible Pinned Footer */}
        <div className="px-4 py-2 border-t border-oros-750 bg-oros-900 flex items-center justify-end gap-2 shrink-0">
          {mode === 'list' ? (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-300 hover:text-oros-100 hover:bg-oros-800 transition-colors"
            >
              Done
            </button>
          ) : mode === 'delete' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1 rounded-[3px] bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition-all"
              >
                Delete & Reassign
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="category-form"
                className="btn-accent px-3.5 py-1 rounded-[3px] font-semibold text-xs shadow-sm transition-all"
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
