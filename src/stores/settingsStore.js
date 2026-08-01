import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'json-for-humans:settings'

/**
 * Settings are only persisted when the user explicitly enables
 * "Remember settings". JSON content itself is never stored.
 */
const DEFAULTS = {
  booleanStyle: 'yes-no',
  nullLabel: 'Not available',
  emptyStringLabel: 'Empty',
  emptyArrayLabel: 'No items',
  emptyObjectLabel: 'No details',
  locale: '',
  dateMode: 'datetime',
  timezone: 'local',
  indentSize: 2,
  density: 'comfortable',
  defaultViewMode: 'document',
  showTechnicalFields: true,
  autoExpand: true,
  maxInitialDepth: 3,
  theme: 'system',
  rememberSettings: false,
}

const STRING_KEYS = [
  'booleanStyle',
  'nullLabel',
  'emptyStringLabel',
  'emptyArrayLabel',
  'emptyObjectLabel',
  'locale',
  'dateMode',
  'timezone',
  'density',
  'defaultViewMode',
  'theme',
]
const BOOLEAN_KEYS = ['showTechnicalFields', 'autoExpand', 'rememberSettings']
const NUMBER_KEYS = ['indentSize', 'maxInitialDepth']

/** Explicit whitelist merge — stored JSON is never merged blindly. */
function sanitize(raw) {
  const clean = {}
  if (typeof raw !== 'object' || raw === null) return clean
  for (const key of STRING_KEYS) {
    if (typeof raw[key] === 'string') clean[key] = raw[key]
  }
  for (const key of BOOLEAN_KEYS) {
    if (typeof raw[key] === 'boolean') clean[key] = raw[key]
  }
  for (const key of NUMBER_KEYS) {
    if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) clean[key] = raw[key]
  }
  return clean
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({ ...DEFAULTS })

  function load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      settings.value = { ...DEFAULTS, ...sanitize(parsed), rememberSettings: true }
    } catch {
      // Corrupt storage — fall back to defaults.
    }
  }

  function persistOrClear() {
    try {
      if (settings.value.rememberSettings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Storage unavailable (private mode etc.) — settings stay in memory.
    }
  }

  watch(settings, persistOrClear, { deep: true })

  function update(patch) {
    settings.value = { ...settings.value, ...sanitize(patch) }
  }

  function resetToDefaults() {
    settings.value = { ...DEFAULTS }
  }

  /** Options object consumed by the humanization engine. */
  const humanizeOptions = computed(() => ({
    booleanStyle: settings.value.booleanStyle,
    nullLabel: settings.value.nullLabel,
    emptyStringLabel: settings.value.emptyStringLabel,
    emptyArrayLabel: settings.value.emptyArrayLabel,
    emptyObjectLabel: settings.value.emptyObjectLabel,
    locale: settings.value.locale || undefined,
    dateMode: settings.value.dateMode,
    timezone: settings.value.timezone,
  }))

  return { settings, humanizeOptions, load, update, resetToDefaults }
})
