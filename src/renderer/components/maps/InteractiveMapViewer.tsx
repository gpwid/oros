import React, { useState, useRef } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { MapPin, MapRegion } from '@shared/types'
import { 
  Map as MapIcon, Plus, ZoomIn, ZoomOut, RotateCcw, Castle, 
  Trees, Skull, Compass, Shield, ExternalLink, Trash2, Eye 
} from 'lucide-react'

export const InteractiveMapViewer: React.FC = () => {
  const { 
    maps, activeWorldId, selectedMapId, setSelectedMapId, 
    addPinToMap, removePinFromMap, setSelectedEntityId, setActiveTab,
    createMap, gmMode 
  } = useWorldStore()

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isAddingPin, setIsAddingPin] = useState(false)
  const [activePin, setActivePin] = useState<MapPin | null>(null)
  const [showNewMapModal, setShowNewMapModal] = useState(false)
  const [newMapName, setNewMapName] = useState('')
  const [newMapUrl, setNewMapUrl] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)

  const worldMaps = activeWorldId ? maps[activeWorldId] || [] : []
  const currentMap = worldMaps.find((m) => m.id === selectedMapId) || worldMaps[0]

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAddingPin) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPin || !currentMap) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    const title = prompt('Enter Pin Location Name:')
    if (!title?.trim()) {
      setIsAddingPin(false)
      return
    }

    addPinToMap(currentMap.id, {
      x: Math.round(clickX),
      y: Math.round(clickY),
      title: title.trim(),
      description: 'Point of interest',
      color: '#f5c542',
      icon: 'Castle'
    })

    setIsAddingPin(false)
  }

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Castle': return <Castle className="w-3.5 h-3.5" />
      case 'Trees': return <Trees className="w-3.5 h-3.5" />
      case 'Skull': return <Skull className="w-3.5 h-3.5" />
      case 'Shield': return <Shield className="w-3.5 h-3.5" />
      default: return <Compass className="w-3.5 h-3.5" />
    }
  }

  const handleCreateMap = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMapName.trim()) return
    const url = newMapUrl.trim() || 'https://images.unsplash.com/photo-1524654458049-e36be0721fa2?auto=format&fit=crop&w=1920&q=80'
    const created = createMap(newMapName.trim(), url)
    setSelectedMapId(created.id)
    setShowNewMapModal(false)
    setNewMapName('')
    setNewMapUrl('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* Top Map Toolbar */}
      <div className="h-12 bg-oros-900/90 border-b border-oros-800/60 px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-gold-400" />
            <select
              value={currentMap?.id || ''}
              onChange={(e) => setSelectedMapId(e.target.value)}
              className="bg-oros-950 border border-oros-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-semibold focus:outline-none"
            >
              {worldMaps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowNewMapModal(true)}
            className="p-1 px-2 rounded-md bg-oros-800 hover:bg-oros-700 text-oros-300 text-xs flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>New Map</span>
          </button>
        </div>

        {/* Zoom & Pin Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingPin(!isAddingPin)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAddingPin
                ? 'bg-amber-500 text-oros-950'
                : 'bg-oros-800 hover:bg-oros-700 text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isAddingPin ? 'Click Map to Place' : 'Drop Pin'}</span>
          </button>

          <div className="flex items-center bg-oros-950 border border-oros-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
              className="p-1 rounded hover:bg-oros-800 text-oros-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-2 text-oros-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              className="p-1 rounded hover:bg-oros-800 text-oros-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1 rounded hover:bg-oros-800 text-oros-300 border-l border-oros-800"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Canvas Viewport */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 overflow-hidden relative cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ backgroundColor: '#070b10' }}
      >
        {currentMap ? (
          <div
            onClick={handleMapClick}
            className="absolute top-1/2 left-1/2 transition-transform duration-75 origin-center"
            style={{
              width: '1200px',
              height: '750px',
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
            }}
          >
            {/* Map Artwork Layer */}
            <img
              src={currentMap.imageUrl}
              alt={currentMap.name}
              className="w-full h-full object-cover rounded-xl border border-oros-700 pointer-events-none select-none"
            />

            {/* SVG Territory Regions Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {currentMap.regions.map((reg) => {
                const pointsStr = reg.points
                  .map(([px, py]) => `${(px / 100) * 1200},${(py / 100) * 750}`)
                  .join(' ')
                return (
                  <polygon
                    key={reg.id}
                    points={pointsStr}
                    fill={reg.color}
                    fillOpacity={reg.fillOpacity}
                    stroke={reg.color}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                )
              })}
            </svg>

            {/* Interactive Pins Layer */}
            {currentMap.pins.map((pin) => (
              <div
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setActivePin(pin)
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`
                }}
              >
                {/* Pin Badge */}
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-oros-950 font-bold shadow-2xl transition-transform transform group-hover:scale-125 border-2 border-white/80"
                  style={{ backgroundColor: pin.color || '#f5c542' }}
                >
                  {renderIcon(pin.icon)}
                </div>

                {/* Floating Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                  <div className="bg-oros-950/95 border border-oros-700 px-2.5 py-1.5 rounded-lg shadow-xl text-center whitespace-nowrap">
                    <div className="text-xs font-serif font-bold text-slate-100">{pin.title}</div>
                    {pin.description && (
                      <div className="text-[10px] text-oros-400">{pin.description}</div>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-oros-950 border-r border-b border-oros-700 rotate-45 -mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-oros-500">
            No maps found.
          </div>
        )}

        {/* Map Scale Legend Indicator */}
        <div className="absolute bottom-4 left-4 bg-oros-950/80 backdrop-blur-sm border border-oros-800 px-3 py-1.5 rounded-lg text-xs font-mono text-oros-400 pointer-events-none flex items-center gap-2">
          <div className="w-12 h-1 bg-gold-400"></div>
          <span>50 {currentMap?.scaleUnit || 'Leagues'}</span>
        </div>
      </div>

      {/* Selected Pin Details Modal / Drawer */}
      {activePin && (
        <div className="absolute right-4 top-16 w-80 bg-oros-900 border border-oros-700 rounded-xl shadow-2xl p-4 z-30">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-[10px] uppercase font-mono text-gold-400">Location Pin</span>
              <h4 className="font-serif font-bold text-base text-slate-100">{activePin.title}</h4>
            </div>
            <button
              onClick={() => setActivePin(null)}
              className="text-oros-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>
          {activePin.description && (
            <p className="text-xs text-oros-300 mb-3">{activePin.description}</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-oros-800">
            {activePin.entityId && (
              <button
                onClick={() => {
                  setSelectedEntityId(activePin.entityId!)
                  setActiveTab('wiki')
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <span>Open in Wiki</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                if (currentMap) removePinFromMap(currentMap.id, activePin.id)
                setActivePin(null)
              }}
              className="p-1.5 rounded-lg bg-oros-950 hover:bg-red-950 text-oros-400 hover:text-red-400 border border-oros-800"
              title="Delete Pin"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Map Modal */}
      {showNewMapModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-2">Upload or Add Map</h3>
            <form onSubmit={handleCreateMap} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Map Title</label>
                <input
                  type="text"
                  required
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="e.g. Kingdom of the Western Reaches"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Image URL or Local Path</label>
                <input
                  type="text"
                  value={newMapUrl}
                  onChange={(e) => setNewMapUrl(e.target.value)}
                  placeholder="https://... or paste image link"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewMapModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md"
                >
                  Create Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
