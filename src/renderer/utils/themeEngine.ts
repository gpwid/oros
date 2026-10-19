import { World, ThemeConfig, CssSnippet, ThemeTokens, ThemePresetId } from '@shared/types'

interface RgbColor {
  r: number
  g: number
  b: number
}

export type { ThemeTokens }

export interface ThemePresetOption {
  id: ThemePresetId
  name: string
  hex: string
  author?: string
  desc?: string
}

export const THEME_PRESETS: ThemePresetOption[] = [
  { id: 'sovereign', name: 'Platinum Sovereign', hex: '#ffffff', author: 'Oros Team', desc: 'Precision silver and lunar platinum' },
  { id: 'obsidian', name: 'Obsidian Midnight', hex: '#94a3b8', author: 'Oros Team', desc: 'Tactile charcoal slate and physical hairlines' },
  { id: 'mythic', name: 'Mythic Amber', hex: '#f5c542', author: 'Oros Team', desc: 'Illuminated gold and warm archival parchment' },
  { id: 'cyber', name: 'Cyber Cyan', hex: '#06b6d4', author: 'Oros Team', desc: 'Electric cyan against deep void slates' },
  { id: 'crimson', name: 'Crimson Ember', hex: '#f43f5e', author: 'Oros Team', desc: 'Rich nocturne rose and rubies' },
  { id: 'hazard', name: 'Hazard Ochre', hex: '#f97316', author: 'Oros Team', desc: 'Industrial amber-orange with mechanical precision' },
  { id: 'emerald', name: 'Emerald Verdant', hex: '#10b981', author: 'Oros Team', desc: 'Deep botanical emerald and jade' },
  { id: 'nord', name: 'Nordic Frost', hex: '#88c0d0', author: 'Arctic', desc: 'Cool arctic cyan and winter twilight tones' },
  { id: 'parchment', name: 'Solarized Parchment', hex: '#e5c07b', author: 'Ethan S.', desc: 'Warm manuscript ochre and antique vellum' }
]

export const PRESET_THEMES: Record<string, ThemeTokens> = {
  sovereign: {
    accent: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.12)',
    subtle: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.30)',
    hover: '#ffffff',
    ring: 'rgba(255, 255, 255, 0.25)',
    glow: 'rgba(255, 255, 255, 0.20)',
    contrast: '#090a0d',
    dots: 'rgba(255, 255, 255, 0.28)',
  },
  obsidian: {
    accent: '#94a3b8',
    muted: 'rgba(148, 163, 184, 0.14)',
    subtle: 'rgba(148, 163, 184, 0.05)',
    border: 'rgba(148, 163, 184, 0.35)',
    hover: '#cbd5e1',
    ring: 'rgba(148, 163, 184, 0.30)',
    glow: 'rgba(148, 163, 184, 0.20)',
    contrast: '#090a0d',
    dots: 'rgba(148, 163, 184, 0.35)',
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
    dots: 'rgba(245, 197, 66, 0.38)',
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
    dots: 'rgba(6, 182, 212, 0.38)',
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
    dots: 'rgba(244, 63, 94, 0.38)',
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
    dots: 'rgba(249, 115, 22, 0.38)',
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
    dots: 'rgba(16, 185, 129, 0.38)',
  },
  nord: {
    accent: '#88c0d0',
    muted: 'rgba(136, 192, 208, 0.14)',
    subtle: 'rgba(136, 192, 208, 0.05)',
    border: 'rgba(136, 192, 208, 0.35)',
    hover: '#81a1c1',
    ring: 'rgba(136, 192, 208, 0.30)',
    glow: 'rgba(136, 192, 208, 0.25)',
    contrast: '#2e3440',
    dots: 'rgba(136, 192, 208, 0.38)',
  },
  parchment: {
    accent: '#e5c07b',
    muted: 'rgba(229, 192, 123, 0.14)',
    subtle: 'rgba(229, 192, 123, 0.05)',
    border: 'rgba(229, 192, 123, 0.35)',
    hover: '#f3d699',
    ring: 'rgba(229, 192, 123, 0.30)',
    glow: 'rgba(229, 192, 123, 0.25)',
    contrast: '#1e1e1e',
    dots: 'rgba(229, 192, 123, 0.38)',
  }
}

export const PRESET_THEMES_LIGHT: Record<string, ThemeTokens> = {
  sovereign: {
    accent: '#0f172a',
    muted: 'rgba(15, 23, 42, 0.08)',
    subtle: 'rgba(15, 23, 42, 0.04)',
    border: 'rgba(15, 23, 42, 0.25)',
    hover: '#1e293b',
    ring: 'rgba(15, 23, 42, 0.20)',
    glow: 'rgba(15, 23, 42, 0.15)',
    contrast: '#ffffff',
    dots: 'rgba(15, 23, 42, 0.25)',
  },
  obsidian: {
    accent: '#334155',
    muted: 'rgba(51, 65, 85, 0.10)',
    subtle: 'rgba(51, 65, 85, 0.04)',
    border: 'rgba(51, 65, 85, 0.30)',
    hover: '#1e293b',
    ring: 'rgba(51, 65, 85, 0.25)',
    glow: 'rgba(51, 65, 85, 0.15)',
    contrast: '#ffffff',
    dots: 'rgba(51, 65, 85, 0.30)',
  },
  mythic: {
    accent: '#d97706',
    muted: 'rgba(217, 119, 6, 0.12)',
    subtle: 'rgba(217, 119, 6, 0.04)',
    border: 'rgba(217, 119, 6, 0.35)',
    hover: '#b45309',
    ring: 'rgba(217, 119, 6, 0.25)',
    glow: 'rgba(217, 119, 6, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(217, 119, 6, 0.35)',
  },
  cyber: {
    accent: '#0284c7',
    muted: 'rgba(2, 132, 199, 0.12)',
    subtle: 'rgba(2, 132, 199, 0.04)',
    border: 'rgba(2, 132, 199, 0.35)',
    hover: '#0369a1',
    ring: 'rgba(2, 132, 199, 0.25)',
    glow: 'rgba(2, 132, 199, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(2, 132, 199, 0.35)',
  },
  crimson: {
    accent: '#e11d48',
    muted: 'rgba(225, 29, 72, 0.12)',
    subtle: 'rgba(225, 29, 72, 0.04)',
    border: 'rgba(225, 29, 72, 0.35)',
    hover: '#be123c',
    ring: 'rgba(225, 29, 72, 0.25)',
    glow: 'rgba(225, 29, 72, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(225, 29, 72, 0.35)',
  },
  hazard: {
    accent: '#ea580c',
    muted: 'rgba(234, 88, 12, 0.12)',
    subtle: 'rgba(234, 88, 12, 0.04)',
    border: 'rgba(234, 88, 12, 0.35)',
    hover: '#c2410c',
    ring: 'rgba(234, 88, 12, 0.25)',
    glow: 'rgba(234, 88, 12, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(234, 88, 12, 0.35)',
  },
  emerald: {
    accent: '#059669',
    muted: 'rgba(5, 150, 105, 0.12)',
    subtle: 'rgba(5, 150, 105, 0.04)',
    border: 'rgba(5, 150, 105, 0.35)',
    hover: '#047857',
    ring: 'rgba(5, 150, 105, 0.25)',
    glow: 'rgba(5, 150, 105, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(5, 150, 105, 0.35)',
  },
  nord: {
    accent: '#5e81ac',
    muted: 'rgba(94, 129, 172, 0.12)',
    subtle: 'rgba(94, 129, 172, 0.04)',
    border: 'rgba(94, 129, 172, 0.35)',
    hover: '#4c566a',
    ring: 'rgba(94, 129, 172, 0.25)',
    glow: 'rgba(94, 129, 172, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(94, 129, 172, 0.35)',
  },
  parchment: {
    accent: '#b58900',
    muted: 'rgba(181, 137, 0, 0.12)',
    subtle: 'rgba(181, 137, 0, 0.04)',
    border: 'rgba(181, 137, 0, 0.35)',
    hover: '#856404',
    ring: 'rgba(181, 137, 0, 0.25)',
    glow: 'rgba(181, 137, 0, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(181, 137, 0, 0.35)',
  }
}

// Built-in default starter snippets for Obsidian-like CSS customizability
export const DEFAULT_SNIPPETS: CssSnippet[] = [
  {
    id: 'gilded-headers',
    name: 'Gilded Illuminated Headers',
    enabled: false,
    description: 'Subtly adds gold/accent hairline underline and tracking to article headings.',
    css: `/* Gilded Illuminated Headers Snippet */
.oros-wiki-prose h1, .oros-wiki-prose h2 {
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--oros-accent-border, rgba(226, 232, 240, 0.3));
}
.oros-wiki-prose h1::before {
  content: '§ ';
  color: var(--oros-accent, #e2e8f0);
  opacity: 0.65;
}`
  },
  {
    id: 'compact-file-tree',
    name: 'Ultra-Compact Directory Tree',
    enabled: false,
    description: 'Compresses folder and item padding in the sidebar for maximum vertical density.',
    css: `/* Ultra-Compact Directory Tree Snippet */
.oros-sidebar-item {
  padding-top: 1px !important;
  padding-bottom: 1px !important;
  font-size: 11px !important;
}`
  },
  {
    id: 'parchment-blockquotes',
    name: 'Antique Manuscript Blockquotes',
    enabled: false,
    description: 'Styles editor and article blockquotes with warm parchment margins and italic serif.',
    css: `/* Antique Manuscript Blockquotes */
.oros-wiki-prose blockquote {
  border-left: 2px solid var(--oros-accent, #f5c542);
  background: var(--oros-accent-subtle, rgba(245, 197, 66, 0.04));
  padding: 0.6rem 1rem;
  border-radius: 0 3px 3px 0;
  font-style: italic;
}`
  }
]

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
  const r = Math.min(255, Math.max(0, Math.round(rgb.r + (255 - rgb.r) * (percent / 100))))
  const g = Math.min(255, Math.max(0, Math.round(rgb.g + (255 - rgb.g) * (percent / 100))))
  const b = Math.min(255, Math.max(0, Math.round(rgb.b + (255 - rgb.b) * (percent / 100))))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function getContrastColor(rgb: RgbColor): string {
  // WCAG relative luminance formula
  const lum = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
  return lum >= 130 ? '#090a0d' : '#ffffff'
}

export function getThemeTokens(
  theme?: ThemePresetId,
  customColor?: string,
  isLight?: boolean,
  customConfig?: ThemeConfig
): ThemeTokens {
  if (customConfig && customConfig.tokens) {
    const base = isLight ? PRESET_THEMES_LIGHT.sovereign : PRESET_THEMES.sovereign
    return {
      ...base,
      ...customConfig.tokens
    } as ThemeTokens
  }

  const activeTheme = theme || 'sovereign'
  if (activeTheme === 'custom' && customColor) {
    const rgb = parseHex(customColor)
    if (rgb) {
      return {
        accent: customColor,
        muted: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isLight ? 0.10 : 0.14})`,
        subtle: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
        border: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
        hover: isLight ? lighten(rgb, -15) : lighten(rgb, 15),
        ring: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
        glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
        contrast: getContrastColor(rgb),
        dots: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isLight ? 0.32 : 0.38})`
      }
    }
  }

  const presetDict = isLight ? PRESET_THEMES_LIGHT : PRESET_THEMES
  return presetDict[activeTheme] || presetDict.sovereign
}

/**
 * Injects or updates individual CSS snippets in document.head
 */
export function applyCssSnippets(snippets: CssSnippet[] = []) {
  if (typeof document === 'undefined') return

  snippets.forEach((snippet) => {
    const elementId = `oros-snippet-${snippet.id}`
    let tag = document.getElementById(elementId) as HTMLStyleElement | null

    if (snippet.enabled && snippet.css && snippet.css.trim().length > 0) {
      if (!tag) {
        tag = document.createElement('style')
        tag.id = elementId
        tag.setAttribute('data-oros-snippet', snippet.id)
        document.head.appendChild(tag)
      }
      if (tag.textContent !== snippet.css) {
        tag.textContent = snippet.css
      }
    } else if (tag) {
      tag.remove()
    }
  })
}

/**
 * Injects custom CSS defined by a ThemeConfig file
 */
export function applyCustomThemeCss(css?: string) {
  if (typeof document === 'undefined') return
  const elementId = 'oros-theme-custom-css'
  let tag = document.getElementById(elementId) as HTMLStyleElement | null

  if (css && css.trim().length > 0) {
    if (!tag) {
      tag = document.createElement('style')
      tag.id = elementId
      document.head.appendChild(tag)
    }
    if (tag.textContent !== css) {
      tag.textContent = css
    }
  } else if (tag) {
    tag.remove()
  }
}

/**
 * Primary theme applicator applying variables, tokens, custom CSS and snippets.
 */
export function applyTheme(
  theme?: ThemePresetId,
  customColor?: string,
  customConfig?: ThemeConfig,
  snippets?: CssSnippet[]
) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const isLight = root.getAttribute('data-color-mode') === 'light'
  const activeTheme = theme || 'sovereign'

  // If a custom imported theme configuration is active
  if (customConfig && customConfig.tokens) {
    const tokens = getThemeTokens(undefined, undefined, isLight, customConfig)
    root.setAttribute('data-theme', customConfig.id || 'custom-config')
    root.style.setProperty('--oros-accent', tokens.accent)
    root.style.setProperty('--oros-accent-muted', tokens.muted)
    root.style.setProperty('--oros-accent-subtle', tokens.subtle)
    root.style.setProperty('--oros-accent-border', tokens.border)
    root.style.setProperty('--oros-accent-hover', tokens.hover)
    root.style.setProperty('--oros-accent-ring', tokens.ring)
    root.style.setProperty('--oros-accent-glow', tokens.glow)
    root.style.setProperty('--oros-accent-contrast', tokens.contrast)
    root.style.setProperty('--oros-accent-dots', tokens.dots)

    // Optional surface overrides
    if (tokens.bgApp) root.style.setProperty('--oros-bg-app', tokens.bgApp)
    if (tokens.bgSurface) root.style.setProperty('--oros-bg-surface', tokens.bgSurface)

    applyCustomThemeCss(customConfig.customCss)
    if (snippets) applyCssSnippets(snippets)
    return
  }

  // Clear custom theme CSS if using standard presets
  applyCustomThemeCss(undefined)

  if (activeTheme === 'custom' && customColor) {
    const rgb = parseHex(customColor)
    if (rgb) {
      root.setAttribute('data-theme', 'custom')
      root.style.setProperty('--oros-accent', customColor)
      root.style.setProperty('--oros-accent-muted', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isLight ? 0.10 : 0.14})`)
      root.style.setProperty('--oros-accent-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`)
      root.style.setProperty('--oros-accent-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`)
      root.style.setProperty('--oros-accent-hover', isLight ? lighten(rgb, -15) : lighten(rgb, 15))
      root.style.setProperty('--oros-accent-ring', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`)
      root.style.setProperty('--oros-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`)
      root.style.setProperty('--oros-accent-contrast', getContrastColor(rgb))
      root.style.setProperty('--oros-accent-dots', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isLight ? 0.32 : 0.38})`)
      if (snippets) applyCssSnippets(snippets)
      return
    }
  }

  const presetDict = isLight ? PRESET_THEMES_LIGHT : PRESET_THEMES
  const preset = presetDict[activeTheme] || presetDict.sovereign
  root.setAttribute('data-theme', activeTheme)
  root.style.setProperty('--oros-accent', preset.accent)
  root.style.setProperty('--oros-accent-muted', preset.muted)
  root.style.setProperty('--oros-accent-subtle', preset.subtle)
  root.style.setProperty('--oros-accent-border', preset.border)
  root.style.setProperty('--oros-accent-hover', preset.hover)
  root.style.setProperty('--oros-accent-ring', preset.ring)
  root.style.setProperty('--oros-accent-glow', preset.glow)
  root.style.setProperty('--oros-accent-contrast', preset.contrast)
  root.style.setProperty('--oros-accent-dots', preset.dots)

  if (snippets) applyCssSnippets(snippets)
}

// ==========================================
// THEME & SNIPPET IMPORT / EXPORT UTILITIES
// ==========================================

export function exportThemeToJson(theme: ThemeConfig): string {
  return JSON.stringify(theme, null, 2)
}

export function parseThemeFromJson(jsonStr: string): { success: boolean; theme?: ThemeConfig; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON structure' }
    }
    if (!parsed.id || !parsed.name) {
      return { success: false, error: 'Theme must specify an "id" and "name"' }
    }
    if (!parsed.tokens || typeof parsed.tokens !== 'object') {
      return { success: false, error: 'Theme must provide a "tokens" object' }
    }

    const theme: ThemeConfig = {
      id: String(parsed.id).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      name: String(parsed.name).trim(),
      author: parsed.author ? String(parsed.author).trim() : 'Community',
      version: parsed.version ? String(parsed.version).trim() : '1.0.0',
      description: parsed.description ? String(parsed.description).trim() : '',
      colorMode: parsed.colorMode === 'light' ? 'light' : 'dark',
      tokens: parsed.tokens,
      customCss: parsed.customCss ? String(parsed.customCss) : undefined
    }

    return { success: true, theme }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse JSON file' }
  }
}

export function exportSnippetsToJson(snippets: CssSnippet[]): string {
  return JSON.stringify(snippets, null, 2)
}

export function parseSnippetsFromJson(jsonStr: string): { success: boolean; snippets?: CssSnippet[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    const snippets: CssSnippet[] = []

    for (const item of list) {
      if (item && typeof item === 'object' && item.name && typeof item.css === 'string') {
        snippets.push({
          id: item.id ? String(item.id).trim() : `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: String(item.name).trim(),
          enabled: Boolean(item.enabled ?? true),
          css: String(item.css),
          description: item.description ? String(item.description) : undefined,
          updatedAt: new Date().toISOString()
        })
      }
    }

    if (snippets.length === 0) {
      return { success: false, error: 'No valid snippets found in JSON' }
    }

    return { success: true, snippets }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse JSON' }
  }
}
