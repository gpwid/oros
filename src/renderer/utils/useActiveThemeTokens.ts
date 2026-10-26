import { useMemo } from 'react'
import { useWorldStore } from '../store/useWorldStore'
import { useSettingsStore, getEffectiveColorMode } from '../store/useSettingsStore'
import { getThemeTokens, ThemeTokens } from './themeEngine'

/**
 * React hook that returns the active project's computed theme tokens (accent hex,
 * dot pattern color, borders, halo glow, and muted backgrounds), responsive to colorMode
 * and project switches.
 */
export function useActiveThemeTokens(): ThemeTokens {
  const activeWorld = useWorldStore((s) => s.worlds.find((w) => w.id === s.activeWorldId) || s.worlds[0])
  const interfaceSettings = useSettingsStore((s) => s.settings.interface)

  return useMemo(() => {
    const isLight = getEffectiveColorMode(interfaceSettings.colorMode) === 'light'

    // If world has a specific theme config override and global theme is not forced
    if (!interfaceSettings.forceGlobalTheme && activeWorld?.themeConfig) {
      return getThemeTokens(undefined, undefined, isLight, activeWorld.themeConfig)
    }

    // If global theme is forced or global custom theme config is selected
    const activeCustomTheme = interfaceSettings.customThemes?.find(
      (t) => t.id === interfaceSettings.themePreset
    )
    if (activeCustomTheme) {
      return getThemeTokens(undefined, undefined, isLight, activeCustomTheme)
    }

    if (interfaceSettings.forceGlobalTheme) {
      return getThemeTokens(
        interfaceSettings.themePreset,
        interfaceSettings.themePreset === 'custom' ? interfaceSettings.customAccentColor : undefined,
        isLight
      )
    }

    return getThemeTokens(activeWorld?.theme, activeWorld?.customAccentColor, isLight)
  }, [
    activeWorld?.theme,
    activeWorld?.customAccentColor,
    activeWorld?.themeConfig,
    interfaceSettings.colorMode,
    interfaceSettings.forceGlobalTheme,
    interfaceSettings.themePreset,
    interfaceSettings.customAccentColor,
    interfaceSettings.customThemes
  ])
}
