import { World } from '@shared/types'

interface RgbColor {
  r: number
  g: number
  b: number
}

function parseHex(hexStr: string): RgbColor | null {
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

function lighten(rgb: RgbColor, percent: number): string {
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * (percent / 100)))
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * (percent / 100)))
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * (percent / 100)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function getContrastColor(rgb: RgbColor): string {
  // Standard luminance formula
  const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
  return lum > 165 ? '#090a0d' : '#ffffff'
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

  // Clear custom properties when using a preset theme
  root.style.removeProperty('--oros-accent')
  root.style.removeProperty('--oros-accent-muted')
  root.style.removeProperty('--oros-accent-subtle')
  root.style.removeProperty('--oros-accent-border')
  root.style.removeProperty('--oros-accent-hover')
  root.style.removeProperty('--oros-accent-ring')
  root.style.removeProperty('--oros-accent-glow')
  root.style.removeProperty('--oros-accent-contrast')

  root.setAttribute('data-theme', activeTheme)
}
