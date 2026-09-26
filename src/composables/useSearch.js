import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { createCondition } from '../core/search/index.js'
import { parseQuery, serializeQuery } from '../core/search/parseQuery.js'
import { useUiStore } from '../stores/uiStore.js'

/**
 * Reactive search/filter state shared by the toolbar and views.
 *
 * The typed text is the single source of truth: the condition chips are a
 * parse of it, and every builder action serializes straight back into it.
 * That way the box and the builder can never drift apart, and there is one
 * thing to clear.
 */
export function useSearch() {
  const uiStore = useUiStore()
  const { searchQuery, searchCaseSensitive, hideNulls, hideEmpty, hideIds } = storeToRefs(uiStore)

  const parsed = computed(() => parseQuery(searchQuery.value))
  const conditions = computed(() => parsed.value.conditions)
  const combinator = computed(() => parsed.value.combinator)

  function commit(nextConditions, nextCombinator = combinator.value) {
    searchQuery.value = serializeQuery({
      conditions: nextConditions,
      combinator: nextCombinator,
    })
  }

  function addCondition(partial = {}) {
    commit([...conditions.value, createCondition(partial)])
  }

  function updateCondition(index, patch) {
    commit(
      conditions.value.map((condition, position) =>
        position === index ? { ...condition, ...patch } : condition
      )
    )
  }

  function removeCondition(index) {
    commit(conditions.value.filter((_, position) => position !== index))
  }

  function setCombinator(value) {
    commit(conditions.value, value === 'OR' ? 'OR' : 'AND')
  }

  return {
    searchQuery,
    searchCaseSensitive,
    hideNulls,
    hideEmpty,
    hideIds,
    conditions,
    combinator,
    addCondition,
    updateCondition,
    removeCondition,
    setCombinator,
    resetFilters: uiStore.resetFilters,
  }
}
