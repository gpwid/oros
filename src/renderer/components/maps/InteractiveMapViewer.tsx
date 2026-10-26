import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { MapPin, MapRegion, LoreEntity, WorldMap } from '@shared/types'
import { 
  Map as MapIcon, Plus, ZoomIn, ZoomOut, RotateCcw, Castle, 
  Trees, Skull, Compass, Shield, ExternalLink, Trash2, Eye, 
  Layers, Upload, ChevronRight, CornerDownRight, Hand,
  Hexagon, Magnet, Crown, Building2, Landmark,
  Sword, Tent, Anchor, Flame, Gem, Key, X, Check, Edit3, ImageOff,
  MapPin as PinIcon, Sparkles, Ruler, Grid as GridIcon, Hash, Sliders, LayoutGrid
} from 'lucide-react'
import { ExportDropdown, ExportOption } from '../common/ExportDropdown'
import { exportDomToImage, exportMapToJson } from '../../utils/exportUtils'

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

type ActiveTool = 'pan' | 'territory' | 'pin' | 'ruler'

export const InteractiveMapViewer: React.FC = () => {
  const { 
    worlds, maps, entities, activeWorldId, selectedMapId, setSelectedMapId, 
    addPinToMap, updatePinOnMap, removePinFromMap,
    addRegionToMap, updateRegionOnMap, removeRegionFromMap,
    createEntity, setSelectedEntityId, setActiveTab, openTab,
    createMap, updateMap, deleteMap 
  } = useWorldStore()

  const { addToast } = useToastStore()

  // Tool state
  const [activeTool, setActiveTool] = useState<ActiveTool>('pan')
  const [snappingEnabled, setSnappingEnabled] = useState(true)
  const isAltPressedRef = useRef(false)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const [showTerritories, setShowTerritories] = useState(true)
  const [showPins, setShowPins] = useState(true)

  // Tactical Cartographic Grid state
  const [showGrid, setShowGrid] = useState(false)
  const [gridType, setGridType] = useState<'square' | 'hex'>('square')
  const [gridSize, setGridSize] = useState(64)
  const [gridOpacity, setGridOpacity] = useState(0.35)
  const [showGridCoordinates, setShowGridCoordinates] = useState(false)
  const [showGridMenu, setShowGridMenu] = useState(false)

  // Project Maps Gallery Modal state
  const [showMapGalleryModal, setShowMapGalleryModal] = useState(false)

  // Distance ruler state
  const [rulerPoints, setRulerPoints] = useState<[number, number][]>([])
  const [rulerHoverPoint, setRulerHoverPoint] = useState<[number, number] | null>(null)
  const [isRulerFinished, setIsRulerFinished] = useState(false)

  // Map Scale Calibration Modal state
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false)
  const [scaleForm, setScaleForm] = useState({
    distance: 50,
    unit: 'Leagues',
    barPixels: 140
  })

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
  const [newMapPreviewError, setNewMapPreviewError] = useState(false)

  // Edit map modal
  const [showEditMapModal, setShowEditMapModal] = useState(false)
  const [editMapId, setEditMapId] = useState<string | null>(null)
  const [editMapName, setEditMapName] = useState('')
  const [editMapDescription, setEditMapDescription] = useState('')
  const [editMapUrl, setEditMapUrl] = useState('')
  const [editMapScaleDistance, setEditMapScaleDistance] = useState(50)
  const [editMapScaleUnit, setEditMapScaleUnit] = useState('Leagues')
  const [editMapPreviewError, setEditMapPreviewError] = useState(false)
  const [mapImgError, setMapImgError] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapElementRef = useRef<HTMLDivElement>(null)

  const worldMaps = activeWorldId ? maps[activeWorldId] || [] : []
  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const currentMap = worldMaps.find((m) => m.id === selectedMapId) || worldMaps[0]
  const activeWorld = (worlds || []).find((w) => w.id === activeWorldId)

  useEffect(() => {
    setMapImgError(false)
  }, [currentMap?.id, currentMap?.imageUrl])

  const handleExportMapImage = async (format: 'png' | 'svg') => {
    if (!mapElementRef.current || !currentMap) return
    const safeName = (currentMap.name || 'map').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    try {
      await exportDomToImage(mapElementRef.current, format, {
        filename: `${safeName}.${format}`,
        pixelRatio: 2,
        width: 1280,
        height: 800,
        style: {
          transform: 'none',
          left: '0',
          top: '0',
          margin: '0',
          position: 'relative'
        }
      })
      addToast(`Map exported as ${format.toUpperCase()}`, 'success')
    } catch (err) {
      console.error('Failed to export map:', err)
      addToast('Failed to export map image', 'error')
    }
  }

  const handleExportMapJson = async () => {
    if (!currentMap) return
    try {
      const ok = await exportMapToJson(currentMap, activeWorld?.name)
      if (ok) addToast('Map data exported as JSON', 'success')
    } catch (err) {
      console.error('Failed to export map data:', err)
      addToast('Failed to export map JSON', 'error')
    }
  }

  const mapExportOptions: ExportOption[] = [
    {
      id: 'export-png',
      label: 'Export Map (2x PNG)',
      badge: 'PNG',
      onClick: () => handleExportMapImage('png')
    },
    {
      id: 'export-svg',
      label: 'Export Map (Vector SVG)',
      badge: 'SVG',
      onClick: () => handleExportMapImage('svg')
    },
    {
      id: 'export-json',
      label: 'Export Map Data (JSON)',
      badge: 'JSON',
      onClick: handleExportMapJson
    }
  ]

  // Sync scaleForm and gridConfig when active map changes
  useEffect(() => {
    if (currentMap) {
      setScaleForm({
        distance: currentMap.scaleDistance ?? 50,
        unit: currentMap.scaleUnit || 'Leagues',
        barPixels: currentMap.scaleBarPixels || 140
      })
      if (currentMap.gridConfig) {
        if (currentMap.gridConfig.enabled !== undefined) setShowGrid(currentMap.gridConfig.enabled)
        if (currentMap.gridConfig.type) setGridType(currentMap.gridConfig.type)
        if (currentMap.gridConfig.size) setGridSize(currentMap.gridConfig.size)
        if (currentMap.gridConfig.opacity !== undefined) setGridOpacity(currentMap.gridConfig.opacity)
        if (currentMap.gridConfig.showCoordinates !== undefined) setShowGridCoordinates(currentMap.gridConfig.showCoordinates)
      }
    }
  }, [currentMap?.id, currentMap?.scaleDistance, currentMap?.scaleUnit, currentMap?.scaleBarPixels])

  // Persist grid configuration updates to current map
  const handleUpdateGrid = useCallback((updates: Partial<{ enabled: boolean; type: 'square' | 'hex'; size: number; opacity: number; showCoordinates: boolean }>) => {
    if (updates.enabled !== undefined) setShowGrid(updates.enabled)
    if (updates.type !== undefined) setGridType(updates.type)
    if (updates.size !== undefined) setGridSize(updates.size)
    if (updates.opacity !== undefined) setGridOpacity(updates.opacity)
    if (updates.showCoordinates !== undefined) setShowGridCoordinates(updates.showCoordinates)

    if (currentMap) {
      const merged = {
        enabled: updates.enabled !== undefined ? updates.enabled : showGrid,
        type: updates.type !== undefined ? updates.type : gridType,
        size: updates.size !== undefined ? updates.size : gridSize,
        opacity: updates.opacity !== undefined ? updates.opacity : gridOpacity,
        showCoordinates: updates.showCoordinates !== undefined ? updates.showCoordinates : showGridCoordinates
      }
      updateMap(currentMap.id, { gridConfig: merged })
    }
  }, [currentMap, showGrid, gridType, gridSize, gridOpacity, showGridCoordinates, updateMap])

  // Distance calculation helpers based on calibrated map scale
  const getDistanceBetweenPoints = useCallback((p1: [number, number], p2: [number, number]) => {
    const scaleDist = currentMap?.scaleDistance ?? 50
    const scaleBarPx = currentMap?.scaleBarPixels || 140
    const pxWidth = 1280
    const pxHeight = 800

    const dx = ((p2[0] - p1[0]) / 100) * pxWidth
    const dy = ((p2[1] - p1[1]) / 100) * pxHeight
    const pixelDistance = Math.hypot(dx, dy)

    const units = (pixelDistance / scaleBarPx) * scaleDist
    return {
      pixelDistance,
      units: Number(units.toFixed(1))
    }
  }, [currentMap?.scaleDistance, currentMap?.scaleBarPixels])

  const getTotalRulerDistance = useCallback((points: [number, number][], hover: [number, number] | null) => {
    const allPts = hover && !isRulerFinished ? [...points, hover] : points
    if (allPts.length < 2) return 0
    let total = 0
    for (let i = 1; i < allPts.length; i++) {
      total += getDistanceBetweenPoints(allPts[i - 1], allPts[i]).units
    }
    return Number(total.toFixed(1))
  }, [getDistanceBetweenPoints, isRulerFinished])

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'Alt') {
        isAltPressedRef.current = true
        setIsAltPressed(true)
      } else if (e.code === 'Space') {
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
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'm' || e.key === 'M') {
        setActiveTool('ruler')
        setDrawingPoints([])
        setSelectedPin(null)
        setSelectedRegion(null)
      } else if (e.key === 'Escape') {
        if (rulerPoints.length > 0) {
          setRulerPoints([])
          setRulerHoverPoint(null)
          setIsRulerFinished(false)
          addToast('Cleared distance measurement', 'info')
        } else if (drawingPoints.length > 0) {
          setDrawingPoints([])
          addToast('Cancelled territory drawing', 'info')
        } else {
          setActiveTool('pan')
          setSelectedPin(null)
          setSelectedRegion(null)
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Del') {
        if (activeTool === 'ruler' && rulerPoints.length > 0) {
          setRulerPoints((pts) => pts.slice(0, pts.length - 1))
          setIsRulerFinished(false)
        } else if (drawingPoints.length > 0) {
          setDrawingPoints((pts) => pts.slice(0, pts.length - 1))
        } else if (selectedPin && currentMap) {
          e.preventDefault()
          removePinFromMap(currentMap.id, selectedPin.id)
          setSelectedPin(null)
          addToast('Map pin deleted', 'info')
        } else if (selectedRegion && currentMap) {
          e.preventDefault()
          removeRegionFromMap(currentMap.id, selectedRegion.id)
          setSelectedRegion(null)
          addToast('Map region deleted', 'info')
        }
      } else if (e.key === 'Enter') {
        if (activeTool === 'ruler' && rulerPoints.length >= 2) {
          setIsRulerFinished(true)
          setRulerHoverPoint(null)
        } else if (drawingPoints.length >= 3) {
          handleFinishPolygon()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        isAltPressedRef.current = false
        setIsAltPressed(false)
      } else if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    const handleBlur = () => {
      isAltPressedRef.current = false
      setIsAltPressed(false)
    }

    const handlePointerMove = (e: MouseEvent | PointerEvent) => {
      if (e.altKey !== isAltPressedRef.current) {
        isAltPressedRef.current = e.altKey
        setIsAltPressed(e.altKey)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('pointermove', handlePointerMove)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [drawingPoints, rulerPoints, activeTool, isRulerFinished, selectedPin, selectedRegion, currentMap, removePinFromMap, removeRegionFromMap, addToast])

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87
    setZoom((prevZoom) => {
      const next = prevZoom * zoomFactor
      return Math.min(3.5, Math.max(0.35, Number(next.toFixed(2))))
    })
  }

  // Convert client coordinates to map percentage [0-100] (Alt key bypasses snapping)
  const getMapCoordinates = useCallback((clientX: number, clientY: number, bypassSnap?: boolean): { x: number; y: number } | null => {
    if (!mapElementRef.current) return null
    const rect = mapElementRef.current.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null

    let rawX = ((clientX - rect.left) / rect.width) * 100
    let rawY = ((clientY - rect.top) / rect.height) * 100

    rawX = Math.max(0, Math.min(100, rawX))
    rawY = Math.max(0, Math.min(100, rawY))

    const shouldSnap = snappingEnabled && !isAltPressedRef.current && !bypassSnap

    if (shouldSnap) {
      if (showGrid) {
        const [gx, gy] = snapCoordToGrid(rawX, rawY, gridSize, true)
        rawX = gx
        rawY = gy
      } else {
        // Snap to nearest 0.5% grid
        rawX = Math.round(rawX * 2) / 2
        rawY = Math.round(rawY * 2) / 2
      }
    }

    return {
      x: Number(rawX.toFixed(2)),
      y: Number(rawY.toFixed(2))
    }
  }, [snappingEnabled, showGrid, gridSize])

  // Check if cursor is near the first vertex for closing snap (Alt key bypasses)
  const checkNearStart = (coords: { x: number; y: number }): boolean => {
    if (isAltPressedRef.current) return false
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

    // Handle pin dragging (Alt key bypasses snapping)
    if (draggingPinId && currentMap) {
      hasDraggedPin.current = true
      const coords = getMapCoordinates(e.clientX, e.clientY, e.altKey)
      if (coords) {
        updatePinOnMap(currentMap.id, draggingPinId, { x: coords.x, y: coords.y })
      }
      return
    }

    // Handle ruler drawing hover
    if (activeTool === 'ruler') {
      const coords = getMapCoordinates(e.clientX, e.clientY, e.altKey)
      if (coords && !isRulerFinished) {
        setRulerHoverPoint([coords.x, coords.y])
      }
    }

    // Handle territory drawing hover
    if (activeTool === 'territory') {
      const coords = getMapCoordinates(e.clientX, e.clientY, e.altKey)
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

    // Ruler tool click
    if (activeTool === 'ruler') {
      const coords = getMapCoordinates(e.clientX, e.clientY, e.altKey)
      if (!coords) return
      if (isRulerFinished) {
        setRulerPoints([[coords.x, coords.y]])
        setIsRulerFinished(false)
      } else {
        setRulerPoints((pts) => [...pts, [coords.x, coords.y]])
      }
      return
    }

    // Territory tool click
    if (activeTool === 'territory') {
      const coords = getMapCoordinates(e.clientX, e.clientY, e.altKey)
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
      const coords = getMapCoordinates(e.clientX, e.clientY, e.altKey)
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

  // Double click map to close territory or finish ruler
  const handleMapDoubleClick = (e: React.MouseEvent) => {
    if (activeTool === 'ruler' && rulerPoints.length >= 2) {
      e.stopPropagation()
      setIsRulerFinished(true)
      setRulerHoverPoint(null)
    } else if (activeTool === 'territory' && drawingPoints.length >= 3) {
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

  // Pointy-topped hex pattern SVG path generator
  const getHexPatternPath = (size: number) => {
    const r = size / 2
    const w = Math.round(r * Math.sqrt(3))
    return `M ${w / 2} 0 L ${w} ${r * 0.5} L ${w} ${r * 1.5} L ${w / 2} ${r * 2} L 0 ${r * 1.5} L 0 ${r * 0.5} Z M 0 ${r * 1.5} L 0 ${r * 2.5} L ${w / 2} ${r * 3} L ${w} ${r * 2.5} L ${w} ${r * 1.5} M ${w / 2} ${r * 2} L ${w / 2} ${r * 3}`
  }

  // Snap percentage coordinates [0-100] to current grid spacing
  const snapCoordToGrid = (xPct: number, yPct: number, size: number, enabled: boolean): [number, number] => {
    if (!enabled) return [xPct, yPct]
    const pxX = (xPct / 100) * 1280
    const pxY = (yPct / 100) * 800
    const snappedX = Math.round(pxX / size) * size
    const snappedY = Math.round(pxY / size) * size
    return [
      Math.max(0, Math.min(100, Number(((snappedX / 1280) * 100).toFixed(2)))),
      Math.max(0, Math.min(100, Number(((snappedY / 800) * 100).toFixed(2))))
    ]
  }

  // Alphanumeric coordinate markers for the grid overlay
  const renderGridCoordinates = (size: number, width: number, height: number, type: 'square' | 'hex') => {
    if (type !== 'square') return null
    const cols = Math.floor(width / size)
    const rows = Math.floor(height / size)
    const labels = []

    for (let c = 0; c < cols; c++) {
      const colLabel = String.fromCharCode(65 + (c % 26)) + (c >= 26 ? Math.floor(c / 26) : '')
      labels.push(
        <text
          key={`col-${c}`}
          x={c * size + size / 2}
          y={14}
          textAnchor="middle"
          className="fill-white/70 font-mono text-[9px] font-bold select-none drop-shadow"
        >
          {colLabel}
        </text>
      )
    }

    for (let r = 0; r < rows; r++) {
      labels.push(
        <text
          key={`row-${r}`}
          x={12}
          y={r * size + size / 2 + 3}
          textAnchor="middle"
          className="fill-white/70 font-mono text-[9px] font-bold select-none drop-shadow"
        >
          {r + 1}
        </text>
      )
    }
    return labels
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

  // Map Artwork Importer with Universal Desktop + Web Support
  const handleImportFileToTarget = (onDone: (url: string) => void) => {
    if (window.oros) {
      window.oros.importAsset().then((assetUrl) => {
        if (assetUrl) {
          onDone(assetUrl)
          addToast('Map artwork imported into vault', 'success')
        }
      })
      return
    }
    // Browser fallback
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onDone(reader.result)
            addToast(`Imported ${file.name}`, 'success')
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleImportMapArtwork = () => {
    handleImportFileToTarget((url) => {
      setNewMapUrl(url)
      setNewMapPreviewError(false)
    })
  }

  // Create Map
  const handleCreateMap = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMapName.trim()) return
    const url = newMapUrl.trim() || 'https://images.metmuseum.org/CRDImages/dp/web-large/DP802619.jpg'
    const created = createMap(newMapName.trim(), url)
    setSelectedMapId(created.id)
    setShowNewMapModal(false)
    setNewMapName('')
    setNewMapUrl('')
    setNewMapPreviewError(false)
    addToast(`Created map: ${newMapName}`, 'success')
  }

  // Edit Map Handlers
  const handleOpenEditMap = (mapItem?: WorldMap) => {
    const target = mapItem || currentMap
    if (!target) return
    setEditMapId(target.id)
    setEditMapName(target.name || '')
    setEditMapDescription(target.description || '')
    setEditMapUrl(target.imageUrl || '')
    setEditMapScaleDistance(target.scaleDistance ?? 50)
    setEditMapScaleUnit(target.scaleUnit || 'Leagues')
    setEditMapPreviewError(false)
    setShowEditMapModal(true)
  }

  const handleSaveEditMap = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editMapId || !editMapName.trim()) return
    updateMap(editMapId, {
      name: editMapName.trim(),
      description: editMapDescription.trim(),
      imageUrl: editMapUrl.trim(),
      scaleDistance: editMapScaleDistance,
      scaleUnit: editMapScaleUnit
    })
    setMapImgError(false)
    setShowEditMapModal(false)
    addToast(`Updated map: ${editMapName}`, 'success')
  }

  const handleDeleteMap = (mapId: string) => {
    if (worldMaps.length <= 1) {
      addToast('Cannot delete the only map in this project', 'warning')
      return
    }
    const mapToDelete = worldMaps.find((m) => m.id === mapId)
    deleteMap(mapId)
    if (selectedMapId === mapId) {
      const nextMap = worldMaps.find((m) => m.id !== mapId)
      if (nextMap) setSelectedMapId(nextMap.id)
    }
    setShowEditMapModal(false)
    addToast(`Deleted map: ${mapToDelete?.name || ''}`, 'info')
  }

  const handleRestoreDefaultMapImage = () => {
    if (!currentMap) return
    const defaultUrl = 'https://images.metmuseum.org/CRDImages/dp/web-large/DP802619.jpg'
    updateMap(currentMap.id, { imageUrl: defaultUrl })
    setMapImgError(false)
    addToast('Restored standard historical nautical chart', 'success')
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
      <div className="h-10 bg-oros-950 border-b border-oros-800 px-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5 text-oros-400" />
            <select
              value={currentMap?.id || ''}
              onChange={(e) => {
                setSelectedMapId(e.target.value)
                setSelectedPin(null)
                setSelectedRegion(null)
                setDrawingPoints([])
              }}
              className="bg-oros-900 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 font-medium focus:outline-none focus:border-oros-500 font-sans"
            >
              {worldMaps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {currentMap && (
            <button
              onClick={() => handleOpenEditMap(currentMap)}
              className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Edit map name, image artwork, description or scale"
            >
              <Edit3 className="w-3 h-3 text-oros-400" />
              <span>Edit Map</span>
            </button>
          )}

          <button
            onClick={() => setShowNewMapModal(true)}
            className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-oros-400" />
            <span>New Map</span>
          </button>

          <button
            onClick={() => setShowMapGalleryModal(true)}
            className="p-1 px-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Browse and manage all project maps in a grid view"
          >
            <LayoutGrid className="w-3 h-3 text-accent" />
            <span>Project Maps</span>
          </button>

          {currentMap && (
            <div className="text-[11px] text-oros-500 font-mono hidden sm:flex items-center gap-2 border-l border-oros-800 pl-2.5">
              <span>{currentMap.regions?.length || 0} Territories</span>
              <span>•</span>
              <span>{currentMap.pins?.length || 0} Landmarks</span>
            </div>
          )}
        </div>

        {/* Map Scale Legend Indicator & Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setScaleForm({
                distance: currentMap?.scaleDistance ?? 50,
                unit: currentMap?.scaleUnit || 'Leagues',
                barPixels: currentMap?.scaleBarPixels || 140
              })
              setIsScaleModalOpen(true)
            }}
            className="flex items-center gap-2 text-xs font-mono text-oros-300 hover:text-oros-100 bg-oros-900 hover:bg-oros-850 border border-oros-800 hover:border-oros-700 px-2 py-0.5 rounded-[2px] transition-all group cursor-pointer shadow-sm"
            title="Click to edit map scale distance and units"
          >
            <div 
              className="h-1 bg-accent rounded-sm group-hover:bg-accent-bright transition-all"
              style={{ width: `${Math.min(36, Math.max(14, ((currentMap?.scaleBarPixels || 140) / 1280) * 160))}px` }}
            />
            <span className="text-[11px] font-semibold">
              {currentMap?.scaleDistance ?? 50} {currentMap?.scaleUnit || 'Leagues'}
            </span>
            <Edit3 className="w-2.5 h-2.5 text-oros-500 group-hover:text-oros-300" />
          </button>

          {currentMap && (
            <ExportDropdown options={mapExportOptions} align="right" />
          )}
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
            : activeTool === 'ruler'
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
        style={{ backgroundColor: '#090a0d' }}
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
            {/* Base Map Image or Missing Artwork Fallback */}
            {mapImgError || !currentMap.imageUrl ? (
              <div className="w-full h-full rounded-[3px] border-2 border-dashed border-oros-750/80 bg-oros-950/95 flex flex-col items-center justify-center p-8 text-center relative select-none">
                <div className="w-16 h-16 rounded-2xl bg-oros-900 border border-oros-750 flex items-center justify-center text-oros-400 mb-4 shadow-xl">
                  <ImageOff className="w-8 h-8 text-amber-400/80" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-oros-100 mb-1">
                  Map Image Missing or Deleted
                </h3>
                <p className="text-xs text-oros-400 max-w-md font-sans mb-5 leading-relaxed">
                  The image file or URL for <strong className="text-oros-200">{currentMap.name}</strong> could not be loaded. You can select a new image file from your computer or restore the default chart.
                </p>
                <div className="flex items-center gap-3 pointer-events-auto">
                  <button
                    onClick={() => handleOpenEditMap(currentMap)}
                    className="px-4 py-2 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose New Map Image</span>
                  </button>
                  <button
                    onClick={handleRestoreDefaultMapImage}
                    className="px-3.5 py-2 rounded-[3px] bg-oros-900 hover:bg-oros-850 text-oros-300 hover:text-oros-100 border border-oros-750 text-xs font-medium transition-colors"
                  >
                    <span>Restore Default Chart</span>
                  </button>
                </div>
              </div>
            ) : (
              <img
                key={currentMap.id + '-' + (currentMap.imageUrl || '').slice(0, 60)}
                src={currentMap.imageUrl}
                alt={currentMap.name}
                onLoad={() => setMapImgError(false)}
                onError={() => setMapImgError(true)}
                className="w-full h-full object-cover rounded-[3px] border border-oros-750 pointer-events-none select-none"
              />
            )}

            {/* SVG OVERLAY: Territories & In-Progress Polygon */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <pattern id="tactical-square-grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                  <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                </pattern>
                {(() => {
                  const r = gridSize / 2
                  const w = Math.round(r * Math.sqrt(3))
                  const h = r * 3
                  return (
                    <pattern id="tactical-hex-grid" width={w} height={h} patternUnits="userSpaceOnUse">
                      <path d={getHexPatternPath(gridSize)} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                    </pattern>
                  )
                })()}
              </defs>

              {/* Tactical Cartographic Grid Overlay */}
              {showGrid && (
                <g className="pointer-events-none">
                  <rect
                    width="1280"
                    height="800"
                    fill={`url(#${gridType === 'square' ? 'tactical-square-grid' : 'tactical-hex-grid'})`}
                    className="text-white"
                    style={{ opacity: gridOpacity }}
                  />
                  {showGridCoordinates && renderGridCoordinates(gridSize, 1280, 800, gridType)}
                </g>
              )}

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

              {/* DISTANCE RULER SVG OVERLAY */}
              {(activeTool === 'ruler' || rulerPoints.length > 0) && (
                <g className="pointer-events-none">
                  {/* Segment lines between placed waypoints */}
                  {rulerPoints.map((pt, idx) => {
                    if (idx === 0) return null
                    const prev = rulerPoints[idx - 1]
                    const segDist = getDistanceBetweenPoints(prev, pt).units
                    const midX = (((prev[0] + pt[0]) / 2) / 100) * 1280
                    const midY = (((prev[1] + pt[1]) / 2) / 100) * 800

                    return (
                      <g key={`ruler-seg-${idx}`}>
                        {/* Soft Outer Glow Line */}
                        <line
                          x1={(prev[0] / 100) * 1280}
                          y1={(prev[1] / 100) * 800}
                          x2={(pt[0] / 100) * 1280}
                          y2={(pt[1] / 100) * 800}
                          stroke="var(--accent-color, #f5c542)"
                          strokeWidth={5}
                          strokeOpacity={0.35}
                        />
                        {/* High-Contrast Core Measurement Line */}
                        <line
                          x1={(prev[0] / 100) * 1280}
                          y1={(prev[1] / 100) * 800}
                          x2={(pt[0] / 100) * 1280}
                          y2={(pt[1] / 100) * 800}
                          stroke="var(--accent-color, #f5c542)"
                          strokeWidth={2.5}
                          strokeDasharray="6 4"
                        />
                        {/* Midpoint Distance Badge */}
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x={-34}
                            y={-10}
                            width={68}
                            height={20}
                            rx={10}
                            fill="#090a0d"
                            fillOpacity={0.92}
                            stroke="var(--accent-color, #f5c542)"
                            strokeWidth={1}
                          />
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="fill-slate-100 font-mono text-[10px] font-bold select-none"
                          >
                            {segDist} {currentMap?.scaleUnit || 'Lg'}
                          </text>
                        </g>
                      </g>
                    )
                  })}

                  {/* Active Guide Line to Mouse Cursor */}
                  {rulerHoverPoint && rulerPoints.length > 0 && !isRulerFinished && (
                    <g>
                      <line
                        x1={(rulerPoints[rulerPoints.length - 1][0] / 100) * 1280}
                        y1={(rulerPoints[rulerPoints.length - 1][1] / 100) * 800}
                        x2={(rulerHoverPoint[0] / 100) * 1280}
                        y2={(rulerHoverPoint[1] / 100) * 800}
                        stroke="var(--accent-color, #f5c542)"
                        strokeWidth={1.75}
                        strokeDasharray="4 3"
                      />
                      {/* Live Cursor Floating Distance HUD */}
                      {(() => {
                        const lastPt = rulerPoints[rulerPoints.length - 1]
                        const liveSeg = getDistanceBetweenPoints(lastPt, rulerHoverPoint).units
                        const totalWithLive = getTotalRulerDistance(rulerPoints, rulerHoverPoint)
                        const curX = (rulerHoverPoint[0] / 100) * 1280
                        const curY = (rulerHoverPoint[1] / 100) * 800

                        return (
                          <g transform={`translate(${curX + 14}, ${curY + 14})`}>
                            <rect
                              x={0}
                              y={0}
                              width={118}
                              height={34}
                              rx={4}
                              fill="#090a0d"
                              fillOpacity={0.95}
                              stroke="var(--accent-color, #f5c542)"
                              strokeWidth={1}
                            />
                            <text x={8} y={14} className="font-mono text-[10px] font-bold" style={{ fill: 'var(--accent-color, #f5c542)' }}>
                              +{liveSeg} {currentMap?.scaleUnit || 'Lg'}
                            </text>
                            <text x={8} y={26} className="fill-slate-300 font-mono text-[9px]">
                              Total: {totalWithLive} {currentMap?.scaleUnit || 'Lg'}
                            </text>
                          </g>
                        )
                      })()}
                    </g>
                  )}

                  {/* Waypoint Markers */}
                  {rulerPoints.map((pt, idx) => (
                    <g key={`ruler-node-${idx}`}>
                      <circle
                        cx={(pt[0] / 100) * 1280}
                        cy={(pt[1] / 100) * 800}
                        r={8}
                        fill="var(--accent-color, #f5c542)"
                        stroke="#090a0d"
                        strokeWidth={2}
                      />
                      <text
                        x={(pt[0] / 100) * 1280}
                        y={(pt[1] / 100) * 800}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-slate-950 font-mono text-[9px] font-bold select-none"
                      >
                        {idx + 1}
                      </text>
                    </g>
                  ))}
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-bold shadow-2xl transition-all border-2 ${
                      isSelected 
                        ? 'border-white ring-4 ring-accent/50 scale-125' 
                        : 'border-white/80 group-hover:border-white'
                    }`}
                    style={{ backgroundColor: pin.color || '#f5c542' }}
                  >
                    {renderPinIcon(pin.icon, 'w-4 h-4')}
                  </div>

                  {/* Sub-map indicator badge */}
                  {pin.subMapId && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-teal-400 text-slate-950 text-[9px] flex items-center justify-center font-bold shadow">
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
            No maps found.
          </div>
        )}

        {/* DRAWING MODE HELPER BANNER */}
        {activeTool === 'territory' && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-[3px] bg-oros-900 border border-oros-750 text-xs shadow-2xl text-oros-200">
              <div className="flex items-center gap-2 text-oros-100 font-medium font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-oros-300" />
                <span>Territory Polygon ({drawingPoints.length} vertices)</span>
              </div>
              <span className="text-oros-400 text-[11px] font-sans hidden sm:inline">
                Click map to add points • Hover start to close • Esc to cancel
              </span>
              {drawingPoints.length >= 3 && (
                <button
                  onClick={handleFinishPolygon}
                  className="btn-accent px-2.5 py-1 rounded-[2px] font-semibold text-xs transition-colors shadow-sm"
                >
                  Close & Save
                </button>
              )}
              <button
                onClick={handleCancelDrawing}
                className="p-1 rounded-[2px] text-oros-400 hover:text-rose-400 hover:bg-oros-850 transition-colors"
                title="Cancel Drawing"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* PIN PLACEMENT HELPER BANNER */}
        {activeTool === 'pin' && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[3px] bg-oros-900 border border-oros-750 text-xs shadow-2xl text-oros-200 font-sans">
              <PinIcon className="w-3.5 h-3.5 text-oros-300" />
              <span>Click map to place pin</span>
              <button
                onClick={() => setActiveTool('pan')}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-200 hover:bg-oros-850 ml-1 transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* RULER MEASUREMENT HELPER BANNER */}
        {(activeTool === 'ruler' || rulerPoints.length > 0) && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
            <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-[4px] bg-oros-900 border border-accent/40 text-xs shadow-2xl text-oros-100 font-sans">
              <div className="flex items-center gap-2 text-accent font-medium">
                <Ruler className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span className="font-semibold text-xs">
                  {rulerPoints.length === 0
                    ? 'Click map to place distance waypoints'
                    : `${getTotalRulerDistance(rulerPoints, rulerHoverPoint)} ${currentMap?.scaleUnit || 'Leagues'}`}
                </span>
              </div>

              {rulerPoints.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-oros-300 font-mono border-l border-oros-800 pl-3">
                  <span>{rulerPoints.length} {rulerPoints.length === 1 ? 'origin' : 'waypoints'}</span>
                  <span>•</span>
                  <span title="Travel time estimates">
                    ~{(getTotalRulerDistance(rulerPoints, rulerHoverPoint) / 35).toFixed(1)}d ride / ~{(getTotalRulerDistance(rulerPoints, rulerHoverPoint) / 18).toFixed(1)}d march
                  </span>
                </div>
              )}

              {rulerPoints.length >= 2 && !isRulerFinished && (
                <button
                  onClick={() => {
                    setIsRulerFinished(true)
                    setRulerHoverPoint(null)
                  }}
                  className="px-2 py-0.5 rounded-[2px] bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 text-[11px] font-medium transition-colors"
                >
                  Pin Route
                </button>
              )}

              <button
                onClick={() => {
                  setRulerPoints([])
                  setRulerHoverPoint(null)
                  setIsRulerFinished(false)
                  if (activeTool === 'ruler') setActiveTool('pan')
                }}
                className="p-1 rounded-[2px] text-oros-400 hover:text-rose-400 hover:bg-oros-850 transition-colors ml-1"
                title="Clear route"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* FLOATING BOTTOM CONSOLE DOCK */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 select-none">
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-[4px] bg-oros-900 border border-oros-750 shadow-2xl">
            {/* 1. Pan / Select Tool */}
            <button
              onClick={() => {
                setActiveTool('pan')
                setDrawingPoints([])
              }}
              title="Pan & Select (H or V)"
              className={`p-1.5 rounded-[3px] transition-colors ${
                activeTool === 'pan'
                  ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                  : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
            </button>

            {/* 2. Draw Territory Polygon Tool */}
            <button
              onClick={() => {
                setActiveTool('territory')
                setSelectedPin(null)
                setSelectedRegion(null)
              }}
              title="Draw Territory Polygon (T)"
              className={`p-1.5 rounded-[3px] relative transition-colors ${
                activeTool === 'territory'
                  ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                  : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850'
              }`}
            >
              <Hexagon className="w-3.5 h-3.5" />
              {drawingPoints.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1 rounded-[2px] bg-accent text-accent-contrast text-[9px] font-mono font-bold leading-none py-0.5 shadow">
                  {drawingPoints.length}
                </span>
              )}
            </button>

            {/* 3. Drop Pin Tool */}
            <button
              onClick={() => {
                setActiveTool('pin')
                setDrawingPoints([])
                setSelectedPin(null)
                setSelectedRegion(null)
              }}
              title="Place Pin (P)"
              className={`p-1.5 rounded-[3px] transition-colors ${
                activeTool === 'pin'
                  ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                  : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850'
              }`}
            >
              <PinIcon className="w-3.5 h-3.5" />
            </button>

            {/* 4. Distance Ruler Tool */}
            <button
              onClick={() => {
                setActiveTool('ruler')
                setDrawingPoints([])
                setSelectedPin(null)
                setSelectedRegion(null)
              }}
              title="Measure Distance & Travel Time (R or M)"
              className={`p-1.5 rounded-[3px] relative transition-colors ${
                activeTool === 'ruler'
                  ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                  : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              {rulerPoints.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1 rounded-[2px] bg-accent text-accent-contrast text-[9px] font-mono font-bold leading-none py-0.5 shadow">
                  {rulerPoints.length}
                </span>
              )}
            </button>

            <div className="w-[1px] h-4 bg-oros-800 mx-0.5" />

            {/* 5. Snapping Toggle */}
            <button
              onClick={() => {
                setSnappingEnabled(!snappingEnabled)
                addToast(`Snapping ${!snappingEnabled ? 'Enabled' : 'Disabled'}`, 'info')
              }}
              title={snappingEnabled ? 'Snapping is ON (Hold Alt while dragging or placing to bypass)' : 'Snapping is OFF (Click to enable)'}
              className={`p-1.5 rounded-[3px] transition-colors ${
                snappingEnabled
                  ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                  : 'text-oros-500 hover:text-oros-300 hover:bg-oros-850'
              }`}
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>

            {/* 6. Tactical Grid Overlay & Settings */}
            <div className="relative flex items-center">
              <button
                onClick={() => {
                  const next = !showGrid
                  handleUpdateGrid({ enabled: next })
                  addToast(`Tactical Grid ${next ? 'Enabled' : 'Disabled'}`, 'info')
                }}
                title={showGrid ? 'Hide Tactical Grid' : 'Show Tactical Grid (Square / Hex)'}
                className={`p-1.5 rounded-[3px] transition-colors ${
                  showGrid
                    ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                    : 'text-oros-500 hover:text-oros-300 hover:bg-oros-850'
                }`}
              >
                <GridIcon className="w-3.5 h-3.5" />
              </button>

              {/* Quick Grid Size Stepper on Dock when Grid is Active */}
              {showGrid && (
                <div className="ml-1 flex items-center gap-0.5 px-1 py-0.5 rounded-[3px] bg-oros-950/90 border border-oros-800 text-[10px] font-mono shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleUpdateGrid({ size: Math.max(16, gridSize - 4) })}
                    className="w-4 h-4 rounded-[2px] hover:bg-oros-850 hover:text-accent text-oros-400 flex items-center justify-center transition-colors font-bold"
                    title="Decrease Grid Size (-4px)"
                  >
                    -
                  </button>
                  <span className="text-oros-200 font-semibold px-0.5 min-w-[26px] text-center">{gridSize}px</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateGrid({ size: Math.min(256, gridSize + 4) })}
                    className="w-4 h-4 rounded-[2px] hover:bg-oros-850 hover:text-accent text-oros-400 flex items-center justify-center transition-colors font-bold"
                    title="Increase Grid Size (+4px)"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowGridMenu(!showGridMenu)
                }}
                className={`p-0.5 ml-0.5 rounded-[2px] border transition-colors ${
                  showGridMenu 
                    ? 'bg-accent text-accent-contrast border-accent' 
                    : 'bg-oros-850 hover:bg-oros-800 text-oros-400 border-oros-700'
                }`}
                title="Tactical Grid Settings"
              >
                <Sliders className="w-2.5 h-2.5" />
              </button>

              {/* Grid Settings Popover */}
              {showGridMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-11 left-1/2 -translate-x-1/2 w-72 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-3.5 z-50 text-xs font-sans text-oros-200 animate-fade-in"
                >
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-oros-800">
                    <span className="font-semibold text-oros-100 flex items-center gap-1.5">
                      <GridIcon className="w-3.5 h-3.5 text-accent" />
                      Tactical Grid Settings
                    </span>
                    <button
                      onClick={() => setShowGridMenu(false)}
                      className="text-oros-400 hover:text-oros-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-oros-300 font-medium">Grid Visibility</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateGrid({ enabled: !showGrid })}
                        className={`px-2 py-0.5 rounded-[3px] text-[10px] font-mono uppercase font-bold border transition-colors ${
                          showGrid
                            ? 'bg-accent/20 border-accent/50 text-accent'
                            : 'bg-oros-850 border-oros-750 text-oros-400'
                        }`}
                      >
                        {showGrid ? 'Active' : 'Off'}
                      </button>
                    </div>

                    {/* Grid Type: Square vs Hex */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-oros-400 mb-1">Grid Pattern</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateGrid({ type: 'square', enabled: true })}
                          className={`py-1 px-2 rounded-[3px] text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                            gridType === 'square'
                              ? 'bg-accent/20 border-accent/50 text-accent'
                              : 'bg-oros-850 border-oros-750 text-oros-300 hover:bg-oros-800'
                          }`}
                        >
                          <Hash className="w-3 h-3" />
                          <span>Square Grid</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateGrid({ type: 'hex', enabled: true })}
                          className={`py-1 px-2 rounded-[3px] text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                            gridType === 'hex'
                              ? 'bg-accent/20 border-accent/50 text-accent'
                              : 'bg-oros-850 border-oros-750 text-oros-300 hover:bg-oros-800'
                          }`}
                        >
                          <Hexagon className="w-3 h-3" />
                          <span>Hex Grid</span>
                        </button>
                      </div>
                    </div>

                    {/* Editable Cell Size: Number Input + Range Slider + Presets */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-oros-400 mb-1.5">
                        <span>Cell Size</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="16"
                            max="256"
                            value={gridSize}
                            onChange={(e) => {
                              const val = Math.max(16, Math.min(256, Number(e.target.value) || 16))
                              handleUpdateGrid({ size: val })
                            }}
                            className="w-14 px-1.5 py-0.5 rounded-[2px] bg-oros-950 border border-oros-750 text-oros-100 font-mono text-xs text-right focus:outline-none focus:border-accent"
                          />
                          <span className="text-oros-500 font-mono text-[10px]">px</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="16"
                        max="200"
                        step="2"
                        value={gridSize}
                        onChange={(e) => handleUpdateGrid({ size: Number(e.target.value) })}
                        className="w-full accent-accent bg-oros-800 rounded h-1 cursor-pointer"
                      />

                      {/* Quick Size Presets */}
                      <div className="flex items-center justify-between gap-1 mt-1.5">
                        {[32, 48, 64, 80, 96].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleUpdateGrid({ size: sz })}
                            className={`flex-1 py-0.5 rounded-[2px] text-[10px] font-mono border transition-colors text-center ${
                              gridSize === sz
                                ? 'bg-accent/25 border-accent text-accent font-bold'
                                : 'bg-oros-850 border-oros-750 text-oros-400 hover:text-oros-200'
                            }`}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>

                      {/* Calibrated Distance Translation */}
                      {currentMap && (
                        <p className="text-[10px] text-oros-400 font-sans italic mt-1.5">
                          1 Cell ≈ {((gridSize / (currentMap.scaleBarPixels || 140)) * (currentMap.scaleDistance ?? 50)).toFixed(1)} {currentMap.scaleUnit || 'Leagues'}
                        </p>
                      )}
                    </div>

                    {/* Opacity Slider */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase text-oros-400 mb-1">
                        <span>Grid Opacity</span>
                        <span className="text-oros-100 font-semibold">{Math.round(gridOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.05"
                        value={gridOpacity}
                        onChange={(e) => handleUpdateGrid({ opacity: Number(e.target.value) })}
                        className="w-full accent-accent bg-oros-800 rounded h-1 cursor-pointer"
                      />
                    </div>

                    {/* Coordinate Labels Toggle (square only) */}
                    {gridType === 'square' && (
                      <label className="flex items-center gap-2 text-xs text-oros-300 hover:text-oros-100 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={showGridCoordinates}
                          onChange={(e) => handleUpdateGrid({ showCoordinates: e.target.checked })}
                          className="rounded bg-oros-850 border-oros-750 text-accent focus:ring-0"
                        />
                        <span>Show A1 / B2 Coordinates</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Territories Layer Toggle */}
            <button
              onClick={() => setShowTerritories(!showTerritories)}
              title={showTerritories ? 'Hide Territories Layer' : 'Show Territories Layer'}
              className={`p-1.5 rounded-[3px] transition-colors ${
                showTerritories
                  ? 'text-oros-200 hover:bg-oros-850'
                  : 'text-oros-600 hover:text-oros-400 hover:bg-oros-850 opacity-60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* 6. Pins Layer Toggle */}
            <button
              onClick={() => setShowPins(!showPins)}
              title={showPins ? 'Hide Pins' : 'Show Pins'}
              className={`p-1.5 rounded-[3px] transition-colors ${
                showPins
                  ? 'text-oros-200 hover:bg-oros-850'
                  : 'text-oros-600 hover:text-oros-400 hover:bg-oros-850 opacity-60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-oros-800 mx-0.5" />

            {/* 7. Zoom Controls */}
            <button
              onClick={() => setZoom((z) => Math.max(0.35, Number((z - 0.2).toFixed(2))))}
              title="Zoom Out"
              className="p-1 rounded-[2px] text-oros-400 hover:text-oros-200 hover:bg-oros-850"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono text-oros-400 px-1 min-w-[36px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.2).toFixed(2))))}
              title="Zoom In"
              className="p-1 rounded-[2px] text-oros-400 hover:text-oros-200 hover:bg-oros-850"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              title="Reset View"
              className="p-1 rounded-[2px] text-oros-400 hover:text-oros-200 hover:bg-oros-850 border-l border-oros-800 pl-1.5 ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SELECTED PIN DETAILS DRAWER */}
      {selectedPin && (
        <div className="absolute right-4 top-14 w-80 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-4 z-30 animate-slide-in-right">
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div 
                className="w-7 h-7 rounded-[2px] flex items-center justify-center text-slate-950 font-bold border border-white/60 shadow-sm"
                style={{ backgroundColor: selectedPin.color || '#94a3b8' }}
              >
                {renderPinIcon(selectedPin.icon, 'w-3.5 h-3.5')}
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-oros-400 tracking-wider">
                  Landmark Pin
                </span>
                <h4 className="font-sans font-semibold text-sm text-oros-100 leading-snug">{selectedPin.title}</h4>
              </div>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-oros-400 hover:text-oros-200 text-xs p-0.5 rounded-[2px]"
            >
              ✕
            </button>
          </div>

          {selectedPin.description && (
            <p className="text-xs text-oros-400 mb-3.5 leading-relaxed font-sans">{selectedPin.description}</p>
          )}

          {/* Sub-map Drill Down Action */}
          {selectedPin.subMapId && (
            <div className="mb-3.5 p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-oros-200 font-sans">Nested Child Map</div>
                <div className="text-[10px] text-oros-500 font-mono">Zoom into sub-district</div>
              </div>
              <button
                onClick={() => {
                  setSelectedMapId(selectedPin.subMapId!)
                  setSelectedPin(null)
                }}
                className="px-2 py-1 rounded-[2px] bg-oros-800 hover:bg-oros-750 text-oros-200 text-xs font-medium flex items-center gap-1 transition-colors border border-oros-700"
              >
                <span>Enter Map</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Connected Lore Card */}
          <div className="mb-3.5">
            <span className="text-[10px] text-oros-500 uppercase font-mono mb-1 block">Connected Lore Card:</span>
            {selectedPinEntity ? (
              <div className="p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 flex items-center justify-between">
                <div className="truncate mr-2">
                  <div className="text-xs font-medium text-oros-200 truncate">{selectedPinEntity.title}</div>
                  <div className="text-[10px] text-oros-500 uppercase font-mono">{selectedPinEntity.type}</div>
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
                  className="px-2 py-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 text-oros-300 text-xs font-medium flex items-center gap-1 transition-colors border border-oros-750"
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-[3px] bg-oros-950 border border-dashed border-oros-800 flex items-center justify-between">
                <span className="text-xs text-oros-500 italic font-sans">No card linked</span>
                <button
                  onClick={() => {
                    const newEntity = createEntity('location', selectedPin.title)
                    if (currentMap) {
                      updatePinOnMap(currentMap.id, selectedPin.id, { entityId: newEntity.id })
                    }
                    setSelectedPin({ ...selectedPin, entityId: newEntity.id })
                    addToast(`Created & Linked Location Card: "${newEntity.title}"`, 'success')
                  }}
                  className="px-2 py-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 text-oros-300 text-[11px] font-medium flex items-center gap-1 transition-colors border border-oros-750"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Card</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-oros-800">
            <span className="text-[10px] font-mono text-oros-500">
              Pos: {selectedPin.x}%, {selectedPin.y}%
            </span>
            <div className="flex items-center gap-1.5">
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
                className="p-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 text-oros-300 hover:text-oros-100 transition-colors border border-oros-750"
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
                className="p-1 rounded-[2px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 transition-colors"
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
        <div className="absolute right-4 top-14 w-80 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-4 z-30 animate-slide-in-right">
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div 
                className="w-5 h-5 rounded-[2px] shadow-sm border border-white/40"
                style={{ backgroundColor: selectedRegion.color }}
              />
              <div>
                <span className="text-[10px] uppercase font-mono text-oros-400 tracking-wider">
                  Territory
                </span>
                <h4 className="font-sans font-semibold text-sm text-oros-100 leading-snug">{selectedRegion.name}</h4>
              </div>
            </div>
            <button
              onClick={() => setSelectedRegion(null)}
              className="text-oros-400 hover:text-oros-200 text-xs p-0.5 rounded-[2px]"
            >
              ✕
            </button>
          </div>

          <div className="text-xs font-mono text-oros-400 mb-3.5 flex items-center gap-2">
            <span>Vertices: {selectedRegion.points.length}</span>
            <span>•</span>
            <span>Opacity: {Math.round(selectedRegion.fillOpacity * 100)}%</span>
          </div>

          {/* Connected Lore Card */}
          <div className="mb-3.5">
            <span className="text-[10px] text-oros-500 uppercase font-mono mb-1 block">Connected Lore Card:</span>
            {selectedRegionEntity ? (
              <div className="p-2.5 rounded-[3px] bg-oros-950 border border-oros-800 flex items-center justify-between">
                <div className="truncate mr-2">
                  <div className="text-xs font-medium text-oros-200 truncate">{selectedRegionEntity.title}</div>
                  <div className="text-[10px] text-oros-500 uppercase font-mono">{selectedRegionEntity.type}</div>
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
                  className="px-2 py-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 text-oros-300 text-xs font-medium flex items-center gap-1 transition-colors border border-oros-750"
                >
                  <span>Open</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-[3px] bg-oros-950 border border-dashed border-oros-800 flex items-center justify-between">
                <span className="text-xs text-oros-500 italic font-sans">No card linked</span>
                <button
                  onClick={() => {
                    const newEntity = createEntity('location', selectedRegion.name)
                    if (currentMap) {
                      updateRegionOnMap(currentMap.id, selectedRegion.id, { entityId: newEntity.id })
                    }
                    setSelectedRegion({ ...selectedRegion, entityId: newEntity.id })
                    addToast(`Created & Linked Location Card: "${newEntity.title}"`, 'success')
                  }}
                  className="px-2 py-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 text-oros-300 text-[11px] font-medium flex items-center gap-1 transition-colors border border-oros-750"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Card</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-2.5 border-t border-oros-800">
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
              className="p-1 rounded-[2px] bg-oros-850 hover:bg-oros-800 text-oros-300 hover:text-oros-100 transition-colors border border-oros-750"
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
              className="p-1 rounded-[2px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 transition-colors"
              title="Delete Territory"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* REDESIGNED TERRITORY POLYGON CREATION / EDIT MODAL */}
      {isRegionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-text text-oros-100 animate-modal-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[3px] bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <Hexagon className="w-4 h-4" />
                </div>
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                  {editingRegionId ? 'Edit Territory Properties' : 'New Territory Region'}
                </h3>
              </div>
              <button
                onClick={() => setIsRegionModalOpen(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="region-form" onSubmit={handleSaveRegion} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Live Preview Card */}
              <div 
                className="p-3.5 rounded-[3px] border border-dashed transition-all relative flex flex-col items-center justify-center min-h-[64px] overflow-hidden shadow-inner"
                style={{ 
                  backgroundColor: regionForm.color,
                  borderColor: regionForm.color,
                  opacity: Math.max(0.35, regionForm.fillOpacity + 0.15)
                }}
              >
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: '#090a0d', opacity: 1 - regionForm.fillOpacity }}
                />
                <span className="relative z-10 font-serif font-bold text-sm text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wide">
                  {regionForm.name.trim() || 'Territory Title'}
                </span>
              </div>

              {/* Territory Name Input */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Territory Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={regionForm.name}
                  onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
                  placeholder="e.g. Duchy of Dun Carrow, The Bitter Coast..."
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-3 py-1.5 text-xs text-oros-100 font-medium focus:outline-none focus:border-accent"
                />
              </div>

              {/* Color Palette & Custom Hex */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1.5">
                  Heraldic Color Tint
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {PALETTE_COLORS.map((c) => {
                    const isSelected = regionForm.color.toLowerCase() === c.hex.toLowerCase()
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setRegionForm({ ...regionForm, color: c.hex })}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-oros-900 scale-110 shadow-lg'
                            : 'opacity-80 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white drop-shadow" />}
                      </button>
                    )
                  })}

                  {/* Custom Hex Picker Input */}
                  <div className="flex items-center gap-1.5 ml-1 bg-oros-850 border border-oros-750 rounded-[3px] px-1.5 py-0.5">
                    <input
                      type="color"
                      value={regionForm.color}
                      onChange={(e) => setRegionForm({ ...regionForm, color: e.target.value })}
                      className="w-5 h-5 rounded-full cursor-pointer bg-transparent border-0 p-0"
                      title="Custom Color Picker"
                    />
                    <input
                      type="text"
                      value={regionForm.color}
                      onChange={(e) => setRegionForm({ ...regionForm, color: e.target.value })}
                      className="w-16 bg-transparent text-[11px] font-mono text-oros-200 focus:outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Opacity Slider with Quick Presets */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono uppercase font-semibold text-oros-400">
                    Fill Opacity
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-accent">
                    {Math.round(regionForm.fillOpacity * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="range"
                    min="0.05"
                    max="0.85"
                    step="0.05"
                    value={regionForm.fillOpacity}
                    onChange={(e) => setRegionForm({ ...regionForm, fillOpacity: parseFloat(e.target.value) })}
                    className="flex-1 cursor-pointer accent-accent h-1.5"
                  />
                </div>

                {/* Opacity Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {[
                    { label: '15%', val: 0.15 },
                    { label: '25%', val: 0.25 },
                    { label: '45%', val: 0.45 },
                    { label: '70%', val: 0.70 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setRegionForm({ ...regionForm, fillOpacity: preset.val })}
                      className={`flex-1 py-1 rounded-[2px] text-[10px] font-mono transition-colors border ${
                        Math.abs(regionForm.fillOpacity - preset.val) < 0.04
                          ? 'bg-accent/20 text-accent border-accent/40 font-semibold'
                          : 'bg-oros-850 text-oros-400 border-oros-750 hover:text-oros-200 hover:bg-oros-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Linkage */}
              <div className="p-3 bg-oros-950 rounded-[3px] border border-oros-800">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono uppercase font-semibold text-oros-300">
                    Linked Lore Codex Card
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateLocationCardForRegion}
                    className="text-[10px] text-accent hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Location Card</span>
                  </button>
                </div>
                <select
                  value={regionForm.entityId}
                  onChange={(e) => setRegionForm({ ...regionForm, entityId: e.target.value })}
                  className="w-full bg-oros-900 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans"
                >
                  <option value="">No codex entity linked</option>
                  {worldEntities.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.title} ({ent.type})
                    </option>
                  ))}
                </select>
              </div>
            </form>

            {/* Pinned Visible Footer */}
            <div className="px-4 py-2.5 border-t border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <div>
                {editingRegionId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentMap) removeRegionFromMap(currentMap.id, editingRegionId)
                      setIsRegionModalOpen(false)
                      setSelectedRegion(null)
                      addToast('Deleted territory region', 'info')
                    }}
                    className="px-2.5 py-1 rounded-[2px] bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/50 text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegionModalOpen(false)}
                  className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="region-form"
                  className="btn-accent px-4 py-1 rounded-[3px] text-xs font-semibold shadow-sm transition-colors"
                >
                  {editingRegionId ? 'Save Changes' : 'Save Territory'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAP SCALE & MEASUREMENT CALIBRATION MODAL */}
      {isScaleModalOpen && currentMap && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-md rounded-[6px] shadow-2xl flex flex-col overflow-hidden select-text text-oros-100 animate-modal-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[3px] bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <Ruler className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                    Calibrate Map Scale
                  </h3>
                  <span className="text-[10px] text-oros-400 font-mono">
                    Configure distance units and scale bar for {currentMap.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsScaleModalOpen(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const dist = Math.max(1, Number(scaleForm.distance) || 50)
                const unit = scaleForm.unit.trim() || 'Leagues'
                const barPx = Math.max(40, Math.min(400, Number(scaleForm.barPixels) || 140))
                updateMap(currentMap.id, {
                  scaleDistance: dist,
                  scaleUnit: unit,
                  scaleBarPixels: barPx
                })
                addToast(`Calibrated scale: ${dist} ${unit}`, 'success')
                setIsScaleModalOpen(false)
              }}
              className="p-4 space-y-4 flex-1"
            >
              {/* Scale Distance & Unit Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                    Scale Distance *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    required
                    value={scaleForm.distance}
                    onChange={(e) => setScaleForm({ ...scaleForm, distance: Number(e.target.value) })}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 font-mono focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                    Unit of Measurement *
                  </label>
                  <input
                    type="text"
                    required
                    value={scaleForm.unit}
                    onChange={(e) => setScaleForm({ ...scaleForm, unit: e.target.value })}
                    placeholder="e.g. Leagues"
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Quick Unit Presets */}
              <div>
                <span className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1.5">
                  Unit Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Leagues', 'Miles', 'Kilometers', 'Nautical Leagues', 'Hexes', 'Days of March'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setScaleForm({ ...scaleForm, unit: u })}
                      className={`px-2 py-0.5 rounded-[2px] text-[11px] font-medium transition-colors border ${
                        scaleForm.unit.toLowerCase() === u.toLowerCase()
                          ? 'bg-accent/20 text-accent border-accent/50'
                          : 'bg-oros-850 text-oros-400 border-oros-750 hover:text-oros-200 hover:bg-oros-800'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Scale Bar Calibration */}
              <div className="p-3 bg-oros-950 rounded-[3px] border border-oros-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-semibold text-oros-300">
                    Reference Bar Length
                  </span>
                  <span className="text-[11px] font-mono text-accent font-bold">
                    {scaleForm.barPixels}px = {scaleForm.distance} {scaleForm.unit || 'Units'}
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={scaleForm.barPixels}
                  onChange={(e) => setScaleForm({ ...scaleForm, barPixels: Number(e.target.value) })}
                  className="w-full cursor-pointer accent-accent h-1.5"
                />

                {/* Live Visual Scale Bar Preview */}
                <div className="pt-2 flex flex-col items-center">
                  <div className="flex items-center justify-between text-[9px] font-mono text-oros-400 w-full mb-1" style={{ maxWidth: `${scaleForm.barPixels}px` }}>
                    <span>0</span>
                    <span>{Math.round(scaleForm.distance / 2)}</span>
                    <span>{scaleForm.distance} {scaleForm.unit}</span>
                  </div>
                  <div 
                    className="h-2 bg-oros-800 border border-oros-600 rounded-sm relative flex overflow-hidden shadow-inner"
                    style={{ width: `${scaleForm.barPixels}px` }}
                  >
                    <div className="w-1/2 h-full bg-accent" />
                    <div className="w-1/2 h-full bg-oros-300" />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-oros-750">
                <button
                  type="button"
                  onClick={() => setIsScaleModalOpen(false)}
                  className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent px-4 py-1 rounded-[3px] text-xs font-semibold shadow-sm transition-colors"
                >
                  Apply Calibration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN CREATION / EDIT MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-md rounded-[4px] shadow-2xl flex flex-col max-h-[460px] overflow-hidden select-text text-oros-100 animate-modal-in">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <PinIcon className="w-3.5 h-3.5 text-accent" />
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                  {editingPinId ? 'Edit Landmark Pin' : 'Place Cartographic Landmark'}
                </h3>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="pin-form" onSubmit={handleSavePin} className="p-3.5 space-y-2.5 overflow-y-auto flex-1">
              <div className="text-[11px] font-mono text-oros-400 bg-oros-850 px-2 py-1 rounded-[2px] border border-oros-750">
                Coordinates: {pinForm.x}%, {pinForm.y}% on {currentMap?.name}
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Landmark Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={pinForm.title}
                  onChange={(e) => setPinForm({ ...pinForm, title: e.target.value })}
                  placeholder="e.g. Ruins of the Sunken Bastion"
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Icon & Color Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Pin Icon</label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-oros-850 rounded-[3px] border border-oros-750 max-h-20 overflow-y-auto">
                    {PIN_ICONS.map((item) => {
                      const IconComp = item.icon
                      const isSelected = pinForm.icon === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPinForm({ ...pinForm, icon: item.id })}
                          title={item.label}
                          className={`p-1 rounded-[2px] flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-oros-750 text-oros-100 border border-oros-600'
                              : 'text-oros-400 hover:text-oros-200'
                          }`}
                        >
                          <IconComp className="w-3 h-3" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Pin Color</label>
                  <div className="flex flex-wrap gap-1 p-1 bg-oros-850 rounded-[3px] border border-oros-750">
                    {PALETTE_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setPinForm({ ...pinForm, color: c.hex })}
                        className={`w-4 h-4 rounded-[2px] transition-all ${
                          pinForm.color === c.hex 
                            ? 'ring-1 ring-white' 
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Linkage & Sub-Map */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-mono uppercase font-semibold text-oros-400">Codex Card</label>
                    <button
                      type="button"
                      onClick={handleCreateLocationCardForPin}
                      className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>New Card</span>
                    </button>
                  </div>
                  <select
                    value={pinForm.entityId}
                    onChange={(e) => setPinForm({ ...pinForm, entityId: e.target.value })}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  >
                    <option value="">No entity linked</option>
                    {worldEntities.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.title} ({ent.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">
                    Drilldown Sub-Map
                  </label>
                  <select
                    value={pinForm.subMapId}
                    onChange={(e) => setPinForm({ ...pinForm, subMapId: e.target.value })}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  >
                    <option value="">No nested sub-map</option>
                    {worldMaps.filter((m) => m.id !== currentMap?.id).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Notes</label>
                <textarea
                  rows={2}
                  value={pinForm.description}
                  onChange={(e) => setPinForm({ ...pinForm, description: e.target.value })}
                  placeholder="Brief landmark notes or history..."
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent resize-none"
                />
              </div>
            </form>

            {/* Pinned Visible Footer */}
            <div className="px-4 py-2 border-t border-oros-750 bg-oros-900 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="pin-form"
                className="btn-accent px-3.5 py-1 rounded-[3px] text-xs font-semibold shadow-sm transition-colors"
              >
                {editingPinId ? 'Save Changes' : 'Drop Landmark Pin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MAP MODAL */}
      {showNewMapModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-sm rounded-[4px] shadow-2xl flex flex-col max-h-[380px] overflow-hidden select-text text-oros-100 animate-modal-in">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-accent" />
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                  Import or Create Map
                </h3>
              </div>
              <button
                onClick={() => setShowNewMapModal(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Form Body */}
            <form id="create-map-form" onSubmit={handleCreateMap} className="p-3.5 space-y-2.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Map Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="e.g. Kingdom of the Western Reaches"
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Artwork Source</label>
                <div className="flex gap-1.5 mb-1.5">
                  <button
                    type="button"
                    onClick={handleImportMapArtwork}
                    className="flex-1 py-1 px-2.5 rounded-[3px] bg-oros-850 hover:bg-oros-800 text-oros-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-oros-750 transition-colors"
                  >
                    <Upload className="w-3 h-3 text-oros-400" />
                    <span>Choose File from Computer</span>
                  </button>
                </div>
                {newMapUrl.startsWith('data:') ? (
                  <div className="flex items-center justify-between p-2 rounded-[3px] bg-oros-850 border border-oros-750 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-oros-200 font-mono text-[11px] truncate">Local File Asset Loaded (Embedded Image)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewMapUrl('')
                        setNewMapPreviewError(false)
                      }}
                      className="text-oros-400 hover:text-rose-300 text-[11px] font-mono hover:underline shrink-0 ml-2"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={newMapUrl}
                    onChange={(e) => {
                      setNewMapUrl(e.target.value)
                      setNewMapPreviewError(false)
                    }}
                    placeholder="oros-asset://... or https://..."
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  />
                )}

                {/* Create Map Image Live Preview Box */}
                {newMapUrl && (
                  <div className="h-28 w-full rounded-[3px] border border-oros-750 overflow-hidden bg-oros-950/80 relative flex items-center justify-center mt-2">
                    {!newMapPreviewError ? (
                      <img
                        key={newMapUrl.slice(0, 60)}
                        src={newMapUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onLoad={() => setNewMapPreviewError(false)}
                        onError={() => setNewMapPreviewError(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-oros-500 text-xs font-mono p-4 text-center">
                        <ImageOff className="w-5 h-5 mb-1 text-rose-400/80" />
                        <span className="text-oros-300 font-medium">Unable to preview image</span>
                        <span className="text-[10px] text-oros-500 mt-0.5">Please check URL or choose a valid file</span>
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-oros-400 pointer-events-none">
                      Live Preview
                    </div>
                  </div>
                )}
              </div>
            </form>

            {/* Pinned Visible Footer */}
            <div className="px-4 py-2 border-t border-oros-750 bg-oros-900 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowNewMapModal(false)}
                className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-map-form"
                className="btn-accent px-3.5 py-1 rounded-[3px] text-xs font-semibold shadow-sm transition-colors"
              >
                Create Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MAP MODAL */}
      {showEditMapModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-md rounded-[4px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden select-text text-oros-100 animate-modal-in">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-accent" />
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                  Edit Map & Artwork
                </h3>
              </div>
              <button
                onClick={() => setShowEditMapModal(false)}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Form Body */}
            <form id="edit-map-form" onSubmit={handleSaveEditMap} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Map Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editMapName}
                  onChange={(e) => setEditMapName(e.target.value)}
                  placeholder="Map name..."
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Description</label>
                <input
                  type="text"
                  value={editMapDescription}
                  onChange={(e) => setEditMapDescription(e.target.value)}
                  placeholder="Brief description of this region or chart..."
                  className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400">Artwork Image Source</label>
                  <span className="text-[10px] font-mono text-oros-500">File or Web URL</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleImportFileToTarget((url) => {
                      setEditMapUrl(url)
                      setEditMapPreviewError(false)
                    })}
                    className="flex-1 py-1.5 px-2.5 rounded-[3px] bg-oros-850 hover:bg-oros-800 text-oros-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-oros-750 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-accent" />
                    <span>Choose File from Computer</span>
                  </button>
                </div>
                {editMapUrl.startsWith('data:') ? (
                  <div className="flex items-center justify-between p-2 rounded-[3px] bg-oros-850 border border-oros-750 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-oros-200 font-mono text-[11px] truncate">Local File Asset Loaded (Embedded Image)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditMapUrl('')
                        setEditMapPreviewError(false)
                      }}
                      className="text-oros-400 hover:text-rose-300 text-[11px] font-mono hover:underline shrink-0 ml-2"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editMapUrl}
                    onChange={(e) => {
                      setEditMapUrl(e.target.value)
                      setEditMapPreviewError(false)
                    }}
                    placeholder="Paste image link: https://... or oros-asset://..."
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-mono"
                  />
                )}
              </div>

              {/* Image Preview Box */}
              {editMapUrl && (
                <div className="h-32 w-full rounded-[3px] border border-oros-750 overflow-hidden bg-oros-950/80 relative flex items-center justify-center">
                  {!editMapPreviewError ? (
                    <img
                      key={editMapUrl.slice(0, 60)}
                      src={editMapUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onLoad={() => setEditMapPreviewError(false)}
                      onError={() => setEditMapPreviewError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-oros-500 text-xs font-mono p-4 text-center">
                      <ImageOff className="w-5 h-5 mb-1.5 text-rose-400/80" />
                      <span className="text-oros-300 font-medium">Unable to preview image</span>
                      <span className="text-[10px] text-oros-500 mt-0.5">Please check URL or choose a valid file</span>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-oros-400 pointer-events-none">
                    Live Preview
                  </div>
                </div>
              )}

              {/* Scale Settings */}
              <div className="pt-2 border-t border-oros-800 grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Scale Distance</label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={editMapScaleDistance}
                    onChange={(e) => setEditMapScaleDistance(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-0.5">Scale Unit</label>
                  <select
                    value={editMapScaleUnit}
                    onChange={(e) => setEditMapScaleUnit(e.target.value)}
                    className="w-full bg-oros-850 border border-oros-750 rounded-[3px] px-2 py-1 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  >
                    <option value="Leagues">Leagues</option>
                    <option value="Miles">Miles</option>
                    <option value="Kilometers">Kilometers</option>
                    <option value="Meters">Meters</option>
                    <option value="Hexes">Hexes</option>
                    <option value="Tiles">Tiles</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Pinned Visible Footer */}
            <div className="px-4 py-2.5 border-t border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              {worldMaps.length > 1 && editMapId ? (
                <button
                  type="button"
                  onClick={() => handleDeleteMap(editMapId)}
                  className="px-2.5 py-1 rounded-[3px] text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/50 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Map</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditMapModal(false)}
                  className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-map-form"
                  className="btn-accent px-3.5 py-1 rounded-[3px] text-xs font-semibold shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT MAPS GALLERY MODAL (Grid-like Map Explorer) */}
      {showMapGalleryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-oros-900 border border-oros-750 w-full max-w-4xl rounded-[4px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-text text-oros-100 animate-modal-in">
            {/* Header */}
            <div className="px-5 py-3 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4 text-accent" />
                <div>
                  <h3 className="font-serif text-sm font-semibold tracking-wide text-oros-100">
                    Project Cartography & Maps
                  </h3>
                  <p className="text-[11px] text-oros-400 font-sans">
                    Browse, switch, and manage all regional, world, and tactical battle maps in this project
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowMapGalleryModal(false)
                    setShowNewMapModal(true)
                  }}
                  className="btn-accent px-2.5 py-1 rounded-[3px] text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Map</span>
                </button>
                <button
                  onClick={() => setShowMapGalleryModal(false)}
                  className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid of Maps */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {worldMaps.map((mapItem) => {
                const isActive = mapItem.id === currentMap?.id
                return (
                  <div
                    key={mapItem.id}
                    onClick={() => {
                      setSelectedMapId(mapItem.id)
                      setSelectedPin(null)
                      setSelectedRegion(null)
                      setDrawingPoints([])
                      setShowMapGalleryModal(false)
                      addToast(`Switched to map: ${mapItem.name}`, 'info')
                    }}
                    className={`group relative rounded-[4px] border overflow-hidden cursor-pointer transition-all flex flex-col bg-oros-950 ${
                      isActive
                        ? 'border-accent ring-2 ring-accent/30 shadow-lg'
                        : 'border-oros-800 hover:border-oros-700 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-36 w-full relative overflow-hidden bg-oros-900">
                      <img
                        src={mapItem.imageUrl}
                        alt={mapItem.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-oros-950 via-transparent to-transparent opacity-80" />
                      {isActive && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-[2px] bg-accent text-accent-contrast text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active Map</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-sans font-semibold text-sm text-oros-100 group-hover:text-accent transition-colors">
                            {mapItem.name}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowMapGalleryModal(false)
                              handleOpenEditMap(mapItem)
                            }}
                            className="p-1 rounded hover:bg-oros-800 text-oros-400 hover:text-oros-100 transition-colors"
                            title="Edit map details and artwork"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-oros-400">
                          <span>{mapItem.regions?.length || 0} Territories</span>
                          <span>•</span>
                          <span>{mapItem.pins?.length || 0} Landmarks</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-oros-850 flex items-center justify-between text-[11px] font-mono text-oros-500">
                        <span>Scale: {mapItem.scaleDistance ?? 50} {mapItem.scaleUnit || 'Leagues'}</span>
                        <span className="text-accent group-hover:translate-x-0.5 transition-transform font-sans font-medium text-xs">
                          {isActive ? 'Current' : 'Select →'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add New Map Card in Grid */}
              <button
                onClick={() => {
                  setShowMapGalleryModal(false)
                  setShowNewMapModal(true)
                }}
                className="h-full min-h-[200px] rounded-[4px] border-2 border-dashed border-oros-800 hover:border-oros-700 bg-oros-950/40 hover:bg-oros-900/40 flex flex-col items-center justify-center gap-2 text-oros-400 hover:text-oros-200 transition-all p-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-oros-900 border border-oros-750 flex items-center justify-center text-oros-400 group-hover:text-accent group-hover:border-accent transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-sans text-xs font-semibold">Import Another Map</span>
                <span className="text-[10px] text-oros-500 font-mono text-center max-w-[160px]">
                  Add regional, city, or tactical battle maps
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-oros-750 bg-oros-900 flex items-center justify-between text-xs text-oros-400">
              <span className="font-mono">{worldMaps.length} map{worldMaps.length === 1 ? '' : 's'} registered in world</span>
              <button
                onClick={() => setShowMapGalleryModal(false)}
                className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-300 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
