import React, { useMemo, useState, useEffect, useRef } from 'react'
import { 
  ReactFlow, Background, BackgroundVariant, Node, Edge, 
  MarkerType, Handle, Position, useNodesState, useEdgesState,
  useReactFlow, ReactFlowProvider, BaseEdge, EdgeProps, getStraightPath,
  useViewport, useNodesInitialized
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useSettingsStore, getEffectiveColorMode } from '../../store/useSettingsStore'
import { useToastStore } from '../../store/useToastStore'
import { useActiveThemeTokens } from '../../utils/useActiveThemeTokens'
import { confirmDialog } from '../../store/useConfirmStore'
import { 
  Network, Search, Filter, BookOpen, ExternalLink, ArrowRight, 
  Sparkles, Link2, User, MapPin, Shield, Gem, Scroll, 
  X, AlertCircle, Maximize2, Orbit, ChevronDown, Check, Wind
} from 'lucide-react'
import { LoreEntity, EntityType } from '@shared/types'
import { 
  DEFAULT_PRESET_CATEGORIES, 
  getCategoryIconComponent, 
  getCategoryMeta 
} from '../../utils/categoryIcons'
import { ExportDropdown, ExportOption } from '../common/ExportDropdown'
import { exportReactFlowToImage, exportConnectionsToJson, exportConnectionsToCsv } from '../../utils/exportUtils'

// Optimal cardinal handle picker based on relative center positions
function getOptimalHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  // Center of card: 224px wide, 68px tall
  const sCx = sourcePos.x + 112
  const sCy = sourcePos.y + 34
  const tCx = targetPos.x + 112
  const tCy = targetPos.y + 34

  const dx = tCx - sCx
  const dy = tCy - sCy

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0
      ? { sourceHandle: 'r-src', targetHandle: 'l-tgt' }
      : { sourceHandle: 'l-src', targetHandle: 'r-tgt' }
  } else {
    return dy > 0
      ? { sourceHandle: 'b-src', targetHandle: 't-tgt' }
      : { sourceHandle: 't-src', targetHandle: 'b-tgt' }
  }
}

// Rock-solid straight edge connecting cardinal handles directly
const DirectStraightEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd
}) => {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
}

// Compact, high-density Wiki Node for the Knowledge Network
// UNIFIED SINGLE-COLOR PALETTE: Muted Gold & Slate (Easier to look at)
const WikiArticleNode = ({ data }: { data: { 
  entity: LoreEntity; 
  degree: number; 
  inDegree: number;
  outDegree: number;
  isHub: boolean;
  isSelected: boolean;
  hoverMotion?: boolean;
  onSelect: (id: string) => void;
} }) => {
  const { entity, degree, inDegree, outDegree, isHub, isSelected, hoverMotion = true } = data
  const catMeta = getCategoryMeta(entity.type)
  const Icon = getCategoryIconComponent(catMeta.icon)
  const [imgError, setImgError] = useState(false)

  // Deterministic staggered timing for each card
  const animStyle = useMemo(() => {
    if (!hoverMotion) return undefined
    let h = 0
    for (let i = 0; i < entity.id.length; i++) {
      h = (h * 31 + entity.id.charCodeAt(i)) & 0xffffffff
    }
    const hash = Math.abs(h)
    return {
      animationDuration: `${3.8 + (hash % 20) * 0.12}s`,
      animationDelay: `${(hash % 25) * 0.12}s`
    }
  }, [hoverMotion, entity.id])

  return (
    <div 
      onClick={() => data.onSelect(entity.id)}
      style={animStyle}
      className={`w-52 rounded-[3px] bg-oros-900 border shadow-md cursor-pointer select-none text-left relative ${
        hoverMotion ? 'oros-hover-card' : ''
      } ${
        isSelected 
          ? 'border-accent ring-1 ring-accent/40 z-30' 
          : isHub
            ? 'border-accent/40 hover:border-accent/70'
            : 'border-oros-750 hover:border-oros-600'
      }`}
    >
      {/* 8 Cardinal Handles for Glitch-Free Omnidirectional Connections */}
      <Handle type="target" position={Position.Top} id="t-tgt" className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="source" position={Position.Top} id="t-src" className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="target" position={Position.Bottom} id="b-tgt" className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} id="b-src" className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="target" position={Position.Left} id="l-tgt" className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="source" position={Position.Left} id="l-src" className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="target" position={Position.Right} id="r-tgt" className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="source" position={Position.Right} id="r-src" className="!opacity-0 !w-2 !h-2 pointer-events-none" />

      <div className="p-2 flex items-center gap-2">
        {/* Entity Portrait or Icon */}
        <div className="w-9 h-9 rounded-[2px] overflow-hidden bg-oros-950 flex-shrink-0 border border-oros-800 flex items-center justify-center">
          {entity.avatar && !imgError ? (
            <img 
              src={entity.avatar} 
              alt={entity.title} 
              onError={() => setImgError(true)}
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-oros-950 text-oros-400 font-sans font-semibold text-xs">
              <Icon className="w-4 h-4 text-oros-400" />
            </div>
          )}
        </div>

        {/* Title and stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span 
              className="text-[9px] uppercase font-mono font-medium px-1.5 py-0.2 rounded-[2px] bg-oros-950 border truncate flex items-center gap-1"
              style={{
                borderColor: `${catMeta.color || '#94a3b8'}40`,
                color: catMeta.color || '#cbd5e1'
              }}
            >
              {catMeta.name}
            </span>
            <span className="text-[9px] font-mono text-oros-500 shrink-0" title={`${inDegree} backlinks, ${outDegree} outbound`}>
              {degree} {degree === 1 ? 'link' : 'links'}
            </span>
          </div>
          <h4 className="font-sans font-semibold text-xs text-oros-100 truncate group-hover:text-white">
            {entity.title}
          </h4>
        </div>
      </div>
    </div>
  )
}

const nodeTypes = {
  wikiArticle: WikiArticleNode
}

const edgeTypes = {
  directStraight: DirectStraightEdge
}

interface FilterOption {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color?: string
}

interface GraphMiniMapProps {
  nodes: Node[]
  worldPositionsRef: React.MutableRefObject<Map<string, { x: number; y: number }>>
  selectedWikiId: string | null
  containerRef: React.RefObject<HTMLDivElement>
  drawerOpen?: boolean
}

// Stable, flicker-free custom minimap that does NOT re-rasterize or fluctuate on hover motion
const GraphMiniMap: React.FC<GraphMiniMapProps> = React.memo(({
  nodes,
  worldPositionsRef,
  selectedWikiId,
  containerRef,
  drawerOpen
}) => {
  const { x, y, zoom } = useViewport()
  const { setCenter } = useReactFlow()
  const { settings } = useSettingsStore()
  const isLight = getEffectiveColorMode(settings.interface.colorMode) === 'light'
  const themeTokens = useActiveThemeTokens()
  const svgRef = useRef<SVGSVGElement>(null)
  const isDraggingRef = useRef(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 })

  // Synchronize canvas container dimensions
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const updateSize = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setContainerSize({ width: el.clientWidth, height: el.clientHeight })
      }
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])

  // Stable world bounds computed strictly from persistent master base coordinates
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, width: 1400, height: 900 }
    }
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const n of nodes) {
      const pos = worldPositionsRef.current.get(n.id) || n.position
      if (pos && isFinite(pos.x) && isFinite(pos.y)) {
        if (pos.x < minX) minX = pos.x
        if (pos.x + 224 > maxX) maxX = pos.x + 224
        if (pos.y < minY) minY = pos.y
        if (pos.y + 68 > maxY) maxY = pos.y + 68
      }
    }

    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
      return { minX: 0, minY: 0, width: 1400, height: 900 }
    }

    const padX = Math.max(300, (maxX - minX) * 0.18)
    const padY = Math.max(220, (maxY - minY) * 0.18)
    minX -= padX
    maxX += padX
    minY -= padY
    maxY += padY

    const width = Math.max(800, maxX - minX)
    const height = Math.max(500, maxY - minY)

    return { minX, minY, width, height }
  }, [nodes, worldPositionsRef])

  // Camera viewport in world coordinates
  const safeZoom = Math.max(0.05, isFinite(zoom) && zoom > 0 ? zoom : 1)
  const camX = isFinite(x) ? -x / safeZoom : 0
  const camY = isFinite(y) ? -y / safeZoom : 0
  const camWidth = containerSize.width > 0 ? containerSize.width / safeZoom : 1200
  const camHeight = containerSize.height > 0 ? containerSize.height / safeZoom : 800

  // World coordinates translation on click/drag
  const panToSvgPoint = (clientX: number, clientY: number, smooth = false) => {
    const svg = svgRef.current
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (ctm) {
      try {
        const inv = ctm.inverse()
        if (inv) {
          const worldPoint = pt.matrixTransform(inv)
          if (isFinite(worldPoint.x) && isFinite(worldPoint.y)) {
            setCenter(worldPoint.x, worldPoint.y, { duration: smooth ? 250 : 0 })
          }
        }
      } catch {}
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    panToSvgPoint(e.clientX, e.clientY, true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    panToSvgPoint(e.clientX, e.clientY, false)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  // Shaded outer mask coordinates
  const bigX = bounds.minX - 5000
  const bigY = bounds.minY - 5000
  const bigW = bounds.width + 10000
  const bigH = bounds.height + 10000

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className={`absolute bottom-4 ${drawerOpen ? 'right-90' : 'right-4'} z-20 px-3 py-1.5 bg-oros-900/95 backdrop-blur-md border border-oros-750 hover:border-accent/60 rounded-[4px] shadow-xl flex items-center gap-1.5 text-xs text-oros-300 hover:text-accent transition-all font-mono`}
        title="Expand Navigator Minimap"
      >
        <Network className="w-3.5 h-3.5 text-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">Navigator</span>
      </button>
    )
  }

  return (
    <div
      className={`absolute bottom-4 ${
        drawerOpen ? 'right-90' : 'right-4'
      } z-20 w-52 h-36 sm:w-60 sm:h-40 bg-oros-950/95 backdrop-blur-md border border-oros-750 hover:border-accent/40 rounded-[4px] overflow-hidden shadow-2xl transition-all flex flex-col group select-none`}
    >
      {/* Sleek Minimap Header */}
      <div className="px-3 py-1.5 bg-oros-900/70 border-b border-oros-800/70 flex items-center justify-between text-[10px] text-oros-400">
        <span className="flex items-center gap-1.5 text-accent font-semibold tracking-wider uppercase text-[9px] font-mono">
          <Network className="w-3 h-3 text-accent" />
          Navigator
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-oros-500 font-mono">
            {nodes.length} cards
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-0.5 rounded text-oros-500 hover:text-slate-200 hover:bg-oros-800/60 transition-colors"
            title="Minimize Navigator"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* SVG Minimap Canvas */}
      <div
        className="flex-1 w-full h-full relative cursor-crosshair overflow-hidden bg-oros-950/80"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <svg
          ref={svgRef}
          className="w-full h-full block"
          viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Static Mini Cards at Master Coordinates (No Jitter) */}
          {nodes.map((node) => {
            const pos = worldPositionsRef.current.get(node.id) || node.position
            const isSelected = node.id === selectedWikiId
            return (
              <rect
                key={node.id}
                x={pos.x}
                y={pos.y}
                width={224}
                height={68}
                rx={14}
                fill={isSelected ? themeTokens.accent : (isLight ? '#e2e8f0' : '#1e293b')}
                stroke={isSelected ? themeTokens.accent : (isLight ? '#cbd5e1' : '#334155')}
                strokeWidth={isSelected ? 8 : 3}
                opacity={isSelected ? 1 : 0.85}
              />
            )
          })}

          {/* Camera Viewport Indicator Box */}
          <rect
            x={camX}
            y={camY}
            width={camWidth}
            height={camHeight}
            rx={16}
            fill={themeTokens.muted}
            stroke={themeTokens.accent}
            strokeWidth={Math.max(6, bounds.width / 130)}
            pointerEvents="none"
          />

          {/* Shaded Viewport Outer Mask */}
          <path
            d={`
              M ${bigX} ${bigY}
              h ${bigW}
              v ${bigH}
              h ${-bigW}
              z
              M ${camX} ${camY}
              h ${camWidth}
              v ${camHeight}
              h ${-camWidth}
              z
            `}
            fill={isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(11, 17, 24, 0.65)'}
            fillRule="evenodd"
            pointerEvents="none"
          />
        </svg>
      </div>
    </div>
  )
})

const WikiNetworkGraphInner: React.FC = () => {
  const { 
    worlds, entities, relations, categories, activeWorldId, setSelectedEntityId, setActiveTab, openTab, deleteEntity 
  } = useWorldStore()
  const activeWorld = (worlds || []).find((w) => w.id === activeWorldId)
  const { settings } = useSettingsStore()
  const isLight = getEffectiveColorMode(settings.interface.colorMode) === 'light'
  const themeTokens = useActiveThemeTokens()
  const { addToast } = useToastStore()
  const { fitView } = useReactFlow()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [selectedWikiId, setSelectedWikiId] = useState<string | null>(null)
  const [showOnlyHubs, setShowOnlyHubs] = useState(false)
  const [hoverMotion, setHoverMotion] = useState(true)

  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as unknown as HTMLElement)) {
        setFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const worldEntities = useMemo(() => {
    return activeWorldId ? entities[activeWorldId] || [] : []
  }, [activeWorldId, entities])

  // Del key shortcut handler for selected node
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Del' && e.key !== 'Backspace') return
      const activeEl = document.activeElement as HTMLElement | null
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable ||
         activeEl.closest('[contenteditable="true"]') ||
         activeEl.closest('.tiptap'))
      ) {
        return
      }

      if (selectedWikiId) {
        const ent = worldEntities.find((item) => item.id === selectedWikiId)
        const title = ent ? ent.title : 'this entry'
        e.preventDefault()
        const ok = await confirmDialog({
          title: 'Delete Entry',
          message: `Are you sure you want to permanently delete "${title}" and all its relational connections?`,
          confirmText: 'Delete Entry',
          variant: 'danger'
        })
        if (!ok) return
        deleteEntity(selectedWikiId)
        setSelectedWikiId(null)
        addToast(`Deleted entry "${title}" from world`, 'info')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedWikiId, worldEntities, deleteEntity, addToast])

  const worldRelations = useMemo(() => {
    return activeWorldId ? relations[activeWorldId] || [] : []
  }, [activeWorldId, relations])

  // Extract all cross-wiki connections (relations, infobox links, content mentions)
  const { inDegreeMap, outDegreeMap, allLinks } = useMemo(() => {
    const linkMap: Record<string, Set<string>> = {}
    const inDegreeMap: Record<string, number> = {}
    const outDegreeMap: Record<string, number> = {}
    const allLinks: { source: string; target: string; reason: string }[] = []

    worldEntities.forEach(e => {
      linkMap[e.id] = new Set()
      inDegreeMap[e.id] = 0
      outDegreeMap[e.id] = 0
    })

    // 1. Scan explicit relations
    worldRelations.forEach(r => {
      if (linkMap[r.sourceEntityId] && linkMap[r.targetEntityId]) {
        if (!linkMap[r.sourceEntityId].has(r.targetEntityId)) {
          linkMap[r.sourceEntityId].add(r.targetEntityId)
          allLinks.push({ source: r.sourceEntityId, target: r.targetEntityId, reason: r.label || 'Relation' })
          outDegreeMap[r.sourceEntityId] = (outDegreeMap[r.sourceEntityId] || 0) + 1
          inDegreeMap[r.targetEntityId] = (inDegreeMap[r.targetEntityId] || 0) + 1
        }
      }
    })

    // 2. Scan infobox entity-links
    worldEntities.forEach(e => {
      e.infobox?.sections?.forEach(sec => {
        sec.fields?.forEach(field => {
          if (field.type === 'entity-link' && field.targetEntityId && linkMap[field.targetEntityId]) {
            if (!linkMap[e.id].has(field.targetEntityId)) {
              linkMap[e.id].add(field.targetEntityId)
              allLinks.push({ source: e.id, target: field.targetEntityId, reason: `Infobox (${field.label})` })
              outDegreeMap[e.id] = (outDegreeMap[e.id] || 0) + 1
              inDegreeMap[field.targetEntityId] = (inDegreeMap[field.targetEntityId] || 0) + 1
            }
          }
        })
      })
    })

    // 3. Scan HTML content mentions (TipTap data-id or title text mention)
    worldEntities.forEach(source => {
      const content = source.content || ''
      worldEntities.forEach(target => {
        if (source.id !== target.id) {
          const hasMentionTag = content.includes(`data-id="${target.id}"`) || content.includes(`data-label="${target.title}"`)
          const hasTitleMention = target.title.length > 3 && content.includes(target.title)
          
          if (hasMentionTag || hasTitleMention) {
            if (!linkMap[source.id].has(target.id)) {
              linkMap[source.id].add(target.id)
              allLinks.push({ source: source.id, target: target.id, reason: 'Mentioned in article text' })
              outDegreeMap[source.id] = (outDegreeMap[source.id] || 0) + 1
              inDegreeMap[target.id] = (inDegreeMap[target.id] || 0) + 1
            }
          }
        }
      })
    })

    return { inDegreeMap, outDegreeMap, allLinks }
  }, [worldEntities, worldRelations])

  // PERSISTENT MASTER NODE POSITIONS MAP
  // Maintains positions for ALL entities in the world so filtering/searching NEVER alters or discards coordinates
  const worldPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const [layoutVersion, setLayoutVersion] = useState(0)

  // Layout calculation for ALL world entities
  const calculateMasterLayout = (forceRefresh = false) => {
    const existingMap = worldPositionsRef.current
    const allHavePos = worldEntities.length > 0 && worldEntities.every(e => existingMap.has(e.id))

    if (allHavePos && !forceRefresh) {
      return
    }

    const count = Math.max(worldEntities.length, 1)
    const centerX = 650
    const centerY = 450
    const baseRadius = Math.min(340, Math.max(180, count * 24))

    interface SimItem {
      id: string
      x: number
      y: number
      vx: number
      vy: number
      isHub: boolean
      isDisconnected: boolean
    }

    const simNodes: SimItem[] = worldEntities.map((ent, idx) => {
      const inDeg = inDegreeMap[ent.id] || 0
      const outDeg = outDegreeMap[ent.id] || 0
      const totalDeg = inDeg + outDeg
      const isHub = totalDeg >= 2
      const isDisconnected = totalDeg === 0

      if (!forceRefresh && existingMap.has(ent.id)) {
        const cur = existingMap.get(ent.id)!
        return { id: ent.id, x: cur.x, y: cur.y, vx: 0, vy: 0, isHub, isDisconnected }
      }

      // Initial placement: hubs in inner core, connected in middle circle, disconnected in outer orbit
      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2
      let r = baseRadius
      if (isHub) r = baseRadius * 0.65
      else if (isDisconnected) r = baseRadius * 1.15

      return {
        id: ent.id,
        x: centerX + r * Math.cos(angle) + (Math.random() - 0.5) * 20,
        y: centerY + r * Math.sin(angle) + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        isHub,
        isDisconnected
      }
    })

    const simMap = new Map<string, SimItem>()
    simNodes.forEach(n => simMap.set(n.id, n))

    // 60-iteration physics relaxation for master organic layout
    for (let step = 0; step < 60; step++) {
      // 1. Center gravity (keeps network cohesive; stronger for disconnected nodes so they don't wander off)
      simNodes.forEach(node => {
        const gravity = node.isDisconnected ? 0.018 : (node.isHub ? 0.006 : 0.0035)
        node.vx += (centerX - node.x) * gravity
        node.vy += (centerY - node.y) * gravity
      })

      // 2. Pairwise repulsion & card bounding box collision avoidance (cards are 224w x 68h)
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const n1 = simNodes[i]
          const n2 = simNodes[j]
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const distSq = dx * dx + dy * dy
          const dist = Math.sqrt(distSq) || 1

          // Gentle repulsion when one or both are disconnected to prevent shooting them to infinity
          const baseForce = (n1.isDisconnected || n2.isDisconnected) ? 14000 : 38000
          const force = Math.min(baseForce / Math.max(distSq, 1600), 18)

          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          n1.vx -= fx
          n1.vy -= fy
          n2.vx += fx
          n2.vy += fy

          // Card boundary anti-overlap push (224px width, 68px height)
          const overlapX = 236 - Math.abs(dx)
          const overlapY = 80 - Math.abs(dy)
          if (overlapX > 0 && overlapY > 0) {
            const push = Math.min(overlapX, overlapY) * 0.15
            n1.vx -= Math.sign(dx || 1) * push
            n1.vy -= Math.sign(dy || 1) * push
            n2.vx += Math.sign(dx || 1) * push
            n2.vy += Math.sign(dy || 1) * push
          }
        }
      }

      // 3. Link spring attraction along relations & cross-links
      allLinks.forEach(l => {
        const n1 = simMap.get(l.source)
        const n2 = simMap.get(l.target)
        if (n1 && n2) {
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const delta = dist - 240
          const force = delta * 0.018
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          n1.vx += fx
          n1.vy += fy
          n2.vx -= fx
          n2.vy -= fy
        }
      })

      // 4. Damping & velocity integration
      simNodes.forEach(node => {
        const maxV = node.isDisconnected ? 12 : 22
        node.vx = Math.max(-maxV, Math.min(maxV, node.vx)) * 0.78
        node.vy = Math.max(-maxV, Math.min(maxV, node.vy)) * 0.78
        node.x += node.vx
        node.y += node.vy
      })
    }

    // 5. Bounding box normalization: ensure ALL nodes have at least 140px clearance from top & left
    // This prevents ANY card from hiding under the top toolbar (top: 14px, height ~36px) or having negative coordinates!
    if (simNodes.length > 0) {
      let minX = Infinity
      let minY = Infinity
      simNodes.forEach(node => {
        if (node.x < minX) minX = node.x
        if (node.y < minY) minY = node.y
      })

      const padLeft = 140
      const padTop = 150
      const shiftX = minX < padLeft ? padLeft - minX : 0
      const shiftY = minY < padTop ? padTop - minY : 0

      simNodes.forEach(node => {
        const finalX = Math.round(node.x + shiftX)
        const finalY = Math.round(node.y + shiftY)
        existingMap.set(node.id, { x: finalX, y: finalY })
      })
    }

    if (forceRefresh) {
      setLayoutVersion(v => v + 1)
    }
  }

  const nodesInitialized = useNodesInitialized()
  const hasAutoFittedRef = useRef(false)

  // Auto-fit camera once nodes are initialized and container has valid dimensions
  useEffect(() => {
    if (!nodesInitialized || worldEntities.length === 0) return
    if (hasAutoFittedRef.current) return

    const checkAndFit = () => {
      const container = containerRef.current
      if (container && container.clientWidth > 100 && container.clientHeight > 100) {
        hasAutoFittedRef.current = true
        fitView({ padding: 0.28, duration: 300, minZoom: 0.35, maxZoom: 1.5 })
      }
    }

    checkAndFit()
    const timer = setTimeout(checkAndFit, 150)
    return () => clearTimeout(timer)
  }, [nodesInitialized, worldEntities.length, fitView])

  // ResizeObserver: auto-fit if container becomes visible / changes size from 0
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let roTimer: NodeJS.Timeout
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 100 && el.clientHeight > 100) {
        if (!hasAutoFittedRef.current && nodesInitialized) {
          clearTimeout(roTimer)
          roTimer = setTimeout(() => {
            if (!hasAutoFittedRef.current && nodesInitialized) {
              hasAutoFittedRef.current = true
              fitView({ padding: 0.28, duration: 250, minZoom: 0.35, maxZoom: 1.5 })
            }
          }, 100)
        }
      }
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      clearTimeout(roTimer)
    }
  }, [nodesInitialized, fitView])

  // Calculate master layout on world change and reset auto-fit flag
  useEffect(() => {
    hasAutoFittedRef.current = false
    calculateMasterLayout()
  }, [activeWorldId, worldEntities.length])

  // Explicit Settle / Organize button handler
  const handleSettleLayout = () => {
    calculateMasterLayout(true)
    addToast('Organized card relations layout', 'info')
    setTimeout(() => fitView({ padding: 0.28, duration: 400, minZoom: 0.35, maxZoom: 1.5 }), 60)
  }

  // Build Filtered Nodes with 100% Stable Cached Coordinates
  const displayedNodes: Node[] = useMemo(() => {
    // If any entity doesn't have a position yet, compute immediately so first render is valid
    if (worldEntities.length > 0 && worldEntities.some(e => !worldPositionsRef.current.has(e.id))) {
      calculateMasterLayout(false)
    }

    const q = searchQuery.toLowerCase().trim()

    return worldEntities
      .filter(ent => {
        if (selectedType !== 'all' && ent.type !== selectedType) return false
        const degree = (inDegreeMap[ent.id] || 0) + (outDegreeMap[ent.id] || 0)
        if (showOnlyHubs && degree < 2) return false
        if (q) {
          const matchTitle = ent.title.toLowerCase().includes(q)
          const matchSummary = ent.summary?.toLowerCase().includes(q) || false
          if (!matchTitle && !matchSummary) return false
        }
        return true
      })
      .map(ent => {
        const pos = worldPositionsRef.current.get(ent.id) || { x: 650, y: 450 }
        const inDeg = inDegreeMap[ent.id] || 0
        const outDeg = outDegreeMap[ent.id] || 0
        const totalDeg = inDeg + outDeg
        const isHub = totalDeg >= 2

        return {
          id: ent.id,
          type: 'wikiArticle',
          position: { x: pos.x, y: pos.y },
          draggable: false, // Stays completely still; no manual move
          data: {
            entity: ent,
            degree: totalDeg,
            inDegree: inDeg,
            outDegree: outDeg,
            isHub,
            isSelected: selectedWikiId === ent.id,
            hoverMotion,
            onSelect: (id: string) => setSelectedWikiId(id)
          }
        }
      })
  }, [worldEntities, selectedType, showOnlyHubs, searchQuery, inDegreeMap, outDegreeMap, selectedWikiId, hoverMotion, layoutVersion])

  // Build Filtered Edges between currently visible nodes
  const displayedEdges: Edge[] = useMemo(() => {
    const visibleIds = new Set(displayedNodes.map(n => n.id))

    return allLinks
      .filter(l => visibleIds.has(l.source) && visibleIds.has(l.target))
      .map((link, idx) => {
        const isHighlighted = selectedWikiId 
          ? link.source === selectedWikiId || link.target === selectedWikiId
          : false

        // Connection arrows strictly follow active project's accent
        const strokeColor = isHighlighted
          ? themeTokens.accent
          : selectedWikiId
            ? (isLight ? '#cbd5e1' : '#334155')
            : (isLight ? `${themeTokens.accent}80` : `${themeTokens.accent}65`)

        const strokeWidth = isHighlighted ? 2.5 : 1.5

        const srcPos = worldPositionsRef.current.get(link.source) || { x: 0, y: 0 }
        const tgtPos = worldPositionsRef.current.get(link.target) || { x: 0, y: 0 }
        const handles = getOptimalHandles(srcPos, tgtPos)

        return {
          id: `wlink-${idx}-${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          type: 'directStraight',
          animated: isHighlighted,
          style: { 
            stroke: strokeColor, 
            strokeWidth,
            opacity: selectedWikiId ? (isHighlighted ? 1 : 0.15) : 0.75
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: isHighlighted ? 12 : 9,
            height: isHighlighted ? 12 : 9
          }
        }
      })
  }, [allLinks, displayedNodes, selectedWikiId, themeTokens.accent, isLight])

  const [nodes, setNodes, onNodesChange] = useNodesState(displayedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(displayedEdges)

  useEffect(() => {
    setNodes(displayedNodes)
  }, [displayedNodes, setNodes])

  useEffect(() => {
    setEdges(displayedEdges)
  }, [displayedEdges, setEdges])

  const handleExportNetworkImage = async (format: 'png' | 'svg') => {
    if (!containerRef.current) return
    const safeName = (activeWorld?.name || 'knowledge_network').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    try {
      await exportReactFlowToImage(containerRef.current, nodes, format, {
        filename: `${safeName}_network.${format}`,
        pixelRatio: 2,
        backgroundColor: '#090a0d',
        padding: 64
      })
      addToast(`Network exported as ${format.toUpperCase()}`, 'success')
    } catch (err) {
      console.error('Failed to export network graph:', err)
      addToast('Failed to export network graph', 'error')
    }
  }

  const handleExportNetworkJson = async () => {
    try {
      const ok = await exportConnectionsToJson(worldEntities, allLinks, activeWorld?.name)
      if (ok) addToast('Network topology exported as JSON', 'success')
    } catch (err) {
      console.error('Failed to export network topology:', err)
      addToast('Failed to export topology JSON', 'error')
    }
  }

  const handleExportNetworkCsv = async () => {
    try {
      const ok = await exportConnectionsToCsv(worldEntities, allLinks, activeWorld?.name)
      if (ok) addToast('Edge list exported as CSV', 'success')
    } catch (err) {
      console.error('Failed to export connections CSV:', err)
      addToast('Failed to export connections CSV', 'error')
    }
  }

  const networkExportOptions: ExportOption[] = [
    {
      id: 'export-png',
      label: 'Export Graph (2x PNG)',
      badge: 'PNG',
      onClick: () => handleExportNetworkImage('png')
    },
    {
      id: 'export-svg',
      label: 'Export Graph (Vector SVG)',
      badge: 'SVG',
      onClick: () => handleExportNetworkImage('svg')
    },
    {
      id: 'export-json',
      label: 'Export Topology (JSON)',
      badge: 'JSON',
      onClick: handleExportNetworkJson
    },
    {
      id: 'export-csv',
      label: 'Export Edge List (CSV)',
      badge: 'CSV',
      onClick: handleExportNetworkCsv
    }
  ]

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedWikiId(node.id)
  }

  // Selected article details
  const activeArticle = useMemo(() => {
    return worldEntities.find(e => e.id === selectedWikiId) || null
  }, [selectedWikiId, worldEntities])

  // Outbound linked articles
  const outboundArticles = useMemo(() => {
    if (!selectedWikiId) return []
    const targets = allLinks.filter(l => l.source === selectedWikiId).map(l => ({
      entity: worldEntities.find(e => e.id === l.target),
      reason: l.reason
    })).filter(item => item.entity !== undefined)
    return targets as { entity: LoreEntity; reason: string }[]
  }, [selectedWikiId, allLinks, worldEntities])

  // Inbound backlinks
  const inboundArticles = useMemo(() => {
    if (!selectedWikiId) return []
    const sources = allLinks.filter(l => l.target === selectedWikiId).map(l => ({
      entity: worldEntities.find(e => e.id === l.source),
      reason: l.reason
    })).filter(item => item.entity !== undefined)
    return sources as { entity: LoreEntity; reason: string }[]
  }, [selectedWikiId, allLinks, worldEntities])

  const handleOpenInWiki = (entityId: string) => {
    const ent = worldEntities.find(e => e.id === entityId)
    setSelectedEntityId(entityId)
    openTab({
      title: ent ? ent.title : 'Encyclopedia',
      type: 'wiki',
      targetId: entityId
    })
    addToast('Opened article in Encyclopedia', 'info')
  }

  const worldId = activeWorldId || 'world-aethelgard'
  const worldCategories = categories[worldId] || DEFAULT_PRESET_CATEGORIES

  const typeOptions: FilterOption[] = useMemo(() => [
    { label: 'All Types', value: 'all', icon: Filter },
    ...worldCategories.map((c) => ({
      label: c.name,
      value: c.id,
      icon: getCategoryIconComponent(c.icon),
      color: c.color
    }))
  ], [worldCategories])

  const currentFilterLabel = typeOptions.find(o => o.value === selectedType)?.label || 'All Types'

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* Main Graph Canvas (Full-bleed edge-to-edge canvas; top bar removed) */}
      <div ref={containerRef} className="flex-1 h-full w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode={isLight ? 'light' : 'dark'}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodesDraggable={false} // User requested: "Dont have the option to move it at all"
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          minZoom={0.25}
          maxZoom={2.0}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            variant={BackgroundVariant.Dots}
            color={themeTokens.dots} 
            gap={24} 
            size={1.4} 
          />
        </ReactFlow>

        {/* Stable, Zero-Flicker Custom Graph Navigator Minimap */}
        <GraphMiniMap
          nodes={displayedNodes}
          worldPositionsRef={worldPositionsRef}
          selectedWikiId={selectedWikiId}
          containerRef={containerRef}
          drawerOpen={Boolean(activeArticle)}
        />

        {/* SLEEK FLOATING CANVAS TOOLBAR */}
        <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="bg-oros-900 border border-oros-750 hover:border-oros-600 rounded-[3px] pl-7 pr-6 py-1 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 w-44 sm:w-52 shadow-md transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-oros-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* CUSTOM FILTER DROPDOWN */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="bg-oros-900 border border-oros-750 hover:border-oros-600 text-oros-200 px-2.5 py-1 rounded-[3px] text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer font-medium"
            >
              <Filter className="w-3.5 h-3.5 text-oros-400 shrink-0" />
              <span>{currentFilterLabel}</span>
              <ChevronDown className="w-3 h-3 text-oros-400 shrink-0 ml-0.5" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-8 left-0 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl py-1 min-w-[170px] max-h-60 overflow-y-auto z-50">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedType(opt.value)
                      setFilterDropdownOpen(false)
                    }}
                    className={`w-full px-2.5 py-1 text-left text-xs flex items-center justify-between transition-colors ${
                      selectedType === opt.value
                        ? 'bg-accent-muted text-accent font-medium border-l-2 border-accent'
                        : 'text-oros-300 hover:bg-oros-850 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <opt.icon 
                        className="w-3.5 h-3.5" 
                        style={{ color: opt.color || '#94a3b8' }} 
                      />
                      <span>{opt.label}</span>
                    </div>
                    {selectedType === opt.value && (
                      <Check className="w-3.5 h-3.5 text-oros-300" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hubs Only Toggle */}
          <button
            onClick={() => setShowOnlyHubs(!showOnlyHubs)}
            className={`px-2.5 py-1 rounded-[3px] border text-xs font-medium flex items-center gap-1.5 shadow-md transition-all ${
              showOnlyHubs
                ? 'bg-oros-800 border-oros-600 text-oros-100'
                : 'bg-oros-900 border-oros-750 text-oros-300 hover:text-white hover:border-oros-600'
            }`}
          >
            <Orbit className="w-3.5 h-3.5 text-oros-400" />
            <span>Hubs Only</span>
          </button>

          {/* Hover Floating Motion Toggle */}
          <button
            onClick={() => setHoverMotion(!hoverMotion)}
            className={`px-2.5 py-1 rounded-[3px] border text-xs font-medium flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              hoverMotion
                ? 'bg-oros-800 border-oros-600 text-oros-100'
                : 'bg-oros-900 border-oros-750 text-oros-400 hover:text-white hover:border-oros-600'
            }`}
            title={hoverMotion ? 'Hovering motion active (click to pause)' : 'Hovering paused (click to activate)'}
          >
            <Wind className="w-3.5 h-3.5 text-oros-400" />
            <span>{hoverMotion ? 'Hovering' : 'Hover: Off'}</span>
          </button>

          {/* Organize Layout Button */}
          <button
            onClick={handleSettleLayout}
            className="px-2.5 py-1 rounded-[3px] bg-oros-900 border border-oros-750 hover:border-oros-600 hover:text-white text-oros-300 text-xs font-medium flex items-center gap-1.5 shadow-md transition-all"
            title="Re-calculate and organize graph layout"
          >
            <Orbit className="w-3.5 h-3.5 text-oros-400" />
            <span className="hidden sm:inline">Organize</span>
          </button>

          {/* Recenter & Fit Camera */}
          <button
            onClick={() => fitView({ padding: 0.28, duration: 400, minZoom: 0.35, maxZoom: 1.5 })}
            className="p-1 rounded-[3px] bg-oros-900 border border-oros-750 hover:border-oros-600 hover:text-white text-oros-400 shadow-md transition-all"
            title="Fit view / center graph"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Export Graph Dropdown */}
          <ExportDropdown options={networkExportOptions} align="left" />
        </div>

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-[3px] bg-oros-900 border border-oros-750 text-[11px] font-mono text-oros-400 shadow-xl pointer-events-none flex items-center gap-2">
          <Link2 className="w-3 h-3 text-oros-400" />
          <span>Click any card to inspect connections, backlinks, and wiki articles</span>
        </div>
      </div>

      {/* Side Inspector Drawer for Selected Wiki Article */}
      {activeArticle && (
        <aside className="absolute top-0 right-0 bottom-0 w-80 bg-oros-950 border-l border-oros-800 shadow-2xl z-30 flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="p-3.5 border-b border-oros-800 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-[3px] bg-oros-900 border border-oros-800 overflow-hidden flex-shrink-0">
                {activeArticle.avatar ? (
                  <img src={activeArticle.avatar} alt={activeArticle.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-sans text-sm font-semibold text-oros-300">
                    {activeArticle.title.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-mono font-medium px-1.5 py-0.2 rounded-[2px] bg-oros-900 text-oros-300 border border-oros-800">
                  {activeArticle.type}
                </span>
                <h3 className="font-sans font-semibold text-sm text-oros-100 truncate mt-0.5">
                  {activeArticle.title}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedWikiId(null)}
              className="p-1 rounded-[2px] text-oros-400 hover:text-oros-200 hover:bg-oros-850"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Jump to Encyclopedia Button */}
          <div className="p-2.5 border-b border-oros-800 bg-oros-950">
            <button
              onClick={() => handleOpenInWiki(activeArticle.id)}
              className="btn-accent w-full py-1.5 px-3 rounded-[3px] font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open in Encyclopedia</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Summary */}
          {activeArticle.summary && (
            <div className="p-3.5 border-b border-oros-800">
              <h5 className="text-[10px] font-mono uppercase font-medium text-oros-500 mb-1">Entity Summary</h5>
              <p className="text-xs text-oros-300 leading-relaxed font-sans">
                {activeArticle.summary}
              </p>
            </div>
          )}

          {/* Cross References Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Outbound References */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[10px] font-mono uppercase font-medium text-oros-400 flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-oros-400" />
                  <span>Outbound Connections ({outboundArticles.length})</span>
                </h5>
                <span className="text-[10px] font-mono text-oros-500">Connects to</span>
              </div>

              {outboundArticles.length === 0 ? (
                <p className="text-xs text-oros-500 italic p-2 rounded-[3px] bg-oros-900 border border-oros-800 font-sans">
                  No outbound connections found in this article.
                </p>
              ) : (
                <div className="space-y-1">
                  {outboundArticles.map(({ entity: tgt, reason }) => (
                    <div
                      key={tgt.id}
                      onClick={() => setSelectedWikiId(tgt.id)}
                      className="p-1.5 rounded-[3px] bg-oros-900 border border-oros-800 hover:border-oros-700 hover:bg-oros-850 cursor-pointer transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-[2px] bg-oros-950 overflow-hidden flex-shrink-0 border border-oros-800">
                          {tgt.avatar ? (
                            <img src={tgt.avatar} alt={tgt.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-oros-400 font-bold">
                              {tgt.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-oros-200 group-hover:text-white truncate">
                            {tgt.title}
                          </div>
                          <div className="text-[10px] text-oros-500 font-mono truncate">
                            {reason}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-oros-300 transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inbound Backlinks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[10px] font-mono uppercase font-medium text-oros-400 flex items-center gap-1.5">
                  <Link2 className="w-3 h-3 text-oros-400" />
                  <span>Inbound Backlinks ({inboundArticles.length})</span>
                </h5>
                <span className="text-[10px] font-mono text-oros-500">Referenced by</span>
              </div>

              {inboundArticles.length === 0 ? (
                <p className="text-xs text-oros-500 italic p-2 rounded-[3px] bg-oros-900 border border-oros-800 font-sans">
                  No other articles reference this entity yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {inboundArticles.map(({ entity: src, reason }) => (
                    <div
                      key={src.id}
                      onClick={() => setSelectedWikiId(src.id)}
                      className="p-1.5 rounded-[3px] bg-oros-900 border border-oros-800 hover:border-oros-700 hover:bg-oros-850 cursor-pointer transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-[2px] bg-oros-950 overflow-hidden flex-shrink-0 border border-oros-800">
                          {src.avatar ? (
                            <img src={src.avatar} alt={src.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-oros-400 font-bold">
                              {src.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-oros-200 group-hover:text-white truncate">
                            {src.title}
                          </div>
                          <div className="text-[10px] text-oros-500 font-mono truncate">
                            {reason}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-oros-300 transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}

export const WikiNetworkGraph: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WikiNetworkGraphInner />
    </ReactFlowProvider>
  )
}
export default WikiNetworkGraph
