import { create } from 'zustand'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'accent' | 'warning'
}

interface ConfirmState {
  isOpen: boolean
  options: ConfirmOptions | null
  resolve: ((value: boolean) => void) | null
  confirm: (options: ConfirmOptions) => Promise<boolean>
  close: (result: boolean) => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  options: null,
  resolve: null,
  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolve })
    })
  },
  close: (result) => {
    const { resolve } = get()
    if (resolve) resolve(result)
    set({ isOpen: false, options: null, resolve: null })
  }
}))

export const confirmDialog = (options: ConfirmOptions | string): Promise<boolean> => {
  const opts: ConfirmOptions = typeof options === 'string'
    ? { message: options, title: 'Confirm Action', variant: 'danger' }
    : options
  return useConfirmStore.getState().confirm(opts)
}
