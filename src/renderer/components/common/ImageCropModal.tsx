import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Check, ZoomIn, ZoomOut, RotateCcw, Move, Sparkles } from 'lucide-react'

interface ImageCropModalProps {
  isOpen: boolean
  imageSrc: string
  aspectRatio?: number // default 16/9
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  aspectRatio = 16 / 9,
  onConfirm,
  onCancel
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 })
  const [containerSize, setContainerSize] = useState({ width: 480, height: 270 })
  
  // Crop transforms: zoom and pan offsets in pixels relative to container
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })
  const imageElementRef = useRef<HTMLImageElement | null>(null)
  const [safeImageSrc, setSafeImageSrc] = useState(imageSrc)

  // Ensure data URL to bypass CORS for canvas cropping
  useEffect(() => {
    let active = true
    if (!imageSrc) return

    if (imageSrc.startsWith('data:')) {
      setSafeImageSrc(imageSrc)
      return
    }

    // Attempt to convert to data URL for clean canvas export
    fetch(imageSrc, { mode: 'cors' })
      .then((res) => res.blob())
      .then((blob) => {
        if (!active) return
        const reader = new FileReader()
        reader.onload = () => {
          if (active && typeof reader.result === 'string') {
            setSafeImageSrc(reader.result)
          }
        }
        reader.readAsDataURL(blob)
      })
      .catch(() => {
        if (active) setSafeImageSrc(imageSrc)
      })

    return () => {
      active = false
    }
  }, [imageSrc])

  // Measure container dimensions
  useEffect(() => {
    if (!isOpen) return
    const updateContainerSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth || 480
        const h = Math.round(w / aspectRatio)
        setContainerSize({ width: w, height: h })
      }
    }
    updateContainerSize()
    window.addEventListener('resize', updateContainerSize)
    return () => window.removeEventListener('resize', updateContainerSize)
  }, [isOpen, aspectRatio])

  // Reset transforms when image or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0)
      setPan({ x: 0, y: 0 })
      setImageLoaded(false)
    }
  }, [isOpen, safeImageSrc])

  // Calculate base scale so image fills container without letterboxing
  const baseScale = Math.max(
    containerSize.width / (naturalSize.width || 1),
    containerSize.height / (naturalSize.height || 1)
  )

  const currentScale = baseScale * zoom
  const renderedWidth = naturalSize.width * currentScale
  const renderedHeight = naturalSize.height * currentScale

  // Clamp pan so image never exposes black background
  const clampPan = useCallback(
    (x: number, y: number, currentZoom: number) => {
      const scale = baseScale * currentZoom
      const w = naturalSize.width * scale
      const h = naturalSize.height * scale

      const minX = containerSize.width - w
      const maxX = 0
      const minY = containerSize.height - h
      const maxY = 0

      const clampedX = minX >= 0 ? (containerSize.width - w) / 2 : Math.min(maxX, Math.max(minX, x))
      const clampedY = minY >= 0 ? (containerSize.height - h) / 2 : Math.min(maxY, Math.max(minY, y))

      return { x: clampedX, y: clampedY }
    },
    [baseScale, containerSize, naturalSize]
  )

  // Image load handler
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    imageElementRef.current = img
    setNaturalSize({ width: img.naturalWidth || 800, height: img.naturalHeight || 450 })
    setImageLoaded(true)

    // Center image initially
    const initialBase = Math.max(
      containerSize.width / (img.naturalWidth || 1),
      containerSize.height / (img.naturalHeight || 1)
    )
    const initW = img.naturalWidth * initialBase
    const initH = img.naturalHeight * initialBase
    setPan({
      x: (containerSize.width - initW) / 2,
      y: (containerSize.height - initH) / 2
    })
  }

  // Mouse / Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartRef.current.mouseX
      const dy = e.clientY - dragStartRef.current.mouseY
      const newX = dragStartRef.current.panX + dx
      const newY = dragStartRef.current.panY + dy
      setPan(clampPan(newX, newY, zoom))
    },
    [isDragging, clampPan, zoom]
  )

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.0015
    const newZoom = Math.min(3.0, Math.max(1.0, zoom + delta))
    setZoom(newZoom)
    setPan((prev) => clampPan(prev.x, prev.y, newZoom))
  }

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom)
    setPan((prev) => clampPan(prev.x, prev.y, newZoom))
  }

  const handleReset = () => {
    setZoom(1.0)
    const initW = naturalSize.width * baseScale
    const initH = naturalSize.height * baseScale
    setPan({
      x: (containerSize.width - initW) / 2,
      y: (containerSize.height - initH) / 2
    })
  }

  // Quick alignment
  const handleAlign = (alignment: 'top' | 'center' | 'bottom') => {
    const w = naturalSize.width * currentScale
    const h = naturalSize.height * currentScale
    const x = (containerSize.width - w) / 2
    let y = (containerSize.height - h) / 2
    if (alignment === 'top') y = 0
    if (alignment === 'bottom') y = containerSize.height - h
    setPan(clampPan(x, y, zoom))
  }

  // Crop execution on Canvas
  const handleConfirmCrop = () => {
    if (!imageElementRef.current) {
      onConfirm(safeImageSrc)
      return
    }

    try {
      const outputWidth = 1200
      const outputHeight = Math.round(outputWidth / aspectRatio)

      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        onConfirm(safeImageSrc)
        return
      }

      // Calculate source bounding box from original image
      const sourceScale = currentScale
      const sx = Math.max(0, -pan.x / sourceScale)
      const sy = Math.max(0, -pan.y / sourceScale)
      const sWidth = Math.min(naturalSize.width - sx, containerSize.width / sourceScale)
      const sHeight = Math.min(naturalSize.height - sy, containerSize.height / sourceScale)

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        imageElementRef.current,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        outputWidth,
        outputHeight
      )

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.90)
      onConfirm(croppedDataUrl)
    } catch {
      // If tainted canvas due to strict CORS, use direct image source
      onConfirm(safeImageSrc)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in select-none">
      <div 
        className="bg-oros-900 border border-oros-750 w-full max-w-lg rounded-[4px] shadow-2xl flex flex-col overflow-hidden text-oros-100 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-oros-800 bg-oros-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-accent" />
            <h3 className="font-sans font-semibold text-xs uppercase tracking-wider text-oros-100">
              Crop & Position Thumbnail
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-850 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Crop Viewport */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`w-full overflow-hidden relative bg-oros-950 rounded-[4px] border border-oros-750 cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center`}
            style={{ height: `${containerSize.height}px` }}
          >
            {/* Hidden image element to measure natural dimensions */}
            <img
              src={safeImageSrc}
              alt="Crop target"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
              className="absolute pointer-events-none will-change-transform"
              style={{
                width: `${renderedWidth}px`,
                height: `${renderedHeight}px`,
                left: `${pan.x}px`,
                top: `${pan.y}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                opacity: imageLoaded ? 1 : 0,
                transition: isDragging ? 'none' : 'opacity 0.2s ease-out'
              }}
            />

            {!imageLoaded && (
              <div className="text-xs font-mono text-oros-500 animate-pulse">
                Loading image...
              </div>
            )}

            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-oros-700/40">
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div />
            </div>

            {/* Subtle drag hint badge */}
            <div className="absolute top-2 left-2 pointer-events-none bg-oros-950/80 backdrop-blur-md px-2 py-0.5 rounded-[3px] border border-oros-800 text-[10px] font-mono text-oros-400">
              Drag to position
            </div>
          </div>

          {/* Controls Bar */}
          <div className="space-y-2.5 bg-oros-950/60 p-3 rounded-[3px] border border-oros-800">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <ZoomOut className="w-3.5 h-3.5 text-oros-400 shrink-0" />
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-accent h-1.5 bg-oros-800 rounded cursor-pointer"
              />
              <ZoomIn className="w-3.5 h-3.5 text-oros-400 shrink-0" />
              <span className="text-[11px] font-mono text-oros-300 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Quick Alignments & Reset */}
            <div className="flex items-center justify-between pt-1 border-t border-oros-800/80 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-oros-500 mr-1">Align:</span>
                <button
                  type="button"
                  onClick={() => handleAlign('top')}
                  className="px-2 py-0.5 rounded-[2px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-white transition-colors"
                >
                  Top
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign('center')}
                  className="px-2 py-0.5 rounded-[2px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-white transition-colors"
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign('bottom')}
                  className="px-2 py-0.5 rounded-[2px] bg-oros-900 hover:bg-oros-850 border border-oros-800 text-oros-300 hover:text-white transition-colors"
                >
                  Bottom
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-oros-400 hover:text-oros-200 transition-colors"
                title="Reset zoom & position"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-oros-800 bg-oros-950 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-[3px] text-xs font-medium text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            className="btn-accent px-4 py-1.5 rounded-[3px] text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm Placement</span>
          </button>
        </div>
      </div>
    </div>
  )
}
