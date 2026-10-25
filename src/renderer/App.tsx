import React, { useEffect, lazy, Suspense } from 'react'
import { useWorldStore } from './store/useWorldStore'
import { WorkspaceTabs } from './components/layout/WorkspaceTabs'
import { Sidebar } from './components/layout/Sidebar'
import { HomePage } from './components/home/HomePage'
import { CommandPalette } from './components/common/CommandPalette'
import { ToastContainer } from './components/common/ToastContainer'
import { ConfirmModal } from './components/common/ConfirmModal'
import { CustomTooltipProvider } from './components/common/CustomTooltipProvider'
import { SettingsModal } from './components/settings/SettingsModal'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { useSettingsStore } from './store/useSettingsStore'
import { applyTheme } from './utils/themeEngine'

// Code-split heavy views to accelerate launch time and memory footprint
const WhiteboardCanvas = lazy(() => import('./components/canvas/WhiteboardCanvas').then(m => ({ default: m.WhiteboardCanvas })))
const WikiArticleView = lazy(() => import('./components/wiki/WikiArticleView').then(m => ({ default: m.WikiArticleView })))
const CardGallery = lazy(() => import('./components/cards/CardGallery').then(m => ({ default: m.CardGallery })))
const InteractiveMapViewer = lazy(() => import('./components/maps/InteractiveMapViewer').then(m => ({ default: m.InteractiveMapViewer })))
const RelationGraphCanvas = lazy(() => import('./components/graph/RelationGraphCanvas').then(m => ({ default: m.RelationGraphCanvas })))
const WikiNetworkGraph = lazy(() => import('./components/graph/WikiNetworkGraph').then(m => ({ default: m.WikiNetworkGraph })))
const TimelineView = lazy(() => import('./components/timeline/TimelineView').then(m => ({ default: m.TimelineView })))
const StudioWriter = lazy(() => import('./components/writer/StudioWriter').then(m => ({ default: m.StudioWriter })))
const ConlangDictionaryView = lazy(() => import('./components/conlang/ConlangDictionaryView').then(m => ({ default: m.ConlangDictionaryView })))
const CodexReaderView = lazy(() => import('./components/reader/CodexReaderView').then(m => ({ default: m.CodexReaderView })))

const ViewFallback = () => (
  <div className="flex-1 h-full w-full flex flex-col items-center justify-center bg-oros-950 text-oros-400">
    <div className="w-7 h-7 rounded-full border border-oros-800 border-t-oros-200 animate-spin" />
    <span className="font-mono text-[10px] tracking-widest text-oros-500 mt-3 uppercase">
      Loading Codex...
    </span>
  </div>
)

interface TabItem {
  id: string
  title: string
  type: string
  targetId?: string
}

const TabViewContainer: React.FC<{ tab: TabItem; isActive: boolean }> = React.memo(({ tab, isActive }) => {
  const renderContent = () => {
    switch (tab.type) {
      case 'canvas':
        return <WhiteboardCanvas canvasId={tab.targetId} />
      case 'wiki':
        return <WikiArticleView entityId={tab.targetId} isActive={isActive} />
      case 'card':
      case 'cards':
        if (tab.targetId) {
          return <WikiArticleView entityId={tab.targetId} isActive={isActive} />
        }
        return <CardGallery />
      case 'relations':
      case 'graph':
        return <RelationGraphCanvas />
      case 'wiki-network':
        return <WikiNetworkGraph />
      case 'map':
      case 'maps':
        return <InteractiveMapViewer />
      case 'timeline':
        return <TimelineView />
      case 'writer':
        return <StudioWriter />
      case 'dictionary':
        return <ConlangDictionaryView />
      case 'reader':
        return <CodexReaderView />
      default:
        return <WikiNetworkGraph />
    }
  }

  return (
    <div
      className={`flex-1 flex overflow-hidden ${isActive ? '' : '!hidden'}`}
      style={{ display: isActive ? undefined : 'none' }}
    >
      <ErrorBoundary viewName={tab.title || tab.type}>
        {renderContent()}
      </ErrorBoundary>
    </div>
  )
})

export const App: React.FC = () => {
  const openTabs = useWorldStore((s) => s.openTabs)
  const activeTabId = useWorldStore((s) => s.activeTabId)
  const initStore = useWorldStore((s) => s.initStore)
  const worlds = useWorldStore((s) => s.worlds)
  const activeWorldId = useWorldStore((s) => s.activeWorldId)
  const appView = useWorldStore((s) => s.appView)
  const setAppView = useWorldStore((s) => s.setAppView)
  const isReaderMode = useWorldStore((s) => s.isReaderMode)

  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen)
  const openSettings = useSettingsStore((s) => s.openSettings)
  const closeSettings = useSettingsStore((s) => s.closeSettings)
  const settings = useSettingsStore((s) => s.settings)

  useEffect(() => {
    initStore().then(() => {
      if (settings.general.startupView === 'last-workspace') {
        try {
          const savedView = localStorage.getItem('oros_app_view')
          if (savedView === 'workspace') {
            setAppView('workspace')
          }
        } catch (e) {}
      }
    })
  }, [initStore, settings.general.startupView, setAppView])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('oros_app_view', appView)
      } catch (e) {}
    }
  }, [appView])

  // Global hotkeys (e.g. Ctrl+, for Settings)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault()
        if (isSettingsOpen) {
          closeSettings()
        } else {
          openSettings()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isSettingsOpen, openSettings, closeSettings])

  const activeWorld = worlds.find((w) => w.id === activeWorldId) || worlds[0]

  useEffect(() => {
    // Determine active snippets (workspace-specific or global)
    const activeSnippets = (!settings.interface.forceGlobalTheme && activeWorld?.snippets && activeWorld.snippets.length > 0)
      ? activeWorld.snippets
      : (settings.interface.snippets || [])

    if (settings.interface.forceGlobalTheme) {
      const customConfig = settings.interface.customThemes?.find((t) => t.id === settings.interface.themePreset)
      applyTheme(
        settings.interface.themePreset,
        settings.interface.themePreset === 'custom' ? settings.interface.customAccentColor : undefined,
        customConfig,
        activeSnippets
      )
    } else if (appView === 'home') {
      applyTheme('sovereign', undefined, undefined, activeSnippets)
    } else if (activeWorld?.themeConfig) {
      applyTheme(undefined, undefined, activeWorld.themeConfig, activeSnippets)
    } else {
      applyTheme(activeWorld?.theme, activeWorld?.customAccentColor, undefined, activeSnippets)
    }
  }, [
    appView, 
    activeWorld?.theme, 
    activeWorld?.customAccentColor, 
    activeWorld?.themeConfig,
    activeWorld?.snippets,
    settings.interface.forceGlobalTheme, 
    settings.interface.themePreset, 
    settings.interface.customAccentColor, 
    settings.interface.customThemes,
    settings.interface.snippets,
    settings.interface.colorMode
  ])

  return (
    <div className="h-screen w-screen flex flex-col bg-oros-950 text-oros-100 overflow-hidden font-sans">
      {appView === 'home' ? (
        <HomePage />
      ) : (
        <>
          {/* Top Browser-style Tabs Bar */}
          <WorkspaceTabs />
          
          {/* Main Workspace Layout */}
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex overflow-hidden bg-oros-950 relative">
              <ErrorBoundary viewName="Main Workspace">
                <Suspense fallback={<ViewFallback />}>
                  {openTabs.length === 0 ? (
                    <div className="flex-1 flex overflow-hidden">
                      <WikiNetworkGraph />
                    </div>
                  ) : (
                    openTabs.map((tab) => (
                      <TabViewContainer
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === (activeTabId || openTabs[0]?.id)}
                      />
                    ))
                  )}
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
        </>
      )}

      {/* Distraction-Free Codex Reader Compendium Overlay */}
      {isReaderMode && (
        <Suspense fallback={<ViewFallback />}>
          <CodexReaderView />
        </Suspense>
      )}

      <CommandPalette />
      <ToastContainer />
      <ConfirmModal />
      <CustomTooltipProvider />
      <SettingsModal />
    </div>
  )
}

export default App
