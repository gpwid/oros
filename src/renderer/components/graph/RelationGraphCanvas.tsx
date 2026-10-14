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
  Orbit, Swords, Gem, Flame, Skull, Anchor, BookOpen, GitFork, Info,
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
  orbit: Orbit,
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
  { label: 'Ally', icon: 'orbit', color: '#f5c542', type: 'ally', dashed: false },
  { label: 'Rival / Enemy', icon: 'swords', color: '#ef4444', type: 'rival', dashed: true },
  { label: 'Heirloom / Artifact', icon: 'gem', color: '#c084fc', type: 'creator', dashed: false }
]

const getIconComponent = (key?: string) => {
  return RELATION_ICONS[key || 'orbit'] || Orbit
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
    borderRadius: 8
  })

  const onEdit = (data as any)?.onEdit
  const iconKey = (data as any)?.icon || 'orbit'
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
        strokeWidth={1.5}
        strokeDasharray={isDashed ? '4 4' : undefined}
        className="transition-all opacity-70 hover:opacity-100"
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
            className="nodrag nopan group px-2 py-0.5 rounded-[2px] bg-oros-950 border border-oros-750 hover:border-oros-500 text-[10px] font-mono font-medium text-oros-200 shadow-sm whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <span style={{ color: bondColor }}>
              <IconComp className="w-3 h-3" />
            </span>
            <span>{label}</span>
            <Edit3 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-oros-400 transition-opacity ml-0.5" />
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
        className="w-36 h-48 rounded-[3px] border border-dashed border-oros-750 hover:border-oros-500 bg-oros-950 flex flex-col items-center justify-center transition-colors cursor-pointer group shadow-sm relative select-none"
      >
        <Plus className="w-8 h-8 text-oros-500 group-hover:text-oros-300 transition-colors" />
        
        <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-[2px] bg-oros-900 border border-oros-750 text-oros-400 group-hover:text-oros-200 text-[10px] font-mono uppercase tracking-wider text-center transition-colors">
          Add Entity
        </div>

        {/* Drag handles for unassigned card */}
        <Handle type="target" position={Position.Top} id="top" className="!w-5 !h-5 !-top-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-sm">
          <Plus className="w-3 h-3 pointer-events-none" />
        </Handle>
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-5 !h-5 !-bottom-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-sm">
          <Plus className="w-3 h-3 pointer-events-none" />
        </Handle>
        <Handle type="target" position={Position.Left} id="left" className="!w-5 !h-5 !-left-2.5 !rounded-[2px] !bg-oros-900 !border !border-oros-700 hover:!border-oros-400 !text-oros-300 flex items-center justify-center cursor-crosshair z-30 shadow-sm">
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
      className="w-36 h-48 rounded-[3px] border border-oros-750 bg-oros-900 hover:border-oros-500 shadow-sm group transition-colors cursor-pointer relative select-none"
    >
      {/* 4 Interactive Drag/Click Handles */}
      <Handle
        type="target"
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
        type="target"
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
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-oros-950 via-oros-950/70 to-transparent pointer-events-none rounded-b-[2px]" />
      </div>

      {/* Name Plate */}
      <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-[2px] bg-oros-950/95 border border-oros-750 group-hover:border-oros-500 text-oros-100 font-sans font-medium text-xs tracking-tight shadow-sm text-center truncate transition-colors z-20">
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

// Floating Zoom Controls
const FloatingZoomControls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="absolute bottom-5 right-5 z-20 flex flex-col items-center gap-1 p-1 rounded-[3px] bg-oros-900 border border-oros-750 shadow-md">
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => fitView({ padding: 0.2, duration: 400 })}
        className="p-1.5 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
        title="Fit Full Tree"
      >
        <Maximize2 className="w-3.5 h-3.5" />
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
      {/* Top Bar with Sovereign Instrument Design System */}
      <div className="h-11 bg-oros-950 border-b border-oros-800 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-[3px] bg-oros-900 text-oros-300 border border-oros-750">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-sans text-xs font-semibold tracking-wide uppercase text-oros-100 flex items-center gap-2">
              Character & Familial Relations
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-oros-900 text-oros-400 font-normal border border-oros-750 tracking-wider">
                Genealogy Ledger
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Manage All Bonds Drawer */}
          <button
            onClick={() => setShowBondsDrawer(!showBondsDrawer)}
            className={`px-2.5 py-1.5 rounded-[3px] border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showBondsDrawer 
                ? 'bg-oros-800 border-oros-500 text-oros-100' 
                : 'bg-oros-900 border-oros-750 text-oros-300 hover:bg-oros-850 hover:text-oros-100'
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
            className="px-3 py-1.5 rounded-[3px] bg-oros-200 hover:bg-white text-oros-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Relation</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
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
        <div className="absolute bottom-4 left-6 z-10 px-3 py-1.5 rounded-[3px] bg-oros-900/95 border border-oros-750 text-[11px] text-oros-300 shadow-md flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-oros-400" />
          <span><strong className="text-oros-200 font-medium">Drag</strong> from any handle to connect, or <strong className="text-oros-200 font-medium">click</strong> to spawn a new entity</span>
        </div>
      </div>

      {/* QuickPeek Drawer when entity clicked */}
      {activeEntityForPeek && !showBondsDrawer && (
        <div className="absolute top-13 right-5 z-30 animate-in fade-in slide-in-from-right-3 duration-150">
          <div className="relative">
            <button
              onClick={() => setActiveEntityForPeek(null)}
              className="absolute top-2 right-2 z-50 p-1 rounded-[2px] bg-oros-950/80 text-oros-400 hover:text-oros-100 transition-colors"
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
        <aside className="absolute top-11 right-0 bottom-0 w-80 bg-oros-950 border-l border-oros-800 shadow-xl z-30 flex flex-col">
          <div className="p-3 border-b border-oros-800 flex items-center justify-between">
            <h3 className="font-sans font-semibold text-xs text-oros-100 flex items-center gap-2 uppercase tracking-wide">
              <SlidersHorizontal className="w-3.5 h-3.5 text-oros-400" />
              <span>Active Relational Bonds ({worldRelations.length})</span>
            </h3>
            <button 
              onClick={() => setShowBondsDrawer(false)}
              className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
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
                  className="p-2.5 rounded-[3px] bg-oros-900 border border-oros-750 hover:border-oros-600 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[2px] border flex items-center gap-1"
                      style={{ borderColor: bondColor, color: bondColor }}
                    >
                      <IconComponent className="w-3 h-3" />
                      <span>{rel.label}</span>
                    </span>
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenEdit(rel.id)}
                        className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
                        title="Edit Bond"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteRelation(rel.id)}
                        className="p-1 rounded-[2px] text-oros-400 hover:text-rose-400 hover:bg-oros-800 transition-colors"
                        title="Delete Bond"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-sans font-medium text-oros-200 flex items-center gap-1.5 mt-1">
                    <span className="truncate max-w-[100px]">{getEntityTitle(rel.sourceEntityId)}</span>
                    <span className="text-oros-500 font-mono">→</span>
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
          <div className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] p-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-oros-400" />
                <span>Add Relational Bond</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-[3px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connecting Origin Header */}
            {sourceEntity && (
              <div className="p-2 rounded-[3px] bg-oros-950 border border-oros-750 mb-4 flex items-center gap-3">
                <div className="w-9 h-11 rounded-[2px] overflow-hidden bg-oros-900 flex-shrink-0">
                  {sourceEntity.avatar ? (
                    <img src={sourceEntity.avatar} alt={sourceEntity.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-serif font-bold text-oros-400">
                      {sourceEntity.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-oros-400 uppercase font-mono tracking-wider">Origin Entity</div>
                  <div className="text-xs font-sans font-medium text-oros-100">{sourceEntity.title}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmAddRelation} className="space-y-4">
              {/* Target Character Selector */}
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1.5">
                  1. Target Entity
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setTargetMode('existing')}
                    className={`py-1.5 px-3 rounded-[3px] text-xs font-medium border transition-colors ${
                      targetMode === 'existing'
                        ? 'bg-oros-800 border-oros-500 text-oros-100'
                        : 'bg-oros-950 border-oros-750 text-oros-400 hover:text-oros-200'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('new')}
                    className={`py-1.5 px-3 rounded-[3px] text-xs font-medium border transition-colors ${
                      targetMode === 'new'
                        ? 'bg-oros-800 border-oros-500 text-oros-100'
                        : 'bg-oros-950 border-oros-750 text-oros-400 hover:text-oros-200'
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
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                  >
                    <option value="">Choose entity from codex...</option>
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
                    placeholder="Enter character or entity name..."
                    className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                  />
                )}
              </div>

              {/* Relationship Presets with Icons & Colors */}
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1.5">
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
                        className={`px-2 py-1 rounded-[2px] text-[10px] font-mono border transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-oros-950 border font-semibold shadow-sm'
                            : 'bg-oros-950/60 border-oros-750 text-oros-300 hover:border-oros-600'
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
                <label className="block text-xs font-medium text-oros-300 mb-1">3. Relationship Label</label>
                <input
                  type="text"
                  required
                  value={relationLabel}
                  onChange={(e) => setRelationLabel(e.target.value)}
                  placeholder="e.g. Spouse, Child, Sibling, Vassal, Sworn Liege..."
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                />
              </div>

              {/* Custom Icon Picker */}
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1.5">4. Pick Icon</label>
                <div className="grid grid-cols-7 gap-1.5 p-1.5 bg-oros-950 rounded-[3px] border border-oros-750">
                  {Object.entries(RELATION_ICONS).map(([key, IconComp]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedIcon(key)}
                      title={key}
                      className={`p-1.5 rounded-[2px] flex items-center justify-center transition-colors ${
                        selectedIcon === key
                          ? 'bg-oros-800 border border-oros-500 text-oros-100 shadow-sm'
                          : 'text-oros-400 hover:text-oros-100 hover:bg-oros-900'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Picker & Line Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1.5">5. Pick Color</label>
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-oros-950 rounded-[3px] border border-oros-750">
                    {BOND_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setSelectedColor(c.hex)}
                        title={c.label}
                        className={`w-5 h-5 rounded-[2px] transition-colors flex items-center justify-center ${
                          selectedColor === c.hex ? 'ring-1 ring-white shadow-sm' : 'hover:opacity-90'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selectedColor === c.hex && <Check className="w-3 h-3 text-black stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1.5">6. Line Style</label>
                  <button
                    type="button"
                    onClick={() => setIsDashedLine(!isDashedLine)}
                    className="w-full h-8 bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 text-xs text-oros-200 flex items-center justify-between hover:border-oros-600 transition-colors"
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
                  className="px-3 py-1.5 rounded-[3px] text-xs text-oros-300 hover:bg-oros-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[3px] text-xs font-semibold bg-oros-200 hover:bg-white text-oros-950 shadow-sm transition-colors"
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
          <div className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] p-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100 flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-oros-400" />
                <span>Edit Relational Bond</span>
              </h3>
              <button
                onClick={() => setEditingRelation(null)}
                className="p-1 rounded-[3px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Source & Target Header with Reverse Button */}
            <div className="p-2 rounded-[3px] bg-oros-950 border border-oros-750 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-sans font-medium text-oros-200">
                <span>{getEntityTitle(editingRelation.sourceEntityId)}</span>
                <span className="text-oros-500 font-mono">→</span>
                <span>{getEntityTitle(editingRelation.targetEntityId)}</span>
              </div>
              <button
                type="button"
                onClick={handleReverseDirection}
                className="px-2 py-1 rounded-[2px] bg-oros-900 border border-oros-750 text-oros-300 hover:text-oros-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Swap source and target direction"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Reverse</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Relationship Presets with Icons & Colors */}
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1.5">Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {BOND_PRESETS.map((preset) => {
                    const PresetIcon = getIconComponent(preset.icon)
                    const isSelected = editLabel === preset.label
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyEditPreset(preset)}
                        className={`px-2 py-1 rounded-[2px] text-[10px] font-mono border transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-oros-950 border font-semibold shadow-sm'
                            : 'bg-oros-950/60 border-oros-750 text-oros-300 hover:border-oros-600'
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
                <label className="block text-xs font-medium text-oros-300 mb-1">Relationship Label</label>
                <input
                  type="text"
                  required
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-oros-500 font-sans"
                />
              </div>

              {/* Custom Icon Picker */}
              <div>
                <label className="block text-xs font-medium text-oros-300 mb-1.5">Pick Icon</label>
                <div className="grid grid-cols-7 gap-1.5 p-1.5 bg-oros-950 rounded-[3px] border border-oros-750">
                  {Object.entries(RELATION_ICONS).map(([key, IconComp]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditIcon(key)}
                      title={key}
                      className={`p-1.5 rounded-[2px] flex items-center justify-center transition-colors ${
                        editIcon === key
                          ? 'bg-oros-800 border border-oros-500 text-oros-100 shadow-sm'
                          : 'text-oros-400 hover:text-oros-100 hover:bg-oros-900'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker & Line Style */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1.5">Pick Color</label>
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-oros-950 rounded-[3px] border border-oros-750">
                    {BOND_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setEditColor(c.hex)}
                        title={c.label}
                        className={`w-5 h-5 rounded-[2px] transition-colors flex items-center justify-center ${
                          editColor === c.hex ? 'ring-1 ring-white shadow-sm' : 'hover:opacity-90'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {editColor === c.hex && <Check className="w-3 h-3 text-black stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-oros-300 mb-1.5">Line Style</label>
                  <button
                    type="button"
                    onClick={() => setEditIsDashed(!editIsDashed)}
                    className="w-full h-8 bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 text-xs text-oros-200 flex items-center justify-between hover:border-oros-600 transition-colors"
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
                  className="px-2.5 py-1.5 rounded-[3px] text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRelation(null)}
                    className="px-3 py-1.5 rounded-[3px] text-xs text-oros-300 hover:bg-oros-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-[3px] text-xs font-semibold bg-oros-200 hover:bg-white text-oros-950 shadow-sm flex items-center gap-1.5 transition-colors"
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
