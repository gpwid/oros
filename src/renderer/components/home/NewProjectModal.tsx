import React, { useState, useEffect, useRef } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  X, Plus, Compass, Search, ChevronDown, Check, 
  Image as ImageIcon, Upload, Trash2, Edit3, Sparkles, Crop
} from 'lucide-react'
import { World } from '@shared/types'
import { THEME_PRESETS } from '../../utils/themeEngine'
import { GENRE_PRESETS, getGenreMeta } from '../../utils/genrePresets'
import { ImageCropModal } from '../common/ImageCropModal'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  initialWorld?: World | null
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ 
  isOpen, 
  onClose,
  initialWorld = null 
}) => {
  const { createWorld, updateWorld } = useWorldStore()
  const { addToast } = useToastStore()

  const isEditMode = Boolean(initialWorld)

  // Form State
  const [name, setName] = useState('')
  const [genre, setGenre] = useState('Fantasy')
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

  // Initialize form when modal opens or initialWorld changes
  useEffect(() => {
    if (isOpen) {
      if (initialWorld) {
        setName(initialWorld.name || '')
        setGenre(initialWorld.genre || 'Fantasy')
        setTagline(initialWorld.tagline || '')
        setTheme(initialWorld.theme || 'sovereign')
        setCustomAccent(initialWorld.customAccentColor || '#6366f1')
        setThumbnailUrl(initialWorld.thumbnailUrl || initialWorld.bannerUrl || '')
      } else {
        setName('')
        setGenre('Fantasy')
        setTagline('')
        setTheme('sovereign')
        setCustomAccent('#6366f1')
        setThumbnailUrl('')
      }
      setGenreDropdownOpen(false)
      setGenreSearch('')
      setCropModalOpen(false)
      setCropImageSrc('')
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

  // Filtered genres
  const filteredGenres = GENRE_PRESETS.filter((g) =>
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  )

  const currentGenreMeta = getGenreMeta(genre)
  const CurrentGenreIcon = currentGenreMeta.icon

  // Handle local file selection - immediately opens Cropper
  const handleSelectLocalImage = async () => {
    try {
      let rawUrl: string | null = null
      if ((window as any).oros?.importAsset) {
        rawUrl = await (window as any).oros.importAsset()
      } else if ((window as any).oros?.selectImage) {
        rawUrl = await (window as any).oros.selectImage()
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const sanitizedGenre = genre.trim() || 'Fantasy'
    const finalThumbnail = thumbnailUrl.trim() || undefined

    if (isEditMode && initialWorld) {
      updateWorld(initialWorld.id, {
        name: name.trim(),
        genre: sanitizedGenre,
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
        finalThumbnail
      )
      addToast(`Created project vault: ${name.trim()}`, 'success')
    }

    onClose()
  }

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
              className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
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

            {/* Setting & Genre: Searchable One-Word Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                Setting & Genre
              </label>

              {/* Dropdown Trigger Button */}
              <button
                type="button"
                onClick={() => setGenreDropdownOpen((prev) => !prev)}
                className="w-full bg-oros-950 border border-oros-750 hover:border-oros-700 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CurrentGenreIcon className="w-4 h-4 text-accent shrink-0" />
                  <span className="font-semibold text-oros-100">{genre}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-oros-400 shrink-0 transition-transform ${genreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Searchable Floating Dropdown Menu */}
              {genreDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl z-50 p-2 space-y-1.5 animate-modal-in">
                  {/* Search Bar */}
                  <div className="relative">
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-oros-500 hover:text-oros-300 text-xs px-1"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Clean 2-column Grid of Genres */}
                  <div className="max-h-52 overflow-y-auto grid grid-cols-2 gap-1 custom-scrollbar p-0.5">
                    {filteredGenres.map((g) => {
                      const Icon = g.icon
                      const isSelected = genre.toLowerCase() === g.name.toLowerCase()
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setGenre(g.name)
                            setGenreDropdownOpen(false)
                          }}
                          className={`text-left px-2 py-1.5 rounded-[3px] flex items-center gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-accent-muted text-accent font-semibold border border-accent/40 shadow-sm'
                              : 'hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-transparent'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-accent' : 'text-oros-400'}`} />
                          <span className="text-xs truncate">{g.name}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom Genre Fallback */}
                  {genreSearch.trim() && !filteredGenres.some((g) => g.name.toLowerCase() === genreSearch.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        const custom = genreSearch.trim().charAt(0).toUpperCase() + genreSearch.trim().slice(1)
                        setGenre(custom)
                        setGenreDropdownOpen(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-[3px] bg-oros-850/80 hover:bg-oros-800 border border-oros-750 text-accent text-xs flex items-center gap-2 mt-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Use custom genre &ldquo;{genreSearch.trim()}&rdquo;</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Accent Theme */}
            <div>
              <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                Accent Theme
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {THEME_PRESETS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as any)}
                    className={`px-2 py-1.5 rounded-[3px] border flex items-center gap-1.5 transition-all text-left cursor-pointer ${
                      theme === t.id
                        ? 'bg-accent-muted border-accent text-accent font-semibold shadow-sm ring-1 ring-accent/30'
                        : 'bg-oros-950/80 border-oros-800 text-oros-400 hover:text-oros-200 hover:bg-oros-850'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: t.hex }} />
                    <span className="text-[10px] font-mono truncate">{t.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Custom Hex Option */}
              <div className="mt-2 pt-1.5 border-t border-oros-800/60 flex items-center gap-2">
                <span className="text-[10px] font-mono text-oros-400 shrink-0">Custom Hex:</span>
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <label 
                    className={`w-5 h-5 rounded-[3px] border cursor-pointer overflow-hidden flex items-center justify-center shrink-0 shadow-sm transition-all ${
                      theme === 'custom' ? 'border-accent ring-1 ring-accent/40' : 'border-oros-700'
                    }`}
                    style={{ backgroundColor: customAccent }}
                    title="Pick custom accent color"
                  >
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => {
                        setCustomAccent(e.target.value)
                        setTheme('custom')
                      }}
                      className="opacity-0 w-0 h-0 cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    value={customAccent}
                    onChange={(e) => {
                      setCustomAccent(e.target.value)
                      setTheme('custom')
                    }}
                    className="w-full min-w-0 bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-0.5 text-[10px] font-mono text-oros-200 placeholder-oros-600 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-mono font-semibold text-oros-300 mb-1 uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Brief summary or description..."
                className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent resize-none font-sans"
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
