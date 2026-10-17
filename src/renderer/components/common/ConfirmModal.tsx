import React, { useEffect, useRef } from 'react'
import { useConfirmStore } from '../../store/useConfirmStore'
import { AlertTriangle, Trash2, HelpCircle, X } from 'lucide-react'

export const ConfirmModal: React.FC = () => {
  const { isOpen, options, close } = useConfirmStore()
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button for rapid keyboard interaction
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus()
      }, 50)

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          close(false)
        } else if (e.key === 'Enter') {
          // If activeElement is not a button, trigger confirm
          if (document.activeElement?.tagName !== 'BUTTON') {
            e.preventDefault()
            close(true)
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, close])

  if (!isOpen || !options) return null

  const isDanger = options.variant === 'danger' || !options.variant
  const title = options.title || (isDanger ? 'Delete Item' : 'Confirm Action')
  const confirmText = options.confirmText || (isDanger ? 'Delete' : 'Confirm')
  const cancelText = options.cancelText || 'Cancel'

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 animate-fade-in select-none">
      <div 
        className="bg-oros-900 border border-oros-750 w-full max-w-sm rounded-[4px] shadow-2xl flex flex-col overflow-hidden text-oros-100 animate-modal-in select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3.5 py-2.5 border-b border-oros-750 bg-oros-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-[2px] flex items-center justify-center ${
              isDanger 
                ? 'bg-rose-950/70 border border-rose-800/80 text-rose-400' 
                : 'bg-accent/10 border border-accent/30 text-accent'
            }`}>
              {isDanger ? (
                <Trash2 className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
            </div>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-oros-100">
              {title}
            </h3>
          </div>

          <button
            onClick={() => close(false)}
            className="p-1 rounded-[2px] text-oros-400 hover:text-oros-100 hover:bg-oros-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-xs text-oros-200 leading-relaxed font-sans">
            {options.message}
          </p>
        </div>

        {/* Pinned Action Footer */}
        <div className="px-3.5 py-2.5 bg-oros-950/80 border-t border-oros-750 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => close(false)}
            className="px-3 py-1 rounded-[3px] text-xs font-medium text-oros-300 hover:text-oros-100 bg-oros-850 hover:bg-oros-800 border border-oros-750 transition-colors"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => close(true)}
            className={`px-3 py-1 rounded-[3px] text-xs font-semibold transition-colors shadow-sm ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-rose-50 border border-rose-500/60'
                : 'btn-accent'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
