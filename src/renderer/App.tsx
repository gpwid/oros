import React, { useEffect } from 'react'
import { useWorldStore } from './store/useWorldStore'
import { TitleBar } from './components/layout/TitleBar'
import { Sidebar } from './components/layout/Sidebar'
import { WikiArticleView } from './components/wiki/WikiArticleView'
import { CardGallery } from './components/cards/CardGallery'
import { InteractiveMapViewer } from './components/maps/InteractiveMapViewer'
import { RelationGraphCanvas } from './components/graph/RelationGraphCanvas'
import { TimelineView } from './components/timeline/TimelineView'
import { StudioWriter } from './components/writer/StudioWriter'
import { CommandPalette } from './components/common/CommandPalette'
import { ToastContainer } from './components/common/ToastContainer'

export const App: React.FC = () => {
  const { activeTab, initStore } = useWorldStore()

  useEffect(() => {
    initStore()
  }, [initStore])

  const renderActiveView = () => {
    switch (activeTab) {
      case 'wiki':
        return <WikiArticleView />
      case 'cards':
        return <CardGallery />
      case 'maps':
        return <InteractiveMapViewer />
      case 'graph':
        return <RelationGraphCanvas />
      case 'timeline':
        return <TimelineView />
      case 'writer':
        return <StudioWriter />
      default:
        return <WikiArticleView />
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-oros-950 text-slate-100 overflow-hidden font-sans">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex overflow-hidden bg-oros-950">
          {renderActiveView()}
        </div>
      </div>
      <CommandPalette />
      <ToastContainer />
    </div>
  )
}

export default App
