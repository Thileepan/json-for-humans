/**
 * Field identity helpers for scoped search.
 *
 * A condition can name a field in whatever form the user has in front of
 * them — the raw key (`customer_name`), the humanized label
 * ("Customer Name") or a path (`orders[].amount`). All three normalize to
 * the same identifier, so scoping works from any view.
 */

import { normalizePath } from '../../utils/paths.js'
import { comparableKind } from './matchCondition.js'

/**
 * Lower-cases, drops array indices and strips anything that is not a
 * letter, digit or path separator:
 *   customer_name   -> customername
 *   "Customer Name" -> customername
 *   orders[2].amount -> orders.amount
 */
export function normalizeIdent(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\[\d*\]/g, '')
    .replace(/[^a-z0-9.]+/g, '')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
}

/** Every identifier a node can be addressed by (key, label, path). */
export function fieldCandidates(node) {
  if (!node) return []
  const candidates = []
  if (node.key) candidates.push(normalizeIdent(node.key))
  if (node.label) candidates.push(normalizeIdent(node.label))
  if (node.path) candidates.push(normalizeIdent(node.path))
  return candidates.filter(Boolean)
}

/**
 * True when `node` is the field named by `spec`. A bare name matches at any
 * depth (`amount` hits `orders[].amount`); a dotted spec must match a path
 * suffix, so `orders.amount` will not match `refunds.amount`.
 */
export function fieldMatches(node, spec) {
  const target = normalizeIdent(spec)
  if (!target) return true
  return fieldCandidates(node).some(
    (candidate) => candidate === target || candidate.endsWith(`.${target}`)
  )
}

/**
 * Walks a humanized tree and collects the distinct fields it contains —
 * the source for a field/column picker.
 *
 * Each entry carries the detected types its values have (`types`) and
 * whether those values can be ordered (`orderable`) — which is decided by
 * the value, not by the detected type, so a numeric `user_id` counts as
 * orderable even though it displays as an identifier.
 *
 * @param {object} node humanized tree node
 * @param {object} [options] { includeContainers } also list object/array nodes
 * @returns {Array<{path, key, label, ident, kind, types, orderable, count}>} sorted by path
 */
export function collectFields(node, options = {}) {
  const found = new Map()
  visit(node, found, !!options.includeContainers)
  return [...found.values()].sort((a, b) => a.path.localeCompare(b.path))
}

/**
 * Booleans compare as 0 and 1 so that equality works, but "greater than
 * false" is not a question worth offering.
 */
function isOrderable(node) {
  if (node.detectedType === 'boolean') return false
  const kind = comparableKind(node)
  return kind === 'number' || kind === 'date'
}

function visit(node, found, includeContainers) {
  if (!node) return
  const isField = node.kind === 'field'
  if (node.key && (isField || includeContainers)) {
    const path = normalizePath(node.path || node.key)
    const entry = found.get(path)
    if (entry) {
      entry.count += 1
      if (node.detectedType && !entry.types.includes(node.detectedType)) {
        entry.types.push(node.detectedType)
      }
      if (isField && isOrderable(node)) entry.orderable = true
    } else {
      found.set(path, {
        path,
        key: node.key,
        label: node.label || null,
        ident: normalizeIdent(path),
        kind: node.kind,
        types: node.detectedType ? [node.detectedType] : [],
        orderable: isField ? isOrderable(node) : false,
        count: 1,
      })
    }
  }
  for (const child of node.children || []) visit(child, found, includeContainers)
}
