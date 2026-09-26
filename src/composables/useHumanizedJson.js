import { computed } from 'vue'
import { humanizeJson } from '../core/transformer/humanizeJson.js'
import { filterTree, countFields, countRows } from '../core/transformer/filterTree.js'
import { activeConditions, collectFields } from '../core/search/index.js'
import { parseQuery } from '../core/search/parseQuery.js'
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

  const query = computed(() => {
    const parsed = parseQuery(uiStore.searchQuery)
    if (!uiStore.searchCaseSensitive) return parsed
    return {
      ...parsed,
      conditions: parsed.conditions.map((condition) => ({ ...condition, caseSensitive: true })),
    }
  })

  /**
   * Several ANDed conditions describe a record rather than a field, so they
   * are matched against whole rows. A single condition — or an OR, where
   * each condition stands on its own — keeps the narrower field view.
   */
  const rowScope = computed(
    () => activeConditions(query.value).length > 1 && query.value.combinator === 'AND'
  )

  const filteredTree = computed(() => {
    if (!tree.value) return null
    return filterTree(tree.value, {
      query: query.value,
      rowScope: rowScope.value,
      hideNulls: uiStore.hideNulls,
      hideEmpty: uiStore.hideEmpty,
      hideIds: uiStore.hideIds || !settingsStore.settings.showTechnicalFields,
    })
  })

  const totalFields = computed(() => countFields(tree.value))
  const visibleFields = computed(() => countFields(filteredTree.value))
  const totalRows = computed(() => countRows(tree.value))
  const visibleRows = computed(() => countRows(filteredTree.value))
  const searchableFields = computed(() => collectFields(tree.value))

  return {
    tree,
    filteredTree,
    query,
    totalFields,
    visibleFields,
    totalRows,
    visibleRows,
    searchableFields,
    rowScope,
  }
}
