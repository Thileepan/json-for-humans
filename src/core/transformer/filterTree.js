/**
 * Pure tree filtering for search and display filters. Returns a new tree
 * containing only matching nodes (a container is kept when any descendant
 * matches). Returns null when nothing matches.
 *
 * Matching is delegated to the search engine in core/search: `query` may be
 * a plain string (the classic "contains anywhere" search) or a structured
 * query with several conditions, and `match` accepts an already-compiled
 * predicate.
 *
 * `rowScope` switches from field scope to record scope. Several conditions
 * ANDed together can never hold for a single leaf — `status:paid` and
 * `amount>500` describe a *row*, not a field — so in row scope the filter
 * finds the innermost containers whose subtree satisfies every condition
 * and keeps those whole, the way a spreadsheet filter does.
 *
 * Arrays of similar objects are always filtered by row, in either scope: a
 * row is kept entire when anything in it matches. Pruning a row down to the
 * one cell that matched would leave the Table view rendering a line of
 * dashes, and reading a lone "paid" with no order beside it helps nobody.
 */

import {
  MATCH_ALL,
  activeConditions,
  compileQuery,
  compileRowQuery,
} from '../search/compileQuery.js'

const EMPTY_TYPES = new Set(['empty'])

function fieldPassesFilters(node, filters) {
  if (filters.hideNulls && node.detectedType === 'null') return false
  if (filters.hideEmpty && EMPTY_TYPES.has(node.detectedType)) return false
  if (filters.hideIds && node.meta?.isId) return false
  if (node.meta?.hidden && !filters.showHiddenFields) return false
  return true
}

function resolveMatcher(options) {
  if (typeof options.match === 'function') return options.match
  return compileQuery(options.query)
}

function resolveRowMatcher(options) {
  if (!options.rowScope) return null
  if (typeof options.rowMatch === 'function') return options.rowMatch
  const matcher = compileRowQuery(options.query)
  return matcher === MATCH_ALL ? null : matcher
}

/**
 * Matches a node against any one of the conditions. Used where a container
 * satisfies the whole query but no record inside it does — keeping the
 * container whole would dump the entire document on screen, so its matching
 * fields are kept instead.
 */
function resolveAnyMatcher(options) {
  return compileQuery({ conditions: activeConditions(options.query), combinator: 'OR' })
}

/**
 * @param {object} node humanized tree node
 * @param {object} options { query, match, rowScope, rowMatch, hideNulls, hideEmpty, hideIds, showHiddenFields }
 * @returns {object|null} filtered copy of the tree
 */
export function filterTree(node, options = {}) {
  if (!node) return null
  const filters = {
    matcher: resolveMatcher(options),
    rowMatcher: resolveRowMatcher(options),
    hideNulls: !!options.hideNulls,
    hideEmpty: !!options.hideEmpty,
    hideIds: !!options.hideIds,
    showHiddenFields: !!options.showHiddenFields,
  }
  if (filters.rowMatcher) {
    filters.anyMatcher = resolveAnyMatcher(options)
    // The root is a document, never a record, so it is never kept wholesale.
    return filters.rowMatcher(node) ? filterRow(node, filters, false) : null
  }
  return filterNode(node, filters)
}

/** True when `node` or anything under it satisfies the predicate. */
function subtreeMatches(node, matcher) {
  if (!node) return false
  if (matcher(node)) return true
  return (node.children || []).some((child) => subtreeMatches(child, matcher))
}

function filterNode(node, filters) {
  if (node.kind === 'field') {
    if (!fieldPassesFilters(node, filters)) return null
    return filters.matcher(node) ? node : null
  }

  // Containers: keep when the container itself matches, or any child does.
  const selfMatches = filters.matcher(node)
  const children = []

  if (!selfMatches && node.kind === 'array' && node.itemsAreObjects) {
    for (const row of node.children || []) {
      // Hide first, then match: search only sees what is actually on screen,
      // so a row cannot be kept because of a field the filters removed.
      const kept = applyDisplayFilters(row, filters)
      if (kept && subtreeMatches(kept, filters.matcher)) children.push(kept)
    }
    if (filters.hideEmpty && node.isEmpty) return null
    return children.length ? { ...node, children } : null
  }

  for (const child of node.children || []) {
    const kept = filterNode(child, selfMatches ? { ...filters, matcher: MATCH_ALL } : filters)
    if (kept) children.push(kept)
  }

  if (filters.hideEmpty && node.isEmpty) return null
  if (children.length === 0 && !node.isEmpty) {
    return selfMatches && (node.children || []).length === 0 ? node : null
  }
  return { ...node, children }
}

/**
 * `node` already satisfies the whole query. If one of its own containers
 * satisfies it too then the real record is deeper, so descend.
 *
 * Otherwise this is the innermost match, and what to keep depends on what
 * `node` is. A record — an item of an array of similar objects — is kept
 * intact, because that is the row the conditions describe. Anything else
 * (most importantly the root) keeps only the fields that matched: the
 * conditions were satisfied by fields scattered across it, and keeping it
 * whole would show the entire document as though nothing had been filtered.
 */
function filterRow(node, filters, isRecord) {
  const nested = (node.children || []).filter(
    (child) => child.kind !== 'field' && filters.rowMatcher(child)
  )

  if (nested.length > 0) {
    if (filters.hideEmpty && node.isEmpty) return null
    const childrenAreRecords = node.kind === 'array' && node.itemsAreObjects
    const children = nested
      .map((child) => filterRow(child, filters, childrenAreRecords))
      .filter(Boolean)
    return children.length ? { ...node, children } : null
  }

  if (isRecord) return applyDisplayFilters(node, filters)

  return filterNode(node, { ...filters, matcher: filters.anyMatcher, rowMatcher: null })
}

/** Keeps a whole subtree, minus whatever the display filters hide. */
function applyDisplayFilters(node, filters) {
  if (node.kind === 'field') return fieldPassesFilters(node, filters) ? node : null
  if (filters.hideEmpty && node.isEmpty) return null
  const children = (node.children || [])
    .map((child) => applyDisplayFilters(child, filters))
    .filter(Boolean)
  return { ...node, children }
}

/** Counts the rows of arrays-of-objects, for the "n rows" match count. */
export function countRows(node) {
  if (!node) return 0
  if (node.kind === 'array' && node.itemsAreObjects) return (node.children || []).length
  return (node.children || []).reduce((total, child) => total + countRows(child), 0)
}

/** Counts field nodes in a tree (used for match counts in the UI). */
export function countFields(node) {
  if (!node) return 0
  if (node.kind === 'field') return 1
  return (node.children || []).reduce((total, child) => total + countFields(child), 0)
}
