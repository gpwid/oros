import React, { useMemo, useState, useCallback } from 'react'
import { 
  ReactFlow, Background, MiniMap, Node, Edge, 
  MarkerType, Handle, Position, useNodesState, useEdgesState,
  EdgeLabelRenderer, EdgeProps, getSmoothStepPath, ReactFlowProvider, useReactFlow,
  BackgroundVariant
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Plus, Trash2, Edit3, ArrowRightLeft, X, Filter, Search, 
  Heart, HeartCrack, Baby, HeartHandshake, Users, Crown, Shield, 
  Sparkles, Swords, ZoomIn, ZoomOut, Maximize2, Check, UserPlus, SlidersHorizontal
} from 'lucide-react'
import { RelationEdge, LoreEntity } from '@shared/types'
import { QuickPeekCard } from '../common/QuickPeekCard'

// Helper for relationship icon based on label / type
const getRelationIcon = (label: string, type: string) => {
  const l = label.toLowerCase()
  if (l.includes('mantan') || l.includes('ex') || l.includes('cerai')) {
    return <HeartCrack className="w-2.5 h-2.5 text-slate-400" />
  }
  if (l.includes('anak angkat') || l.includes('adopted')) {
    return <HeartHandshake className="w-2.5 h-2.5 text-blue-300" />
  }
  if (l.includes('anak') || l.includes('child') || l.includes('heir') || l.includes('putra') || l.includes('putri')) {
    return <Baby className="w-2.5 h-2.5 text-amber-300" />
  }
  if (l.includes('pasangan') || l.includes('spouse') || l.includes('istri') || l.includes('suami') || l.includes('nikah')) {
    return <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400/40" />
  }
  if (l.includes('saudara') || l.includes('sibling') || l.includes('kakak') || l.includes('adik')) {
    return <Users className="w-2.5 h-2.5 text-emerald-300" />
  }
  if (type === 'ruler' || l.includes('sovereign') || l.includes('raja') || l.includes('queen') || l.includes('king')) {
    return <Crown className="w-2.5 h-2.5 text-gold-400" />
  }
  if (type === 'vassal' || l.includes('vassal') || l.includes('fealty')) {
    return <Shield className="w-2.5 h-2.5 text-teal-400" />
  }
  if (type === 'rival' || l.includes('musuh') || l.includes('enemy')) {
    return <Swords className="w-2.5 h-2.5 text-rose-400" />
  }
  return <Sparkles className="w-2.5 h-2.5 text-gold-400" />
}

// Custom Auto-Following SmoothStep Edge with Napoleon-style relationship pills
const GenealogyEdge = ({ 
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, 
  style, label, data 
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 18
  })

  const onEdit = (data as any)?.onEdit
  const relationType = (data as any)?.relationType || 'family'
  const isDashed = (data as any)?.isDashed || false

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={style?.stroke || '#788b7b'}
        strokeWidth={style?.strokeWidth || 1.75}
        strokeDasharray={isDashed ? '5 5' : undefined}
        className="transition-all"
      />
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
            title="Click to edit bond"
            className="nodrag nopan group px-2.5 py-0.5 rounded-full bg-[#121a14]/95 border border-[#2b3c2e] hover:border-gold-400 text-[10px] font-sans font-medium text-slate-200 hover:text-gold-300 shadow-md backdrop-blur-sm whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5"
          >
            {getRelationIcon(String(label), relationType)}
            <span>{label}</span>
            <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-gold-400 transition-opacity ml-0.5" />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// Napoleon / Reference Style Vertical Portrait Card Node
const GenealogyCardNode = ({ id, data }: { 
  id: string; 
  data: { 
    entity?: LoreEntity; 
    isUnassigned?: boolean;
    onSelect: (id: string) => void;
    onQuickAdd: (sourceId: string, direction: 'top' | 'bottom' | 'left' | 'right') => void;
    onAssign: (nodeId: string) => void;
  } 
}) => {
  const { entity, isUnassigned, onSelect, onQuickAdd, onAssign } = data

  if (isUnassigned || !entity) {
    return (
      <div 
        onClick={() => onAssign(id)}
        className="w-28 h-40 rounded-2xl border-2 border-dashed border-[#344837] hover:border-gold-400 bg-[#111812]/90 flex flex-col items-center justify-center transition-all cursor-pointer group shadow-xl relative select-none"
      >
        <Plus className="w-8 h-8 text-[#516f56] group-hover:text-gold-400 transition-colors" />
        
        {/* Tambahkan Nama Pill */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#0f1711]/95 border border-[#2b3d2e] text-[#86a88b] group-hover:text-gold-300 text-[10px] font-serif italic whitespace-nowrap shadow-md transition-colors">
          Tambahkan nama
        </div>

        {/* 4 Handles for routing */}
        <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-[#86a88b] !border-none !opacity-0" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-[#86a88b] !border-none !opacity-0" />
        <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-[#86a88b] !border-none !opacity-0" />
        <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-[#86a88b] !border-none !opacity-0" />
      </div>
    )
  }

  return (
    <div 
      onClick={() => onSelect(entity.id)}
      className="w-28 h-40 rounded-2xl border-2 border-[#2b3e2e] bg-[#121a14] hover:border-gold-400/90 shadow-xl group transition-all cursor-pointer relative select-none"
    >
      {/* 4 Circular Quick-Add (+) Handles around the Card */}
      {/* Top (+) */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onQuickAdd(id, 'top')
          }}
          title="Add relation above (Parent / Ancestor / Liege)"
          className="w-5 h-5 rounded-full bg-[#1b261d] border border-[#3b533f] text-[#86a88b] hover:text-white hover:border-gold-400 hover:bg-gold-500/30 hover:scale-125 flex items-center justify-center transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
        <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-[#86a88b] !border-none !opacity-0 pointer-events-none" />
      </div>

      {/* Bottom (+) */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onQuickAdd(id, 'bottom')
          }}
          title="Add relation below (Child / Successor / Vassal)"
          className="w-5 h-5 rounded-full bg-[#1b261d] border border-[#3b533f] text-[#86a88b] hover:text-white hover:border-gold-400 hover:bg-gold-500/30 hover:scale-125 flex items-center justify-center transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-[#86a88b] !border-none !opacity-0 pointer-events-none" />
      </div>

      {/* Left (+) */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-3 z-30 flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onQuickAdd(id, 'left')
          }}
          title="Add relation to left (Spouse / Sibling / Ally)"
          className="w-5 h-5 rounded-full bg-[#1b261d] border border-[#3b533f] text-[#86a88b] hover:text-white hover:border-gold-400 hover:bg-gold-500/30 hover:scale-125 flex items-center justify-center transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
        <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-[#86a88b] !border-none !opacity-0 pointer-events-none" />
      </div>

      {/* Right (+) */}
      <div className="absolute top-1/2 -translate-y-1/2 -right-3 z-30 flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onQuickAdd(id, 'right')
          }}
          title="Add relation to right (Spouse / Sibling / Ally)"
          className="w-5 h-5 rounded-full bg-[#1b261d] border border-[#3b533f] text-[#86a88b] hover:text-white hover:border-gold-400 hover:bg-gold-500/30 hover:scale-125 flex items-center justify-center transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
        <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-[#86a88b] !border-none !opacity-0 pointer-events-none" />
      </div>

      {/* Portrait Artwork (fills the entire card) */}
      <div className="w-full h-full rounded-2xl overflow-hidden bg-black/40 relative">
        {entity.avatar ? (
          <img
            src={entity.avatar}
            alt={entity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a261c] to-[#0e1610] text-[#718c76] font-serif text-2xl font-bold">
            {entity.title.charAt(0)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none rounded-b-2xl" />
      </div>

      {/* Bottom Name Pill (overlapping bottom edge) */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#0f1711]/95 border border-[#2b3d2e] group-hover:border-gold-400 text-slate-100 group-hover:text-gold-300 font-serif font-bold text-[11px] whitespace-nowrap shadow-lg flex items-center gap-1 transition-all z-20">
        <span>{entity.title}</span>
      </div>
    </div>
  )
}

const nodeTypes = {
  genealogyCard: GenealogyCardNode
}

const edgeTypes = {
  genealogyEdge: GenealogyEdge
}

// Custom Floating Zoom Controls in Bottom-Right
const FloatingZoomControls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-2 p-1.5 rounded-2xl bg-[#141d16]/95 border border-[#2b3e2e] shadow-2xl backdrop-blur-md">
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className="p-1.5 rounded-xl text-[#86a88b] hover:text-white hover:bg-[#202e23] transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className="p-1.5 rounded-xl text-[#86a88b] hover:text-white hover:bg-[#202e23] transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => fitView({ padding: 0.25, duration: 400 })}
        className="p-1.5 rounded-xl text-[#86a88b] hover:text-white hover:bg-[#202e23] transition-colors"
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
    entities, relations, activeWorldId, setSelectedEntityId, setActiveTab,
    createRelation, updateRelation, deleteRelation, createEntity 
  } = useWorldStore()

  const { addToast } = useToastStore()

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningNodeId, setAssigningNodeId] = useState<string | null>(null)
  const [editingRelation, setEditingRelation] = useState<RelationEdge | null>(null)
  const [activeEntityForPeek, setActiveEntityForPeek] = useState<LoreEntity | null>(null)
  const [showBondsDrawer, setShowBondsDrawer] = useState(false)

  // Quick Add Context State (spawning from a specific node handle)
  const [quickAddSourceNodeId, setQuickAddSourceNodeId] = useState<string | null>(null)
  const [quickAddDirection, setQuickAddDirection] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')

  // Form states
  const [targetMode, setTargetMode] = useState<'existing' | 'new' | 'unassigned'>('existing')
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const [newCharacterName, setNewCharacterName] = useState('')
  const [relationLabel, setRelationLabel] = useState('Anak')
  const [relationType, setRelationType] = useState<RelationEdge['relationType']>('family')
  const [isDashedLine, setIsDashedLine] = useState(false)
  const [relationNotes, setRelationNotes] = useState('')

  // Edit form states
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState<RelationEdge['relationType']>('family')
  const [editIsDashed, setEditIsDashed] = useState(false)
  const [editNotes, setEditNotes] = useState('')

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldRelations = activeWorldId ? relations[activeWorldId] || [] : []

  // Pre-calculated position map for the initial family tree (like Napoleon reference)
  const initialNodes: Node[] = useMemo(() => {
    // Specific ergonomic genealogy coordinates
    const positions: Record<string, { x: number; y: number }> = {
      'char-katherine': { x: 220, y: 100 },
      'char-ronald': { x: 500, y: 100 },
      'char-vespera': { x: 760, y: 100 },
      'char-marcus': { x: 1020, y: 100 },
      'char-aurelius': { x: 630, y: 340 },
      'char-lyra': { x: 890, y: 340 },
      'fac-solar': { x: 220, y: 340 },
      'item-astral-crown': { x: 500, y: -120 }
    }

    return worldEntities.map((ent, idx) => {
      const pos = positions[ent.id] || { 
        x: 200 + (idx % 4) * 260, 
        y: 100 + Math.floor(idx / 4) * 240 
      }

      return {
        id: ent.id,
        type: 'genealogyCard',
        position: pos,
        data: {
          entity: ent,
          onSelect: (id: string) => {
            const e = worldEntities.find(item => item.id === id)
            if (e) {
              setActiveEntityForPeek(e)
              setSelectedEntityId(e.id)
            }
          },
          onQuickAdd: (sourceId: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
            handleTriggerQuickAdd(sourceId, direction)
          },
          onAssign: (nodeId: string) => {
            setAssigningNodeId(nodeId)
            setShowAssignModal(true)
          }
        }
      }
    })
  }, [worldEntities])

  // Generate smoothstep auto-following edges
  const initialEdges: Edge[] = useMemo(() => {
    return worldRelations.map((rel) => {
      const isDashed = rel.notes?.includes('dashed') || 
        rel.label.toLowerCase().includes('mantan') || 
        rel.label.toLowerCase().includes('angkat') ||
        rel.relationType === 'rival'

      // Smart handle selection based on relation type / layout
      let sourceHandle = 'bottom'
      let targetHandle = 'top'

      if (
        rel.label.toLowerCase().includes('pasangan') || 
        rel.label.toLowerCase().includes('spouse') ||
        rel.label.toLowerCase().includes('saudara') ||
        rel.label.toLowerCase().includes('sibling')
      ) {
        sourceHandle = 'right'
        targetHandle = 'left'
      }

      return {
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        sourceHandle,
        targetHandle,
        label: rel.label,
        type: 'genealogyEdge',
        style: { stroke: '#7d9280', strokeWidth: 1.75 },
        data: {
          relationType: rel.relationType,
          isDashed,
          onEdit: (relId: string) => handleOpenEdit(relId)
        }
      }
    })
  }, [worldRelations])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  React.useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  React.useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  // Trigger Quick Add from circular handle
  const handleTriggerQuickAdd = (sourceId: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
    setQuickAddSourceNodeId(sourceId)
    setQuickAddDirection(direction)

    // Pre-fill smart defaults based on clicked direction
    if (direction === 'bottom') {
      setRelationLabel('Anak')
      setRelationType('family')
      setIsDashedLine(false)
    } else if (direction === 'top') {
      setRelationLabel('Orang Tua')
      setRelationType('family')
      setIsDashedLine(false)
    } else if (direction === 'right') {
      setRelationLabel('Pasangan')
      setRelationType('family')
      setIsDashedLine(false)
    } else {
      setRelationLabel('Saudara Kandung')
      setRelationType('family')
      setIsDashedLine(false)
    }

    setTargetMode('existing')
    setSelectedExistingId('')
    setNewCharacterName('')
    setShowAddModal(true)
  }

  // Handle saving the Quick-Add or Manual Relation
  const handleConfirmAddRelation = (e: React.FormEvent) => {
    e.preventDefault()

    let targetEntityId = selectedExistingId

    // If user typed a new character name, create it in codex!
    if (targetMode === 'new') {
      if (!newCharacterName.trim()) return
      const created = createEntity('character', newCharacterName.trim())
      targetEntityId = created.id
      addToast(`Created character "${created.title}" in Codex`, 'success')
    }

    if (!targetEntityId) return

    const sourceEntityId = quickAddSourceNodeId || worldEntities[0]?.id
    if (!sourceEntityId) return

    // Position the new node relative to parent
    const parentNode = nodes.find(n => n.id === sourceEntityId)
    let newX = 500
    let newY = 300

    if (parentNode) {
      if (quickAddDirection === 'bottom') {
        newX = parentNode.position.x
        newY = parentNode.position.y + 220
      } else if (quickAddDirection === 'top') {
        newX = parentNode.position.x
        newY = parentNode.position.y - 220
      } else if (quickAddDirection === 'right') {
        newX = parentNode.position.x + 240
        newY = parentNode.position.y
      } else if (quickAddDirection === 'left') {
        newX = parentNode.position.x - 240
        newY = parentNode.position.y
      }
    }

    // Save relation
    const notesStr = isDashedLine ? 'dashed' : (relationNotes.trim() || undefined)
    createRelation({
      sourceEntityId,
      targetEntityId,
      relationType,
      label: relationLabel.trim() || 'Connected',
      notes: notesStr
    })

    setShowAddModal(false)
    addToast(`Connected with bond "${relationLabel}"`, 'success')
  }

  // Open Edit Modal
  const handleOpenEdit = (relId: string) => {
    const rel = worldRelations.find(r => r.id === relId)
    if (rel) {
      setEditingRelation(rel)
      setEditLabel(rel.label)
      setEditType(rel.relationType)
      setEditIsDashed(rel.notes?.includes('dashed') || false)
      setEditNotes(rel.notes || '')
    }
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRelation || !editLabel.trim()) return

    const notesStr = editIsDashed ? 'dashed' : (editNotes.trim() || undefined)
    updateRelation(editingRelation.id, {
      label: editLabel.trim(),
      relationType: editType,
      notes: notesStr
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

  const sourceEntity = quickAddSourceNodeId ? worldEntities.find(e => e.id === quickAddSourceNodeId) : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121913] relative select-none">
      {/* Top Bar with Minimalist Title & Actions */}
      <div className="h-11 bg-[#141d16]/90 border-b border-[#253628] px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-sm font-bold text-slate-100 flex items-center gap-2">
            Familial & Character Relations
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1c291f] text-[#86a88b] font-normal border border-[#2d4030]">
              Napoleon Tree Style
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Manage All Bonds Drawer */}
          <button
            onClick={() => setShowBondsDrawer(!showBondsDrawer)}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showBondsDrawer 
                ? 'bg-[#223326] border-gold-400 text-gold-300' 
                : 'bg-[#18231a] border-[#2b3e2e] text-[#86a88b] hover:text-white hover:bg-[#202e23]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>All Bonds ({worldRelations.length})</span>
          </button>

          {/* New Relation Button */}
          <button
            onClick={() => {
              setQuickAddSourceNodeId(worldEntities[0]?.id || null)
              setQuickAddDirection('right')
              setShowAddModal(true)
            }}
            className="px-3 py-1 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Relation</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas with Dot Grid Background */}
      <div className="flex-1 h-full w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          {/* Dark Forest Dot Grid matching reference */}
          <Background 
            variant={BackgroundVariant.Dots}
            color="#2a3d2e" 
            gap={20} 
            size={1.5} 
          />
          
          {/* Floating Napoleon Zoom Controls Widget */}
          <FloatingZoomControls />
        </ReactFlow>

        {/* Minimalist Floating Guide */}
        <div className="absolute bottom-4 left-6 z-10 px-3 py-1.5 rounded-full bg-[#141d16]/90 border border-[#2b3e2e] text-[11px] text-[#86a88b] shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-2">
          <span>Click any <strong>(+) handle</strong> on a card to quickly spawn & connect a relation</span>
        </div>
      </div>

      {/* QuickPeek Drawer when entity clicked */}
      {activeEntityForPeek && !showBondsDrawer && (
        <div className="absolute top-14 right-5 z-30 animate-in fade-in slide-in-from-right-3 duration-200">
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

      {/* Slide-out Drawer: All Active Bonds */}
      {showBondsDrawer && (
        <aside className="absolute top-11 right-0 bottom-0 w-80 bg-[#141e17]/98 border-l border-[#27382a] shadow-2xl z-30 flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200">
          <div className="p-3.5 border-b border-[#27382a] flex items-center justify-between">
            <h3 className="font-serif font-bold text-xs text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gold-400" />
              <span>Active Relational Bonds ({worldRelations.length})</span>
            </h3>
            <button 
              onClick={() => setShowBondsDrawer(false)}
              className="p-1 rounded-md text-[#86a88b] hover:text-white hover:bg-[#202e23]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {worldRelations.map((rel) => (
              <div
                key={rel.id}
                className="p-2.5 rounded-xl bg-[#0f1711] border border-[#253628] hover:border-gold-400/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-sans font-semibold text-slate-300 flex items-center gap-1">
                    {getRelationIcon(rel.label, rel.relationType)}
                    <span>{rel.label}</span>
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleOpenEdit(rel.id)}
                      className="p-1 rounded text-[#86a88b] hover:text-gold-300 hover:bg-[#1a261c]"
                      title="Edit Bond"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteRelation(rel.id)}
                      className="p-1 rounded text-[#86a88b] hover:text-rose-400 hover:bg-[#1a261c]"
                      title="Delete Bond"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="truncate max-w-[100px]">{getEntityTitle(rel.sourceEntityId)}</span>
                  <span className="text-gold-400">→</span>
                  <span className="truncate max-w-[100px]">{getEntityTitle(rel.targetEntityId)}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Quick Add / Spawn Relation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141e17] border border-[#2d4030] w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-gold-400" />
                <span>Add Connected Relation</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-[#86a88b] hover:text-white hover:bg-[#202e23]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connecting Origin Header */}
            {sourceEntity && (
              <div className="p-2.5 rounded-xl bg-[#0e1610] border border-[#253628] mb-4 flex items-center gap-3">
                <div className="w-9 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0">
                  {sourceEntity.avatar ? (
                    <img src={sourceEntity.avatar} alt={sourceEntity.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-serif font-bold text-gold-400">
                      {sourceEntity.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-[#86a88b] uppercase font-mono">Connecting from</div>
                  <div className="text-xs font-serif font-bold text-slate-100">{sourceEntity.title}</div>
                  <div className="text-[10px] text-gold-400 capitalize">Direction: {quickAddDirection}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmAddRelation} className="space-y-4">
              {/* Step 1: Assign or Create Target Character */}
              <div>
                <label className="block text-xs font-semibold text-[#86a88b] mb-1.5">
                  1. Target Character
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setTargetMode('existing')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      targetMode === 'existing'
                        ? 'bg-gold-500/20 border-gold-400 text-gold-300'
                        : 'bg-[#18231a] border-[#2b3e2e] text-[#86a88b]'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('new')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      targetMode === 'new'
                        ? 'bg-gold-500/20 border-gold-400 text-gold-300'
                        : 'bg-[#18231a] border-[#2b3e2e] text-[#86a88b]'
                    }`}
                  >
                    Create New
                  </button>
                </div>

                {targetMode === 'existing' ? (
                  <select
                    required
                    value={selectedExistingId}
                    onChange={(e) => setSelectedExistingId(e.target.value)}
                    className="w-full bg-[#0e1610] border border-[#2b3e2e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                  >
                    <option value="">Choose character from codex...</option>
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
                    placeholder="Enter character name (e.g. Napoleon II, Hortense)..."
                    className="w-full bg-[#0e1610] border border-[#2b3e2e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                  />
                )}
              </div>

              {/* Step 2: Relationship Presets (Napoleon Style) */}
              <div>
                <label className="block text-xs font-semibold text-[#86a88b] mb-1.5">
                  2. Relationship Preset
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Pasangan', type: 'family', dashed: false },
                    { label: 'Mantan', type: 'family', dashed: true },
                    { label: 'Anak', type: 'family', dashed: false },
                    { label: 'Anak Angkat', type: 'family', dashed: true },
                    { label: 'Saudara Kandung', type: 'family', dashed: false },
                    { label: 'Sekutu', type: 'ally', dashed: false },
                    { label: 'Musuh', type: 'rival', dashed: true }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setRelationLabel(preset.label)
                        setRelationType(preset.type as any)
                        setIsDashedLine(preset.dashed)
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-sans border transition-all flex items-center gap-1 ${
                        relationLabel === preset.label
                          ? 'bg-gold-500 text-oros-950 font-bold border-gold-400'
                          : 'bg-[#0f1711] border-[#2b3e2e] text-slate-200 hover:border-gold-400/60'
                      }`}
                    >
                      {getRelationIcon(preset.label, preset.type)}
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Label and Line Style */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-[#86a88b] mb-1">Custom Label</label>
                  <input
                    type="text"
                    value={relationLabel}
                    onChange={(e) => setRelationLabel(e.target.value)}
                    className="w-full bg-[#0e1610] border border-[#2b3e2e] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#86a88b] mb-1">Line Style</label>
                  <button
                    type="button"
                    onClick={() => setIsDashedLine(!isDashedLine)}
                    className="w-full h-8 bg-[#0e1610] border border-[#2b3e2e] rounded-lg px-2.5 text-xs text-slate-200 flex items-center justify-between hover:border-gold-400"
                  >
                    <span>{isDashedLine ? 'Dashed Line' : 'Solid Line'}</span>
                    <span className="text-[10px] text-[#86a88b]">{isDashedLine ? '- - -' : '───'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#253628]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[#86a88b] hover:bg-[#1a261c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md"
                >
                  Connect Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Relation Modal */}
      {editingRelation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141e17] border border-[#2d4030] w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-gold-400" />
                <span>Edit Relational Bond</span>
              </h3>
              <button
                onClick={() => setEditingRelation(null)}
                className="p-1 rounded-lg text-[#86a88b] hover:text-white hover:bg-[#202e23]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#0e1610] rounded-xl border border-[#253628] mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <span>{getEntityTitle(editingRelation.sourceEntityId)}</span>
                <span className="text-gold-400 font-mono">→</span>
                <span>{getEntityTitle(editingRelation.targetEntityId)}</span>
              </div>
              <button
                type="button"
                onClick={handleReverseDirection}
                className="px-2 py-1 rounded-md bg-[#18231a] border border-[#2b3e2e] text-[#86a88b] hover:text-gold-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                title="Swap source and target"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Reverse</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#86a88b] mb-1">Relationship Label</label>
                <input
                  type="text"
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full bg-[#0e1610] border border-[#2b3e2e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86a88b] mb-1.5">Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Pasangan', 'Mantan', 'Anak', 'Anak Angkat', 'Saudara Kandung', 'Sekutu', 'Musuh'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => {
                        setEditLabel(lbl)
                        if (lbl === 'Mantan' || lbl === 'Anak Angkat' || lbl === 'Musuh') {
                          setEditIsDashed(true)
                        } else {
                          setEditIsDashed(false)
                        }
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] bg-[#0e1610] border border-[#2b3e2e] hover:border-gold-400 text-slate-300"
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86a88b] mb-1">Line Style</label>
                <button
                  type="button"
                  onClick={() => setEditIsDashed(!editIsDashed)}
                  className="w-full h-8 bg-[#0e1610] border border-[#2b3e2e] rounded-lg px-2.5 text-xs text-slate-200 flex items-center justify-between hover:border-gold-400"
                >
                  <span>{editIsDashed ? 'Dashed Line (Mantan / Angkat)' : 'Solid Line'}</span>
                  <span className="text-[10px] text-[#86a88b]">{editIsDashed ? '- - -' : '───'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#253628]">
                <button
                  type="button"
                  onClick={() => handleDeleteRelation(editingRelation.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRelation(null)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#86a88b] hover:bg-[#1a261c]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
