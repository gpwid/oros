import React, { useState, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { 
  Plus, Search, FolderOpen, Upload, Download, Trash2, 
  ArrowRight, BookOpen, Layers, Feather, Map as MapIcon, 
  Compass, Clock, LayoutGrid
} from 'lucide-react'
import { OrosLogoFull } from '../common/OrosLogo'
import { NewProjectModal } from './NewProjectModal'
import { calculateProjectStats, formatNumber } from '../../utils/projectStats'
import { THEME_PRESETS } from '../../utils/themeEngine'

export const HomePage: React.FC = () => {
  const { 
    worlds, activeWorldId, setActiveWorldId, setAppView, 
    entities, manuscripts, maps, canvases, timelines,
    deleteWorld, exportWorld, importWorld
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [searchFilter, setSearchFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Compute stats for every world
  const worldsWithStats = useMemo(() => {
    return worlds.map((w) => {
      const stats = calculateProjectStats(
        w.id,
        entities,
        manuscripts,
        maps,
        canvases,
        timelines
      )
      return {
        world: w,
        stats
      }
    })
  }, [worlds, entities, manuscripts, maps, canvases, timelines])

  // Filtered worlds by search query
  const filteredWorlds = useMemo(() => {
    if (!searchFilter.trim()) return worldsWithStats
    const q = searchFilter.toLowerCase()
    return worldsWithStats.filter(({ world: w }) =>
      w.name.toLowerCase().includes(q) ||
      (w.genre && w.genre.toLowerCase().includes(q)) ||
      (w.tagline && w.tagline.toLowerCase().includes(q))
    )
  }, [worldsWithStats, searchFilter])

  // Aggregate Vault Stats
  const aggregateStats = useMemo(() => {
    return worldsWithStats.reduce(
      (acc, { stats }) => {
        acc.totalWords += stats.totalWords
        acc.totalDocs += stats.totalDocuments
        return acc
      },
      { totalWords: 0, totalDocs: 0 }
    )
  }, [worldsWithStats])

  const handleEnterWorld = (worldId: string) => {
    setActiveWorldId(worldId)
    setAppView('workspace')
  }

  const handleOpenFolder = async () => {
    if (window.oros) {
      await window.oros.openVaultFolder()
      addToast('Opened vault directory in Explorer', 'info')
    } else {
      addToast('Vault folder only available in desktop app', 'warning')
    }
  }

  const handleImportArchive = async () => {
    if (typeof window !== 'undefined' && window.oros) {
      const success = await importWorld()
      if (success) {
        addToast('World archive imported successfully', 'success')
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const success = await importWorld(text)
      if (success) {
        addToast('World archive imported successfully', 'success')
      } else {
        addToast('Failed to import world archive', 'error')
      }
    } catch (err) {
      addToast('Error reading archive file', 'error')
    }
    e.target.value = ''
  }

  const handleDeleteWorld = async (worldId: string, worldName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (worlds.length <= 1) {
      addToast('Cannot delete the last remaining project in your vault', 'warning')
      return
    }

    const confirmed = await confirmDialog({
      title: 'Delete Project Vault',
      message: `Are you sure you want to permanently delete "${worldName}"? All associated chapters, lore cards, maps, and timelines will be deleted.`,
      confirmText: 'Delete Project',
      variant: 'danger'
    })

    if (confirmed) {
      deleteWorld(worldId)
      addToast(`Deleted project: ${worldName}`, 'info')
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-oros-950 text-slate-100 overflow-y-auto select-none font-sans">
      {/* TOP HEADER NAVIGATION */}
      <header 
        className="h-10 border-b border-oros-800/80 bg-oros-950 px-5 flex items-center justify-between shrink-0 sticky top-0 z-30 pr-[152px] select-none"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-3 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Logo with Text: Clean Default White */}
          <OrosLogoFull className="h-6 w-auto" emblemClassName="text-white" textClassName="text-white" />
          <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-oros-900 border border-oros-750 text-oros-400 font-mono uppercase tracking-wider font-semibold">
            Projects
          </span>
        </div>

        {/* Global Hub Search */}
        <div className="relative w-80 max-w-md hidden md:block" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Search className="w-3.5 h-3.5 text-oros-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search projects by title, genre, premise..."
            className="w-full bg-oros-900 border border-oros-800 rounded-[3px] pl-9 pr-3 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-white/50 transition-colors font-sans"
          />
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={handleOpenFolder}
            title="Open Vault Folder in File Explorer"
            className="p-1 px-2.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-oros-400" />
            <span className="hidden sm:inline">Vault Directory</span>
          </button>

          <button
            onClick={handleImportArchive}
            title="Import Standalone Project Archive (.oros.json)"
            className="p-1 px-2.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-oros-400" />
            <span className="hidden sm:inline">Import Archive</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="p-1 px-3 rounded-[3px] bg-white hover:bg-slate-200 text-oros-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-oros-950" />
            <span>New Project</span>
          </button>

          {/* Hidden File Input for Web Fallback */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,.oros.json"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      </header>

      {/* MAIN HUB BODY */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* SUBTLE PROJECTS TOOLBAR & METRICS */}
        <div className="flex items-center justify-between pb-3 border-b border-oros-800/80">
          <div className="flex items-center gap-2.5">
            <h1 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">
              Your Projects
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-[3px] bg-oros-900 text-oros-400 border border-oros-800">
              {filteredWorlds.length}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-oros-400">
            <div>
              <span className="text-oros-500 uppercase text-[10px] mr-1.5">Total Words:</span>
              <span className="text-white font-medium">{formatNumber(aggregateStats.totalWords)}</span>
            </div>
            <div className="h-3 w-[1px] bg-oros-800" />
            <div>
              <span className="text-oros-500 uppercase text-[10px] mr-1.5">Documents:</span>
              <span className="text-white font-medium">{formatNumber(aggregateStats.totalDocs)}</span>
            </div>
          </div>
        </div>

        {/* PROJECTS SECTION */}
        <div>
          {searchFilter && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-oros-400 font-sans">
                Showing results for &ldquo;{searchFilter}&rdquo;
              </span>
              <button
                onClick={() => setSearchFilter('')}
                className="text-[11px] font-mono text-white hover:underline cursor-pointer"
              >
                Clear Search Filter
              </button>
            </div>
          )}

          {/* Grid of Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorlds.map(({ world: w, stats }) => {
              const themePreset = THEME_PRESETS.find((t) => t.id === w.theme)
              const accentColor = w.theme === 'custom' && w.customAccentColor 
                ? w.customAccentColor 
                : themePreset?.hex || '#ffffff'

              return (
                <div
                  key={w.id}
                  onClick={() => handleEnterWorld(w.id)}
                  className="card-interactive group bg-oros-900 border border-oros-800 hover:border-oros-700 rounded-[4px] p-5 flex flex-col justify-between cursor-pointer transition-all shadow-sm relative overflow-hidden"
                >
                  {/* Atmospheric Top Halo Strip using project's theme */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[2.5px] opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: accentColor }}
                  />

                  <div>
                    {/* Header Row: Genre & Menu */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span 
                        className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border"
                        style={{
                          backgroundColor: `${accentColor}15`,
                          borderColor: `${accentColor}40`,
                          color: accentColor
                        }}
                      >
                        {w.genre || 'Speculative Fiction'}
                      </span>

                      {/* Action Menu Buttons */}
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDeleteWorld(w.id, w.name, e)}
                          title="Delete Project"
                          className="p-1 rounded-[2px] text-oros-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* World Title */}
                    <h3 className="font-serif text-lg font-bold text-oros-100 group-hover:text-white transition-colors tracking-tight line-clamp-1">
                      {w.name}
                    </h3>

                    {/* Tagline / Premise */}
                    <p className="text-xs text-oros-400 font-sans mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
                      {w.tagline || 'A custom universe awaiting lore, characters, and manuscripts.'}
                    </p>
                  </div>

                  {/* Document & Word Count Metrics */}
                  <div className="mt-5 pt-3.5 border-t border-oros-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      {/* Word Count */}
                      <span className="text-oros-200 font-medium flex items-center gap-1.5" title="Total Words Written">
                        <Feather className="w-3.5 h-3.5 text-oros-400" />
                        <span>{formatNumber(stats.totalWords)}</span>
                        <span className="text-[10px] text-oros-500 font-normal">words</span>
                      </span>

                      {/* Document Count */}
                      <span 
                        className="text-oros-300 flex items-center gap-1.5"
                        title={`${stats.entityCount} Articles • ${stats.chapterCount} Chapters • ${stats.canvasCount} Canvases • ${stats.mapCount} Maps`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-oros-400" />
                        <span>{stats.totalDocuments}</span>
                        <span className="text-[10px] text-oros-500 font-normal">docs</span>
                      </span>
                    </div>

                    {/* Enter Action in project accent color */}
                    <div 
                      className="flex items-center gap-1 text-[11px] font-sans font-medium group-hover:translate-x-0.5 transition-transform"
                      style={{ color: accentColor }}
                    >
                      <span>Enter</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Create New Project Grid Card */}
            <div
              onClick={() => setShowNewModal(true)}
              className="card-interactive border border-dashed border-oros-800 hover:border-white/40 bg-oros-950/40 hover:bg-oros-900/60 rounded-[4px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[170px] group"
            >
              <div className="w-8 h-8 rounded-full bg-oros-900 border border-oros-750 group-hover:border-white/40 group-hover:bg-white/10 flex items-center justify-center text-oros-400 group-hover:text-white transition-all mb-2.5 shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
              <h4 className="font-sans font-medium text-xs text-oros-200 group-hover:text-white transition-colors">
                Create New Project
              </h4>
              <p className="text-[11px] text-oros-500 font-sans mt-0.5">
                Initialize a universe with custom genre & theme
              </p>
            </div>
          </div>

          {/* Empty Search Results */}
          {filteredWorlds.length === 0 && (
            <div className="p-12 text-center bg-oros-900/40 border border-oros-800 rounded-md">
              <Compass className="w-8 h-8 text-oros-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-oros-200">No matching projects found</h3>
              <p className="text-xs text-oros-400 mt-1">Try another search keyword or clear your filter.</p>
              <button
                onClick={() => setSearchFilter('')}
                className="px-3 py-1 rounded-[3px] bg-white hover:bg-slate-200 text-oros-950 text-xs font-semibold mt-3 cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </main>

      {/* New Project Dialog */}
      <NewProjectModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  )
}
