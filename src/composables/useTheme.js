import { computed, ref, watchEffect } from 'vue'
import { useSettingsStore } from '../stores/settingsStore.js'

/** Shared reactive dark flag (read by the CodeMirror editor theme). */
export const isDark = ref(false)

/**
 * Applies the selected theme ('light' | 'dark' | 'system') by toggling
 * the `dark` class on <html>. Honors the OS preference in system mode.
 */
export function useTheme() {
  const settingsStore = useSettingsStore()
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  const theme = computed(() => settingsStore.settings.theme)

  function apply() {
    const dark = theme.value === 'dark' || (theme.value === 'system' && media.matches)
    isDark.value = dark
    document.documentElement.classList.toggle('dark', dark)
  }

  media.addEventListener('change', apply)
  watchEffect(apply)

  function cycleTheme() {
    const order = ['system', 'light', 'dark']
    const next = order[(order.indexOf(theme.value) + 1) % order.length]
    settingsStore.update({ theme: next })
  }

  return { theme, cycleTheme, isDark }
}
