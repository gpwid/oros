import React, { useState, useRef, useCallback, useEffect, useMemo, useContext } from 'react'
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
  ConnectionLineType,
  BaseEdge,
  EdgeProps,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  SelectionMode
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { useSettingsStore, getEffectiveColorMode } from '../../store/useSettingsStore'
import { useActiveThemeTokens } from '../../utils/useActiveThemeTokens'
import { 
  MousePointer, Hand, StickyNote, Square, Circle, Diamond, 
  Type, PenTool, Sparkles, Plus, Trash2, X, ChevronDown, 
  User, Image as ImageIcon, Check, RefreshCw, Palette,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Undo, Redo, RotateCcw, RotateCw, Layers, Move, ZoomIn, ZoomOut,
  Magnet, GitBranch, ArrowRightLeft, Spline, Activity, Frame, Link2, Edit3,
  Bold, Italic, Minus, CornerDownRight, AlignLeft, AlignCenter, AlignRight,
  Triangle, Star, Hexagon, Octagon, Cylinder, Cloud, MessageSquare,
  Copy, Eye, ExternalLink
} from 'lucide-react'
import { LoreEntity, CanvasStroke } from '@shared/types'
import { OrosLogoMark } from '../common/OrosLogo'
import { getCategoryMeta, getCategoryIconComponent } from '../../utils/categoryIcons'
import { QuickPeekCard } from '../common/QuickPeekCard'
import { ExportDropdown, ExportOption } from '../common/ExportDropdown'
import { exportReactFlowToImage, exportCanvasToJson } from '../../utils/exportUtils'

import { calculateSmartSnap, type SnapGuideLine, type SnapNodeBox } from '../../utils/snapEngine'
export { calculateSmartSnap, type SnapGuideLine, type SnapNodeBox }

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
      className="absolute -top-11 left-0 flex items-center gap-1 bg-oros-900/95 backdrop-blur-md border border-oros-750 rounded-full px-2 py-1 shadow-2xl z-30 animate-dropdown-in nodrag nopan select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => onScale(0.85, e)}
        className="p-1 rounded-full hover:bg-oros-850 text-oros-400 hover:text-oros-100 transition-colors cursor-pointer"
        title="Zoom out"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      
      <span 
        onClick={onResetScale}
        title="Reset"
        className="text-[10px] font-mono text-accent min-w-8 text-center cursor-pointer hover:underline"
      >
        {displayPercent}%
      </span>

      <button
        type="button"
        onClick={(e) => onScale(1.15, e)}
        className="p-1 rounded-full hover:bg-oros-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        title="Zoom in"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      {extraControls}

      <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />

      <button
        type="button"
        onClick={onDelete}
        className="p-1 rounded-full hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
        title="Delete"
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

export const CanvasPeekContext = React.createContext<{
  openPeek: (id: string) => void
}>({ openPeek: () => {} })

export interface CanvasQuickConnectContextType {
  quickConnect: (sourceNodeId: string, direction: 'top' | 'bottom' | 'left' | 'right') => void
}

export const CanvasQuickConnectContext = React.createContext<CanvasQuickConnectContextType | null>(null)

interface CardinalHandleItemProps {
  nodeId: string
  dir: 'top' | 'bottom' | 'left' | 'right'
  position: Position
  isConnectable?: boolean
}

const CardinalHandleItem: React.FC<CardinalHandleItemProps> = ({
  nodeId,
  dir,
  position,
  isConnectable = true
}) => {
  const quickConnectContext = useContext(CanvasQuickConnectContext)
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTriggerRef = useRef<number>(0)
  const [isHovered, setIsHovered] = useState(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return
    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y
    const dist = Math.hypot(dx, dy)
    const dt = Date.now() - pointerStartRef.current.time
    pointerStartRef.current = null

    if (dist < 6 && dt < 450) {
      const now = Date.now()
      if (now - lastTriggerRef.current > 300) {
        lastTriggerRef.current = now
        e.stopPropagation()
        setIsHovered(false)
        quickConnectContext?.quickConnect(nodeId, dir)
      }
    }
  }

  return (
    <div className="contents">
      {/* Target Handle: enables dropping incoming edges with exact cardinal ID */}
      <Handle
        type="target"
        position={position}
        id={dir}
        isConnectable={isConnectable}
        className="!w-5 !h-5 !opacity-0 !border-none !bg-transparent pointer-events-auto"
      />

      {/* Source Handle: prominent circular port with hover expansion, clear white arrow icon, and click-to-connect */}
      <Handle
        type="source"
        position={position}
        id={dir}
        isConnectable={isConnectable}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Drag to connect arrow, or click to spawn connected element"
        className={`!rounded-full transition-all duration-150 cursor-crosshair flex items-center justify-center overflow-visible z-30 ${
          isHovered
            ? '!w-6 !h-6 !bg-accent !text-white !border-2 !border-white !shadow-2xl !ring-4 !ring-accent/40 opacity-100'
            : '!w-3 !h-3 !bg-accent !border-2 !border-oros-950 !shadow-md opacity-0 group-hover:opacity-100'
        }`}
      >
        {isHovered && (
          <div className="text-white pointer-events-none flex items-center justify-center">
            {dir === 'top' && <ArrowUp className="w-3.5 h-3.5 stroke-[3] text-white" />}
            {dir === 'bottom' && <ArrowDown className="w-3.5 h-3.5 stroke-[3] text-white" />}
            {dir === 'left' && <ArrowLeft className="w-3.5 h-3.5 stroke-[3] text-white" />}
            {dir === 'right' && <ArrowRight className="w-3.5 h-3.5 stroke-[3] text-white" />}
          </div>
        )}
      </Handle>

      {/* Faint preview overlay showing what will be created on click */}
      {isHovered && (
        <div className="contents pointer-events-none">
          {dir === 'right' && (
            <>
              <div className="absolute left-full top-1/2 -translate-y-1/2 w-[90px] border-t-2 border-dashed border-accent/80 z-20 flex items-center justify-end pointer-events-none">
                <ArrowRight className="w-3.5 h-3.5 text-accent translate-x-1" />
              </div>
              <div className="absolute left-[calc(100%+90px)] top-0 w-full h-full rounded-[4px] border-2 border-dashed border-accent/70 bg-accent/15 backdrop-blur-[1px] shadow-xl z-20 pointer-events-none flex flex-col items-center justify-center gap-1.5 p-3 text-center animate-fadeIn">
                <Plus className="w-5 h-5 text-accent/90" />
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-accent/90">Click to place</span>
              </div>
            </>
          )}
          {dir === 'left' && (
            <>
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-[90px] border-t-2 border-dashed border-accent/80 z-20 flex items-center justify-start pointer-events-none">
                <ArrowLeft className="w-3.5 h-3.5 text-accent -translate-x-1" />
              </div>
              <div className="absolute right-[calc(100%+90px)] top-0 w-full h-full rounded-[4px] border-2 border-dashed border-accent/70 bg-accent/15 backdrop-blur-[1px] shadow-xl z-20 pointer-events-none flex flex-col items-center justify-center gap-1.5 p-3 text-center animate-fadeIn">
                <Plus className="w-5 h-5 text-accent/90" />
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-accent/90">Click to place</span>
              </div>
            </>
          )}
          {dir === 'bottom' && (
            <>
              <div className="absolute top-full left-1/2 -translate-x-1/2 h-[90px] border-l-2 border-dashed border-accent/80 z-20 flex items-end justify-center pointer-events-none">
                <ArrowDown className="w-3.5 h-3.5 text-accent translate-y-1" />
              </div>
              <div className="absolute top-[calc(100%+90px)] left-0 w-full h-full rounded-[4px] border-2 border-dashed border-accent/70 bg-accent/15 backdrop-blur-[1px] shadow-xl z-20 pointer-events-none flex flex-col items-center justify-center gap-1.5 p-3 text-center animate-fadeIn">
                <Plus className="w-5 h-5 text-accent/90" />
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-accent/90">Click to place</span>
              </div>
            </>
          )}
          {dir === 'top' && (
            <>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 h-[90px] border-l-2 border-dashed border-accent/80 z-20 flex items-start justify-center pointer-events-none">
                <ArrowUp className="w-3.5 h-3.5 text-accent -translate-y-1" />
              </div>
              <div className="absolute bottom-[calc(100%+90px)] left-0 w-full h-full rounded-[4px] border-2 border-dashed border-accent/70 bg-accent/15 backdrop-blur-[1px] shadow-xl z-20 pointer-events-none flex flex-col items-center justify-center gap-1.5 p-3 text-center animate-fadeIn">
                <Plus className="w-5 h-5 text-accent/90" />
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-accent/90">Click to place</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export const CanvasCardinalHandles: React.FC<{ nodeId: string; isConnectable?: boolean }> = ({
  nodeId,
  isConnectable = true
}) => {
  return (
    <>
      <CardinalHandleItem
        nodeId={nodeId}
        dir="top"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <CardinalHandleItem
        nodeId={nodeId}
        dir="bottom"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
      <CardinalHandleItem
        nodeId={nodeId}
        dir="left"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <CardinalHandleItem
        nodeId={nodeId}
        dir="right"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  )
}

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
  const { openPeek } = useContext(CanvasPeekContext)
  const { entities, categories, activeWorldId, openTab } = useWorldStore()
  const selectedCount = reactFlow.getNodes().filter((n) => n.selected).length
  
  const worldEntities = (activeWorldId && entities[activeWorldId]) || []
  const entity = cardData.entityId ? worldEntities.find((e) => e.id === cardData.entityId) : undefined
  const worldCats = (activeWorldId && categories[activeWorldId]) ? categories[activeWorldId] : undefined
  const catMeta = getCategoryMeta(entity?.type || cardData.subtitle || 'character', worldCats)
  const CategoryIcon = getCategoryIconComponent(catMeta.icon)
  const cardTitle = entity?.title || cardData.title || 'Untitled Card'
  const cardAvatar = entity?.avatar || cardData.avatar

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

  const hasAvatar = !!cardAvatar && !imgError

  return (
    <div className="relative select-none w-full h-full">
      <NodeResizer
        isVisible={selected && selectedCount <= 1}
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
        handleClassName="!w-3.5 !h-3.5 !bg-accent !border-2 !border-oros-950 !rounded-none shadow-md hover:scale-110 transition-transform"
        lineClassName="!border-accent/70 !border-dashed"
      />

      {selected && selectedCount <= 1 && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
          extraControls={cardData.entityId ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (cardData.entityId) openPeek(cardData.entityId)
                }}
                className="p-1 rounded-full hover:bg-oros-800 text-oros-300 hover:text-accent transition-colors cursor-pointer"
                title="Quick Peek"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (entity) {
                    openTab({ title: entity.title, type: 'wiki', targetId: entity.id })
                  }
                }}
                className="p-1 rounded-full hover:bg-oros-800 text-oros-300 hover:text-accent transition-colors cursor-pointer"
                title="Open in Codex"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          ) : undefined}
        />
      )}

      <div 
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (cardData.entityId) {
            openPeek(cardData.entityId)
          }
        }}
        className={`relative w-full h-full flex flex-col rounded-[4px] bg-oros-950/95 border transition-colors duration-150 shadow-md select-none group cursor-move ${
          selected ? 'border-accent ring-2 ring-accent/40' : 'border-oros-800/80 hover:border-oros-700'
        }`}
      >
        {/* Cardinal Handles: circles with arrow on hover and click-to-connect */}
        <CanvasCardinalHandles nodeId={id} />

        {/* Card Portrait Banner (flex-1 fills available space cleanly) */}
        <div className="flex-1 w-full min-h-0 bg-oros-900 relative overflow-hidden rounded-t-[4px]">
          {hasAvatar ? (
            <>
              <img
                src={cardAvatar}
                alt={cardTitle}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-oros-950 via-transparent to-transparent opacity-80 pointer-events-none" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-oros-900/90 via-oros-950 to-oros-900/40 flex flex-col items-center justify-center p-3 text-center border-b border-oros-800/40 relative group/empty">
              <div className="w-14 h-14 rounded-2xl bg-oros-850/60 border border-oros-750/70 flex items-center justify-center shadow-inner group-hover/empty:scale-105 group-hover/empty:border-accent/60 transition-all duration-200">
                <OrosLogoMark className="w-9 h-9 text-oros-600/70 group-hover/empty:text-accent/80 transition-colors" />
              </div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-oros-500 mt-2 font-medium">No Portrait</span>
            </div>
          )}
        </div>

        {/* Card Info Footer */}
        <div className="p-3 bg-oros-950/95 shrink-0">
          <div 
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-0.5 truncate"
            style={{ color: catMeta.color }}
          >
            <CategoryIcon className="w-3 h-3 shrink-0" style={{ color: catMeta.color }} />
            <span className="truncate">{catMeta.name}</span>
          </div>
          <div className="font-serif font-bold text-sm text-slate-100 truncate" title={cardTitle}>
            {cardTitle}
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. Lined Sticky Note Node
const BASE_NOTE_WIDTH = 250
const BASE_NOTE_HEIGHT = 200

const NOTE_THEMES: Record<string, { bg: string; border: string; text: string; line: string; pin: string; placeholder: string }> = {
  yellow: {
    bg: '#fefae0',
    border: 'border-amber-300/80',
    text: 'text-amber-950',
    line: '#e9d8a6',
    pin: 'bg-amber-400',
    placeholder: 'placeholder-amber-700/50'
  },
  amber: {
    bg: '#fef3c7',
    border: 'border-amber-400/80',
    text: 'text-amber-950',
    line: '#fde68a',
    pin: 'bg-amber-500',
    placeholder: 'placeholder-amber-700/50'
  },
  blue: {
    bg: '#e0f2fe',
    border: 'border-sky-300/80',
    text: 'text-sky-950',
    line: '#bae6fd',
    pin: 'bg-sky-400',
    placeholder: 'placeholder-sky-700/50'
  },
  green: {
    bg: '#dcfce7',
    border: 'border-emerald-300/80',
    text: 'text-emerald-950',
    line: '#bbf7d0',
    pin: 'bg-emerald-400',
    placeholder: 'placeholder-emerald-700/50'
  },
  rose: {
    bg: '#ffe4e6',
    border: 'border-rose-300/80',
    text: 'text-rose-950',
    line: '#fecdd3',
    pin: 'bg-rose-400',
    placeholder: 'placeholder-rose-700/50'
  },
  purple: {
    bg: '#f3e8ff',
    border: 'border-purple-300/80',
    text: 'text-purple-950',
    line: '#e9d5ff',
    pin: 'bg-purple-400',
    placeholder: 'placeholder-purple-700/50'
  },
  dark: {
    bg: '#1e293b',
    border: 'border-slate-600/80',
    text: 'text-slate-100',
    line: '#334155',
    pin: 'bg-slate-400',
    placeholder: 'placeholder-slate-400/50'
  },
  midnight: {
    bg: '#0f172a',
    border: 'border-oros-700/80',
    text: 'text-oros-100',
    line: '#1e293b',
    pin: 'bg-accent',
    placeholder: 'placeholder-oros-500/50'
  }
}

const StickyNoteNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const noteData = data as { 
    title?: string; 
    content?: string; 
    width?: number; 
    height?: number; 
    colorTheme?: string;
    fontFamily?: 'serif' | 'sans' | 'mono';
    fontSize?: 'sm' | 'base' | 'lg';
    isBold?: boolean;
    isItalic?: boolean;
  }
  const [title, setTitle] = useState(noteData.title || 'Title')
  const [content, setContent] = useState(noteData.content || 'Write something...')
  const [colorTheme, setColorTheme] = useState(noteData.colorTheme || 'yellow')
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>(noteData.fontFamily || 'serif')
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>(noteData.fontSize || 'base')
  const [isBold, setIsBold] = useState(Boolean(noteData.isBold))
  const [isItalic, setIsItalic] = useState(Boolean(noteData.isItalic))
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [focusTarget, setFocusTarget] = useState<'title' | 'body'>('body')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reactFlow = useReactFlow()
  const selectedCount = reactFlow.getNodes().filter((n) => n.selected).length

  const curTheme = NOTE_THEMES[colorTheme] || NOTE_THEMES.yellow
  const fontFamilyClass = fontFamily === 'sans' ? 'font-sans' : fontFamily === 'mono' ? 'font-mono' : 'font-serif'
  const fontSizeClass = fontSize === 'sm' ? 'text-[11px]' : fontSize === 'lg' ? 'text-sm' : 'text-xs'
  const lineH = fontSize === 'sm' ? '20px' : fontSize === 'lg' ? '28px' : '24px'
  const gapH = fontSize === 'sm' ? 19 : fontSize === 'lg' ? 27 : 23
  const weightClass = isBold ? 'font-bold' : 'font-normal'
  const styleClass = isItalic ? 'italic' : 'not-italic'

  useEffect(() => {
    if (noteData.title !== undefined) setTitle(noteData.title)
  }, [noteData.title])

  useEffect(() => {
    if (noteData.content !== undefined) setContent(noteData.content)
  }, [noteData.content])

  useEffect(() => {
    if (noteData.colorTheme !== undefined) setColorTheme(noteData.colorTheme)
  }, [noteData.colorTheme])

  useEffect(() => {
    if (isEditing) {
      if (focusTarget === 'title') {
        titleInputRef.current?.focus()
        titleInputRef.current?.select()
      } else {
        textareaRef.current?.focus()
      }
    }
  }, [isEditing, focusTarget])

  const updateNoteData = useCallback((updates: Record<string, any>) => {
    reactFlow.setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                ...updates
              }
            }
          : n
      )
    )
  }, [id, reactFlow])

  const finishEditing = useCallback(() => {
    setIsEditing(false)
    updateNoteData({ title, content })
  }, [title, content, updateNoteData])

  useEffect(() => {
    if (!selected && isEditing) {
      finishEditing()
    }
  }, [selected, isEditing, finishEditing])

  const handleContainerBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as globalThis.Node)) {
      finishEditing()
    }
  }

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
        isVisible={selected && selectedCount <= 1}
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
        handleClassName="!w-3.5 !h-3.5 !bg-accent !border-2 !border-oros-950 !rounded-none shadow-md hover:scale-110 transition-transform"
        lineClassName="!border-accent/70 !border-dashed"
      />

      {selected && selectedCount <= 1 && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
          extraControls={
            <>
              <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />
              {/* Color Swatch Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowColorPicker(!showColorPicker)
                  }}
                  title="Color"
                  className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: curTheme.bg }}
                />
                {showColorPicker && (
                  <div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-full bg-oros-900 border border-oros-700 shadow-2xl z-40"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.entries(NOTE_THEMES).map(([k, th]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setColorTheme(k)
                          updateNoteData({ colorTheme: k })
                          setShowColorPicker(false)
                        }}
                        className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 ${
                          colorTheme === k ? 'ring-2 ring-white border-white scale-110' : 'border-oros-700'
                        }`}
                        style={{ backgroundColor: th.bg }}
                        title={k}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Font Family Cycle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const fonts: ('serif' | 'sans' | 'mono')[] = ['serif', 'sans', 'mono']
                  const nextFont = fonts[(fonts.indexOf(fontFamily) + 1) % fonts.length]
                  setFontFamily(nextFont)
                  updateNoteData({ fontFamily: nextFont })
                }}
                title="Font"
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-oros-800 text-oros-300 hover:text-white transition-colors text-[10px] font-bold cursor-pointer"
              >
                {fontFamily === 'serif' ? 'S' : fontFamily === 'mono' ? 'M' : 'A'}
              </button>

              {/* Font Size Cycle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const sizes: ('sm' | 'base' | 'lg')[] = ['sm', 'base', 'lg']
                  const nextSize = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length]
                  setFontSize(nextSize)
                  updateNoteData({ fontSize: nextSize })
                }}
                title="Size"
                className="p-1 rounded hover:bg-oros-800 text-oros-300 hover:text-white transition-colors cursor-pointer"
              >
                <Type className="w-3 h-3" />
              </button>

              {/* Bold */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const next = !isBold
                  setIsBold(next)
                  updateNoteData({ isBold: next })
                }}
                title="Bold"
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isBold ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-oros-800 text-oros-400 hover:text-white'
                }`}
              >
                <Bold className="w-3 h-3" />
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const next = !isItalic
                  setIsItalic(next)
                  updateNoteData({ isItalic: next })
                }}
                title="Italic"
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isItalic ? 'bg-accent/20 text-accent italic' : 'hover:bg-oros-800 text-oros-400 hover:text-white'
                }`}
              >
                <Italic className="w-3 h-3" />
              </button>

              <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />

              {/* Edit Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (isEditing) {
                    finishEditing()
                  } else {
                    setFocusTarget('body')
                    setIsEditing(true)
                  }
                }}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isEditing
                    ? 'bg-accent/20 text-accent'
                    : 'hover:bg-oros-850 text-oros-400 hover:text-oros-100'
                }`}
                title={isEditing ? 'Done' : 'Edit'}
              >
                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              </button>
            </>
          }
        />
      )}

      <div
        ref={containerRef}
        onBlur={handleContainerBlur}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setFocusTarget('body')
          setIsEditing(true)
        }}
        style={{ backgroundColor: curTheme.bg }}
        className={`relative w-full h-full flex flex-col rounded-xl border ${curTheme.border} ${curTheme.text} shadow-2xl transition-all duration-150 p-3 select-none group ${
          isEditing
            ? 'ring-2 ring-accent shadow-accent/40 cursor-default'
            : selected
            ? 'ring-2 ring-accent shadow-accent/40 cursor-grab active:cursor-grabbing'
            : 'hover:shadow-xl cursor-grab active:cursor-grabbing'
        }`}
      >
        {/* Cardinal Handles: circles with arrow on hover and click-to-connect */}
        <CanvasCardinalHandles nodeId={id} />

        {/* Notepad Pin & Title */}
        <div
          className="shrink-0 border-b border-black/10 dark:border-white/10 pb-1.5 mb-2 flex items-center justify-between gap-1.5"
          onDoubleClick={(e) => {
            e.stopPropagation()
            setFocusTarget('title')
            setIsEditing(true)
          }}
        >
          {isEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                updateNoteData({ title: e.target.value, content })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setFocusTarget('body')
                  textareaRef.current?.focus()
                } else if (e.key === 'Escape') {
                  finishEditing()
                }
              }}
              placeholder="Title"
              className={`nodrag nopan bg-transparent ${fontFamilyClass} font-bold text-sm ${curTheme.text} ${curTheme.placeholder} outline-none w-full`}
            />
          ) : (
            <div
              className={`${fontFamilyClass} font-bold text-sm ${curTheme.text} truncate select-none pointer-events-none w-full`}
              title={title}
            >
              {title || <span className="opacity-40 italic font-normal">Untitled Note</span>}
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {isEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  finishEditing()
                }}
                className="nodrag p-0.5 rounded hover:bg-black/10 text-current transition-colors cursor-pointer"
                title="Done"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <div className={`w-2 h-2 rounded-full ${curTheme.pin} shrink-0`} />
          </div>
        </div>

        {/* Ruled / Lined Body Area */}
        <div
          className="flex-1 w-full min-h-0 relative"
          onDoubleClick={(e) => {
            e.stopPropagation()
            setFocusTarget('body')
            setIsEditing(true)
          }}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                updateNoteData({ title, content: e.target.value })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
                  e.preventDefault()
                  finishEditing()
                }
              }}
              placeholder="Write something..."
              style={{
                lineHeight: lineH,
                backgroundImage: `repeating-linear-gradient(transparent, transparent ${gapH}px, ${curTheme.line} ${lineH})`,
                backgroundAttachment: 'local'
              }}
              className={`nodrag nopan w-full h-full bg-transparent ${fontSizeClass} ${fontFamilyClass} ${weightClass} ${styleClass} ${curTheme.text} ${curTheme.placeholder} outline-none resize-none cursor-text`}
            />
          ) : (
            <div
              style={{
                lineHeight: lineH,
                backgroundImage: `repeating-linear-gradient(transparent, transparent ${gapH}px, ${curTheme.line} ${lineH})`,
                backgroundAttachment: 'local'
              }}
              className={`w-full h-full ${fontSizeClass} ${fontFamilyClass} ${weightClass} ${styleClass} ${curTheme.text} select-none pointer-events-none overflow-hidden whitespace-pre-wrap break-words`}
            >
              {content || <span className="opacity-40 italic">Double-click to write...</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 3. Geometric Shape Node (Parallelogram, Diamond, Rectangle, Circle)
const BASE_SHAPE_WIDTH = 160
const BASE_SHAPE_HEIGHT = 120

const isColorBright = (c: string) => {
  if (!c) return false
  const hex = c.replace('#', '')
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 140
  }
  return false
}

export type WhiteboardShapeType = 
  | 'parallelogram' 
  | 'diamond' 
  | 'rectangle' 
  | 'circle'
  | 'triangle'
  | 'star'
  | 'hexagon'
  | 'octagon'
  | 'cylinder'
  | 'cloud'
  | 'speech'
  | 'arrow'

const ShapeNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const shapeData = data as { 
    shapeType?: WhiteboardShapeType; 
    color?: string; 
    text?: string;
    width?: number;
    height?: number;
    fillMode?: 'solid' | 'outline';
    isBold?: boolean;
    isItalic?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: number;
    rotation?: number;
  }
  const themeTokens = useActiveThemeTokens()
  const [text, setText] = useState(shapeData.text || '')
  const [rotation, setRotation] = useState(Number(shapeData.rotation) || 0)
  const [isEditing, setIsEditing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const shapeInnerRef = useRef<HTMLDivElement>(null)
  const type: WhiteboardShapeType = shapeData.shapeType || 'rectangle'
  const reactFlow = useReactFlow()
  const selectedCount = reactFlow.getNodes().filter((n) => n.selected).length
  const color = shapeData.color || '#334155'
  const fillMode = shapeData.fillMode || 'solid'
  const isBold = Boolean(shapeData.isBold)
  const isItalic = Boolean(shapeData.isItalic)
  const textAlign = shapeData.textAlign || 'center'
  const fontSize = Number(shapeData.fontSize) || 12

  const updateShapeData = useCallback((patch: Partial<typeof shapeData>) => {
    reactFlow.setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
    )
  }, [id, reactFlow])

  useEffect(() => {
    if (shapeData.text !== undefined) {
      setText(shapeData.text)
    }
  }, [shapeData.text])

  useEffect(() => {
    if (shapeData.rotation !== undefined) {
      setRotation(Number(shapeData.rotation) || 0)
    }
  }, [shapeData.rotation])

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const syncText = useCallback((nextText: string) => {
    updateShapeData({ text: nextText })
  }, [updateShapeData])

  useEffect(() => {
    if (!selected && isEditing) {
      setIsEditing(false)
      setShowColorPicker(false)
    }
  }, [selected, isEditing])

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

  // Smooth Drag to Rotate handler
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const el = shapeInnerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const onPointerMove = (me: PointerEvent) => {
      const rad = Math.atan2(me.clientY - centerY, me.clientX - centerX)
      let deg = Math.round(rad * (180 / Math.PI) + 90)
      if (deg < 0) deg += 360
      // Snap to 45 degree intervals within 5 degrees
      const snaps = [0, 45, 90, 135, 180, 225, 270, 315, 360]
      for (const s of snaps) {
        if (Math.abs(deg - s) <= 5) {
          deg = s % 360
          break
        }
      }
      setRotation(deg)
      updateShapeData({ rotation: deg })
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const cycleShapeType = (e: React.MouseEvent) => {
    e.stopPropagation()
    const types: WhiteboardShapeType[] = [
      'rectangle',
      'circle',
      'diamond',
      'parallelogram',
      'triangle',
      'star',
      'hexagon',
      'octagon',
      'cylinder',
      'cloud',
      'speech',
      'arrow'
    ]
    const next = types[(types.indexOf(type) + 1) % types.length]
    updateShapeData({ shapeType: next })
  }

  const toggleFillMode = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateShapeData({ fillMode: fillMode === 'solid' ? 'outline' : 'solid' })
  }

  const textColor =
    fillMode === 'outline'
      ? '#f8fafc'
      : isColorBright(color)
      ? '#0f172a'
      : '#ffffff'

  const renderShapeText = (paddingClass: string) => (
    <>
      {isEditing ? (
        <div className={`absolute inset-0 flex items-center justify-center ${paddingClass} z-10`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              syncText(e.target.value)
            }}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
                e.preventDefault()
                setIsEditing(false)
              }
            }}
            placeholder="Shape text..."
            style={{
              color: textColor,
              fontSize: `${fontSize}px`,
              lineHeight: 1.35,
              textAlign
            }}
            className={`nodrag nopan w-full max-h-full bg-transparent font-sans ${
              isBold ? 'font-bold' : 'font-medium'
            } ${isItalic ? 'italic' : ''} outline-none resize-none overflow-y-auto break-words whitespace-pre-wrap cursor-text scrollbar-none`}
            rows={Math.max(1, text.split('\n').length)}
          />
        </div>
      ) : (
        <div className={`absolute inset-0 flex items-center justify-center ${paddingClass} select-none pointer-events-none z-10`}>
          <div 
            style={{
              color: textColor,
              fontSize: `${fontSize}px`,
              lineHeight: 1.35,
              textAlign
            }}
            className={`w-full max-h-full font-sans ${isBold ? 'font-bold' : 'font-medium'} ${
              isItalic ? 'italic' : ''
            } break-words whitespace-pre-wrap overflow-hidden`}
          >
            {text || (selected ? <span className="opacity-40 italic font-normal text-[10px]">Double-click to write</span> : '')}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="relative select-none w-full h-full">
      {/* NodeResizer operates on the outer axis-aligned bounding box so scaling works cleanly with no rotation skew */}
      <NodeResizer
        isVisible={selected && selectedCount <= 1}
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
        handleClassName="!w-3.5 !h-3.5 !bg-accent !border-2 !border-oros-950 !rounded-none shadow-md hover:scale-110 transition-transform"
        lineClassName="!border-accent/70 !border-dashed"
      />

      {/* Rotation stalk knob above the shape for quick drag rotation */}
      {selected && selectedCount <= 1 && (
        <div
          onMouseDown={handleRotateStart}
          className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-20 nodrag nopan select-none group/rotate"
          title="Drag to rotate shape"
        >
          <div className="w-3.5 h-3.5 rounded-full bg-accent border-2 border-oros-950 shadow-lg group-hover/rotate:scale-125 transition-transform flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white" />
          </div>
          <div className="w-0.5 h-3 bg-accent/70" />
        </div>
      )}

      {selected && selectedCount <= 1 && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
          extraControls={
            <>
              <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />
              {/* Rotation Stepper Controls */}
              <div className="flex items-center gap-0.5 bg-oros-950/80 px-1 py-0.5 rounded border border-oros-800" title="Rotate shape">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = (rotation - 15 + 360) % 360
                    setRotation(next)
                    updateShapeData({ rotation: next })
                  }}
                  className="p-0.5 rounded hover:bg-oros-800 text-oros-400 hover:text-oros-100 transition-colors cursor-pointer"
                  title="Rotate -15°"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    setRotation(0)
                    updateShapeData({ rotation: 0 })
                  }}
                  className="text-[10px] font-mono text-accent min-w-7 text-center cursor-pointer hover:underline"
                  title="Click to reset rotation (0°)"
                >
                  {rotation}°
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = (rotation + 15) % 360
                    setRotation(next)
                    updateShapeData({ rotation: next })
                  }}
                  className="p-0.5 rounded hover:bg-oros-800 text-oros-400 hover:text-oros-100 transition-colors cursor-pointer"
                  title="Rotate +15°"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>

              <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />

              {/* Shape Type Cycle Button */}
              <button
                type="button"
                onClick={cycleShapeType}
                className="p-1 rounded hover:bg-oros-850 text-oros-400 hover:text-oros-100 transition-colors cursor-pointer"
                title={`Current: ${type} (click to cycle)`}
              >
                {type === 'circle' ? (
                  <Circle className="w-3.5 h-3.5" />
                ) : type === 'rectangle' ? (
                  <Square className="w-3.5 h-3.5" />
                ) : type === 'diamond' ? (
                  <Diamond className="w-3.5 h-3.5" />
                ) : type === 'triangle' ? (
                  <Triangle className="w-3.5 h-3.5" />
                ) : type === 'star' ? (
                  <Star className="w-3.5 h-3.5" />
                ) : type === 'hexagon' ? (
                  <Hexagon className="w-3.5 h-3.5" />
                ) : type === 'octagon' ? (
                  <Octagon className="w-3.5 h-3.5" />
                ) : type === 'cylinder' ? (
                  <Cylinder className="w-3.5 h-3.5" />
                ) : type === 'cloud' ? (
                  <Cloud className="w-3.5 h-3.5" />
                ) : type === 'speech' ? (
                  <MessageSquare className="w-3.5 h-3.5" />
                ) : type === 'arrow' ? (
                  <ArrowRight className="w-3.5 h-3.5" />
                ) : (
                  <span className="font-mono text-xs font-bold italic tracking-tighter">▱</span>
                )}
              </button>

              {/* Color Swatch / Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm transition-transform hover:scale-110 cursor-pointer flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color }}
                  title="Shape color"
                />

                {showColorPicker && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-oros-900 border border-oros-750 rounded-full p-1 shadow-2xl z-50 animate-dropdown-in">
                    {[
                      { color: '#ffffff', label: 'White' },
                      { color: '#334155', label: 'Slate' },
                      { color: themeTokens.accent, label: 'Accent' },
                      { color: '#f5c542', label: 'Gold' },
                      { color: '#f43f5e', label: 'Crimson' },
                      { color: '#10b981', label: 'Emerald' },
                      { color: '#06b6d4', label: 'Cyan' },
                      { color: '#a855f7', label: 'Arcane' }
                    ].map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateShapeData({ color: c.color })
                          setShowColorPicker(false)
                        }}
                        className="w-3.5 h-3.5 rounded-full border border-white/30 hover:scale-125 transition-transform shrink-0"
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Fill Mode Toggle (Solid vs Outline) */}
              <button
                type="button"
                onClick={toggleFillMode}
                className={`p-1 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  fillMode === 'outline'
                    ? 'bg-accent/20 text-accent font-semibold'
                    : 'text-oros-400 hover:text-oros-100 hover:bg-oros-850'
                }`}
                title={fillMode === 'solid' ? 'Filled (Click for outline)' : 'Outlined (Click for solid)'}
              >
                {fillMode === 'solid' ? '■' : '□'}
              </button>

              {/* Text Alignment */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const alignments: ('left' | 'center' | 'right')[] = ['center', 'left', 'right']
                  const next = alignments[(alignments.indexOf(textAlign) + 1) % alignments.length]
                  updateShapeData({ textAlign: next })
                }}
                className="p-1 rounded hover:bg-oros-850 text-oros-400 hover:text-oros-100 transition-colors cursor-pointer"
                title={`Text align: ${textAlign} (click to cycle)`}
              >
                {textAlign === 'left' ? (
                  <AlignLeft className="w-3.5 h-3.5" />
                ) : textAlign === 'right' ? (
                  <AlignRight className="w-3.5 h-3.5" />
                ) : (
                  <AlignCenter className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Font Size Stepper */}
              <div 
                className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-oros-950/80 border border-oros-800 text-[10px] font-mono text-oros-300 select-none"
                title="Font size inside shape"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = Math.max(8, fontSize - 2)
                    updateShapeData({ fontSize: next })
                  }}
                  className="p-0.5 hover:bg-oros-800 hover:text-white rounded cursor-pointer"
                  title="Smaller text"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="min-w-6 text-center text-[10px] text-accent font-semibold">
                  {fontSize}px
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const next = Math.min(48, fontSize + 2)
                    updateShapeData({ fontSize: next })
                  }}
                  className="p-0.5 hover:bg-oros-800 hover:text-white rounded cursor-pointer"
                  title="Larger text"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Bold Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  updateShapeData({ isBold: !isBold })
                }}
                title="Bold"
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isBold ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-oros-800 text-oros-400 hover:text-white'
                }`}
              >
                <Bold className="w-3 h-3" />
              </button>

              {/* Italic Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  updateShapeData({ isItalic: !isItalic })
                }}
                title="Italic"
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isItalic ? 'bg-accent/20 text-accent italic' : 'hover:bg-oros-800 text-oros-400 hover:text-white'
                }`}
              >
                <Italic className="w-3 h-3" />
              </button>

              {/* Edit Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(!isEditing)
                }}
                className={`p-1 rounded-[2px] transition-colors cursor-pointer ${
                  isEditing
                    ? 'bg-accent/20 text-accent'
                    : 'hover:bg-oros-850 text-oros-400 hover:text-oros-100'
                }`}
                title={isEditing ? 'Done' : 'Edit (or double-click)'}
              >
                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              </button>
            </>
          }
        />
      )}

      {/* Inner Rotated Geometry Container */}
      <div 
        ref={shapeInnerRef}
        onDoubleClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center center'
        }}
        className={`relative w-full h-full select-none cursor-move flex items-center justify-center transition-transform duration-75 group ${
          selected && selectedCount <= 1 ? 'ring-2 ring-accent/60 rounded-[4px]' : ''
        }`}
      >
        {/* Cardinal Handles: circles with arrow on hover and click-to-connect */}
        <CanvasCardinalHandles nodeId={id} />

        {/* 1. Parallelogram */}
        {type === 'parallelogram' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 140 100" preserveAspectRatio="none">
              <polygon 
                points="35,5 135,5 105,95 5,95" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('px-7 py-3')}
          </div>
        )}

        {/* 2. Diamond */}
        {type === 'diamond' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon 
                points="50,5 95,50 50,95 5,50" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('p-5')}
          </div>
        )}

        {/* 3. Rectangle */}
        {type === 'rectangle' && (
          <div 
            style={{ 
              backgroundColor: fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color,
              borderColor: fillMode === 'outline' ? color : '#94a3b8',
              borderWidth: fillMode === 'outline' ? 2 : 1
            }}
            className="w-full h-full rounded-xl border shadow-xl flex items-center justify-center relative overflow-hidden"
          >
            {renderShapeText('p-3')}
          </div>
        )}

        {/* 4. Circle */}
        {type === 'circle' && (
          <div 
            style={{ 
              backgroundColor: fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color,
              borderColor: fillMode === 'outline' ? color : '#94a3b8',
              borderWidth: fillMode === 'outline' ? 2 : 1
            }}
            className="w-full h-full rounded-full border shadow-xl flex items-center justify-center relative overflow-hidden"
          >
            {renderShapeText('p-4')}
          </div>
        )}

        {/* 5. Triangle */}
        {type === 'triangle' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon 
                points="50,5 95,95 5,95" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('pt-7 px-4 pb-2')}
          </div>
        )}

        {/* 6. Star */}
        {type === 'star' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon 
                points="50,5 64,36 98,36 71,57 81,91 50,70 19,91 29,57 2,36 36,36" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('p-5')}
          </div>
        )}

        {/* 7. Hexagon */}
        {type === 'hexagon' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon 
                points="25,5 75,5 95,50 75,95 25,95 5,50" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('px-5 py-3')}
          </div>
        )}

        {/* 8. Octagon */}
        {type === 'octagon' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon 
                points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('p-4')}
          </div>
        )}

        {/* 9. Cylinder (Database) */}
        {type === 'cylinder' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M 10,25 V 75 A 40,15 0 0,0 90,75 V 25"
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color}
                stroke={fillMode === 'outline' ? color : '#94a3b8'}
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
              <ellipse
                cx="50"
                cy="25"
                rx="40"
                ry="15"
                fill={fillMode === 'outline' ? 'rgba(30,41,59,0.9)' : color}
                stroke={fillMode === 'outline' ? color : '#94a3b8'}
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('pt-8 pb-3 px-3')}
          </div>
        )}

        {/* 10. Cloud */}
        {type === 'cloud' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 120 80" preserveAspectRatio="none">
              <path 
                d="M 25,60 a 20,20 0 0,1 0,-35 a 22,22 0 0,1 32,-10 a 25,25 0 0,1 42,10 a 18,18 0 0,1 8,35 z" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('p-4')}
          </div>
        )}

        {/* 11. Speech Bubble */}
        {type === 'speech' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path 
                d="M 10,12 H 90 Q 95,12 95,17 V 65 Q 95,70 90,70 H 45 L 25,88 V 70 H 10 Q 5,70 5,65 V 17 Q 5,12 10,12 Z" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('pt-3 pb-6 px-4')}
          </div>
        )}

        {/* 12. Block Arrow */}
        {type === 'arrow' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full filter drop-shadow-lg" viewBox="0 0 100 80" preserveAspectRatio="none">
              <polygon 
                points="5,25 60,25 60,10 95,40 60,70 60,55 5,55" 
                fill={fillMode === 'outline' ? 'rgba(15,23,42,0.6)' : color} 
                stroke={fillMode === 'outline' ? color : '#94a3b8'} 
                strokeWidth={fillMode === 'outline' ? '2.5' : '1.5'}
              />
            </svg>
            {renderShapeText('px-4 py-2')}
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
    color?: string;
    fontFamily?: 'serif' | 'sans' | 'mono';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl';
    textAlign?: 'left' | 'center' | 'right';
    isBold?: boolean;
    isItalic?: boolean;
  }
  const themeTokens = useActiveThemeTokens()
  const [text, setText] = useState(textData.text || '')
  const [isEditing, setIsEditing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const reactFlow = useReactFlow()
  const selectedCount = reactFlow.getNodes().filter((n) => n.selected).length

  const color = textData.color || '#e2e8f0'
  const fontFamily = textData.fontFamily || 'serif'
  const fontSize = textData.fontSize || 'base'
  const textAlign = textData.textAlign || 'left'
  const isBold = Boolean(textData.isBold)
  const isItalic = Boolean(textData.isItalic)

  const updateTextData = useCallback((patch: Partial<typeof textData>) => {
    reactFlow.setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
    )
  }, [id, reactFlow])

  useEffect(() => {
    if (textData.text !== undefined) {
      setText(textData.text)
    }
  }, [textData.text])

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const syncText = useCallback((nextText: string) => {
    updateTextData({ text: nextText })
  }, [updateTextData])

  useEffect(() => {
    if (!selected && isEditing) {
      setIsEditing(false)
      setShowColorPicker(false)
    }
  }, [selected, isEditing])

  const currentW = Math.round(Number(textData.width) || BASE_TEXT_WIDTH)
  const currentH = Math.round(Number(textData.height) || BASE_TEXT_HEIGHT)
  const scalePercent = Math.round((currentW / BASE_TEXT_WIDTH) * 100)

  const handleScale = (factor: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextW = Math.round(Math.max(100, Math.min(800, currentW * factor)))
    const nextH = Math.round(Math.max(30, Math.min(400, currentH * factor)))
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

  const fontFamilyClass =
    fontFamily === 'mono' ? 'font-mono' : fontFamily === 'sans' ? 'font-sans' : 'font-serif'

  const fontSizeClass =
    fontSize === 'sm'
      ? 'text-xs'
      : fontSize === 'lg'
      ? 'text-base'
      : fontSize === 'xl'
      ? 'text-lg font-semibold'
      : 'text-sm'

  return (
    <div className="relative select-none w-full h-full">
      <NodeResizer
        isVisible={selected && selectedCount <= 1}
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
        handleClassName="!w-3.5 !h-3.5 !bg-accent !border-2 !border-oros-950 !rounded-none shadow-md hover:scale-110 transition-transform"
        lineClassName="!border-accent/70 !border-dashed"
      />

      {selected && selectedCount <= 1 && (
        <NodeScalingToolbar
          scalePercent={scalePercent}
          onScale={handleScale}
          onResetScale={handleReset}
          onDelete={handleDelete}
          extraControls={
            <>
              <div className="w-[1px] h-3 bg-oros-800 mx-0.5" />
              {/* Color Swatch / Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm transition-transform hover:scale-110 cursor-pointer flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color }}
                  title="Text color"
                />

                {showColorPicker && (
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-oros-900 border border-oros-750 rounded-full p-1 shadow-2xl z-50 animate-dropdown-in">
                    {[
                      { color: '#e2e8f0', label: 'Slate' },
                      { color: themeTokens.accent, label: 'Accent' },
                      { color: '#f5c542', label: 'Gold' },
                      { color: '#f43f5e', label: 'Crimson' },
                      { color: '#10b981', label: 'Emerald' },
                      { color: '#06b6d4', label: 'Cyan' },
                      { color: '#a855f7', label: 'Arcane' },
                      { color: '#ffffff', label: 'White' }
                    ].map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateTextData({ color: c.color })
                          setShowColorPicker(false)
                        }}
                        className="w-3.5 h-3.5 rounded-full border border-white/30 hover:scale-125 transition-transform shrink-0"
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Font Family Cycle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const families: ('serif' | 'sans' | 'mono')[] = ['serif', 'sans', 'mono']
                  const next = families[(families.indexOf(fontFamily) + 1) % families.length]
                  updateTextData({ fontFamily: next })
                }}
                className="w-4 h-4 rounded hover:bg-oros-850 text-oros-400 hover:text-oros-100 flex items-center justify-center cursor-pointer"
                title="Font family"
              >
                <span className={`text-[10px] font-bold ${fontFamilyClass}`}>
                  {fontFamily === 'serif' ? 'F' : fontFamily === 'mono' ? 'M' : 'A'}
                </span>
              </button>

              {/* Font Size Cycle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl']
                  const next = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length]
                  updateTextData({ fontSize: next })
                }}
                className="px-1 py-0.5 rounded hover:bg-oros-850 text-oros-400 hover:text-oros-100 text-[9px] font-mono cursor-pointer"
                title="Font size"
              >
                {fontSize.toUpperCase()}
              </button>

              {/* Text Alignment */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  const alignments: ('left' | 'center' | 'right')[] = ['left', 'center', 'right']
                  const next = alignments[(alignments.indexOf(textAlign) + 1) % alignments.length]
                  updateTextData({ textAlign: next })
                }}
                className="p-1 rounded hover:bg-oros-850 text-oros-400 hover:text-oros-100 transition-colors cursor-pointer"
                title={`Text align: ${textAlign} (click to cycle)`}
              >
                {textAlign === 'center' ? (
                  <AlignCenter className="w-3.5 h-3.5" />
                ) : textAlign === 'right' ? (
                  <AlignRight className="w-3.5 h-3.5" />
                ) : (
                  <AlignLeft className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Bold Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  updateTextData({ isBold: !isBold })
                }}
                title="Bold"
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isBold ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-oros-800 text-oros-400 hover:text-white'
                }`}
              >
                <Bold className="w-3 h-3" />
              </button>

              {/* Italic Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  updateTextData({ isItalic: !isItalic })
                }}
                title="Italic"
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isItalic ? 'bg-accent/20 text-accent italic' : 'hover:bg-oros-800 text-oros-400 hover:text-white'
                }`}
              >
                <Italic className="w-3 h-3" />
              </button>

              {/* Edit Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(!isEditing)
                }}
                className={`p-1 rounded-[2px] transition-colors cursor-pointer ${
                  isEditing
                    ? 'bg-accent/20 text-accent'
                    : 'hover:bg-oros-850 text-oros-400 hover:text-oros-100'
                }`}
                title={isEditing ? 'Done' : 'Edit (or double-click)'}
              >
                {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              </button>
            </>
          }
        />
      )}

      <div 
        onDoubleClick={(e) => {
          e.stopPropagation()
          setIsEditing(true)
        }}
        className={`relative w-full h-full px-3 py-1.5 rounded-[4px] select-none transition-colors duration-150 cursor-move flex items-center group ${
          selected ? 'ring-1 ring-accent bg-oros-900/40' : 'hover:bg-oros-900/20'
        }`}
      >
        {/* Cardinal Handles: circles with arrow on hover and click-to-connect */}
        <CanvasCardinalHandles nodeId={id} />

        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              syncText(e.target.value)
            }}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
                e.preventDefault()
                setIsEditing(false)
              }
            }}
            style={{ color, textAlign }}
            className={`nodrag nopan w-full h-full bg-transparent ${fontFamilyClass} ${fontSizeClass} ${
              isBold ? 'font-bold' : ''
            } ${isItalic ? 'italic' : ''} tracking-wide outline-none resize-none break-words whitespace-pre-wrap overflow-y-auto cursor-text scrollbar-none`}
            placeholder="Type text..."
            rows={Math.max(1, text.split('\n').length)}
          />
        ) : (
          <div 
            style={{ color, textAlign }}
            className="w-full h-full flex items-center select-none pointer-events-none cursor-move overflow-hidden"
          >
            <div 
              className={`w-full ${fontFamilyClass} ${fontSizeClass} ${
                isBold ? 'font-bold' : ''
              } ${isItalic ? 'italic' : ''} tracking-wide break-words whitespace-pre-wrap overflow-hidden`}
            >
              {text || <span className="opacity-40 italic">Double-click to write...</span>}
            </div>
          </div>
        )}
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
        selected ? 'ring-2 ring-accent ring-dashed rounded-[4px] bg-accent/5 cursor-move pointer-events-auto' : 'pointer-events-none'
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
        handleClassName="!w-3.5 !h-3.5 !bg-accent !border-2 !border-oros-950 !rounded-none shadow-md hover:scale-110 transition-transform pointer-events-auto"
        lineClassName="!border-accent/70 !border-dashed pointer-events-auto"
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

// 6. Direct Image Node (Dropped from Chrome, File Explorer, or pasted)
const BASE_IMG_WIDTH = 280
const BASE_IMG_HEIGHT = 210

const CanvasImageNode: React.FC<NodeProps> = ({ id, data, selected }) => {
  const [imgError, setImgError] = useState(false)
  const imgData = data as {
    src?: string;
    caption?: string;
    width?: number;
    height?: number;
    hasFrame?: boolean;
    borderRadius?: 'none' | 'sm' | 'md' | 'full';
  }
  const reactFlow = useReactFlow()
  const [caption, setCaption] = useState(imgData.caption || '')
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const hasFrame = imgData.hasFrame !== false
  const radius = imgData.borderRadius || 'sm'

  const currentW = Math.round(Number(imgData.width) || BASE_IMG_WIDTH)
  const currentH = Math.round(Number(imgData.height) || BASE_IMG_HEIGHT)
  const scalePercent = Math.round((currentW / BASE_IMG_WIDTH) * 100)

  const handleScale = (factor: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextW = Math.round(Math.max(80, Math.min(1000, currentW * factor)))
    const nextH = Math.round(Math.max(60, Math.min(800, currentH * factor)))
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
              style: { ...n.style, width: BASE_IMG_WIDTH, height: BASE_IMG_HEIGHT },
              data: { ...n.data, width: BASE_IMG_WIDTH, height: BASE_IMG_HEIGHT }
            }
          : n
      )
    )
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    reactFlow.setNodes((nds) => nds.filter((n) => n.id !== id))
  }

  const toggleFrame = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextFrame = !hasFrame
    reactFlow.setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, hasFrame: nextFrame } } : n))
    )
  }

  const cycleRadius = (e: React.MouseEvent) => {
    e.stopPropagation()
    const radiuses: ('none' | 'sm' | 'md' | 'full')[] = ['none', 'sm', 'md', 'full']
    const nextR = radiuses[(radiuses.indexOf(radius) + 1) % radiuses.length]
    reactFlow.setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, borderRadius: nextR } } : n))
    )
  }

  const radiusClass =
    radius === 'none'
      ? 'rounded-none'
      : radius === 'md'
      ? 'rounded-xl'
      : radius === 'full'
      ? 'rounded-full'
      : 'rounded-[4px]'

  return (
    <div className="relative select-none w-full h-full">
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={60}
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
        handleClassName="!w-3.5 !h-3.5 !bg-accent !border-2 !border-oros-950 !rounded-none shadow-md hover:scale-110 transition-transform"
        lineClassName="!border-accent/70 !border-dashed"
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
                type="button"
                onClick={toggleFrame}
                className={`p-1 rounded-[2px] transition-colors cursor-pointer ${
                  hasFrame ? 'bg-accent/20 text-accent' : 'text-oros-400 hover:text-oros-100 hover:bg-oros-850'
                }`}
                title="Toggle frame"
              >
                <Frame className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={cycleRadius}
                className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors cursor-pointer"
                title="Cycle corner radius"
              >
                <Circle className="w-3.5 h-3.5" />
              </button>
            </>
          }
        />
      )}

      <div
        className={`relative w-full h-full flex flex-col transition-all duration-150 shadow-xl select-none group cursor-move ${radiusClass} ${
          hasFrame
            ? 'p-2 bg-oros-950/95 border border-oros-800/90'
            : 'bg-transparent'
        } ${selected ? 'ring-2 ring-accent shadow-2xl' : 'hover:border-oros-700'}`}
      >
        {/* 4 Cardinal Handles - visible on hover */}
        {/* Cardinal Handles: circles with arrow on hover and click-to-connect */}
        <CanvasCardinalHandles nodeId={id} />

        {/* Image Display */}
        <div className={`flex-1 w-full min-h-0 relative overflow-hidden ${hasFrame ? 'rounded-[2px]' : radiusClass}`}>
          {imgError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-oros-900 text-oros-500 text-xs p-3 text-center">
              <ImageIcon className="w-6 h-6 mb-1 text-oros-600" />
              <span>Failed to load image</span>
            </div>
          ) : (
            <img
              src={imgData.src}
              alt={caption || 'Canvas Image'}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center pointer-events-none"
            />
          )}
        </div>

        {/* Editable Image Label / Caption */}
        <div className={`mt-1.5 shrink-0 px-1 ${hasFrame ? '' : 'absolute bottom-1 inset-x-2 bg-oros-950/85 backdrop-blur-sm rounded-[3px] border border-oros-800/60 py-0.5'}`}>
          {isEditingCaption ? (
            <input
              type="text"
              autoFocus
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={() => {
                setIsEditingCaption(false)
                reactFlow.setNodes((nds) =>
                  nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, caption } } : n))
                )
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingCaption(false)
                  reactFlow.setNodes((nds) =>
                    nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, caption } } : n))
                  )
                }
              }}
              className="w-full bg-oros-900 border border-oros-700 rounded px-1.5 py-0.5 text-[11px] font-sans text-oros-200 outline-none"
              placeholder="Image label / caption..."
            />
          ) : (
            <div
              onClick={() => setIsEditingCaption(true)}
              className="text-[11px] font-sans text-oros-400 hover:text-oros-200 truncate cursor-text text-center py-0.5 flex items-center justify-center gap-1"
              title="Click to edit image label"
            >
              <span>{caption || <span className="opacity-0 group-hover:opacity-60 italic text-[10px]">Add image label...</span>}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==========================================
// CUSTOM WHITEBOARD ARROW EDGE (Mouse-Editable + Dynamic Moveable Ledgers)
// ==========================================
export interface Point {
  x: number;
  y: number;
}

export interface WhiteboardEdgeData {
  label?: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  edgeType?: 'smoothstep' | 'bezier' | 'straight';
  strokeColor?: string;
  strokeWidth?: number;
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  arrowDirection?: 'end' | 'both' | 'none' | 'start';
  isAnimated?: boolean;
  offset?: number;
  waypoints?: Point[];
}

export interface EdgeActionContextType {
  updateEdge: (id: string, patch: Partial<WhiteboardEdgeData>) => void;
  reverseEdge: (id: string) => void;
  deleteEdge: (id: string) => void;
  updateWaypoints: (id: string, waypoints: Point[] | undefined) => void;
}

export const EdgeActionContext = React.createContext<EdgeActionContextType | null>(null)

export const getEdgeMarkerConfig = (arrowDirection?: string, strokeColor?: string, strokeWidth?: number | string) => {
  const dir = arrowDirection || 'end'
  const col = strokeColor || 'var(--oros-accent, #f97316)'
  const w = Number(strokeWidth) || 2
  const markerEnd =
    dir === 'end' || dir === 'both'
      ? {
          type: MarkerType.ArrowClosed,
          color: col,
          width: Math.max(14, w * 6),
          height: Math.max(14, w * 6)
        }
      : undefined

  const markerStart =
    dir === 'start' || dir === 'both'
      ? {
          type: MarkerType.ArrowClosed,
          color: col,
          width: Math.max(14, w * 6),
          height: Math.max(14, w * 6)
        }
      : undefined

  return { markerEnd, markerStart }
}

export const SNAP_SEGMENT_THRESHOLD = 14

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

const WhiteboardCustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  targetHandleId,
  style = {},
  data,
  selected,
  markerEnd,
  markerStart
}) => {
  const reactFlow = useReactFlow()
  const themeTokens = useActiveThemeTokens()
  const edgeActions = React.useContext(EdgeActionContext)
  const edgeData = (data || {}) as WhiteboardEdgeData
  const edgeType = edgeData.edgeType || 'smoothstep'
  const strokeColor = edgeData.strokeColor || style.stroke || themeTokens.accent
  const strokeWidth = Number(edgeData.strokeWidth) || 2
  const strokePattern = edgeData.strokePattern || 'solid'
  const isAnimated = Boolean(edgeData.isAnimated)
  const label = edgeData.label

  const resolveEffectivePosition = (handleId?: string | null, fallback?: Position): Position => {
    if (handleId) {
      const h = handleId.toLowerCase()
      if (h.includes('left')) return Position.Left
      if (h.includes('right')) return Position.Right
      if (h.includes('top')) return Position.Top
      if (h.includes('bottom')) return Position.Bottom
    }
    return fallback || Position.Right
  }

  const effectiveSourcePosition = resolveEffectivePosition(sourceHandleId || edgeData.sourceHandle, sourcePosition)
  const effectiveTargetPosition = resolveEffectivePosition(targetHandleId || edgeData.targetHandle, targetPosition)

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isEditingLabel, setIsEditingLabel] = useState(false)
  const [labelText, setLabelText] = useState(label || '')
  const labelInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLabelText(label || '')
  }, [label])

  useEffect(() => {
    if (isEditingLabel) {
      labelInputRef.current?.focus()
      labelInputRef.current?.select()
    }
  }, [isEditingLabel])

  useEffect(() => {
    if (!selected) {
      setShowColorPicker(false)
      setIsEditingLabel(false)
    }
  }, [selected])

  // Dynamic orthogonal waypoints anchored to latest node positions
  const waypoints = useMemo(() => {
    if (edgeData.waypoints && edgeData.waypoints.length >= 2) {
      const cloned = edgeData.waypoints.map((p) => ({ ...p }))
      cloned[0] = { x: sourceX, y: sourceY }
      cloned[cloned.length - 1] = { x: targetX, y: targetY }
      return cloned
    }
    return computeOrthogonalWaypoints(
      { x: sourceX, y: sourceY, position: effectiveSourcePosition },
      { x: targetX, y: targetY, position: effectiveTargetPosition }
    )
  }, [edgeData.waypoints, sourceX, sourceY, targetX, targetY, effectiveSourcePosition, effectiveTargetPosition])

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
      sourcePosition: effectiveSourcePosition,
      targetX,
      targetY,
      targetPosition: effectiveTargetPosition,
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

  const [snapInfo, setSnapInfo] = useState<{ active: boolean; axis?: 'x' | 'y'; pos?: number } | null>(null)

  // Bounding box for floating toolbar placement & snap guides
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

  // Moveable ledger drag handler for any segment with magnetic collapse snapping
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

    let lastEv: PointerEvent | null = null

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

  const colorPalette = [
    { color: themeTokens.accent, label: 'Accent' },
    { color: '#f5c542', label: 'Gold' },
    { color: '#f43f5e', label: 'Crimson' },
    { color: '#10b981', label: 'Emerald' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#a855f7', label: 'Arcane' },
    { color: '#ffffff', label: 'White' },
    { color: '#64748b', label: 'Slate' }
  ]

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
        className={`${isAnimated ? 'animate-pulse' : ''} ${
          selected ? '!stroke-white filter drop-shadow(0 0 6px rgba(255,255,255,0.7))' : ''
        }`}
      />

      {/* Snap Alignment Guideline Line */}
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

        {/* Floating Capsule Toolbar (Placed comfortably above connection) */}
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
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-oros-900 border border-oros-750 rounded-full p-1 shadow-2xl z-50 animate-dropdown-in">
                    {colorPalette.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          edgeActions?.updateEdge(id, { strokeColor: c.color })
                          setShowColorPicker(false)
                        }}
                        className="w-3.5 h-3.5 rounded-full border border-white/30 hover:scale-125 transition-transform shrink-0"
                        style={{ backgroundColor: c.color }}
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
                  edgeActions?.updateEdge(id, { strokePattern: next })
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
                  const cur = edgeData.arrowDirection || 'end'
                  const next = dirs[(dirs.indexOf(cur) + 1) % dirs.length]
                  edgeActions?.updateEdge(id, { arrowDirection: next })
                }}
                className="p-1 rounded-full hover:bg-oros-850 text-oros-300 hover:text-white transition-colors cursor-pointer"
                title="Arrowheads"
              >
                {edgeData.arrowDirection === 'both' ? (
                  <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
                ) : edgeData.arrowDirection === 'none' ? (
                  <Minus className="w-3.5 h-3.5 opacity-40" />
                ) : edgeData.arrowDirection === 'start' ? (
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

              {/* Inline Label Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingLabel(!isEditingLabel)
                }}
                className={`p-1 rounded-full transition-colors cursor-pointer ${
                  isEditingLabel ? 'bg-accent/20 text-accent' : 'hover:bg-oros-850 text-oros-400 hover:text-white'
                }`}
                title="Edit label"
              >
                <Type className="w-3.5 h-3.5" />
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

        {/* Inline Label Display or Input */}
        {(label || isEditingLabel) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all'
            }}
            className="nodrag nopan z-30"
          >
            {isEditingLabel ? (
              <input
                ref={labelInputRef}
                type="text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onBlur={() => {
                  setIsEditingLabel(false)
                  edgeActions?.updateEdge(id, { label: labelText.trim() })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingLabel(false)
                    edgeActions?.updateEdge(id, { label: labelText.trim() })
                  }
                  if (e.key === 'Escape') {
                    setLabelText(label || '')
                    setIsEditingLabel(false)
                  }
                }}
                placeholder="Relationship..."
                className="px-2 py-0.5 text-xs bg-oros-950 border border-accent rounded-full text-white outline-none font-sans shadow-xl min-w-24 text-center cursor-text"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingLabel(true)
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium border shadow-md flex items-center gap-1 cursor-pointer transition-all ${
                  selected
                    ? 'bg-oros-900 text-white border-white scale-105'
                    : 'bg-oros-950/90 text-oros-200 border-oros-800 hover:border-oros-700 hover:text-white'
                }`}
              >
                <span>{label}</span>
              </div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = {
  canvasCard: CanvasCardNode,
  stickyNote: StickyNoteNode,
  shape: ShapeNode,
  canvasText: CanvasTextNode,
  canvasDrawing: CanvasDrawingNode,
  canvasImage: CanvasImageNode
}

const edgeTypes = {
  whiteboardEdge: WhiteboardCustomEdge,
  smoothstep: WhiteboardCustomEdge,
  bezier: WhiteboardCustomEdge,
  straight: WhiteboardCustomEdge
}

// Helper to guarantee every node has valid dimensions on mount
const getDefaultDimensions = (type?: string, data?: any) => {
  switch (type) {
    case 'canvasCard': return { width: BASE_CARD_WIDTH, height: BASE_CARD_HEIGHT }
    case 'stickyNote': return { width: BASE_NOTE_WIDTH, height: BASE_NOTE_HEIGHT }
    case 'shape': return { width: BASE_SHAPE_WIDTH, height: BASE_SHAPE_HEIGHT }
    case 'canvasText': return { width: BASE_TEXT_WIDTH, height: BASE_TEXT_HEIGHT }
    case 'canvasImage': return { width: Number(data?.width) || BASE_IMG_WIDTH, height: Number(data?.height) || BASE_IMG_HEIGHT }
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
    worlds, activeWorldId, canvases, selectedCanvasId, setSelectedCanvasId,
    createCanvas, updateCanvas, deleteCanvas, saveCanvasNodesAndEdges,
    entities, openTab
  } = useWorldStore()

  const activeWorld = (worlds || []).find((w) => w.id === activeWorldId)
  const containerRef = useRef<HTMLDivElement>(null)

  const { addToast } = useToastStore()
  const { settings } = useSettingsStore()
  const isLight = getEffectiveColorMode(settings.interface.colorMode) === 'light'
  const themeTokens = useActiveThemeTokens()
  const reactFlowInstance = useReactFlow()

  const worldId = activeWorldId || 'world-aethelgard'
  const worldCanvases = canvases[worldId] || []
  const currentCanvasId = canvasId || selectedCanvasId || worldCanvases[0]?.id || 'canvas-main'
  const currentCanvas = worldCanvases.find((c) => c.id === currentCanvasId) || worldCanvases[0]

  // Flow nodes and edges state initialized with validated dimensions
  const [nodes, setNodes, onNodesChange] = useNodesState(ensureNodeDimensions(currentCanvas?.nodes || []))
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentCanvas?.edges || [])

  const handleExportCanvasImage = async (format: 'png' | 'svg') => {
    if (!containerRef.current || !currentCanvas) return
    const safeName = (currentCanvas.name || 'canvas').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    try {
      await exportReactFlowToImage(containerRef.current, nodes, format, {
        filename: `${safeName}.${format}`,
        pixelRatio: 2,
        backgroundColor: '#090a0d',
        padding: 64
      })
      addToast(`Canvas exported as ${format.toUpperCase()}`, 'success')
    } catch (err) {
      console.error('Failed to export canvas:', err)
      addToast('Failed to export canvas', 'error')
    }
  }

  const handleExportCanvasJson = async () => {
    if (!currentCanvas) return
    try {
      const ok = await exportCanvasToJson(currentCanvas, activeWorld?.name)
      if (ok) addToast('Canvas project exported as JSON', 'success')
    } catch (err) {
      console.error('Failed to export canvas data:', err)
      addToast('Failed to export canvas JSON', 'error')
    }
  }

  const canvasExportOptions: ExportOption[] = [
    {
      id: 'export-png',
      label: 'Export Canvas (2x PNG)',
      badge: 'PNG',
      onClick: () => handleExportCanvasImage('png')
    },
    {
      id: 'export-svg',
      label: 'Export Canvas (Vector SVG)',
      badge: 'SVG',
      onClick: () => handleExportCanvasImage('svg')
    },
    {
      id: 'export-json',
      label: 'Export Project (JSON)',
      badge: 'JSON',
      onClick: handleExportCanvasJson
    }
  ]

  // Sync when canvas changes
  useEffect(() => {
    if (currentCanvas) {
      setNodes(ensureNodeDimensions(currentCanvas.nodes || []))
      setEdges(currentCanvas.edges || [])
    }
  }, [currentCanvas?.id])

  // Viewport tracking for screen overlays & coordinates
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })

  // Active Tool state: 'select' | 'pan' | 'pen' | 'text'
  const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'pen' | 'text'>('select')
  const [peekEntityId, setPeekEntityId] = useState<string | null>(null)
  const peekEntity = useMemo(() => {
    const list = (activeWorldId && entities[activeWorldId]) || []
    return list.find((e) => e.id === peekEntityId)
  }, [entities, activeWorldId, peekEntityId])

  const [penColor, setPenColor] = useState(themeTokens.accent)
  const [penWidth, setPenWidth] = useState<number>(3.5)
  const [showPenOptions, setShowPenOptions] = useState<boolean>(false)
  const [showShapePicker, setShowShapePicker] = useState(false)
  const [showCardPicker, setShowCardPicker] = useState(false)
  const [showCanvasDropdown, setShowCanvasDropdown] = useState(false)
  const [isRenamingCanvas, setIsRenamingCanvas] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  // ==========================================
  // UNDO / REDO HISTORY ENGINE
  // ==========================================
  interface CanvasSnapshot {
    nodes: Node[]
    edges: Edge[]
    strokes?: CanvasStroke[]
  }

  const pastRef = useRef<CanvasSnapshot[]>([])
  const futureRef = useRef<CanvasSnapshot[]>([])
  const [historyCount, setHistoryCount] = useState({ past: 0, future: 0 })

  const takeSnapshot = useCallback(() => {
    const currentSnapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(reactFlowInstance.getNodes())),
      edges: JSON.parse(JSON.stringify(reactFlowInstance.getEdges())),
      strokes: currentCanvas?.strokes ? JSON.parse(JSON.stringify(currentCanvas.strokes)) : []
    }
    pastRef.current.push(currentSnapshot)
    if (pastRef.current.length > 35) {
      pastRef.current.shift()
    }
    futureRef.current = []
    setHistoryCount({ past: pastRef.current.length, future: 0 })
  }, [reactFlowInstance, currentCanvas])

  // Duplicate Selected Nodes (Ctrl+D)
  const handleDuplicateSelected = useCallback(() => {
    const selected = nodes.filter((n) => n.selected)
    if (selected.length === 0) return

    takeSnapshot()
    const idMap = new Map<string, string>()
    const duplicatedNodes: Node[] = selected.map((n) => {
      const newId = `${n.type || 'element'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      idMap.set(n.id, newId)
      return {
        ...n,
        id: newId,
        position: {
          x: Math.round(n.position.x + 30),
          y: Math.round(n.position.y + 30)
        },
        selected: true,
        data: {
          ...n.data,
          title: n.data?.title ? `${n.data.title} (Copy)` : undefined
        }
      }
    })

    const selectedIdSet = new Set(selected.map((n) => n.id))
    const duplicatedEdges: Edge[] = edges
      .filter((e) => selectedIdSet.has(e.source) && selectedIdSet.has(e.target))
      .map((e) => ({
        ...e,
        id: `edge-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
        selected: false
      }))

    setNodes((nds) => [
      ...nds.map((n) => (n.selected ? { ...n, selected: false } : n)),
      ...duplicatedNodes
    ])
    if (duplicatedEdges.length > 0) {
      setEdges((eds) => [...eds, ...duplicatedEdges])
    }

    addToast(`Duplicated ${duplicatedNodes.length} item${duplicatedNodes.length > 1 ? 's' : ''}`, 'info')

    setTimeout(() => {
      if (currentCanvas) {
        saveCanvasNodesAndEdges(
          currentCanvas.id,
          reactFlowInstance.getNodes(),
          reactFlowInstance.getEdges()
        )
      }
    }, 150)
  }, [nodes, edges, takeSnapshot, addToast, currentCanvas, saveCanvasNodesAndEdges, reactFlowInstance])

  const handleUndo = useCallback(() => {
    if (pastRef.current.length === 0) return
    const currentSnapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(reactFlowInstance.getNodes())),
      edges: JSON.parse(JSON.stringify(reactFlowInstance.getEdges())),
      strokes: currentCanvas?.strokes ? JSON.parse(JSON.stringify(currentCanvas.strokes)) : []
    }
    futureRef.current.push(currentSnapshot)
    const prev = pastRef.current.pop()!
    setHistoryCount({ past: pastRef.current.length, future: futureRef.current.length })

    setNodes(prev.nodes)
    setEdges(prev.edges)
    if (currentCanvas) {
      saveCanvasNodesAndEdges(currentCanvas.id, prev.nodes, prev.edges)
      if (prev.strokes) {
        updateCanvas(currentCanvas.id, { strokes: prev.strokes })
      }
    }
    addToast('Undo', 'info')
  }, [reactFlowInstance, currentCanvas, setNodes, setEdges, saveCanvasNodesAndEdges, updateCanvas, addToast])

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const currentSnapshot: CanvasSnapshot = {
      nodes: JSON.parse(JSON.stringify(reactFlowInstance.getNodes())),
      edges: JSON.parse(JSON.stringify(reactFlowInstance.getEdges())),
      strokes: currentCanvas?.strokes ? JSON.parse(JSON.stringify(currentCanvas.strokes)) : []
    }
    pastRef.current.push(currentSnapshot)
    const next = futureRef.current.pop()!
    setHistoryCount({ past: pastRef.current.length, future: futureRef.current.length })

    setNodes(next.nodes)
    setEdges(next.edges)
    if (currentCanvas) {
      saveCanvasNodesAndEdges(currentCanvas.id, next.nodes, next.edges)
      if (next.strokes) {
        updateCanvas(currentCanvas.id, { strokes: next.strokes })
      }
    }
    addToast('Redo', 'info')
  }, [reactFlowInstance, currentCanvas, setNodes, setEdges, saveCanvasNodesAndEdges, updateCanvas, addToast])

  // Undo / Redo Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)
      ) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  // ==========================================
  // UNIFIED MULTI-SELECTION BOUNDS & POPUP
  // ==========================================
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes])

  const handleDeselectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)))
  }, [setNodes])

  // Escape clears selection, Ctrl+D duplicates selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNodes.length > 0) {
        handleDeselectAll()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase()
        if (activeTag === 'input' || activeTag === 'textarea') return
        if (selectedNodes.length > 0) {
          e.preventDefault()
          handleDuplicateSelected()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes.length, handleDeselectAll, handleDuplicateSelected])

  const unifiedBounds = useMemo(() => {
    if (selectedNodes.length <= 1) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const n of selectedNodes) {
      const x = n.position.x
      const y = n.position.y
      const w = (n.measured?.width || n.width || (n.style?.width as number) || (n.data?.width as number) || 160)
      const h = (n.measured?.height || n.height || (n.style?.height as number) || (n.data?.height as number) || 120)
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x + w > maxX) maxX = x + w
      if (y + h > maxY) maxY = y + h
    }
    if (!isFinite(minX) || !isFinite(minY)) return null
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
  }, [selectedNodes])

  const screenBounds = useMemo(() => {
    if (!unifiedBounds) return null
    const { x, y, zoom } = viewport
    const pad = 12
    return {
      left: (unifiedBounds.minX - pad) * zoom + x,
      top: (unifiedBounds.minY - pad) * zoom + y,
      width: (unifiedBounds.width + pad * 2) * zoom,
      height: (unifiedBounds.height + pad * 2) * zoom
    }
  }, [unifiedBounds, viewport])

  const handleMultiMoveDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    takeSnapshot()
    const startX = e.clientX
    const startY = e.clientY
    const initialPositions = new Map<string, { x: number; y: number }>()
    selectedNodes.forEach((n) => {
      initialPositions.set(n.id, { x: n.position.x, y: n.position.y })
    })
    const currentZoom = reactFlowInstance.getViewport().zoom

    const onPointerMove = (me: PointerEvent) => {
      const dx = (me.clientX - startX) / currentZoom
      const dy = (me.clientY - startY) / currentZoom
      setNodes((nds) =>
        nds.map((n) => {
          const init = initialPositions.get(n.id)
          if (!init) return n
          return {
            ...n,
            position: {
              x: Math.round(init.x + dx),
              y: Math.round(init.y + dy)
            }
          }
        })
      )
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, reactFlowInstance.getNodes(), edges)
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  const handleBatchDeleteSelected = async () => {
    if (selectedNodes.length === 0) return
    takeSnapshot()
    const selectedIds = new Set(selectedNodes.map((n) => n.id))
    setNodes((nds) => {
      const updated = nds.filter((n) => !selectedIds.has(n.id))
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
      }
      return updated
    })
    addToast(`Deleted ${selectedNodes.length} items`, 'info')
  }

  // Smart Snapping & Alignment state
  const [smartSnapEnabled, setSmartSnapEnabled] = useState(true)
  const [snapGuides, setSnapGuides] = useState<SnapGuideLine[]>([])
  const isAltPressedRef = useRef(false)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const lastMousePosRef = useRef<{ clientX: number; clientY: number } | null>(null)

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
      lastMousePosRef.current = { clientX: e.clientX, clientY: e.clientY }
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

  // Arrow Modification state
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)
  const [showDefaultArrowOptions, setShowDefaultArrowOptions] = useState(false)
  const [defaultArrowSettings, setDefaultArrowSettings] = useState<WhiteboardEdgeData>({
    edgeType: 'smoothstep',
    strokeColor: themeTokens.accent,
    strokeWidth: 2,
    strokePattern: 'solid',
    arrowDirection: 'end',
    isAnimated: false
  })

  // Direct Image Drop & Drag Over state
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([])

  // Node change debounce timer
  const nodeChangeTimerRef = useRef<any>(null)

  // Handle new edge connection with directional arrow matching settings
  const onConnect = useCallback((connection: Connection) => {
    const markers = getEdgeMarkerConfig(
      defaultArrowSettings.arrowDirection,
      defaultArrowSettings.strokeColor || themeTokens.accent,
      defaultArrowSettings.strokeWidth
    )
    const newEdge: Edge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'whiteboardEdge',
      animated: defaultArrowSettings.isAnimated,
      style: { stroke: defaultArrowSettings.strokeColor, strokeWidth: defaultArrowSettings.strokeWidth },
      data: {
        ...defaultArrowSettings,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        label: ''
      },
      markerEnd: markers.markerEnd,
      markerStart: markers.markerStart
    }
    setEdges((eds) => {
      const updated = addEdge(newEdge, eds)
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, nodes, updated)
      }
      return updated
    })
    setSelectedEdgeId(newEdge.id)
    addToast('Connection created', 'info')
  }, [nodes, currentCanvas, saveCanvasNodesAndEdges, defaultArrowSettings, themeTokens.accent, addToast])

  // Quick connect: pressing a handle circle automatically creates an adjacent corresponding element + arrow
  const handleQuickConnect = useCallback((sourceNodeId: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
    const sourceNode = reactFlowInstance?.getNode(sourceNodeId) || nodes.find((n) => n.id === sourceNodeId)
    if (!sourceNode) return

    takeSnapshot()

    const defaultDims = getDefaultDimensions(sourceNode.type, sourceNode.data)
    const nodeWidth = Number(sourceNode.width) || Number(sourceNode.style?.width) || defaultDims.width || 220
    const nodeHeight = Number(sourceNode.height) || Number(sourceNode.style?.height) || defaultDims.height || 180

    const gap = 90
    let newX = sourceNode.position.x
    let newY = sourceNode.position.y
    let targetHandle: 'top' | 'bottom' | 'left' | 'right' = 'left'

    if (direction === 'right') {
      newX = sourceNode.position.x + nodeWidth + gap
      newY = sourceNode.position.y
      targetHandle = 'left'
    } else if (direction === 'left') {
      newX = sourceNode.position.x - nodeWidth - gap
      newY = sourceNode.position.y
      targetHandle = 'right'
    } else if (direction === 'bottom') {
      newX = sourceNode.position.x
      newY = sourceNode.position.y + nodeHeight + gap
      targetHandle = 'top'
    } else if (direction === 'top') {
      newX = sourceNode.position.x
      newY = sourceNode.position.y - nodeHeight - gap
      targetHandle = 'bottom'
    }

    const newNodeId = `${sourceNode.type || 'node'}-${Date.now()}`
    
    // Clone data cleanly based on node type
    const clonedData: Record<string, any> = { ...(sourceNode.data || {}), id: newNodeId }
    if (sourceNode.type === 'shape') {
      clonedData.label = ''
    } else if (sourceNode.type === 'stickyNote') {
      clonedData.title = 'New Note'
      clonedData.body = ''
    } else if (sourceNode.type === 'canvasText') {
      clonedData.text = 'Text'
    }

    const newNode: Node = {
      id: newNodeId,
      type: sourceNode.type,
      position: { x: Math.round(newX), y: Math.round(newY) },
      style: { ...sourceNode.style, width: nodeWidth, height: nodeHeight },
      data: clonedData,
      selected: true
    }

    const markers = getEdgeMarkerConfig(
      defaultArrowSettings.arrowDirection,
      defaultArrowSettings.strokeColor || themeTokens.accent,
      defaultArrowSettings.strokeWidth
    )

    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: sourceNode.id,
      target: newNodeId,
      sourceHandle: direction,
      targetHandle: targetHandle,
      type: 'whiteboardEdge',
      animated: defaultArrowSettings.isAnimated,
      style: { stroke: defaultArrowSettings.strokeColor, strokeWidth: defaultArrowSettings.strokeWidth },
      data: {
        ...defaultArrowSettings,
        sourceHandle: direction,
        targetHandle: targetHandle,
        label: ''
      },
      markerEnd: markers.markerEnd,
      markerStart: markers.markerStart
    }

    setNodes((nds) => {
      const unselected = nds.map((n) => ({ ...n, selected: false }))
      const updated = [...unselected, newNode]
      setEdges((eds) => {
        const updatedEdges = [...eds, newEdge]
        if (currentCanvas) {
          saveCanvasNodesAndEdges(currentCanvas.id, updated, updatedEdges)
        }
        return updatedEdges
      })
      return updated
    })

    addToast('Connected element created', 'success')
  }, [reactFlowInstance, nodes, edges, takeSnapshot, defaultArrowSettings, themeTokens.accent, currentCanvas, saveCanvasNodesAndEdges, addToast])

  // Update selected edge properties live
  const handleUpdateEdge = useCallback((id: string, updates: Partial<WhiteboardEdgeData>) => {
    setEdges((eds) => {
      const updated = eds.map((e) => {
        if (e.id === id) {
          const newData = { ...e.data, ...updates }
          const markers = getEdgeMarkerConfig(
            newData.arrowDirection,
            newData.strokeColor ?? e.style?.stroke,
            newData.strokeWidth ?? e.style?.strokeWidth
          )
          return {
            ...e,
            type: 'whiteboardEdge',
            data: newData,
            animated: newData.isAnimated,
            style: {
              ...e.style,
              stroke: newData.strokeColor ?? e.style?.stroke,
              strokeWidth: newData.strokeWidth ?? e.style?.strokeWidth
            },
            markerEnd: markers.markerEnd,
            markerStart: markers.markerStart
          }
        }
        return e
      })
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, nodes, updated)
      }
      return updated
    })
  }, [currentCanvas, nodes, saveCanvasNodesAndEdges])

  const updateSelectedEdge = useCallback((updates: Partial<WhiteboardEdgeData>) => {
    if (selectedEdgeId) handleUpdateEdge(selectedEdgeId, updates)
  }, [selectedEdgeId, handleUpdateEdge])

  // Reverse source and target on connection and reverse waypoints
  const handleReverseEdge = useCallback((edgeId: string) => {
    setEdges((eds) => {
      const updated = eds.map((e) => {
        if (e.id === edgeId) {
          const prevData = (e.data || {}) as WhiteboardEdgeData
          const reversedWaypoints = prevData.waypoints
            ? [...prevData.waypoints].reverse()
            : undefined

          const arrowDir = prevData.arrowDirection || 'end'
          const strokeColor = prevData.strokeColor ?? e.style?.stroke ?? themeTokens.accent
          const strokeWidth = prevData.strokeWidth ?? e.style?.strokeWidth ?? 2
          const markers = getEdgeMarkerConfig(arrowDir, strokeColor, strokeWidth)

          return {
            ...e,
            source: e.target,
            target: e.source,
            sourceHandle: e.targetHandle,
            targetHandle: e.sourceHandle,
            data: {
              ...prevData,
              waypoints: reversedWaypoints
            },
            markerEnd: markers.markerEnd,
            markerStart: markers.markerStart
          }
        }
        return e
      })
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, nodes, updated)
      }
      return updated
    })
    addToast('Reversed connection direction', 'info')
  }, [currentCanvas, nodes, saveCanvasNodesAndEdges, themeTokens.accent, addToast])

  const handleReverseEdgeDirection = useCallback(() => {
    if (selectedEdgeId) handleReverseEdge(selectedEdgeId)
  }, [selectedEdgeId, handleReverseEdge])

  // Delete edge
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => {
      const updated = eds.filter((e) => e.id !== edgeId)
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, nodes, updated)
      }
      return updated
    })
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null)
    addToast('Connection deleted', 'info')
  }, [selectedEdgeId, currentCanvas, nodes, saveCanvasNodesAndEdges, addToast])

  const handleDeleteSelectedEdge = useCallback(() => {
    if (selectedEdgeId) handleDeleteEdge(selectedEdgeId)
  }, [selectedEdgeId, handleDeleteEdge])

  // Update waypoints on edge
  const handleUpdateWaypoints = useCallback((edgeId: string, waypoints: Point[] | undefined) => {
    setEdges((eds) => {
      const updated = eds.map((e) => {
        if (e.id === edgeId) {
          return {
            ...e,
            data: {
              ...(e.data || {}),
              waypoints
            }
          }
        }
        return e
      })
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, nodes, updated)
      }
      return updated
    })
  }, [currentCanvas, nodes, saveCanvasNodesAndEdges])

  const edgeActionsValue = useMemo<EdgeActionContextType>(() => ({
    updateEdge: handleUpdateEdge,
    reverseEdge: handleReverseEdge,
    deleteEdge: handleDeleteEdge,
    updateWaypoints: handleUpdateWaypoints
  }), [handleUpdateEdge, handleReverseEdge, handleDeleteEdge, handleUpdateWaypoints])

  const quickConnectValue = useMemo(() => ({
    quickConnect: handleQuickConnect
  }), [handleQuickConnect])

  // Window-level Del / Backspace shortcut listener for Whiteboard elements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isDelete = e.key === 'Delete' || e.key === 'Del' || e.key === 'Backspace'
      if (!isDelete) return

      // Don't intercept when user is typing in inputs, textareas, contenteditable, or sticky notes
      const activeEl = document.activeElement as HTMLElement | null
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable ||
         activeEl.closest('[contenteditable="true"]') ||
         activeEl.closest('.tiptap') ||
         activeEl.closest('textarea') ||
         activeEl.closest('input'))
      ) {
        return
      }

      // 1. If an edge is selected
      if (selectedEdgeId) {
        e.preventDefault()
        handleDeleteEdge(selectedEdgeId)
        return
      }
      const selectedEdge = edges.find((ed) => ed.selected)
      if (selectedEdge) {
        e.preventDefault()
        handleDeleteEdge(selectedEdge.id)
        return
      }

      // 2. If one or more nodes are selected
      const currentNodes = reactFlowInstance.getNodes()
      const selectedNodes = currentNodes.filter((n) => n.selected)
      if (selectedNodes.length > 0) {
        e.preventDefault()
        const selectedIds = new Set(selectedNodes.map((n) => n.id))
        setNodes((nds) => {
          const updated = nds.filter((n) => !selectedIds.has(n.id))
          if (currentCanvas) {
            saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
          }
          return updated
        })
        addToast(`Deleted ${selectedNodes.length} canvas element${selectedNodes.length > 1 ? 's' : ''}`, 'info')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEdgeId, edges, reactFlowInstance, currentCanvas, setNodes, saveCanvasNodesAndEdges, handleDeleteEdge, addToast])

  // Smart snapping node movement & saving with trailing debounce (Alt key bypasses)
  const handleNodesChangeWrapped = useCallback((changes: any) => {
    if (smartSnapEnabled && !isAltPressedRef.current) {
      const posChanges = changes.filter((c: any) => c.type === 'position' && c.dragging && c.position)
      if (posChanges.length === 1) {
        const posChange = posChanges[0]
        const dragged = nodes.find((n) => n.id === posChange.id)
        if (dragged) {
          const dW = Number(dragged.style?.width ?? dragged.data?.width ?? 180)
          const dH = Number(dragged.style?.height ?? dragged.data?.height ?? 250)
          const others = nodes
            .filter((n) => n.id !== dragged.id && !n.selected)
            .map((n) => ({
              id: n.id,
              x: n.position.x,
              y: n.position.y,
              width: Number(n.style?.width ?? n.data?.width ?? 180),
              height: Number(n.style?.height ?? n.data?.height ?? 250)
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

    if (nodeChangeTimerRef.current) {
      clearTimeout(nodeChangeTimerRef.current)
    }
    nodeChangeTimerRef.current = setTimeout(() => {
      if (currentCanvas) {
        saveCanvasNodesAndEdges(currentCanvas.id, reactFlowInstance.getNodes(), edges)
      }
    }, 250)
  }, [nodes, onNodesChange, smartSnapEnabled, snapGuides.length, currentCanvas, edges, saveCanvasNodesAndEdges, reactFlowInstance])

  const handleNodeDragStop = useCallback(() => {
    setSnapGuides([])
    if (currentCanvas) {
      saveCanvasNodesAndEdges(currentCanvas.id, reactFlowInstance.getNodes(), edges)
    }
  }, [currentCanvas, edges, saveCanvasNodesAndEdges, reactFlowInstance])

  // Insert image node at specified position
  const insertImageNode = useCallback((src: string, pos: { x: number; y: number }, captionName?: string) => {
    const img = new Image()
    img.onload = () => {
      const origW = img.naturalWidth || 300
      const origH = img.naturalHeight || 200
      const maxW = 320
      const scale = Math.min(1, maxW / origW)
      const width = Math.max(120, Math.round(origW * scale))
      const height = Math.max(90, Math.round(origH * scale))

      const newNode: Node = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'canvasImage',
        position: { x: Math.round(pos.x - width / 2), y: Math.round(pos.y - height / 2) },
        style: { width, height },
        data: {
          src,
          caption: captionName || '',
          width,
          height,
          hasFrame: true,
          borderRadius: 'sm'
        }
      }
      setNodes((nds) => {
        const updated = [...nds, newNode]
        if (currentCanvas) {
          saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
        }
        return updated
      })
      addToast('Image placed on canvas', 'success')
    }
    img.onerror = () => {
      const newNode: Node = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'canvasImage',
        position: { x: Math.round(pos.x - 140), y: Math.round(pos.y - 105) },
        style: { width: 280, height: 210 },
        data: {
          src,
          caption: captionName || '',
          width: 280,
          height: 210,
          hasFrame: true,
          borderRadius: 'sm'
        }
      }
      setNodes((nds) => {
        const updated = [...nds, newNode]
        if (currentCanvas) {
          saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
        }
        return updated
      })
      addToast('Image placed on canvas', 'info')
    }
    img.src = src
  }, [currentCanvas, edges, saveCanvasNodesAndEdges, addToast])

  // Direct Image Drag and Drop Handlers
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setIsDraggingOver(true)
  }, [])

  const handleCanvasDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }, [])

  const handleCanvasDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as globalThis.Node)) {
      setIsDraggingOver(false)
    }
  }, [])

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)

    const dropPos = reactFlowInstance.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY
    })

    // 1. Check for files (local drag from Windows Explorer, Finder, desktop)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i]
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (loadEv) => {
            const dataUrl = loadEv.target?.result as string
            insertImageNode(dataUrl, { x: dropPos.x + i * 30, y: dropPos.y + i * 30 }, file.name.replace(/\.[^/.]+$/, ''))
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }

    // 2. Check for HTML data (dragged image from Chrome, Edge, Safari, Firefox web page)
    const htmlData = e.dataTransfer.getData('text/html')
    if (htmlData) {
      const match = htmlData.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (match && match[1]) {
        insertImageNode(match[1], dropPos)
        return
      }
    }

    // 3. Check for URI list (dragged link or image URL from browser)
    const uriList = e.dataTransfer.getData('text/uri-list')
    if (uriList) {
      const firstUri = uriList.split('\n')[0].trim()
      if (firstUri && (firstUri.startsWith('http') || firstUri.startsWith('data:image/'))) {
        insertImageNode(firstUri, dropPos)
        return
      }
    }

    // 4. Check for plain text (image URL)
    const plainText = e.dataTransfer.getData('text/plain')?.trim()
    if (plainText && (
      plainText.startsWith('data:image/') ||
      plainText.match(/\.(jpeg|jpg|gif|png|webp|svg|avif)($|\?)/i) ||
      plainText.startsWith('http')
    )) {
      insertImageNode(plainText, dropPos)
      return
    }
  }, [reactFlowInstance, insertImageNode])

  // Global paste handler for image and text data
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.isContentEditable ||
         target.closest('[contenteditable="true"]') ||
         target.closest('.tiptap') ||
         target.closest('textarea') ||
         target.closest('input'))
      ) {
        return
      }

      // Target position: use mouse position if available, fallback to center of viewport
      const screenPos = lastMousePosRef.current || {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2
      }
      const pastePos = reactFlowInstance.screenToFlowPosition({
        x: screenPos.clientX,
        y: screenPos.clientY
      })

      // 1. Check for files (e.g. copied file or screenshot blob)
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i]
          if (file.type.startsWith('image/')) {
            e.preventDefault()
            const reader = new FileReader()
            reader.onload = (loadEv) => {
              const dataUrl = loadEv.target?.result as string
              insertImageNode(dataUrl, pastePos, file.name.replace(/\.[^/.]+$/, ''))
            }
            reader.readAsDataURL(file)
            return
          }
        }
      }

      // 2. Check for clipboard items (e.g. Snipping Tool, copied browser image)
      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i]
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
              e.preventDefault()
              const reader = new FileReader()
              reader.onload = (loadEv) => {
                const dataUrl = loadEv.target?.result as string
                insertImageNode(dataUrl, pastePos, 'Pasted Image')
              }
              reader.readAsDataURL(file)
              return
            }
          }
        }
      }

      // 3. Check for HTML data containing <img>
      const htmlData = e.clipboardData?.getData('text/html')
      if (htmlData) {
        const match = htmlData.match(/<img[^>]+src=["']([^"']+)["']/i)
        if (match && match[1]) {
          e.preventDefault()
          insertImageNode(match[1], pastePos, 'Pasted Image')
          return
        }
      }

      // 4. Check for plain text
      const plainText = e.clipboardData?.getData('text/plain')
      if (plainText && plainText.trim().length > 0) {
        const trimmed = plainText.trim()

        // Check if text is an image URL
        if (
          trimmed.startsWith('data:image/') ||
          trimmed.match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg|avif)(\?.*)?$/i)
        ) {
          e.preventDefault()
          insertImageNode(trimmed, pastePos, 'Pasted Image')
          return
        }

        // Paste text note onto canvas with auto-wrap
        e.preventDefault()
        const lines = trimmed.split('\n')
        const maxLineLen = Math.max(...lines.map((l) => l.length))
        const width = Math.min(480, Math.max(220, Math.round(Math.min(maxLineLen, 50) * 8.5 + 40)))
        const approxHeight = Math.max(44, Math.min(500, Math.round(lines.length * 22 + 24)))

        const newNode: Node = {
          id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'canvasText',
          position: {
            x: Math.round(pastePos.x - width / 2),
            y: Math.round(pastePos.y - approxHeight / 2)
          },
          style: { width, height: approxHeight },
          data: {
            text: trimmed,
            width,
            height: approxHeight,
            textAlign: 'left',
            fontFamily: 'serif',
            fontSize: 'base'
          }
        }

        setNodes((nds) => {
          const updated = [...nds, newNode]
          if (currentCanvas) {
            saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
          }
          return updated
        })
        addToast('Pasted text to canvas', 'success')
        return
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [reactFlowInstance, insertImageNode, currentCanvas, edges, saveCanvasNodesAndEdges, addToast])

  // Add a Sticky Note at center of viewport
  const handleAddStickyNote = () => {
    takeSnapshot()
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
    addToast('Added Note', 'success')
  }

  // Add Geometric Shape (supports all 12 shape types)
  const handleAddShape = (shapeType: WhiteboardShapeType) => {
    takeSnapshot()
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
      data: { shapeType, color: '#ffffff', text: '', width: 160, height: 120, rotation: 0 }
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
    takeSnapshot()
    const center = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    })
    const newNode: Node = {
      id: `text-${Date.now()}`,
      type: 'canvasText',
      position: { x: center.x - 120, y: center.y - 22 },
      style: { width: 240, height: 44 },
      data: { text: 'Annotation', width: 240, height: 44 }
    }
    setNodes((nds) => {
      const updated = [...nds, newNode]
      if (currentCanvas) saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
      return updated
    })
    addToast('Added Text', 'success')
  }

  // Drop Lore Card from Entity
  const handleDropCard = (entity: LoreEntity) => {
    takeSnapshot()
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
          strokeWidth: penWidth
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
      addToast('Drawing created', 'info')
    }

    setCurrentStroke([])
  }

  // Active world entities for the card picker
  const worldEntities = entities[worldId] || []

  return (
    <CanvasPeekContext.Provider value={{ openPeek: (id) => setPeekEntityId(id) }}>
      <div 
        ref={containerRef}
      className="relative w-full h-full bg-oros-950 overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleCanvasDragOver}
      onDragEnter={handleCanvasDragEnter}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
    >
      {/* React Flow Infinite Canvas */}
      <EdgeActionContext.Provider value={edgeActionsValue}>
        <CanvasQuickConnectContext.Provider value={quickConnectValue}>
          <ReactFlow
          nodes={nodes}
          edges={edges}
          colorMode={isLight ? 'light' : 'dark'}
          onNodesChange={handleNodesChangeWrapped}
          onEdgesChange={onEdgesChange}
          onMove={(_, vp) => setViewport(vp)}
          onNodeDragStart={() => takeSnapshot()}
          // Multi-selection is handled natively via multiSelectionKeyCode
          onNodesDelete={(deleted) => {
            takeSnapshot()
            const delIds = new Set(deleted.map((n) => n.id))
            setNodes((nds) => {
              const updated = nds.filter((n) => !delIds.has(n.id))
              if (currentCanvas) {
                saveCanvasNodesAndEdges(currentCanvas.id, updated, edges)
              }
              return updated
            })
          }}
          onEdgesDelete={(deleted) => {
            takeSnapshot()
            const delIds = new Set(deleted.map((e) => e.id))
            setEdges((eds) => {
              const updated = eds.filter((e) => !delIds.has(e.id))
              if (currentCanvas) {
                saveCanvasNodesAndEdges(currentCanvas.id, nodes, updated)
              }
              return updated
            })
          }}
          onConnect={(connection) => {
            takeSnapshot()
            onConnect(connection)
          }}
          onNodeDragStop={handleNodeDragStop}
          onEdgeClick={(e, edge) => {
            e.stopPropagation()
            setSelectedEdgeId(edge.id)
            setEdges((eds) => eds.map((ed) => ({ ...ed, selected: ed.id === edge.id })))
          }}
          onPaneClick={() => {
            setSelectedEdgeId(null)
            setShowDefaultArrowOptions(false)
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'whiteboardEdge' }}
          fitView
          deleteKeyCode={['Backspace', 'Delete', 'Del']}
          panOnDrag={activeTool === 'pan' ? true : [1, 2]}
          selectionOnDrag={activeTool === 'select'}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
          zoomOnScroll={true}
          minZoom={0.2}
          maxZoom={2.5}
          connectionMode={ConnectionMode.Loose}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: defaultArrowSettings.strokeColor || themeTokens.accent, strokeWidth: defaultArrowSettings.strokeWidth || 2 }}
          className={activeTool === 'pen' ? 'cursor-crosshair' : activeTool === 'pan' ? 'cursor-grab' : 'cursor-default'}
        >
          {/* Atmospheric Accent-Tinted Dotted Grid */}
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1.4} 
            color={themeTokens.dots} 
          />

          {/* Live Active Stroke Preview during Pen Drawing */}
          {isDrawing && currentStroke.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-30">
              <g transform={`translate(${reactFlowInstance.getViewport().x}, ${reactFlowInstance.getViewport().y}) scale(${reactFlowInstance.getViewport().zoom})`}>
                <path
                  d={pointsToSvgPath(currentStroke)}
                  stroke={penColor}
                  strokeWidth={penWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          )}

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
        </ReactFlow>
      </CanvasQuickConnectContext.Provider>
    </EdgeActionContext.Provider>

      {/* Direct Image Drop Zone Feedback Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-accent-muted/20 border-2 border-dashed border-accent z-40 pointer-events-none flex items-center justify-center backdrop-blur-[1px] animate-fadeIn">
          <div className="px-5 py-3 rounded-[6px] bg-oros-900 border border-accent shadow-2xl flex items-center gap-3 text-sm font-medium text-oros-100 animate-dropdown-in">
            <div className="p-2 rounded-[4px] bg-accent/20 text-accent">
              <ImageIcon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-semibold text-oros-100">Drop image to place on canvas</div>
              <div className="text-[11px] text-oros-400 font-sans">Accepts files from File Explorer or images from Chrome & web</div>
            </div>
          </div>
        </div>
      )}



      {/* Top-Left Canvas Name & Switcher Dropdown */}
      <div className="absolute top-3.5 left-3.5 z-20">
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
              className="px-2.5 py-1 rounded-[3px] bg-oros-950 border border-oros-600 text-xs font-medium text-oros-100 shadow-lg outline-none font-sans"
            />
          ) : (
            <button
              onClick={() => setShowCanvasDropdown(!showCanvasDropdown)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-[3px] bg-oros-900 hover:bg-oros-850 border border-oros-750 text-xs font-medium text-oros-200 shadow-md transition-colors"
            >
              <span>{currentCanvas?.name || 'New Canvas'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-oros-400" />
            </button>
          )}

          {showCanvasDropdown && (
            <div className="absolute left-0 mt-1.5 w-56 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl py-1 z-30 animate-dropdown-in">
              <div className="px-2.5 py-1 text-[10px] font-mono text-oros-500 uppercase tracking-wider">
                Canvases
              </div>
              {worldCanvases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCanvasId(c.id)
                    setShowCanvasDropdown(false)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between hover:bg-oros-850 transition-colors ${
                    c.id === currentCanvas?.id ? 'text-oros-100 font-medium bg-oros-850' : 'text-oros-300'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  {c.id === currentCanvas?.id && <Check className="w-3.5 h-3.5 text-oros-400 shrink-0" />}
                </button>
              ))}
              <div className="border-t border-oros-800 my-1" />
              <button
                onClick={() => {
                  setShowCanvasDropdown(false)
                  setRenameValue(currentCanvas?.name || '')
                  setIsRenamingCanvas(true)
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-oros-300 hover:bg-oros-850 hover:text-oros-100 transition-colors"
              >
                Rename Canvas
              </button>
              <button
                onClick={() => {
                  setShowCanvasDropdown(false)
                  const c = createCanvas(`Canvas ${Date.now().toString().slice(-4)}`)
                  addToast(`Created ${c.name}`, 'success')
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-oros-200 hover:bg-oros-850 flex items-center gap-1.5 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-oros-400" />
                <span>New Canvas</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top-Right Canvas Actions (Export Dropdown) */}
      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
        <ExportDropdown options={canvasExportOptions} align="right" />
      </div>

      {/* UNIFIED MULTI-SELECT BOUNDING BOX & FLOATING POPUP TOOLBAR */}
      {screenBounds && (
        <div
          style={{
            position: 'absolute',
            left: screenBounds.left,
            top: screenBounds.top,
            width: screenBounds.width,
            height: screenBounds.height,
            pointerEvents: 'none',
            zIndex: 25
          }}
        >
          {/* Unified dashed selection boundary */}
          <div className="w-full h-full border-2 border-dashed border-accent/80 rounded-lg bg-accent/5 relative">
            {/* 4 corner markers */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-accent border-2 border-oros-950 rounded-[2px]" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-accent border-2 border-oros-950 rounded-[2px]" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-accent border-2 border-oros-950 rounded-[2px]" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-accent border-2 border-oros-950 rounded-[2px]" />
          </div>

          {/* Unified Floating Popup Toolbar */}
          <div
            style={{
              position: 'absolute',
              top: -46,
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'auto'
            }}
            className="flex items-center gap-1.5 bg-oros-900/95 backdrop-blur-md border border-oros-750 px-2.5 py-1 rounded-full shadow-2xl animate-dropdown-in select-none z-30"
          >
            <span className="font-mono text-[10px] text-accent font-semibold px-2 py-0.5 bg-accent/15 border border-accent/30 rounded-full shrink-0">
              {selectedNodes.length} items
            </span>

            <div className="w-[1px] h-3.5 bg-oros-800 mx-0.5" />

            {/* Move Together Drag Handle */}
            <div
              onMouseDown={handleMultiMoveDragStart}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-oros-800 text-oros-300 hover:text-white text-xs cursor-grab active:cursor-grabbing transition-colors"
              title="Drag here to move all selected items"
            >
              <Move className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Move</span>
            </div>

            <div className="w-[1px] h-3.5 bg-oros-800 mx-0.5" />

            {/* Batch Duplicate */}
            <button
              type="button"
              onClick={handleDuplicateSelected}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-oros-800 text-oros-300 hover:text-white text-xs transition-colors cursor-pointer"
              title="Duplicate selected items (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-medium">Duplicate</span>
            </button>

            <div className="w-[1px] h-3.5 bg-oros-800 mx-0.5" />

            {/* Batch Duplicate */}
            <button
              type="button"
              onClick={handleDuplicateSelected}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-oros-800 text-oros-300 hover:text-white text-xs transition-colors cursor-pointer"
              title="Duplicate selected items (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-medium">Duplicate</span>
            </button>

            <div className="w-[1px] h-3.5 bg-oros-800 mx-0.5" />

            {/* Batch Delete */}
            <button
              onClick={handleBatchDeleteSelected}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 text-xs transition-colors cursor-pointer"
              title="Delete selected items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Delete</span>
            </button>

            <div className="w-[1px] h-3.5 bg-oros-800 mx-0.5" />

            {/* Deselect All */}
            <button
              onClick={handleDeselectAll}
              className="p-1 rounded-full hover:bg-oros-800 text-oros-400 hover:text-oros-200 transition-colors cursor-pointer"
              title="Deselect all (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BOTTOM CONSOLE DOCK */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 select-none">
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-[4px] bg-oros-900 border border-oros-750 shadow-2xl">
          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={historyCount.past === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-[3px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            onClick={handleRedo}
            disabled={historyCount.future === 0}
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            className="p-1.5 rounded-[3px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-oros-800 mx-0.5" />

          {/* 1. Select Tool (Pointer) */}
          <button
            onClick={() => {
              setActiveTool('select')
              setShowPenOptions(false)
              setShowDefaultArrowOptions(false)
            }}
            title="Select (V)"
            className={`p-1.5 rounded-[3px] transition-colors ${
              activeTool === 'select'
                ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850 border border-transparent'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>

          {/* 2. Pan / Hand Tool */}
          <button
            onClick={() => {
              setActiveTool('pan')
              setShowPenOptions(false)
              setShowDefaultArrowOptions(false)
            }}
            title="Pan (H)"
            className={`p-1.5 rounded-[3px] transition-colors ${
              activeTool === 'pan'
                ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850 border border-transparent'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          {/* 3. Smart Snapping Toggle */}
          <button
            onClick={() => {
              const next = !smartSnapEnabled
              setSmartSnapEnabled(next)
              addToast(next ? 'Snapping on' : 'Snapping off', 'info')
            }}
            title={`Smart Snapping: ${smartSnapEnabled ? 'ON (Hold Alt while dragging to temporarily bypass)' : 'OFF'}`}
            className={`p-1.5 rounded-[3px] transition-colors ${
              smartSnapEnabled
                ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                : 'text-oros-500 hover:text-oros-300 hover:bg-oros-850 border border-transparent'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-oros-800 mx-0.5" />

          {/* 4. Shapes Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowShapePicker(!showShapePicker)
                setShowPenOptions(false)
                setShowCardPicker(false)
                setShowDefaultArrowOptions(false)
              }}
              title="Shapes"
              className={`p-1.5 rounded-[3px] transition-colors ${
                showShapePicker
                  ? 'bg-accent-muted text-accent border border-accent/40'
                  : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850 border border-transparent'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
            </button>

            {showShapePicker && (
              <div className="absolute bottom-11 left-1/2 -translate-x-1/2 bg-oros-900 border border-oros-750 rounded-[6px] shadow-2xl p-2 z-30 animate-dropdown-in w-60 select-none text-oros-100">
                <div className="text-[10px] font-mono text-oros-400 uppercase tracking-wider mb-1.5 px-0.5 font-bold">
                  Shapes
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { type: 'rectangle', label: 'Rectangle', icon: <Square className="w-3.5 h-3.5" /> },
                    { type: 'circle', label: 'Circle', icon: <Circle className="w-3.5 h-3.5" /> },
                    { type: 'diamond', label: 'Diamond', icon: <Diamond className="w-3.5 h-3.5" /> },
                    { type: 'parallelogram', label: 'Parallelogram', icon: <span className="font-mono text-xs font-bold italic">▱</span> },
                    { type: 'triangle', label: 'Triangle', icon: <Triangle className="w-3.5 h-3.5" /> },
                    { type: 'star', label: 'Star', icon: <Star className="w-3.5 h-3.5" /> },
                    { type: 'hexagon', label: 'Hexagon', icon: <Hexagon className="w-3.5 h-3.5" /> },
                    { type: 'octagon', label: 'Octagon', icon: <Octagon className="w-3.5 h-3.5" /> },
                    { type: 'cylinder', label: 'Cylinder', icon: <Cylinder className="w-3.5 h-3.5" /> },
                    { type: 'cloud', label: 'Cloud', icon: <Cloud className="w-3.5 h-3.5" /> },
                    { type: 'speech', label: 'Speech', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                    { type: 'arrow', label: 'Arrow', icon: <ArrowRight className="w-3.5 h-3.5" /> },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleAddShape(item.type as WhiteboardShapeType)}
                      title={item.label}
                      className="p-1.5 rounded hover:bg-oros-800 text-oros-300 hover:text-white flex flex-col items-center justify-center gap-0.5 transition-colors border border-transparent hover:border-oros-700 cursor-pointer"
                    >
                      {item.icon}
                      <span className="text-[9px] font-mono truncate w-full text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Sticky Note Button */}
          <button
            onClick={handleAddStickyNote}
            title="Sticky Note"
            className="p-1.5 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5" />
          </button>

          {/* 6. Lore Card Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCardPicker(!showCardPicker)
                setShowPenOptions(false)
                setShowShapePicker(false)
                setShowDefaultArrowOptions(false)
              }}
              title="Cards"
              className="p-1.5 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {showCardPicker && (
              <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-64 bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-1.5 max-h-72 overflow-y-auto z-30 animate-dropdown-in">
                <div className="px-2 py-1 text-[10px] font-mono text-oros-500 uppercase tracking-wider">
                  Cards
                </div>
                {worldEntities.map((ent) => (
                  <button
                    key={ent.id}
                    onClick={() => handleDropCard(ent)}
                    className="w-full text-left p-1.5 rounded-[2px] hover:bg-oros-850 flex items-center gap-2 text-xs text-oros-200 transition-colors"
                  >
                    {ent.avatar ? (
                      <img
                        src={ent.avatar}
                        alt={ent.title}
                        className="w-5 h-5 rounded-[2px] object-cover border border-oros-800"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-[2px] bg-oros-800 border border-oros-750 flex items-center justify-center shrink-0">
                        <OrosLogoMark className="w-3.5 h-3.5 text-oros-500" />
                      </div>
                    )}
                    <div className="truncate flex-1">
                      <div className="font-medium truncate text-oros-200">{ent.title}</div>
                      <div className="text-[10px] text-oros-500 font-mono capitalize">{ent.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-oros-800 mx-0.5" />

          {/* 7. Connection Arrow Defaults Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDefaultArrowOptions(!showDefaultArrowOptions)
                setShowPenOptions(false)
                setShowShapePicker(false)
                setShowCardPicker(false)
              }}
              title="Connections"
              className={`p-1.5 rounded-[3px] transition-colors flex items-center gap-1 ${
                showDefaultArrowOptions
                  ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                  : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" 
                style={{ backgroundColor: defaultArrowSettings.strokeColor || themeTokens.accent }} 
              />
            </button>

            {/* Default Arrow Settings Popover */}
            {showDefaultArrowOptions && (
              <div 
                className="absolute bottom-11 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-oros-900 border border-oros-750 rounded-[4px] p-2.5 shadow-2xl z-40 w-72 animate-dropdown-in select-none text-oros-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-oros-800 text-[10px] font-mono uppercase font-bold text-oros-400 tracking-wider">
                  <span>Default Arrow Style</span>
                  <button
                    type="button"
                    onClick={() => setShowDefaultArrowOptions(false)}
                    className="p-0.5 rounded text-oros-500 hover:text-oros-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Route shape */}
                <div className="mb-2">
                  <div className="text-[10px] font-mono text-oros-400 mb-1">Route Type</div>
                  <div className="grid grid-cols-3 gap-1 bg-oros-950/70 p-1 rounded-[3px] border border-oros-800 text-[10px] font-mono">
                    {(['smoothstep', 'bezier', 'straight'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDefaultArrowSettings((prev) => ({ ...prev, edgeType: t }))}
                        className={`py-0.5 rounded-[2px] capitalize transition-colors ${
                          defaultArrowSettings.edgeType === t
                            ? 'bg-oros-800 text-accent font-semibold border border-oros-700'
                            : 'text-oros-400 hover:text-oros-200'
                        }`}
                      >
                        {t === 'smoothstep' ? 'Step' : t === 'bezier' ? 'Curve' : 'Line'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arrowheads & Pattern */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <div className="text-[10px] font-mono text-oros-400 mb-1">Arrowheads</div>
                    <div className="grid grid-cols-3 gap-0.5 bg-oros-950/70 p-0.5 rounded-[3px] border border-oros-800 text-[10px] font-mono">
                      {[
                        { id: 'end', label: '->' },
                        { id: 'both', label: '<->' },
                        { id: 'none', label: '---' }
                      ].map((dir) => (
                        <button
                          key={dir.id}
                          type="button"
                          onClick={() => setDefaultArrowSettings((prev) => ({ ...prev, arrowDirection: dir.id as any }))}
                          className={`py-0.5 rounded-[2px] transition-colors ${
                            defaultArrowSettings.arrowDirection === dir.id
                              ? 'bg-oros-800 text-accent font-bold'
                              : 'text-oros-400 hover:text-oros-200'
                          }`}
                        >
                          {dir.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-oros-400 mb-1">Pattern</div>
                    <div className="grid grid-cols-3 gap-0.5 bg-oros-950/70 p-0.5 rounded-[3px] border border-oros-800 text-[10px] font-mono">
                      {(['solid', 'dashed', 'dotted'] as const).map((pat) => (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => setDefaultArrowSettings((prev) => ({ ...prev, strokePattern: pat }))}
                          className={`py-0.5 rounded-[2px] capitalize text-[9px] transition-colors ${
                            defaultArrowSettings.strokePattern === pat
                              ? 'bg-oros-800 text-accent font-semibold'
                              : 'text-oros-400 hover:text-oros-200'
                          }`}
                        >
                          {pat === 'solid' ? 'Solid' : pat === 'dashed' ? 'Dash' : 'Dot'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color swatches */}
                <div>
                  <div className="text-[10px] font-mono text-oros-400 mb-1">Default Color</div>
                  <div className="grid grid-cols-8 gap-1">
                    {[
                      { color: themeTokens.accent, label: 'Accent' },
                      { color: '#f5c542', label: 'Gold' },
                      { color: '#f43f5e', label: 'Crimson' },
                      { color: '#10b981', label: 'Emerald' },
                      { color: '#06b6d4', label: 'Cyan' },
                      { color: '#a855f7', label: 'Arcane' },
                      { color: '#ffffff', label: 'White' },
                      { color: '#64748b', label: 'Slate' }
                    ].map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setDefaultArrowSettings((prev) => ({ ...prev, strokeColor: c.color }))}
                        className={`w-full aspect-square rounded-[3px] border transition-transform flex items-center justify-center hover:scale-110 shadow-sm ${
                          (defaultArrowSettings.strokeColor || themeTokens.accent).toLowerCase() === c.color.toLowerCase()
                            ? 'ring-2 ring-white border-white scale-105'
                            : 'border-oros-750'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      >
                        {(defaultArrowSettings.strokeColor || themeTokens.accent).toLowerCase() === c.color.toLowerCase() && (
                          <Check className={`w-2.5 h-2.5 ${c.color === '#ffffff' || c.color === '#f5c542' ? 'text-black' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 8. Pen / Freehand Draw Tool with Options Popover */}
          <div className="relative">
            <button
              onClick={() => {
                if (activeTool !== 'pen') {
                  setActiveTool('pen')
                  setShowPenOptions(true)
                  setShowShapePicker(false)
                  setShowCardPicker(false)
                  setShowDefaultArrowOptions(false)
                } else {
                  setShowPenOptions(!showPenOptions)
                }
              }}
              title="Pen"
              className={`p-1.5 rounded-[3px] transition-colors flex items-center gap-1 ${
                activeTool === 'pen'
                  ? 'bg-accent-muted text-accent border border-accent/40 shadow-sm'
                  : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm" 
                style={{ backgroundColor: penColor }} 
              />
            </button>

            {/* Pen Options Popover (Thickness & Color) */}
            {showPenOptions && (
              <div 
                className="absolute bottom-11 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-oros-900 border border-oros-750 rounded-[4px] p-2.5 shadow-2xl z-40 w-64 animate-dropdown-in select-none text-oros-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-oros-800 text-[10px] font-mono uppercase font-bold text-oros-400 tracking-wider">
                  <span>Pen Settings</span>
                  <button
                    type="button"
                    onClick={() => setShowPenOptions(false)}
                    className="p-0.5 rounded text-oros-500 hover:text-oros-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Thickness Selector */}
                <div className="mb-2.5">
                  <div className="text-[10px] font-mono font-semibold uppercase text-oros-400 tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Stroke Weight</span>
                    <span className="text-accent font-bold">{penWidth}px</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 bg-oros-950/70 p-1 rounded-[3px] border border-oros-800">
                    {[
                      { width: 1.5, label: 'Fine' },
                      { width: 3.5, label: 'Med' },
                      { width: 6, label: 'Bold' },
                      { width: 10, label: 'Thick' }
                    ].map((th) => (
                      <button
                        key={th.width}
                        type="button"
                        onClick={() => setPenWidth(th.width)}
                        className={`py-1 rounded-[2px] flex flex-col items-center justify-center gap-1 transition-colors ${
                          penWidth === th.width
                            ? 'bg-oros-800 text-oros-100 border border-oros-700 shadow-sm'
                            : 'text-oros-400 hover:text-oros-200 hover:bg-oros-850'
                        }`}
                      >
                        <span 
                          className="rounded-full bg-current transition-all"
                          style={{ 
                            width: Math.min(14, th.width * 1.4 + 2), 
                            height: Math.min(14, th.width * 1.4 + 2) 
                          }}
                        />
                        <span className="text-[9px] font-mono">{th.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette Selector */}
                <div>
                  <div className="text-[10px] font-mono font-semibold uppercase text-oros-400 tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Stroke Color</span>
                    <span className="font-mono text-[9px] text-oros-400 uppercase">{penColor}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 mb-1">
                    {[
                      { color: '#f5c542', label: 'Gold' },
                      { color: '#ffffff', label: 'White' },
                      { color: '#f43f5e', label: 'Crimson' },
                      { color: '#10b981', label: 'Emerald' },
                      { color: '#06b6d4', label: 'Cyan' },
                      { color: '#f97316', label: 'Hazard' },
                      { color: '#a855f7', label: 'Arcane' },
                      { color: '#ec4899', label: 'Rose' },
                      { color: '#64748b', label: 'Slate' }
                    ].map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setPenColor(c.color)}
                        className={`w-full aspect-square rounded-[3px] border transition-transform flex items-center justify-center hover:scale-110 shadow-sm ${
                          penColor.toLowerCase() === c.color.toLowerCase()
                            ? 'ring-2 ring-accent border-white scale-105'
                            : 'border-oros-750'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      >
                        {penColor.toLowerCase() === c.color.toLowerCase() && (
                          <Check className={`w-3 h-3 ${c.color === '#ffffff' || c.color === '#f5c542' ? 'text-black' : 'text-white'}`} />
                        )}
                      </button>
                    ))}

                    {/* Custom Color Picker Swatch */}
                    <label
                      className="w-full aspect-square rounded-[3px] border border-oros-750 cursor-pointer overflow-hidden flex items-center justify-center hover:scale-110 transition-transform shadow-sm relative bg-oros-950"
                      title="Custom Color"
                    >
                      <input
                        type="color"
                        value={penColor}
                        onChange={(e) => setPenColor(e.target.value)}
                        className="opacity-0 w-0 h-0 absolute cursor-pointer"
                      />
                      <Palette className="w-3.5 h-3.5 text-oros-300" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 9. Freeform Text Tool */}
          <button
            onClick={() => {
              handleAddText()
              setShowPenOptions(false)
              setShowDefaultArrowOptions(false)
            }}
            title="Text (T)"
            className="p-1.5 rounded-[3px] text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slide-out Drawer / Popup: Card Quick-Peek Profile */}
      {peekEntity && (
        <aside className="absolute top-11 right-3 bottom-14 w-84 bg-oros-950/98 backdrop-blur-md border border-oros-800 shadow-2xl z-40 rounded-lg flex flex-col overflow-hidden animate-dropdown-in">
          <div className="p-3 border-b border-oros-800 flex items-center justify-between shrink-0 bg-oros-950/90">
            <span className="text-xs font-mono font-bold text-slate-200 tracking-wider uppercase flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-accent" />
              Quick Peek
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  openTab({
                    title: peekEntity.title,
                    type: 'wiki',
                    targetId: peekEntity.id
                  })
                }}
                className="px-2 py-1 rounded-md bg-oros-900 border border-oros-750 hover:border-oros-600 text-oros-300 hover:text-oros-100 text-[10px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open in Codex"
              >
                <ExternalLink className="w-3 h-3 text-accent" />
                <span>Open Codex</span>
              </button>
              <button
                onClick={() => setPeekEntityId(null)}
                className="p-1 rounded-md text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-3.5 overflow-y-auto flex-1">
            <QuickPeekCard
              entity={peekEntity}
              onClose={() => setPeekEntityId(null)}
            />
          </div>
        </aside>
      )}
    </div>
    </CanvasPeekContext.Provider>
  )
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WhiteboardCanvasContent {...props} />
    </ReactFlowProvider>
  )
}
