import { useWorldStore } from '../store/useWorldStore'
import { useSettingsStore, getEffectiveColorMode } from '../store/useSettingsStore'
import { getThemeTokens, ThemeTokens } from './themeEngine'

/**
 * React hook that returns the active project's computed theme tokens (accent hex,
 * dot pattern color, borders, halo glow, and muted backgrounds), responsive to colorMode
 * and project switches.
 */
export function useActiveThemeTokens(): ThemeTokens {
  const { worlds, activeWorldId } = useWorldStore()
  const { settings } = useSettingsStore()
  const isLight = getEffectiveColorMode(settings.interface.colorMode) === 'light'
  const activeWorld = worlds.find((w) => w.id === activeWorldId) || worlds[0]

  // If world has a specific theme config override and global theme is not forced
  if (!settings.interface.forceGlobalTheme && activeWorld?.themeConfig) {
    return getThemeTokens(undefined, undefined, isLight, activeWorld.themeConfig)
  }

  // If global theme is forced or global custom theme config is selected
  const activeCustomTheme = settings.interface.customThemes?.find(
    (t) => t.id === settings.interface.themePreset
  )
  if (activeCustomTheme) {
    return getThemeTokens(undefined, undefined, isLight, activeCustomTheme)
  }

  if (settings.interface.forceGlobalTheme) {
    return getThemeTokens(
      settings.interface.themePreset,
      settings.interface.themePreset === 'custom' ? settings.interface.customAccentColor : undefined,
      isLight
    )
  }

  return getThemeTokens(activeWorld?.theme, activeWorld?.customAccentColor, isLight)
}
