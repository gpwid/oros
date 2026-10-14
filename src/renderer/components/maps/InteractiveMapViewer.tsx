import React, { useState, useRef } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { MapPin, MapRegion } from '@shared/types'
import { QuickPeekCard } from '../common/QuickPeekCard'
import { 
  Map as MapIcon, Plus, ZoomIn, ZoomOut, RotateCcw, Castle, 
  Trees, Skull, Compass, Shield, ExternalLink, Trash2, Eye, 
  Layers, Upload, ChevronRight, CornerDownRight 
} from 'lucide-react'

export const InteractiveMapViewer: React.FC = () => {
  const { 
    maps, entities, activeWorldId, selectedMapId, setSelectedMapId, 
    addPinToMap, removePinFromMap, setSelectedEntityId, setActiveTab,
    createMap, gmMode 
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isAddingPin, setIsAddingPin] = useState(false)
  const [pendingPinCoords, setPendingPinCoords] = useState<{ x: number; y: number } | null>(null)
  const [pendingPinTitle, setPendingPinTitle] = useState('')
  const [pendingPinEntityId, setPendingPinEntityId] = useState('')
  const [pendingPinSubMapId, setPendingPinSubMapId] = useState('')
  const [activePin, setActivePin] = useState<MapPin | null>(null)

  // Layer toggles
  const [showTerritories, setShowTerritories] = useState(true)
  const [showPins, setShowPins] = useState(true)

  // New map modal
  const [showNewMapModal, setShowNewMapModal] = useState(false)
  const [newMapName, setNewMapName] = useState('')
  const [newMapUrl, setNewMapUrl] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)

  const worldMaps = activeWorldId ? maps[activeWorldId] || [] : []
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const currentMap = worldMaps.find((m) => m.id === selectedMapId) || worldMaps[0]

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAddingPin || pendingPinCoords) return
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

    setPendingPinCoords({ x: Math.round(clickX), y: Math.round(clickY) })
    setPendingPinTitle('')
    setPendingPinEntityId('')
    setPendingPinSubMapId('')
    setIsAddingPin(false)
  }

  const handleSavePendingPin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMap || !pendingPinCoords || !pendingPinTitle.trim()) return

    addPinToMap(currentMap.id, {
      x: pendingPinCoords.x,
      y: pendingPinCoords.y,
      title: pendingPinTitle.trim(),
      description: 'Point of interest',
      entityId: pendingPinEntityId || undefined,
      subMapId: pendingPinSubMapId || undefined,
      color: '#f5c542',
      icon: 'Castle'
    })

    setPendingPinCoords(null)
    addToast(`Pinned "${pendingPinTitle}" to map`, 'success')
  }

  const handleImportMapArtwork = async () => {
    if (window.oros) {
      const assetUrl = await window.oros.importAsset()
      if (assetUrl) {
        setNewMapUrl(assetUrl)
        addToast('Map artwork imported into vault', 'success')
      }
    } else {
      addToast('Local asset importer requires desktop app', 'warning')
    }
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
    addToast(`Created map: ${newMapName}`, 'success')
  }

  // Find linked entity for active pin
  const linkedEntity = activePin?.entityId 
    ? worldEntities.find(e => e.id === activePin.entityId)
    : null

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
              className="bg-oros-950 border border-oros-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-semibold focus:outline-none focus:border-gold-400"
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
            className="p-1 px-2 rounded-md bg-oros-800 hover:bg-oros-700 text-oros-300 text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>New Map</span>
          </button>
        </div>

        {/* Layer Controls & Zoom Controls */}
        <div className="flex items-center gap-3">
          {/* Layer toggles */}
          <div className="flex items-center gap-1 bg-oros-950 border border-oros-800 rounded-lg p-0.5 text-xs text-oros-300">
            <button
              onClick={() => setShowTerritories(!showTerritories)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                showTerritories ? 'bg-gold-500/20 text-gold-300' : 'text-oros-500 hover:text-slate-300'
              }`}
            >
              Territories
            </button>
            <button
              onClick={() => setShowPins(!showPins)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                showPins ? 'bg-gold-500/20 text-gold-300' : 'text-oros-500 hover:text-slate-300'
              }`}
            >
              Pins
            </button>
          </div>

          <button
            onClick={() => setIsAddingPin(!isAddingPin)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAddingPin
                ? 'bg-amber-500 text-oros-950 animate-pulse'
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
              width: '1280px',
              height: '800px',
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)'
            }}
          >
            {/* Map Artwork Layer */}
            <img
              src={currentMap.imageUrl}
              alt={currentMap.name}
              className="w-full h-full object-cover rounded-2xl border border-oros-700 pointer-events-none select-none"
            />

            {/* SVG Territory Regions Layer */}
            {showTerritories && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {currentMap.regions.map((reg) => {
                  const pointsStr = reg.points
                    .map(([px, py]) => `${(px / 100) * 1280},${(py / 100) * 800}`)
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
            )}

            {/* Interactive Pins Layer */}
            {showPins && currentMap.pins.map((pin) => (
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-oros-950 font-bold shadow-2xl transition-transform transform group-hover:scale-125 border-2 border-white/80"
                  style={{ backgroundColor: pin.color || '#f5c542' }}
                >
                  {renderIcon(pin.icon)}
                </div>

                {/* Sub-map badge indicator */}
                {pin.subMapId && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-400 text-oros-950 text-[9px] flex items-center justify-center font-bold">
                    ▼
                  </span>
                )}

                {/* Floating Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                  <div className="bg-oros-950/95 border border-oros-700 px-3 py-1.5 rounded-xl shadow-2xl text-center whitespace-nowrap">
                    <div className="text-xs font-serif font-bold text-slate-100">{pin.title}</div>
                    {pin.description && (
                      <div className="text-[10px] text-oros-400">{pin.description}</div>
                    )}
                    {pin.subMapId && (
                      <div className="text-[9px] text-teal-400 font-mono mt-0.5 flex items-center gap-1 justify-center">
                        <CornerDownRight className="w-2.5 h-2.5" />
                        <span>Has Nested Sub-Map</span>
                      </div>
                    )}
                  </div>
                  <div className="w-2 h-2 bg-oros-950 border-r border-b border-oros-700 rotate-45 -mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-oros-500">
            No maps registered in world vault.
          </div>
        )}

        {/* Map Scale Legend */}
        <div className="absolute bottom-4 left-4 bg-oros-950/80 backdrop-blur-sm border border-oros-800 px-3 py-1.5 rounded-lg text-xs font-mono text-oros-400 pointer-events-none flex items-center gap-2">
          <div className="w-12 h-1 bg-gold-400"></div>
          <span>50 {currentMap?.scaleUnit || 'Leagues'}</span>
        </div>
      </div>

      {/* Selected Pin Details Drawer / QuickPeek */}
      {activePin && (
        <div className="absolute right-4 top-16 w-84 bg-oros-900/95 border border-oros-700 rounded-2xl shadow-2xl p-5 z-30 backdrop-blur-md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-gold-400 font-semibold tracking-wider">
                Cartographic Landmark
              </span>
              <h4 className="font-serif font-bold text-lg text-slate-100">{activePin.title}</h4>
            </div>
            <button
              onClick={() => setActivePin(null)}
              className="text-oros-400 hover:text-slate-200 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {activePin.description && (
            <p className="text-xs text-oros-300 mb-4 leading-relaxed">{activePin.description}</p>
          )}

          {/* Sub-map Drill Down Action */}
          {activePin.subMapId && (
            <div className="mb-4 p-3 rounded-xl bg-teal-950/60 border border-teal-800/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-teal-200">Nested Child Map</div>
                <div className="text-[10px] text-teal-400">Zoom into district or floorplan</div>
              </div>
              <button
                onClick={() => {
                  setSelectedMapId(activePin.subMapId!)
                  setActivePin(null)
                }}
                className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-oros-950 text-xs font-bold flex items-center gap-1"
              >
                <span>Enter Map</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Linked Lore Card Preview */}
          {linkedEntity ? (
            <div className="mb-4">
              <span className="text-[10px] text-oros-400 uppercase font-mono mb-1 block">Connected Codex Card:</span>
              <div className="p-2.5 rounded-xl bg-oros-950/80 border border-oros-800 flex items-center justify-between">
                <div className="truncate mr-2">
                  <div className="text-xs font-semibold text-slate-200 truncate">{linkedEntity.title}</div>
                  <div className="text-[10px] text-gold-400 uppercase font-mono">{linkedEntity.type}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEntityId(linkedEntity.id)
                    setActiveTab('wiki')
                  }}
                  className="px-2 py-1 rounded bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 text-xs font-semibold flex items-center gap-1"
                >
                  <span>Wiki</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-oros-500 italic mb-4">
              Pin is not linked to any Lore Entity.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-oros-800">
            <button
              onClick={() => {
                if (currentMap) removePinFromMap(currentMap.id, activePin.id)
                setActivePin(null)
                addToast('Removed landmark pin', 'info')
              }}
              className="p-1.5 rounded-lg bg-oros-950 hover:bg-rose-950 text-oros-400 hover:text-rose-400 border border-oros-800 transition-colors"
              title="Delete Pin"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Accessible Inline Pin Creation Form (No window.prompt!) */}
      {pendingPinCoords && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700/80 rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-1">
              Place Cartographic Landmark
            </h3>
            <p className="text-xs text-oros-300 mb-4">
              Coordinates: {pendingPinCoords.x}%, {pendingPinCoords.y}% on {currentMap?.name}
            </p>
            <form onSubmit={handleSavePendingPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Landmark Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={pendingPinTitle}
                  onChange={(e) => setPendingPinTitle(e.target.value)}
                  placeholder="e.g. Ruins of the Sunken Bastion"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Link to Lore Entity (Optional)</label>
                <select
                  value={pendingPinEntityId}
                  onChange={(e) => setPendingPinEntityId(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="">No entity link</option>
                  {worldEntities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.title} ({ent.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Connect Sub-Map for Drilldown (Optional)</label>
                <select
                  value={pendingPinSubMapId}
                  onChange={(e) => setPendingPinSubMapId(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="">No sub-map</option>
                  {worldMaps.filter(m => m.id !== currentMap?.id).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingPinCoords(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md"
                >
                  Drop Landmark Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Map Modal with Local Asset Importer */}
      {showNewMapModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-2">Import or Create Map</h3>
            <form onSubmit={handleCreateMap} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Map Title</label>
                <input
                  type="text"
                  required
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="e.g. Kingdom of the Western Reaches"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Artwork Source</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={handleImportMapArtwork}
                    className="flex-1 py-2 px-3 rounded-lg bg-oros-800 hover:bg-oros-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-oros-700 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-gold-400" />
                    <span>Choose File from Computer</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newMapUrl}
                  onChange={(e) => setNewMapUrl(e.target.value)}
                  placeholder="oros-asset://... or https://..."
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
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
