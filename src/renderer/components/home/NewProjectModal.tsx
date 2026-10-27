import React, { useState, useEffect, useRef } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { 
  X, Plus, Compass, Search, ChevronDown, Check, 
  Image as ImageIcon, Upload, Trash2, Edit3, Sparkles, Crop,
  Tag
} from 'lucide-react'
import { World, CustomGenre } from '@shared/types'
import { THEME_PRESETS } from '../../utils/themeEngine'
import { 
  GENRE_PRESETS, 
  GENRE_ICONS, 
  GenrePreset, 
  getGenreMeta, 
  getGenreIconComponent 
} from '../../utils/genrePresets'
import { ImageCropModal } from '../common/ImageCropModal'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  initialWorld?: World | null
}

const ICON_CATEGORIES = [
  'All',
  'Arcane & Magic',
  'Sci-Fi & Cyber',
  'Combat & Warfare',
  'Exploration & Wilds',
  'Civilization & Lore',
  'Nautical & Sea',
  'Horror & Mystery'
] as const

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ 
  isOpen, 
  onClose,
  initialWorld = null 
}) => {
  const { createWorld, updateWorld } = useWorldStore()
  const { addToast } = useToastStore()
  const customGenres = useSettingsStore((s) => s.settings.interface.customGenres || [])
  const { addCustomGenre, deleteCustomGenre } = useSettingsStore()

  const isEditMode = Boolean(initialWorld)

  // Form State
  const [name, setName] = useState('')
  const [genre, setGenre] = useState('Fantasy')
  const [genreIcon, setGenreIcon] = useState('')
  const [tagline, setTagline] = useState('')
  const [theme, setTheme] = useState<World['theme']>('sovereign')
  const [customAccent, setCustomAccent] = useState('#6366f1')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  // Crop & Reposition Modal State
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState('')

  // Genre Dropdown State
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false)
  const [genreSearch, setGenreSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Custom Genre Creator Modal State
  const [showCustomGenreModal, setShowCustomGenreModal] = useState(false)
  const [customGenreName, setCustomGenreName] = useState('')
  const [customGenreDesc, setCustomGenreDesc] = useState('')
  const [customGenreIcon, setCustomGenreIcon] = useState('Sparkles')
  const [iconPickerSearch, setIconPickerSearch] = useState('')
  const [iconPickerCategory, setIconPickerCategory] = useState<string>('All')

  // Initialize form when modal opens or initialWorld changes
  useEffect(() => {
    if (isOpen) {
      if (initialWorld) {
        setName(initialWorld.name || '')
        setGenre(initialWorld.genre || 'Fantasy')
        setGenreIcon(initialWorld.genreIcon || '')
        setTagline(initialWorld.tagline || '')
        setTheme(initialWorld.theme || 'sovereign')
        setCustomAccent(initialWorld.customAccentColor || '#6366f1')
        setThumbnailUrl(initialWorld.thumbnailUrl || initialWorld.bannerUrl || '')
      } else {
        setName('')
        setGenre('Fantasy')
        setGenreIcon('')
        setTagline('')
        setTheme('sovereign')
        setCustomAccent('#6366f1')
        setThumbnailUrl('')
      }
      setGenreDropdownOpen(false)
      setGenreSearch('')
      setCropModalOpen(false)
      setCropImageSrc('')
      setShowCustomGenreModal(false)
    }
  }, [isOpen, initialWorld])

  // Close genre dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGenreDropdownOpen(false)
      }
    }
    if (genreDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [genreDropdownOpen])

  if (!isOpen) return null

  // Current genre metadata and icon
  const currentGenreMeta = getGenreMeta(genre, genreIcon, customGenres)
  const CurrentGenreIcon = currentGenreMeta.icon

  // Filtered standard presets
  const filteredPresets = GENRE_PRESETS.filter((g) =>
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  )

  // Filtered custom genres
  const filteredCustomGenres = customGenres.filter((cg) =>
    cg.name.toLowerCase().includes(genreSearch.toLowerCase()) ||
    (cg.desc && cg.desc.toLowerCase().includes(genreSearch.toLowerCase()))
  )

  // Filtered icons for the Custom Genre Creator icon picker
  const filteredIcons = GENRE_ICONS.filter((item) => {
    const matchesCat = iconPickerCategory === 'All' || item.category === iconPickerCategory
    const matchesSearch = !iconPickerSearch.trim() || 
      item.label.toLowerCase().includes(iconPickerSearch.toLowerCase()) ||
      item.id.toLowerCase().includes(iconPickerSearch.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Handle local file selection - immediately opens Cropper
  const handleSelectLocalImage = async () => {
    try {
      let rawUrl: string | null = null
      if ((window as any).desktop?.importAsset) {
        rawUrl = await (window as any).desktop.importAsset()
      } else if ((window as any).desktop?.selectImage) {
        rawUrl = await (window as any).desktop.selectImage()
      }

      if (rawUrl) {
        setCropImageSrc(rawUrl)
        setCropModalOpen(true)
      } else if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    } catch {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropImageSrc(reader.result)
        setCropModalOpen(true)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleOpenCropForCurrent = () => {
    if (thumbnailUrl) {
      setCropImageSrc(thumbnailUrl)
      setCropModalOpen(true)
    }
  }

  const handleConfirmCrop = (croppedDataUrl: string) => {
    setThumbnailUrl(croppedDataUrl)
    setCropModalOpen(false)
  }

  const handleCancelCrop = () => {
    if (!thumbnailUrl && cropImageSrc) {
      setThumbnailUrl(cropImageSrc)
    }
    setCropModalOpen(false)
  }

  const handleOpenCreateCustomGenre = () => {
    setCustomGenreName(genreSearch.trim())
    setCustomGenreDesc('')
    setCustomGenreIcon('Sparkles')
    setIconPickerSearch('')
    setIconPickerCategory('All')
    setShowCustomGenreModal(true)
    setGenreDropdownOpen(false)
  }

  const handleSaveCustomGenre = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customGenreName.trim()) {
      addToast('Please enter a custom genre name', 'warning')
      return
    }

    const trimmedName = customGenreName.trim()
    const created = addCustomGenre({
      name: trimmedName,
      desc: customGenreDesc.trim() || undefined,
      icon: customGenreIcon
    })

    setGenre(created.name)
    setGenreIcon(created.icon)
    setShowCustomGenreModal(false)
    addToast(`Added custom genre: ${created.name}`, 'success')
  }

  const handleDeleteCustomGenre = (e: React.MouseEvent, genreId: string, genreName: string) => {
    e.stopPropagation()
    deleteCustomGenre(genreId)
    if (genre.toLowerCase() === genreName.toLowerCase()) {
      setGenre('Fantasy')
      setGenreIcon('')
    }
    addToast(`Deleted custom genre: ${genreName}`, 'info')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const sanitizedGenre = genre.trim() || 'Fantasy'
    const finalThumbnail = thumbnailUrl.trim() || undefined
    const finalGenreIcon = genreIcon.trim() || undefined

    if (isEditMode && initialWorld) {
      updateWorld(initialWorld.id, {
        name: name.trim(),
        genre: sanitizedGenre,
        genreIcon: finalGenreIcon,
        tagline: tagline.trim(),
        theme,
        customAccentColor: theme === 'custom' ? customAccent : undefined,
        thumbnailUrl: finalThumbnail,
        bannerUrl: finalThumbnail || initialWorld.bannerUrl
      })
      addToast(`Updated project vault: ${name.trim()}`, 'success')
    } else {
      createWorld(
        name.trim(),
        tagline.trim(),
        sanitizedGenre,
        theme,
        theme === 'custom' ? customAccent : undefined,
        finalThumbnail,
        finalThumbnail,
        finalGenreIcon
      )
      addToast(`Created project vault: ${name.trim()}`, 'success')
    }

    onClose()
  }

  const SelectedCustomIconComp = getGenreIconComponent(customGenreIcon)

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
        <div 
          className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-text text-oros-100 animate-modal-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-3 border-b border-oros-800 bg-oros-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {isEditMode ? (
                <Edit3 className="w-4 h-4 text-accent" />
              ) : (
                <Compass className="w-4 h-4 text-accent" />
              )}
              <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-oros-100">
                {isEditMode ? 'Edit Project' : 'New Project'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form id="project-form" onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Project Title */}
            <div>
              <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project title..."
                className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent transition-colors font-sans"
              />
            </div>

            {/* Project Thumbnail / Cover Image */}
            <div>
              <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                Cover Thumbnail
              </label>

              {thumbnailUrl ? (
                <div className="relative h-28 w-full rounded-[4px] overflow-hidden border border-oros-750 bg-oros-950 group shadow-inner">
                  <img
                    src={thumbnailUrl}
                    alt="Cover Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = '0.3'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-oros-950/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating Action Controls */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={handleOpenCropForCurrent}
                      className="px-2 py-1 rounded-[3px] bg-oros-900/90 hover:bg-oros-850 text-oros-200 border border-oros-750 text-[10px] font-mono flex items-center gap-1 backdrop-blur-md shadow-md transition-all cursor-pointer"
                      title="Crop & reposition"
                    >
                      <Crop className="w-3 h-3 text-accent" />
                      <span>Crop</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectLocalImage}
                      className="px-2 py-1 rounded-[3px] bg-oros-900/90 hover:bg-oros-850 text-oros-200 border border-oros-750 text-[10px] font-mono flex items-center gap-1 backdrop-blur-md shadow-md transition-all cursor-pointer"
                      title="Change image"
                    >
                      <Upload className="w-3 h-3 text-accent" />
                      <span>Change</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      title="Remove Cover"
                      className="p-1 rounded-[3px] bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] backdrop-blur-md shadow-md transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-oros-950/70 border border-dashed border-oros-750 rounded-[4px] hover:border-accent/50 transition-colors flex flex-col sm:flex-row items-center gap-3">
                  <div 
                    onClick={handleSelectLocalImage}
                    className="w-12 h-12 rounded-[3px] bg-oros-900 border border-oros-800 hover:border-accent/40 flex flex-col items-center justify-center cursor-pointer shrink-0 transition-colors group"
                    title="Upload image"
                  >
                    <ImageIcon className="w-5 h-5 text-oros-500 group-hover:text-accent transition-colors" />
                    <span className="text-[8px] font-mono text-oros-500 mt-0.5">Upload</span>
                  </div>

                  <div className="flex-1 min-w-0 w-full space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSelectLocalImage}
                        className="px-2.5 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-200 text-[10px] font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-accent" />
                        <span>Browse Local Image</span>
                      </button>
                      <span className="text-[10px] text-oros-500 font-mono">or paste URL:</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="https://... image link"
                        className="w-full bg-oros-900 border border-oros-800 rounded-[3px] px-2 py-1 text-[11px] font-mono text-oros-200 placeholder-oros-600 focus:outline-none focus:border-accent transition-colors"
                      />
                      {thumbnailUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setCropImageSrc(thumbnailUrl)
                            setCropModalOpen(true)
                          }}
                          className="px-2 py-1 rounded-[3px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-300 hover:text-white text-[10px] font-mono flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Crop className="w-3 h-3 text-accent" />
                          <span>Crop</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden native input for web fallback */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            {/* Setting & Genre: Searchable Dropdown with Custom Genre Creator */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-mono font-semibold text-oros-300 uppercase tracking-wider">
                  Setting & Genre
                </label>
                <button
                  type="button"
                  onClick={handleOpenCreateCustomGenre}
                  className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Custom Genre</span>
                </button>
              </div>

              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setGenreDropdownOpen((prev) => !prev)}
                className="w-full bg-oros-950 border border-oros-750 hover:border-oros-700 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CurrentGenreIcon className="w-4 h-4 text-accent shrink-0" />
                  <span className="font-semibold text-oros-100">{genre}</span>
                  {currentGenreMeta.isCustom && (
                    <span className="px-1.5 py-0.2 rounded-[2px] bg-accent/15 text-accent text-[9px] font-mono border border-accent/30">
                      Custom
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-oros-400 shrink-0 transition-transform ${genreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Searchable Floating Dropdown Menu */}
              {genreDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl z-50 p-2 space-y-2 animate-modal-in max-h-80 flex flex-col">
                  {/* Top Action & Search Bar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={genreSearch}
                        onChange={(e) => setGenreSearch(e.target.value)}
                        placeholder="Search genres..."
                        autoFocus
                        className="w-full bg-oros-950 border border-oros-750 rounded-[3px] pl-8 pr-2.5 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                      />
                      {genreSearch && (
                        <button
                          type="button"
                          onClick={() => setGenreSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-oros-500 hover:text-oros-300 text-xs px-1 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenCreateCustomGenre}
                      className="px-2 py-1 rounded-[3px] bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Create a new custom genre with custom icon"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Custom</span>
                    </button>
                  </div>

                  {/* Scrollable list of genres */}
                  <div className="overflow-y-auto flex-1 custom-scrollbar space-y-3 p-0.5">
                    {/* CUSTOM GENRES SECTION */}
                    {filteredCustomGenres.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-accent px-1">
                          <span>Custom Genres ({filteredCustomGenres.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {filteredCustomGenres.map((cg) => {
                            const Icon = getGenreIconComponent(cg.icon)
                            const isSelected = genre.toLowerCase() === cg.name.toLowerCase()
                            return (
                              <div
                                key={cg.id}
                                onClick={() => {
                                  setGenre(cg.name)
                                  setGenreIcon(cg.icon)
                                  setGenreDropdownOpen(false)
                                }}
                                className={`group/item text-left px-2 py-1.5 rounded-[3px] flex items-center justify-between gap-1.5 transition-colors cursor-pointer border ${
                                  isSelected
                                    ? 'bg-accent-muted text-accent font-semibold border-accent/40 shadow-sm'
                                    : 'hover:bg-oros-850 text-oros-200 border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-accent' : 'text-accent/80'}`} />
                                  <span className="text-xs truncate">{cg.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCustomGenre(e, cg.id, cg.name)}
                                  title="Delete custom genre"
                                  className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-oros-500 hover:text-rose-400 hover:bg-rose-950/40 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* PRESET GENRES SECTION */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-oros-400 px-1">
                        Preset Genres ({filteredPresets.length})
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {filteredPresets.map((g) => {
                          const Icon = g.icon
                          const isSelected = genre.toLowerCase() === g.name.toLowerCase() && !genreIcon
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => {
                                setGenre(g.name)
                                setGenreIcon('')
                                setGenreDropdownOpen(false)
                              }}
                              className={`text-left px-2 py-1.5 rounded-[3px] flex items-center gap-2 transition-colors cursor-pointer border ${
                                isSelected
                                  ? 'bg-accent-muted text-accent font-semibold border-accent/40 shadow-sm'
                                  : 'hover:bg-oros-850 text-oros-300 hover:text-oros-100 border-transparent'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-accent' : 'text-oros-400'}`} />
                              <span className="text-xs truncate">{g.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Quick creation fallback if no search matches */}
                    {genreSearch.trim() && 
                      !filteredPresets.some((g) => g.name.toLowerCase() === genreSearch.trim().toLowerCase()) &&
                      !filteredCustomGenres.some((cg) => cg.name.toLowerCase() === genreSearch.trim().toLowerCase()) && (
                      <button
                        type="button"
                        onClick={handleOpenCreateCustomGenre}
                        className="w-full text-left px-2.5 py-1.5 rounded-[3px] bg-accent/15 hover:bg-accent/25 border border-accent/40 text-accent text-xs flex items-center gap-2 mt-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>Create custom genre &ldquo;{genreSearch.trim()}&rdquo; with custom icon...</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accent Theme */}
            <div>
              <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                Theme / Atmosphere
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {THEME_PRESETS.map((t) => {
                  const isSelected = theme === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id as any)}
                      className={`px-2 py-1.5 rounded-[3px] border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-white/60 bg-oros-850 shadow-sm' 
                          : 'border-oros-800 bg-oros-950/60 hover:bg-oros-900 text-oros-400'
                      }`}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/30"
                        style={{ backgroundColor: t.hex }}
                      />
                      <span className={`text-[11px] truncate ${isSelected ? 'text-oros-100 font-semibold' : 'text-oros-400'}`}>
                        {t.name}
                      </span>
                    </button>
                  )
                })}

                {/* Custom Accent Color Option */}
                <button
                  type="button"
                  onClick={() => setTheme('custom')}
                  className={`px-2 py-1.5 rounded-[3px] border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    theme === 'custom'
                      ? 'border-white/60 bg-oros-850 shadow-sm'
                      : 'border-oros-800 bg-oros-950/60 hover:bg-oros-900 text-oros-400'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/30"
                    style={{ backgroundColor: customAccent }}
                  />
                  <span className={`text-[11px] truncate ${theme === 'custom' ? 'text-oros-100 font-semibold' : 'text-oros-400'}`}>
                    Custom
                  </span>
                </button>
              </div>

              {theme === 'custom' && (
                <div className="mt-2 flex items-center gap-2 bg-oros-950 p-2 rounded-[3px] border border-oros-800">
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="w-7 h-7 rounded border border-oros-700 bg-transparent cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    placeholder="#6366f1"
                    className="w-24 bg-oros-900 border border-oros-800 rounded px-2 py-1 text-xs font-mono text-oros-200 uppercase focus:outline-none focus:border-accent"
                  />
                  <span className="text-[10px] text-oros-500 font-mono">Hex Accent Code</span>
                </div>
              )}
            </div>

            {/* Tagline / Premise */}
            <div>
              <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                Premise / Logline
              </label>
              <textarea
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A storm-scoured realm of basalt cliffs and salt marshes..."
                className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent transition-colors font-sans resize-none"
              />
            </div>
          </form>

          {/* Guaranteed Visible Pinned Footer */}
          <div className="px-5 py-2.5 border-t border-oros-800 bg-oros-950/80 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-[3px] text-xs font-medium text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="project-form"
              className="px-4 py-1.5 rounded-[3px] btn-accent text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isEditMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CREATE CUSTOM GENRE MODAL (WITH EXTENSIVE 75+ ICON PICKER) */}
      {showCustomGenreModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div 
            className="bg-oros-900 border border-oros-750 w-full max-w-xl rounded-[4px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-text text-oros-100 animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-oros-800 bg-oros-950/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent" />
                <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-oros-100">
                  Create Custom Genre
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomGenreModal(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-white hover:bg-oros-850 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="custom-genre-form" onSubmit={handleSaveCustomGenre} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Genre Name */}
              <div>
                <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                  Genre Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customGenreName}
                  onChange={(e) => setCustomGenreName(e.target.value)}
                  placeholder="e.g. Solarpunk Grimdark, Space Western, Biopunk..."
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent font-sans"
                />
              </div>

              {/* Genre Description */}
              <div>
                <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                  Description / Tone
                </label>
                <input
                  type="text"
                  value={customGenreDesc}
                  onChange={(e) => setCustomGenreDesc(e.target.value)}
                  placeholder="e.g. High technology with brutal frontier survival"
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent font-sans"
                />
              </div>

              {/* Icon Picker Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono font-semibold text-oros-300 uppercase tracking-wider">
                    Select Genre Icon ({GENRE_ICONS.length} available)
                  </label>
                  <div className="flex items-center gap-1.5 text-xs font-mono bg-oros-950 px-2 py-0.5 rounded border border-oros-800">
                    <span className="text-oros-400 text-[10px]">Active:</span>
                    <SelectedCustomIconComp className="w-3.5 h-3.5 text-accent" />
                    <span className="text-accent text-[11px] font-semibold">{customGenreIcon}</span>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[10px] font-mono">
                  {ICON_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setIconPickerCategory(cat)}
                      className={`px-2 py-1 rounded-[3px] whitespace-nowrap transition-colors cursor-pointer border ${
                        iconPickerCategory === cat
                          ? 'bg-accent/20 border-accent/60 text-accent font-semibold'
                          : 'bg-oros-950 border-oros-800 text-oros-400 hover:text-oros-200 hover:bg-oros-850'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Bar for Icons */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={iconPickerSearch}
                    onChange={(e) => setIconPickerSearch(e.target.value)}
                    placeholder="Search icons (e.g. sword, rocket, crown, ghost, dragon, tree)..."
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] pl-8 pr-2.5 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                  />
                  {iconPickerSearch && (
                    <button
                      type="button"
                      onClick={() => setIconPickerSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-oros-500 hover:text-oros-300 text-xs px-1"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* 75+ Icon Grid */}
                <div className="max-h-56 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-1.5 p-1 bg-oros-950/70 border border-oros-800 rounded-[4px] custom-scrollbar">
                  {filteredIcons.map((item) => {
                    const IconComp = item.icon
                    const isSelected = customGenreIcon.toLowerCase() === item.id.toLowerCase()
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCustomGenreIcon(item.id)}
                        title={`${item.id}: ${item.label}`}
                        className={`p-2 rounded-[3px] border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-accent/20 border-accent text-accent shadow-sm ring-1 ring-accent'
                            : 'bg-oros-900 border-oros-800/80 hover:bg-oros-850 hover:border-oros-700 text-oros-400 hover:text-oros-100'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 transition-transform group-hover:scale-110 ${isSelected ? 'text-accent' : 'text-oros-300'}`} />
                        <span className="text-[9px] font-mono truncate w-full text-center leading-tight">
                          {item.id}
                        </span>
                      </button>
                    )
                  })}
                  {filteredIcons.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-oros-500 font-mono">
                      No icons found matching &ldquo;{iconPickerSearch}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 border-t border-oros-800 bg-oros-950/90 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCustomGenreModal(false)}
                className="px-3 py-1.5 rounded-[3px] text-xs font-medium text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="custom-genre-form"
                className="px-4 py-1.5 rounded-[3px] btn-accent text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Select Genre</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop & Resize Placement Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        aspectRatio={16 / 9}
        onConfirm={handleConfirmCrop}
        onCancel={handleCancelCrop}
      />
    </>
  )
}
