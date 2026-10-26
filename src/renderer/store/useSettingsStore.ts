import { create } from 'zustand'
import { AppSettings, SettingsTab, ColorMode, ThemeConfig, CssSnippet, ThemePresetId, ThemeScope } from '@shared/types'
import { applyTheme, DEFAULT_SNIPPETS, applyCssSnippets } from '../utils/themeEngine'

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    startupView: 'home',
    autoSaveIntervalMs: 1000,
    confirmEntityDeletion: true,
    confirmWorldDeletion: true,
    toastDurationMs: 3500
  },
  interface: {
    colorMode: 'dark',
    themePreset: 'sovereign',
    customAccentColor: '#6366f1',
    forceGlobalTheme: false,
    themeScope: 'global',
    customThemes: [],
    snippets: DEFAULT_SNIPPETS,
    uiDensity: 'standard',
    headingFont: 'playfair',
    bodyFont: 'inter',
    monoFont: 'jetbrains',
    enableBackdropBlur: true,
    enableAnimations: true
  },
  editor: {
    fontSize: 15,
    lineHeight: 1.65,
    maxWidth: 'readable',
    typewriterMode: false,
    autoPairBrackets: true,
    spellcheck: true,
    showWordCount: true
  },
  files: {
    customVaultPath: undefined,
    autoBackup: true,
    maxBackups: 5
  }
}

const STORAGE_KEY = 'oros_app_settings'

let systemThemeMediaQuery: MediaQueryList | null = null
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null

export function getEffectiveColorMode(mode: ColorMode = 'dark'): 'dark' | 'light' {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }
  return mode
}

function loadSavedSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
        interface: { 
          ...DEFAULT_SETTINGS.interface, 
          ...(parsed.interface || {}),
          snippets: parsed.interface?.snippets || DEFAULT_SNIPPETS,
          customThemes: parsed.interface?.customThemes || []
        },
        editor: { ...DEFAULT_SETTINGS.editor, ...(parsed.editor || {}) },
        files: { ...DEFAULT_SETTINGS.files, ...(parsed.files || {}) }
      }
    }
  } catch (err) {
    console.warn('Failed to parse saved settings, using defaults:', err)
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

export const SERIF_FONT_MAP: Record<string, string> = {
  playfair: '"Playfair Display", Georgia, serif',
  cinzel: '"Cinzel", "Times New Roman", serif',
  'cinzel-decorative': '"Cinzel Decorative", "Cinzel", serif',
  cormorant: '"Cormorant Garamond", Georgia, serif',
  literata: '"Literata", Georgia, serif',
  merriweather: '"Merriweather", Georgia, serif',
  lora: '"Lora", Georgia, serif',
  'eb-garamond': '"EB Garamond", Garamond, serif',
  'crimson-pro': '"Crimson Pro", Georgia, serif',
  philosopher: '"Philosopher", Georgia, serif',
  georgia: 'Georgia, "Times New Roman", serif',
  inter: 'Inter, system-ui, sans-serif'
}

export const SANS_FONT_MAP: Record<string, string> = {
  jakarta: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  inter: 'Inter, system-ui, -apple-system, sans-serif',
  outfit: '"Outfit", system-ui, -apple-system, sans-serif',
  'space-grotesk': '"Space Grotesk", system-ui, sans-serif',
  raleway: '"Raleway", system-ui, sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  segoe: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
}

export const MONO_FONT_MAP: Record<string, string> = {
  jetbrains: '"JetBrains Mono", Consolas, monospace',
  fira: '"Fira Code", Courier, monospace',
  'ibm-plex': '"IBM Plex Mono", Consolas, monospace',
  'space-mono': '"Space Mono", monospace',
  courier: '"Courier Prime", Courier, monospace',
  consolas: 'Consolas, "Courier New", monospace'
}

const DYNAMIC_GOOGLE_FONT_SPECS: Record<string, string> = {
  'cinzel-decorative': 'Cinzel+Decorative:wght@700',
  cormorant: 'Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,600',
  literata: 'Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;1,7..72,400',
  merriweather: 'Merriweather:ital,wght@0,400;0,700;1,400',
  lora: 'Lora:ital,wght@0,400;0,600;1,400',
  'eb-garamond': 'EB+Garamond:ital,wght@0,400;0,600;1,400',
  'crimson-pro': 'Crimson+Pro:ital,wght@0,400;0,600;1,400',
  philosopher: 'Philosopher:ital,wght@0,400;0,700;1,400',
  outfit: 'Outfit:wght@400;500;600;700',
  'space-grotesk': 'Space+Grotesk:wght@400;500;600;700',
  raleway: 'Raleway:ital,wght@0,400;0,600;1,400',
  fira: 'Fira+Code:wght@400;500',
  'ibm-plex': 'IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400',
  'space-mono': 'Space+Mono:ital,wght@0,400;0,700;1,400',
  courier: 'Courier+Prime:ital,wght@0,400;0,700;1,400'
}

function ensureDynamicGoogleFonts(headingFont: string, bodyFont: string, monoFont: string) {
  if (typeof document === 'undefined') return
  const specs = [
    DYNAMIC_GOOGLE_FONT_SPECS[headingFont],
    DYNAMIC_GOOGLE_FONT_SPECS[bodyFont],
    DYNAMIC_GOOGLE_FONT_SPECS[monoFont]
  ].filter(Boolean)

  const linkId = 'oros-dynamic-fonts'
  let linkEl = document.getElementById(linkId) as HTMLLinkElement | null

  if (specs.length === 0) {
    if (linkEl) linkEl.remove()
    return
  }

  const href = `https://fonts.googleapis.com/css2?${specs.map((s) => `family=${s}`).join('&')}&display=swap`
  if (!linkEl) {
    linkEl = document.createElement('link')
    linkEl.id = linkId
    linkEl.rel = 'stylesheet'
    linkEl.href = href
    document.head.appendChild(linkEl)
  } else if (linkEl.href !== href) {
    linkEl.href = href
  }
}

export function applySystemAppearance(settings: AppSettings['interface']) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const effectiveMode = getEffectiveColorMode(settings.colorMode || 'dark')

  root.setAttribute('data-color-mode', effectiveMode)
  if (effectiveMode === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }

  // System listener for OS theme preference changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (settings.colorMode === 'system') {
      if (!systemThemeMediaQuery) {
        systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQueryListener = (e) => {
          const newMode = e.matches ? 'dark' : 'light'
          root.setAttribute('data-color-mode', newMode)
          root.classList.toggle('dark', newMode === 'dark')
          root.classList.toggle('light', newMode === 'light')
          applyTheme(settings.forceGlobalTheme ? settings.themePreset : undefined, settings.customAccentColor)
        }
        systemThemeMediaQuery.addEventListener('change', mediaQueryListener)
      }
    } else if (systemThemeMediaQuery && mediaQueryListener) {
      systemThemeMediaQuery.removeEventListener('change', mediaQueryListener)
      systemThemeMediaQuery = null
      mediaQueryListener = null
    }
  }

  root.setAttribute('data-density', settings.uiDensity)
  root.setAttribute('data-blur', settings.enableBackdropBlur ? 'true' : 'false')
  root.setAttribute('data-animations', settings.enableAnimations ? 'true' : 'false')

  // Load any non-default Google Fonts on demand
  ensureDynamicGoogleFonts(settings.headingFont, settings.bodyFont, settings.monoFont)

  // Set font families
  root.style.setProperty('--font-serif', SERIF_FONT_MAP[settings.headingFont] || SERIF_FONT_MAP.playfair)
  root.style.setProperty('--font-sans', SANS_FONT_MAP[settings.bodyFont] || SANS_FONT_MAP.inter)
  root.style.setProperty('--font-mono', MONO_FONT_MAP[settings.monoFont] || MONO_FONT_MAP.jetbrains)

  // Sync CSS Snippets
  applyCssSnippets(settings.snippets || [])

  if (settings.forceGlobalTheme) {
    const customConfig = settings.customThemes?.find((t) => t.id === settings.themePreset)
    applyTheme(
      settings.themePreset,
      settings.themePreset === 'custom' ? settings.customAccentColor : undefined,
      customConfig,
      settings.snippets
    )
  }
}

interface SettingsState {
  settings: AppSettings
  isSettingsOpen: boolean
  activeTab: SettingsTab

  openSettings: (tab?: SettingsTab) => void
  closeSettings: () => void
  setActiveTab: (tab: SettingsTab) => void

  updateGeneral: (updates: Partial<AppSettings['general']>) => void
  updateInterface: (updates: Partial<AppSettings['interface']>) => void
  updateEditor: (updates: Partial<AppSettings['editor']>) => void
  updateFiles: (updates: Partial<AppSettings['files']>) => void
  resetSectionToDefaults: (section: keyof AppSettings) => void
  resetAllToDefaults: () => void

  // Theme & CSS Snippets Manager
  installCustomTheme: (theme: ThemeConfig) => void
  removeCustomTheme: (themeId: string) => void
  addSnippet: (snippet: Omit<CssSnippet, 'id' | 'updatedAt'>) => void
  updateSnippet: (id: string, updates: Partial<CssSnippet>) => void
  toggleSnippet: (id: string) => void
  deleteSnippet: (id: string) => void
  resetSnippets: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = loadSavedSettings()
  applySystemAppearance(initial.interface)

  return {
    settings: initial,
    isSettingsOpen: false,
    activeTab: 'general',

    openSettings: (tab = 'general') => set({ isSettingsOpen: true, activeTab: tab }),
    closeSettings: () => set({ isSettingsOpen: false }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    updateGeneral: (updates) => {
      const next: AppSettings = {
        ...get().settings,
        general: { ...get().settings.general, ...updates }
      }
      saveSettings(next)
      set({ settings: next })
    },

    updateInterface: (updates) => {
      const next: AppSettings = {
        ...get().settings,
        interface: { ...get().settings.interface, ...updates }
      }
      saveSettings(next)
      applySystemAppearance(next.interface)
      set({ settings: next })
    },

    updateEditor: (updates) => {
      const next: AppSettings = {
        ...get().settings,
        editor: { ...get().settings.editor, ...updates }
      }
      saveSettings(next)
      set({ settings: next })
    },

    updateFiles: (updates) => {
      const next: AppSettings = {
        ...get().settings,
        files: { ...get().settings.files, ...updates }
      }
      saveSettings(next)
      set({ settings: next })
    },

    resetSectionToDefaults: (section) => {
      const next: AppSettings = {
        ...get().settings,
        [section]: { ...DEFAULT_SETTINGS[section] }
      }
      saveSettings(next)
      if (section === 'interface') {
        applySystemAppearance(next.interface)
      }
      set({ settings: next })
    },

    resetAllToDefaults: () => {
      saveSettings(DEFAULT_SETTINGS)
      applySystemAppearance(DEFAULT_SETTINGS.interface)
      set({ settings: DEFAULT_SETTINGS })
    },

    // Custom Theme management
    installCustomTheme: (theme: ThemeConfig) => {
      const existing = get().settings.interface.customThemes || []
      const filtered = existing.filter((t) => t.id !== theme.id)
      const nextThemes = [...filtered, theme]
      get().updateInterface({
        customThemes: nextThemes,
        themePreset: theme.id
      })
    },

    removeCustomTheme: (themeId: string) => {
      const existing = get().settings.interface.customThemes || []
      const nextThemes = existing.filter((t) => t.id !== themeId)
      const updates: Partial<AppSettings['interface']> = { customThemes: nextThemes }
      if (get().settings.interface.themePreset === themeId) {
        updates.themePreset = 'sovereign'
      }
      get().updateInterface(updates)
    },

    // Snippets Manager
    addSnippet: (snippetData) => {
      const newSnippet: CssSnippet = {
        id: `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: snippetData.name,
        enabled: snippetData.enabled ?? true,
        css: snippetData.css,
        description: snippetData.description,
        updatedAt: new Date().toISOString()
      }
      const existing = get().settings.interface.snippets || []
      get().updateInterface({ snippets: [...existing, newSnippet] })
    },

    updateSnippet: (id, updates) => {
      const existing = get().settings.interface.snippets || []
      const nextSnippets = existing.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      )
      get().updateInterface({ snippets: nextSnippets })
    },

    toggleSnippet: (id) => {
      const existing = get().settings.interface.snippets || []
      const nextSnippets = existing.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled, updatedAt: new Date().toISOString() } : s
      )
      get().updateInterface({ snippets: nextSnippets })
    },

    deleteSnippet: (id) => {
      const existing = get().settings.interface.snippets || []
      const tag = document.getElementById(`oros-snippet-${id}`)
      if (tag) tag.remove()
      const nextSnippets = existing.filter((s) => s.id !== id)
      get().updateInterface({ snippets: nextSnippets })
    },

    resetSnippets: () => {
      get().updateInterface({ snippets: DEFAULT_SNIPPETS })
    }
  }
})
