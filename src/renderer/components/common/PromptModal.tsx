import React, { useState, useEffect, useRef } from 'react'
import { PenLine, X } from 'lucide-react'

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  description,
  placeholder = 'Type here...',
  defaultValue = '',
  confirmLabel = 'Create',
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, defaultValue])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onConfirm(value.trim())
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl max-w-md w-full p-5 animate-modal-in">
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <PenLine className="w-3.5 h-3.5 text-oros-400" />
            <h3 className="font-sans font-semibold text-sm text-oros-100 tracking-tight">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-oros-400 hover:text-oros-200 transition-colors p-0.5 rounded-[2px]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <p className="text-xs text-oros-400 mb-3.5 leading-relaxed font-sans">{description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <input
            ref={inputRef}
            type="text"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-oros-500 transition-colors font-sans"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-oros-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-[3px] text-xs font-medium text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors btn-interactive"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-accent px-3.5 py-1.5 rounded-[3px] text-xs font-semibold shadow-sm transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  isDestructive = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl max-w-sm w-full p-5 animate-modal-in">
        <h3 className="font-sans font-semibold text-sm text-oros-100 mb-1.5 tracking-tight">{title}</h3>
        <p className="text-xs text-oros-400 mb-4 leading-relaxed font-sans">{message}</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-oros-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850 transition-colors btn-interactive"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-[3px] text-xs font-semibold transition-colors shadow-sm btn-interactive ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'btn-accent'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

