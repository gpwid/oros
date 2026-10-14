import React, { useMemo, useState } from 'react'
import { 
  ReactFlow, Controls, Background, MiniMap, Node, Edge, 
  MarkerType, Handle, Position, useNodesState, useEdgesState,
  BaseEdge, EdgeLabelRenderer, EdgeProps, getStraightPath, useInternalNode
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { Network, Plus, ExternalLink, Trash2, Sparkles, X } from 'lucide-react'
import { RelationEdge, LoreEntity } from '@shared/types'
import { QuickPeekCard } from '../common/QuickPeekCard'

// Calculate exact outer rectangle intersection for pristine direct straight-line graph vectors
function getNodeIntersection(sourceNode: any, targetNode: any) {
  const w1 = sourceNode.measured?.width || 224
  const h1 = sourceNode.measured?.height || 180
  const pos1 = sourceNode.internals?.positionAbsolute || sourceNode.position || { x: 0, y: 0 }
  const cx1 = pos1.x + w1 / 2
  const cy1 = pos1.y + h1 / 2

  const w2 = targetNode.measured?.width || 224
  const h2 = targetNode.measured?.height || 180
  const pos2 = targetNode.internals?.positionAbsolute || targetNode.position || { x: 0, y: 0 }
  const cx2 = pos2.x + w2 / 2
  const cy2 = pos2.y + h2 / 2

  const dx = cx2 - cx1
  const dy = cy2 - cy1
  if (dx === 0 && dy === 0) return { sourceX: cx1, sourceY: cy1, targetX: cx2, targetY: cy2 }

  const scaleX1 = (w1 / 2) / (Math.abs(dx) || 1e-9)
  const scaleY1 = (h1 / 2) / (Math.abs(dy) || 1e-9)
  const scale1 = Math.min(scaleX1, scaleY1)
  const sourceX = cx1 + dx * scale1
  const sourceY = cy1 + dy * scale1

  const scaleX2 = (w2 / 2) / (Math.abs(dx) || 1e-9)
  const scaleY2 = (h2 / 2) / (Math.abs(dy) || 1e-9)
  const scale2 = Math.min(scaleX2, scaleY2)
  const targetX = cx2 - dx * scale2
  const targetY = cy2 - dy * scale2

  return { sourceX, sourceY, targetX, targetY }
}

// Custom Floating Straight Edge that routes border-to-border with arrows & labels
const FloatingStraightEdge = ({ id, source, target, markerEnd, style, label }: EdgeProps) => {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) {
    return null
  }

  const { sourceX, sourceY, targetX, targetY } = getNodeIntersection(sourceNode, targetNode)

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all'
            }}
            className="nodrag nopan px-2.5 py-0.5 rounded-full bg-oros-950/95 border border-oros-700/80 text-[10px] font-bold text-slate-100 shadow-md backdrop-blur-sm whitespace-nowrap"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// Custom visual Card Node for the Graph Canvas
const EntityCardNode = ({ data }: { data: { entity: LoreEntity; onSelect: (id: string) => void } }) => {
  const { entity } = data

  return (
    <div className="w-56 bg-oros-900/95 border-2 border-oros-700/80 hover:border-gold-400 rounded-2xl shadow-2xl overflow-hidden group transition-all text-left">
      {/* Invisible Handles for connection hooks */}
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1 pointer-events-none" />

      {/* Card Artwork Banner */}
      <div className="h-28 w-full relative bg-oros-950 overflow-hidden">
        {entity.avatar ? (
          <img
            src={entity.avatar}
            alt={entity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-oros-800 to-oros-950 flex items-center justify-center">
            <span className="font-serif text-3xl font-bold text-gold-400/50">{entity.title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-oros-900 via-transparent to-transparent pointer-events-none" />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-wider bg-oros-950/90 text-gold-400 border border-oros-700/60 backdrop-blur-sm pointer-events-none">
          {entity.type}
        </span>
      </div>

      {/* Card Metadata */}
      <div className="p-3 pt-2">
        <h4 className="font-serif font-bold text-xs text-slate-100 group-hover:text-gold-400 transition-colors truncate">
          {entity.title}
        </h4>
        {entity.summary ? (
          <p className="text-[10px] text-oros-400 line-clamp-2 mt-0.5 leading-snug">
            {entity.summary}
          </p>
        ) : (
          <p className="text-[10px] text-oros-500 italic mt-0.5">Codex entry</p>
        )}
      </div>
    </div>
  )
}

const nodeTypes = {
  entityCard: EntityCardNode
}

const edgeTypes = {
  floatingStraight: FloatingStraightEdge
}

export const RelationGraphCanvas: React.FC = () => {
  const { 
    entities, relations, activeWorldId, setSelectedEntityId, setActiveTab,
    createRelation, deleteRelation 
  } = useWorldStore()

  const { addToast } = useToastStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [relationLabel, setRelationLabel] = useState('')
  const [relationType, setRelationType] = useState<RelationEdge['relationType']>('ally')
  const [activeEntityForPeek, setActiveEntityForPeek] = useState<LoreEntity | null>(null)

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldRelations = activeWorldId ? relations[activeWorldId] || [] : []

  // Generate XYFlow nodes with pictures & spacious layout
  const initialNodes: Node[] = useMemo(() => {
    const total = Math.max(worldEntities.length, 1)
    const radius = 380
    const centerX = 600
    const centerY = 380

    return worldEntities.map((ent, idx) => {
      // Natural radial distribution with ample spacing
      const angle = (idx / total) * 2 * Math.PI - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)

      return {
        id: ent.id,
        type: 'entityCard',
        position: { x, y },
        data: { 
          entity: ent,
          onSelect: (id: string) => setSelectedEntityId(id)
        }
      }
    })
  }, [worldEntities, setSelectedEntityId])

  // Generate straight-line edges with directional arrows
  const initialEdges: Edge[] = useMemo(() => {
    return worldRelations.map((rel) => {
      let strokeColor = '#f5c542' // Gold default
      if (rel.relationType === 'rival') strokeColor = '#f87171' // Red
      if (rel.relationType === 'family') strokeColor = '#60a5fa' // Blue
      if (rel.relationType === 'vassal' || rel.relationType === 'ruler') strokeColor = '#34d399' // Green
      if (rel.relationType === 'creator') strokeColor = '#c084fc' // Purple

      return {
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        label: rel.label,
        type: 'floatingStraight', // Custom dynamic straight border-to-border vector
        animated: rel.relationType === 'ally',
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14,
          height: 14
        }
      }
    })
  }, [worldRelations])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync state if world data updates
  React.useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  React.useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const ent = worldEntities.find(e => e.id === node.id)
    if (ent) {
      setActiveEntityForPeek(ent)
      setSelectedEntityId(ent.id)
    }
  }

  const handleCreateRelation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceId || !targetId || !relationLabel.trim()) return

    createRelation({
      sourceEntityId: sourceId,
      targetEntityId: targetId,
      relationType,
      label: relationLabel.trim()
    })

    setShowAddModal(false)
    setRelationLabel('')
    addToast('Connected entities with straight vector bond', 'success')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* Top Header & Action Controls */}
      <div className="h-12 bg-oros-900/90 border-b border-oros-800/60 px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-gold-400" />
          <h2 className="font-serif text-sm font-bold text-slate-100">
            Relational Knowledge Web
          </h2>
          <span className="text-xs text-oros-400 font-mono">
            ({worldEntities.length} Visual Cards, {worldRelations.length} Directed Vectors)
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Connect Entities</span>
        </button>
      </div>

      {/* ReactFlow Canvas Viewport */}
      <div className="flex-1 h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#1e2936" gap={24} size={1} />
          <Controls className="bg-oros-900 border border-oros-700 text-slate-200 fill-slate-200" />
          <MiniMap 
            nodeColor="#3e5b74" 
            maskColor="rgba(14, 20, 28, 0.85)"
            className="bg-oros-950 border border-oros-800 rounded-xl overflow-hidden" 
          />
        </ReactFlow>
      </div>

      {/* Floating QuickPeek Drawer when a node is selected */}
      {activeEntityForPeek && (
        <div className="absolute top-16 right-5 z-30 animate-in fade-in slide-in-from-right-3 duration-200">
          <div className="relative">
            <button
              onClick={() => setActiveEntityForPeek(null)}
              className="absolute top-2 right-2 z-50 p-1 rounded-full bg-oros-950/80 text-oros-400 hover:text-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <QuickPeekCard 
              entity={activeEntityForPeek}
              onClose={() => setActiveEntityForPeek(null)}
            />
          </div>
        </div>
      )}

      {/* Add Relation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-2">
              Forge Relational Bond
            </h3>
            <p className="text-xs text-oros-300 mb-4">
              Link two entities together with an explicit straight directional vector.
            </p>
            <form onSubmit={handleCreateRelation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Source Entity</label>
                <select
                  required
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="">Select origin...</option>
                  {worldEntities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Target Entity</label>
                <select
                  required
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="">Select destination...</option>
                  {worldEntities.filter(e => e.id !== sourceId).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Relationship Type</label>
                <select
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value as any)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                >
                  <option value="ally">Alliance / Friendly</option>
                  <option value="family">Family / Bloodline / Marriage</option>
                  <option value="rival">Enemy / Rivalry / Conflict</option>
                  <option value="vassal">Vassal / Fealty / Ruler</option>
                  <option value="creator">Creator / Wielder</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Relationship Label</label>
                <input
                  type="text"
                  required
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  placeholder="e.g. Secret Benefactor, Blood Oath, Liege Lord"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md"
                >
                  Create Edge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
