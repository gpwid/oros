import React, { useState, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { 
  Plus, Search, FolderOpen, Upload, Download, Trash2, 
  ArrowRight, BookOpen, Layers, Feather, Map as MapIcon, 
  Sparkles, Compass, Clock, LayoutGrid
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
      <header className="h-14 border-b border-oros-800/80 bg-oros-950/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/* Logo with Text */}
          <div className="flex items-center gap-3">
            <OrosLogoFull className="h-7 w-auto" />
            <span className="text-[10px] px-2 py-0.5 rounded-[3px] bg-oros-900 border border-oros-750 text-oros-400 font-mono uppercase tracking-wider font-semibold">
              Project Hub
            </span>
          </div>
        </div>

        {/* Global Hub Search */}
        <div className="relative w-80 max-w-md hidden md:block">
          <Search className="w-3.5 h-3.5 text-oros-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search projects by title, genre, premise..."
            className="w-full bg-oros-900 border border-oros-800 rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent transition-colors font-sans"
          />
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenFolder}
            title="Open Vault Folder in File Explorer"
            className="p-1.5 px-2.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-oros-100 text-xs font-medium flex items-center gap-1.5 transition-colors btn-interactive"
          >
            <FolderOpen className="w-3.5 h-3.5 text-oros-400" />
            <span className="hidden sm:inline">Vault Directory</span>
          </button>

          <button
            onClick={handleImportArchive}
            title="Import Standalone Project Archive (.oros.json)"
            className="p-1.5 px-2.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-oros-100 text-xs font-medium flex items-center gap-1.5 transition-colors btn-interactive"
          >
            <Upload className="w-3.5 h-3.5 text-oros-400" />
            <span className="hidden sm:inline">Import Archive</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="btn-accent p-1.5 px-3 rounded-[3px] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
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
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* HERO METRICS RIBBON */}
        <div className="relative overflow-hidden rounded-[6px] border border-oros-800/80 bg-gradient-to-r from-oros-900 via-oros-900/90 to-oros-950 p-6 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-accent font-semibold block mb-1">
                Worldbuilder & Author Atelier
              </span>
              <h1 className="font-serif text-2xl font-bold text-oros-100 tracking-tight">
                Your Universes & Manuscripts
              </h1>
              <p className="text-xs text-oros-400 font-sans mt-1 max-w-xl leading-relaxed">
                Enter an existing creative codex, manage timelines and cartography, or create a new world to architect lore cards, whiteboard canvases, and complete book manuscripts.
              </p>
            </div>

            {/* Aggregated Totals */}
            <div className="flex items-center gap-6 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-oros-800/80">
              <div className="text-center md:text-right">
                <span className="text-[10px] font-mono uppercase text-oros-500 font-semibold block">
                  Projects
                </span>
                <span className="font-mono text-xl font-bold text-oros-100">
                  {worlds.length}
                </span>
              </div>

              <div className="w-[1px] h-8 bg-oros-800/80" />

              <div className="text-center md:text-right">
                <span className="text-[10px] font-mono uppercase text-oros-500 font-semibold block">
                  Total Words
                </span>
                <span className="font-mono text-xl font-bold text-accent">
                  {formatNumber(aggregateStats.totalWords)}
                </span>
              </div>

              <div className="w-[1px] h-8 bg-oros-800/80" />

              <div className="text-center md:text-right">
                <span className="text-[10px] font-mono uppercase text-oros-500 font-semibold block">
                  Total Documents
                </span>
                <span className="font-mono text-xl font-bold text-oros-200">
                  {formatNumber(aggregateStats.totalDocs)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PROJECTS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-accent" />
              <h2 className="font-sans font-semibold text-sm text-oros-100 uppercase tracking-wider">
                Active Projects ({filteredWorlds.length})
              </h2>
            </div>

            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="text-[11px] font-mono text-accent hover:underline"
              >
                Clear Search Filter
              </button>
            )}
          </div>

          {/* Grid of Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorlds.map(({ world: w, stats }) => {
              const themePreset = THEME_PRESETS.find((t) => t.id === w.theme)
              const accentColor = w.theme === 'custom' && w.customAccentColor 
                ? w.customAccentColor 
                : themePreset?.hex || 'var(--oros-accent)'

              return (
                <div
                  key={w.id}
                  onClick={() => handleEnterWorld(w.id)}
                  className="card-interactive group bg-oros-900 border border-oros-800 hover:border-oros-700/80 rounded-[5px] p-5 flex flex-col justify-between cursor-pointer transition-all shadow-md relative overflow-hidden"
                >
                  {/* Atmospheric Top Halo Strip */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[3px] opacity-80 group-hover:opacity-100 transition-opacity"
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
                          className="p-1 rounded-[2px] text-oros-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
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
                      <span className="text-oros-200 font-semibold flex items-center gap-1" title="Total Words Written">
                        <span className="text-accent font-bold">📝</span>
                        <span>{formatNumber(stats.totalWords)}</span>
                        <span className="text-[10px] text-oros-500 font-normal">words</span>
                      </span>

                      {/* Document Count */}
                      <span 
                        className="text-oros-300 flex items-center gap-1"
                        title={`${stats.entityCount} Articles • ${stats.chapterCount} Chapters • ${stats.canvasCount} Canvases • ${stats.mapCount} Maps`}
                      >
                        <span>📚</span>
                        <span>{stats.totalDocuments}</span>
                        <span className="text-[10px] text-oros-500 font-normal">docs</span>
                      </span>
                    </div>

                    {/* Enter Action */}
                    <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-accent group-hover:translate-x-0.5 transition-transform">
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
              className="card-interactive border border-dashed border-oros-800 hover:border-accent/60 bg-oros-950/40 hover:bg-oros-900/60 rounded-[5px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[170px] group"
            >
              <div className="w-9 h-9 rounded-full bg-oros-900 border border-oros-750 group-hover:border-accent group-hover:bg-accent-muted flex items-center justify-center text-oros-400 group-hover:text-accent transition-all mb-2.5 shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
              <h4 className="font-sans font-semibold text-sm text-oros-200 group-hover:text-white transition-colors">
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
                className="btn-accent px-3 py-1 rounded-[3px] text-xs font-semibold mt-3"
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
