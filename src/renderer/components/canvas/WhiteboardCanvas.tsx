import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  MousePointer, Hand, StickyNote, Square, Circle, Diamond, 
  Type, PenTool, Sparkles, Plus, Trash2, X, ChevronDown, 
  User, Image as ImageIcon, Check, RefreshCw, Palette,
  ArrowRight, Undo, Layers
} from 'lucide-react'
import { LoreEntity, CanvasStroke } from '@shared/types'

// ==========================================
// CUSTOM NODES
// ==========================================

// 1. Draggable Character / Lore Card Node (Inspired by VVD)
const CanvasCardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const [imgError, setImgError] = useState(false)
  const cardData = data as { 
    entityId?: string; 
    title?: string; 
    subtitle?: string; 
    avatar?: string;
  }

  const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'

  return (
    <div className={`relative w-44 rounded-2xl bg-oros-950/95 border transition-all duration-200 overflow-hidden shadow-2xl select-none group ${
      selected ? 'border-gold-400 ring-2 ring-gold-400/40' : 'border-oros-800/80 hover:border-oros-700'
    }`}>
      {/* 4 Cardinal Handles */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-bottom-1.5" />
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-left-1.5" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-right-1.5" />

      {/* Card Portrait Banner */}
      <div className="w-full h-40 bg-oros-900 relative overflow-hidden">
        <img
          src={imgError ? fallbackAvatar : (cardData.avatar || fallbackAvatar)}
          alt={cardData.title || 'Card'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-oros-950 via-transparent to-transparent opacity-80" />
      </div>

      {/* Card Info Footer */}
      <div className="p-3 bg-oros-950/95">
        <div className="flex items-center gap-1.5 text-[10px] text-gold-400 font-semibold uppercase tracking-wider mb-0.5">
          <User className="w-3 h-3 text-gold-400" />
          <span>{cardData.subtitle || 'Karakter'}</span>
        </div>
        <div className="font-serif font-bold text-sm text-slate-100 truncate">
          {cardData.title || 'Untitled Card'}
        </div>
      </div>
    </div>
  )
}

// 2. Lined Sticky Note Node (Inspired by VVD lined paper notepad)
const StickyNoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const noteData = data as { title?: string; content?: string }
  const [title, setTitle] = useState(noteData.title || 'Title')
  const [content, setContent] = useState(noteData.content || 'Write something...')
  const { saveCanvasNodesAndEdges, selectedCanvasId, canvases, activeWorldId } = useWorldStore()

  return (
    <div className={`relative w-64 rounded-xl bg-[#fefae0] text-amber-950 border border-amber-300/80 shadow-2xl transition-all duration-200 p-3 select-none ${
      selected ? 'ring-2 ring-amber-500 shadow-amber-900/40' : 'hover:shadow-xl'
    }`}>
      {/* 4 Cardinal Handles */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-amber-600 !border-2 !border-white !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-amber-600 !border-2 !border-white !-bottom-1.5" />
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-amber-600 !border-2 !border-white !-left-1.5" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-amber-600 !border-2 !border-white !-right-1.5" />

      {/* Notepad Pin & Title */}
      <div className="border-b border-amber-300/80 pb-1.5 mb-2 flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="bg-transparent font-serif font-bold text-sm text-amber-950 placeholder-amber-700/50 outline-none w-full"
        />
        <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 ml-1" />
      </div>

      {/* Ruled / Lined Body Area */}
      <div className="relative">
        <textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write something..."
          style={{
            lineHeight: '24px',
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #e9d8a6 24px)',
            backgroundAttachment: 'local'
          }}
          className="w-full bg-transparent text-xs text-amber-900/90 placeholder-amber-700/50 outline-none resize-none"
        />
      </div>
    </div>
  )
}

// 3. Geometric Shape Node (Parallelogram, Diamond, Rectangle, Circle)
const ShapeNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const shapeData = data as { 
    shapeType?: 'parallelogram' | 'diamond' | 'rectangle' | 'circle'; 
    color?: string; 
    text?: string;
  }
  const [text, setText] = useState(shapeData.text || '')
  const type = shapeData.shapeType || 'parallelogram'

  return (
    <div className={`relative transition-all duration-200 select-none ${
      selected ? 'ring-2 ring-gold-400' : ''
    }`}>
      {/* 4 Cardinal Handles */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-bottom-1.5" />
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-left-1.5" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-right-1.5" />

      {type === 'parallelogram' && (
        <div className="relative w-36 h-28 flex items-center justify-center">
          <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 140 100">
            <polygon 
              points="35,5 135,5 105,95 5,95" 
              fill={shapeData.color || '#ffffff'} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
            />
          </svg>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder=""
            className="absolute inset-0 bg-transparent text-center font-sans font-medium text-xs text-slate-800 outline-none px-6"
          />
        </div>
      )}

      {type === 'diamond' && (
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100">
            <polygon 
              points="50,5 95,50 50,95 5,50" 
              fill={shapeData.color || '#ffffff'} 
              stroke="#cbd5e1" 
              strokeWidth="1.5"
            />
          </svg>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder=""
            className="absolute inset-0 bg-transparent text-center font-sans font-medium text-xs text-slate-800 outline-none px-4"
          />
        </div>
      )}

      {type === 'rectangle' && (
        <div className="w-36 h-24 rounded-xl bg-white/95 border border-slate-300 shadow-xl flex items-center justify-center p-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Text..."
            className="w-full bg-transparent text-center font-sans font-medium text-xs text-slate-800 outline-none"
          />
        </div>
      )}

      {type === 'circle' && (
        <div className="w-28 h-28 rounded-full bg-white/95 border border-slate-300 shadow-xl flex items-center justify-center p-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Text..."
            className="w-full bg-transparent text-center font-sans font-medium text-xs text-slate-800 outline-none"
          />
        </div>
      )}
    </div>
  )
}

// 4. Freeform Canvas Text Node
const CanvasTextNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const textData = data as { text?: string }
  const [text, setText] = useState(textData.text || 'Write annotation...')

  return (
    <div className={`relative px-3 py-1.5 rounded-lg select-none transition-all ${
      selected ? 'ring-1 ring-gold-400 bg-oros-900/40' : 'hover:bg-oros-900/20'
    }`}>
      {/* 4 Cardinal Handles */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gold-400/80 !border !border-oros-950 !-top-1" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gold-400/80 !border !border-oros-950 !-bottom-1" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gold-400/80 !border !border-oros-950 !-left-1" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gold-400/80 !border !border-oros-950 !-right-1" />

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="bg-transparent font-serif text-slate-200 text-sm tracking-wide outline-none min-w-[200px]"
      />
    </div>
  )
}

const nodeTypes = {
  canvasCard: CanvasCardNode,
  stickyNote: StickyNoteNode,
  shape: ShapeNode,
  canvasText: CanvasTextNode,
}

// ==========================================
// WHITEBOARD CANVAS INNER CONTENT
// ==========================================

interface WhiteboardCanvasProps {
  canvasId?: string;
}

export const WhiteboardCanvasContent: React.FC<WhiteboardCanvasProps> = ({ canvasId }) => {
  const { 
    activeWorldId, canvases, selectedCanvasId, setSelectedCanvasId,
    createCanvas, updateCanvas, deleteCanvas, saveCanvasNodesAndEdges,
    addCanvasStroke, clearCanvasStrokes, entities
  } = useWorldStore()

  const { addToast } = useToastStore()
  const reactFlowInstance = useReactFlow()

  const worldId = activeWorldId || 'world-aethelgard'
  const worldCanvases = canvases[worldId] || []
  const currentCanvasId = canvasId || selectedCanvasId || worldCanvases[0]?.id || 'canvas-main'
  const currentCanvas = worldCanvases.find((c) => c.id === currentCanvasId) || worldCanvases[0]

  // Flow nodes and edges state
  const [nodes, setNodes, onNodesChange] = useNodesState(currentCanvas?.nodes || [])
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentCanvas?.edges || [])

  // Sync when canvas changes
  useEffect(() => {
    if (currentCanvas) {
      setNodes(currentCanvas.nodes || [])
      setEdges(currentCanvas.edges || [])
    }
  }, [currentCanvas?.id])

  // Active Tool state: 'select' | 'pan' | 'pen' | 'text' | 'shape' | 'note' | 'card'
  const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'pen' | 'text'>('select')
  const [penColor, setPenColor] = useState('#ffffff')
  const [showShapePicker, setShowShapePicker] = useState(false)
  const [showCardPicker, setShowCardPicker] = useState(false)
  const [showCanvasDropdown, setShowCanvasDropdown] = useState(false)
  const [isRenamingCanvas, setIsRenamingCanvas] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([])
  const drawingContainerRef = useRef<HTMLDivElement>(null)

  // Handle new edge connection with directional arrow
  const onConnect = useCallback((connection: Connection) => {
    const newEdge: Edge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#f5c542', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#f5c542',
        width: 16,
        height: 16
      }
    }
    setEdges((eds) => {
      const updated = addEdge(newEdge, eds)
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, nodes, updated)
      }
      return updated
    })
  }, [nodes, currentCanvas, saveCanvasNodesAndEdges])

  // Save changes to store
  const handleNodesChangeWrapped = useCallback((changes: any) => {
    onNodesChange(changes)
    // Auto-save nodes after dragging
    setTimeout(() => {
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, reactFlowInstance.getNodes(), edges)
      }
    }, 100)
  }, [currentCanvas, onNodesChange, edges, saveCanvasNodesAndEdges, reactFlowInstance])

  // Add a Sticky Note at center of viewport
  const handleAddStickyNote = () => {
    const center = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    })
    const newNode: Node = {
      id: `note-${Date.now()}`,
      type: 'stickyNote',
      position: { x: center.x - 120, y: center.y - 80 },
      data: { title: 'Title', content: 'Write something...' }
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      if (currentCanvas) saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
      return updated
    })
    addToast('Added Sticky Note', 'success')
  }

  // Add Geometric Shape
  const handleAddShape = (shapeType: 'parallelogram' | 'diamond' | 'rectangle' | 'circle') => {
    setShowShapePicker(false)
    const center = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    })
    const newNode: Node = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      position: { x: center.x - 70, y: center.y - 50 },
      data: { shapeType, color: '#ffffff', text: '' }
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      if (currentCanvas) saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
      return updated
    })
    addToast(`Added ${shapeType}`, 'success')
  }

  // Add Text Annotation
  const handleAddText = () => {
    const center = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    })
    const newNode: Node = {
      id: `text-${Date.now()}`,
      type: 'canvasText',
      position: { x: center.x - 100, y: center.y - 20 },
      data: { text: 'Double click to edit annotation...' }
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      if (currentCanvas) saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
      return updated
    })
    addToast('Added Text annotation', 'success')
  }

  // Drop Lore Card from Entity
  const handleDropCard = (entity: LoreEntity) => {
    setShowCardPicker(false)
    const center = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    })
    const newNode: Node = {
      id: `card-${entity.id}-${Date.now()}`,
      type: 'canvasCard',
      position: { x: center.x - 88, y: center.y - 100 },
      data: {
        entityId: entity.id,
        title: entity.title,
        subtitle: entity.type.toUpperCase(),
        avatar: entity.avatar
      }
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      if (currentCanvas) saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
      return updated
    })
    addToast(`Added card: ${entity.title}`, 'success')
  }

  // ==========================================
  // FREEHAND DRAWING PEN HANDLERS
  // ==========================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool !== 'pen') return
    const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setIsDrawing(true)
    setCurrentStroke([pos])
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || activeTool !== 'pen') return
    const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setCurrentStroke((prev) => [...prev, pos])
  }

  const handlePointerUp = () => {
    if (!isDrawing || activeTool !== 'pen') return
    setIsDrawing(false)
    if (currentStroke.length > 1 && currentCanvas) {
      const newStroke: CanvasStroke = {
        id: `stroke-${Date.now()}`,
        points: currentStroke,
        color: penColor,
        width: 3
      }
      addCanvasStroke(currentCanvas.id, newStroke)
    }
    setCurrentStroke([])
  }

  // Convert points array to smooth SVG path
  const pointsToSvgPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ''
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`
    }
    return d
  }

  // Active world entities for the card picker
  const worldEntities = entities[worldId] || []

  return (
    <div 
      className="relative w-full h-full bg-[#0a0f0d] overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* React Flow Infinite Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChangeWrapped}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag={activeTool === 'pan' || activeTool === 'select'}
        selectionOnDrag={activeTool === 'select'}
        zoomOnScroll={true}
        minZoom={0.2}
        maxZoom={2.5}
        className={activeTool === 'pen' ? 'cursor-crosshair' : activeTool === 'pan' ? 'cursor-grab' : 'cursor-default'}
      >
        {/* Subtle dot grid like VVD */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={28} 
          size={1.2} 
          color="rgba(255, 255, 255, 0.14)" 
        />

        {/* Freehand Strokes SVG Layer (Transformed with flow coordinate space) */}
        <svg 
          className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-10"
        >
          <g transform={`translate(${reactFlowInstance.getViewport().x}, ${reactFlowInstance.getViewport().y}) scale(${reactFlowInstance.getViewport().zoom})`}>
            {/* Saved Strokes */}
            {(currentCanvas?.strokes || []).map((stroke) => (
              <path
                key={stroke.id}
                d={pointsToSvgPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            ))}

            {/* In-progress Active Stroke */}
            {isDrawing && currentStroke.length > 1 && (
              <path
                d={pointsToSvgPath(currentStroke)}
                stroke={penColor}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        </svg>
      </ReactFlow>

      {/* Top-Left Canvas Name & Switcher Dropdown */}
      <div className="absolute top-4 left-4 z-20">
        <div className="relative">
          {isRenamingCanvas ? (
            <input
              type="text"
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => {
                if (renameValue.trim() && currentCanvas) {
                  updateCanvas(currentCanvas.id, { name: renameValue.trim() })
                  addToast(`Renamed canvas to "${renameValue.trim()}"`, 'info')
                }
                setIsRenamingCanvas(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (renameValue.trim() && currentCanvas) {
                    updateCanvas(currentCanvas.id, { name: renameValue.trim() })
                    addToast(`Renamed canvas to "${renameValue.trim()}"`, 'info')
                  }
                  setIsRenamingCanvas(false)
                }
                if (e.key === 'Escape') setIsRenamingCanvas(false)
              }}
              className="px-3 py-1.5 rounded-full bg-oros-900/90 border border-gold-400 text-xs font-semibold text-slate-100 shadow-xl outline-none"
            />
          ) : (
            <button
              onClick={() => setShowCanvasDropdown(!showCanvasDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-oros-900/80 hover:bg-oros-800/90 border border-oros-700/60 text-xs font-semibold text-slate-100 shadow-xl backdrop-blur-md transition-all"
            >
              <span>{currentCanvas?.name || 'New Canvas'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-oros-400" />
            </button>
          )}

          {showCanvasDropdown && (
            <div className="absolute left-0 mt-2 w-56 bg-oros-900/95 backdrop-blur-md border border-oros-700/80 rounded-xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-semibold text-oros-400 uppercase tracking-wider">
                Canvases
              </div>
              {worldCanvases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCanvasId(c.id)
                    setShowCanvasDropdown(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-oros-800/60 transition-colors ${
                    c.id === currentCanvas?.id ? 'text-gold-400 font-semibold bg-oros-800/40' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  {c.id === currentCanvas?.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
              <div className="border-t border-oros-800 my-1" />
              <button
                onClick={() => {
                  setShowCanvasDropdown(false)
                  setRenameValue(currentCanvas?.name || '')
                  setIsRenamingCanvas(true)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-oros-800 hover:text-white"
              >
                Rename Canvas
              </button>
              <button
                onClick={() => {
                  setShowCanvasDropdown(false)
                  const c = createCanvas(`Canvas ${Date.now().toString().slice(-4)}`)
                  addToast(`Created ${c.name}`, 'success')
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gold-400 hover:bg-oros-800 flex items-center gap-1.5 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                New Canvas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING BOTTOM TOOLBAR / PILL DOCK (Inspired by VVD) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-oros-950/85 backdrop-blur-md border border-oros-700/60 shadow-2xl">
          {/* 1. Select Tool (Pointer) */}
          <button
            onClick={() => setActiveTool('select')}
            title="Select & Move (V)"
            className={`p-2 rounded-full transition-all ${
              activeTool === 'select'
                ? 'bg-gold-500/20 text-gold-400 border border-gold-400/40 shadow-sm'
                : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800/60'
            }`}
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* 2. Pan / Hand Tool */}
          <button
            onClick={() => setActiveTool('pan')}
            title="Pan / Hand tool (H)"
            className={`p-2 rounded-full transition-all ${
              activeTool === 'pan'
                ? 'bg-gold-500/20 text-gold-400 border border-gold-400/40 shadow-sm'
                : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800/60'
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-oros-800 mx-0.5" />

          {/* 3. Shapes Picker */}
          <div className="relative">
            <button
              onClick={() => setShowShapePicker(!showShapePicker)}
              title="Add Geometric Shape"
              className={`p-2 rounded-full transition-all ${
                showShapePicker
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-400/40'
                  : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800/60'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>

            {showShapePicker && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-oros-900 border border-oros-700 rounded-xl shadow-2xl p-2 flex items-center gap-1.5 z-30">
                <button
                  onClick={() => handleAddShape('parallelogram')}
                  title="Parallelogram (VVD style)"
                  className="p-1.5 rounded hover:bg-oros-800 text-slate-200 hover:text-gold-400"
                >
                  <span className="font-mono text-xs font-bold italic tracking-tighter">▱</span>
                </button>
                <button
                  onClick={() => handleAddShape('diamond')}
                  title="Diamond"
                  className="p-1.5 rounded hover:bg-oros-800 text-slate-200 hover:text-gold-400"
                >
                  <Diamond className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAddShape('rectangle')}
                  title="Rectangle"
                  className="p-1.5 rounded hover:bg-oros-800 text-slate-200 hover:text-gold-400"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAddShape('circle')}
                  title="Circle"
                  className="p-1.5 rounded hover:bg-oros-800 text-slate-200 hover:text-gold-400"
                >
                  <Circle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 4. Sticky Note Button */}
          <button
            onClick={handleAddStickyNote}
            title="Add Lined Sticky Note"
            className="p-2 rounded-full text-oros-400 hover:text-amber-300 hover:bg-oros-800/60 transition-all"
          >
            <StickyNote className="w-4 h-4" />
          </button>

          {/* 5. Lore Card Button */}
          <div className="relative">
            <button
              onClick={() => setShowCardPicker(!showCardPicker)}
              title="Add Lore / Character Card"
              className="p-2 rounded-full text-oros-400 hover:text-emerald-400 hover:bg-oros-800/60 transition-all"
            >
              <Layers className="w-4 h-4" />
            </button>

            {showCardPicker && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 bg-oros-900 border border-oros-700 rounded-xl shadow-2xl p-2 max-h-72 overflow-y-auto z-30">
                <div className="px-2 py-1 text-[10px] font-semibold text-oros-400 uppercase tracking-wider">
                  Pick Lore Entity
                </div>
                {worldEntities.map((ent) => (
                  <button
                    key={ent.id}
                    onClick={() => handleDropCard(ent)}
                    className="w-full text-left p-1.5 rounded-lg hover:bg-oros-800 flex items-center gap-2 text-xs text-slate-200 transition-colors"
                  >
                    <img
                      src={ent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={ent.title}
                      className="w-6 h-6 rounded-md object-cover"
                    />
                    <div className="truncate flex-1">
                      <div className="font-medium truncate">{ent.title}</div>
                      <div className="text-[10px] text-oros-400">{ent.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-oros-800 mx-0.5" />

          {/* 6. Pen / Freehand Draw Tool */}
          <button
            onClick={() => setActiveTool(activeTool === 'pen' ? 'select' : 'pen')}
            title="Pen / Freehand Sketch (Draw circles & loops)"
            className={`p-2 rounded-full transition-all ${
              activeTool === 'pen'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-400/50 shadow-sm'
                : 'text-oros-400 hover:text-slate-100 hover:bg-oros-800/60'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>

          {/* 7. Freeform Text Tool */}
          <button
            onClick={handleAddText}
            title="Add Text (T)"
            className="p-2 rounded-full text-oros-400 hover:text-slate-100 hover:bg-oros-800/60 transition-all"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* 8. Clear Freehand Strokes */}
          <button
            onClick={() => {
              if (currentCanvas && confirm('Clear all freehand pen sketches on this canvas?')) {
                clearCanvasStrokes(currentCanvas.id)
                addToast('Cleared drawing strokes', 'info')
              }
            }}
            title="Clear Freehand Drawings"
            className="p-2 rounded-full text-oros-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WhiteboardCanvasContent {...props} />
    </ReactFlowProvider>
  )
}
