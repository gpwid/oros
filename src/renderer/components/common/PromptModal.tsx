import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, X } from 'lucide-react'

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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-oros-900 border border-oros-700/80 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <h3 className="font-serif font-bold text-base text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-oros-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {description && (
          <p className="text-xs text-oros-300 mb-4 leading-relaxed">{description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-oros-950 border border-oros-700 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-oros-500 focus:outline-none focus:border-gold-400 transition-colors"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-oros-300 hover:bg-oros-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-gold-500 hover:bg-gold-400 text-oros-950 shadow-md transition-colors"
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-oros-900 border border-oros-700/80 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="font-serif font-bold text-base text-slate-100 mb-2">{title}</h3>
        <p className="text-xs text-oros-300 mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs text-oros-300 hover:bg-oros-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-md ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-gold-500 hover:bg-gold-400 text-oros-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
