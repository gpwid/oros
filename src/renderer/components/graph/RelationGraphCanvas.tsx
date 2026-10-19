import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { 
  ReactFlow, Background, Node, Edge, 
  MarkerType, Handle, Position, useNodesState, useEdgesState,
  EdgeLabelRenderer, EdgeProps, getStraightPath, getBezierPath,
  BaseEdge, ReactFlowProvider, useReactFlow, ConnectionMode,
  BackgroundVariant, Connection, SelectionMode
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { useSettingsStore, getEffectiveColorMode } from '../../store/useSettingsStore'
import { useActiveThemeTokens } from '../../utils/useActiveThemeTokens'
import { confirmDialog } from '../../store/useConfirmStore'
import { 
  Plus, Trash2, Edit3, ArrowRightLeft, X, 
  Heart, HeartCrack, Baby, HeartHandshake, Users, Crown, Shield, 
  Orbit, Swords, Gem, Flame, Skull, Anchor, BookOpen,
  ZoomIn, ZoomOut, Maximize2, Check, SlidersHorizontal, CornerDownRight,
  Spline, Minus, ArrowRight, ExternalLink,
  Scroll, Feather, Castle, Landmark, Flag, Scale, Key, Lock,
  Sparkles, Star, Eye, Compass, Crosshair, Coins, Sun, Moon,
  Link2, Share2, GitFork, Magnet, MousePointer, Hand
} from 'lucide-react'
import { RelationEdge, LoreEntity } from '@shared/types'
import { QuickPeekCard } from '../common/QuickPeekCard'
import { ExportDropdown, ExportOption } from '../common/ExportDropdown'
import { exportReactFlowToImage, exportRelationsToJson } from '../../utils/exportUtils'
import { calculateSmartSnap, SnapGuideLine } from '../../utils/snapEngine'

// ==========================================
// GEOMETRY & WAYPOINT ENGINE
// ==========================================
export interface Point {
  x: number
  y: number
}

const SNAP_SEGMENT_THRESHOLD = 16

export function findSnapCoordinate(
  val: number,
  candidates: number[],
  threshold: number = SNAP_SEGMENT_THRESHOLD
): { snapped: number; didSnap: boolean; snapTarget: number | null } {
  let bestDiff = threshold
  let bestCandidate: number | null = null

  for (const c of candidates) {
    const diff = Math.abs(val - c)
    if (diff < bestDiff) {
      bestDiff = diff
      bestCandidate = c
    }
  }

  if (bestCandidate !== null) {
    return { snapped: bestCandidate, didSnap: true, snapTarget: bestCandidate }
  }
  return { snapped: val, didSnap: false, snapTarget: null }
}

export function simplifyWaypoints(pts: Point[]): Point[] {
  if (pts.length <= 2) return pts

  let current = pts.map((p) => ({
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10
  }))

  let changed = true
  let passes = 0

  while (changed && current.length > 2 && passes < 6) {
    changed = false
    passes++

    // 1. Remove duplicate adjacent points (distance < 2px)
    const noDuplicates: Point[] = [current[0]]
    for (let i = 1; i < current.length; i++) {
      const prev = noDuplicates[noDuplicates.length - 1]
      const cur = current[i]
      if (Math.abs(prev.x - cur.x) >= 2 || Math.abs(prev.y - cur.y) >= 2) {
        noDuplicates.push(cur)
      } else {
        changed = true
      }
    }

    if (noDuplicates.length <= 2) {
      current = noDuplicates
      break
    }

    // 2. Remove collinear intermediate points (both horizontal and vertical)
    const simplified: Point[] = []
    for (let i = 0; i < noDuplicates.length; i++) {
      if (i > 0 && i < noDuplicates.length - 1) {
        const prev = simplified[simplified.length - 1]
        const cur = noDuplicates[i]
        const next = noDuplicates[i + 1]

        // Horizontal collinear: prev.y == cur.y == next.y
        if (Math.abs(prev.y - cur.y) < 2 && Math.abs(cur.y - next.y) < 2) {
          changed = true
          continue
        }
        // Vertical collinear: prev.x == cur.x == next.x
        if (Math.abs(prev.x - cur.x) < 2 && Math.abs(cur.x - next.x) < 2) {
          changed = true
          continue
        }
      }
      simplified.push(noDuplicates[i])
    }

    current = simplified
  }

  return current
}

export function computeOrthogonalWaypoints(
  source: { x: number; y: number; position?: Position },
  target: { x: number; y: number; position?: Position },
  stub: number = 24
): Point[] {
  const sPos = source.position || Position.Right
  const tPos = target.position || Position.Left

  const getNormal = (pos: Position): { dx: number; dy: number } => {
    switch (pos) {
      case Position.Left: return { dx: -1, dy: 0 }
      case Position.Right: return { dx: 1, dy: 0 }
      case Position.Top: return { dx: 0, dy: -1 }
      case Position.Bottom: return { dx: 0, dy: 1 }
      default: return { dx: 1, dy: 0 }
    }
  }

  const normS = getNormal(sPos)
  const normT = getNormal(tPos)

  const pStart: Point = { x: source.x, y: source.y }
  const pEnd: Point = { x: target.x, y: target.y }

  const p1: Point = { x: pStart.x + normS.dx * stub, y: pStart.y + normS.dy * stub }
  const pn_1: Point = { x: pEnd.x + normT.dx * stub, y: pEnd.y + normT.dy * stub }

  const isHorizS = sPos === Position.Left || sPos === Position.Right
  const isHorizT = tPos === Position.Left || tPos === Position.Right

  const raw: Point[] = [pStart, p1]

  if (isHorizS && isHorizT) {
    const facingEachOther = (normS.dx > 0 && normT.dx < 0 && p1.x < pn_1.x) ||
                           (normS.dx < 0 && normT.dx > 0 && p1.x > pn_1.x)
    if (facingEachOther) {
      const midX = (p1.x + pn_1.x) / 2
      raw.push({ x: midX, y: p1.y })
      raw.push({ x: midX, y: pn_1.y })
    } else {
      const midX = normS.dx > 0 ? Math.max(p1.x, pn_1.x) + stub : Math.min(p1.x, pn_1.x) - stub
      raw.push({ x: midX, y: p1.y })
      raw.push({ x: midX, y: pn_1.y })
    }
  } else if (!isHorizS && !isHorizT) {
    const facingEachOther = (normS.dy > 0 && normT.dy < 0 && p1.y < pn_1.y) ||
                           (normS.dy < 0 && normT.dy > 0 && p1.y > pn_1.y)
    if (facingEachOther) {
      const midY = (p1.y + pn_1.y) / 2
      raw.push({ x: p1.x, y: midY })
      raw.push({ x: pn_1.x, y: midY })
    } else {
      const midY = normS.dy > 0 ? Math.max(p1.y, pn_1.y) + stub : Math.min(p1.y, pn_1.y) - stub
      raw.push({ x: p1.x, y: midY })
      raw.push({ x: pn_1.x, y: midY })
    }
  } else if (isHorizS && !isHorizT) {
    raw.push({ x: p1.x, y: pn_1.y })
  } else {
    raw.push({ x: pn_1.x, y: p1.y })
  }

  raw.push(pn_1)
  raw.push(pEnd)

  return simplifyWaypoints(raw)
}

export function pointsToSmoothPath(points: Point[], cornerRadius: number = 8): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const cur = points[i]
    const next = points[i + 1]

    const len1 = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    const len2 = Math.hypot(next.x - cur.x, next.y - cur.y)
    const r = Math.min(cornerRadius, len1 / 2, len2 / 2)

    if (r <= 1) {
      d += ` L ${cur.x} ${cur.y}`
    } else {
      const u1x = (cur.x - prev.x) / len1
      const u1y = (cur.y - prev.y) / len1
      const startX = cur.x - u1x * r
      const startY = cur.y - u1y * r

      const u2x = (next.x - cur.x) / len2
      const u2y = (next.y - cur.y) / len2
      const endX = cur.x + u2x * r
      const endY = cur.y + u2y * r

      d += ` L ${startX} ${startY} Q ${cur.x} ${cur.y} ${endX} ${endY}`
    }
  }

  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

// Icon dictionary for customizable relationship badges (Extended Logos)
const RELATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  'heart-crack': HeartCrack,
  baby: Baby,
  handshake: HeartHandshake,
  users: Users,
  crown: Crown,
  shield: Shield,
  swords: Swords,
  orbit: Orbit,
  gem: Gem,
  flame: Flame,
  skull: Skull,
  anchor: Anchor,
  book: BookOpen,
  scroll: Scroll,
  feather: Feather,
  castle: Castle,
  landmark: Landmark,
  flag: Flag,
  scale: Scale,
  key: Key,
  lock: Lock,
  sparkles: Sparkles,
  star: Star,
  eye: Eye,
  compass: Compass,
  crosshair: Crosshair,
  coins: Coins,
  sun: Sun,
  moon: Moon,
  link: Link2,
  share: Share2,
  fork: GitFork
}

// Color palette options for bonds
const BOND_COLORS = [
  { label: 'Gold', hex: '#f5c542' },
  { label: 'Rose', hex: '#f43f5e' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Sky', hex: '#38bdf8' },
  { label: 'Purple', hex: '#c084fc' },
  { label: 'Amber', hex: '#f59e0b' },
  { label: 'Red', hex: '#ef4444' },
  { label: 'Teal', hex: '#14b8a6' },
  { label: 'Slate', hex: '#94a3b8' }
]

// Built-in relationship presets with rich icons & colors
const BOND_PRESETS = [
  { label: 'Spouse', icon: 'heart', color: '#f43f5e', type: 'family' as const, dashed: false },
  { label: 'Ex-Partner', icon: 'heart-crack', color: '#94a3b8', type: 'family' as const, dashed: true },
  { label: 'Child', icon: 'baby', color: '#f59e0b', type: 'family' as const, dashed: false },
  { label: 'Adopted Child', icon: 'handshake', color: '#38bdf8', type: 'family' as const, dashed: true },
  { label: 'Sibling', icon: 'users', color: '#10b981', type: 'family' as const, dashed: false },
  { label: 'High Sovereign', icon: 'crown', color: '#f5c542', type: 'ruler' as const, dashed: false },
  { label: 'Vassal / Fealty', icon: 'shield', color: '#14b8a6', type: 'vassal' as const, dashed: false },
  { label: 'Ally', icon: 'orbit', color: '#f5c542', type: 'ally' as const, dashed: false },
  { label: 'Rival / Enemy', icon: 'swords', color: '#ef4444', type: 'rival' as const, dashed: true },
  { label: 'Heirloom / Artifact', icon: 'gem', color: '#c084fc', type: 'creator' as const, dashed: false },
  { label: 'Mentor / Master', icon: 'book', color: '#38bdf8', type: 'family' as const, dashed: false },
  { label: 'Trade Partner', icon: 'coins', color: '#f59e0b', type: 'ally' as const, dashed: false },
  { label: 'Sworn Oath', icon: 'scroll', color: '#e2e8f0', type: 'ally' as const, dashed: false },
  { label: 'Faction Member', icon: 'flag', color: '#10b981', type: 'member' as const, dashed: false }
]

const getIconComponent = (key?: string) => {
  return RELATION_ICONS[key || 'orbit'] || Orbit
}

export function getEdgeMarkers(
  arrowDirection?: 'end' | 'both' | 'none' | 'start',
  strokeColor?: string,
  strokeWidth: number = 1.5
) {
  const dir = arrowDirection || 'end'
  const col = strokeColor || 'var(--oros-accent, #f97316)'
  const w = Number(strokeWidth) || 1.5
  const markerEnd =
    dir === 'end' || dir === 'both'
      ? {
          type: MarkerType.ArrowClosed,
          color: col,
          width: Math.max(12, Math.round(w * 7)),
          height: Math.max(12, Math.round(w * 7))
        }
      : undefined

  const markerStart =
    dir === 'start' || dir === 'both'
      ? {
          type: MarkerType.ArrowClosed,
          color: col,
          width: Math.max(12, Math.round(w * 7)),
          height: Math.max(12, Math.round(w * 7))
        }
      : undefined

  return { markerEnd, markerStart }
}

// Context to bridge ReactFlow Edge actions to store
interface RelationEdgeActionContextValue {
  updateWaypoints: (id: string, waypoints: Point[] | undefined) => void
  updateEdge: (id: string, patch: Partial<RelationEdge>) => void
  reverseEdge: (id: string) => void
  deleteEdge: (id: string) => void
  openEditModal: (id: string) => void
}

const RelationEdgeActionContext = React.createContext<RelationEdgeActionContextValue | null>(null)

interface GenealogyEdgeData {
  [key: string]: unknown
  relationId: string
  label: string
  icon?: string
  color?: string
  isDashed?: boolean
  strokePattern?: 'solid' | 'dashed' | 'dotted'
  strokeWidth?: number
  edgeType?: 'smoothstep' | 'bezier' | 'straight'
  arrowDirection?: 'end' | 'both' | 'none' | 'start'
  waypoints?: Point[]
  notes?: string
  relationType?: RelationEdge['relationType']
}

// ==========================================
// DYNAMIC GENEALOGY ARROW EDGE WITH MOVEABLE LEDGERS & TOOLBAR
// ==========================================
const GenealogyCustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
  markerEnd,
  markerStart
}) => {
  const reactFlow = useReactFlow()
  const themeTokens = useActiveThemeTokens()
  const edgeActions = React.useContext(RelationEdgeActionContext)
  const edgeData = ((data || {}) as unknown) as GenealogyEdgeData

  const edgeType = edgeData.edgeType || 'smoothstep'
  const strokeColor = edgeData.color || style.stroke || themeTokens.accent
  const strokeWidth = Number(edgeData.strokeWidth) || 1.5
  const strokePattern = edgeData.strokePattern || (edgeData.isDashed ? 'dashed' : 'solid')
  const arrowDirection = edgeData.arrowDirection || 'end'
  const label = edgeData.label
  const iconKey = edgeData.icon || 'orbit'
  const IconComp = getIconComponent(iconKey)

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [snapInfo, setSnapInfo] = useState<{ active: boolean; axis?: 'x' | 'y'; pos?: number } | null>(null)

  useEffect(() => {
    if (!selected) {
      setShowColorPicker(false)
    }
  }, [selected])

  // Anchored dynamic orthogonal waypoints
  const waypoints = useMemo(() => {
    if (edgeData.waypoints && edgeData.waypoints.length >= 2) {
      const cloned = edgeData.waypoints.map((p) => ({ ...p }))
      cloned[0] = { x: sourceX, y: sourceY }
      cloned[cloned.length - 1] = { x: targetX, y: targetY }
      return cloned
    }
    return computeOrthogonalWaypoints(
      { x: sourceX, y: sourceY, position: sourcePosition },
      { x: targetX, y: targetY, position: targetPosition }
    )
  }, [edgeData.waypoints, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition])

  let edgePath = ''
  let labelX = (sourceX + targetX) / 2
  let labelY = (sourceY + targetY) / 2

  if (edgeType === 'straight') {
    const [path, lx, ly] = getStraightPath({ sourceX, sourceY, targetX, targetY })
    edgePath = path
    labelX = lx
    labelY = ly
  } else if (edgeType === 'bezier') {
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.35
    })
    edgePath = path
    labelX = lx
    labelY = ly
  } else {
    edgePath = pointsToSmoothPath(waypoints, 10)
    if (waypoints.length >= 2) {
      const midSegIdx = Math.floor((waypoints.length - 1) / 2)
      labelX = (waypoints[midSegIdx].x + waypoints[midSegIdx + 1].x) / 2
      labelY = (waypoints[midSegIdx].y + waypoints[midSegIdx + 1].y) / 2
    }
  }

  // Bounding box for floating toolbar placement
  const bbox = useMemo(() => {
    const xs = waypoints.map((p) => p.x)
    const ys = waypoints.map((p) => p.y)
    const minX = Math.min(...xs, sourceX, targetX)
    const maxX = Math.max(...xs, sourceX, targetX)
    const minY = Math.min(...ys, sourceY, targetY)
    const maxY = Math.max(...ys, sourceY, targetY)
    return {
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      topY: minY - 36 < 40 ? maxY + 36 : minY - 36,
      minX,
      maxX,
      minY,
      maxY
    }
  }, [waypoints, sourceX, targetX, sourceY, targetY])

  // Moveable ledger drag handler for any segment with magnetic collapse snapping (Alt key bypasses)
  const handleSegmentPointerDown = (
    e: React.PointerEvent,
    segmentIndex: number,
    isHoriz: boolean
  ) => {
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const zoom = reactFlow.getZoom() || 1
    const initialPts = waypoints.map((p) => ({ ...p }))
    let lastPts = initialPts
    let lastEv: PointerEvent | null = null

    // Collect all snap candidates (parallel segments, endpoints, and adjacent corners)
    const snapCandidates: number[] = isHoriz ? [sourceY, targetY] : [sourceX, targetX]
    for (let j = 0; j < initialPts.length - 1; j++) {
      const isSegHoriz = Math.abs(initialPts[j].y - initialPts[j + 1].y) <= Math.abs(initialPts[j].x - initialPts[j + 1].x)
      if (isHoriz && isSegHoriz && j !== segmentIndex) {
        snapCandidates.push(initialPts[j].y)
      } else if (!isHoriz && !isSegHoriz && j !== segmentIndex) {
        snapCandidates.push(initialPts[j].x)
      }
    }
    // Include adjacent perpendicular corners so dragging a segment to zero collapses it
    if (segmentIndex > 0) {
      snapCandidates.push(isHoriz ? initialPts[segmentIndex - 1].y : initialPts[segmentIndex - 1].x)
    }
    if (segmentIndex + 2 < initialPts.length) {
      snapCandidates.push(isHoriz ? initialPts[segmentIndex + 2].y : initialPts[segmentIndex + 2].x)
    }

    const processPointerMove = (ev: PointerEvent, overrideAlt?: boolean) => {
      lastEv = ev
      const deltaX = (ev.clientX - startX) / zoom
      const deltaY = (ev.clientY - startY) / zoom
      const next = initialPts.map((p) => ({ ...p }))
      const bypassSnap = overrideAlt !== undefined ? overrideAlt : ev.altKey

      if (isHoriz) {
        const rawY = initialPts[segmentIndex].y + deltaY
        const { snapped, didSnap } = bypassSnap
          ? { snapped: rawY, didSnap: false }
          : findSnapCoordinate(rawY, snapCandidates, 16)
        const targetYVal = Math.round(snapped)

        if (didSnap) {
          setSnapInfo({ active: true, axis: 'y', pos: targetYVal })
        } else {
          setSnapInfo(null)
        }

        if (segmentIndex === 0) {
          if (Math.abs(targetYVal - sourceY) < 6) {
            next[0].y = sourceY
            next[1].y = sourceY
          } else {
            const stubX = (initialPts[1].x > initialPts[0].x ? 1 : -1) * 20
            next.splice(1, 0, { x: initialPts[0].x + stubX, y: initialPts[0].y }, { x: initialPts[0].x + stubX, y: targetYVal })
            next[3].y = targetYVal
          }
        } else if (segmentIndex === initialPts.length - 2) {
          if (Math.abs(targetYVal - targetY) < 6) {
            next[segmentIndex].y = targetY
            next[next.length - 1].y = targetY
          } else {
            const lastIdx = next.length - 1
            const stubX = (next[lastIdx - 1].x > next[lastIdx].x ? 1 : -1) * 20
            next[segmentIndex].y = targetYVal
            next.splice(lastIdx, 0, { x: next[lastIdx].x + stubX, y: targetYVal }, { x: next[lastIdx].x + stubX, y: next[lastIdx].y })
          }
        } else {
          next[segmentIndex].y = targetYVal
          next[segmentIndex + 1].y = targetYVal
        }
      } else {
        const rawX = initialPts[segmentIndex].x + deltaX
        const { snapped, didSnap } = bypassSnap
          ? { snapped: rawX, didSnap: false }
          : findSnapCoordinate(rawX, snapCandidates, 16)
        const targetXVal = Math.round(snapped)

        if (didSnap) {
          setSnapInfo({ active: true, axis: 'x', pos: targetXVal })
        } else {
          setSnapInfo(null)
        }

        if (segmentIndex === 0) {
          if (Math.abs(targetXVal - sourceX) < 6) {
            next[0].x = sourceX
            next[1].x = sourceX
          } else {
            const stubY = (initialPts[1].y > initialPts[0].y ? 1 : -1) * 20
            next.splice(1, 0, { x: initialPts[0].x, y: initialPts[0].y + stubY }, { x: targetXVal, y: initialPts[0].y + stubY })
            next[3].x = targetXVal
          }
        } else if (segmentIndex === initialPts.length - 2) {
          if (Math.abs(targetXVal - targetX) < 6) {
            next[segmentIndex].x = targetX
            next[next.length - 1].x = targetX
          } else {
            const lastIdx = next.length - 1
            const stubY = (next[lastIdx - 1].y > next[lastIdx].y ? 1 : -1) * 20
            next[segmentIndex].x = targetXVal
            next.splice(lastIdx, 0, { x: targetXVal, y: next[lastIdx].y + stubY }, { x: next[lastIdx].x, y: next[lastIdx].y + stubY })
          }
        } else {
          next[segmentIndex].x = targetXVal
          next[segmentIndex + 1].x = targetXVal
        }
      }

      const simplified = simplifyWaypoints(next)
      lastPts = simplified
      reactFlow.setEdges((eds) =>
        eds.map((ed) => (ed.id === id ? { ...ed, data: { ...ed.data, waypoints: simplified } } : ed))
      )
    }

    const onPointerMove = (ev: PointerEvent) => {
      processPointerMove(ev)
    }

    const onKeyDown = (ke: KeyboardEvent) => {
      if (ke.key === 'Alt' && lastEv) {
        processPointerMove(lastEv, true)
      }
    }

    const onKeyUp = (ke: KeyboardEvent) => {
      if (ke.key === 'Alt' && lastEv) {
        processPointerMove(lastEv, false)
      }
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      setSnapInfo(null)
      edgeActions?.updateWaypoints(id, lastPts)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  }

  const dashArray =
    strokePattern === 'dashed'
      ? '6 6'
      : strokePattern === 'dotted'
      ? '2 4'
      : undefined

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: dashArray
        }}
        className={`transition-all ${
          selected ? '!stroke-white filter drop-shadow(0 0 6px rgba(255,255,255,0.7))' : 'opacity-85 hover:opacity-100'
        }`}
      />

      {/* Snap Alignment Guideline */}
      {snapInfo?.active && snapInfo.pos !== undefined && (
        <line
          x1={snapInfo.axis === 'y' ? bbox.centerX - 1200 : snapInfo.pos}
          y1={snapInfo.axis === 'y' ? snapInfo.pos : bbox.centerY - 1200}
          x2={snapInfo.axis === 'y' ? bbox.centerX + 1200 : snapInfo.pos}
          y2={snapInfo.axis === 'y' ? snapInfo.pos : bbox.centerY + 1200}
          stroke={themeTokens.accent}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={0.85}
          pointerEvents="none"
        />
      )}

      {/* Invisible wider interaction hit path to make selecting easy */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          reactFlow.setEdges((eds) =>
            eds.map((ed) => ({ ...ed, selected: ed.id === id }))
          )
        }}
      />

      <EdgeLabelRenderer>
        {/* Dynamic moveable ledgers on every orthogonal segment (VVD style) */}
        {selected &&
          edgeType === 'smoothstep' &&
          waypoints.slice(0, -1).map((pA, idx) => {
            const pB = waypoints[idx + 1]
            const len = Math.hypot(pB.x - pA.x, pB.y - pA.y)
            if (len < 16) return null

            const isHoriz = Math.abs(pA.y - pB.y) <= Math.abs(pA.x - pB.x)
            const midX = (pA.x + pB.x) / 2
            const midY = (pA.y + pB.y) / 2

            return (
              <div
                key={`ledger-${idx}`}
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${midX}px, ${midY}px)`,
                  pointerEvents: 'all'
                }}
                className="nodrag nopan z-30"
              >
                <div
                  onPointerDown={(e) => handleSegmentPointerDown(e, idx, isHoriz)}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    edgeActions?.updateWaypoints(id, undefined)
                  }}
                  style={{ backgroundColor: strokeColor }}
                  className={`${
                    isHoriz ? 'w-7 h-3 cursor-ns-resize' : 'w-3 h-7 cursor-ew-resize'
                  } rounded-full border-2 border-white shadow-xl hover:scale-125 active:scale-95 transition-transform flex items-center justify-center`}
                  title="Drag to bend line (Double-click to reset)"
                />
              </div>
            )
          })}

        {/* Floating Capsule Toolbar (Positioned comfortably above connection) */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${bbox.centerX}px, ${bbox.topY}px)`,
              pointerEvents: 'all'
            }}
            className="nodrag nopan z-40"
          >
            <div
              className="flex items-center gap-1 bg-oros-900/95 backdrop-blur-md border border-oros-750 rounded-full px-2 py-1 shadow-2xl animate-dropdown-in select-none text-oros-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Color Swatch */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-4 h-4 rounded-full border border-white/60 shadow-sm transition-transform hover:scale-110 cursor-pointer flex items-center justify-center shrink-0"
                  style={{ backgroundColor: strokeColor }}
                  title="Color"
                />

                {showColorPicker && (
                  <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-oros-900 border border-oros-750 rounded-full p-1 shadow-2xl z-50 animate-dropdown-in">
                    {[{ label: 'Accent', hex: themeTokens.accent }, ...BOND_COLORS].map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          edgeActions?.updateEdge(id, { color: c.hex })
                          setShowColorPicker(false)
                        }}
                        className="w-3.5 h-3.5 rounded-full border border-white/30 hover:scale-125 transition-transform shrink-0"
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Route Type */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const types: ('smoothstep' | 'bezier' | 'straight')[] = ['smoothstep', 'bezier', 'straight']
                  const next = types[(types.indexOf(edgeType) + 1) % types.length]
                  edgeActions?.updateEdge(id, { edgeType: next })
                }}
                className="p-1 rounded-full hover:bg-oros-850 text-oros-300 hover:text-white transition-colors cursor-pointer"
                title="Route type"
              >
                {edgeType === 'smoothstep' ? (
                  <CornerDownRight className="w-3.5 h-3.5 text-accent" />
                ) : edgeType === 'bezier' ? (
                  <Spline className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-accent" />
                )}
              </button>

              {/* Stroke Pattern */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const patterns: ('solid' | 'dashed' | 'dotted')[] = ['solid', 'dashed', 'dotted']
                  const next = patterns[(patterns.indexOf(strokePattern) + 1) % patterns.length]
                  edgeActions?.updateEdge(id, { strokePattern: next, isDashed: next !== 'solid' })
                }}
                className="px-1 py-0.5 rounded-full hover:bg-oros-850 text-oros-300 hover:text-white transition-colors cursor-pointer text-[9px] font-mono font-bold"
                title="Stroke pattern"
              >
                {strokePattern === 'solid' ? '—' : strokePattern === 'dashed' ? '--' : '··'}
              </button>

              {/* Stroke Thickness */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const weights = [1.5, 2.5, 4]
                  const curIdx = weights.indexOf(strokeWidth)
                  const next = weights[(curIdx === -1 ? 0 : curIdx + 1) % weights.length]
                  edgeActions?.updateEdge(id, { strokeWidth: next })
                }}
                className="px-1 py-0.5 rounded-full hover:bg-oros-850 text-oros-300 hover:text-white transition-colors cursor-pointer text-[9px] font-mono"
                title="Stroke thickness"
              >
                {strokeWidth}px
              </button>

              {/* Arrowheads */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const dirs: ('end' | 'both' | 'none' | 'start')[] = ['end', 'both', 'none', 'start']
                  const cur = arrowDirection
                  const next = dirs[(dirs.indexOf(cur) + 1) % dirs.length]
                  edgeActions?.updateEdge(id, { arrowDirection: next })
                }}
                className="p-1 rounded-full hover:bg-oros-850 text-oros-300 hover:text-white transition-colors cursor-pointer"
                title="Arrowheads"
              >
                {arrowDirection === 'both' ? (
                  <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
                ) : arrowDirection === 'none' ? (
                  <Minus className="w-3.5 h-3.5 opacity-40" />
                ) : arrowDirection === 'start' ? (
                  <ArrowRight className="w-3.5 h-3.5 rotate-180 text-accent" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-accent" />
                )}
              </button>

              {/* Reverse Direction */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  edgeActions?.reverseEdge(id)
                }}
                className="p-1 rounded-full hover:bg-oros-850 text-oros-400 hover:text-white transition-colors cursor-pointer"
                title="Reverse direction"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {/* Edit Relation Modal Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  edgeActions?.openEditModal(id)
                }}
                className="p-1 rounded-full hover:bg-oros-850 text-oros-400 hover:text-white transition-colors cursor-pointer"
                title="Edit relationship"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />

              {/* Delete Connection */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  edgeActions?.deleteEdge(id)
                }}
                className="p-1 rounded-full hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Delete connection"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Midpoint Bond Badge */}
        {label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              borderColor: strokeColor
            }}
            onClick={(e) => {
              e.stopPropagation()
              reactFlow.setEdges((eds) =>
                eds.map((ed) => ({ ...ed, selected: ed.id === id }))
              )
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              edgeActions?.openEditModal(id)
            }}
            title="Click to select bond, double-click to edit"
            className="nodrag nopan group px-2.5 py-1 rounded-full bg-oros-950/90 border border-oros-750 hover:border-oros-500 text-[10px] font-mono font-medium text-oros-200 shadow-md whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 hover:scale-105"
          >
            <span style={{ color: strokeColor }}>
              <IconComp className="w-3 h-3" />
            </span>
            <span>{label}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                edgeActions?.openEditModal(id)
              }}
              className="p-0.5 rounded text-oros-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
              title="Edit Bond"
            >
              <Edit3 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

// Portrait Card Node matching Project Oros UI
const GenealogyCardNode = ({ id, data, selected }: { 
  id: string; 
  data: { 
    entity?: LoreEntity; 
    isUnassigned?: boolean;
    onSelect: (id: string) => void;
    onQuickAdd: (sourceId: string, direction: 'top' | 'bottom' | 'left' | 'right') => void;
    onAssign: (nodeId: string) => void;
    onDelete?: (id: string) => void;
    isSelected?: boolean;
  };
  selected?: boolean;
}) => {
  const { entity, isUnassigned, onSelect, onQuickAdd, onAssign, onDelete, isSelected } = data
  const isCardSelected = selected || isSelected
  const [imgError, setImgError] = useState(false)

  if (isUnassigned || !entity) {
    return (
      <div 
        onClick={() => onAssign(id)}
        className="w-36 h-48 rounded-[3px] border border-dashed border-oros-750 hover:border-oros-500 bg-oros-950 flex flex-col items-center justify-center transition-colors cursor-pointer group shadow-sm relative select-none"
      >
        <Plus className="w-8 h-8 text-oros-500 group-hover:text-oros-300 transition-colors" />
        
        <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-[2px] bg-oros-900 border border-oros-750 text-oros-400 group-hover:text-oros-200 text-[10px] font-mono uppercase tracking-wider text-center transition-colors">
          Add Entity
        </div>

        {/* Drag handles for unassigned card */}
        <Handle type="source" position={Position.Top} id="top" className="!w-5 !h-5 !-top-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-sm">
          <Plus className="w-3 h-3 pointer-events-none" />
        </Handle>
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-5 !h-5 !-bottom-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-sm">
          <Plus className="w-3 h-3 pointer-events-none" />
        </Handle>
        <Handle type="source" position={Position.Left} id="left" className="!w-5 !h-5 !-left-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-sm">
          <Plus className="w-3 h-3 pointer-events-none" />
        </Handle>
        <Handle type="source" position={Position.Right} id="right" className="!w-5 !h-5 !-right-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-sm">
          <Plus className="w-3 h-3 pointer-events-none" />
        </Handle>
      </div>
    )
  }

  return (
    <div 
      onClick={() => onSelect(entity.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Del' || e.key === 'Backspace') {
          e.stopPropagation()
          e.preventDefault()
          onDelete?.(entity.id)
        }
      }}
      className={`w-36 h-48 rounded-[3px] bg-oros-900 shadow-sm group transition-all cursor-pointer relative select-none outline-none ${
        isCardSelected 
          ? 'ring-2 ring-accent border border-accent shadow-accent/20 shadow-md' 
          : 'border border-oros-750 hover:border-oros-500'
      }`}
    >
      {/* 4 Interactive Drag/Click Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        title="Drag line to connect, or click to spawn entity above"
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(id, 'top')
        }}
        className="!w-5 !h-5 !-top-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 hover:!text-oros-100 flex items-center justify-center cursor-crosshair z-30 transition-colors shadow-sm"
      >
        <Plus className="w-3 h-3 pointer-events-none" />
      </Handle>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        title="Drag line to connect, or click to spawn entity below"
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(id, 'bottom')
        }}
        className="!w-5 !h-5 !-bottom-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 hover:!text-oros-100 flex items-center justify-center cursor-crosshair z-30 transition-colors shadow-sm"
      >
        <Plus className="w-3 h-3 pointer-events-none" />
      </Handle>

      <Handle
        type="source"
        position={Position.Left}
        id="left"
        title="Drag line to connect, or click to spawn peer left"
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(id, 'left')
        }}
        className="!w-5 !h-5 !-left-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 hover:!text-oros-100 flex items-center justify-center cursor-crosshair z-30 transition-colors shadow-sm"
      >
        <Plus className="w-3 h-3 pointer-events-none" />
      </Handle>

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        title="Drag line to connect, or click to spawn peer right"
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(id, 'right')
        }}
        className="!w-5 !h-5 !-right-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 hover:!text-oros-100 flex items-center justify-center cursor-crosshair z-30 transition-colors shadow-sm"
      >
        <Plus className="w-3 h-3 pointer-events-none" />
      </Handle>

      {/* Portrait Artwork Frame */}
      <div className="w-full h-full rounded-[2px] overflow-hidden bg-oros-950 relative">
        {entity.avatar && !imgError ? (
          <img
            src={entity.avatar}
            alt={entity.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-oros-900 text-oros-400 font-serif text-3xl font-semibold">
            <span>{entity.title.charAt(0)}</span>
          </div>
        )}
        {entity.avatar && !imgError && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-oros-950 via-oros-950/70 to-transparent pointer-events-none rounded-b-[2px]" />
        )}
      </div>

      {/* Name Plate */}
      <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-[2px] bg-oros-950/95 border border-oros-750 group-hover:border-oros-500 text-oros-100 font-sans font-medium text-xs tracking-tight shadow-sm text-center truncate transition-colors z-20">
        {entity.title}
      </div>

      {/* Quick Delete Action on Hover */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(entity.id)
          }}
          title={`Delete ${entity.title}`}
          className="absolute top-1.5 right-1.5 z-40 p-1 rounded-[2px] bg-oros-950/90 hover:bg-rose-950 text-oros-400 hover:text-rose-300 border border-oros-750 hover:border-rose-700/80 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

const nodeTypes = {
  genealogyCard: GenealogyCardNode
}

const edgeTypes = {
  genealogyEdge: GenealogyCustomEdge
}

// Floating Zoom Controls
const FloatingZoomControls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { settings } = useSettingsStore()
  const isLight = getEffectiveColorMode(settings.interface.colorMode) === 'light'

  return (
    <div className={`absolute bottom-5 right-5 z-20 flex flex-col items-center gap-1 p-1 rounded-lg border shadow-lg ${
      isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-oros-900/95 backdrop-blur-md border-oros-750 text-oros-300'
    }`}>
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className={`p-1.5 rounded-md transition-colors ${
          isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-oros-400 hover:text-oros-100 hover:bg-oros-800'
        }`}
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className={`p-1.5 rounded-md transition-colors ${
          isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-oros-400 hover:text-oros-100 hover:bg-oros-800'
        }`}
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => fitView({ padding: 0.2, duration: 400 })}
        className={`p-1.5 rounded-md transition-colors ${
          isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-oros-400 hover:text-oros-100 hover:bg-oros-800'
        }`}
        title="Fit Full Tree"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export const RelationGraphCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <RelationGraphCanvasContent />
    </ReactFlowProvider>
  )
}

const RelationGraphCanvasContent: React.FC = () => {
  const { 
    worlds, entities, relations, activeWorldId, setSelectedEntityId, openTab,
    createRelation, updateRelation, deleteRelation, createEntity, deleteEntity,
    relationNodePositions, saveRelationNodePosition 
  } = useWorldStore()

  const activeWorld = (worlds || []).find((w) => w.id === activeWorldId)
  const containerRef = useRef<HTMLDivElement>(null)

  const { settings } = useSettingsStore()
  const isLight = getEffectiveColorMode(settings.interface.colorMode) === 'light'
  const themeTokens = useActiveThemeTokens()
  const { addToast } = useToastStore()
  const reactFlowInstance = useReactFlow()

  // Smart Snapping & Alignment state
  const [smartSnapEnabled, setSmartSnapEnabled] = useState(true)
  const [snapGuides, setSnapGuides] = useState<SnapGuideLine[]>([])
  const isAltPressedRef = useRef(false)
  const [isAltPressed, setIsAltPressed] = useState(false)

  // Track Alt key press globally to temporarily bypass snapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        isAltPressedRef.current = true
        setIsAltPressed(true)
        setSnapGuides([])
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        isAltPressedRef.current = false
        setIsAltPressed(false)
      }
    }

    const handleWindowBlur = () => {
      isAltPressedRef.current = false
      setIsAltPressed(false)
    }

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      if (e.altKey !== isAltPressedRef.current) {
        isAltPressedRef.current = e.altKey
        setIsAltPressed(e.altKey)
        if (e.altKey) setSnapGuides([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [])

  // Tool Selector: select vs pan
  const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select')

  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRelation, setEditingRelation] = useState<RelationEdge | null>(null)
  const [activeEntityForPeek, setActiveEntityForPeek] = useState<LoreEntity | null>(null)
  const [showBondsDrawer, setShowBondsDrawer] = useState(false)

  // Quick Add Context State
  const [quickAddSourceNodeId, setQuickAddSourceNodeId] = useState<string | null>(null)

  // Add Bond Form State
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>('existing')
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const [newCharacterName, setNewCharacterName] = useState('')
  const [relationLabel, setRelationLabel] = useState('Child')
  const [relationType, setRelationType] = useState<RelationEdge['relationType']>('family')
  const [selectedIcon, setSelectedIcon] = useState('baby')
  const [selectedColor, setSelectedColor] = useState('#f59e0b')
  const [strokePattern, setStrokePattern] = useState<'solid' | 'dashed' | 'dotted'>('solid')
  const [strokeWidth, setStrokeWidth] = useState<number>(1.5)
  const [edgeType, setEdgeType] = useState<'smoothstep' | 'bezier' | 'straight'>('smoothstep')
  const [arrowDirection, setArrowDirection] = useState<'end' | 'both' | 'none' | 'start'>('end')
  const [relationNotes, setRelationNotes] = useState('')

  // Edit Bond Form State
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState<RelationEdge['relationType']>('family')
  const [editIcon, setEditIcon] = useState('baby')
  const [editColor, setEditColor] = useState('#f59e0b')
  const [editStrokePattern, setEditStrokePattern] = useState<'solid' | 'dashed' | 'dotted'>('solid')
  const [editStrokeWidth, setEditStrokeWidth] = useState<number>(1.5)
  const [editEdgeType, setEditEdgeType] = useState<'smoothstep' | 'bezier' | 'straight'>('smoothstep')
  const [editArrowDirection, setEditArrowDirection] = useState<'end' | 'both' | 'none' | 'start'>('end')
  const [editNotes, setEditNotes] = useState('')

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldRelations = activeWorldId ? relations[activeWorldId] || [] : []

  const handleDeleteEntity = useCallback(async (entityId: string) => {
    const ent = worldEntities.find((e) => e.id === entityId)
    const title = ent ? ent.title : 'this entry'
    const ok = await confirmDialog({
      title: 'Delete Entry',
      message: `Are you sure you want to permanently delete "${title}" and all its relational connections?`,
      confirmText: 'Delete Entry',
      variant: 'danger'
    })
    if (!ok) return
    deleteEntity(entityId)
    if (activeEntityForPeek?.id === entityId) {
      setActiveEntityForPeek(null)
    }
    addToast(`Deleted entry "${title}" from world`, 'info')
  }, [worldEntities, deleteEntity, activeEntityForPeek, addToast])

  // Clean initial coordinates for genealogy layout, with persistence support
  const initialNodes: Node[] = useMemo(() => {
    const defaultPositions: Record<string, { x: number; y: number }> = {
      'char-katherine': { x: 180, y: 100 },
      'char-ronald': { x: 480, y: 100 },
      'char-vespera': { x: 760, y: 100 },
      'char-marcus': { x: 1040, y: 100 },
      'char-aurelius': { x: 620, y: 360 },
      'char-lyra': { x: 900, y: 360 },
      'fac-solar': { x: 180, y: 360 },
      'item-astral-crown': { x: 480, y: -140 }
    }

    const savedPositions = (activeWorldId && relationNodePositions[activeWorldId]) || {}

    return worldEntities.map((ent, idx) => {
      const pos = savedPositions[ent.id] || defaultPositions[ent.id] || { 
        x: 180 + (idx % 4) * 280, 
        y: 100 + Math.floor(idx / 4) * 260 
      }

      const isSelected = activeEntityForPeek?.id === ent.id

      return {
        id: ent.id,
        type: 'genealogyCard',
        position: pos,
        selected: isSelected,
        data: {
          entity: ent,
          isSelected,
          onSelect: (id: string) => {
            const e = worldEntities.find(item => item.id === id)
            if (e) {
              setActiveEntityForPeek(e)
              setSelectedEntityId(e.id)
              setNodes((nds) =>
                nds.map((n) => ({
                  ...n,
                  selected: n.id === id,
                  data: {
                    ...n.data,
                    isSelected: n.id === id
                  }
                }))
              )
            }
          },
          onQuickAdd: (sourceId: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
            handleTriggerQuickAdd(sourceId, direction)
          },
          onAssign: () => {
            setQuickAddSourceNodeId(ent.id)
            setShowAddModal(true)
          },
          onDelete: (id: string) => handleDeleteEntity(id)
        }
      }
    })
  }, [worldEntities, activeWorldId, relationNodePositions, handleDeleteEntity, activeEntityForPeek])

  // Generate interactive edges with full ledger & waypoint support
  const initialEdges: Edge[] = useMemo(() => {
    return worldRelations.map((rel) => {
      const bondColor = rel.color || themeTokens.accent
      const curStrokePattern = rel.strokePattern || (rel.isDashed ? 'dashed' : 'solid')
      const curStrokeWidth = rel.strokeWidth || 1.5
      const curEdgeType = rel.edgeType || 'smoothstep'
      const curArrowDir = rel.arrowDirection || 'end'

      let sourceHandle = 'bottom'
      let targetHandle = 'top'

      if (
        rel.label.toLowerCase().includes('spouse') || 
        rel.label.toLowerCase().includes('sibling') ||
        rel.label.toLowerCase().includes('partner') ||
        rel.label.toLowerCase().includes('pasangan')
      ) {
        sourceHandle = 'right'
        targetHandle = 'left'
      }

      const markers = getEdgeMarkers(curArrowDir, bondColor, curStrokeWidth)

      return {
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        sourceHandle,
        targetHandle,
        label: rel.label,
        type: 'genealogyEdge',
        markerEnd: markers.markerEnd,
        markerStart: markers.markerStart,
        data: {
          relationId: rel.id,
          label: rel.label,
          icon: rel.icon || 'orbit',
          color: bondColor,
          isDashed: rel.isDashed ?? (curStrokePattern !== 'solid'),
          strokePattern: curStrokePattern,
          strokeWidth: curStrokeWidth,
          edgeType: curEdgeType,
          arrowDirection: curArrowDir,
          waypoints: rel.waypoints,
          notes: rel.notes,
          relationType: rel.relationType
        }
      }
    })
  }, [worldRelations, themeTokens.accent])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  React.useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  React.useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  // Smart snapping node movement & dynamic alignment guidelines (Alt key bypasses)
  const handleNodesChangeWrapped = useCallback((changes: any) => {
    if (smartSnapEnabled && !isAltPressedRef.current) {
      const posChanges = changes.filter((c: any) => c.type === 'position' && c.dragging && c.position)
      if (posChanges.length === 1) {
        const posChange = posChanges[0]
        const dragged = nodes.find((n) => n.id === posChange.id)
        if (dragged) {
          const dW = 144 // Card width (w-36 = 144px)
          const dH = 192 // Card height (h-48 = 192px)
          const others = nodes
            .filter((n) => n.id !== dragged.id && !n.selected)
            .map((n) => ({
              id: n.id,
              x: n.position.x,
              y: n.position.y,
              width: 144,
              height: 192
            }))
          const { snappedX, snappedY, guides } = calculateSmartSnap(
            { id: dragged.id, x: posChange.position.x, y: posChange.position.y, width: dW, height: dH },
            others
          )
          posChange.position.x = snappedX
          posChange.position.y = snappedY
          setSnapGuides(guides)
        }
      } else if (posChanges.length > 1) {
        // Multi-select dragging: preserve relative offsets cleanly
        if (snapGuides.length > 0) setSnapGuides([])
      } else if (snapGuides.length > 0) {
        setSnapGuides([])
      }
    } else if (snapGuides.length > 0) {
      setSnapGuides([])
    }

    onNodesChange(changes)
  }, [nodes, onNodesChange, smartSnapEnabled, snapGuides.length])

  const handleNodeDragStop = useCallback((_: any, node: Node) => {
    setSnapGuides([])
    const currentNodes = reactFlowInstance.getNodes()
    const selectedNodes = currentNodes.filter((n) => n.selected)
    if (selectedNodes.length > 1) {
      selectedNodes.forEach((n) => {
        saveRelationNodePosition(n.id, n.position)
      })
    } else {
      saveRelationNodePosition(node.id, node.position)
    }
  }, [reactFlowInstance, saveRelationNodePosition])

  const handleExportGraphImage = async (format: 'png' | 'svg') => {
    if (!containerRef.current) return
    const safeName = (activeWorld?.name || 'relations').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    try {
      await exportReactFlowToImage(containerRef.current, nodes, format, {
        filename: `${safeName}_relations.${format}`,
        pixelRatio: 2,
        backgroundColor: '#090a0d',
        padding: 64
      })
      addToast(`Relations exported as ${format.toUpperCase()}`, 'success')
    } catch (err) {
      console.error('Failed to export relations:', err)
      addToast('Failed to export relations graph', 'error')
    }
  }

  const handleExportGraphJson = async () => {
    try {
      const ok = await exportRelationsToJson(worldRelations, worldEntities, activeWorld?.name)
      if (ok) addToast('Relations data exported as JSON', 'success')
    } catch (err) {
      console.error('Failed to export relations data:', err)
      addToast('Failed to export relations JSON', 'error')
    }
  }

  const relationExportOptions: ExportOption[] = [
    {
      id: 'export-png',
      label: 'Export Graph (2x PNG)',
      badge: 'PNG',
      onClick: () => handleExportGraphImage('png')
    },
    {
      id: 'export-svg',
      label: 'Export Graph (Vector SVG)',
      badge: 'SVG',
      onClick: () => handleExportGraphImage('svg')
    },
    {
      id: 'export-json',
      label: 'Export Bonds (JSON)',
      badge: 'JSON',
      onClick: handleExportGraphJson
    }
  ]

  // Context Edge Actions for custom ledgers & toolbar
  const handleUpdateWaypoints = useCallback((id: string, waypoints: Point[] | undefined) => {
    updateRelation(id, { waypoints })
    setEdges((eds) =>
      eds.map((ed) => (ed.id === id ? { ...ed, data: { ...ed.data, waypoints } } : ed))
    )
  }, [updateRelation, setEdges])

  const handleUpdateEdge = useCallback((id: string, patch: Partial<RelationEdge>) => {
    updateRelation(id, patch)
    setEdges((eds) =>
      eds.map((ed) => {
        if (ed.id === id) {
          const updatedData = { ...ed.data, ...patch } as GenealogyEdgeData
          const updatedMarkers = getEdgeMarkers(
            updatedData.arrowDirection,
            updatedData.color,
            updatedData.strokeWidth
          )
          return {
            ...ed,
            data: updatedData,
            markerEnd: updatedMarkers.markerEnd,
            markerStart: updatedMarkers.markerStart
          } as Edge
        }
        return ed
      })
    )
  }, [updateRelation, setEdges])

  const handleReverseEdge = useCallback((id: string) => {
    const rel = worldRelations.find((r) => r.id === id)
    if (!rel) return
    const reversedWaypoints = rel.waypoints ? [...rel.waypoints].reverse() : undefined
    updateRelation(id, {
      sourceEntityId: rel.targetEntityId,
      targetEntityId: rel.sourceEntityId,
      waypoints: reversedWaypoints
    })
    addToast('Reversed relationship direction', 'info')
  }, [worldRelations, updateRelation, addToast])

  const handleDeleteRelationEdge = useCallback((id: string) => {
    deleteRelation(id)
    if (editingRelation?.id === id) {
      setEditingRelation(null)
    }
    addToast('Deleted relational bond', 'info')
  }, [deleteRelation, editingRelation, addToast])

  // Window-level Del / Backspace shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isDelete = e.key === 'Delete' || e.key === 'Del' || e.key === 'Backspace'
      if (!isDelete) return

      // Don't intercept when user is typing in inputs or text areas
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

      // If any modal is open, don't intercept canvas deletion
      if (showAddModal || editingRelation) return

      // 1. If an edge is selected
      const selectedEdge = edges.find((ed) => ed.selected)
      if (selectedEdge) {
        e.preventDefault()
        handleDeleteRelationEdge(selectedEdge.id)
        return
      }

      // 2. If one or more nodes are selected in ReactFlow
      const currentNodes = reactFlowInstance.getNodes()
      const selectedNodes = currentNodes.filter((n) => n.selected)
      if (selectedNodes.length > 0) {
        e.preventDefault()
        if (selectedNodes.length === 1) {
          handleDeleteEntity(selectedNodes[0].id)
        } else {
          const count = selectedNodes.length
          confirmDialog({
            title: `Delete ${count} Entries`,
            message: `Delete ${count} selected entries from Codex? All their relations will also be removed.`,
            confirmText: `Delete ${count} Entries`,
            variant: 'danger'
          }).then((confirmed) => {
            if (confirmed) {
              selectedNodes.forEach((n) => deleteEntity(n.id))
              if (activeEntityForPeek && selectedNodes.some((n) => n.id === activeEntityForPeek.id)) {
                setActiveEntityForPeek(null)
              }
              addToast(`Deleted ${count} entities`, 'info')
            }
          })
        }
        return
      }

      // 3. If an entity profile drawer is currently open
      if (activeEntityForPeek) {
        e.preventDefault()
        handleDeleteEntity(activeEntityForPeek.id)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [edges, nodes, activeEntityForPeek, showAddModal, editingRelation, reactFlowInstance, deleteEntity, addToast, handleDeleteRelationEdge, handleDeleteEntity])

  // React Flow native drag-to-connect handler
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return
    if (connection.source === connection.target) return

    setQuickAddSourceNodeId(connection.source)
    setSelectedExistingId(connection.target)
    setTargetMode('existing')

    // Automatically set preset based on handle direction
    if (connection.sourceHandle === 'bottom') {
      applyPreset(BOND_PRESETS[2]) // Child
    } else if (connection.sourceHandle === 'top') {
      applyPreset({ label: 'Parent', icon: 'crown', color: '#f5c542', type: 'family', dashed: false })
    } else {
      applyPreset(BOND_PRESETS[0]) // Spouse
    }

    setShowAddModal(true)
  }, [])

  // Quick preset applicator
  const applyPreset = (preset: typeof BOND_PRESETS[0]) => {
    setRelationLabel(preset.label)
    setRelationType(preset.type)
    setSelectedIcon(preset.icon)
    setSelectedColor(preset.color)
    setStrokePattern(preset.dashed ? 'dashed' : 'solid')
  }

  const applyEditPreset = (preset: typeof BOND_PRESETS[0]) => {
    setEditLabel(preset.label)
    setEditType(preset.type)
    setEditIcon(preset.icon)
    setEditColor(preset.color)
    setEditStrokePattern(preset.dashed ? 'dashed' : 'solid')
  }

  // Handle clicking (+) button to trigger quick add modal
  const handleTriggerQuickAdd = (sourceId: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
    setQuickAddSourceNodeId(sourceId)

    if (direction === 'bottom') {
      applyPreset(BOND_PRESETS[2]) // Child
    } else if (direction === 'top') {
      applyPreset({ label: 'Parent', icon: 'crown', color: '#f5c542', type: 'family', dashed: false })
    } else if (direction === 'right') {
      applyPreset(BOND_PRESETS[0]) // Spouse
    } else {
      applyPreset(BOND_PRESETS[4]) // Sibling
    }

    setTargetMode('existing')
    setSelectedExistingId('')
    setNewCharacterName('')
    setShowAddModal(true)
  }

  // Confirm and persist new relation
  const handleConfirmAddRelation = (e: React.FormEvent) => {
    e.preventDefault()

    let targetEntityId = selectedExistingId

    if (targetMode === 'new') {
      if (!newCharacterName.trim()) return
      const created = createEntity('character', newCharacterName.trim())
      targetEntityId = created.id
      addToast(`Created character "${created.title}" in Codex`, 'success')
    }

    if (!targetEntityId) return

    const sourceEntityId = quickAddSourceNodeId || worldEntities[0]?.id
    if (!sourceEntityId) return

    createRelation({
      sourceEntityId,
      targetEntityId,
      relationType,
      label: relationLabel.trim() || 'Connected',
      icon: selectedIcon,
      color: selectedColor,
      isDashed: strokePattern !== 'solid',
      strokePattern,
      strokeWidth,
      edgeType,
      arrowDirection,
      notes: relationNotes.trim() || undefined
    })

    setShowAddModal(false)
    addToast(`Connected with bond "${relationLabel}"`, 'success')
  }

  // Open Edit Modal
  const handleOpenEdit = useCallback((relId: string) => {
    const rel = worldRelations.find(r => r.id === relId)
    if (rel) {
      setEditingRelation(rel)
      setEditLabel(rel.label)
      setEditType(rel.relationType)
      setEditIcon(rel.icon || 'orbit')
      setEditColor(rel.color || themeTokens.accent)
      setEditStrokePattern(rel.strokePattern || (rel.isDashed ? 'dashed' : 'solid'))
      setEditStrokeWidth(rel.strokeWidth || 1.5)
      setEditEdgeType(rel.edgeType || 'smoothstep')
      setEditArrowDirection(rel.arrowDirection || 'end')
      setEditNotes(rel.notes || '')
    }
  }, [worldRelations, themeTokens.accent])

  // Save edited relation
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRelation || !editLabel.trim()) return

    updateRelation(editingRelation.id, {
      label: editLabel.trim(),
      relationType: editType,
      icon: editIcon,
      color: editColor,
      isDashed: editStrokePattern !== 'solid',
      strokePattern: editStrokePattern,
      strokeWidth: editStrokeWidth,
      edgeType: editEdgeType,
      arrowDirection: editArrowDirection,
      notes: editNotes.trim() || undefined
    })

    addToast('Updated relational bond', 'success')
    setEditingRelation(null)
  }

  const handleReverseDirection = () => {
    if (!editingRelation) return

    const reversedWaypoints = editingRelation.waypoints ? [...editingRelation.waypoints].reverse() : undefined

    updateRelation(editingRelation.id, {
      sourceEntityId: editingRelation.targetEntityId,
      targetEntityId: editingRelation.sourceEntityId,
      waypoints: reversedWaypoints
    })

    setEditingRelation({
      ...editingRelation,
      sourceEntityId: editingRelation.targetEntityId,
      targetEntityId: editingRelation.sourceEntityId,
      waypoints: reversedWaypoints
    })

    addToast('Reversed vector direction', 'info')
  }

  const getEntityTitle = (id: string) => {
    return worldEntities.find(e => e.id === id)?.title || 'Unknown'
  }

  const sourceEntity = quickAddSourceNodeId ? worldEntities.find(e => e.id === quickAddSourceNodeId) : null
  const targetEntity = selectedExistingId ? worldEntities.find(e => e.id === selectedExistingId) : null

  const editSourceEntity = editingRelation ? worldEntities.find(e => e.id === editingRelation.sourceEntityId) : null
  const editTargetEntity = editingRelation ? worldEntities.find(e => e.id === editingRelation.targetEntityId) : null

  const SelectedIconComp = getIconComponent(selectedIcon)
  const EditIconComp = getIconComponent(editIcon)

  const actionContextValue = useMemo(() => ({
    updateWaypoints: handleUpdateWaypoints,
    updateEdge: handleUpdateEdge,
    reverseEdge: handleReverseEdge,
    deleteEdge: handleDeleteRelationEdge,
    openEditModal: handleOpenEdit
  }), [handleUpdateWaypoints, handleUpdateEdge, handleReverseEdge, handleDeleteRelationEdge, handleOpenEdit])

  return (
    <RelationEdgeActionContext.Provider value={actionContextValue}>
      <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
        {/* Top Header Bar - z-40 relative so buttons are NEVER blocked */}
        <div className="h-11 bg-oros-950 border-b border-oros-800 px-4 flex items-center justify-between z-40 relative">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-oros-900 text-oros-300 border border-oros-750 shadow-sm">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="font-sans text-xs font-semibold tracking-wide uppercase text-oros-100 flex items-center gap-2">
                Relations
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tool Selector: Select / Pan */}
            <div className="flex items-center bg-oros-900 border border-oros-750 rounded-[4px] p-0.5 shadow-sm">
              <button
                onClick={() => setActiveTool('select')}
                className={`p-1.5 rounded-[3px] transition-colors ${
                  activeTool === 'select'
                    ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                    : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850 border border-transparent'
                }`}
                title="Select Tool (V) - Marquee selection & multi-move"
              >
                <MousePointer className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveTool('pan')}
                className={`p-1.5 rounded-[3px] transition-colors ${
                  activeTool === 'pan'
                    ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                    : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850 border border-transparent'
                }`}
                title="Pan Tool (H) - Drag canvas pane"
              >
                <Hand className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Smart Snapping Toggle */}
            <button
              onClick={() => {
                const next = !smartSnapEnabled
                setSmartSnapEnabled(next)
                addToast(next ? 'Snapping on' : 'Snapping off', 'info')
              }}
              title={`Smart Snapping: ${smartSnapEnabled ? 'ON (Hold Alt while dragging to temporarily bypass)' : 'OFF'}`}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                smartSnapEnabled 
                  ? 'bg-accent-muted border-accent/40 text-accent font-semibold' 
                  : 'bg-oros-900 border-oros-750 text-oros-400 hover:text-oros-200 hover:bg-oros-850'
              }`}
            >
              <Magnet className="w-3.5 h-3.5" />
              <span>Snap</span>
            </button>

            {/* Export Dropdown */}
            <ExportDropdown options={relationExportOptions} align="right" />

            {/* Manage All Relations Drawer Toggle */}
            <button
              onClick={() => {
                setShowBondsDrawer(!showBondsDrawer)
                if (!showBondsDrawer) {
                  setActiveEntityForPeek(null)
                }
              }}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                showBondsDrawer 
                  ? 'bg-accent-muted border-accent/40 text-accent font-semibold' 
                  : 'bg-oros-900 border-oros-750 text-oros-300 hover:bg-oros-850 hover:text-oros-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>All Relations ({worldRelations.length})</span>
            </button>

            {/* Add Relation Button */}
            <button
              onClick={() => {
                setQuickAddSourceNodeId(worldEntities[0]?.id || null)
                setShowAddModal(true)
              }}
              className="btn-accent px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Relation</span>
            </button>
          </div>
        </div>

        {/* Main Canvas Viewport */}
        <div ref={containerRef} className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            colorMode={isLight ? 'light' : 'dark'}
            onNodesChange={handleNodesChangeWrapped}
            onEdgesChange={onEdgesChange}
            onNodesDelete={(deleted) => {
              deleted.forEach((n) => {
                if (n.id) handleDeleteEntity(n.id)
              })
            }}
            onEdgesDelete={(deleted) => {
              deleted.forEach((e) => {
                if (e.id) handleDeleteRelationEdge(e.id)
              })
            }}
            deleteKeyCode={['Backspace', 'Delete', 'Del']}
            panOnDrag={activeTool === 'pan' ? true : [1, 2]}
            selectionOnDrag={activeTool === 'select'}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
            className={activeTool === 'pan' ? 'cursor-grab' : 'cursor-default'}
            onConnect={onConnect}
            onNodeDragStop={handleNodeDragStop}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            attributionPosition="bottom-left"
          >
            <Background 
              variant={BackgroundVariant.Dots}
              color={themeTokens.dots} 
              gap={24} 
              size={1.4} 
            />

            {/* Smart Snapping Alignment Guidelines */}
            {smartSnapEnabled && snapGuides.length > 0 && (
              <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-30">
                <g transform={`translate(${reactFlowInstance.getViewport().x}, ${reactFlowInstance.getViewport().y}) scale(${reactFlowInstance.getViewport().zoom})`}>
                  {snapGuides.map((guide, idx) => (
                    <g key={idx}>
                      {guide.type === 'vertical' ? (
                        <>
                          <line
                            x1={guide.pos}
                            y1={guide.from}
                            x2={guide.pos}
                            y2={guide.to}
                            stroke={themeTokens.accent}
                            strokeWidth={1.5 / reactFlowInstance.getViewport().zoom}
                            strokeDasharray="4 4"
                            opacity={0.85}
                          />
                          <circle cx={guide.pos} cy={guide.from} r={3 / reactFlowInstance.getViewport().zoom} fill={themeTokens.accent} />
                          <circle cx={guide.pos} cy={guide.to} r={3 / reactFlowInstance.getViewport().zoom} fill={themeTokens.accent} />
                        </>
                      ) : (
                        <>
                          <line
                            x1={guide.from}
                            y1={guide.pos}
                            x2={guide.to}
                            y2={guide.pos}
                            stroke={themeTokens.accent}
                            strokeWidth={1.5 / reactFlowInstance.getViewport().zoom}
                            strokeDasharray="4 4"
                            opacity={0.85}
                          />
                          <circle cx={guide.from} cy={guide.pos} r={3 / reactFlowInstance.getViewport().zoom} fill={themeTokens.accent} />
                          <circle cx={guide.to} cy={guide.pos} r={3 / reactFlowInstance.getViewport().zoom} fill={themeTokens.accent} />
                        </>
                      )}
                    </g>
                  ))}
                </g>
              </svg>
            )}
            
            <FloatingZoomControls />
          </ReactFlow>
        </div>

        {/* Slide-out Entity Inspector Drawer (starts under top-11 header, buttons are 100% unobstructed) */}
        {activeEntityForPeek && !showBondsDrawer && (
          <aside className="absolute top-11 right-0 bottom-0 w-84 max-w-full bg-oros-950/98 backdrop-blur-md border-l border-oros-800 shadow-2xl z-30 flex flex-col animate-slide-in-right overflow-y-auto select-text">
            <div className="p-3 border-b border-oros-800 flex items-center justify-between shrink-0 bg-oros-950/95 sticky top-0 z-10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-oros-400 font-semibold">Entity Profile</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDeleteEntity(activeEntityForPeek.id)}
                  className="px-2 py-1 rounded-md bg-rose-950/40 border border-rose-850 hover:border-rose-700 text-rose-300 hover:text-rose-100 text-[10px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete Entry"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => {
                    if (activeEntityForPeek) {
                      setSelectedEntityId(activeEntityForPeek.id)
                      openTab({
                        title: activeEntityForPeek.title,
                        type: 'wiki',
                        targetId: activeEntityForPeek.id
                      })
                    }
                  }}
                  className="px-2 py-1 rounded-md bg-oros-900 border border-oros-750 hover:border-oros-600 text-oros-300 hover:text-oros-100 text-[10px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open in Codex"
                >
                  <ExternalLink className="w-3 h-3 text-accent" />
                  <span>Open Codex</span>
                </button>
                <button
                  onClick={() => setActiveEntityForPeek(null)}
                  className="p-1 rounded-md text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors cursor-pointer"
                  title="Close Profile"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3.5 space-y-4">
              <QuickPeekCard 
                entity={activeEntityForPeek}
                onClose={() => setActiveEntityForPeek(null)}
              />

              <div className="pt-2 border-t border-oros-800/80">
                <button
                  onClick={() => handleDeleteEntity(activeEntityForPeek.id)}
                  className="w-full py-2 px-3 rounded-[3px] bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/50 hover:border-rose-700 text-rose-300 hover:text-rose-100 text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Entry from Codex</span>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Slide-out Drawer: All Active Bonds */}
        {showBondsDrawer && (
          <aside className="absolute top-11 right-0 bottom-0 w-80 bg-oros-950/98 backdrop-blur-md border-l border-oros-800 shadow-2xl z-30 flex flex-col animate-slide-in-right">
            <div className="p-3 border-b border-oros-800 flex items-center justify-between shrink-0 bg-oros-950/95 sticky top-0 z-10">
              <h3 className="font-sans font-semibold text-xs text-oros-100 flex items-center gap-2 uppercase tracking-wide">
                <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
                <span>Relations ({worldRelations.length})</span>
              </h3>
              <button 
                onClick={() => setShowBondsDrawer(false)}
                className="p-1 rounded-md text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
              {worldRelations.length === 0 ? (
                <div className="p-6 text-center text-oros-500 font-mono text-xs">
                  No relationships recorded yet. Drag between card handles or click "+ Add Relation".
                </div>
              ) : (
                worldRelations.map((rel) => {
                  const IconComponent = getIconComponent(rel.icon)
                  const bondColor = rel.color || themeTokens.accent
                  return (
                    <div
                      key={rel.id}
                      className="p-2.5 rounded-lg bg-oros-900 border border-oros-750 hover:border-oros-600 transition-colors group shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span 
                          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-sm"
                          style={{ borderColor: bondColor, color: bondColor, backgroundColor: `${bondColor}12` }}
                        >
                          <IconComponent className="w-3 h-3" />
                          <span>{rel.label}</span>
                        </span>
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                          <button
                            onClick={() => handleOpenEdit(rel.id)}
                            className="p-1 rounded-md text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors cursor-pointer"
                            title="Edit Relation"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRelationEdge(rel.id)}
                            className="p-1 rounded-md text-oros-400 hover:text-rose-400 hover:bg-oros-800 transition-colors cursor-pointer"
                            title="Delete Relation"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs font-sans font-medium text-oros-200 flex items-center gap-1.5">
                        <span className="truncate max-w-[100px]">{getEntityTitle(rel.sourceEntityId)}</span>
                        <span className="text-accent font-mono text-xs">→</span>
                        <span className="truncate max-w-[100px]">{getEntityTitle(rel.targetEntityId)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>
        )}

        {/* ======================================================== */}
        {/* REVAMPED ADD RELATION MODAL (OBSIDIAN/LINEAR PRODUCTION) */}
        {/* ======================================================== */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden select-text text-oros-100 animate-modal-in">
              {/* Header */}
              <div className="px-4 py-3 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-[3px] bg-accent/15 border border-accent/30 text-accent">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                    Create Relational Bond
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form id="add-relation-form" onSubmit={handleConfirmAddRelation} className="p-4 space-y-3.5 overflow-y-auto flex-1">
                {/* Visual Connection Flow Banner */}
                <div className="p-2.5 bg-oros-950 rounded-[3px] border border-oros-800 flex items-center justify-between gap-3 shadow-inner">
                  {/* Origin Card */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-[3px] bg-oros-900 border border-oros-750 flex items-center justify-center font-serif text-xs font-bold text-oros-200 overflow-hidden shrink-0 shadow-sm">
                      {sourceEntity?.avatar ? (
                        <img src={sourceEntity.avatar} alt={sourceEntity.title} className="w-full h-full object-cover" />
                      ) : (
                        <span>{sourceEntity ? sourceEntity.title.charAt(0) : '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-oros-500 uppercase tracking-wider">Origin</div>
                      <div className="text-xs font-semibold text-oros-100 truncate">{sourceEntity?.title || 'Origin Entity'}</div>
                    </div>
                  </div>

                  {/* Directional Vector Badge */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 px-2">
                    <div 
                      className="px-2 py-0.5 rounded-[2px] border text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-sm transition-all"
                      style={{ 
                        borderColor: selectedColor, 
                        color: selectedColor,
                        backgroundColor: `${selectedColor}15`
                      }}
                    >
                      <SelectedIconComp className="w-3.5 h-3.5" />
                      <span className="font-semibold">{relationLabel || 'Bond'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-oros-500 font-mono text-[10px]">
                      <span>───</span>
                      <ArrowRight className="w-3 h-3 text-accent" />
                    </div>
                  </div>

                  {/* Target Card */}
                  <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-oros-500 uppercase tracking-wider">Target</div>
                      <div className="text-xs font-semibold text-oros-100 truncate">
                        {targetMode === 'existing' 
                          ? (targetEntity?.title || 'Select Target...') 
                          : (newCharacterName.trim() || 'New Entity')}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-[3px] bg-oros-900 border border-oros-750 flex items-center justify-center font-serif text-xs font-bold text-oros-200 overflow-hidden shrink-0 shadow-sm">
                      {targetEntity?.avatar ? (
                        <img src={targetEntity.avatar} alt={targetEntity.title} className="w-full h-full object-cover" />
                      ) : (
                        <span>{targetMode === 'existing' ? (targetEntity ? targetEntity.title.charAt(0) : '?') : '+'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Entity Mode Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400">
                      Target Entity *
                    </label>
                    <div className="flex p-0.5 bg-oros-950 rounded-[2px] border border-oros-800">
                      <button
                        type="button"
                        onClick={() => setTargetMode('existing')}
                        className={`px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                          targetMode === 'existing' ? 'bg-oros-800 text-oros-100 shadow-sm font-semibold' : 'text-oros-400 hover:text-oros-200'
                        }`}
                      >
                        Existing Codex
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetMode('new')}
                        className={`px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                          targetMode === 'new' ? 'bg-oros-800 text-oros-100 shadow-sm font-semibold' : 'text-oros-400 hover:text-oros-200'
                        }`}
                      >
                        Create New
                      </button>
                    </div>
                  </div>

                  {targetMode === 'existing' ? (
                    <select
                      required
                      value={selectedExistingId}
                      onChange={(e) => setSelectedExistingId(e.target.value)}
                      className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent transition-all cursor-pointer"
                    >
                      <option value="">Select an entity from world codex...</option>
                      {worldEntities.filter(e => e.id !== quickAddSourceNodeId).map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.title} ({e.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={newCharacterName}
                      onChange={(e) => setNewCharacterName(e.target.value)}
                      placeholder="Enter new character / entity name..."
                      className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent transition-all"
                    />
                  )}
                </div>

                {/* Preset Dropdown & Custom Bond Label (Single row without Category Type dropdown) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Preset
                    </label>
                    <select
                      value={BOND_PRESETS.some((p) => p.label === relationLabel) ? relationLabel : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === 'custom') {
                          setRelationType('custom')
                        } else {
                          const found = BOND_PRESETS.find((p) => p.label === val)
                          if (found) applyPreset(found)
                        }
                      }}
                      className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans transition-all cursor-pointer"
                    >
                      <option value="custom">Custom Bond...</option>
                      {BOND_PRESETS.map((p) => (
                        <option key={p.label} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Bond Label *
                    </label>
                    <input
                      type="text"
                      required
                      value={relationLabel}
                      onChange={(e) => setRelationLabel(e.target.value)}
                      placeholder="e.g. Sworn Liege, Blood Brother"
                      className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans transition-all"
                    />
                  </div>
                </div>

                {/* Line Style & Arrow Geometry */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Line Pattern
                    </label>
                    <div className="grid grid-cols-3 p-0.5 bg-oros-950 rounded-[2px] border border-oros-800 text-[10px] font-mono">
                      {(['solid', 'dashed', 'dotted'] as const).map((pat) => (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => setStrokePattern(pat)}
                          className={`py-1 rounded-[1px] capitalize transition-colors cursor-pointer text-center ${
                            strokePattern === pat ? 'bg-oros-800 text-oros-100 font-semibold' : 'text-oros-400 hover:text-white'
                          }`}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Route Type
                    </label>
                    <div className="grid grid-cols-3 p-0.5 bg-oros-950 rounded-[2px] border border-oros-800 text-[10px] font-mono">
                      {(['smoothstep', 'bezier', 'straight'] as const).map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => setEdgeType(rt)}
                          className={`py-1 rounded-[1px] capitalize transition-colors cursor-pointer text-center ${
                            edgeType === rt ? 'bg-oros-800 text-oros-100 font-semibold' : 'text-oros-400 hover:text-white'
                          }`}
                        >
                          {rt === 'smoothstep' ? 'Step' : rt === 'bezier' ? 'Curve' : 'Direct'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Arrowheads
                    </label>
                    <div className="grid grid-cols-4 p-0.5 bg-oros-950 rounded-[2px] border border-oros-800 text-[10px] font-mono">
                      {(['end', 'both', 'none', 'start'] as const).map((dir) => (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => setArrowDirection(dir)}
                          className={`py-1 rounded-[1px] capitalize transition-colors cursor-pointer text-center ${
                            arrowDirection === dir ? 'bg-oros-800 text-oros-100 font-semibold' : 'text-oros-400 hover:text-white'
                          }`}
                        >
                          {dir === 'end' ? '→' : dir === 'both' ? '↔' : dir === 'none' ? '—' : '←'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extended Logos & Custom Color Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400">
                        Badge Icon
                      </label>
                      <span className="text-[10px] font-mono text-oros-500 capitalize">{selectedIcon}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 p-1.5 bg-oros-950 rounded-[3px] border border-oros-800 max-h-36 overflow-y-auto">
                      {Object.entries(RELATION_ICONS).map(([key, IconComponent]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedIcon(key)}
                          title={key}
                          className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition-all cursor-pointer ${
                            selectedIcon === key
                              ? 'bg-accent/20 border border-accent text-accent shadow-sm'
                              : 'text-oros-400 hover:text-oros-100 hover:bg-oros-850'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400">
                        Bond Color
                      </label>
                      <div className="flex items-center gap-1.5 bg-oros-950 border border-oros-750 rounded-[2px] px-1.5 py-0.5">
                        <input
                          type="color"
                          value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#f5c542'}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-0 p-0"
                          title="Custom Color Picker"
                        />
                        <input
                          type="text"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          placeholder="#HEX"
                          className="w-16 bg-transparent text-[10px] font-mono text-oros-200 focus:outline-none uppercase"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1.5 bg-oros-950 rounded-[3px] border border-oros-800 items-center">
                      {[{ label: 'Accent', hex: themeTokens.accent }, ...BOND_COLORS].map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => setSelectedColor(c.hex)}
                          title={c.label}
                          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                            selectedColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-white shadow-md' : 'opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedColor.toLowerCase() === c.hex.toLowerCase() && <Check className="w-3 h-3 text-black stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lore Notes */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                    Chronicle / Lore Notes <span className="text-oros-500 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={relationNotes}
                    onChange={(e) => setRelationNotes(e.target.value)}
                    placeholder="Contextual notes, vows, or historical circumstances..."
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] p-2 text-xs text-oros-200 placeholder:text-oros-600 focus:outline-none focus:border-accent resize-none transition-all"
                  />
                </div>
              </form>

              {/* Pinned Visible Footer */}
              <div className="px-4 py-2.5 border-t border-oros-750 bg-oros-900 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-relation-form"
                  className="btn-accent px-3.5 py-1 rounded-[3px] text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Relation</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* REVAMPED EDIT RELATION MODAL (OBSIDIAN/LINEAR PRODUCTION) */}
        {/* ======================================================== */}
        {editingRelation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden select-text text-oros-100 animate-modal-in">
              {/* Header */}
              <div className="px-4 py-3 border-b border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-[3px] bg-accent/15 border border-accent/30 text-accent">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
                    Edit Relational Bond
                  </h3>
                </div>
                <button
                  onClick={() => setEditingRelation(null)}
                  className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form id="edit-relation-form" onSubmit={handleSaveEdit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
                {/* Visual Connection Flow Banner with Live Reverse */}
                <div className="p-2.5 bg-oros-950 rounded-[3px] border border-oros-800 flex items-center justify-between gap-3 shadow-inner">
                  {/* Source Card */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-[3px] bg-oros-900 border border-oros-750 flex items-center justify-center font-serif text-xs font-bold text-oros-200 overflow-hidden shrink-0 shadow-sm">
                      {editSourceEntity?.avatar ? (
                        <img src={editSourceEntity.avatar} alt={editSourceEntity.title} className="w-full h-full object-cover" />
                      ) : (
                        <span>{editSourceEntity ? editSourceEntity.title.charAt(0) : '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-oros-500 uppercase tracking-wider">Origin</div>
                      <div className="text-xs font-semibold text-oros-100 truncate">{editSourceEntity?.title || 'Origin'}</div>
                    </div>
                  </div>

                  {/* Directional Vector Badge + Live Reverse */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 px-2">
                    <div 
                      className="px-2 py-0.5 rounded-[2px] border text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-sm transition-all"
                      style={{ 
                        borderColor: editColor, 
                        color: editColor,
                        backgroundColor: `${editColor}15`
                      }}
                    >
                      <EditIconComp className="w-3.5 h-3.5" />
                      <span className="font-semibold">{editLabel || 'Bond'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReverseDirection}
                      className="mt-0.5 px-2 py-0.5 rounded-[2px] bg-oros-850 hover:bg-oros-800 border border-oros-750 text-oros-300 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title="Reverse vector direction"
                    >
                      <ArrowRightLeft className="w-2.5 h-2.5 text-accent" />
                      <span>Reverse</span>
                    </button>
                  </div>

                  {/* Target Card */}
                  <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-oros-500 uppercase tracking-wider">Target</div>
                      <div className="text-xs font-semibold text-oros-100 truncate">{editTargetEntity?.title || 'Target'}</div>
                    </div>
                    <div className="w-8 h-8 rounded-[3px] bg-oros-900 border border-oros-750 flex items-center justify-center font-serif text-xs font-bold text-oros-200 overflow-hidden shrink-0 shadow-sm">
                      {editTargetEntity?.avatar ? (
                        <img src={editTargetEntity.avatar} alt={editTargetEntity.title} className="w-full h-full object-cover" />
                      ) : (
                        <span>{editTargetEntity ? editTargetEntity.title.charAt(0) : '?'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preset Dropdown & Custom Bond Label (Single row without Category Type dropdown) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Preset
                    </label>
                    <select
                      value={BOND_PRESETS.some((p) => p.label === editLabel) ? editLabel : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === 'custom') {
                          setEditType('custom')
                        } else {
                          const found = BOND_PRESETS.find((p) => p.label === val)
                          if (found) applyEditPreset(found)
                        }
                      }}
                      className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans transition-all cursor-pointer"
                    >
                      <option value="custom">Custom Bond...</option>
                      {BOND_PRESETS.map((p) => (
                        <option key={p.label} value={p.label}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Bond Label *
                    </label>
                    <input
                      type="text"
                      required
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="e.g. Sworn Liege, Blood Brother"
                      className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent font-sans transition-all"
                    />
                  </div>
                </div>

                {/* Line Style & Arrow Geometry */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Line Pattern
                    </label>
                    <div className="grid grid-cols-3 p-0.5 bg-oros-950 rounded-[2px] border border-oros-800 text-[10px] font-mono">
                      {(['solid', 'dashed', 'dotted'] as const).map((pat) => (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => setEditStrokePattern(pat)}
                          className={`py-1 rounded-[1px] capitalize transition-colors cursor-pointer text-center ${
                            editStrokePattern === pat ? 'bg-oros-800 text-oros-100 font-semibold' : 'text-oros-400 hover:text-white'
                          }`}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Route Type
                    </label>
                    <div className="grid grid-cols-3 p-0.5 bg-oros-950 rounded-[2px] border border-oros-800 text-[10px] font-mono">
                      {(['smoothstep', 'bezier', 'straight'] as const).map((rt) => (
                        <button
                          key={rt}
                          type="button"
                          onClick={() => setEditEdgeType(rt)}
                          className={`py-1 rounded-[1px] capitalize transition-colors cursor-pointer text-center ${
                            editEdgeType === rt ? 'bg-oros-800 text-oros-100 font-semibold' : 'text-oros-400 hover:text-white'
                          }`}
                        >
                          {rt === 'smoothstep' ? 'Step' : rt === 'bezier' ? 'Curve' : 'Direct'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                      Arrowheads
                    </label>
                    <div className="grid grid-cols-4 p-0.5 bg-oros-950 rounded-[2px] border border-oros-800 text-[10px] font-mono">
                      {(['end', 'both', 'none', 'start'] as const).map((dir) => (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => setEditArrowDirection(dir)}
                          className={`py-1 rounded-[1px] capitalize transition-colors cursor-pointer text-center ${
                            editArrowDirection === dir ? 'bg-oros-800 text-oros-100 font-semibold' : 'text-oros-400 hover:text-white'
                          }`}
                        >
                          {dir === 'end' ? '→' : dir === 'both' ? '↔' : dir === 'none' ? '—' : '←'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Extended Logos & Custom Color Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400">
                        Badge Icon
                      </label>
                      <span className="text-[10px] font-mono text-oros-500 capitalize">{editIcon}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 p-1.5 bg-oros-950 rounded-[3px] border border-oros-800 max-h-36 overflow-y-auto">
                      {Object.entries(RELATION_ICONS).map(([key, IconComponent]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEditIcon(key)}
                          title={key}
                          className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition-all cursor-pointer ${
                            editIcon === key
                              ? 'bg-accent/20 border border-accent text-accent shadow-sm'
                              : 'text-oros-400 hover:text-oros-100 hover:bg-oros-850'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400">
                        Bond Color
                      </label>
                      <div className="flex items-center gap-1.5 bg-oros-950 border border-oros-750 rounded-[2px] px-1.5 py-0.5">
                        <input
                          type="color"
                          value={editColor.startsWith('#') && editColor.length === 7 ? editColor : '#f5c542'}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-0 p-0"
                          title="Custom Color Picker"
                        />
                        <input
                          type="text"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          placeholder="#HEX"
                          className="w-16 bg-transparent text-[10px] font-mono text-oros-200 focus:outline-none uppercase"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1.5 bg-oros-950 rounded-[3px] border border-oros-800 items-center">
                      {[{ label: 'Accent', hex: themeTokens.accent }, ...BOND_COLORS].map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          onClick={() => setEditColor(c.hex)}
                          title={c.label}
                          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                            editColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-white shadow-md' : 'opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {editColor.toLowerCase() === c.hex.toLowerCase() && <Check className="w-3 h-3 text-black stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lore Notes */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider font-semibold text-oros-400 mb-1">
                    Chronicle / Lore Notes <span className="text-oros-500 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Contextual notes, vows, or historical circumstances..."
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] p-2 text-xs text-oros-200 placeholder:text-oros-600 focus:outline-none focus:border-accent resize-none transition-all"
                  />
                </div>
              </form>

              {/* Pinned Visible Footer */}
              <div className="px-4 py-2.5 border-t border-oros-750 bg-oros-900 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteRelationEdge(editingRelation.id)}
                  className="px-2.5 py-1 rounded-[3px] text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Bond</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRelation(null)}
                    className="px-3 py-1 rounded-[3px] text-xs font-semibold text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="edit-relation-form"
                    className="btn-accent px-3.5 py-1 rounded-[3px] text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RelationEdgeActionContext.Provider>
  )
}
