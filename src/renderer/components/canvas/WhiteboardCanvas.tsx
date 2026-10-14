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
  NodeProps,
  NodeResizer,
  ConnectionMode,
  ConnectionLineType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  MousePointer, Hand, StickyNote, Square, Circle, Diamond, 
  Type, PenTool, Sparkles, Plus, Trash2, X, ChevronDown, 
  User, Image as ImageIcon, Check, RefreshCw, Palette,
  ArrowRight, Undo, Layers, Move, ZoomIn, ZoomOut
} from 'lucide-react'
import { LoreEntity, CanvasStroke } from '@shared/types'

// ==========================================
// REUSABLE SCALING & MANAGEMENT TOOLBAR
// ==========================================
const NodeScalingToolbar: React.FC<{
  scale?: number
  scalePercent?: number
  onScale: (factor: number, e: React.MouseEvent) => void
  onResetScale?: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  extraControls?: React.ReactNode
}> = ({ scale, scalePercent, onScale, onResetScale, onDelete, extraControls }) => {
  const displayPercent = scalePercent !== undefined ? scalePercent : Math.round((scale || 1) * 100)
  return (
    <div 
      className="absolute -top-11 left-0 flex items-center gap-1.5 bg-oros-900 border border-oros-700 rounded-lg px-2 py-1 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-100 nodrag nopan select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => onScale(0.85, e)}
        className="p-1 rounded hover:bg-oros-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        title="Scale Down (-15%)"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      
      <span 
        onClick={onResetScale}
        title="Click to reset to 100%"
        className="text-[10px] font-mono text-gold-400 min-w-8 text-center cursor-pointer hover:underline"
      >
        {displayPercent}%
      </span>

      <button
        onClick={(e) => onScale(1.15, e)}
        className="p-1 rounded hover:bg-oros-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        title="Scale Up (+15%)"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      {extraControls}

      <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />

      <button
        onClick={onDelete}
        className="p-1 rounded hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
        title="Delete Node (Del / Backspace)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ==========================================
// CUSTOM NODES (Fully Responsive Dimension Scaling)
// ==========================================
// CUSTOM NODES (Hardware-Accelerated Responsive Scaling)
// ==========================================

// 1. Draggable Character / Lore Card Node
const BASE_CARD_WIDTH = 180
const BASE_CARD_HEIGHT = 250

const CanvasCardNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const [imgError, setImgError] = useState(false)
  const cardData = data as { 
    entityId?: string; 
    title?: string; 
    subtitle?: string; 
    avatar?: string;
    width?: number;
    height?: number;
  }
  const reactFlow = useReactFlow()
  
  const currentW = Math.round(Number(cardData.width) || BASE_CARD_WIDTH)
  const currentH = Math.round(Number(cardData.height) || BASE_CARD_HEIGHT)
  const scalePercent = Math.round((currentW / BASE_CARD_WIDTH) * 100)

  const handleScale = (factor: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextW = Math.round(Math.max(100, Math.min(600, currentW * factor)))
    const nextH = Math.round(Math.max(140, Math.min(840, currentH * factor)))
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: nextW, height: nextH },
              data: { ...n.data, width: nextW, height: nextH }
            }
          : n
      )
    )
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: BASE_CARD_WIDTH, height: BASE_CARD_HEIGHT },
              data: { ...n.data, width: BASE_CARD_WIDTH, height: BASE_CARD_HEIGHT }
            }
          : n
      )
    )
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) => nds.filter((n) => n.id !== id))
  }

  const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'

  return (
    <div className="relative select-none w-full h-full">
      <NodeResizer
        isVisible={selected}
        minWidth={110}
        minHeight={150}
        onResizeEnd={(_, { x, y, width, height }) => {
          reactFlow.setNodes((nds) =>
            nds.map((n) =>
              n.id === id
                ? {
                    ...n,
                    position: { x: Math.round(x), y: Math.round(y) },
                    style: { ...n.style, width: Math.round(width), height: Math.round(height) },
                    data: { ...n.data, width: Math.round(width), height: Math.round(height) }
                  }
                : n
            )
          )
        }}
        handleClassName="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !rounded-full shadow-md"
        lineClassName="!border-gold-400/60"
      />

      {selected && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
        />
      )}

      <div className={`relative w-full h-full flex flex-col rounded-2xl bg-oros-950/95 border transition-colors duration-150 shadow-2xl select-none group cursor-move ${
        selected ? 'border-gold-400 ring-2 ring-gold-400/40' : 'border-oros-800/80 hover:border-oros-700'
      }`}>
        {/* 4 Cardinal Handles - only visible on hover */}
        <Handle type="source" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-top-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        <Handle type="source" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

        {/* Card Portrait Banner (flex-1 fills available space cleanly) */}
        <div className="flex-1 w-full min-h-0 bg-oros-900 relative overflow-hidden rounded-t-2xl">
          <img
            src={imgError ? fallbackAvatar : (cardData.avatar || fallbackAvatar)}
            alt={cardData.title || 'Card'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-oros-950 via-transparent to-transparent opacity-80 pointer-events-none" />
        </div>

        {/* Card Info Footer */}
        <div className="p-3 bg-oros-950/95 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-gold-400 font-semibold uppercase tracking-wider mb-0.5">
            <User className="w-3 h-3 text-gold-400 shrink-0" />
            <span className="truncate">{cardData.subtitle || 'Character'}</span>
          </div>
          <div className="font-serif font-bold text-sm text-slate-100 truncate">
            {cardData.title || 'Untitled Card'}
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. Lined Sticky Note Node
const BASE_NOTE_WIDTH = 250
const BASE_NOTE_HEIGHT = 200

const StickyNoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const noteData = data as { 
    title?: string; 
    content?: string; 
    width?: number; 
    height?: number; 
  }
  const [title, setTitle] = useState(noteData.title || 'Title')
  const [content, setContent] = useState(noteData.content || 'Write something...')
  const reactFlow = useReactFlow()

  const currentW = Math.round(Number(noteData.width) || BASE_NOTE_WIDTH)
  const currentH = Math.round(Number(noteData.height) || BASE_NOTE_HEIGHT)
  const scalePercent = Math.round((currentW / BASE_NOTE_WIDTH) * 100)

  const handleScale = (factor: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextW = Math.round(Math.max(140, Math.min(700, currentW * factor)))
    const nextH = Math.round(Math.max(110, Math.min(560, currentH * factor)))
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: nextW, height: nextH },
              data: { ...n.data, width: nextW, height: nextH }
            }
          : n
      )
    )
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: BASE_NOTE_WIDTH, height: BASE_NOTE_HEIGHT },
              data: { ...n.data, width: BASE_NOTE_WIDTH, height: BASE_NOTE_HEIGHT }
            }
          : n
      )
    )
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) => nds.filter((n) => n.id !== id))
  }

  return (
    <div className="relative select-none w-full h-full">
      <NodeResizer
        isVisible={selected}
        minWidth={140}
        minHeight={110}
        onResizeEnd={(_, { x, y, width, height }) => {
          reactFlow.setNodes((nds) =>
            nds.map((n) =>
              n.id === id
                ? {
                    ...n,
                    position: { x: Math.round(x), y: Math.round(y) },
                    style: { ...n.style, width: Math.round(width), height: Math.round(height) },
                    data: { ...n.data, width: Math.round(width), height: Math.round(height) }
                  }
                : n
            )
          )
        }}
        handleClassName="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white !rounded-full shadow-md"
        lineClassName="!border-amber-400/60"
      />

      {selected && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
        />
      )}

      <div className={`relative w-full h-full flex flex-col rounded-xl bg-[#fefae0] text-amber-950 border border-amber-300/80 shadow-2xl transition-colors duration-150 p-3 select-none cursor-move group ${
        selected ? 'ring-2 ring-amber-500 shadow-amber-900/40' : 'hover:shadow-xl'
      }`}>
        {/* 4 Cardinal Handles - only visible on hover */}
        <Handle type="source" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white !-top-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white !-bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        <Handle type="source" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white !-left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-white !-right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

        {/* Notepad Pin & Title */}
        <div className="shrink-0 border-b border-amber-300/80 pb-1.5 mb-2 flex items-center justify-between">
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
        <div className="flex-1 w-full min-h-0 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something..."
            style={{
              lineHeight: '24px',
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #e9d8a6 24px)',
              backgroundAttachment: 'local'
            }}
            className="w-full h-full bg-transparent text-xs text-amber-900/90 placeholder-amber-700/50 outline-none resize-none cursor-text"
          />
        </div>
      </div>
    </div>
  )
}

// 3. Geometric Shape Node (Parallelogram, Diamond, Rectangle, Circle)
const BASE_SHAPE_WIDTH = 160
const BASE_SHAPE_HEIGHT = 120

const ShapeNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const shapeData = data as { 
    shapeType?: 'parallelogram' | 'diamond' | 'rectangle' | 'circle'; 
    color?: string; 
    text?: string;
    width?: number;
    height?: number;
  }
  const [text, setText] = useState(shapeData.text || '')
  const type = shapeData.shapeType || 'parallelogram'
  const reactFlow = useReactFlow()
  const [color, setColor] = useState(shapeData.color || '#ffffff')

  const currentW = Math.round(Number(shapeData.width) || BASE_SHAPE_WIDTH)
  const currentH = Math.round(Number(shapeData.height) || BASE_SHAPE_HEIGHT)
  const scalePercent = Math.round((currentW / BASE_SHAPE_WIDTH) * 100)

  const handleScale = (factor: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextW = Math.round(Math.max(60, Math.min(600, currentW * factor)))
    const nextH = Math.round(Math.max(45, Math.min(450, currentH * factor)))
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: nextW, height: nextH },
              data: { ...n.data, width: nextW, height: nextH }
            }
          : n
      )
    )
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: BASE_SHAPE_WIDTH, height: BASE_SHAPE_HEIGHT },
              data: { ...n.data, width: BASE_SHAPE_WIDTH, height: BASE_SHAPE_HEIGHT }
            }
          : n
      )
    )
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) => nds.filter((n) => n.id !== id))
  }

  const handleColorCycle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const palette = ['#ffffff', '#f5c542', '#38bdf8', '#f43f5e', '#34d399']
    const next = palette[(palette.indexOf(color) + 1) % palette.length]
    setColor(next)
    reactFlow.setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, color: next } } : n))
    )
  }

  return (
    <div className="relative select-none w-full h-full">
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={45}
        onResizeEnd={(_, { x, y, width, height }) => {
          reactFlow.setNodes((nds) =>
            nds.map((n) =>
              n.id === id
                ? {
                    ...n,
                    position: { x: Math.round(x), y: Math.round(y) },
                    style: { ...n.style, width: Math.round(width), height: Math.round(height) },
                    data: { ...n.data, width: Math.round(width), height: Math.round(height) }
                  }
                : n
            )
          )
        }}
        handleClassName="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !rounded-full shadow-md"
        lineClassName="!border-gold-400/60"
      />

      {selected && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
          extraControls={
            <>
              <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />
              <button
                onClick={handleColorCycle}
                className="w-3.5 h-3.5 rounded-full border border-slate-400/80 shadow-sm cursor-pointer"
                style={{ backgroundColor: color }}
                title="Change color"
              />
            </>
          }
        />
      )}

      <div className={`relative w-full h-full select-none cursor-move flex items-center justify-center transition-colors duration-150 group ${
        selected ? 'ring-2 ring-gold-400 rounded-lg' : ''
      }`}>
        {/* Handles matching shape geometry, only visible on hover */}
        {type === 'parallelogram' ? (
          <>
            <Handle type="source" position={Position.Top} id="top" style={{ left: '60.7%' }} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ left: '39.3%' }} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Left} id="left" style={{ left: '14.3%', top: '50%' }} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Right} id="right" style={{ left: '85.7%', top: '50%' }} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          </>
        ) : type === 'diamond' ? (
          <>
            <Handle type="source" position={Position.Top} id="top" style={{ left: '50%', top: '5%' }} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ left: '50%', top: '95%' }} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Left} id="left" style={{ left: '5%', top: '50%' }} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Right} id="right" style={{ left: '95%', top: '50%' }} className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          </>
        ) : (
          <>
            <Handle type="source" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-top-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-left-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !-right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
          </>
        )}

        {type === 'parallelogram' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 140 100" preserveAspectRatio="none">
              <polygon 
                points="35,5 135,5 105,95 5,95" 
                fill={color} 
                stroke="#cbd5e1" 
                strokeWidth="1.5"
              />
            </svg>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Shape text..."
              className="absolute inset-0 bg-transparent text-center font-sans font-medium text-xs text-slate-800 outline-none px-6 cursor-text"
            />
          </div>
        )}

        {type === 'diamond' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon 
                points="50,5 95,50 50,95 5,50" 
                fill={color} 
                stroke="#cbd5e1" 
                strokeWidth="1.5"
              />
            </svg>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Shape text..."
              className="absolute inset-0 bg-transparent text-center font-sans font-medium text-xs text-slate-800 outline-none px-4 cursor-text"
            />
          </div>
        )}

        {type === 'rectangle' && (
          <div 
            style={{ backgroundColor: color }}
            className="w-full h-full rounded-xl border border-slate-300 shadow-xl flex items-center justify-center p-3"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Text..."
              className="w-full bg-transparent text-center font-sans font-medium text-xs text-slate-800 outline-none cursor-text"
            />
          </div>
        )}

        {type === 'circle' && (
          <div 
            style={{ backgroundColor: color }}
            className="w-full h-full rounded-full border border-slate-300 shadow-xl flex items-center justify-center p-3"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Text..."
              className="w-full bg-transparent text-center font-sans font-medium text-xs text-slate-800 outline-none cursor-text"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// 4. Freeform Canvas Text Node
const BASE_TEXT_WIDTH = 240
const BASE_TEXT_HEIGHT = 44

const CanvasTextNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const textData = data as { 
    text?: string; 
    width?: number; 
    height?: number; 
  }
  const [text, setText] = useState(textData.text || 'Write annotation...')
  const reactFlow = useReactFlow()

  const currentW = Math.round(Number(textData.width) || BASE_TEXT_WIDTH)
  const currentH = Math.round(Number(textData.height) || BASE_TEXT_HEIGHT)
  const scalePercent = Math.round((currentW / BASE_TEXT_WIDTH) * 100)

  const handleScale = (factor: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextW = Math.round(Math.max(100, Math.min(800, currentW * factor)))
    const nextH = Math.round(Math.max(30, Math.min(200, currentH * factor)))
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: nextW, height: nextH },
              data: { ...n.data, width: nextW, height: nextH }
            }
          : n
      )
    )
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: BASE_TEXT_WIDTH, height: BASE_TEXT_HEIGHT },
              data: { ...n.data, width: BASE_TEXT_WIDTH, height: BASE_TEXT_HEIGHT }
            }
          : n
      )
    )
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) => nds.filter((n) => n.id !== id))
  }

  return (
    <div className="relative select-none w-full h-full">
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={30}
        onResizeEnd={(_, { x, y, width, height }) => {
          reactFlow.setNodes((nds) =>
            nds.map((n) =>
              n.id === id
                ? {
                    ...n,
                    position: { x: Math.round(x), y: Math.round(y) },
                    style: { ...n.style, width: Math.round(width), height: Math.round(height) },
                    data: { ...n.data, width: Math.round(width), height: Math.round(height) }
                  }
                : n
            )
          )
        }}
        handleClassName="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !rounded-full shadow-md"
        lineClassName="!border-gold-400/60"
      />

      {selected && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
        />
      )}

      <div className={`relative w-full h-full px-3 py-1.5 rounded-lg select-none transition-colors duration-150 cursor-move flex items-center ${
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
          className="w-full bg-transparent font-serif text-slate-200 text-sm tracking-wide outline-none cursor-text"
        />
      </div>
    </div>
  )
}

// 5. FIRST-CLASS DRAGGABLE, SCALABLE, DELETABLE DRAWING NODE
const CanvasDrawingNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const drawingData = data as {
    path?: string;
    color?: string;
    width?: number;
    height?: number;
    initialWidth?: number;
    initialHeight?: number;
    strokeWidth?: number;
  }

  const reactFlow = useReactFlow()
  // Stroke coordinate frame is locked to initial stroke bounds so path scales with box
  const strokeBoxW = Math.max(20, Number(drawingData.initialWidth) || Number(drawingData.width) || 540)
  const strokeBoxH = Math.max(20, Number(drawingData.initialHeight) || Number(drawingData.height) || 420)
  const [color, setColor] = useState(drawingData.color || '#ffffff')

  const currentW = Math.round(Number(drawingData.width) || strokeBoxW)
  const currentH = Math.round(Number(drawingData.height) || strokeBoxH)
  const scalePercent = Math.round((currentW / strokeBoxW) * 100)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) => nds.filter((n) => n.id !== id))
  }

  const handleScale = (factor: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextW = Math.round(Math.max(40, Math.min(1200, currentW * factor)))
    const nextH = Math.round(Math.max(40, Math.min(1200, currentH * factor)))
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: nextW, height: nextH },
              data: { 
                ...n.data, 
                width: nextW, 
                height: nextH,
                initialWidth: strokeBoxW,
                initialHeight: strokeBoxH
              }
            }
          : n
      )
    )
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              style: { ...n.style, width: strokeBoxW, height: strokeBoxH },
              data: { 
                ...n.data, 
                width: strokeBoxW, 
                height: strokeBoxH,
                initialWidth: strokeBoxW,
                initialHeight: strokeBoxH
              }
            }
          : n
      )
    )
  }

  const handleColorChange = (e: React.MouseEvent) => {
    e.stopPropagation()
    const palette = ['#ffffff', '#f5c542', '#38bdf8', '#f43f5e', '#34d399']
    const next = palette[(palette.indexOf(color) + 1) % palette.length]
    setColor(next)
    reactFlow.setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, color: next } } : n))
    )
  }

  return (
    <div
      className={`relative select-none w-full h-full ${
        selected ? 'ring-2 ring-gold-400 ring-dashed rounded-xl bg-gold-400/5 cursor-move pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={40}
        minHeight={40}
        onResizeEnd={(_, { x, y, width, height }) => {
          reactFlow.setNodes((nds) =>
            nds.map((n) =>
              n.id === id
                ? {
                    ...n,
                    position: { x: Math.round(x), y: Math.round(y) },
                    style: { ...n.style, width: Math.round(width), height: Math.round(height) },
                    data: { 
                      ...n.data, 
                      width: Math.round(width), 
                      height: Math.round(height),
                      initialWidth: strokeBoxW,
                      initialHeight: strokeBoxH
                    }
                  }
                : n
            )
          )
        }}
        handleClassName="!w-2.5 !h-2.5 !bg-gold-400 !border-2 !border-oros-950 !rounded-full shadow-md pointer-events-auto"
        lineClassName="!border-gold-400/60 pointer-events-auto"
      />

      {/* 4 Handles - keep opacity-0 and pointer-events-none */}
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="target" position={Position.Left} className="!opacity-0 !w-2 !h-2 pointer-events-none" />
      <Handle type="source" position={Position.Right} className="!opacity-0 !w-2 !h-2 pointer-events-none" />

      {/* Floating Toolbar on Selection */}
      {selected && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
          extraControls={
            <>
              <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />
              <button
                onClick={handleColorChange}
                className="w-4 h-4 rounded-full border border-slate-400/80 shadow-sm cursor-pointer"
                style={{ backgroundColor: color }}
                title="Cycle stroke color"
              />
            </>
          }
        />
      )}

      {/* SVG Path - scales dynamically via viewBox and 100% width/height */}
      <svg
        style={{ width: '100%', height: '100%' }}
        viewBox={`0 0 ${strokeBoxW} ${strokeBoxH}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible pointer-events-none"
      >
        <path
          d={drawingData.path}
          stroke={color}
          strokeWidth={drawingData.strokeWidth || 3.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="pointer-events-auto cursor-pointer"
        />
      </svg>
    </div>
  )
}

const nodeTypes = {
  canvasCard: CanvasCardNode,
  stickyNote: StickyNoteNode,
  shape: ShapeNode,
  canvasText: CanvasTextNode,
  canvasDrawing: CanvasDrawingNode
}

// Helper to guarantee every node has valid dimensions on mount
const getDefaultDimensions = (type?: string, data?: any) => {
  switch (type) {
    case 'canvasCard': return { width: BASE_CARD_WIDTH, height: BASE_CARD_HEIGHT }
    case 'stickyNote': return { width: BASE_NOTE_WIDTH, height: BASE_NOTE_HEIGHT }
    case 'shape': return { width: BASE_SHAPE_WIDTH, height: BASE_SHAPE_HEIGHT }
    case 'canvasText': return { width: BASE_TEXT_WIDTH, height: BASE_TEXT_HEIGHT }
    case 'canvasDrawing': return { 
      width: Math.max(40, Number(data?.initialWidth) || Number(data?.width) || 540), 
      height: Math.max(40, Number(data?.initialHeight) || Number(data?.height) || 420) 
    }
    default: return { width: 200, height: 150 }
  }
}

export const ensureNodeDimensions = (nodeList: Node[] = []): Node[] => {
  return nodeList.map((n) => {
    const defaults = getDefaultDimensions(n.type, n.data)
    const w = n.style?.width ?? n.data?.width ?? defaults.width
    const h = n.style?.height ?? n.data?.height ?? defaults.height
    const numW = typeof w === 'number' ? w : parseInt(String(w)) || defaults.width
    const numH = typeof h === 'number' ? h : parseInt(String(h)) || defaults.height

    const isDrawing = n.type === 'canvasDrawing'
    const initialW = isDrawing ? (n.data?.initialWidth || n.data?.width || numW) : undefined
    const initialH = isDrawing ? (n.data?.initialHeight || n.data?.height || numH) : undefined

    return {
      ...n,
      style: {
        ...n.style,
        width: numW,
        height: numH
      },
      data: {
        ...n.data,
        width: numW,
        height: numH,
        ...(isDrawing ? { initialWidth: initialW, initialHeight: initialH } : {})
      }
    }
  })
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
    entities
  } = useWorldStore()

  const { addToast } = useToastStore()
  const reactFlowInstance = useReactFlow()

  const worldId = activeWorldId || 'world-aethelgard'
  const worldCanvases = canvases[worldId] || []
  const currentCanvasId = canvasId || selectedCanvasId || worldCanvases[0]?.id || 'canvas-main'
  const currentCanvas = worldCanvases.find((c) => c.id === currentCanvasId) || worldCanvases[0]

  // Flow nodes and edges state initialized with validated dimensions
  const [nodes, setNodes, onNodesChange] = useNodesState(ensureNodeDimensions(currentCanvas?.nodes || []))
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentCanvas?.edges || [])

  // Sync when canvas changes
  useEffect(() => {
    if (currentCanvas) {
      setNodes(ensureNodeDimensions(currentCanvas.nodes || []))
      setEdges(currentCanvas.edges || [])
    }
  }, [currentCanvas?.id])

  // Active Tool state: 'select' | 'pan' | 'pen' | 'text'
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

  // Node change debounce timer
  const nodeChangeTimerRef = useRef<any>(null)

  // Save changes to store with trailing debounce to avoid dragging lag
  const handleNodesChangeWrapped = useCallback((changes: any) => {
    onNodesChange(changes)
    if (nodeChangeTimerRef.current) {
      clearTimeout(nodeChangeTimerRef.current)
    }
    nodeChangeTimerRef.current = setTimeout(() => {
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, reactFlowInstance.getNodes(), edges)
      }
    }, 250)
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
      position: { x: center.x - 125, y: center.y - 100 },
      style: { width: 250, height: 200 },
      data: { title: 'Title', content: 'Write something...', width: 250, height: 200 }
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
      position: { x: center.x - 80, y: center.y - 60 },
      style: { width: 160, height: 120 },
      data: { shapeType, color: '#ffffff', text: '', width: 160, height: 120 }
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
      position: { x: center.x - 120, y: center.y - 22 },
      style: { width: 240, height: 44 },
      data: { text: 'Double click to edit annotation...', width: 240, height: 44 }
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
      position: { x: center.x - 90, y: center.y - 125 },
      style: { width: 180, height: 250 },
      data: {
        entityId: entity.id,
        title: entity.title,
        subtitle: entity.type.toUpperCase(),
        avatar: entity.avatar,
        width: 180,
        height: 250
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

  const pointsToSvgPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ''
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`
    }
    return d
  }

  const handlePointerUp = () => {
    if (!isDrawing || activeTool !== 'pen') return
    setIsDrawing(false)

    if (currentStroke.length > 2) {
      // Calculate bounding box
      const xs = currentStroke.map((p) => p.x)
      const ys = currentStroke.map((p) => p.y)
      const minX = Math.min(...xs) - 10
      const minY = Math.min(...ys) - 10
      const maxX = Math.max(...xs) + 10
      const maxY = Math.max(...ys) + 10
      const width = Math.max(maxX - minX, 40)
      const height = Math.max(maxY - minY, 40)

      // Normalize points to local coordinates inside the node
      const normalized = currentStroke.map((p) => ({
        x: p.x - minX,
        y: p.y - minY
      }))

      const pathStr = pointsToSvgPath(normalized)

      const newNode: Node = {
        id: `draw-${Date.now()}`,
        type: 'canvasDrawing',
        position: { x: minX, y: minY },
        style: { width, height },
        data: {
          path: pathStr,
          color: penColor,
          width,
          height,
          initialWidth: width,
          initialHeight: height,
          strokeWidth: 3.5
        }
      }

      setNodes((nds) => {
        const updated = [...nds, newNode]
        if (currentCanvas) {
          saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
        }
        return updated
      })

      // Automatically switch back to select mode so drawing can be moved, scaled, and deleted!
      setActiveTool('select')
      addToast('Drawing created. Drag to move, or click to scale and delete.', 'info')
    }

    setCurrentStroke([])
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
        deleteKeyCode={['Backspace', 'Delete']}
        panOnDrag={activeTool === 'pan' || activeTool === 'select'}
        selectionOnDrag={activeTool === 'select'}
        zoomOnScroll={true}
        minZoom={0.2}
        maxZoom={2.5}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#f5c542', strokeWidth: 2 }}
        className={activeTool === 'pen' ? 'cursor-crosshair' : activeTool === 'pan' ? 'cursor-grab' : 'cursor-default'}
      >
        {/* Subtle dot grid like VVD */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={28} 
          size={1.2} 
          color="rgba(255, 255, 255, 0.14)" 
        />

        {/* Live Active Stroke Preview during Pen Drawing */}
        {isDrawing && currentStroke.length > 1 && (
          <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-30">
            <g transform={`translate(${reactFlowInstance.getViewport().x}, ${reactFlowInstance.getViewport().y}) scale(${reactFlowInstance.getViewport().zoom})`}>
              <path
                d={pointsToSvgPath(currentStroke)}
                stroke={penColor}
                strokeWidth={3.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        )}
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
