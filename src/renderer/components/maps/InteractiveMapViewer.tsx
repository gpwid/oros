import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { MapPin, MapRegion, LoreEntity } from '@shared/types'
import { 
  Map as MapIcon, Plus, ZoomIn, ZoomOut, RotateCcw, Castle, 
  Trees, Skull, Compass, Shield, ExternalLink, Trash2, Eye, 
  Layers, Upload, ChevronRight, CornerDownRight, Hand,
  Hexagon, Magnet, Crown, Building2, Landmark,
  Sword, Tent, Anchor, Flame, Gem, Key, X, Check, Edit3,
  MapPin as PinIcon, Sparkles
} from 'lucide-react'

// Fantasy Map Pin Icons
const PIN_ICONS = [
  { id: 'Castle', label: 'Stronghold', icon: Castle },
  { id: 'Crown', label: 'Capital', icon: Crown },
  { id: 'Building2', label: 'Settlement', icon: Building2 },
  { id: 'Landmark', label: 'Monolith', icon: Landmark },
  { id: 'Shield', label: 'Fortress', icon: Shield },
  { id: 'Sword', label: 'Battlefield', icon: Sword },
  { id: 'Skull', label: 'Ruins / Danger', icon: Skull },
  { id: 'Mountain', label: 'Peak', icon: Castle }, // fallback to castle if mountain not in lucide
  { id: 'Trees', label: 'Forest', icon: Trees },
  { id: 'Tent', label: 'Camp', icon: Tent },
  { id: 'Anchor', label: 'Harbor', icon: Anchor },
  { id: 'Compass', label: 'Waypoint', icon: Compass },
  { id: 'Flame', label: 'Shrine / Fire', icon: Flame },
  { id: 'Eye', label: 'Watchtower', icon: Eye },
  { id: 'Gem', label: 'Sanctum / Mine', icon: Gem },
  { id: 'Key', label: 'Vault', icon: Key },
]

// Preset Palette Colors for Territories and Pins
const PALETTE_COLORS = [
  { name: 'Gold', hex: '#f5c542' },
  { name: 'Crimson', hex: '#ef4444' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Azure', hex: '#3b82f6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Amber', hex: '#f97316' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Slate', hex: '#64748b' }
]

type ActiveTool = 'pan' | 'territory' | 'pin'

export const InteractiveMapViewer: React.FC = () => {
  const { 
    maps, entities, activeWorldId, selectedMapId, setSelectedMapId, 
    addPinToMap, updatePinOnMap, removePinFromMap,
    addRegionToMap, updateRegionOnMap, removeRegionFromMap,
    createEntity, setSelectedEntityId, setActiveTab, openTab,
    createMap 
  } = useWorldStore()

  const { addToast } = useToastStore()

  // Tool state
  const [activeTool, setActiveTool] = useState<ActiveTool>('pan')
  const [snappingEnabled, setSnappingEnabled] = useState(true)
  const [showTerritories, setShowTerritories] = useState(true)
  const [showPins, setShowPins] = useState(true)

  // Viewport zoom & pan
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)

  // Territory drawing state
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([])
  const [hoverPoint, setHoverPoint] = useState<[number, number] | null>(null)
  const [isNearStartPoint, setIsNearStartPoint] = useState(false)

  // Selected items & drawers
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<MapRegion | null>(null)

  // Pin Dragging state
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null)
  const dragStartPinPos = useRef<{ x: number; y: number } | null>(null)
  const hasDraggedPin = useRef(false)

  // Territory Modal state
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false)
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null)
  const [regionForm, setRegionForm] = useState({
    name: '',
    color: '#3b82f6',
    fillOpacity: 0.25,
    entityId: ''
  })

  // Pin Modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [editingPinId, setEditingPinId] = useState<string | null>(null)
  const [pinForm, setPinForm] = useState({
    x: 50,
    y: 50,
    title: '',
    description: '',
    icon: 'Compass',
    color: '#f5c542',
    entityId: '',
    subMapId: ''
  })

  // New map modal
  const [showNewMapModal, setShowNewMapModal] = useState(false)
  const [newMapName, setNewMapName] = useState('')
  const [newMapUrl, setNewMapUrl] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const mapElementRef = useRef<HTMLDivElement>(null)

  const worldMaps = activeWorldId ? maps[activeWorldId] || [] : []
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const currentMap = worldMaps.find((m) => m.id === selectedMapId) || worldMaps[0]

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.code === 'Space') {
        setIsSpacePressed(true)
      } else if (e.key === 'v' || e.key === 'V' || e.key === 'h' || e.key === 'H') {
        setActiveTool('pan')
        setDrawingPoints([])
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool('territory')
        setSelectedPin(null)
        setSelectedRegion(null)
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool('pin')
        setDrawingPoints([])
        setSelectedPin(null)
        setSelectedRegion(null)
      } else if (e.key === 'Escape') {
        if (drawingPoints.length > 0) {
          setDrawingPoints([])
          addToast('Cancelled territory drawing', 'info')
        } else {
          setActiveTool('pan')
          setSelectedPin(null)
          setSelectedRegion(null)
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (drawingPoints.length > 0) {
          setDrawingPoints((pts) => pts.slice(0, pts.length - 1))
        }
      } else if (e.key === 'Enter') {
        if (drawingPoints.length >= 3) {
          handleFinishPolygon()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [drawingPoints])

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87
    setZoom((prevZoom) => {
      const next = prevZoom * zoomFactor
      return Math.min(3.5, Math.max(0.35, Number(next.toFixed(2))))
    })
  }

  // Convert client coordinates to map percentage [0-100]
  const getMapCoordinates = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!mapElementRef.current) return null
    const rect = mapElementRef.current.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null

    let rawX = ((clientX - rect.left) / rect.width) * 100
    let rawY = ((clientY - rect.top) / rect.height) * 100

    rawX = Math.max(0, Math.min(100, rawX))
    rawY = Math.max(0, Math.min(100, rawY))

    if (snappingEnabled) {
      // Snap to nearest 0.5% grid
      rawX = Math.round(rawX * 2) / 2
      rawY = Math.round(rawY * 2) / 2
    }

    return {
      x: Number(rawX.toFixed(2)),
      y: Number(rawY.toFixed(2))
    }
  }, [snappingEnabled])

  // Check if cursor is near the first vertex for closing snap
  const checkNearStart = (coords: { x: number; y: number }): boolean => {
    if (drawingPoints.length < 3 || !mapElementRef.current) return false
    const rect = mapElementRef.current.getBoundingClientRect()
    const startPt = drawingPoints[0]
    const startPx = (startPt[0] / 100) * rect.width
    const startPy = (startPt[1] / 100) * rect.height
    const currentPx = (coords.x / 100) * rect.width
    const currentPy = (coords.y / 100) * rect.height
    const dist = Math.hypot(currentPx - startPx, currentPy - startPy)
    return dist < 22 // 22 pixels snap radius
  }

  // Pan / Viewport Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // If middle mouse, spacebar, or pan tool, start panning
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
      return
    }

    // Handle pin dragging
    if (draggingPinId && currentMap) {
      hasDraggedPin.current = true
      const coords = getMapCoordinates(e.clientX, e.clientY)
      if (coords) {
        updatePinOnMap(currentMap.id, draggingPinId, { x: coords.x, y: coords.y })
      }
      return
    }

    // Handle territory drawing hover
    if (activeTool === 'territory') {
      const coords = getMapCoordinates(e.clientX, e.clientY)
      if (coords) {
        const near = checkNearStart(coords)
        setIsNearStartPoint(near)
        if (near && drawingPoints.length >= 3) {
          setHoverPoint([drawingPoints[0][0], drawingPoints[0][1]])
        } else {
          setHoverPoint([coords.x, coords.y])
        }
      }
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    if (draggingPinId) {
      setDraggingPinId(null)
      dragStartPinPos.current = null
    }
  }

  // Map Canvas Click Handler
  const handleMapClick = (e: React.MouseEvent) => {
    // Prevent click action if user was dragging a pin
    if (hasDraggedPin.current) {
      hasDraggedPin.current = false
      return
    }

    // Territory tool click
    if (activeTool === 'territory') {
      const coords = getMapCoordinates(e.clientX, e.clientY)
      if (!coords) return

      // If clicking near start vertex and we have >= 3 points, close polygon!
      if (isNearStartPoint && drawingPoints.length >= 3) {
        handleFinishPolygon()
        return
      }

      setDrawingPoints((pts) => [...pts, [coords.x, coords.y]])
      return
    }

    // Pin tool click
    if (activeTool === 'pin') {
      const coords = getMapCoordinates(e.clientX, e.clientY)
      if (!coords || !currentMap) return

      // Open Pin Creation Modal
      setEditingPinId(null)
      setPinForm({
        x: coords.x,
        y: coords.y,
        title: '',
        description: '',
        icon: 'Castle',
        color: '#f5c542',
        entityId: '',
        subMapId: ''
      })
      setIsPinModalOpen(true)
      setActiveTool('pan')
      return
    }

    // Pan tool click (deselect drawers)
    if (activeTool === 'pan') {
      setSelectedPin(null)
      setSelectedRegion(null)
    }
  }

  // Double click map to close territory
  const handleMapDoubleClick = (e: React.MouseEvent) => {
    if (activeTool === 'territory' && drawingPoints.length >= 3) {
      e.stopPropagation()
      handleFinishPolygon()
    }
  }

  // Finish polygon and open region modal
  const handleFinishPolygon = () => {
    if (drawingPoints.length < 3) {
      addToast('A territory requires at least 3 vertices', 'warning')
      return
    }
    setEditingRegionId(null)
    setRegionForm({
      name: '',
      color: PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)].hex,
      fillOpacity: 0.25,
      entityId: ''
    })
    setIsRegionModalOpen(true)
  }

  // Cancel territory drawing
  const handleCancelDrawing = () => {
    setDrawingPoints([])
    setIsNearStartPoint(false)
    setHoverPoint(null)
    setActiveTool('pan')
    addToast('Drawing cancelled', 'info')
  }

  // Save Territory Region
  const handleSaveRegion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMap) return

    if (!regionForm.name.trim()) {
      addToast('Please enter a territory name', 'warning')
      return
    }

    if (editingRegionId) {
      // Update existing region
      updateRegionOnMap(currentMap.id, editingRegionId, {
        name: regionForm.name.trim(),
        color: regionForm.color,
        fillOpacity: regionForm.fillOpacity,
        entityId: regionForm.entityId || undefined
      })
      addToast(`Updated territory "${regionForm.name}"`, 'success')
      if (selectedRegion && selectedRegion.id === editingRegionId) {
        setSelectedRegion({
          ...selectedRegion,
          name: regionForm.name.trim(),
          color: regionForm.color,
          fillOpacity: regionForm.fillOpacity,
          entityId: regionForm.entityId || undefined
        })
      }
    } else {
      // Add new region
      addRegionToMap(currentMap.id, {
        name: regionForm.name.trim(),
        points: drawingPoints,
        color: regionForm.color,
        fillOpacity: regionForm.fillOpacity,
        entityId: regionForm.entityId || undefined
      })
      addToast(`Marked territory "${regionForm.name}"`, 'success')
      setDrawingPoints([])
      setActiveTool('pan')
    }

    setIsRegionModalOpen(false)
  }

  // Save Landmark Pin
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMap) return

    if (!pinForm.title.trim()) {
      addToast('Please enter a landmark title', 'warning')
      return
    }

    if (editingPinId) {
      // Update existing pin
      updatePinOnMap(currentMap.id, editingPinId, {
        title: pinForm.title.trim(),
        description: pinForm.description.trim(),
        icon: pinForm.icon,
        color: pinForm.color,
        entityId: pinForm.entityId || undefined,
        subMapId: pinForm.subMapId || undefined
      })
      addToast(`Updated landmark "${pinForm.title}"`, 'success')
      if (selectedPin && selectedPin.id === editingPinId) {
        setSelectedPin({
          ...selectedPin,
          title: pinForm.title.trim(),
          description: pinForm.description.trim(),
          icon: pinForm.icon,
          color: pinForm.color,
          entityId: pinForm.entityId || undefined,
          subMapId: pinForm.subMapId || undefined
        })
      }
    } else {
      // Create new pin
      addPinToMap(currentMap.id, {
        x: pinForm.x,
        y: pinForm.y,
        title: pinForm.title.trim(),
        description: pinForm.description.trim() || 'Point of interest',
        icon: pinForm.icon,
        color: pinForm.color,
        entityId: pinForm.entityId || undefined,
        subMapId: pinForm.subMapId || undefined
      })
      addToast(`Pinned "${pinForm.title}" to map`, 'success')
    }

    setIsPinModalOpen(false)
  }

  // Quick-create Location Card from Territory
  const handleCreateLocationCardForRegion = () => {
    const cardTitle = regionForm.name.trim() || 'New Territory Location'
    const newEntity = createEntity('location', cardTitle)
    setRegionForm((prev) => ({ ...prev, entityId: newEntity.id }))
    addToast(`Created Location Card: "${newEntity.title}"`, 'success')
  }

  // Quick-create Location Card from Pin
  const handleCreateLocationCardForPin = () => {
    const cardTitle = pinForm.title.trim() || 'New Landmark Location'
    const newEntity = createEntity('location', cardTitle)
    setPinForm((prev) => ({ ...prev, entityId: newEntity.id }))
    addToast(`Created Location Card: "${newEntity.title}"`, 'success')
  }

  // Centroid calculation for Territory Label
  const getPolygonCentroid = (points: [number, number][]): { x: number; y: number } => {
    if (!points || points.length === 0) return { x: 50, y: 50 }
    let xSum = 0
    let ySum = 0
    for (const [px, py] of points) {
      xSum += px
      ySum += py
    }
    return {
      x: xSum / points.length,
      y: ySum / points.length
    }
  }

  // Render Pin Icon helper
  const renderPinIcon = (iconName?: string, className = 'w-4 h-4') => {
    const match = PIN_ICONS.find((i) => i.id === iconName)
    if (match) {
      const IconComponent = match.icon
      return <IconComponent className={className} />
    }
    return <Compass className={className} />
  }

  // Map Artwork Importer
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

  // Create Map
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

  // Linked Entity for selected pin or region
  const selectedPinEntity = selectedPin?.entityId
    ? worldEntities.find((e) => e.id === selectedPin.entityId)
    : null

  const selectedRegionEntity = selectedRegion?.entityId
    ? worldEntities.find((e) => e.id === selectedRegion.entityId)
    : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* MINIMAL TOP BAR: Map Selector & Stats */}
      <div className="h-11 bg-oros-900/90 border-b border-oros-800/60 px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-gold-400" />
            <select
              value={currentMap?.id || ''}
              onChange={(e) => {
                setSelectedMapId(e.target.value)
                setSelectedPin(null)
                setSelectedRegion(null)
                setDrawingPoints([])
              }}
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

          {currentMap && (
            <div className="text-[11px] text-oros-400 hidden sm:flex items-center gap-2 border-l border-oros-800 pl-3">
              <span>{currentMap.regions?.length || 0} Territories</span>
              <span>•</span>
              <span>{currentMap.pins?.length || 0} Landmarks</span>
            </div>
          )}
        </div>

        {/* Map Scale Legend Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-oros-400 bg-oros-950/70 border border-oros-800/80 px-2.5 py-1 rounded-lg">
          <div className="w-8 h-1 bg-gold-400 rounded-full"></div>
          <span className="text-[11px]">50 {currentMap?.scaleUnit || 'Leagues'}</span>
        </div>
      </div>

      {/* INTERACTIVE MAP VIEWPORT */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 overflow-hidden relative ${
          isPanning || isSpacePressed
            ? 'cursor-grab active:cursor-grabbing'
            : activeTool === 'territory'
            ? 'cursor-crosshair'
            : activeTool === 'pin'
            ? 'cursor-cell'
            : 'cursor-default'
        }`}
        style={{ backgroundColor: '#070b10' }}
      >
        {currentMap ? (
          <div
            ref={mapElementRef}
            onClick={handleMapClick}
            onDoubleClick={handleMapDoubleClick}
            className="absolute top-1/2 left-1/2 transition-transform duration-75 origin-center"
            style={{
              width: '1280px',
              height: '800px',
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)'
            }}
          >
            {/* Base Map Image */}
            <img
              src={currentMap.imageUrl}
              alt={currentMap.name}
              className="w-full h-full object-cover rounded-2xl border border-oros-700 pointer-events-none select-none"
            />

            {/* SVG OVERLAY: Territories & In-Progress Polygon */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Saved Territories */}
              {showTerritories && currentMap.regions?.map((reg) => {
                const pointsStr = reg.points
                  .map(([px, py]) => `${(px / 100) * 1280},${(py / 100) * 800}`)
                  .join(' ')
                const centroid = getPolygonCentroid(reg.points)
                const isSelected = selectedRegion?.id === reg.id

                return (
                  <g key={reg.id} className="pointer-events-auto cursor-pointer group">
                    <polygon
                      points={pointsStr}
                      fill={reg.color}
                      fillOpacity={isSelected ? Math.min(0.65, reg.fillOpacity + 0.25) : reg.fillOpacity}
                      stroke={isSelected ? '#f5c542' : reg.color}
                      strokeWidth={isSelected ? 3 : 2}
                      strokeDasharray={isSelected ? 'none' : '5 4'}
                      onClick={(e) => {
                        if (activeTool === 'pan') {
                          e.stopPropagation()
                          setSelectedRegion(reg)
                          setSelectedPin(null)
                        }
                      }}
                      className="transition-all duration-150 group-hover:fill-opacity-50"
                    />

                    {/* Centered Territory Name Label */}
                    {reg.name && (
                      <text
                        x={(centroid.x / 100) * 1280}
                        y={(centroid.y / 100) * 800}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-slate-100 font-serif font-bold text-xs pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                        style={{ letterSpacing: '0.06em' }}
                      >
                        {reg.name}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* In-Progress Territory Drawing Preview */}
              {activeTool === 'territory' && drawingPoints.length > 0 && (
                <g className="pointer-events-none">
                  {/* Live Polygon Fill Preview (when >= 3 points) */}
                  {drawingPoints.length >= 2 && hoverPoint && (
                    <polygon
                      points={[...drawingPoints, hoverPoint]
                        .map(([px, py]) => `${(px / 100) * 1280},${(py / 100) * 800}`)
                        .join(' ')}
                      fill="#3b82f6"
                      fillOpacity={0.15}
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Lines between placed vertices */}
                  {drawingPoints.map((pt, idx) => {
                    if (idx === 0) return null
                    const prev = drawingPoints[idx - 1]
                    return (
                      <line
                        key={`line-${idx}`}
                        x1={(prev[0] / 100) * 1280}
                        y1={(prev[1] / 100) * 800}
                        x2={(pt[0] / 100) * 1280}
                        y2={(pt[1] / 100) * 800}
                        stroke="#f5c542"
                        strokeWidth={2.5}
                      />
                    )
                  })}

                  {/* Active Rubberband line to mouse cursor */}
                  {hoverPoint && drawingPoints.length > 0 && (
                    <line
                      x1={(drawingPoints[drawingPoints.length - 1][0] / 100) * 1280}
                      y1={(drawingPoints[drawingPoints.length - 1][1] / 100) * 800}
                      x2={(hoverPoint[0] / 100) * 1280}
                      y2={(hoverPoint[1] / 100) * 800}
                      stroke={isNearStartPoint ? '#10b981' : '#f5c542'}
                      strokeWidth={2}
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Vertex Points */}
                  {drawingPoints.map((pt, idx) => {
                    const isStart = idx === 0
                    const isStartCloseTarget = isStart && isNearStartPoint && drawingPoints.length >= 3

                    return (
                      <g key={`vert-${idx}`}>
                        {isStartCloseTarget && (
                          <circle
                            cx={(pt[0] / 100) * 1280}
                            cy={(pt[1] / 100) * 800}
                            r={14}
                            fill="#10b981"
                            fillOpacity={0.3}
                            stroke="#10b981"
                            strokeWidth={2}
                            className="animate-ping"
                          />
                        )}
                        <circle
                          cx={(pt[0] / 100) * 1280}
                          cy={(pt[1] / 100) * 800}
                          r={isStart ? 6 : 4}
                          fill={isStartCloseTarget ? '#10b981' : isStart ? '#f5c542' : '#ffffff'}
                          stroke="#0a0e14"
                          strokeWidth={2}
                        />
                      </g>
                    )
                  })}
                </g>
              )}
            </svg>

            {/* INTERACTIVE PINS LAYER */}
            {showPins && currentMap.pins?.map((pin) => {
              const isSelected = selectedPin?.id === pin.id
              const isDraggingThisPin = draggingPinId === pin.id

              return (
                <div
                  key={pin.id}
                  onMouseDown={(e) => {
                    if (activeTool === 'pan' && e.button === 0) {
                      e.stopPropagation()
                      setDraggingPinId(pin.id)
                      hasDraggedPin.current = false
                      dragStartPinPos.current = { x: pin.x, y: pin.y }
                    }
                  }}
                  onClick={(e) => {
                    if (activeTool === 'pan') {
                      e.stopPropagation()
                      setSelectedPin(pin)
                      setSelectedRegion(null)
                    }
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group z-10 transition-transform ${
                    isDraggingThisPin ? 'cursor-grabbing scale-125 z-30' : 'cursor-pointer hover:scale-115'
                  }`}
                  style={{
                    left: `${pin.x}%`,
                    top: `${pin.y}%`
                  }}
                >
                  {/* Pin Badge */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-oros-950 font-bold shadow-2xl transition-all border-2 ${
                      isSelected 
                        ? 'border-white ring-4 ring-gold-400/50 scale-125' 
                        : 'border-white/80 group-hover:border-white'
                    }`}
                    style={{ backgroundColor: pin.color || '#f5c542' }}
                  >
                    {renderPinIcon(pin.icon, 'w-4 h-4')}
                  </div>

                  {/* Sub-map indicator badge */}
                  {pin.subMapId && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-400 text-oros-950 text-[9px] flex items-center justify-center font-bold shadow">
                      ▼
                    </span>
                  )}

                  {/* Floating Hover Tooltip */}
                  {!isDraggingThisPin && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="bg-oros-950/95 border border-oros-700 px-3 py-1.5 rounded-xl shadow-2xl text-center whitespace-nowrap">
                        <div className="text-xs font-serif font-bold text-slate-100">{pin.title}</div>
                        {pin.description && (
                          <div className="text-[10px] text-oros-400 max-w-xs truncate">{pin.description}</div>
                        )}
                        {pin.subMapId && (
                          <div className="text-[9px] text-teal-400 font-mono mt-0.5 flex items-center gap-1 justify-center">
                            <CornerDownRight className="w-2.5 h-2.5" />
                            <span>Nested Map Available</span>
                          </div>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-oros-950 border-r border-b border-oros-700 rotate-45 -mt-1"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-oros-500">
            No maps registered in world vault.
          </div>
        )}

        {/* DRAWING MODE HELPER BANNER (Placed right above the bottom dock) */}
        {activeTool === 'territory' && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-oros-900/95 border border-gold-500/40 text-xs shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-gold-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
                <span>Territory Tool ({drawingPoints.length} points)</span>
              </div>
              <span className="text-oros-400 text-[11px] hidden sm:inline">
                Click map to add points • Hover start to close • Esc to cancel
              </span>
              {drawingPoints.length >= 3 && (
                <button
                  onClick={handleFinishPolygon}
                  className="px-3 py-1 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs transition-colors shadow"
                >
                  Close & Save
                </button>
              )}
              <button
                onClick={handleCancelDrawing}
                className="p-1 rounded text-oros-400 hover:text-rose-400 hover:bg-oros-800"
                title="Cancel Drawing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PIN PLACEMENT HELPER BANNER */}
        {activeTool === 'pin' && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-oros-900/95 border border-amber-500/40 text-xs shadow-2xl backdrop-blur-md text-amber-300">
              <PinIcon className="w-4 h-4 animate-bounce text-amber-400" />
              <span>Click anywhere on the map to place a landmark pin</span>
              <button
                onClick={() => setActiveTool('pan')}
                className="p-1 rounded text-oros-400 hover:text-slate-200 ml-1"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* FLOATING BOTTOM TOOLBAR / PILL DOCK (Matching Whiteboard Canvas) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 select-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-oros-950/90 backdrop-blur-md border border-oros-700/60 shadow-2xl">
            {/* 1. Pan / Select Tool */}
            <button
              onClick={() => {
                setActiveTool('pan')
                setDrawingPoints([])
              }}
              title="Pan & Select (H or V)"
              className={`p-2 rounded-full transition-all ${
                activeTool === 'pan'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-400/40 shadow-sm'
                  : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800/60'
              }`}
            >
              <Hand className="w-4 h-4" />
            </button>

            {/* 2. Draw Territory Polygon Tool */}
            <button
              onClick={() => {
                setActiveTool('territory')
                setSelectedPin(null)
                setSelectedRegion(null)
              }}
              title="Draw Territory Polygon (T)"
              className={`p-2 rounded-full relative transition-all ${
                activeTool === 'territory'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-400/40 shadow-sm'
                  : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800/60'
              }`}
            >
              <Hexagon className="w-4 h-4" />
              {drawingPoints.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 text-oros-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {drawingPoints.length}
                </span>
              )}
            </button>

            {/* 3. Drop Landmark Pin Tool */}
            <button
              onClick={() => {
                setActiveTool('pin')
                setDrawingPoints([])
                setSelectedPin(null)
                setSelectedRegion(null)
              }}
              title="Drop Landmark Pin (P)"
              className={`p-2 rounded-full transition-all ${
                activeTool === 'pin'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40 shadow-sm'
                  : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800/60'
              }`}
            >
              <PinIcon className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-oros-800 mx-1" />

            {/* 4. Snapping Toggle */}
            <button
              onClick={() => {
                setSnappingEnabled(!snappingEnabled)
                addToast(`Snapping ${!snappingEnabled ? 'Enabled' : 'Disabled'}`, 'info')
              }}
              title={snappingEnabled ? 'Snapping is ON (Click to disable)' : 'Snapping is OFF (Click to enable)'}
              className={`p-2 rounded-full transition-all ${
                snappingEnabled
                  ? 'text-cyan-400 hover:bg-cyan-950/40'
                  : 'text-oros-600 hover:text-oros-400 hover:bg-oros-800/60'
              }`}
            >
              <Magnet className="w-4 h-4" />
            </button>

            {/* 5. Territories Layer Toggle */}
            <button
              onClick={() => setShowTerritories(!showTerritories)}
              title={showTerritories ? 'Hide Territories Layer' : 'Show Territories Layer'}
              className={`p-2 rounded-full transition-all ${
                showTerritories
                  ? 'text-emerald-400 hover:bg-emerald-950/40'
                  : 'text-oros-600 line-through hover:text-oros-400 hover:bg-oros-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* 6. Pins Layer Toggle */}
            <button
              onClick={() => setShowPins(!showPins)}
              title={showPins ? 'Hide Landmark Pins' : 'Show Landmark Pins'}
              className={`p-2 rounded-full transition-all ${
                showPins
                  ? 'text-amber-400 hover:bg-amber-950/40'
                  : 'text-oros-600 line-through hover:text-oros-400 hover:bg-oros-800/60'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-oros-800 mx-1" />

            {/* 7. Zoom Controls */}
            <button
              onClick={() => setZoom((z) => Math.max(0.35, Number((z - 0.2).toFixed(2))))}
              title="Zoom Out"
              className="p-1.5 rounded-full text-oros-400 hover:text-slate-100 hover:bg-oros-800/60"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono text-oros-300 px-1 min-w-[38px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.2).toFixed(2))))}
              title="Zoom In"
              className="p-1.5 rounded-full text-oros-400 hover:text-slate-100 hover:bg-oros-800/60"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              title="Reset View"
              className="p-1.5 rounded-full text-oros-400 hover:text-slate-100 hover:bg-oros-800/60 border-l border-oros-800 pl-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SELECTED PIN DETAILS DRAWER */}
      {selectedPin && (
        <div className="absolute right-4 top-16 w-84 bg-oros-900/95 border border-oros-700/80 rounded-2xl shadow-2xl p-5 z-30 backdrop-blur-md animate-in slide-in-from-right-4 duration-150">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-oros-950 font-bold shadow border-2 border-white/80"
                style={{ backgroundColor: selectedPin.color || '#f5c542' }}
              >
                {renderPinIcon(selectedPin.icon, 'w-4 h-4')}
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-gold-400 font-semibold tracking-wider">
                  Landmark Pin
                </span>
                <h4 className="font-serif font-bold text-base text-slate-100 leading-snug">{selectedPin.title}</h4>
              </div>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-oros-400 hover:text-slate-200 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {selectedPin.description && (
            <p className="text-xs text-oros-300 mb-4 leading-relaxed">{selectedPin.description}</p>
          )}

          {/* Sub-map Drill Down Action */}
          {selectedPin.subMapId && (
            <div className="mb-4 p-3 rounded-xl bg-teal-950/60 border border-teal-800/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-teal-200">Nested Child Map</div>
                <div className="text-[10px] text-teal-400">Zoom into district or floorplan</div>
              </div>
              <button
                onClick={() => {
                  setSelectedMapId(selectedPin.subMapId!)
                  setSelectedPin(null)
                }}
                className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-oros-950 text-xs font-bold flex items-center gap-1 shadow"
              >
                <span>Enter Map</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Connected Lore Card */}
          <div className="mb-4">
            <span className="text-[10px] text-oros-400 uppercase font-mono mb-1.5 block">Connected Lore Card:</span>
            {selectedPinEntity ? (
              <div className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 flex items-center justify-between">
                <div className="truncate mr-2">
                  <div className="text-xs font-semibold text-slate-200 truncate">{selectedPinEntity.title}</div>
                  <div className="text-[10px] text-gold-400 uppercase font-mono">{selectedPinEntity.type}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEntityId(selectedPinEntity.id)
                    openTab({
                      title: selectedPinEntity.title,
                      type: 'wiki',
                      targetId: selectedPinEntity.id
                    })
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-oros-950/40 border border-dashed border-oros-800 flex items-center justify-between">
                <span className="text-xs text-oros-500 italic">No card linked</span>
                <button
                  onClick={() => {
                    const newEntity = createEntity('location', selectedPin.title)
                    if (currentMap) {
                      updatePinOnMap(currentMap.id, selectedPin.id, { entityId: newEntity.id })
                    }
                    setSelectedPin({ ...selectedPin, entityId: newEntity.id })
                    addToast(`Created & Linked Location Card: "${newEntity.title}"`, 'success')
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 text-gold-400 text-[11px] font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Card</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-oros-800">
            <span className="text-[10px] font-mono text-oros-500">
              Pos: {selectedPin.x}%, {selectedPin.y}%
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingPinId(selectedPin.id)
                  setPinForm({
                    x: selectedPin.x,
                    y: selectedPin.y,
                    title: selectedPin.title,
                    description: selectedPin.description || '',
                    icon: selectedPin.icon || 'Compass',
                    color: selectedPin.color || '#f5c542',
                    entityId: selectedPin.entityId || '',
                    subMapId: selectedPin.subMapId || ''
                  })
                  setIsPinModalOpen(true)
                }}
                className="p-1.5 rounded-lg bg-oros-800 hover:bg-oros-700 text-oros-300 hover:text-slate-100 transition-colors"
                title="Edit Landmark"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (currentMap) removePinFromMap(currentMap.id, selectedPin.id)
                  setSelectedPin(null)
                  addToast('Removed landmark pin', 'info')
                }}
                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                title="Delete Pin"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELECTED TERRITORY DETAILS DRAWER */}
      {selectedRegion && (
        <div className="absolute right-4 top-16 w-84 bg-oros-900/95 border border-oros-700/80 rounded-2xl shadow-2xl p-5 z-30 backdrop-blur-md animate-in slide-in-from-right-4 duration-150">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-6 h-6 rounded-lg shadow border border-white/40"
                style={{ backgroundColor: selectedRegion.color }}
              />
              <div>
                <span className="text-[10px] uppercase font-mono text-gold-400 font-semibold tracking-wider">
                  Territory
                </span>
                <h4 className="font-serif font-bold text-base text-slate-100 leading-snug">{selectedRegion.name}</h4>
              </div>
            </div>
            <button
              onClick={() => setSelectedRegion(null)}
              className="text-oros-400 hover:text-slate-200 text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="text-xs text-oros-300 mb-4 flex items-center gap-3">
            <span>Vertices: {selectedRegion.points.length}</span>
            <span>•</span>
            <span>Opacity: {Math.round(selectedRegion.fillOpacity * 100)}%</span>
          </div>

          {/* Connected Lore Card */}
          <div className="mb-4">
            <span className="text-[10px] text-oros-400 uppercase font-mono mb-1.5 block">Connected Lore Card:</span>
            {selectedRegionEntity ? (
              <div className="p-3 rounded-xl bg-oros-950/80 border border-oros-800 flex items-center justify-between">
                <div className="truncate mr-2">
                  <div className="text-xs font-semibold text-slate-200 truncate">{selectedRegionEntity.title}</div>
                  <div className="text-[10px] text-gold-400 uppercase font-mono">{selectedRegionEntity.type}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEntityId(selectedRegionEntity.id)
                    openTab({
                      title: selectedRegionEntity.title,
                      type: 'wiki',
                      targetId: selectedRegionEntity.id
                    })
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-oros-950/40 border border-dashed border-oros-800 flex items-center justify-between">
                <span className="text-xs text-oros-500 italic">No card linked</span>
                <button
                  onClick={() => {
                    const newEntity = createEntity('location', selectedRegion.name)
                    if (currentMap) {
                      updateRegionOnMap(currentMap.id, selectedRegion.id, { entityId: newEntity.id })
                    }
                    setSelectedRegion({ ...selectedRegion, entityId: newEntity.id })
                    addToast(`Created & Linked Location Card: "${newEntity.title}"`, 'success')
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 text-gold-400 text-[11px] font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Card</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-oros-800">
            <button
              onClick={() => {
                setEditingRegionId(selectedRegion.id)
                setRegionForm({
                  name: selectedRegion.name,
                  color: selectedRegion.color,
                  fillOpacity: selectedRegion.fillOpacity,
                  entityId: selectedRegion.entityId || ''
                })
                setIsRegionModalOpen(true)
              }}
              className="p-1.5 rounded-lg bg-oros-800 hover:bg-oros-700 text-oros-300 hover:text-slate-100 transition-colors"
              title="Edit Territory"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (currentMap) removeRegionFromMap(currentMap.id, selectedRegion.id)
                setSelectedRegion(null)
                addToast('Removed territory region', 'info')
              }}
              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
              title="Delete Territory"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TERRITORY POLYGON CREATION / EDIT MODAL */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700/80 rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-1">
              {editingRegionId ? 'Edit Territory' : 'Save Territory Region'}
            </h3>
            <p className="text-xs text-oros-300 mb-4">
              {editingRegionId 
                ? 'Update boundary properties and card connections' 
                : `Polygon closed with ${drawingPoints.length} vertices on ${currentMap?.name}`}
            </p>

            <form onSubmit={handleSaveRegion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Territory Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={regionForm.name}
                  onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                  placeholder="e.g. Kingdom of the Sunken Reaches"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Color Palette Picker */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1.5">Territory Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setRegionForm({ ...regionForm, color: c.hex })}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                        regionForm.color === c.hex 
                          ? 'border-white scale-110 shadow-lg' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-oros-400">Custom Hex:</span>
                  <input
                    type="color"
                    value={regionForm.color}
                    onChange={(e) => setRegionForm({ ...regionForm, color: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={regionForm.color}
                    onChange={(e) => setRegionForm({ ...regionForm, color: e.target.value })}
                    className="w-24 bg-oros-950 border border-oros-700 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-oros-300">Fill Opacity</label>
                  <span className="text-xs font-mono text-gold-400">{Math.round(regionForm.fillOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.80"
                  step="0.05"
                  value={regionForm.fillOpacity}
                  onChange={(e) => setRegionForm({ ...regionForm, fillOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-gold-400 cursor-pointer"
                />
              </div>

              {/* Card Linkage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-oros-300">Link to Codex Card</label>
                  <button
                    type="button"
                    onClick={handleCreateLocationCardForRegion}
                    className="text-[11px] text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Location Card</span>
                  </button>
                </div>
                <select
                  value={regionForm.entityId}
                  onChange={(e) => setRegionForm({ ...regionForm, entityId: e.target.value })}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                >
                  <option value="">No entity linked</option>
                  {worldEntities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.title} ({ent.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setIsRegionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md transition-colors"
                >
                  {editingRegionId ? 'Save Changes' : 'Save Territory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN CREATION / EDIT MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700/80 rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-1">
              {editingPinId ? 'Edit Landmark Pin' : 'Place Cartographic Landmark'}
            </h3>
            <p className="text-xs text-oros-300 mb-4">
              Coordinates: {pinForm.x}%, {pinForm.y}% on {currentMap?.name}
            </p>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Landmark Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={pinForm.title}
                  onChange={(e) => setPinForm({ ...pinForm, title: e.target.value })}
                  placeholder="e.g. Ruins of the Sunken Bastion"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Description / Lore Notes</label>
                <textarea
                  rows={2}
                  value={pinForm.description}
                  onChange={(e) => setPinForm({ ...pinForm, description: e.target.value })}
                  placeholder="Brief notes or history of this location..."
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Icon Selection Grid */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1.5">Pin Icon</label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-oros-950 rounded-xl border border-oros-800">
                  {PIN_ICONS.map((item) => {
                    const IconComp = item.icon
                    const isSelected = pinForm.icon === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPinForm({ ...pinForm, icon: item.id })}
                        title={item.label}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-gold-500 text-oros-950 font-bold shadow-md'
                            : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Color Palette Picker */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1.5">Pin Color</label>
                <div className="flex flex-wrap gap-2">
                  {PALETTE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setPinForm({ ...pinForm, color: c.hex })}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                        pinForm.color === c.hex 
                          ? 'border-white scale-110 shadow-lg' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Card Linkage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-oros-300">Link to Codex Card</label>
                  <button
                    type="button"
                    onClick={handleCreateLocationCardForPin}
                    className="text-[11px] text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Location Card</span>
                  </button>
                </div>
                <select
                  value={pinForm.entityId}
                  onChange={(e) => setPinForm({ ...pinForm, entityId: e.target.value })}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                >
                  <option value="">No entity linked</option>
                  {worldEntities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.title} ({ent.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-map Drilldown */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">
                  Connect Sub-Map for Drilldown (Optional)
                </label>
                <select
                  value={pinForm.subMapId}
                  onChange={(e) => setPinForm({ ...pinForm, subMapId: e.target.value })}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                >
                  <option value="">No nested sub-map</option>
                  {worldMaps.filter((m) => m.id !== currentMap?.id).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md transition-colors"
                >
                  {editingPinId ? 'Save Changes' : 'Drop Landmark Pin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MAP MODAL */}
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

              <div className="flex justify-end gap-2 pt-2 border-t border-oros-800">
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
