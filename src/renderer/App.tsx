import React, { useEffect, lazy, Suspense } from 'react'
import { useWorldStore } from './store/useWorldStore'
import { WorkspaceTabs } from './components/layout/WorkspaceTabs'
import { Sidebar } from './components/layout/Sidebar'
import { CommandPalette } from './components/common/CommandPalette'
import { ToastContainer } from './components/common/ToastContainer'

// Code-split heavy views to accelerate launch time and memory footprint
const WhiteboardCanvas = lazy(() => import('./components/canvas/WhiteboardCanvas').then(m => ({ default: m.WhiteboardCanvas })))
const WikiArticleView = lazy(() => import('./components/wiki/WikiArticleView').then(m => ({ default: m.WikiArticleView })))
const CardGallery = lazy(() => import('./components/cards/CardGallery').then(m => ({ default: m.CardGallery })))
const InteractiveMapViewer = lazy(() => import('./components/maps/InteractiveMapViewer').then(m => ({ default: m.InteractiveMapViewer })))
const RelationGraphCanvas = lazy(() => import('./components/graph/RelationGraphCanvas').then(m => ({ default: m.RelationGraphCanvas })))
const WikiNetworkGraph = lazy(() => import('./components/graph/WikiNetworkGraph').then(m => ({ default: m.WikiNetworkGraph })))
const TimelineView = lazy(() => import('./components/timeline/TimelineView').then(m => ({ default: m.TimelineView })))
const StudioWriter = lazy(() => import('./components/writer/StudioWriter').then(m => ({ default: m.StudioWriter })))

const ViewFallback = () => (
  <div className="flex-1 h-full w-full flex flex-col items-center justify-center bg-oros-950 text-oros-400">
    <div className="w-7 h-7 rounded-full border border-oros-800 border-t-oros-200 animate-spin" />
    <span className="font-mono text-[10px] tracking-widest text-oros-500 mt-3 uppercase">
      Loading Codex...
    </span>
  </div>
)

export const App: React.FC = () => {
  const { activeTab, openTabs, activeTabId, initStore, worlds, activeWorldId } = useWorldStore()

  useEffect(() => {
    initStore()
  }, [initStore])

  const activeWorld = worlds.find((w) => w.id === activeWorldId) || worlds[0]

  useEffect(() => {
    const theme = activeWorld?.theme || 'sovereign'
    document.documentElement.setAttribute('data-theme', theme)
  }, [activeWorld?.theme])

  const activeTabObj = openTabs.find((t) => t.id === activeTabId)
  const currentTabType = activeTabObj?.type || activeTab

  const renderActiveView = () => {
    if (openTabs.length === 0) {
      // When there are no tabs, display our card relation nodes (not lineage)
      return <WikiNetworkGraph />
    }

    switch (currentTabType) {
      case 'canvas':
        return <WhiteboardCanvas canvasId={activeTabObj?.targetId} />
      case 'wiki':
        return <WikiArticleView entityId={activeTabObj?.targetId} />
      case 'card':
      case 'cards':
        // If a card tab has a specific targetId, render that card's wiki article directly!
        if (activeTabObj?.targetId) {
          return <WikiArticleView entityId={activeTabObj.targetId} />
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
      default:
        return <WikiNetworkGraph />
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-oros-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Browser-style Tabs Bar */}
      <WorkspaceTabs />
      
      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden bg-oros-950">
          <Suspense fallback={<ViewFallback />}>
            {renderActiveView()}
          </Suspense>
        </main>
      </div>

      <CommandPalette />
      <ToastContainer />
    </div>
  )
}

export default App
