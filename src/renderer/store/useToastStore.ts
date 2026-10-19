import { create } from 'zustand'

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

function getStoredToastDuration(): number {
  if (typeof window === 'undefined') return 3500
  try {
    const raw = localStorage.getItem('oros_app_settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.general?.toastDurationMs) return parsed.general.toastDurationMs
    }
  } catch {}
  return 3500
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const finalDuration = duration !== undefined ? duration : getStoredToastDuration()
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration: finalDuration }] }))

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, finalDuration)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  }
}))
