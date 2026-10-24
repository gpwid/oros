import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { 
  Map as MapIcon, Plus, Trash2, ZoomIn, ZoomOut, RotateCcw, 
  Ruler, Magnet, Hash, Shield, Heart, User, 
  X, ChevronDown, Check, Eye, Move, ExternalLink, 
  Skull, Swords, Dices, UserPlus, Image as ImageIcon, Sparkles,
  Flame, Cloud, Zap, Snowflake, Wind, Settings
} from 'lucide-react'
import { TTRPGCampaign, TTRPGBattlemap, TTRPGToken, TTRPGBattlemapEffect, BattlemapEffectType, BattlemapEffectShape, Dnd5eCharacter } from '@shared/types'
import { useTtrpgStore } from '../../store/useTtrpgStore'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { InteractiveDice3D } from '../dice/InteractiveDice3D'
import { AnimatedMapEffect } from './AnimatedMapEffect'

interface TTRPGBattlemapViewerProps {
  campaign: TTRPGCampaign
  onOpenCharacterSheet?: (characterId: string) => void
}

const COMMON_CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 
  'Petrified', 'Poisoned', 'Prone', 'Restrained', 
  'Stunned', 'Unconscious', 'Concentrating'
]

const PRESET_AVATARS = [
  {
    id: 'knight',
    name: 'Knight',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
    color: '#38bdf8'
  },
  {
    id: 'rogue',
    name: 'Rogue',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    color: '#34d399'
  },
  {
    id: 'wizard',
    name: 'Wizard',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    color: '#a78bfa'
  },
  {
    id: 'cleric',
    name: 'Cleric',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    color: '#fbbf24'
  },
  {
    id: 'ranger',
    name: 'Ranger',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    color: '#a3e635'
  },
  {
    id: 'orc',
    name: 'Orc',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    color: '#f87171'
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    color: '#94a3b8'
  },
  {
    id: 'direwolf',
    name: 'Direwolf',
    url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=400&q=80',
    color: '#f59e0b'
  }
]

const PRESET_EFFECTS: {
  name: string
  type: BattlemapEffectType
  shape: BattlemapEffectShape
  radiusFeet?: number
  lengthFeet?: number
  widthFeet?: number
  rotationDeg?: number
  opacity: number
  isTemporary?: boolean
  durationMs?: number
  description: string
}[] = [
  // 🔥 FIRE
  {
    name: 'Fireball',
    type: 'fire',
    shape: 'projectile',
    radiusFeet: 20,
    opacity: 0.9,
    isTemporary: true,
    durationMs: 3200,
    description: 'Fiery projectile streaks to target and detonates into a 20ft blast'
  },
  {
    name: 'Inferno Blast',
    type: 'fire',
    shape: 'circle',
    radiusFeet: 40,
    opacity: 0.85,
    isTemporary: true,
    durationMs: 3200,
    description: 'Massive 40ft radius (80ft across) roiling fire storm'
  },
  {
    name: "Dragon's Breath",
    type: 'fire',
    shape: 'cone',
    lengthFeet: 20,
    opacity: 0.85,
    isTemporary: true,
    durationMs: 3200,
    description: '20ft sweeping cone of elemental flame'
  },
  {
    name: 'Wall of Fire',
    type: 'fire',
    shape: 'line',
    lengthFeet: 40,
    widthFeet: 5,
    opacity: 0.85,
    isTemporary: false,
    description: '40ft blazing barrier of opaque flame (Concentration)'
  },

  // ⚡ LIGHTNING
  {
    name: 'Chain Lightning',
    type: 'lightning',
    shape: 'projectile',
    radiusFeet: 20,
    opacity: 0.95,
    isTemporary: true,
    durationMs: 3200,
    description: 'Electric lance darts to point and bursts into plasma arcs'
  },
  {
    name: 'Lightning Bolt',
    type: 'lightning',
    shape: 'line',
    lengthFeet: 60,
    widthFeet: 5,
    opacity: 0.9,
    isTemporary: true,
    durationMs: 3200,
    description: '60ft piercing stroke of electric lightning'
  },

  // ❄️ ICE / FROST
  {
    name: 'Ray of Frost',
    type: 'ice',
    shape: 'projectile',
    radiusFeet: 15,
    opacity: 0.9,
    isTemporary: true,
    durationMs: 3200,
    description: 'Glacial crystal comet streaks to target and shatters'
  },
  {
    name: 'Cone of Cold',
    type: 'ice',
    shape: 'cone',
    lengthFeet: 30,
    opacity: 0.8,
    isTemporary: true,
    durationMs: 3200,
    description: '30ft sub-zero blast of crystalline frost and blizzard wind'
  },
  {
    name: 'Ice Storm',
    type: 'ice',
    shape: 'circle',
    radiusFeet: 25,
    opacity: 0.8,
    isTemporary: true,
    durationMs: 3200,
    description: '25ft radius pounding blizzard and glacial ice spires'
  },

  // 🔮 ARCANE / FORCE
  {
    name: 'Eldritch Blast',
    type: 'arcane',
    shape: 'projectile',
    radiusFeet: 15,
    opacity: 0.9,
    isTemporary: true,
    durationMs: 3200,
    description: 'Pulsing amethyst energy dart streaks to target in arcane flash'
  },
  {
    name: 'Arcane Nova',
    type: 'arcane',
    shape: 'circle',
    radiusFeet: 30,
    opacity: 0.85,
    isTemporary: false,
    description: '30ft radius swirling mystic rune circle and astral ward'
  },

  // ✨ RADIANCE / HOLY
  {
    name: 'Guiding Bolt',
    type: 'radiance',
    shape: 'projectile',
    radiusFeet: 15,
    opacity: 0.95,
    isTemporary: true,
    durationMs: 3200,
    description: 'Golden sun star streaks to target and bursts in divine light'
  },
  {
    name: 'Spirit Guardians',
    type: 'radiance',
    shape: 'circle',
    radiusFeet: 15,
    opacity: 0.8,
    isTemporary: false,
    description: '15ft radius revolving celestial mandala and protective motes'
  },

  // ☠️ POISON / ACID
  {
    name: 'Acid Splash',
    type: 'poison',
    shape: 'projectile',
    radiusFeet: 15,
    opacity: 0.9,
    isTemporary: true,
    durationMs: 3200,
    description: 'Vile green acid glob splashes into boiling chemical burst'
  },
  {
    name: 'Stinking Cloud',
    type: 'poison',
    shape: 'circle',
    radiusFeet: 20,
    opacity: 0.75,
    isTemporary: false,
    description: '20ft radius billowing noxious toxic vapors'
  },

  // 🌑 DARKNESS / VOID
  {
    name: 'Shadow Bolt',
    type: 'darkness',
    shape: 'projectile',
    radiusFeet: 15,
    opacity: 0.95,
    isTemporary: true,
    durationMs: 3200,
    description: 'Dark matter orb collapses on target into black vapor'
  },
  {
    name: 'Darkness',
    type: 'darkness',
    shape: 'circle',
    radiusFeet: 15,
    opacity: 0.98,
    isTemporary: false,
    description: '15ft radius pitch-black magical void that consumes all light'
  },

  // 💨 MIST & WEB
  {
    name: 'Fog Cloud',
    type: 'smoke',
    shape: 'circle',
    radiusFeet: 20,
    opacity: 0.75,
    isTemporary: false,
    description: '20ft radius heavy obscuring mist with organic billowing clouds'
  },
  {
    name: 'Web',
    type: 'web',
    shape: 'square',
    widthFeet: 20,
    opacity: 0.7,
    isTemporary: false,
    description: '20ft cube of sticky anchored webbing'
  }
]

const SafeTokenAvatar: React.FC<{ 
  src?: string; 
  name: string; 
  isEnemy?: boolean;
  fontSize?: number;
}> = ({ 
  src, 
  name, 
  isEnemy,
  fontSize = 11
}) => {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center font-bold font-serif ${
        isEnemy ? 'bg-rose-950 text-rose-300' : 'bg-oros-950 text-sky-300'
      }`}>
        <span style={{ fontSize: `${fontSize}px` }} className="leading-none select-none">
          {name.substring(0, 2).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover pointer-events-none select-none"
    />
  )
}

export const TTRPGBattlemapViewer: React.FC<TTRPGBattlemapViewerProps> = ({
  campaign,
  onOpenCharacterSheet
}) => {
  const { 
    battlemaps, activeBattlemapId, setActiveBattlemapId,
    createBattlemap, updateBattlemap, deleteBattlemap,
    addTokenToBattlemap, updateTokenOnBattlemap, removeTokenFromBattlemap,
    addEffectToBattlemap, updateEffectOnBattlemap, removeEffectFromBattlemap, clearAllEffectsOnBattlemap,
    createCharacter, characters
  } = useTtrpgStore()

  const { maps: worldMapsMap } = useWorldStore()
  const { addToast } = useToastStore()
  const { openSettings } = useSettingsStore()

  // Maps available to this campaign: campaign battlemaps + linked world maps
  const campaignMaps = battlemaps[campaign.id] || []
  const linkedWorldMaps = campaign.linkedWorldId ? worldMapsMap[campaign.linkedWorldId] || [] : []

  const currentBattlemap = campaignMaps.find(m => m.id === activeBattlemapId) || campaignMaps[0]

  // Viewport Pan & Zoom
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)

  // Floating Tactical Dock States
  const [activeTool, setActiveTool] = useState<'pan' | 'ruler'>('pan')
  const [showGridMenu, setShowGridMenu] = useState(false)
  const [showAddTokenMenu, setShowAddTokenMenu] = useState(false)
  const [addTokenTab, setAddTokenTab] = useState<'party' | 'custom'>('party')
  const [showEffectsMenu, setShowEffectsMenu] = useState(false)
  const [isDiceOpen, setIsDiceOpen] = useState(false)
  const [showMapDropdown, setShowMapDropdown] = useState(false)
  const [showNewMapModal, setShowNewMapModal] = useState(false)

  // Combat Ruler State
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null)
  const [rulerCurrent, setRulerCurrent] = useState<{ x: number; y: number } | null>(null)

  // Token Selection & Dragging
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null)

  // Interactive Effect Drawing / Casting State Machine
  const [activeEffectTemplate, setActiveEffectTemplate] = useState<{
    name: string
    type: BattlemapEffectType
    shape: BattlemapEffectShape
    radiusFeet?: number
    lengthFeet?: number
    widthFeet?: number
    rotationDeg?: number
    opacity: number
    isTemporary?: boolean
    durationMs?: number
  } | null>(null)
  const [drawOrigin, setDrawOrigin] = useState<{ x: number; y: number } | null>(null)
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null)
  const [isDrawingEffect, setIsDrawingEffect] = useState(false)

  // Custom Token / Monster Spawner State
  const [tokenName, setTokenName] = useState('')
  const [tokenAvatarUrl, setTokenAvatarUrl] = useState('')
  const [tokenHp, setTokenHp] = useState(25)
  const [tokenAc, setTokenAc] = useState(14)
  const [tokenSize, setTokenSize] = useState<number>(1)
  const [tokenAlignment, setTokenAlignment] = useState<'hero' | 'neutral' | 'hostile'>('hostile')
  const [saveAsCampaignChar, setSaveAsCampaignChar] = useState(false)

  // Custom Effect Form State & Popover Tabs
  const [effectsMenuTab, setEffectsMenuTab] = useState<'presets' | 'custom' | 'active'>('presets')
  const [presetFilter, setPresetFilter] = useState<'all' | BattlemapEffectType>('all')
  const [effectName, setEffectName] = useState('')
  const [effectType, setEffectType] = useState<BattlemapEffectType>('fire')
  const [effectShape, setEffectShape] = useState<BattlemapEffectShape>('projectile')
  const [effectRadiusFeet, setEffectRadiusFeet] = useState(20)
  const [effectLengthFeet, setEffectLengthFeet] = useState(30)
  const [effectWidthFeet, setEffectWidthFeet] = useState(5)
  const [effectOpacity, setEffectOpacity] = useState(0.85)
  const [effectIsTemporary, setEffectIsTemporary] = useState(true)

  // Map & Level Management State
  const [editingMapId, setEditingMapId] = useState<string | null>(null)
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null)
  const [newMapName, setNewMapName] = useState('')
  const [newMapUrl, setNewMapUrl] = useState('')
  const mapFileInputRef = useRef<HTMLInputElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapElementRef = useRef<HTMLDivElement>(null)
  const isAltPressedRef = useRef(false)
  const [isAltPressed, setIsAltPressed] = useState(false)

  // Campaign characters available for token placement
  const campaignCharacters = characters[campaign.id] || []

  // Ensure an active battlemap is selected
  useEffect(() => {
    if (!activeBattlemapId && campaignMaps.length > 0) {
      setActiveBattlemapId(campaignMaps[0].id)
    }
  }, [activeBattlemapId, campaignMaps, setActiveBattlemapId])

  // Helper to update current battlemap settings
  const handleUpdateCurrentMap = (updates: Partial<TTRPGBattlemap>) => {
    if (!currentBattlemap) return
    updateBattlemap(campaign.id, currentBattlemap.id, updates)
  }

  // Keyboard navigation & space pan (and Alt key tracking to bypass snap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Alt') {
        isAltPressedRef.current = true
        setIsAltPressed(true)
      } else if (e.code === 'Space') {
        setIsSpacePressed(true)
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('pan')
        setActiveEffectTemplate(null)
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('ruler')
        setActiveEffectTemplate(null)
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDiceOpen(prev => !prev)
      } else if (e.key === 'Escape') {
        setShowGridMenu(false)
        setShowAddTokenMenu(false)
        setShowEffectsMenu(false)
        setShowMapDropdown(false)
        setSelectedTokenId(null)
        setActiveEffectTemplate(null)
        setIsDrawingEffect(false)
        setDrawOrigin(null)
        setDrawCurrent(null)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        isAltPressedRef.current = false
        setIsAltPressed(false)
      } else if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsPanning(false)
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
  }, [])

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87
    setZoom((prev) => Math.min(Math.max(0.25, prev * zoomFactor), 4.0))
  }

  // Convert client mouse coordinates to percentage (0 - 100) on the 1280x800 base canvas (Alt key bypasses snap)
  const getMapCoordinates = useCallback(
    (clientX: number, clientY: number, snap = false, bypassSnap = false): { x: number; y: number } | null => {
      if (!mapElementRef.current) return null
      const rect = mapElementRef.current.getBoundingClientRect()
      const rawX = ((clientX - rect.left) / rect.width) * 100
      const rawY = ((clientY - rect.top) / rect.height) * 100

      const clampedX = Math.max(0, Math.min(100, rawX))
      const clampedY = Math.max(0, Math.min(100, rawY))

      const shouldSnap = snap && !bypassSnap && !isAltPressedRef.current

      if (!shouldSnap || !currentBattlemap) return { x: clampedX, y: clampedY }

      const gridSize = currentBattlemap.gridSize || 64
      const gridPxX = (gridSize / 1280) * 100
      const gridPxY = (gridSize / 800) * 100

      // Snap to cell center
      const cellX = Math.floor(clampedX / gridPxX) * gridPxX + gridPxX / 2
      const cellY = Math.floor(clampedY / gridPxY) * gridPxY + gridPxY / 2

      return {
        x: Math.max(0, Math.min(100, cellX)),
        y: Math.max(0, Math.min(100, cellY))
      }
    },
    [currentBattlemap]
  )

  // Map Pan, Ruler, and Effect Drawing Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Priority 1: Interactive Effect Drawing / Casting Tool
    if (activeEffectTemplate && e.button === 0) {
      const coords = getMapCoordinates(e.clientX, e.clientY, currentBattlemap?.snapToGrid, e.altKey)
      if (coords) {
        setDrawOrigin(coords)
        setDrawCurrent(coords)
        setIsDrawingEffect(true)
      }
      return
    }

    if (activeTool === 'pan' || isSpacePressed || e.button === 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    } else if (activeTool === 'ruler') {
      const coords = getMapCoordinates(e.clientX, e.clientY, currentBattlemap?.snapToGrid, e.altKey)
      if (coords) {
        setRulerStart(coords)
        setRulerCurrent(coords)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // If currently dragging to size / orient an effect
    if (isDrawingEffect && drawOrigin) {
      const coords = getMapCoordinates(e.clientX, e.clientY, false)
      if (coords) {
        setDrawCurrent(coords)
      }
      return
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
      return
    }

    if (activeTool === 'ruler' && rulerStart) {
      const coords = getMapCoordinates(e.clientX, e.clientY, currentBattlemap?.snapToGrid, e.altKey)
      if (coords) {
        setRulerCurrent(coords)
      }
      return
    }

    // Token Dragging (Alt key bypasses grid snapping)
    if (draggingTokenId && currentBattlemap) {
      const coords = getMapCoordinates(e.clientX, e.clientY, currentBattlemap.snapToGrid, e.altKey)
      if (coords) {
        updateTokenOnBattlemap(campaign.id, currentBattlemap.id, draggingTokenId, {
          x: coords.x,
          y: coords.y
        })
      }
      return
    }
  }

  // Auto-delete temporary / one-shot effects (e.g. projectile detonations, instant bursts)
  const handleAutoDeleteEffect = useCallback((effectId: string) => {
    if (!currentBattlemap) return
    removeEffectFromBattlemap(campaign.id, currentBattlemap.id, effectId)
  }, [campaign.id, currentBattlemap, removeEffectFromBattlemap])

  const handleMouseUp = () => {
    // Finalize Interactive Effect Drawing
    if (isDrawingEffect && drawOrigin && drawCurrent && activeEffectTemplate && currentBattlemap) {
      const pxWidth = 1280
      const pxHeight = 800
      const dx = ((drawCurrent.x - drawOrigin.x) / 100) * pxWidth
      const dy = ((drawCurrent.y - drawOrigin.y) / 100) * pxHeight
      const distancePx = Math.hypot(dx, dy)

      const gridSize = currentBattlemap.gridSize || 64
      const unitFeet = currentBattlemap.gridUnitFeet || 5
      const pixelsPerFoot = gridSize / unitFeet
      const rawFeet = Math.max(5, Math.round(distancePx / pixelsPerFoot / 5) * 5)

      // Angle calculation: 0 deg points down in SVG cone coordinate space
      const angleRad = Math.atan2(dy, dx)
      const angleDeg = (angleRad * 180) / Math.PI
      const rotationDeg = Math.round((angleDeg - 90 + 360) % 360)

      // Single-click fallback if user clicked without dragging
      const isSingleClick = distancePx < 14
      const shape = activeEffectTemplate.shape || 'circle'

      let finalRadius: number | undefined = undefined
      let finalLength: number | undefined = undefined
      let finalWidth: number | undefined = activeEffectTemplate.widthFeet
      let finalRotation = 0

      if (shape === 'projectile') {
        finalRadius = activeEffectTemplate.radiusFeet || 20
      } else if (shape === 'circle') {
        finalRadius = isSingleClick ? (activeEffectTemplate.radiusFeet || 20) : rawFeet
      } else if (shape === 'cone' || shape === 'line') {
        finalLength = isSingleClick ? (activeEffectTemplate.lengthFeet || 30) : rawFeet
        finalRotation = isSingleClick ? 0 : rotationDeg
      } else {
        // square
        finalWidth = isSingleClick ? (activeEffectTemplate.widthFeet || 20) : rawFeet
      }

      const newFx = addEffectToBattlemap(campaign.id, currentBattlemap.id, {
        battlemapId: currentBattlemap.id,
        name: activeEffectTemplate.name,
        type: activeEffectTemplate.type,
        shape: activeEffectTemplate.shape,
        x: drawOrigin.x,
        y: drawOrigin.y,
        targetX: shape === 'projectile' ? (isSingleClick ? drawOrigin.x : drawCurrent.x) : undefined,
        targetY: shape === 'projectile' ? (isSingleClick ? drawOrigin.y : drawCurrent.y) : undefined,
        radiusFeet: finalRadius,
        lengthFeet: finalLength,
        widthFeet: finalWidth,
        rotationDeg: finalRotation,
        opacity: activeEffectTemplate.opacity ?? 0.85,
        isTemporary: activeEffectTemplate.isTemporary,
        durationMs: activeEffectTemplate.durationMs
      })

      setIsDrawingEffect(false)
      setDrawOrigin(null)
      setDrawCurrent(null)
      setActiveEffectTemplate(null)
      addToast(
        shape === 'projectile'
          ? `Fired ${newFx.name} at target!`
          : `Cast ${newFx.name} on battlemap`,
        'success'
      )
      return
    }

    setIsPanning(false)
    if (draggingTokenId) setDraggingTokenId(null)
  }

  // Calculate live measurement for active drawing preview
  const liveDrawMetrics = useMemo(() => {
    if (!isDrawingEffect || !drawOrigin || !drawCurrent || !activeEffectTemplate || !currentBattlemap) return null
    const pxWidth = 1280
    const pxHeight = 800
    const dx = ((drawCurrent.x - drawOrigin.x) / 100) * pxWidth
    const dy = ((drawCurrent.y - drawOrigin.y) / 100) * pxHeight
    const distancePx = Math.hypot(dx, dy)

    const gridSize = currentBattlemap.gridSize || 64
    const unitFeet = currentBattlemap.gridUnitFeet || 5
    const pixelsPerFoot = gridSize / unitFeet
    const rawFeet = Math.max(5, Math.round(distancePx / pixelsPerFoot / 5) * 5)

    const angleRad = Math.atan2(dy, dx)
    const angleDeg = (angleRad * 180) / Math.PI
    const rotationDeg = Math.round((angleDeg - 90 + 360) % 360)

    return {
      distancePx,
      feet: rawFeet,
      rotationDeg,
      squares: (rawFeet / unitFeet) * (activeEffectTemplate.shape === 'circle' ? 2 : 1)
    }
  }, [isDrawingEffect, drawOrigin, drawCurrent, activeEffectTemplate, currentBattlemap])

  // Calculate combat ruler distance in feet
  const rulerMeasurement = useMemo(() => {
    if (!rulerStart || !rulerCurrent || !currentBattlemap) return null
    const pxWidth = 1280
    const pxHeight = 800
    const dx = ((rulerCurrent.x - rulerStart.x) / 100) * pxWidth
    const dy = ((rulerCurrent.y - rulerStart.y) / 100) * pxHeight
    const pixelDistance = Math.hypot(dx, dy)

    const gridSize = currentBattlemap.gridSize || 64
    const unitFeet = currentBattlemap.gridUnitFeet || 5
    const cells = pixelDistance / gridSize
    const feet = Math.round(cells * unitFeet)

    return {
      pixelDistance,
      cells: Number(cells.toFixed(1)),
      feet
    }
  }, [rulerStart, rulerCurrent, currentBattlemap])

  // Selected Token object
  const selectedToken = currentBattlemap?.tokens.find(t => t.id === selectedTokenId)

  // Scale ratio for proportional scaling of token elements
  const currentGridSize = currentBattlemap?.gridSize || 64
  const scaleRatio = Math.max(0.4, Math.min(1.8, currentGridSize / 64))

  // Add party character token to battlemap
  const handleAddCharacterToken = (char: Dnd5eCharacter) => {
    if (!currentBattlemap) return
    const newToken = addTokenToBattlemap(campaign.id, currentBattlemap.id, {
      campaignId: campaign.id,
      battlemapId: currentBattlemap.id,
      name: char.name,
      avatarUrl: char.avatarUrl,
      x: 50,
      y: 50,
      size: 1,
      color: '#38bdf8',
      hpCurrent: char.hpCurrent,
      hpMax: char.hpMax,
      armorClass: char.armorClass,
      speed: char.speed,
      characterId: char.id,
      conditions: [],
      isEnemy: false
    })
    setSelectedTokenId(newToken.id)
    setShowAddTokenMenu(false)
    addToast(`Placed ${char.name} on battlemap`, 'success')
  }

  // Add custom character / monster token
  const handleAddCustomToken = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBattlemap || !tokenName.trim()) return

    const ringColor = tokenAlignment === 'hostile' ? '#ef4444' : tokenAlignment === 'neutral' ? '#10b981' : '#38bdf8'
    const isEnemy = tokenAlignment === 'hostile'

    let linkedCharId: string | undefined = undefined

    // Optionally create permanent campaign character sheet
    if (saveAsCampaignChar) {
      const createdChar = createCharacter(campaign.id, {
        name: tokenName.trim(),
        avatarUrl: tokenAvatarUrl.trim() || undefined,
        characterClass: isEnemy ? 'Monster / NPC' : 'Adventurer',
        race: 'Custom',
        level: 1,
        armorClass: Number(tokenAc) || 10,
        speed: 30,
        hpMax: Number(tokenHp) || 20,
        hpCurrent: Number(tokenHp) || 20,
        abilities: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10
        }
      })
      linkedCharId = createdChar.id
    }

    const newToken = addTokenToBattlemap(campaign.id, currentBattlemap.id, {
      campaignId: campaign.id,
      battlemapId: currentBattlemap.id,
      name: tokenName.trim(),
      avatarUrl: tokenAvatarUrl.trim() || undefined,
      x: 50,
      y: 50,
      size: tokenSize,
      color: ringColor,
      hpCurrent: Number(tokenHp) || 20,
      hpMax: Number(tokenHp) || 20,
      armorClass: Number(tokenAc) || 10,
      speed: 30,
      conditions: [],
      isEnemy: isEnemy,
      characterId: linkedCharId
    })

    setSelectedTokenId(newToken.id)
    setTokenName('')
    setTokenAvatarUrl('')
    setShowAddTokenMenu(false)
    addToast(`Spawned "${newToken.name}" on battlemap`, 'success')
  }

  // Arm effect for interactive drag-to-cast
  const handleSelectEffectToDraw = (template: typeof PRESET_EFFECTS[0] | any) => {
    setActiveEffectTemplate(template)
    setShowEffectsMenu(false)
    addToast(`Click & drag on the map to place ${template.name}`, 'info')
  }

  // Browse local image asset for token or map
  const handleBrowseTokenAvatar = async () => {
    if (window.oros) {
      const assetUrl = await window.oros.importAsset()
      if (assetUrl) {
        setTokenAvatarUrl(assetUrl)
        addToast('Imported local portrait', 'success')
      }
    } else {
      addToast('Local file import requires desktop app', 'warning')
    }
  }

  // Create or edit battlemap
  const handleCreateOrUpdateMap = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMapName.trim()) return
    const url = newMapUrl.trim() || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80'
    
    if (editingMapId) {
      updateBattlemap(campaign.id, editingMapId, {
        name: newMapName.trim(),
        imageUrl: url
      })
      addToast(`Updated battlemap "${newMapName.trim()}"`, 'success')
    } else {
      const created = createBattlemap(campaign.id, newMapName.trim(), url, {
        gridType: 'square',
        gridSize: 64,
        gridOpacity: 0.35,
        gridUnitFeet: 5,
        showCoordinates: true,
        snapToGrid: true
      })
      setActiveBattlemapId(created.id)
      addToast(`Created battlemap "${created.name}"`, 'success')
    }

    setShowNewMapModal(false)
    setEditingMapId(null)
    setNewMapName('')
    setNewMapUrl('')
  }

  const handleOpenEditMap = (bm: TTRPGBattlemap) => {
    setEditingMapId(bm.id)
    setNewMapName(bm.name)
    setNewMapUrl(bm.imageUrl)
    setShowNewMapModal(true)
    setShowMapDropdown(false)
  }

  const handleDirectImportMap = async () => {
    if (window.oros) {
      const assetUrl = await window.oros.importAsset()
      if (assetUrl) {
        setEditingMapId(null)
        setNewMapName(`Level ${campaignMaps.length + 1}`)
        setNewMapUrl(assetUrl)
        setShowNewMapModal(true)
        setShowMapDropdown(false)
      }
    } else {
      mapFileInputRef.current?.click()
    }
  }

  // Delete battlemap
  const handleDeleteMap = async (mapId: string, mapTitle: string) => {
    const ok = await confirmDialog({
      title: 'Delete Battlemap',
      message: `Delete "${mapTitle}" and all tokens placed on it?`,
      confirmText: 'Delete Battlemap',
      variant: 'danger'
    })
    if (ok) {
      deleteBattlemap(campaign.id, mapId)
      addToast(`Deleted battlemap "${mapTitle}"`, 'info')
    }
  }

  // Render Coordinate Labels for Grid
  const renderGridCoordinates = (size: number, width: number, height: number) => {
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

  // Hexagon Pattern Path Helper
  const getHexPatternPath = (size: number) => {
    const r = size / 2
    const w = Math.round(r * Math.sqrt(3))
    const h = r * 3
    return `M 0 ${r * 0.5} L ${w * 0.5} 0 L ${w} ${r * 0.5} L ${w} ${r * 1.5} L ${w * 0.5} ${r * 2} L 0 ${r * 1.5} Z M 0 ${r * 2} L ${w * 0.5} ${r * 2.5} L ${w * 0.5} ${h} M ${w} ${r * 2} L ${w * 0.5} ${r * 2.5}`
  }

  return (
    <div className="flex-1 flex flex-col bg-[#080b11] text-oros-100 overflow-hidden relative select-none font-sans">
      {/* ============================================================== */}
      {/* FLOATING TOP-LEFT MAP & LEVEL BAR                              */}
      {/* ============================================================== */}
      <div className="absolute top-3.5 left-4 z-40 flex items-center gap-1.5 flex-wrap max-w-[calc(100vw-220px)]">
        {/* Main Map Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMapDropdown(!showMapDropdown)
              setShowGridMenu(false)
              setShowAddTokenMenu(false)
              setShowEffectsMenu(false)
            }}
            className="px-2.5 py-1.5 rounded-[4px] bg-oros-900 hover:bg-oros-850 border border-oros-750 text-xs font-semibold text-oros-100 flex items-center gap-2 shadow-2xl transition-all group"
          >
            <MapIcon className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span className="font-serif max-w-[170px] truncate">{currentBattlemap?.name || 'Select Battlemap'}</span>
            <span className="text-[10px] font-mono font-bold text-oros-400 px-1 py-0.2 bg-oros-950 rounded border border-oros-800">
              {campaignMaps.findIndex(m => m.id === currentBattlemap?.id) + 1}/{campaignMaps.length}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-oros-400 transition-transform ${showMapDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showMapDropdown && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-10 w-72 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-2 z-50 text-xs space-y-2 animate-fade-in"
            >
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-oros-400 font-bold border-b border-oros-800 flex items-center justify-between">
                <span>Maps & Levels ({campaignMaps.length})</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDirectImportMap}
                    className="text-accent hover:underline flex items-center gap-1 normal-case font-sans cursor-pointer"
                    title="Import image from disk as new level"
                  >
                    <ImageIcon className="w-3 h-3" /> Load File
                  </button>
                  <button
                    onClick={() => {
                      setEditingMapId(null)
                      setNewMapName(`Level ${campaignMaps.length + 1}`)
                      setNewMapUrl('')
                      setShowNewMapModal(true)
                      setShowMapDropdown(false)
                    }}
                    className="text-accent hover:underline flex items-center gap-1 normal-case font-sans cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New
                  </button>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1">
                {campaignMaps.map((bm, idx) => (
                  <div
                    key={bm.id}
                    className={`w-full px-2 py-1.5 rounded-[3px] flex items-center justify-between transition-colors group/item ${
                      currentBattlemap?.id === bm.id ? 'bg-accent/20 text-accent font-semibold border border-accent/40' : 'text-oros-300 hover:bg-oros-950 hover:text-white border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveBattlemapId(bm.id)
                        setShowMapDropdown(false)
                      }}
                      className="flex-1 text-left truncate flex items-center gap-2"
                    >
                      <span className="text-[10px] font-mono font-bold text-oros-500 w-4">{idx + 1}.</span>
                      <MapIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span className="truncate">{bm.name}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEditMap(bm)
                        }}
                        className="text-oros-400 hover:text-white p-1"
                        title="Edit map name or image"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      {campaignMaps.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMap(bm.id, bm.name)
                          }}
                          className="text-oros-400 hover:text-rose-400 p-1"
                          title="Delete level"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {linkedWorldMaps.length > 0 && (
                  <>
                    <div className="px-2 pt-2 pb-0.5 text-[10px] font-mono uppercase text-oros-500 font-bold border-t border-oros-800 mt-1">
                      Linked World Maps
                    </div>
                    {linkedWorldMaps.map((wm) => (
                      <div
                        key={`wm-${wm.id}`}
                        className="w-full px-2 py-1.5 rounded-[3px] flex items-center gap-2 text-oros-400 hover:bg-oros-950 hover:text-white transition-colors"
                      >
                        <MapIcon className="w-3 h-3 opacity-60 shrink-0" />
                        <span className="truncate">[Atlas] {wm.name}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Level Switcher Tabs (if multiple maps) */}
        {campaignMaps.length > 1 && (
          <div className="flex items-center gap-1 p-0.5 bg-oros-900/90 border border-oros-750 rounded-[4px] shadow-2xl backdrop-blur-sm">
            {campaignMaps.map((bm, idx) => (
              <button
                key={`lvl-tab-${bm.id}`}
                onClick={() => setActiveBattlemapId(bm.id)}
                className={`px-2 py-1 rounded-[3px] text-xs font-mono transition-all flex items-center gap-1.5 ${
                  currentBattlemap?.id === bm.id
                    ? 'bg-accent text-accent-contrast font-bold shadow-sm'
                    : 'text-oros-400 hover:text-white hover:bg-oros-850'
                }`}
                title={`Switch to ${bm.name}`}
              >
                <span>Lvl {idx + 1}</span>
                <span className="max-w-[75px] truncate text-[10px] opacity-80">{bm.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick Level Actions */}
        <div className="flex items-center gap-1 p-0.5 bg-oros-900/90 border border-oros-750 rounded-[4px] shadow-2xl backdrop-blur-sm">
          <button
            onClick={() => {
              setEditingMapId(null)
              setNewMapName(`Level ${campaignMaps.length + 1}`)
              setNewMapUrl('')
              setShowNewMapModal(true)
            }}
            className="px-2 py-1 rounded-[3px] text-oros-300 hover:text-white hover:bg-oros-850 text-xs font-mono flex items-center gap-1 transition-colors"
            title="Add a new level or map"
          >
            <Plus className="w-3 h-3 text-accent" />
            <span className="hidden sm:inline">Add Level</span>
          </button>

          <button
            onClick={handleDirectImportMap}
            className="px-2 py-1 rounded-[3px] text-oros-300 hover:text-white hover:bg-oros-850 text-xs font-mono flex items-center gap-1 transition-colors"
            title="Load local map image file"
          >
            <ImageIcon className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Load Map</span>
          </button>

          {currentBattlemap && (
            <button
              onClick={() => handleOpenEditMap(currentBattlemap)}
              className="p-1 rounded-[3px] text-oros-400 hover:text-white hover:bg-oros-850 transition-colors"
              title="Edit current map settings or change image"
            >
              <Settings className="w-3 h-3" />
            </button>
          )}

          {/* Quick Clear Effects Button if any effects on current map */}
          {(currentBattlemap?.effects || []).length > 0 && (
            <button
              onClick={() => {
                if (currentBattlemap) {
                  clearAllEffectsOnBattlemap(campaign.id, currentBattlemap.id)
                  addToast(`Cleared all effects on "${currentBattlemap.name}"`, 'info')
                }
              }}
              className="px-2 py-1 rounded-[3px] bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] font-mono flex items-center gap-1 transition-colors"
              title="Clear all active effects from this battlemap"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Clear Effects ({currentBattlemap.effects?.length || 0})</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* FLOATING LEFT TACTICAL DOCK                                    */}
      {/* ============================================================== */}
      <div className="absolute top-16 left-4 z-40 flex flex-col items-center gap-1.5 p-1 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl">
        {/* Pan / Move Tool */}
        <button
          onClick={() => {
            setActiveTool('pan')
            setActiveEffectTemplate(null)
          }}
          className={`p-2 rounded-[3px] transition-colors relative group ${
            activeTool === 'pan' && !activeEffectTemplate
              ? 'bg-accent text-accent-contrast shadow-sm'
              : 'text-oros-400 hover:text-white hover:bg-oros-850'
          }`}
          title="Pan / Select Tool (V)"
        >
          <Move className="w-4 h-4" />
          <span className="absolute left-12 px-2 py-0.5 rounded bg-oros-950 border border-oros-750 text-[10px] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono z-50 shadow-lg">
            Pan Canvas (V)
          </span>
        </button>

        {/* Combat Ruler Tool */}
        <button
          onClick={() => {
            setActiveTool('ruler')
            setActiveEffectTemplate(null)
          }}
          className={`p-2 rounded-[3px] transition-colors relative group ${
            activeTool === 'ruler'
              ? 'bg-accent text-accent-contrast shadow-sm'
              : 'text-oros-400 hover:text-white hover:bg-oros-850'
          }`}
          title="Combat Ruler: Measure Movement & Range (R)"
        >
          <Ruler className="w-4 h-4" />
          <span className="absolute left-12 px-2 py-0.5 rounded bg-oros-950 border border-oros-750 text-[10px] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono z-50 shadow-lg">
            Measure Range (R)
          </span>
        </button>

        {/* Tactical Grid Settings Button */}
        <button
          onClick={() => {
            setShowGridMenu(!showGridMenu)
            setShowAddTokenMenu(false)
            setShowEffectsMenu(false)
            setShowMapDropdown(false)
          }}
          className={`p-2 rounded-[3px] transition-colors relative group ${
            showGridMenu
              ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
              : 'text-oros-400 hover:text-white hover:bg-oros-850'
          }`}
          title="Grid Configuration & Snapping"
        >
          <Hash className="w-4 h-4" />
          <span className="absolute left-12 px-2 py-0.5 rounded bg-oros-950 border border-oros-750 text-[10px] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono z-50 shadow-lg">
            Grid & Snapping
          </span>
        </button>

        {/* Add Token Button */}
        <button
          onClick={() => {
            setShowAddTokenMenu(!showAddTokenMenu)
            setShowGridMenu(false)
            setShowEffectsMenu(false)
            setShowMapDropdown(false)
          }}
          className={`p-2 rounded-[3px] transition-colors relative group ${
            showAddTokenMenu
              ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
              : 'text-oros-400 hover:text-white hover:bg-oros-850'
          }`}
          title="Spawn Character Token or Monster"
        >
          <UserPlus className="w-4 h-4" />
          <span className="absolute left-12 px-2 py-0.5 rounded bg-oros-950 border border-oros-750 text-[10px] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono z-50 shadow-lg">
            Add Combat Token
          </span>
        </button>

        {/* Map Effects & Spell Templates Tool */}
        <button
          onClick={() => {
            setShowEffectsMenu(!showEffectsMenu)
            setShowGridMenu(false)
            setShowAddTokenMenu(false)
            setShowMapDropdown(false)
          }}
          className={`p-2 rounded-[3px] transition-colors relative group ${
            showEffectsMenu || activeEffectTemplate
              ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
              : 'text-oros-400 hover:text-accent hover:bg-oros-850'
          }`}
          title="Draw Spell & Environmental Effects (Fireball, Fog Cloud, Cones, Lines)"
        >
          <Sparkles className="w-4 h-4" />
          <span className="absolute left-12 px-2 py-0.5 rounded bg-oros-950 border border-oros-750 text-[10px] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono z-50 shadow-lg">
            Draw Spell Effects
          </span>
        </button>

        {/* 3D Animated Polyhedral Dice Roller */}
        <button
          onClick={() => setIsDiceOpen(!isDiceOpen)}
          className={`p-2 rounded-[3px] transition-colors relative group ${
            isDiceOpen
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-oros-400 hover:text-amber-300 hover:bg-oros-850'
          }`}
          title="Interactive 3D Polyhedral Dice Roller (D)"
        >
          <Dices className="w-4 h-4 text-accent" />
          <span className="absolute left-12 px-2 py-0.5 rounded bg-oros-950 border border-oros-750 text-[10px] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono z-50 shadow-lg">
            Dice Roller (D)
          </span>
        </button>

        <div className="w-6 h-px bg-oros-800 my-0.5" />

        {/* Zoom Controls */}
        <button
          onClick={() => setZoom((prev) => Math.min(4, prev * 1.2))}
          className="p-2 rounded-[3px] text-oros-400 hover:text-white hover:bg-oros-850 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoom((prev) => Math.max(0.25, prev * 0.83))}
          className="p-2 rounded-[3px] text-oros-400 hover:text-white hover:bg-oros-850 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
          className="p-2 rounded-[3px] text-oros-400 hover:text-white hover:bg-oros-850 transition-colors"
          title="Reset Viewport"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <span className="text-[9px] font-mono text-oros-500 font-bold py-0.5">
          {Math.round(zoom * 100)}%
        </span>

        <div className="w-6 h-px bg-oros-800 my-0.5" />

        {/* Global Settings */}
        <button
          type="button"
          onClick={() => openSettings()}
          className="p-2 rounded-[3px] text-oros-400 hover:text-white hover:bg-oros-850 transition-colors relative group"
          title="Settings & Preferences (Ctrl+,)"
        >
          <Settings className="w-3.5 h-3.5 text-oros-400 group-hover:text-white" />
          <span className="absolute left-12 px-2 py-0.5 rounded bg-oros-950 border border-oros-750 text-[10px] text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono z-50 shadow-lg">
            Settings (Ctrl+,)
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SOLID OROS GRID SETTINGS POPOVER                               */}
      {/* ============================================================== */}
      {showGridMenu && currentBattlemap && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute left-16 top-28 w-72 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-4 z-40 text-xs font-sans space-y-3.5 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-oros-800 pb-2.5">
            <span className="font-semibold text-white flex items-center gap-2 font-serif text-sm">
              <Hash className="w-4 h-4 text-accent" />
              Tactical Grid Controls
            </span>
            <button
              onClick={() => setShowGridMenu(false)}
              className="text-oros-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid Type: Square vs Hex */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1">Grid Pattern</label>
            <div className="grid grid-cols-2 gap-1 bg-oros-950 p-1 rounded-[3px] border border-oros-800">
              <button
                type="button"
                onClick={() => handleUpdateCurrentMap({ gridType: 'square' })}
                className={`py-1 text-center font-mono text-xs rounded-[2px] transition-colors ${
                  currentBattlemap.gridType === 'square'
                    ? 'bg-accent/25 text-accent font-bold border border-accent/40'
                    : 'text-oros-400 hover:text-white'
                }`}
              >
                Square (5ft)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateCurrentMap({ gridType: 'hex' })}
                className={`py-1 text-center font-mono text-xs rounded-[2px] transition-colors ${
                  currentBattlemap.gridType === 'hex'
                    ? 'bg-accent/25 text-accent font-bold border border-accent/40'
                    : 'text-oros-400 hover:text-white'
                }`}
              >
                Hexagonal
              </button>
            </div>
          </div>

          {/* Grid Size Stepper & Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono uppercase text-oros-400 font-bold">Cell Dimension</label>
              <span className="font-mono text-accent text-xs font-bold">{currentBattlemap.gridSize || 64}px</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdateCurrentMap({ gridSize: Math.max(16, (currentBattlemap.gridSize || 64) - 4) })}
                className="w-7 h-6 rounded-[2px] bg-oros-950 hover:bg-oros-850 hover:text-accent text-white border border-oros-800 flex items-center justify-center font-bold font-mono text-sm"
              >
                -
              </button>
              <input
                type="range"
                min="16"
                max="256"
                step="2"
                value={currentBattlemap.gridSize || 64}
                onChange={(e) => handleUpdateCurrentMap({ gridSize: Number(e.target.value) })}
                className="flex-1 accent-accent h-1.5 bg-oros-950 rounded cursor-pointer"
              />
              <button
                type="button"
                onClick={() => handleUpdateCurrentMap({ gridSize: Math.min(256, (currentBattlemap.gridSize || 64) + 4) })}
                className="w-7 h-6 rounded-[2px] bg-oros-950 hover:bg-oros-850 hover:text-accent text-white border border-oros-800 flex items-center justify-center font-bold font-mono text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1">Quick Presets</label>
            <div className="grid grid-cols-5 gap-1">
              {[32, 48, 64, 80, 96].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleUpdateCurrentMap({ gridSize: sz })}
                  className={`py-1 rounded-[2px] text-[10px] font-mono border transition-colors ${
                    (currentBattlemap.gridSize || 64) === sz
                      ? 'bg-accent/25 border-accent text-accent font-bold'
                      : 'bg-oros-950 border-oros-800 text-oros-400 hover:text-white hover:bg-oros-850'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>

          {/* Grid Opacity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono uppercase text-oros-400 font-bold">Grid Opacity</label>
              <span className="font-mono text-oros-200 text-[11px] font-bold">{Math.round((currentBattlemap.gridOpacity ?? 0.35) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={currentBattlemap.gridOpacity ?? 0.35}
              onChange={(e) => handleUpdateCurrentMap({ gridOpacity: Number(e.target.value) })}
              className="w-full accent-accent h-1.5 bg-oros-950 rounded cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-oros-800">
            <button
              type="button"
              onClick={() => handleUpdateCurrentMap({ snapToGrid: !currentBattlemap.snapToGrid })}
              title={currentBattlemap.snapToGrid ? 'Snap to grid is ON (Hold Alt while dragging token to bypass)' : 'Snap to grid is OFF'}
              className={`p-1.5 rounded-[3px] border flex items-center justify-center gap-1.5 text-xs font-mono transition-colors ${
                currentBattlemap.snapToGrid
                  ? 'bg-accent-muted border-accent/40 text-accent font-bold'
                  : 'bg-oros-950 border-oros-800 text-oros-400'
              }`}
            >
              <Magnet className="w-3 h-3" />
              <span>Snap: {currentBattlemap.snapToGrid ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateCurrentMap({ showCoordinates: !currentBattlemap.showCoordinates })}
              className={`p-1.5 rounded-[3px] border flex items-center justify-center gap-1.5 text-xs font-mono transition-colors ${
                currentBattlemap.showCoordinates
                  ? 'bg-accent-muted border-accent/40 text-accent font-bold'
                  : 'bg-oros-950 border-oros-800 text-oros-400'
              }`}
            >
              <span>Coords: {currentBattlemap.showCoordinates ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SOLID OROS ADD TOKEN POPOVER                                   */}
      {/* ============================================================== */}
      {showAddTokenMenu && currentBattlemap && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute left-16 top-32 w-84 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-4 z-40 text-xs font-sans space-y-3.5 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-oros-800 pb-2.5">
            <span className="font-semibold text-white flex items-center gap-2 font-serif text-sm">
              <UserPlus className="w-4 h-4 text-accent" />
              Deploy Combat Token
            </span>
            <button
              onClick={() => setShowAddTokenMenu(false)}
              className="text-oros-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-oros-950 p-1 rounded-[3px] border border-oros-800">
            <button
              type="button"
              onClick={() => setAddTokenTab('party')}
              className={`py-1 text-center font-medium text-xs rounded-[2px] transition-colors ${
                addTokenTab === 'party'
                  ? 'bg-accent/25 text-accent font-bold border border-accent/40'
                  : 'text-oros-400 hover:text-white'
              }`}
            >
              Party Roster ({campaignCharacters.length})
            </button>
            <button
              type="button"
              onClick={() => setAddTokenTab('custom')}
              className={`py-1 text-center font-medium text-xs rounded-[2px] transition-colors ${
                addTokenTab === 'custom'
                  ? 'bg-accent/25 text-accent font-bold border border-accent/40'
                  : 'text-oros-400 hover:text-white'
              }`}
            >
              Custom / Monster
            </button>
          </div>

          {/* TAB 1: Party Adventurers */}
          {addTokenTab === 'party' ? (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {campaignCharacters.length === 0 ? (
                <div className="p-4 text-center text-oros-400 italic space-y-1">
                  <p>No party characters yet.</p>
                  <p className="text-[10px]">Switch to "Custom / Monster" to spawn tokens.</p>
                </div>
              ) : (
                campaignCharacters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => handleAddCharacterToken(char)}
                    className="w-full px-2.5 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 border border-oros-800 hover:border-accent text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-oros-900 border border-oros-700 flex items-center justify-center overflow-hidden shrink-0">
                        <SafeTokenAvatar src={char.avatarUrl} name={char.name} isEnemy={false} fontSize={10} />
                      </div>
                      <div>
                        <span className="font-semibold text-oros-100 group-hover:text-white leading-tight block">
                          {char.name}
                        </span>
                        <span className="text-[10px] text-oros-400 font-mono">
                          HP {char.hpCurrent}/{char.hpMax} • AC {char.armorClass}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-accent font-semibold group-hover:underline">+ Deploy</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* TAB 2: Custom Character / Monster Spawner */
            <form onSubmit={handleAddCustomToken} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1">Token Name</label>
                <input
                  type="text"
                  required
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. Iron Golem, Sea Hag, Bandit..."
                  className="w-full px-2.5 py-1.5 bg-oros-950 border border-oros-800 rounded-[3px] text-xs text-white placeholder-oros-600 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Preset Fantasy Avatars Selector */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1">Preset Portrait / Avatar</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTokenAvatarUrl(preset.url)}
                      className={`p-1 rounded-[3px] border flex flex-col items-center gap-0.5 transition-all ${
                        tokenAvatarUrl === preset.url
                          ? 'border-accent bg-accent/25 ring-1 ring-accent'
                          : 'border-oros-800 bg-oros-950 hover:border-oros-700'
                      }`}
                      title={preset.name}
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-oros-700">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-sans text-oros-300 truncate w-full text-center">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Image URL & Local Browse */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1">Custom Avatar URL or Local File</label>
                <div className="flex gap-1.5">
                  <input
                    type="url"
                    value={tokenAvatarUrl}
                    onChange={(e) => setTokenAvatarUrl(e.target.value)}
                    placeholder="https://... or paste link"
                    className="flex-1 px-2 py-1 bg-oros-950 border border-oros-800 rounded-[3px] text-[11px] text-white placeholder-oros-600 focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseTokenAvatar}
                    className="px-2.5 py-1 bg-oros-950 hover:bg-oros-850 text-oros-200 border border-oros-800 rounded-[3px] text-xs font-medium shrink-0"
                    title="Import local photo from disk"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Token Size & Alignment */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1">Token Size</label>
                  <select
                    value={tokenSize}
                    onChange={(e) => setTokenSize(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-oros-950 border border-oros-800 rounded-[3px] text-xs text-white"
                  >
                    <option value={1}>Medium (1x1 sq)</option>
                    <option value={2}>Large (2x2 sq)</option>
                    <option value={3}>Huge (3x3 sq)</option>
                    <option value={4}>Gargantuan (4x4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1">Alignment / Ring</label>
                  <select
                    value={tokenAlignment}
                    onChange={(e) => setTokenAlignment(e.target.value as any)}
                    className="w-full px-2 py-1 bg-oros-950 border border-oros-800 rounded-[3px] text-xs text-white"
                  >
                    <option value="hostile">Hostile / Red</option>
                    <option value="hero">Player Hero / Blue</option>
                    <option value="neutral">Neutral / Green</option>
                  </select>
                </div>
              </div>

              {/* HP and AC */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-oros-400 uppercase font-bold">HP Max</label>
                  <input
                    type="number"
                    min="1"
                    value={tokenHp}
                    onChange={(e) => setTokenHp(Number(e.target.value))}
                    className="w-full px-2 py-0.5 text-xs bg-oros-950 border border-oros-800 rounded-[3px] font-mono text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-oros-400 uppercase font-bold">Armor Class</label>
                  <input
                    type="number"
                    min="1"
                    value={tokenAc}
                    onChange={(e) => setTokenAc(Number(e.target.value))}
                    className="w-full px-2 py-0.5 text-xs bg-oros-950 border border-oros-800 rounded-[3px] font-mono text-sky-400"
                  />
                </div>
              </div>

              {/* Option to also save as campaign character */}
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-oros-300">
                <input
                  type="checkbox"
                  checked={saveAsCampaignChar}
                  onChange={(e) => setSaveAsCampaignChar(e.target.checked)}
                  className="rounded bg-oros-950 border-oros-800 text-accent"
                />
                <span className="text-[11px]">Save as permanent campaign character</span>
              </label>

              <button
                type="submit"
                disabled={!tokenName.trim()}
                className="w-full py-1.5 rounded-[3px] btn-accent font-semibold text-xs transition-colors disabled:opacity-40 shadow-sm"
              >
                Spawn Token on Battlemap
              </button>
            </form>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SOLID OROS SPELLCASTING MODAL (GRIMOIRE & CUSTOM SPELLS)        */}
      {/* ============================================================== */}
      {showEffectsMenu && currentBattlemap && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute left-16 top-20 w-80 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-3.5 z-40 text-xs font-sans space-y-3 animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-oros-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-serif font-bold text-sm text-white">Cast Spell</h3>
            </div>
            <button
              onClick={() => setShowEffectsMenu(false)}
              className="text-oros-400 hover:text-white p-1 rounded hover:bg-oros-850 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="flex p-0.5 rounded-[3px] bg-oros-950 border border-oros-800">
            <button
              type="button"
              onClick={() => setEffectsMenuTab('presets')}
              className={`flex-1 py-1 text-center font-mono text-[10px] uppercase font-bold rounded-[2px] transition-colors ${
                effectsMenuTab === 'presets'
                  ? 'bg-oros-850 text-white shadow-sm'
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              Grimoire
            </button>
            <button
              type="button"
              onClick={() => setEffectsMenuTab('custom')}
              className={`flex-1 py-1 text-center font-mono text-[10px] uppercase font-bold rounded-[2px] transition-colors ${
                effectsMenuTab === 'custom'
                  ? 'bg-oros-850 text-white shadow-sm'
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              Custom
            </button>
            <button
              type="button"
              onClick={() => setEffectsMenuTab('active')}
              className={`flex-1 py-1 text-center font-mono text-[10px] uppercase font-bold rounded-[2px] transition-colors ${
                effectsMenuTab === 'active'
                  ? 'bg-oros-850 text-white shadow-sm'
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              Active ({(currentBattlemap.effects || []).length})
            </button>
          </div>

          {/* TAB 1: GRIMOIRE / SPELLS */}
          {effectsMenuTab === 'presets' && (
            <div className="space-y-2">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[9px] font-mono scrollbar-none">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'fire', label: 'Fire' },
                  { id: 'lightning', label: 'Lightning' },
                  { id: 'ice', label: 'Frost' },
                  { id: 'arcane', label: 'Arcane' },
                  { id: 'radiance', label: 'Radiant' },
                  { id: 'poison', label: 'Poison' },
                  { id: 'darkness', label: 'Void' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setPresetFilter(cat.id as any)}
                    className={`px-2 py-0.5 rounded-[2px] whitespace-nowrap transition-colors ${
                      presetFilter === cat.id
                        ? 'bg-accent text-accent-contrast font-bold'
                        : 'bg-oros-950 text-oros-400 hover:text-white border border-oros-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Spells List */}
              <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
                {PRESET_EFFECTS
                  .filter(p => presetFilter === 'all' || p.type === presetFilter)
                  .map((spell) => (
                    <button
                      key={spell.name}
                      type="button"
                      onClick={() => handleSelectEffectToDraw(spell)}
                      className="w-full px-2.5 py-1.5 rounded-[3px] bg-oros-950 hover:bg-oros-850 border border-oros-800/80 hover:border-accent text-left transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-5 h-5 rounded-[2px] bg-oros-900 flex items-center justify-center shrink-0 border border-oros-750">
                          {spell.type === 'fire' && <Flame className="w-3 h-3 text-orange-400" />}
                          {spell.type === 'smoke' && <Cloud className="w-3 h-3 text-slate-300" />}
                          {spell.type === 'poison' && <Skull className="w-3 h-3 text-emerald-400" />}
                          {spell.type === 'lightning' && <Zap className="w-3 h-3 text-indigo-400" />}
                          {spell.type === 'ice' && <Snowflake className="w-3 h-3 text-cyan-400" />}
                          {spell.type === 'radiance' && <Sparkles className="w-3 h-3 text-amber-300" />}
                          {spell.type === 'darkness' && <Shield className="w-3 h-3 text-purple-400" />}
                          {spell.type === 'arcane' && <Sparkles className="w-3 h-3 text-purple-400" />}
                          {spell.type === 'web' && <Wind className="w-3 h-3 text-slate-400" />}
                        </div>
                        <div className="truncate">
                          <span className="font-medium text-oros-100 group-hover:text-white block leading-tight truncate">
                            {spell.name}
                          </span>
                          <span className="text-[9px] text-oros-500 font-mono block leading-none mt-0.5">
                            {spell.shape === 'projectile' ? 'Projectile' : spell.shape === 'circle' ? 'Sphere' : spell.shape === 'cone' ? 'Cone' : 'Line'} • {spell.radiusFeet || spell.lengthFeet || spell.widthFeet} ft
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-accent opacity-0 group-hover:opacity-100 transition-opacity font-semibold ml-2 shrink-0">
                        Cast →
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM SPELL */}
          {effectsMenuTab === 'custom' && (
            <div className="space-y-3 pt-0.5">
              {/* Element Selector */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1.5">
                  Element
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'fire', label: 'Fire', icon: Flame, color: 'text-orange-400' },
                    { id: 'lightning', label: 'Lightning', icon: Zap, color: 'text-indigo-400' },
                    { id: 'ice', label: 'Frost', icon: Snowflake, color: 'text-cyan-400' },
                    { id: 'arcane', label: 'Arcane', icon: Sparkles, color: 'text-purple-400' },
                    { id: 'radiance', label: 'Radiant', icon: Sparkles, color: 'text-amber-300' },
                    { id: 'poison', label: 'Poison', icon: Skull, color: 'text-emerald-400' },
                    { id: 'darkness', label: 'Void', icon: Shield, color: 'text-purple-400' },
                    { id: 'smoke', label: 'Mist', icon: Cloud, color: 'text-slate-300' }
                  ].map((elem) => {
                    const Icon = elem.icon
                    const isSelected = effectType === elem.id
                    return (
                      <button
                        key={elem.id}
                        type="button"
                        onClick={() => setEffectType(elem.id as BattlemapEffectType)}
                        className={`px-1.5 py-1.5 rounded-[3px] border flex items-center justify-center gap-1.5 transition-colors ${
                          isSelected
                            ? 'bg-accent/20 border-accent text-white font-bold'
                            : 'bg-oros-950 border-oros-800 text-oros-400 hover:text-white hover:bg-oros-850'
                        }`}
                      >
                        <Icon className={`w-3 h-3 ${elem.color}`} />
                        <span className="text-[10px] font-mono">{elem.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Shape / Delivery Mode */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-oros-400 font-bold mb-1.5">
                  Shape & Delivery
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'projectile', label: 'Missile' },
                    { id: 'circle', label: 'Sphere' },
                    { id: 'cone', label: 'Cone' },
                    { id: 'line', label: 'Line' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setEffectShape(s.id as BattlemapEffectShape)}
                      className={`py-1.5 rounded-[3px] border text-center font-mono text-[10px] transition-colors ${
                        effectShape === s.id
                          ? 'bg-accent text-accent-contrast border-accent font-bold'
                          : 'bg-oros-950 border-oros-800 text-oros-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size / Radius / Length */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-oros-300 font-bold mb-1">
                  <span>{effectShape === 'cone' || effectShape === 'line' ? 'Length' : 'Radius'}:</span>
                  <span className="text-accent font-bold">
                    {effectShape === 'cone' || effectShape === 'line' ? `${effectLengthFeet} ft` : `${effectRadiusFeet} ft (${effectRadiusFeet * 2} ft across)`}
                  </span>
                </div>
                
                {/* Quick Chips for fast sizing */}
                <div className="flex items-center gap-1 mb-1.5">
                  {[15, 20, 30, 40, 60, 100].map((ft) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => {
                        if (effectShape === 'cone' || effectShape === 'line') {
                          setEffectLengthFeet(ft)
                        } else {
                          setEffectRadiusFeet(ft)
                        }
                      }}
                      className={`flex-1 py-0.5 rounded-[2px] text-[9px] font-mono font-bold border transition-colors ${
                        (effectShape === 'cone' || effectShape === 'line' ? effectLengthFeet : effectRadiusFeet) === ft
                          ? 'bg-accent/20 text-accent border-accent'
                          : 'bg-oros-950 border-oros-800 text-oros-400 hover:text-white'
                      }`}
                    >
                      {ft}ft
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={effectShape === 'cone' || effectShape === 'line' ? effectLengthFeet : effectRadiusFeet}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (effectShape === 'cone' || effectShape === 'line') {
                      setEffectLengthFeet(val)
                    } else {
                      setEffectRadiusFeet(val)
                    }
                  }}
                  className="w-full accent-accent h-1.5 bg-oros-950 rounded cursor-pointer"
                />
              </div>

              {/* Persistence Toggle */}
              <label className="flex items-center gap-2 text-oros-300 cursor-pointer text-xs pt-1">
                <input
                  type="checkbox"
                  checked={!effectIsTemporary}
                  onChange={(e) => setEffectIsTemporary(!e.target.checked)}
                  className="rounded bg-oros-950 border-oros-800 text-accent cursor-pointer"
                />
                <span className="text-[11px] font-sans">Persistent Hazard / Concentration Zone</span>
              </label>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  handleSelectEffectToDraw({
                    name: `${effectType.charAt(0).toUpperCase() + effectType.slice(1)} ${effectShape === 'projectile' ? 'Missile' : effectShape === 'circle' ? 'Burst' : effectShape.charAt(0).toUpperCase() + effectShape.slice(1)}`,
                    type: effectType,
                    shape: effectShape,
                    radiusFeet: effectRadiusFeet,
                    lengthFeet: effectLengthFeet,
                    widthFeet: effectWidthFeet,
                    opacity: effectOpacity,
                    isTemporary: effectIsTemporary,
                    durationMs: 3200
                  })
                }}
                className="w-full py-2 rounded-[3px] btn-accent font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                <span>Cast on Map</span>
              </button>
            </div>
          )}

          {/* TAB 3: ACTIVE EFFECTS & CLEAR ALL */}
          {effectsMenuTab === 'active' && (
            <div className="space-y-2.5 pt-0.5">
              {(currentBattlemap.effects || []).length === 0 ? (
                <div className="p-6 text-center text-oros-400 italic space-y-1">
                  <p>No active effects on this map.</p>
                  <p className="text-[10px] text-oros-500 font-sans">Cast spells from Grimoire or Custom to place effects.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-1.5 border-b border-oros-800">
                    <span className="text-[10px] font-mono text-oros-400 uppercase font-bold">
                      Active Spell Effects ({(currentBattlemap.effects || []).length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearAllEffectsOnBattlemap(campaign.id, currentBattlemap.id)
                        addToast(`Cleared all active effects`, 'info')
                      }}
                      className="text-rose-400 hover:text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Clear All
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                    {(currentBattlemap.effects || []).map((fx) => (
                      <div
                        key={fx.id}
                        className="px-2.5 py-1.5 rounded-[3px] bg-oros-950 border border-oros-800 flex items-center justify-between text-xs group"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-oros-100 block truncate">
                            {fx.name || fx.type.toUpperCase()}
                          </span>
                          <span className="text-[9px] font-mono text-oros-400 block mt-0.5">
                            {fx.shape} • {fx.radiusFeet || fx.lengthFeet || 20}ft {fx.isTemporary ? '• Temporary' : '• Persistent'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            removeEffectFromBattlemap(campaign.id, currentBattlemap.id, fx.id)
                            addToast(`Removed ${fx.name || 'effect'}`, 'info')
                          }}
                          className="p-1 text-oros-500 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                          title="Remove effect"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TACTICAL MAP CANVAS VIEWPORT                                   */}
      {/* ============================================================== */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 relative overflow-hidden bg-[#05070a] ${
          activeEffectTemplate ? 'cursor-crosshair' : isPanning || isSpacePressed ? 'cursor-grab active:cursor-grabbing' : activeTool === 'ruler' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        {currentBattlemap ? (
          <div
            ref={mapElementRef}
            className="absolute top-1/2 left-1/2 transition-transform duration-75 origin-center"
            style={{
              width: '1280px',
              height: '800px',
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95)'
            }}
          >
            {/* Base Battlemap Artwork */}
            <img
              src={currentBattlemap.imageUrl}
              alt={currentBattlemap.name}
              className="w-full h-full object-cover rounded-[3px] border border-oros-800 pointer-events-none select-none"
            />

            {/* SVG Tactical Grid Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <pattern
                  id="ttrpg-square-grid"
                  width={currentBattlemap.gridSize || 64}
                  height={currentBattlemap.gridSize || 64}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${currentBattlemap.gridSize || 64} 0 L 0 0 0 ${currentBattlemap.gridSize || 64}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </pattern>
                {(() => {
                  const sz = currentBattlemap.gridSize || 64
                  const r = sz / 2
                  const w = Math.round(r * Math.sqrt(3))
                  const h = r * 3
                  return (
                    <pattern id="ttrpg-hex-grid" width={w} height={h} patternUnits="userSpaceOnUse">
                      <path d={getHexPatternPath(sz)} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                    </pattern>
                  )
                })()}
              </defs>

              {/* Grid Layer */}
              <rect
                width="1280"
                height="800"
                fill={`url(#${currentBattlemap.gridType === 'square' ? 'ttrpg-square-grid' : 'ttrpg-hex-grid'})`}
                className="text-white"
                style={{ opacity: currentBattlemap.gridOpacity ?? 0.35 }}
              />

              {/* Coordinates (A1, B2...) */}
              {currentBattlemap.showCoordinates &&
                currentBattlemap.gridType === 'square' &&
                renderGridCoordinates(currentBattlemap.gridSize || 64, 1280, 800)}

              {/* Combat Movement Ruler Line */}
              {activeTool === 'ruler' && rulerStart && rulerCurrent && (
                <g className="pointer-events-none">
                  <line
                    x1={(rulerStart.x / 100) * 1280}
                    y1={(rulerStart.y / 100) * 800}
                    x2={(rulerCurrent.x / 100) * 1280}
                    y2={(rulerCurrent.y / 100) * 800}
                    stroke={rulerMeasurement && rulerMeasurement.feet <= 30 ? '#10b981' : rulerMeasurement && rulerMeasurement.feet <= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray="5 4"
                  />
                  <circle
                    cx={(rulerStart.x / 100) * 1280}
                    cy={(rulerStart.y / 100) * 800}
                    r="4"
                    fill="#10b981"
                  />
                  <circle
                    cx={(rulerCurrent.x / 100) * 1280}
                    cy={(rulerCurrent.y / 100) * 800}
                    r="5"
                    fill={rulerMeasurement && rulerMeasurement.feet <= 30 ? '#10b981' : '#f59e0b'}
                  />
                </g>
              )}
            </svg>

            {/* ANIMATED SPELL & ENVIRONMENTAL VFX LAYER */}
            {(currentBattlemap.effects || []).map((fx) => (
              <AnimatedMapEffect
                key={fx.id}
                effect={fx}
                gridSize={currentBattlemap.gridSize || 64}
                gridUnitFeet={currentBattlemap.gridUnitFeet || 5}
                isSelected={selectedEffectId === fx.id}
                onSelect={() => setSelectedEffectId(fx.id)}
                onAutoDelete={handleAutoDeleteEffect}
              />
            ))}

            {/* LIVE DRAWING PREVIEW GHOST LAYER */}
            {isDrawingEffect && drawOrigin && drawCurrent && activeEffectTemplate && liveDrawMetrics && (
              <>
                {/* Aiming Trajectory Laser Line for Projectiles */}
                {activeEffectTemplate.shape === 'projectile' && (
                  <svg className="w-full h-full absolute inset-0 pointer-events-none z-30 overflow-visible">
                    <line
                      x1={`${drawOrigin.x}%`}
                      y1={`${drawOrigin.y}%`}
                      x2={`${drawCurrent.x}%`}
                      y2={`${drawCurrent.y}%`}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                    <circle cx={`${drawOrigin.x}%`} cy={`${drawOrigin.y}%`} r="5" fill="#f59e0b" />
                    <circle cx={`${drawCurrent.x}%`} cy={`${drawCurrent.y}%`} r="6" fill="#ef4444" className="animate-ping" />
                  </svg>
                )}

                <AnimatedMapEffect
                  isPreview
                  effect={{
                    id: 'preview-draw',
                    battlemapId: currentBattlemap.id,
                    name: activeEffectTemplate.name,
                    type: activeEffectTemplate.type,
                    shape: activeEffectTemplate.shape,
                    x: drawOrigin.x,
                    y: drawOrigin.y,
                    targetX: drawCurrent.x,
                    targetY: drawCurrent.y,
                    radiusFeet: activeEffectTemplate.shape === 'projectile'
                      ? (activeEffectTemplate.radiusFeet || 20)
                      : activeEffectTemplate.shape === 'circle'
                      ? liveDrawMetrics.feet
                      : undefined,
                    lengthFeet: (activeEffectTemplate.shape === 'cone' || activeEffectTemplate.shape === 'line') ? liveDrawMetrics.feet : undefined,
                    widthFeet: activeEffectTemplate.shape === 'square' ? liveDrawMetrics.feet : activeEffectTemplate.widthFeet,
                    rotationDeg: liveDrawMetrics.rotationDeg,
                    opacity: 0.85
                  }}
                  gridSize={currentBattlemap.gridSize || 64}
                  gridUnitFeet={currentBattlemap.gridUnitFeet || 5}
                />
              </>
            )}

            {/* COMBAT TOKENS LAYER (PROPORTIONALLY SCALED) */}
            {currentBattlemap.tokens.map((token) => {
              const isSelected = selectedTokenId === token.id
              const isDragging = draggingTokenId === token.id
              const hpPercent = token.hpMax ? Math.round(((token.hpCurrent ?? 0) / token.hpMax) * 100) : 100

              const tokenPx = (currentGridSize * (token.size || 1)) - 4
              const isSmall = tokenPx < 36
              const fontSizeMonogram = Math.max(8, Math.round(14 * scaleRatio))
              const fontSizeNameplate = Math.max(7, Math.min(11, Math.round(8.5 * scaleRatio)))
              const maxNameWidth = Math.max(48, Math.round(tokenPx * 1.6))
              const hpBarHeight = Math.max(2, Math.round(3 * scaleRatio))

              return (
                <div
                  key={token.id}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setSelectedTokenId(token.id)
                    setDraggingTokenId(token.id)
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform select-none ${
                    isDragging ? 'scale-110 z-40' : isSelected ? 'scale-105 z-30' : 'z-20 hover:scale-105'
                  }`}
                  style={{
                    left: `${token.x}%`,
                    top: `${token.y}%`,
                    width: `${tokenPx}px`,
                    height: `${tokenPx}px`
                  }}
                >
                  {/* Token Circular Body */}
                  <div
                    className={`w-full h-full rounded-full border-2 overflow-hidden shadow-2xl relative bg-[#0b0f17] flex items-center justify-center ${
                      token.isEnemy
                        ? isSelected ? 'border-rose-400 ring-2 ring-rose-500/50' : 'border-rose-600'
                        : isSelected ? 'border-accent ring-2 ring-accent/50' : 'border-sky-500'
                    }`}
                  >
                    <SafeTokenAvatar
                      src={token.avatarUrl}
                      name={token.name}
                      isEnemy={token.isEnemy}
                      fontSize={fontSizeMonogram}
                    />

                    {/* AC Badge: Proportional & Compact */}
                    {token.armorClass !== undefined && (
                      <div 
                        className={`absolute top-0 right-0 rounded-full bg-slate-900 border border-slate-700 font-mono font-bold text-white flex items-center justify-center shadow ${
                          isSmall
                            ? 'w-3.5 h-3.5 text-[7px] leading-none'
                            : 'px-1 py-0.2 text-[8px] gap-0.5'
                        }`}
                      >
                        {!isSmall && <Shield className="w-2 h-2 text-sky-400" />}
                        <span>{token.armorClass}</span>
                      </div>
                    )}

                    {/* HP Mini Bar: Proportional Height */}
                    {token.hpMax !== undefined && (
                      <div 
                        className="absolute bottom-0 inset-x-0 bg-black/80 overflow-hidden"
                        style={{ height: `${hpBarHeight}px` }}
                      >
                        <div
                          className={`h-full transition-all ${
                            hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Token Nameplate: Scaled & Truncated */}
                  <div 
                    className="absolute inset-x-0 flex justify-center pointer-events-none"
                    style={{ bottom: `-${Math.max(12, Math.round(15 * scaleRatio))}px` }}
                  >
                    <span 
                      style={{ 
                        fontSize: `${fontSizeNameplate}px`,
                        maxWidth: `${maxNameWidth}px`
                      }}
                      className="px-1 py-0.2 rounded-[2px] bg-black/90 border border-black/60 font-sans font-semibold text-white whitespace-nowrap shadow drop-shadow truncate text-center"
                    >
                      {token.name}
                    </span>
                  </div>

                  {/* Conditions Pills */}
                  {token.conditions && token.conditions.length > 0 && (
                    <div className="absolute -top-3 inset-x-0 flex justify-center gap-0.5 pointer-events-none">
                      {token.conditions.slice(0, 2).map((c) => (
                        <span key={c} className="px-1 py-0.2 rounded bg-amber-950 border border-amber-600 text-[7px] font-mono text-amber-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <MapIcon className="w-12 h-12 text-oros-600 animate-pulse" />
            <h3 className="font-serif font-bold text-lg text-oros-300">No Tactical Battlemaps Created</h3>
            <p className="text-xs text-oros-500 max-w-md">
              Create an encounter battlemap or import a regional chart to run combat encounters, track movement speeds, and deploy adventurer tokens on a tactical grid.
            </p>
            <button
              onClick={() => setShowNewMapModal(true)}
              className="px-4 py-2 rounded-[3px] btn-accent text-xs font-semibold flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Encounter Battlemap</span>
            </button>
          </div>
        )}

        {/* Live Casting Status Banner HUD */}
        {activeEffectTemplate && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-[4px] bg-oros-900 border border-accent/60 shadow-2xl flex items-center gap-3 text-xs font-mono z-40 animate-fade-in text-white">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <div>
              <span className="text-accent font-bold">Casting {activeEffectTemplate.name}: </span>
              <span className="text-oros-300">
                {isDrawingEffect && liveDrawMetrics ? (
                  activeEffectTemplate.shape === 'projectile'
                    ? `🚀 ${liveDrawMetrics.feet} ft to Target • ${activeEffectTemplate.radiusFeet || 20} ft Detonation Radius • Release to fire!`
                    : activeEffectTemplate.shape === 'circle'
                    ? `${liveDrawMetrics.feet} ft Radius (${liveDrawMetrics.feet * 2} ft across • ${liveDrawMetrics.squares} squares)`
                    : activeEffectTemplate.shape === 'cone'
                    ? `${liveDrawMetrics.feet} ft Cone • ${liveDrawMetrics.rotationDeg}° heading`
                    : activeEffectTemplate.shape === 'line'
                    ? `${liveDrawMetrics.feet} ft Line • ${liveDrawMetrics.rotationDeg}° heading`
                    : `${liveDrawMetrics.feet} ft Cube`
                ) : activeEffectTemplate.shape === 'projectile' ? (
                  'Click caster origin & drag to target point • Release to shoot!'
                ) : (
                  'Click & drag to size/orient • Press Esc to cancel'
                )}
              </span>
            </div>
            <button
              onClick={() => {
                setActiveEffectTemplate(null)
                setIsDrawingEffect(false)
                setDrawOrigin(null)
                setDrawCurrent(null)
              }}
              className="p-1 hover:text-rose-400 text-oros-400"
              title="Cancel casting"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Combat Ruler Badge HUD */}
        {activeTool === 'ruler' && rulerMeasurement && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-[4px] bg-oros-900 border border-oros-750 shadow-2xl flex items-center gap-3 text-xs font-mono z-40 animate-fade-in">
            <Ruler className="w-4 h-4 text-accent" />
            <div>
              <span className="text-oros-400">Distance: </span>
              <span className="text-emerald-400 font-bold text-sm">{rulerMeasurement.feet} ft</span>
              <span className="text-oros-500 ml-1.5">({rulerMeasurement.cells} squares)</span>
            </div>
            <div className="h-4 w-px bg-oros-800" />
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              rulerMeasurement.feet <= 30
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : rulerMeasurement.feet <= 60
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {rulerMeasurement.feet <= 30 ? 'Normal Move' : rulerMeasurement.feet <= 60 ? 'Dash Move' : 'Out of Range'}
            </span>
          </div>
        )}

        {/* Selected Token Inspector HUD */}
        {selectedToken && currentBattlemap && (
          <div className="absolute top-4 right-4 w-68 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-4 z-40 text-xs font-sans space-y-3.5 animate-fade-in">
            <div className="flex items-start justify-between gap-2 border-b border-oros-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-oros-700 bg-oros-900 overflow-hidden shrink-0">
                  <SafeTokenAvatar
                    src={selectedToken.avatarUrl}
                    name={selectedToken.name}
                    isEnemy={selectedToken.isEnemy}
                  />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-white leading-tight">{selectedToken.name}</h4>
                  <span className={`text-[9px] font-mono uppercase font-bold ${selectedToken.isEnemy ? 'text-rose-400' : 'text-sky-400'}`}>
                    {selectedToken.isEnemy ? 'Enemy / Monster' : 'Player Adventurer'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTokenId(null)}
                className="text-oros-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Combat Vitals Stepper */}
            <div className="grid grid-cols-2 gap-2 bg-oros-950 p-2.5 rounded-[3px] border border-oros-800 text-center font-mono">
              <div>
                <span className="block text-[9px] uppercase text-oros-400 font-bold">Hit Points</span>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => updateTokenOnBattlemap(campaign.id, currentBattlemap.id, selectedToken.id, {
                      hpCurrent: Math.max(0, (selectedToken.hpCurrent ?? 10) - 1)
                    })}
                    className="w-5 h-5 rounded bg-oros-900 hover:bg-rose-950 text-rose-400 border border-oros-750 flex items-center justify-center font-bold"
                    title="Take 1 Damage"
                  >
                    -
                  </button>
                  <span className="font-bold text-emerald-400 text-xs">
                    {selectedToken.hpCurrent ?? 0} / {selectedToken.hpMax ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTokenOnBattlemap(campaign.id, currentBattlemap.id, selectedToken.id, {
                      hpCurrent: Math.min(selectedToken.hpMax ?? 100, (selectedToken.hpCurrent ?? 0) + 1)
                    })}
                    className="w-5 h-5 rounded bg-oros-900 hover:bg-emerald-950 text-emerald-400 border border-oros-750 flex items-center justify-center font-bold"
                    title="Heal 1 HP"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-[9px] uppercase text-oros-400 font-bold">Armor Class</span>
                <span className="block font-bold text-white text-xs mt-1">
                  {selectedToken.armorClass ?? 10} AC
                </span>
              </div>
            </div>

            {/* Conditions Toggles */}
            <div>
              <span className="block text-[9px] font-mono uppercase text-oros-300 font-bold mb-1.5">Status Conditions</span>
              <div className="flex flex-wrap gap-1">
                {COMMON_CONDITIONS.map((cond) => {
                  const hasCondition = (selectedToken.conditions || []).includes(cond)
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => {
                        const current = selectedToken.conditions || []
                        const updated = hasCondition ? current.filter(c => c !== cond) : [...current, cond]
                        updateTokenOnBattlemap(campaign.id, currentBattlemap.id, selectedToken.id, { conditions: updated })
                      }}
                      className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono transition-colors ${
                        hasCondition
                          ? 'bg-amber-950 text-amber-300 border border-amber-600 font-bold'
                          : 'bg-oros-950 text-oros-400 border border-oros-800 hover:text-white'
                      }`}
                    >
                      {cond}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Open Character Sheet & Delete Actions */}
            <div className="pt-2 border-t border-oros-800 flex items-center justify-between">
              {selectedToken.characterId && onOpenCharacterSheet ? (
                <button
                  type="button"
                  onClick={() => onOpenCharacterSheet(selectedToken.characterId!)}
                  className="px-2 py-1 rounded-[3px] bg-accent-muted text-accent border border-accent/40 font-semibold text-[11px] flex items-center gap-1 hover:bg-accent hover:text-accent-contrast transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open 5e Sheet</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => {
                  removeTokenFromBattlemap(campaign.id, currentBattlemap.id, selectedToken.id)
                  setSelectedTokenId(null)
                  addToast(`Removed ${selectedToken.name} from battlemap`, 'info')
                }}
                className="text-rose-400 hover:text-rose-300 text-[11px] flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove Token</span>
              </button>
            </div>
          </div>
        )}

        {/* Embedded Interactive 3D Dice Roller (Map only) */}
        <InteractiveDice3D
          isOpen={isDiceOpen}
          onClose={() => setIsDiceOpen(false)}
        />
      </div>

      {/* ============================================================== */}
      {/* SOLID OROS NEW / EDIT BATTLEMAP MODAL                          */}
      {/* ============================================================== */}
      {showNewMapModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-oros-800 pb-2.5">
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-accent" />
                <span>{editingMapId ? 'Edit Battlemap / Level' : 'New Battlemap / Level'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowNewMapModal(false)
                  setEditingMapId(null)
                }}
                className="text-oros-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateMap} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-oros-400 font-bold mb-1">Battlemap Name</label>
                <input
                  type="text"
                  required
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="e.g. Salt-Cairn Tavern, Coastal Ambush, Dungeon Crypt, Level 2..."
                  className="w-full px-3 py-1.5 bg-oros-950 border border-oros-800 rounded-[3px] text-xs text-white placeholder-oros-600 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-oros-400 font-bold mb-1">Artwork URL or Local File</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMapUrl}
                    onChange={(e) => setNewMapUrl(e.target.value)}
                    placeholder="https://... or C:\... or local path (leave blank for default)"
                    className="flex-1 px-3 py-1.5 bg-oros-950 border border-oros-800 rounded-[3px] text-xs text-white placeholder-oros-600 focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.oros) {
                        const asset = await window.oros.importAsset()
                        if (asset) setNewMapUrl(asset)
                      } else {
                        mapFileInputRef.current?.click()
                      }
                    }}
                    className="px-2.5 py-1.5 bg-oros-950 hover:bg-oros-850 text-oros-200 border border-oros-800 rounded-[3px] text-xs font-medium cursor-pointer"
                    title="Import image from your computer"
                  >
                    Browse
                  </button>
                </div>

                {/* Live Artwork Thumbnail Preview */}
                {newMapUrl && (
                  <div className="mt-2.5 w-full h-28 rounded-[3px] bg-black/60 border border-oros-800 overflow-hidden relative flex items-center justify-center">
                    <img
                      src={newMapUrl}
                      alt="Map Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                    <div className="absolute bottom-1 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-oros-300">
                      Artwork Preview
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewMapModal(false)
                    setEditingMapId(null)
                  }}
                  className="px-3 py-1.5 rounded-[3px] bg-oros-950 text-oros-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] btn-accent text-xs font-semibold shadow-sm"
                >
                  {editingMapId ? 'Save Changes' : 'Create Battlemap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden file input for web fallback map image import */}
      <input
        ref={mapFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = () => {
              setNewMapUrl(reader.result as string)
              if (!newMapName) {
                setNewMapName(file.name.replace(/\.[^/.]+$/, ''))
              }
            }
            reader.readAsDataURL(file)
          }
        }}
      />
    </div>
  )
}
