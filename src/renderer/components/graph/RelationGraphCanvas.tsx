import React, { useMemo, useState } from 'react'
import { 
  ReactFlow, Controls, Background, MiniMap, Node, Edge, 
  MarkerType, Handle, Position, useNodesState, useEdgesState,
  BaseEdge, EdgeLabelRenderer, EdgeProps, getStraightPath, useInternalNode
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Users, Plus, Trash2, Edit3, ArrowRightLeft, X, Filter, Search, 
  ExternalLink, HeartHandshake, Crown, Sparkles, SlidersHorizontal, Check
} from 'lucide-react'
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

// Custom Floating Straight Edge that routes border-to-border with arrows & interactive click-to-edit label
const FloatingStraightEdge = ({ id, source, target, markerEnd, style, label, data }: EdgeProps) => {
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

  const onEdit = (data as any)?.onEdit

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
            onClick={(e) => {
              e.stopPropagation()
              if (onEdit) onEdit(id)
            }}
            title="Click to edit relational bond"
            className="nodrag nopan group px-2.5 py-0.5 rounded-full bg-oros-950/95 border border-oros-700/80 hover:border-gold-400 text-[10px] font-bold text-slate-100 hover:text-gold-300 shadow-md backdrop-blur-sm whitespace-nowrap cursor-pointer transition-all flex items-center gap-1"
          >
            <span>{label}</span>
            <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-gold-400 transition-opacity" />
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
    createRelation, updateRelation, deleteRelation 
  } = useWorldStore()

  const { addToast } = useToastStore()

  // Modal and drawer controls
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBondsDrawer, setShowBondsDrawer] = useState(false)
  const [editingRelation, setEditingRelation] = useState<RelationEdge | null>(null)
  const [activeEntityForPeek, setActiveEntityForPeek] = useState<LoreEntity | null>(null)
  
  // Filtering & search
  const [relationFilter, setRelationFilter] = useState<string>('all')
  const [bondSearchQuery, setBondSearchQuery] = useState('')

  // Form states for Create Relation
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [relationLabel, setRelationLabel] = useState('')
  const [relationType, setRelationType] = useState<RelationEdge['relationType']>('family')
  const [relationNotes, setRelationNotes] = useState('')

  // Form states for Edit Relation
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState<RelationEdge['relationType']>('family')
  const [editNotes, setEditNotes] = useState('')

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldRelations = activeWorldId ? relations[activeWorldId] || [] : []

  // Filtered relations based on UI selection
  const filteredRelations = useMemo(() => {
    return worldRelations.filter((rel) => {
      if (relationFilter !== 'all' && rel.relationType !== relationFilter) return false
      if (bondSearchQuery.trim()) {
        const q = bondSearchQuery.toLowerCase()
        const src = worldEntities.find(e => e.id === rel.sourceEntityId)?.title.toLowerCase() || ''
        const tgt = worldEntities.find(e => e.id === rel.targetEntityId)?.title.toLowerCase() || ''
        const lbl = rel.label.toLowerCase()
        if (!src.includes(q) && !tgt.includes(q) && !lbl.includes(q)) return false
      }
      return true
    })
  }, [worldRelations, relationFilter, bondSearchQuery, worldEntities])

  // Open Edit Modal for a given relation
  const handleOpenEdit = (relId: string) => {
    const rel = worldRelations.find(r => r.id === relId)
    if (rel) {
      setEditingRelation(rel)
      setEditLabel(rel.label)
      setEditType(rel.relationType)
      setEditNotes(rel.notes || '')
    }
  }

  // Generate XYFlow nodes with pictures & radial layout
  const initialNodes: Node[] = useMemo(() => {
    const total = Math.max(worldEntities.length, 1)
    const radius = 380
    const centerX = 600
    const centerY = 380

    return worldEntities.map((ent, idx) => {
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
    return filteredRelations.map((rel) => {
      let strokeColor = '#f5c542' // Gold default
      if (rel.relationType === 'rival') strokeColor = '#f87171' // Red
      if (rel.relationType === 'family') strokeColor = '#60a5fa' // Blue
      if (rel.relationType === 'vassal' || rel.relationType === 'ruler') strokeColor = '#34d399' // Green
      if (rel.relationType === 'creator') strokeColor = '#c084fc' // Purple
      if (rel.relationType === 'member') strokeColor = '#38bdf8' // Cyan

      return {
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        label: rel.label,
        type: 'floatingStraight',
        animated: rel.relationType === 'ally',
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14,
          height: 14
        },
        data: {
          onEdit: (id: string) => handleOpenEdit(id)
        }
      }
    })
  }, [filteredRelations])

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

  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    handleOpenEdit(edge.id)
  }

  const handleCreateRelation = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceId || !targetId || !relationLabel.trim()) return

    createRelation({
      sourceEntityId: sourceId,
      targetEntityId: targetId,
      relationType,
      label: relationLabel.trim(),
      notes: relationNotes.trim() || undefined
    })

    setShowAddModal(false)
    setRelationLabel('')
    setRelationNotes('')
    addToast('Created relational bond', 'success')
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRelation || !editLabel.trim()) return

    updateRelation(editingRelation.id, {
      label: editLabel.trim(),
      relationType: editType,
      notes: editNotes.trim() || undefined
    })

    addToast('Updated relational bond', 'success')
    setEditingRelation(null)
  }

  const handleReverseDirection = () => {
    if (!editingRelation) return

    updateRelation(editingRelation.id, {
      sourceEntityId: editingRelation.targetEntityId,
      targetEntityId: editingRelation.sourceEntityId
    })

    setEditingRelation({
      ...editingRelation,
      sourceEntityId: editingRelation.targetEntityId,
      targetEntityId: editingRelation.sourceEntityId
    })

    addToast('Reversed vector direction', 'info')
  }

  const handleDeleteRelation = (relId: string) => {
    deleteRelation(relId)
    if (editingRelation?.id === relId) {
      setEditingRelation(null)
    }
    addToast('Deleted relational bond', 'info')
  }

  const getEntityTitle = (id: string) => {
    return worldEntities.find(e => e.id === id)?.title || 'Unknown'
  }

  const getEntityAvatar = (id: string) => {
    return worldEntities.find(e => e.id === id)?.avatar
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* Top Header & Action Controls */}
      <div className="h-12 bg-oros-900/90 border-b border-oros-800/60 px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-md bg-gold-500/10 text-gold-400 border border-gold-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-sm font-bold text-slate-100 flex items-center gap-2">
              Character & Social Relations
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-oros-800 text-gold-400 font-normal">
                Familial & Social Tree
              </span>
            </h2>
          </div>
        </div>

        {/* Center / Right Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-1 bg-oros-950 border border-oros-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-oros-400" />
            <select
              value={relationFilter}
              onChange={(e) => setRelationFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Bonds ({worldRelations.length})</option>
              <option value="family">Family & Marriage</option>
              <option value="ally">Alliances</option>
              <option value="rival">Rivals & Enemies</option>
              <option value="vassal">Vassals & Fealty</option>
              <option value="ruler">Sovereigns & Rulers</option>
              <option value="creator">Creators & Artifacts</option>
            </select>
          </div>

          {/* Manage All Bonds Toggle */}
          <button
            onClick={() => setShowBondsDrawer(!showBondsDrawer)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showBondsDrawer 
                ? 'bg-oros-800 border-gold-400 text-gold-300' 
                : 'bg-oros-900/80 border-oros-700/80 text-slate-300 hover:bg-oros-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Manage Bonds ({worldRelations.length})</span>
          </button>

          {/* Connect Entities Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Entities</span>
          </button>
        </div>
      </div>

      {/* Main Flow Canvas Viewport */}
      <div className="flex-1 h-full w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
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

        {/* Floating Instruction Pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1.5 rounded-full bg-oros-900/90 border border-oros-700/80 text-[11px] text-oros-300 shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-gold-400" />
          <span>Click any <strong>relationship label</strong> or vector line to edit or delete the bond</span>
        </div>
      </div>

      {/* Slide-out Drawer: All Active Bonds */}
      {showBondsDrawer && (
        <aside className="absolute top-12 right-0 bottom-0 w-80 bg-oros-900/95 border-l border-oros-800/80 shadow-2xl z-30 flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200">
          <div className="p-3.5 border-b border-oros-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gold-400" />
              <h3 className="font-serif font-bold text-xs text-slate-100">
                Active Relational Bonds ({worldRelations.length})
              </h3>
            </div>
            <button 
              onClick={() => setShowBondsDrawer(false)}
              className="p-1 rounded-md text-oros-400 hover:text-slate-100 hover:bg-oros-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search inside drawer */}
          <div className="p-3 border-b border-oros-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bondSearchQuery}
                onChange={(e) => setBondSearchQuery(e.target.value)}
                placeholder="Search characters or bonds..."
                className="w-full bg-oros-950 border border-oros-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-oros-500 focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          {/* Bonds List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredRelations.length === 0 ? (
              <div className="text-center py-10 text-xs text-oros-500">
                No relational bonds match criteria
              </div>
            ) : (
              filteredRelations.map((rel) => {
                const srcAvatar = getEntityAvatar(rel.sourceEntityId)
                const tgtAvatar = getEntityAvatar(rel.targetEntityId)
                return (
                  <div
                    key={rel.id}
                    className="p-2.5 rounded-xl bg-oros-950/80 border border-oros-800/80 hover:border-gold-500/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-oros-900 text-gold-400 border border-oros-700/60">
                        {rel.relationType}
                      </span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenEdit(rel.id)}
                          className="p-1 rounded text-oros-400 hover:text-gold-400 hover:bg-oros-800"
                          title="Edit Bond"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteRelation(rel.id)}
                          className="p-1 rounded text-oros-400 hover:text-rose-400 hover:bg-oros-800"
                          title="Delete Bond"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-serif font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                      <span className="truncate max-w-[90px]">{getEntityTitle(rel.sourceEntityId)}</span>
                      <span className="text-gold-400">→</span>
                      <span className="truncate max-w-[90px]">{getEntityTitle(rel.targetEntityId)}</span>
                    </div>

                    <div className="text-[11px] text-oros-300 font-medium">
                      "{rel.label}"
                    </div>

                    {rel.notes && (
                      <p className="text-[10px] text-oros-400 mt-1 italic line-clamp-1">
                        {rel.notes}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </aside>
      )}

      {/* Floating QuickPeek Drawer when a node is selected */}
      {activeEntityForPeek && !showBondsDrawer && (
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

      {/* Edit Relation Modal */}
      {editingRelation && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-gold-400" />
                Edit Relational Bond
              </h3>
              <button
                onClick={() => setEditingRelation(null)}
                className="p-1 rounded-lg text-oros-400 hover:text-slate-100 hover:bg-oros-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-oros-950 rounded-xl border border-oros-800 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-xs text-slate-200">
                  {getEntityTitle(editingRelation.sourceEntityId)}
                </span>
                <span className="text-gold-400 font-mono text-xs">→</span>
                <span className="font-serif font-bold text-xs text-slate-200">
                  {getEntityTitle(editingRelation.targetEntityId)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleReverseDirection}
                className="px-2 py-1 rounded-md bg-oros-900 border border-oros-700 text-oros-300 hover:text-gold-400 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                title="Swap source and target direction"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Reverse</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Relationship Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                >
                  <option value="family">Family / Bloodline / Marriage</option>
                  <option value="ally">Alliance / Friendly</option>
                  <option value="rival">Enemy / Conflict / Rivalry</option>
                  <option value="vassal">Vassal / Fealty / Underling</option>
                  <option value="ruler">Ruler / Sovereign / Liege</option>
                  <option value="creator">Creator / Wielder / Artisan</option>
                  <option value="member">Member / Allegiance</option>
                  <option value="custom">Custom Bond</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Relationship Label</label>
                <input
                  type="text"
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g. Spouse & Confidante, Blood Oath, Sworn Liege"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Lore Notes / Historical Context</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Background treaties, vows, lore context..."
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => handleDeleteRelation(editingRelation.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Bond</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRelation(null)}
                    className="px-3.5 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Relation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="font-serif text-lg font-bold text-slate-100 mb-1">
              Forge Relational Bond
            </h3>
            <p className="text-xs text-oros-300 mb-4">
              Link two characters or entities together with an explicit straight directional vector.
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
                  <option value="family">Family / Bloodline / Marriage</option>
                  <option value="ally">Alliance / Friendly</option>
                  <option value="rival">Enemy / Conflict / Rivalry</option>
                  <option value="vassal">Vassal / Fealty / Underling</option>
                  <option value="ruler">Ruler / Sovereign / Liege</option>
                  <option value="creator">Creator / Wielder</option>
                  <option value="member">Member / Allegiance</option>
                  <option value="custom">Custom Bond</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Relationship Label</label>
                <input
                  type="text"
                  required
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  placeholder="e.g. Spouse & Confidante, Blood Oath, Sworn Liege"
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Lore Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={relationNotes}
                  onChange={(e) => setRelationNotes(e.target.value)}
                  placeholder="Notes, treaty date, lore justification..."
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400 resize-none"
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
