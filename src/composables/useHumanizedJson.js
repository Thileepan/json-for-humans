import { computed } from 'vue'
import { humanizeJson } from '../core/transformer/humanizeJson.js'
import { filterTree, countFields } from '../core/transformer/filterTree.js'
import { useJsonStore } from '../stores/jsonStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { useSchemaStore } from '../stores/schemaStore.js'
import { useUiStore } from '../stores/uiStore.js'

/**
 * Connects the deterministic engine to the stores. Every display mode
 * consumes the same normalized tree from here.
 */
export function useHumanizedJson() {
  const jsonStore = useJsonStore()
  const settingsStore = useSettingsStore()
  const schemaStore = useSchemaStore()
  const uiStore = useUiStore()

  const tree = computed(() => {
    if (jsonStore.parsedValue === undefined) return null
    return humanizeJson(
      jsonStore.parsedValue,
      settingsStore.humanizeOptions,
      schemaStore.activeSchema
    )
  })

  const filteredTree = computed(() => {
    if (!tree.value) return null
    return filterTree(tree.value, {
      query: uiStore.searchQuery,
      hideNulls: uiStore.hideNulls,
      hideEmpty: uiStore.hideEmpty,
      hideIds: uiStore.hideIds || !settingsStore.settings.showTechnicalFields,
    })
  })

  const totalFields = computed(() => countFields(tree.value))
  const visibleFields = computed(() => countFields(filteredTree.value))

  return { tree, filteredTree, totalFields, visibleFields }
}
