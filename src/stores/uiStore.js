import { ref } from 'vue'
import { defineStore } from 'pinia'

/** Transient UI state shared across components (never persisted). */
export const useUiStore = defineStore('ui', () => {
  const workspaceMode = ref('humanize') // 'humanize' | 'compare'
  const viewMode = ref('document') // 'cards' | 'document' | 'table' | 'tree' | 'raw'
  const searchQuery = ref('')
  const searchCaseSensitive = ref(false)
  const hideNulls = ref(false)
  const hideEmpty = ref(false)
  const hideIds = ref(false)
  const settingsOpen = ref(false)
  const schemaOpen = ref(false)
  const expandEpoch = ref(0)
  const expandMode = ref('default') // 'default' | 'expand-all' | 'collapse-all'

  function expandAll() {
    expandMode.value = 'expand-all'
    expandEpoch.value++
  }

  function collapseAll() {
    expandMode.value = 'collapse-all'
    expandEpoch.value++
  }

  function resetFilters() {
    searchQuery.value = ''
    searchCaseSensitive.value = false
    hideNulls.value = false
    hideEmpty.value = false
    hideIds.value = false
  }

  return {
    workspaceMode,
    viewMode,
    searchQuery,
    searchCaseSensitive,
    hideNulls,
    hideEmpty,
    hideIds,
    settingsOpen,
    schemaOpen,
    expandEpoch,
    expandMode,
    expandAll,
    collapseAll,
    resetFilters,
  }
})
