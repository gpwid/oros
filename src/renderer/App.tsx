import React, { useEffect } from 'react'
import { useWorldStore } from './store/useWorldStore'
import { WorkspaceTabs } from './components/layout/WorkspaceTabs'
import { Sidebar } from './components/layout/Sidebar'
import { WikiArticleView } from './components/wiki/WikiArticleView'
import { CardGallery } from './components/cards/CardGallery'
import { InteractiveMapViewer } from './components/maps/InteractiveMapViewer'
import { RelationGraphCanvas } from './components/graph/RelationGraphCanvas'
import { WikiNetworkGraph } from './components/graph/WikiNetworkGraph'
import { TimelineView } from './components/timeline/TimelineView'
import { StudioWriter } from './components/writer/StudioWriter'
import { WhiteboardCanvas } from './components/canvas/WhiteboardCanvas'
import { CommandPalette } from './components/common/CommandPalette'
import { ToastContainer } from './components/common/ToastContainer'

export const App: React.FC = () => {
  const { activeTab, openTabs, activeTabId, initStore } = useWorldStore()

  useEffect(() => {
    initStore()
  }, [initStore])

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
        return <WikiArticleView />
      case 'card':
      case 'cards':
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
          {renderActiveView()}
        </main>
      </div>

      <CommandPalette />
      <ToastContainer />
    </div>
  )
}

export default App
