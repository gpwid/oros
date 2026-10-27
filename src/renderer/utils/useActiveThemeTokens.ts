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
  const appView = useWorldStore((s) => s.appView)
  const interfaceSettings = useSettingsStore((s) => s.settings.interface)

  return useMemo(() => {
    const isLight = getEffectiveColorMode(interfaceSettings.colorMode) === 'light'

    // If global theme is forced OR on home view
    if (interfaceSettings.forceGlobalTheme || appView === 'home') {
      const activeCustomTheme = interfaceSettings.customThemes?.find(
        (t) => t.id === interfaceSettings.themePreset
      )
      if (activeCustomTheme) {
        return getThemeTokens(undefined, undefined, isLight, activeCustomTheme)
      }
      return getThemeTokens(
        interfaceSettings.themePreset,
        interfaceSettings.themePreset === 'custom' ? interfaceSettings.customAccentColor : undefined,
        isLight
      )
    }

    // Vault has specific custom config override
    if (activeWorld?.themeConfig) {
      return getThemeTokens(undefined, undefined, isLight, activeWorld.themeConfig)
    }

    // Vault has specific theme preset override
    if (activeWorld?.theme && activeWorld.theme !== 'inherit') {
      return getThemeTokens(activeWorld.theme, activeWorld.customAccentColor, isLight)
    }

    // Vault inherits global theme
    const activeCustomTheme = interfaceSettings.customThemes?.find(
      (t) => t.id === interfaceSettings.themePreset
    )
    if (activeCustomTheme) {
      return getThemeTokens(undefined, undefined, isLight, activeCustomTheme)
    }

    return getThemeTokens(
      interfaceSettings.themePreset,
      interfaceSettings.themePreset === 'custom' ? interfaceSettings.customAccentColor : undefined,
      isLight
    )
  }, [
    appView,
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
