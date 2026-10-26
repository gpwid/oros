import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useTtrpgStore } from '../../store/useTtrpgStore'
import { useToastStore } from '../../store/useToastStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { 
  Plus, Search, FolderOpen, Upload, Download, Trash2, Edit3,
  ArrowRight, BookOpen, Layers, Feather, Map as MapIcon, 
  Compass, Clock, LayoutGrid, Dices, Shield, Swords, User,
  Settings
} from 'lucide-react'
import { World, TTRPGCampaign } from '@shared/types'
import { useSettingsStore } from '../../store/useSettingsStore'
import { OrosLogoFull } from '../common/OrosLogo'
import { calculateProjectStats, formatNumber } from '../../utils/projectStats'
import { THEME_PRESETS } from '../../utils/themeEngine'
import { getGenreMeta } from '../../utils/genrePresets'

const NewProjectModal = lazy(() => import('./NewProjectModal').then(m => ({ default: m.NewProjectModal })))
const NewCampaignModal = lazy(() => import('../ttrpg/NewCampaignModal').then(m => ({ default: m.NewCampaignModal })))
const TTRPGCampaignDashboard = lazy(() => import('../ttrpg/TTRPGCampaignDashboard').then(m => ({ default: m.TTRPGCampaignDashboard })))

export const HomePage: React.FC = () => {
  const worlds = useWorldStore((s) => s.worlds)
  const activeWorldId = useWorldStore((s) => s.activeWorldId)
  const setActiveWorldId = useWorldStore((s) => s.setActiveWorldId)
  const setAppView = useWorldStore((s) => s.setAppView)
  const entities = useWorldStore((s) => s.entities)
  const manuscripts = useWorldStore((s) => s.manuscripts)
  const maps = useWorldStore((s) => s.maps)
  const canvases = useWorldStore((s) => s.canvases)
  const timelines = useWorldStore((s) => s.timelines)
  const deleteWorld = useWorldStore((s) => s.deleteWorld)
  const exportWorld = useWorldStore((s) => s.exportWorld)
  const importWorld = useWorldStore((s) => s.importWorld)

  const campaigns = useTtrpgStore((s) => s.campaigns)
  const characters = useTtrpgStore((s) => s.characters)
  const activeCampaignId = useTtrpgStore((s) => s.activeCampaignId)
  const setActiveCampaignId = useTtrpgStore((s) => s.setActiveCampaignId)
  const deleteCampaign = useTtrpgStore((s) => s.deleteCampaign)
  const initTtrpg = useTtrpgStore((s) => s.initTtrpg)

  const addToast = useToastStore((s) => s.addToast)
  const openSettings = useSettingsStore((s) => s.openSettings)

  const [hubTab, setHubTab] = useState<'worlds' | 'ttrpg'>('worlds')
  const [searchFilter, setSearchFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingWorld, setEditingWorld] = useState<World | null>(null)
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<TTRPGCampaign | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    initTtrpg()
  }, [initTtrpg])

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

    const { settings } = useSettingsStore.getState()
    let confirmed = true
    if (settings.general.confirmWorldDeletion) {
      confirmed = await confirmDialog({
        title: 'Delete Project Vault',
        message: `Are you sure you want to permanently delete "${worldName}"? All associated chapters, lore cards, maps, and timelines will be deleted.`,
        confirmText: 'Delete Project',
        variant: 'danger'
      })
    }

    if (confirmed) {
      deleteWorld(worldId)
      addToast(`Deleted project: ${worldName}`, 'info')
    }
  }

  const handleDeleteCampaign = async (campId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { settings } = useSettingsStore.getState()
    let ok = true
    if (settings.general.confirmWorldDeletion) {
      ok = await confirmDialog({
        title: 'Delete TTRPG Campaign',
        message: `Are you sure you want to delete campaign "${title}" and all its character sheets?`,
        confirmText: 'Delete Campaign',
        variant: 'danger'
      })
    }
    if (ok) {
      deleteCampaign(campId)
      addToast(`Deleted campaign: ${title}`, 'info')
    }
  }

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (!searchFilter.trim()) return campaigns
    const q = searchFilter.toLowerCase()
    return campaigns.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.system && c.system.toLowerCase().includes(q)) ||
      (c.tagline && c.tagline.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    )
  }, [campaigns, searchFilter])

  // Total adventurers count across all campaigns
  const totalAdventurers = useMemo(() => {
    return Object.values(characters).reduce((acc, chars) => acc + chars.length, 0)
  }, [characters])

  // If inside an active campaign, render the campaign dashboard
  if (hubTab === 'ttrpg' && activeCampaignId) {
    return (
      <Suspense fallback={<div className="flex-1 bg-oros-950" />}>
        <TTRPGCampaignDashboard
          campaignId={activeCampaignId}
          onBackToHub={() => setActiveCampaignId(null)}
        />
      </Suspense>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-oros-950 text-oros-100 overflow-y-auto select-none font-sans">
      {/* TOP HEADER NAVIGATION */}
      <header 
        className="h-10 border-b border-oros-800/80 bg-oros-950 px-5 flex items-center justify-between shrink-0 sticky top-0 z-30 pr-[152px] select-none"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-3 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Logo with Text: Clean Default White */}
          <OrosLogoFull className="h-6 w-auto" emblemClassName="text-white" textClassName="text-white" />
          
          {/* Segment Switcher */}
          <div className="flex items-center bg-oros-900 border border-oros-750 rounded-[3px] p-0.5 text-xs font-sans">
            <button
              onClick={() => { setHubTab('worlds'); setActiveCampaignId(null); }}
              className={`px-2.5 py-0.5 rounded-[2px] transition-colors font-medium flex items-center gap-1.5 ${
                hubTab === 'worlds'
                  ? 'bg-oros-800 text-white font-semibold shadow-sm'
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>World Projects</span>
            </button>
            <button
              onClick={() => setHubTab('ttrpg')}
              className={`px-2.5 py-0.5 rounded-[2px] transition-colors font-medium flex items-center gap-1.5 ${
                hubTab === 'ttrpg'
                  ? 'bg-accent-muted text-accent border border-accent/40 font-semibold shadow-sm'
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>TTRPG Hub</span>
            </button>
          </div>
        </div>

        {/* Global Hub Search */}
        <div className="relative w-80 max-w-md hidden md:block" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Search className="w-3.5 h-3.5 text-oros-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={hubTab === 'worlds' ? "Search world projects by title, genre..." : "Search TTRPG campaigns by title, system..."}
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
            onClick={() => openSettings()}
            title="Application Settings & Preferences (Ctrl+,)"
            className="p-1 px-2.5 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-oros-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-oros-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {hubTab === 'worlds' ? (
            <button
              onClick={() => setShowNewModal(true)}
              className="p-1 px-3 rounded-[3px] btn-accent text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          ) : (
            <button
              onClick={() => setShowNewCampaignModal(true)}
              className="p-1 px-3 rounded-[3px] btn-accent text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Campaign</span>
            </button>
          )}

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
        {hubTab === 'worlds' ? (
          <>
            {/* SUBTLE PROJECTS TOOLBAR & METRICS */}
            <div className="flex items-center justify-between pb-3 border-b border-oros-800/80">
              <div className="flex items-center gap-2.5">
                <h1 className="font-sans font-semibold text-sm text-white uppercase tracking-wider">
                  Worldbuilding Vaults
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

                  const genreMeta = getGenreMeta(w.genre)
                  const GenreIcon = genreMeta.icon
                  const thumbnail = w.thumbnailUrl || w.bannerUrl

                  return (
                    <div
                      key={w.id}
                      onClick={() => handleEnterWorld(w.id)}
                      className="card-interactive group bg-oros-900 border border-oros-800 hover:border-oros-700 rounded-[4px] flex flex-col justify-between cursor-pointer transition-all shadow-sm relative overflow-hidden"
                    >
                      {/* Atmospheric Top Halo Strip using project's theme */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-[2.5px] z-10 opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: accentColor }}
                      />

                      {/* Cover Thumbnail Banner (if present) */}
                      {thumbnail ? (
                        <div className="relative h-28 w-full overflow-hidden bg-oros-950 border-b border-oros-800/90 shrink-0">
                          <img
                            src={thumbnail}
                            alt={w.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-oros-900 via-oros-900/30 to-transparent" />

                          {/* Genre Badge with Signature Icon */}
                          <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1.5">
                            <span 
                              className="px-2 py-0.5 rounded-[3px] text-[10px] font-mono font-medium border backdrop-blur-md shadow-sm flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${accentColor}25`,
                                borderColor: `${accentColor}50`,
                                color: accentColor
                              }}
                            >
                              <GenreIcon className="w-3 h-3" />
                              <span>{genreMeta.name}</span>
                            </span>
                          </div>

                          {/* Quick Action Buttons (Edit + Delete) */}
                          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-oros-950/85 backdrop-blur-md rounded-[3px] p-0.5 border border-oros-800 shadow-md">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingWorld(w)
                              }}
                              title="Edit Project Details & Thumbnail"
                              className="p-1 rounded-[2px] text-oros-400 hover:text-white hover:bg-oros-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteWorld(w.id, w.name, e)}
                              title="Delete Project"
                              className="p-1 rounded-[2px] text-oros-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-5 pt-4 pb-0 flex items-center justify-between gap-2">
                          <span 
                            className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-medium border flex items-center gap-1.5"
                            style={{
                              backgroundColor: `${accentColor}15`,
                              borderColor: `${accentColor}40`,
                              color: accentColor
                            }}
                          >
                            <GenreIcon className="w-3 h-3" />
                            <span>{genreMeta.name}</span>
                          </span>

                          {/* Action Menu Buttons */}
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingWorld(w)
                              }}
                              title="Edit Project Details & Thumbnail"
                              className="p-1 rounded-[2px] text-oros-400 hover:text-white hover:bg-oros-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteWorld(w.id, w.name, e)}
                              title="Delete Project"
                              className="p-1 rounded-[2px] text-oros-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* World Title */}
                          <h3 className="font-serif text-lg font-bold text-oros-100 group-hover:text-white transition-colors tracking-tight line-clamp-1">
                            {w.name}
                          </h3>

                          {/* Tagline / Premise */}
                          <p className="text-xs text-oros-400 font-sans mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
                            {w.tagline || ''}
                          </p>
                        </div>

                        {/* Document & Word Count Metrics */}
                        <div className="mt-4 pt-3.5 border-t border-oros-800/80 flex items-center justify-between text-xs font-mono">
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
                </div>
              </div>

              {/* Empty Search Results */}
              {Boolean(searchFilter.trim()) && filteredWorlds.length === 0 && (
                <div className="p-12 text-center bg-oros-900/40 border border-oros-800 rounded-md mt-4">
                  <Compass className="w-8 h-8 text-oros-500 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-oros-200">No matching projects found</h3>
                  <p className="text-xs text-oros-400 mt-1">Try another search keyword or clear your filter.</p>
                  <button
                    onClick={() => setSearchFilter('')}
                    className="px-3 py-1 rounded-[3px] btn-accent text-xs font-semibold mt-3 cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* TTRPG CAMPAIGNS HUB VIEW */
          <>
            {/* TTRPG Toolbar & Metrics */}
            <div className="flex items-center justify-between pb-3 border-b border-oros-800/80">
              <div className="flex items-center gap-2.5">
                <h1 className="font-sans font-semibold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Dices className="w-4 h-4 text-accent" />
                  <span>TTRPG Campaigns</span>
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded-[3px] bg-accent-muted text-accent border border-accent/40 font-bold">
                  {filteredCampaigns.length}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-oros-400">
                <div>
                  <span className="text-oros-500 uppercase text-[10px] mr-1.5">Adventurers:</span>
                  <span className="text-white font-medium">{totalAdventurers}</span>
                </div>
                <div className="h-3 w-[1px] bg-oros-800" />
                <div>
                  <span className="text-oros-500 uppercase text-[10px] mr-1.5">Ruleset:</span>
                  <span className="text-accent font-medium">D&D 5E</span>
                </div>
              </div>
            </div>

            {/* CAMPAIGNS GRID */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCampaigns.map((camp) => {
                  const campChars = characters[camp.id] || []
                  const linkedWorld = worlds.find(w => w.id === camp.linkedWorldId)

                  return (
                    <div
                      key={camp.id}
                      onClick={() => setActiveCampaignId(camp.id)}
                      className="card-interactive group bg-oros-900 hover:bg-oros-850 border border-oros-800 hover:border-accent/50 rounded-[4px] p-5 flex flex-col justify-between cursor-pointer transition-all shadow-sm relative overflow-hidden"
                    >
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-accent opacity-80 group-hover:opacity-100" />

                      <div>
                        {/* Header: System Badge & Actions */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-mono uppercase font-bold tracking-wider bg-accent-muted text-accent border border-accent/40">
                            {camp.system.toUpperCase()}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingCampaign(camp)
                                setShowNewCampaignModal(true)
                              }}
                              title="Edit Campaign"
                              className="p-1 text-oros-500 hover:text-white transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteCampaign(camp.id, camp.title, e)}
                              title="Delete Campaign"
                              className="p-1 text-oros-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-lg font-bold text-oros-100 group-hover:text-white transition-colors tracking-tight line-clamp-1">
                          {camp.title}
                        </h3>

                        {/* Tagline / Premise */}
                        <p className="text-xs text-oros-400 font-sans mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
                          {camp.tagline || camp.description || ''}
                        </p>

                        {/* Linked World Badge if present */}
                        {linkedWorld && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-oros-500 font-mono">
                            <Compass className="w-3 h-3 text-oros-400" />
                            <span className="truncate">World: {linkedWorld.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer: Adventurer Count & Enter */}
                      <div className="mt-5 pt-3.5 border-t border-oros-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-oros-300">
                          <Shield className="w-3.5 h-3.5 text-accent" />
                          <span>{campChars.length}</span>
                          <span className="text-[10px] text-oros-500">sheets</span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-accent group-hover:translate-x-0.5 transition-transform">
                          <span>Enter Campaign</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Create New Campaign Grid Card */}
                <div
                  onClick={() => setShowNewCampaignModal(true)}
                  className="card-interactive border border-dashed border-oros-800 hover:border-accent/50 bg-oros-950/40 hover:bg-oros-850 rounded-[4px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[170px] group"
                >
                  <div className="w-8 h-8 rounded-full bg-oros-900 border border-oros-750 group-hover:border-accent/40 flex items-center justify-center text-accent mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h4 className="font-sans font-medium text-xs text-oros-200 group-hover:text-white transition-colors">
                    Create New Campaign
                  </h4>
                </div>
              </div>

              {filteredCampaigns.length === 0 && (
                <div className="p-12 text-center bg-oros-900/40 border border-oros-800 rounded-md">
                  <Dices className="w-8 h-8 text-oros-500 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-oros-200">No campaigns found</h3>
                  <button
                    onClick={() => setShowNewCampaignModal(true)}
                    className="px-3.5 py-1.5 rounded-[3px] btn-accent text-xs font-semibold mt-3 cursor-pointer"
                  >
                    Create Campaign
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* New / Edit Project Dialog */}
      {(showNewModal || Boolean(editingWorld)) && (
        <Suspense fallback={null}>
          <NewProjectModal
            isOpen={showNewModal || Boolean(editingWorld)}
            initialWorld={editingWorld}
            onClose={() => {
              setShowNewModal(false)
              setEditingWorld(null)
            }}
          />
        </Suspense>
      )}

      {/* New / Edit Campaign Dialog */}
      {showNewCampaignModal && (
        <Suspense fallback={null}>
          <NewCampaignModal
            isOpen={showNewCampaignModal}
            campaignToEdit={editingCampaign}
            onClose={() => {
              setShowNewCampaignModal(false)
              setEditingCampaign(null)
            }}
            onCreated={(campId) => {
              setActiveCampaignId(campId)
              setShowNewCampaignModal(false)
              setEditingCampaign(null)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

