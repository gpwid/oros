import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { 
  ReactFlow, Controls, Background, MiniMap, Node, Edge, 
  MarkerType, Handle, Position, useNodesState, useEdgesState,
  useReactFlow, ReactFlowProvider, BaseEdge, EdgeProps, getStraightPath
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Network, Search, Filter, BookOpen, ExternalLink, ArrowRight, 
  Sparkles, Link2, User, MapPin, Shield, Gem, Scroll, 
  X, AlertCircle, Play, Pause, Maximize2, Orbit
} from 'lucide-react'
import { LoreEntity, EntityType } from '@shared/types'

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

// Icon helper by entity type (Single unified gold color palette)
const getEntityIcon = (type: EntityType) => {
  switch (type) {
    case 'character': return User
    case 'location': return MapPin
    case 'faction': return Shield
    case 'item': return Gem
    default: return Scroll
  }
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
  onSelect: (id: string) => void;
} }) => {
  const { entity, degree, inDegree, outDegree, isHub, isSelected } = data
  const Icon = getEntityIcon(entity.type)
  const [imgError, setImgError] = useState(false)

  return (
    <div 
      onClick={() => data.onSelect(entity.id)}
      className={`w-56 rounded-xl bg-oros-900/95 border-2 shadow-2xl transition-all duration-200 cursor-pointer select-none text-left relative ${
        isSelected 
          ? 'border-gold-400 ring-2 ring-gold-400/50 shadow-[0_0_24px_rgba(245,197,66,0.3)] z-30 scale-[1.02]' 
          : isHub
            ? 'border-gold-500/60 ring-1 ring-gold-400/20 hover:border-gold-400 shadow-xl'
            : 'border-oros-700/80 hover:border-gold-400/70'
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

      <div className="p-2.5 flex items-center gap-2.5">
        {/* Entity Portrait or Icon (Included on every card) */}
        <div className="w-11 h-11 rounded-lg overflow-hidden bg-oros-950 flex-shrink-0 border border-oros-700/70 flex items-center justify-center shadow-inner">
          {entity.avatar && !imgError ? (
            <img 
              src={entity.avatar} 
              alt={entity.title} 
              onError={() => setImgError(true)}
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-oros-850 to-oros-950 text-gold-400 font-serif font-bold text-sm">
              <Icon className="w-5 h-5 text-gold-400" />
            </div>
          )}
        </div>

        {/* Title and stats - Single-color gold/slate palette */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-oros-950 text-gold-300 border border-gold-400/20 truncate">
              {entity.type}
            </span>
            <span className="text-[9px] font-mono font-semibold text-oros-400 shrink-0" title={`${inDegree} backlinks, ${outDegree} outbound`}>
              {degree} {degree === 1 ? 'link' : 'links'}
            </span>
          </div>
          <h4 className="font-serif font-bold text-xs text-slate-100 truncate group-hover:text-gold-300">
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

interface SimNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
}

const WikiNetworkGraphInner: React.FC = () => {
  const { 
    entities, relations, activeWorldId, setSelectedEntityId, setActiveTab 
  } = useWorldStore()
  const { addToast } = useToastStore()
  const { fitView } = useReactFlow()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedWikiId, setSelectedWikiId] = useState<string | null>(null)
  const [showOnlyHubs, setShowOnlyHubs] = useState(false)
  const [isSimulating, setIsSimulating] = useState(true)

  const worldEntities = useMemo(() => {
    return activeWorldId ? entities[activeWorldId] || [] : []
  }, [activeWorldId, entities])

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
          allLinks.push({ source: r.sourceEntityId, target: r.targetEntityId, reason: r.label || 'Relasi' })
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
              allLinks.push({ source: source.id, target: target.id, reason: 'Disebutkan dalam artikel' })
              outDegreeMap[source.id] = (outDegreeMap[source.id] || 0) + 1
              inDegreeMap[target.id] = (inDegreeMap[target.id] || 0) + 1
            }
          }
        }
      })
    })

    return { inDegreeMap, outDegreeMap, allLinks }
  }, [worldEntities, worldRelations])

  // Filtered entities for nodes
  const filteredEntities = useMemo(() => {
    return worldEntities.filter(e => {
      if (selectedType !== 'all' && e.type !== selectedType) return false
      const degree = (inDegreeMap[e.id] || 0) + (outDegreeMap[e.id] || 0)
      if (showOnlyHubs && degree < 2) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!e.title.toLowerCase().includes(q) && !e.summary.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [worldEntities, selectedType, showOnlyHubs, searchQuery, inDegreeMap, outDegreeMap])

  // Mutable Simulation State Ref
  const simNodesRef = useRef<Map<string, SimNode>>(new Map())
  const animFrameRef = useRef<number | null>(null)
  const lastStateSyncRef = useRef<number>(0)

  // Initialize or re-synchronize simulation nodes
  useEffect(() => {
    const existing = simNodesRef.current
    const nextMap = new Map<string, SimNode>()
    const count = Math.max(filteredEntities.length, 1)
    const centerX = 550
    const centerY = 340
    const radius = Math.min(380, Math.max(220, count * 35))

    filteredEntities.forEach((ent, idx) => {
      if (existing.has(ent.id)) {
        nextMap.set(ent.id, existing.get(ent.id)!)
      } else {
        const angle = (idx / count) * 2 * Math.PI - Math.PI / 2
        const inDeg = inDegreeMap[ent.id] || 0
        const outDeg = outDegreeMap[ent.id] || 0
        const isHub = (inDeg + outDeg) >= 2
        const r = isHub ? radius * 0.7 : radius

        nextMap.set(ent.id, {
          id: ent.id,
          x: centerX + r * Math.cos(angle) + (Math.random() - 0.5) * 40,
          y: centerY + r * Math.sin(angle) + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0
        })
      }
    })

    // Pre-settle warm-up simulation (50 iterations)
    const nodeArray = Array.from(nextMap.values())
    const visibleIds = new Set(filteredEntities.map(e => e.id))
    const activeLinks = allLinks.filter(l => visibleIds.has(l.source) && visibleIds.has(l.target))

    for (let step = 0; step < 50; step++) {
      // 1. Center gravity (slight gravitational pull toward center)
      nodeArray.forEach(node => {
        node.vx += (centerX - node.x) * 0.0035
        node.vy += (centerY - node.y) * 0.0035
      })

      // 2. Coulomb Repulsion between all node pairs
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const n1 = nodeArray[i]
          const n2 = nodeArray[j]
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const distSq = dx * dx + dy * dy
          const dist = Math.sqrt(distSq) || 1
          const force = 48000 / Math.max(distSq, 1600)

          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          n1.vx -= fx
          n1.vy -= fy
          n2.vx += fx
          n2.vy += fy

          // Anti-overlap box push (224px width, 68px height)
          const overlapX = 230 - Math.abs(dx)
          const overlapY = 75 - Math.abs(dy)
          if (overlapX > 0 && overlapY > 0) {
            const push = Math.min(overlapX, overlapY) * 0.12
            n1.vx -= Math.sign(dx || 1) * push
            n1.vy -= Math.sign(dy || 1) * push
            n2.vx += Math.sign(dx || 1) * push
            n2.vy += Math.sign(dy || 1) * push
          }
        }
      }

      // 3. Link spring attraction
      activeLinks.forEach(l => {
        const n1 = nextMap.get(l.source)
        const n2 = nextMap.get(l.target)
        if (n1 && n2) {
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const delta = dist - 250
          const force = delta * 0.016
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          n1.vx += fx
          n1.vy += fy
          n2.vx -= fx
          n2.vy -= fy
        }
      })

      // 4. Damping & integration
      nodeArray.forEach(node => {
        node.vx *= 0.82
        node.vy *= 0.82
        node.x += node.vx
        node.y += node.vy
      })
    }

    simNodesRef.current = nextMap
  }, [filteredEntities, inDegreeMap, outDegreeMap, allLinks])

  // Build React Flow Nodes with initial coordinates
  const initialNodes: Node[] = useMemo(() => {
    return filteredEntities.map((ent) => {
      const sim = simNodesRef.current.get(ent.id) || { x: 550, y: 340 }
      const inDeg = inDegreeMap[ent.id] || 0
      const outDeg = outDegreeMap[ent.id] || 0
      const totalDeg = inDeg + outDeg
      const isHub = totalDeg >= 2

      return {
        id: ent.id,
        type: 'wikiArticle',
        position: { x: sim.x, y: sim.y },
        draggable: false, // User requested: "Dont have the option to move it at all"
        data: {
          entity: ent,
          degree: totalDeg,
          inDegree: inDeg,
          outDegree: outDeg,
          isHub,
          isSelected: selectedWikiId === ent.id,
          onSelect: (id: string) => setSelectedWikiId(id)
        }
      }
    })
  }, [filteredEntities, inDegreeMap, outDegreeMap, selectedWikiId])

  // Build React Flow Edges with initial optimal cardinal handles
  const initialEdges: Edge[] = useMemo(() => {
    const visibleIds = new Set(filteredEntities.map(e => e.id))

    return allLinks
      .filter(l => visibleIds.has(l.source) && visibleIds.has(l.target))
      .map((link, idx) => {
        const isHighlighted = selectedWikiId 
          ? link.source === selectedWikiId || link.target === selectedWikiId
          : false

        const strokeColor = isHighlighted ? '#f5c542' : '#475569'
        const strokeWidth = isHighlighted ? 2.5 : 1.5

        const srcPos = simNodesRef.current.get(link.source) || { x: 0, y: 0 }
        const tgtPos = simNodesRef.current.get(link.target) || { x: 0, y: 0 }
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
            opacity: selectedWikiId ? (isHighlighted ? 1 : 0.2) : 0.75
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 10,
            height: 10
          }
        }
      })
  }, [allLinks, filteredEntities, selectedWikiId])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  // DYNAMIC CONTINUOUS GRAVITY PHYSICS LOOP
  useEffect(() => {
    if (!isSimulating) return

    const centerX = 550
    const centerY = 340
    const visibleIds = new Set(filteredEntities.map(e => e.id))
    const activeLinks = allLinks.filter(l => visibleIds.has(l.source) && visibleIds.has(l.target))

    const stepSimulation = (time: number) => {
      const nodeMap = simNodesRef.current
      const nodeArray = Array.from(nodeMap.values())
      if (nodeArray.length === 0) return

      const timeSec = time * 0.001

      // 1. Center gravity (slight gravitational pull toward center)
      nodeArray.forEach((node, idx) => {
        node.vx += (centerX - node.x) * 0.003
        node.vy += (centerY - node.y) * 0.003

        // Subtle celestial breathing (gentle living float)
        node.vx += Math.sin(timeSec * 0.8 + idx * 0.7) * 0.06
        node.vy += Math.cos(timeSec * 0.8 + idx * 0.7) * 0.06
      })

      // 2. Pairwise Coulomb Repulsion & Box Collision
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const n1 = nodeArray[i]
          const n2 = nodeArray[j]
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const distSq = dx * dx + dy * dy
          const dist = Math.sqrt(distSq) || 1
          const force = 45000 / Math.max(distSq, 1600)

          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          n1.vx -= fx
          n1.vy -= fy
          n2.vx += fx
          n2.vy += fy

          // Card boundary anti-overlap push (224px width, 68px height)
          const overlapX = 230 - Math.abs(dx)
          const overlapY = 75 - Math.abs(dy)
          if (overlapX > 0 && overlapY > 0) {
            const push = Math.min(overlapX, overlapY) * 0.1
            n1.vx -= Math.sign(dx || 1) * push
            n1.vy -= Math.sign(dy || 1) * push
            n2.vx += Math.sign(dx || 1) * push
            n2.vy += Math.sign(dy || 1) * push
          }
        }
      }

      // 3. Link spring attraction
      activeLinks.forEach(l => {
        const n1 = nodeMap.get(l.source)
        const n2 = nodeMap.get(l.target)
        if (n1 && n2) {
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const delta = dist - 250
          const force = delta * 0.015
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          n1.vx += fx
          n1.vy += fy
          n2.vx -= fx
          n2.vy -= fy
        }
      })

      // 4. Velocity damping and integration
      nodeArray.forEach(node => {
        node.vx *= 0.84
        node.vy *= 0.84

        // Cap speed
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
        if (speed > 6) {
          node.vx = (node.vx / speed) * 6
          node.vy = (node.vy / speed) * 6
        }

        node.x += node.vx
        node.y += node.vy
      })

      // 5. Throttled sync to React Flow (~33ms / 30fps) for silky 60fps rendering without React overhead
      if (time - lastStateSyncRef.current > 32) {
        lastStateSyncRef.current = time

        setNodes(prev =>
          prev.map(n => {
            const sim = nodeMap.get(n.id)
            if (!sim) return n
            // Only update if moved noticeably
            if (Math.abs(n.position.x - sim.x) > 0.3 || Math.abs(n.position.y - sim.y) > 0.3) {
              return { ...n, position: { x: sim.x, y: sim.y } }
            }
            return n
          })
        )

        setEdges(prev =>
          prev.map(e => {
            const sPos = nodeMap.get(e.source)
            const tPos = nodeMap.get(e.target)
            if (!sPos || !tPos) return e
            const optimal = getOptimalHandles(sPos, tPos)
            if (e.sourceHandle !== optimal.sourceHandle || e.targetHandle !== optimal.targetHandle) {
              return { ...e, sourceHandle: optimal.sourceHandle, targetHandle: optimal.targetHandle }
            }
            return e
          })
        )
      }

      animFrameRef.current = requestAnimationFrame(stepSimulation)
    }

    animFrameRef.current = requestAnimationFrame(stepSimulation)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isSimulating, filteredEntities, allLinks, setNodes, setEdges])

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

  // Inbound backlinks (articles mentioning this article)
  const inboundArticles = useMemo(() => {
    if (!selectedWikiId) return []
    const sources = allLinks.filter(l => l.target === selectedWikiId).map(l => ({
      entity: worldEntities.find(e => e.id === l.source),
      reason: l.reason
    })).filter(item => item.entity !== undefined)
    return sources as { entity: LoreEntity; reason: string }[]
  }, [selectedWikiId, allLinks, worldEntities])

  const handleOpenInWiki = (entityId: string) => {
    setSelectedEntityId(entityId)
    setActiveTab('wiki')
    addToast('Membuka artikel di Ensiklopedia', 'info')
  }

  // Network health metrics
  const totalArticles = worldEntities.length
  const totalLinks = allLinks.length
  const orphanCount = worldEntities.filter(e => ((inDegreeMap[e.id] || 0) + (outDegreeMap[e.id] || 0)) === 0).length
  const hubCount = worldEntities.filter(e => ((inDegreeMap[e.id] || 0) + (outDegreeMap[e.id] || 0)) >= 2).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* Top Header & Metrics Bar - Unified Single Color Palette */}
      <div className="h-12 bg-oros-900/90 border-b border-oros-800/80 px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-md bg-gold-400/10 text-gold-400 border border-gold-400/20">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-sm font-bold text-slate-100 flex items-center gap-2">
              Jaringan Relasi Elemen Dunia
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-oros-800 text-gold-400 font-normal border border-gold-400/20">
                Knowledge Graph
              </span>
            </h2>
          </div>
        </div>

        {/* Global Network Health Stats (Unified Gold/Slate Colors) */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-oros-300">
            <BookOpen className="w-3.5 h-3.5 text-gold-400" />
            <span>{totalArticles} Elemen</span>
          </div>
          <div className="flex items-center gap-1.5 text-oros-300">
            <Link2 className="w-3.5 h-3.5 text-gold-400" />
            <span>{totalLinks} Relasi & Koneksi</span>
          </div>
          <div className="flex items-center gap-1.5 text-oros-300">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>{hubCount} Hubs</span>
          </div>
          {orphanCount > 0 && (
            <div className="flex items-center gap-1.5 text-oros-400" title="Elemen tanpa relasi">
              <AlertCircle className="w-3.5 h-3.5 text-gold-400" />
              <span>{orphanCount} Belum Terhubung</span>
            </div>
          )}
        </div>

        {/* Filter, Dynamic Gravity & Search Bar */}
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3 h-3 text-gold-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kartu..."
              className="bg-oros-950 border border-oros-800 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-oros-500 focus:outline-none focus:border-gold-400 w-32 lg:w-44 transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-oros-950 border border-oros-800 rounded-lg px-2 py-1 text-xs">
            <Filter className="w-3 h-3 text-gold-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Tipe</option>
              <option value="character">Karakter</option>
              <option value="location">Lokasi</option>
              <option value="faction">Fraksi</option>
              <option value="item">Item</option>
            </select>
          </div>

          {/* Toggle Hubs */}
          <button
            onClick={() => setShowOnlyHubs(!showOnlyHubs)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              showOnlyHubs
                ? 'bg-gold-500/20 border-gold-400 text-gold-300'
                : 'bg-oros-900 border-oros-800 text-oros-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-gold-400" />
            <span>Hubs Saja</span>
          </button>

          {/* Dynamic Gravity Float Toggle */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isSimulating
                ? 'bg-gold-500/10 border-gold-400/50 text-gold-400 shadow-sm'
                : 'bg-oros-900 border-oros-800 text-oros-400 hover:text-slate-200'
            }`}
            title={isSimulating ? 'Gravitasi & Dinamika: AKTIF' : 'Gravitasi & Dinamika: DIAM'}
          >
            <Orbit className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">{isSimulating ? 'Dinamis' : 'Diam'}</span>
          </button>

          {/* Recenter & Fit Camera */}
          <button
            onClick={() => fitView({ padding: 0.2, duration: 600 })}
            className="p-1.5 rounded-lg border border-oros-800 bg-oros-900 hover:bg-oros-800 text-oros-400 hover:text-gold-400 transition-colors"
            title="Pusatkan Kamera ke Seluruh Graf"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-1 h-full w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodesDraggable={false} // User requested: "Dont have the option to move it at all"
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#16202c" gap={24} size={1} />
          <Controls className="bg-oros-900 border border-oros-700 text-slate-200 fill-slate-200" />
          <MiniMap 
            nodeColor="#2b3b4f" 
            maskColor="rgba(11, 17, 24, 0.88)"
            className="bg-oros-950 border border-oros-800 rounded-xl overflow-hidden" 
          />
        </ReactFlow>

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1.5 rounded-full bg-oros-900/90 border border-oros-700/80 text-[11px] text-oros-300 shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-2">
          <Link2 className="w-3 h-3 text-gold-400" />
          <span>Klik salah satu kartu untuk melihat relasi, backlink, dan artikel ensiklopedia</span>
        </div>
      </div>

      {/* Side Inspector Drawer for Selected Wiki Article */}
      {activeArticle && (
        <aside className="absolute top-12 right-0 bottom-0 w-84 bg-oros-900/95 border-l border-oros-800/80 shadow-2xl z-30 flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-oros-800/80 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-oros-950 border border-oros-700/80 overflow-hidden flex-shrink-0">
                {activeArticle.avatar ? (
                  <img src={activeArticle.avatar} alt={activeArticle.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-serif text-lg font-bold text-gold-400">
                    {activeArticle.title.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-oros-950 text-gold-400 border border-gold-400/20">
                  {activeArticle.type}
                </span>
                <h3 className="font-serif font-bold text-sm text-slate-100 truncate mt-1">
                  {activeArticle.title}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedWikiId(null)}
              className="p-1 rounded-lg text-oros-400 hover:text-slate-100 hover:bg-oros-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Jump to Encyclopedia Button */}
          <div className="p-3 border-b border-oros-800/60 bg-oros-950/40">
            <button
              onClick={() => handleOpenInWiki(activeArticle.id)}
              className="w-full py-2 px-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-oros-950" />
              <span>Buka di Ensiklopedia</span>
              <ExternalLink className="w-3.5 h-3.5 text-oros-950" />
            </button>
          </div>

          {/* Summary */}
          {activeArticle.summary && (
            <div className="p-4 border-b border-oros-800/40">
              <h5 className="text-[10px] font-mono uppercase font-bold text-oros-400 mb-1">Ringkasan Entitas</h5>
              <p className="text-xs text-oros-300 leading-relaxed">
                {activeArticle.summary}
              </p>
            </div>
          )}

          {/* Cross References Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Outbound References */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-mono uppercase font-bold text-slate-200 flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-gold-400" />
                  <span>Koneksi Keluar ({outboundArticles.length})</span>
                </h5>
                <span className="text-[10px] text-oros-500">Menghubungkan ke</span>
              </div>

              {outboundArticles.length === 0 ? (
                <p className="text-xs text-oros-500 italic p-2 rounded-lg bg-oros-950/40">
                  Tidak ada koneksi keluar pada artikel ini.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {outboundArticles.map(({ entity: tgt, reason }) => (
                    <div
                      key={tgt.id}
                      onClick={() => setSelectedWikiId(tgt.id)}
                      className="p-2 rounded-lg bg-oros-950/70 border border-oros-800/70 hover:border-gold-400/60 cursor-pointer transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-oros-900 overflow-hidden flex-shrink-0">
                          {tgt.avatar ? (
                            <img src={tgt.avatar} alt={tgt.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gold-400 font-bold">
                              {tgt.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-bold text-slate-200 group-hover:text-gold-300 truncate">
                            {tgt.title}
                          </div>
                          <div className="text-[10px] text-oros-400 truncate">
                            {reason}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-gold-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inbound Backlinks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-mono uppercase font-bold text-slate-200 flex items-center gap-1.5">
                  <Link2 className="w-3 h-3 text-gold-400" />
                  <span>Koneksi Masuk ({inboundArticles.length})</span>
                </h5>
                <span className="text-[10px] text-oros-500">Dihubungkan oleh</span>
              </div>

              {inboundArticles.length === 0 ? (
                <p className="text-xs text-oros-500 italic p-2 rounded-lg bg-oros-950/40">
                  Belum ada artikel lain yang merujuk entitas ini.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {inboundArticles.map(({ entity: src, reason }) => (
                    <div
                      key={src.id}
                      onClick={() => setSelectedWikiId(src.id)}
                      className="p-2 rounded-lg bg-oros-950/70 border border-oros-800/70 hover:border-gold-400/60 cursor-pointer transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-oros-900 overflow-hidden flex-shrink-0">
                          {src.avatar ? (
                            <img src={src.avatar} alt={src.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gold-400 font-bold">
                              {src.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-bold text-slate-200 group-hover:text-gold-300 truncate">
                            {src.title}
                          </div>
                          <div className="text-[10px] text-oros-400 truncate">
                            {reason}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-oros-500 group-hover:text-gold-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
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
