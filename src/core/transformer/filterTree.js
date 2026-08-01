/**
 * Pure tree filtering for search and display filters. Returns a new tree
 * containing only matching nodes (a container is kept when any descendant
 * matches). Returns null when nothing matches.
 */

const EMPTY_TYPES = new Set(['empty'])

function fieldMatchesQuery(node, query) {
  if (!query) return true
  const q = query.toLowerCase()
  if (node.key && String(node.key).toLowerCase().includes(q)) return true
  if (node.label && String(node.label).toLowerCase().includes(q)) return true
  if (node.kind === 'field') {
    if (
      String(node.displayValue ?? '')
        .toLowerCase()
        .includes(q)
    )
      return true
    if (
      String(node.rawValue ?? '')
        .toLowerCase()
        .includes(q)
    )
      return true
  }
  return false
}

function fieldPassesFilters(node, filters) {
  if (filters.hideNulls && node.detectedType === 'null') return false
  if (filters.hideEmpty && EMPTY_TYPES.has(node.detectedType)) return false
  if (filters.hideIds && node.meta?.isId) return false
  if (node.meta?.hidden && !filters.showHiddenFields) return false
  return true
}

/**
 * @param {object} node humanized tree node
 * @param {object} options { query, hideNulls, hideEmpty, hideIds, showHiddenFields }
 * @returns {object|null} filtered copy of the tree
 */
export function filterTree(node, options = {}) {
  if (!node) return null
  const filters = {
    query: options.query?.trim() || '',
    hideNulls: !!options.hideNulls,
    hideEmpty: !!options.hideEmpty,
    hideIds: !!options.hideIds,
    showHiddenFields: !!options.showHiddenFields,
  }
  return filterNode(node, filters)
}

function filterNode(node, filters) {
  if (node.kind === 'field') {
    if (!fieldPassesFilters(node, filters)) return null
    return fieldMatchesQuery(node, filters.query) ? node : null
  }

  // Containers: keep when the container itself matches, or any child does.
  const selfMatches = fieldMatchesQuery(node, filters.query)
  const children = []
  for (const child of node.children || []) {
    const kept = filterNode(child, selfMatches ? { ...filters, query: '' } : filters)
    if (kept) children.push(kept)
  }

  if (filters.hideEmpty && node.isEmpty) return null
  if (children.length === 0 && !node.isEmpty) {
    return selfMatches && (node.children || []).length === 0 ? node : null
  }
  return { ...node, children }
}

/** Counts field nodes in a tree (used for match counts in the UI). */
export function countFields(node) {
  if (!node) return 0
  if (node.kind === 'field') return 1
  return (node.children || []).reduce((total, child) => total + countFields(child), 0)
}
