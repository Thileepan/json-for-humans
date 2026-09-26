import { inject, provide } from 'vue'

/**
 * Shares the active query with the deep render tree so matched text can be
 * marked. Provided once per panel rather than resolved per node — a large
 * document renders thousands of values, and each one parsing the query for
 * itself would be wasteful.
 */
const SEARCH_HIGHLIGHT = Symbol('search-highlight')

export function provideSearchHighlight(query) {
  provide(SEARCH_HIGHLIGHT, query)
}

/** Returns a ref holding the active query, or null outside a provider. */
export function useSearchHighlight() {
  return inject(SEARCH_HIGHLIGHT, null)
}
