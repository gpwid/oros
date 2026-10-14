import React from 'react'
import { useToastStore } from '../../store/useToastStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none select-none max-w-sm w-full">
      {toasts.map((t) => {
        let borderClass = 'border-oros-750 bg-oros-900 text-oros-200'
        let icon = <Info className="w-3.5 h-3.5 text-oros-400 shrink-0" />

        if (t.type === 'success') {
          borderClass = 'border-emerald-500/40 bg-oros-950 text-emerald-300'
          icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        } else if (t.type === 'warning') {
          borderClass = 'border-amber-500/40 bg-oros-950 text-amber-300'
          icon = <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        } else if (t.type === 'error') {
          borderClass = 'border-rose-500/40 bg-oros-950 text-rose-300'
          icon = <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between px-3 py-2 rounded-[3px] border shadow-xl text-xs font-sans animate-in fade-in slide-in-from-bottom-2 duration-150 ${borderClass}`}
          >
            <div className="flex items-center gap-2 truncate mr-2">
              {icon}
              <span className="truncate">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-oros-400 hover:text-oros-100 p-0.5 rounded-[2px] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
