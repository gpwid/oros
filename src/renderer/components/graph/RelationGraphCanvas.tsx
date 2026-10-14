import React, { useMemo, useState, useCallback } from 'react'
import { 
  ReactFlow, Background, MiniMap, Node, Edge, 
  MarkerType, Handle, Position, useNodesState, useEdgesState,
  EdgeLabelRenderer, EdgeProps, getSmoothStepPath, ReactFlowProvider, useReactFlow,
  BackgroundVariant, Connection, addEdge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  Plus, Trash2, Edit3, ArrowRightLeft, X, Filter, Search, 
  Heart, HeartCrack, Baby, HeartHandshake, Users, Crown, Shield, 
  Sparkles, Swords, Gem, Flame, Skull, Anchor, BookOpen,
  ZoomIn, ZoomOut, Maximize2, Check, SlidersHorizontal
} from 'lucide-react'
import { RelationEdge, LoreEntity } from '@shared/types'
import { QuickPeekCard } from '../common/QuickPeekCard'

// Icon dictionary for customizable relationship badges
const RELATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  'heart-crack': HeartCrack,
  baby: Baby,
  handshake: HeartHandshake,
  users: Users,
  crown: Crown,
  shield: Shield,
  swords: Swords,
  sparkles: Sparkles,
  gem: Gem,
  flame: Flame,
  skull: Skull,
  anchor: Anchor,
  book: BookOpen
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
  { label: 'Spouse', icon: 'heart', color: '#f43f5e', type: 'family', dashed: false },
  { label: 'Ex-Partner', icon: 'heart-crack', color: '#94a3b8', type: 'family', dashed: true },
  { label: 'Child', icon: 'baby', color: '#f59e0b', type: 'family', dashed: false },
  { label: 'Adopted Child', icon: 'handshake', color: '#38bdf8', type: 'family', dashed: true },
  { label: 'Sibling', icon: 'users', color: '#10b981', type: 'family', dashed: false },
  { label: 'High Sovereign', icon: 'crown', color: '#f5c542', type: 'ruler', dashed: false },
  { label: 'Vassal / Fealty', icon: 'shield', color: '#14b8a6', type: 'vassal', dashed: false },
  { label: 'Ally', icon: 'sparkles', color: '#f5c542', type: 'ally', dashed: false },
  { label: 'Rival / Enemy', icon: 'swords', color: '#ef4444', type: 'rival', dashed: true },
  { label: 'Heirloom / Artifact', icon: 'gem', color: '#c084fc', type: 'creator', dashed: false }
]

const getIconComponent = (key?: string) => {
  return RELATION_ICONS[key || 'sparkles'] || Sparkles
}

// Custom SmoothStep Edge with custom icon & color pill
const GenealogyEdge = ({ 
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, 
  label, data 
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
  const iconKey = (data as any)?.icon || 'sparkles'
  const bondColor = (data as any)?.color || '#f5c542'
  const isDashed = (data as any)?.isDashed || false
  const IconComp = getIconComponent(iconKey)

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={bondColor}
        strokeWidth={2}
        strokeDasharray={isDashed ? '5 5' : undefined}
        className="transition-all opacity-80 hover:opacity-100"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              borderColor: bondColor
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (onEdit) onEdit(id)
            }}
            title="Click to edit relational bond"
            className="nodrag nopan group px-2.5 py-0.5 rounded-full bg-oros-950/95 border hover:scale-105 text-[11px] font-sans font-semibold text-slate-100 shadow-xl backdrop-blur-md whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span style={{ color: bondColor }}>
              <IconComp className="w-3 h-3" />
            </span>
            <span>{label}</span>
            <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-gold-400 transition-opacity ml-0.5" />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// Portrait Card Node matching Project Oros UI
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
  const [imgError, setImgError] = useState(false)

  if (isUnassigned || !entity) {
    return (
      <div 
        onClick={() => onAssign(id)}
        className="w-36 h-48 rounded-2xl border-2 border-dashed border-oros-700/80 hover:border-gold-400 bg-oros-950/90 flex flex-col items-center justify-center transition-all cursor-pointer group shadow-2xl relative select-none"
      >
        <Plus className="w-9 h-9 text-oros-500 group-hover:text-gold-400 transition-colors" />
        
        <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-xl bg-oros-900/90 border border-oros-700/80 text-oros-400 group-hover:text-gold-300 text-xs font-serif italic whitespace-nowrap shadow-md text-center transition-colors">
          Add Name
        </div>

        {/* Drag handles for unassigned card */}
        <Handle type="target" position={Position.Top} id="top" className="!w-6 !h-6 !-top-3 !rounded-full !bg-oros-900 !border-2 !border-oros-700 hover:!border-gold-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-md">
          <Plus className="w-3.5 h-3.5 pointer-events-none" />
        </Handle>
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-6 !h-6 !-bottom-3.5 !rounded-full !bg-oros-900 !border-2 !border-oros-700 hover:!border-gold-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-md">
          <Plus className="w-3.5 h-3.5 pointer-events-none" />
        </Handle>
        <Handle type="target" position={Position.Left} id="left" className="!w-6 !h-6 !-left-3 !rounded-full !bg-oros-900 !border-2 !border-oros-700 hover:!border-gold-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-md">
          <Plus className="w-3.5 h-3.5 pointer-events-none" />
        </Handle>
        <Handle type="source" position={Position.Right} id="right" className="!w-6 !h-6 !-right-3 !rounded-full !bg-oros-900 !border-2 !border-oros-700 hover:!border-gold-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-md">
          <Plus className="w-3.5 h-3.5 pointer-events-none" />
        </Handle>
      </div>
    )
  }

  return (
    <div 
      onClick={() => onSelect(entity.id)}
      className="w-36 h-48 rounded-2xl border-2 border-oros-800/90 bg-oros-900 hover:border-gold-400 shadow-2xl group transition-all cursor-pointer relative select-none"
    >
      {/* 4 Interactive Drag/Click Handles with Plus icon */}
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        title="Drag line to connect, or click to spawn parent above"
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(id, 'top')
        }}
        className="!w-6 !h-6 !-top-3 !rounded-full !bg-oros-900 !border-2 !border-oros-700 hover:!border-gold-400 !text-oros-300 hover:!text-gold-300 hover:scale-110 flex items-center justify-center cursor-crosshair z-30 transition-all shadow-md"
      >
        <Plus className="w-3.5 h-3.5 pointer-events-none" />
      </Handle>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        title="Drag line to connect, or click to spawn child below"
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(id, 'bottom')
        }}
        className="!w-6 !h-6 !-bottom-3.5 !rounded-full !bg-oros-900 !border-2 !border-oros-700 hover:!border-gold-400 !text-oros-300 hover:!text-gold-300 hover:scale-110 flex items-center justify-center cursor-crosshair z-30 transition-all shadow-md"
      >
        <Plus className="w-3.5 h-3.5 pointer-events-none" />
      </Handle>

      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        title="Drag line to connect, or click to spawn spouse/peer left"
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(id, 'left')
        }}
        className="!w-6 !h-6 !-left-3 !rounded-full !bg-oros-900 !border-2 !border-oros-700 hover:!border-gold-400 !text-oros-300 hover:!text-gold-300 hover:scale-110 flex items-center justify-center cursor-crosshair z-30 transition-all shadow-md"
      >
        <Plus className="w-3.5 h-3.5 pointer-events-none" />
      </Handle>

      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        title="Drag line to connect, or click to spawn spouse/peer right"
        onClick={(e) => {
          e.stopPropagation()
          onQuickAdd(id, 'right')
        }}
        className="!w-6 !h-6 !-right-3 !rounded-full !bg-oros-900 !border-2 !border-oros-700 hover:!border-gold-400 !text-oros-300 hover:!text-gold-300 hover:scale-110 flex items-center justify-center cursor-crosshair z-30 transition-all shadow-md"
      >
        <Plus className="w-3.5 h-3.5 pointer-events-none" />
      </Handle>

      {/* Full Portrait Artwork */}
      <div className="w-full h-full rounded-2xl overflow-hidden bg-oros-950 relative">
        {entity.avatar && !imgError ? (
          <img
            src={entity.avatar}
            alt={entity.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-oros-800 to-oros-950 text-gold-400/60 font-serif text-3xl font-bold">
            <span>{entity.title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-oros-950 via-oros-950/70 to-transparent pointer-events-none rounded-b-2xl" />
      </div>

      {/* Unclipped Name Plate inside bottom */}
      <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-xl bg-oros-950/90 border border-oros-700/70 group-hover:border-gold-400 text-slate-100 group-hover:text-gold-300 font-serif font-bold text-xs tracking-tight shadow-md backdrop-blur-md text-center truncate transition-all z-20">
        {entity.title}
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

// Bottom-Right Floating Zoom Controls Widget matching Oros UI
const FloatingZoomControls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-oros-900/95 border border-oros-700/80 shadow-2xl backdrop-blur-md">
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className="p-1.5 rounded-xl text-oros-300 hover:text-gold-400 hover:bg-oros-800 transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className="p-1.5 rounded-xl text-oros-300 hover:text-gold-400 hover:bg-oros-800 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={() => fitView({ padding: 0.2, duration: 400 })}
        className="p-1.5 rounded-xl text-oros-300 hover:text-gold-400 hover:bg-oros-800 transition-colors"
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

  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigningNodeId, setAssigningNodeId] = useState<string | null>(null)
  const [editingRelation, setEditingRelation] = useState<RelationEdge | null>(null)
  const [activeEntityForPeek, setActiveEntityForPeek] = useState<LoreEntity | null>(null)
  const [showBondsDrawer, setShowBondsDrawer] = useState(false)

  // Quick Add Context State
  const [quickAddSourceNodeId, setQuickAddSourceNodeId] = useState<string | null>(null)
  const [quickAddDirection, setQuickAddDirection] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')

  // Add Bond Form State
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>('existing')
  const [selectedExistingId, setSelectedExistingId] = useState('')
  const [newCharacterName, setNewCharacterName] = useState('')
  const [relationLabel, setRelationLabel] = useState('Child')
  const [relationType, setRelationType] = useState<RelationEdge['relationType']>('family')
  const [selectedIcon, setSelectedIcon] = useState('baby')
  const [selectedColor, setSelectedColor] = useState('#f59e0b')
  const [isDashedLine, setIsDashedLine] = useState(false)
  const [relationNotes, setRelationNotes] = useState('')

  // Edit Bond Form State
  const [editLabel, setEditLabel] = useState('')
  const [editType, setEditType] = useState<RelationEdge['relationType']>('family')
  const [editIcon, setEditIcon] = useState('baby')
  const [editColor, setEditColor] = useState('#f59e0b')
  const [editIsDashed, setEditIsDashed] = useState(false)
  const [editNotes, setEditNotes] = useState('')

  const worldEntities = activeWorldId ? entities[activeWorldId] || [] : []
  const worldRelations = activeWorldId ? relations[activeWorldId] || [] : []

  // Clean initial coordinates for genealogy layout
  const initialNodes: Node[] = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {
      'char-katherine': { x: 180, y: 100 },
      'char-ronald': { x: 480, y: 100 },
      'char-vespera': { x: 760, y: 100 },
      'char-marcus': { x: 1040, y: 100 },
      'char-aurelius': { x: 620, y: 360 },
      'char-lyra': { x: 900, y: 360 },
      'fac-solar': { x: 180, y: 360 },
      'item-astral-crown': { x: 480, y: -140 }
    }

    return worldEntities.map((ent, idx) => {
      const pos = positions[ent.id] || { 
        x: 180 + (idx % 4) * 280, 
        y: 100 + Math.floor(idx / 4) * 260 
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
      const isDashed = rel.isDashed ?? (
        rel.notes?.includes('dashed') || 
        rel.label.toLowerCase().includes('ex') || 
        rel.label.toLowerCase().includes('adopted') ||
        rel.label.toLowerCase().includes('rival') ||
        rel.relationType === 'rival'
      )

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

      return {
        id: rel.id,
        source: rel.sourceEntityId,
        target: rel.targetEntityId,
        sourceHandle,
        targetHandle,
        label: rel.label,
        type: 'genealogyEdge',
        data: {
          icon: rel.icon || 'sparkles',
          color: rel.color || '#f5c542',
          isDashed,
          relationType: rel.relationType,
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
    setRelationType(preset.type as any)
    setSelectedIcon(preset.icon)
    setSelectedColor(preset.color)
    setIsDashedLine(preset.dashed)
  }

  const applyEditPreset = (preset: typeof BOND_PRESETS[0]) => {
    setEditLabel(preset.label)
    setEditType(preset.type as any)
    setEditIcon(preset.icon)
    setEditColor(preset.color)
    setEditIsDashed(preset.dashed)
  }

  // Handle clicking (+) button to trigger quick add modal
  const handleTriggerQuickAdd = (sourceId: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
    setQuickAddSourceNodeId(sourceId)
    setQuickAddDirection(direction)

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
      isDashed: isDashedLine,
      notes: relationNotes.trim() || undefined
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
      setEditIcon(rel.icon || 'sparkles')
      setEditColor(rel.color || '#f5c542')
      setEditIsDashed(rel.isDashed ?? rel.notes?.includes('dashed') ?? false)
      setEditNotes(rel.notes || '')
    }
  }

  // Save edited relation
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRelation || !editLabel.trim()) return

    updateRelation(editingRelation.id, {
      label: editLabel.trim(),
      relationType: editType,
      icon: editIcon,
      color: editColor,
      isDashed: editIsDashed,
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

  const sourceEntity = quickAddSourceNodeId ? worldEntities.find(e => e.id === quickAddSourceNodeId) : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-oros-950 relative select-none">
      {/* Top Bar with Oros Design System */}
      <div className="h-12 bg-oros-900/90 border-b border-oros-800/80 px-4 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-sm font-bold text-slate-100 flex items-center gap-2">
              Character & Familial Relations
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-oros-800 text-gold-400 font-normal border border-oros-700/60">
                Genealogy Tree
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Manage All Bonds Drawer */}
          <button
            onClick={() => setShowBondsDrawer(!showBondsDrawer)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showBondsDrawer 
                ? 'bg-oros-800 border-gold-400 text-gold-300' 
                : 'bg-oros-900/80 border-oros-700/80 text-slate-300 hover:bg-oros-800 hover:text-slate-100'
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
            className="px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-oros-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Relation</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport with Cool Slate Dot Grid matching Oros */}
      <div className="flex-1 h-full w-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Background 
            variant={BackgroundVariant.Dots}
            color="#223044" 
            gap={20} 
            size={1.2} 
          />
          
          <FloatingZoomControls />
        </ReactFlow>

        {/* Minimalist Floating Guide */}
        <div className="absolute bottom-4 left-6 z-10 px-3.5 py-1.5 rounded-full bg-oros-900/90 border border-oros-700/80 text-[11px] text-oros-300 shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-gold-400" />
          <span><strong>Drag</strong> from any (+) handle to connect cards, or <strong>click</strong> to spawn a new character</span>
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
        <aside className="absolute top-12 right-0 bottom-0 w-80 bg-oros-900/98 border-l border-oros-800 shadow-2xl z-30 flex flex-col backdrop-blur-md animate-in slide-in-from-right duration-200">
          <div className="p-3.5 border-b border-oros-800 flex items-center justify-between">
            <h3 className="font-serif font-bold text-xs text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gold-400" />
              <span>Active Relational Bonds ({worldRelations.length})</span>
            </h3>
            <button 
              onClick={() => setShowBondsDrawer(false)}
              className="p-1 rounded-md text-oros-400 hover:text-slate-100 hover:bg-oros-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {worldRelations.map((rel) => {
              const IconComponent = getIconComponent(rel.icon)
              const bondColor = rel.color || '#f5c542'
              return (
                <div
                  key={rel.id}
                  className="p-2.5 rounded-xl bg-oros-950/90 border border-oros-800 hover:border-gold-400/50 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5"
                      style={{ borderColor: bondColor, color: bondColor }}
                    >
                      <IconComponent className="w-3 h-3" />
                      <span>{rel.label}</span>
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenEdit(rel.id)}
                        className="p-1 rounded text-oros-400 hover:text-gold-300 hover:bg-oros-800"
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

                  <div className="text-xs font-serif font-bold text-slate-200 flex items-center gap-1.5 mt-1">
                    <span className="truncate max-w-[100px]">{getEntityTitle(rel.sourceEntityId)}</span>
                    <span className="text-gold-400">→</span>
                    <span className="truncate max-w-[100px]">{getEntityTitle(rel.targetEntityId)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
      )}

      {/* Add / Connect Relation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-gold-400" />
                <span>Add Relational Bond</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-oros-400 hover:text-slate-100 hover:bg-oros-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connecting Origin Header */}
            {sourceEntity && (
              <div className="p-2.5 rounded-xl bg-oros-950 border border-oros-800 mb-4 flex items-center gap-3">
                <div className="w-10 h-12 rounded-lg overflow-hidden bg-oros-900 flex-shrink-0">
                  {sourceEntity.avatar ? (
                    <img src={sourceEntity.avatar} alt={sourceEntity.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-serif font-bold text-gold-400">
                      {sourceEntity.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-oros-400 uppercase font-mono">Origin Character</div>
                  <div className="text-xs font-serif font-bold text-slate-100">{sourceEntity.title}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmAddRelation} className="space-y-4">
              {/* Target Character Selector */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1.5">
                  1. Target Character
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setTargetMode('existing')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      targetMode === 'existing'
                        ? 'bg-gold-500/20 border-gold-400 text-gold-300'
                        : 'bg-oros-950 border-oros-800 text-oros-400'
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
                        : 'bg-oros-950 border-oros-800 text-oros-400'
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
                    className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
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
                    placeholder="Enter character name (e.g. Prince Aurelius, Hortense)..."
                    className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                  />
                )}
              </div>

              {/* Relationship Presets with Icons & Colors */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1.5">
                  2. Choose Preset
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {BOND_PRESETS.map((preset) => {
                    const PresetIcon = getIconComponent(preset.icon)
                    const isSelected = relationLabel === preset.label
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-sans border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-oros-950 border-2 font-bold shadow-md'
                            : 'bg-oros-950/60 border-oros-800 text-slate-300 hover:border-gold-400/60'
                        }`}
                        style={{ borderColor: isSelected ? preset.color : undefined }}
                      >
                        <span style={{ color: preset.color }}>
                          <PresetIcon className="w-3 h-3" />
                        </span>
                        <span style={{ color: isSelected ? preset.color : undefined }}>{preset.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Relationship Label */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">3. Relationship Label</label>
                <input
                  type="text"
                  required
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  placeholder="e.g. Spouse, Child, Sibling, Vassal, Sworn Liege..."
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Custom Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1.5">4. Pick Icon</label>
                <div className="grid grid-cols-7 gap-1.5 p-2 bg-oros-950 rounded-xl border border-oros-800">
                  {Object.entries(RELATION_ICONS).map(([key, IconComp]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedIcon(key)}
                      title={key}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        selectedIcon === key
                          ? 'bg-oros-800 border-2 border-gold-400 text-gold-300 shadow-md scale-110'
                          : 'text-oros-400 hover:text-slate-100 hover:bg-oros-900'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Picker & Line Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-oros-300 mb-1.5">5. Pick Color</label>
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-oros-950 rounded-xl border border-oros-800">
                    {BOND_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setSelectedColor(c.hex)}
                        title={c.label}
                        className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                          selectedColor === c.hex ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selectedColor === c.hex && <Check className="w-3 h-3 text-black stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-oros-300 mb-1.5">6. Line Style</label>
                  <button
                    type="button"
                    onClick={() => setIsDashedLine(!isDashedLine)}
                    className="w-full h-10 bg-oros-950 border border-oros-700 rounded-xl px-3 text-xs text-slate-200 flex items-center justify-between hover:border-gold-400 transition-colors"
                  >
                    <span>{isDashedLine ? 'Dashed Line' : 'Solid Line'}</span>
                    <span className="font-mono text-oros-400 font-bold">{isDashedLine ? '- - -' : '───'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md"
                >
                  Create Relation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Relation Modal */}
      {editingRelation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-gold-400" />
                <span>Edit Relational Bond</span>
              </h3>
              <button
                onClick={() => setEditingRelation(null)}
                className="p-1 rounded-lg text-oros-400 hover:text-slate-100 hover:bg-oros-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Source & Target Header with Reverse Button */}
            <div className="p-3 bg-oros-950 rounded-xl border border-oros-800 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-slate-200">
                <span>{getEntityTitle(editingRelation.sourceEntityId)}</span>
                <span className="text-gold-400 font-mono">→</span>
                <span>{getEntityTitle(editingRelation.targetEntityId)}</span>
              </div>
              <button
                type="button"
                onClick={handleReverseDirection}
                className="px-2.5 py-1 rounded-md bg-oros-900 border border-oros-700 text-oros-300 hover:text-gold-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Swap source and target direction"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Reverse</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Relationship Presets with Icons & Colors */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1.5">Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {BOND_PRESETS.map((preset) => {
                    const PresetIcon = getIconComponent(preset.icon)
                    const isSelected = editLabel === preset.label
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyEditPreset(preset)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-sans border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-oros-950 border-2 font-bold shadow-md'
                            : 'bg-oros-950/60 border-oros-800 text-slate-300 hover:border-gold-400/60'
                        }`}
                        style={{ borderColor: isSelected ? preset.color : undefined }}
                      >
                        <span style={{ color: preset.color }}>
                          <PresetIcon className="w-3 h-3" />
                        </span>
                        <span style={{ color: isSelected ? preset.color : undefined }}>{preset.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Relationship Label Input */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1">Relationship Label</label>
                <input
                  type="text"
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-400"
                />
              </div>

              {/* Custom Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-oros-300 mb-1.5">Pick Icon</label>
                <div className="grid grid-cols-7 gap-1.5 p-2 bg-oros-950 rounded-xl border border-oros-800">
                  {Object.entries(RELATION_ICONS).map(([key, IconComp]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditIcon(key)}
                      title={key}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        editIcon === key
                          ? 'bg-oros-800 border-2 border-gold-400 text-gold-300 shadow-md scale-110'
                          : 'text-oros-400 hover:text-slate-100 hover:bg-oros-900'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker & Line Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-oros-300 mb-1.5">Pick Color</label>
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-oros-950 rounded-xl border border-oros-800">
                    {BOND_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEditColor(c.hex)}
                        title={c.label}
                        className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                          editColor === c.hex ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {editColor === c.hex && <Check className="w-3 h-3 text-black stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-oros-300 mb-1.5">Line Style</label>
                  <button
                    type="button"
                    onClick={() => setEditIsDashed(!editIsDashed)}
                    className="w-full h-10 bg-oros-950 border border-oros-700 rounded-xl px-3 text-xs text-slate-200 flex items-center justify-between hover:border-gold-400 transition-colors"
                  >
                    <span>{editIsDashed ? 'Dashed Line' : 'Solid Line'}</span>
                    <span className="font-mono text-oros-400 font-bold">{editIsDashed ? '- - -' : '───'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => handleDeleteRelation(editingRelation.id)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRelation(null)}
                    className="px-4 py-2 rounded-lg text-xs text-oros-300 hover:bg-oros-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md flex items-center gap-1.5"
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
    </div>
  )
}
