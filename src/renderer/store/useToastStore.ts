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

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3200) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }))

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  }
}))
