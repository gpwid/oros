import React from 'react'
import { useToastStore } from '../../store/useToastStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none select-none max-w-sm w-full">
      {toasts.map((t) => {
        let borderClass = 'border-oros-700 bg-oros-900/95 text-slate-200'
        let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />

        if (t.type === 'success') {
          borderClass = 'border-emerald-500/50 bg-emerald-950/90 text-emerald-200'
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        } else if (t.type === 'warning') {
          borderClass = 'border-amber-500/50 bg-amber-950/90 text-amber-200'
          icon = <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        } else if (t.type === 'error') {
          borderClass = 'border-rose-500/50 bg-rose-950/90 text-rose-200'
          icon = <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            <div className="flex items-center gap-2.5 truncate mr-2">
              {icon}
              <span className="truncate">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-oros-400 hover:text-slate-100 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
