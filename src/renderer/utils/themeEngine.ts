import { World } from '@shared/types'

interface RgbColor {
  r: number
  g: number
  b: number
}

export interface ThemeTokens {
  accent: string
  muted: string
  subtle: string
  border: string
  hover: string
  ring: string
  glow: string
  contrast: string
}

export const PRESET_THEMES: Record<string, ThemeTokens> = {
  sovereign: {
    accent: '#e2e8f0',
    muted: 'rgba(226, 232, 240, 0.12)',
    subtle: 'rgba(226, 232, 240, 0.05)',
    border: 'rgba(226, 232, 240, 0.30)',
    hover: '#ffffff',
    ring: 'rgba(226, 232, 240, 0.25)',
    glow: 'rgba(226, 232, 240, 0.20)',
    contrast: '#090a0d',
  },
  mythic: {
    accent: '#f5c542',
    muted: 'rgba(245, 197, 66, 0.14)',
    subtle: 'rgba(245, 197, 66, 0.05)',
    border: 'rgba(245, 197, 66, 0.35)',
    hover: '#fde047',
    ring: 'rgba(245, 197, 66, 0.30)',
    glow: 'rgba(245, 197, 66, 0.25)',
    contrast: '#090a0d',
  },
  cyber: {
    accent: '#06b6d4',
    muted: 'rgba(6, 182, 212, 0.14)',
    subtle: 'rgba(6, 182, 212, 0.05)',
    border: 'rgba(6, 182, 212, 0.35)',
    hover: '#22d3ee',
    ring: 'rgba(6, 182, 212, 0.30)',
    glow: 'rgba(6, 182, 212, 0.25)',
    contrast: '#090a0d',
  },
  crimson: {
    accent: '#f43f5e',
    muted: 'rgba(244, 63, 94, 0.14)',
    subtle: 'rgba(244, 63, 94, 0.05)',
    border: 'rgba(244, 63, 94, 0.35)',
    hover: '#fb7185',
    ring: 'rgba(244, 63, 94, 0.30)',
    glow: 'rgba(244, 63, 94, 0.25)',
    contrast: '#ffffff',
  },
  hazard: {
    accent: '#f97316',
    muted: 'rgba(249, 115, 22, 0.14)',
    subtle: 'rgba(249, 115, 22, 0.05)',
    border: 'rgba(249, 115, 22, 0.35)',
    hover: '#fb923c',
    ring: 'rgba(249, 115, 22, 0.30)',
    glow: 'rgba(249, 115, 22, 0.25)',
    contrast: '#090a0d',
  },
  emerald: {
    accent: '#10b981',
    muted: 'rgba(16, 185, 129, 0.14)',
    subtle: 'rgba(16, 185, 129, 0.05)',
    border: 'rgba(16, 185, 129, 0.35)',
    hover: '#34d399',
    ring: 'rgba(16, 185, 129, 0.30)',
    glow: 'rgba(16, 185, 129, 0.25)',
    contrast: '#090a0d',
  }
}

export function parseHex(hexStr: string): RgbColor | null {
  const clean = hexStr.replace('#', '').trim()
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return { r, g, b }
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return { r, g, b }
  }
  return null
}

export function lighten(rgb: RgbColor, percent: number): string {
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * (percent / 100)))
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * (percent / 100)))
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * (percent / 100)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function getContrastColor(rgb: RgbColor): string {
  // WCAG relative luminance formula
  const lum = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
  return lum >= 130 ? '#090a0d' : '#ffffff'
}

export function applyTheme(theme?: World['theme'], customColor?: string) {
  const root = document.documentElement
  const activeTheme = theme || 'sovereign'

  if (activeTheme === 'custom' && customColor) {
    const rgb = parseHex(customColor)
    if (rgb) {
      root.setAttribute('data-theme', 'custom')
      root.style.setProperty('--oros-accent', customColor)
      root.style.setProperty('--oros-accent-muted', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.14)`)
      root.style.setProperty('--oros-accent-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`)
      root.style.setProperty('--oros-accent-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`)
      root.style.setProperty('--oros-accent-hover', lighten(rgb, 15))
      root.style.setProperty('--oros-accent-ring', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`)
      root.style.setProperty('--oros-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`)
      root.style.setProperty('--oros-accent-contrast', getContrastColor(rgb))
      return
    }
  }

  const preset = PRESET_THEMES[activeTheme] || PRESET_THEMES.sovereign
  root.setAttribute('data-theme', activeTheme)
  root.style.setProperty('--oros-accent', preset.accent)
  root.style.setProperty('--oros-accent-muted', preset.muted)
  root.style.setProperty('--oros-accent-subtle', preset.subtle)
  root.style.setProperty('--oros-accent-border', preset.border)
  root.style.setProperty('--oros-accent-hover', preset.hover)
  root.style.setProperty('--oros-accent-ring', preset.ring)
  root.style.setProperty('--oros-accent-glow', preset.glow)
  root.style.setProperty('--oros-accent-contrast', preset.contrast)
}
