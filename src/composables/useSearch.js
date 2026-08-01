import { storeToRefs } from 'pinia'
import { useUiStore } from '../stores/uiStore.js'

/** Reactive search/filter state shared by the toolbar and views. */
export function useSearch() {
  const uiStore = useUiStore()
  const { searchQuery, hideNulls, hideEmpty, hideIds } = storeToRefs(uiStore)
  return { searchQuery, hideNulls, hideEmpty, hideIds, resetFilters: uiStore.resetFilters }
}
