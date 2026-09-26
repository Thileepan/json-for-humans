/**
 * Compiles a structured query into a single predicate over tree nodes.
 *
 * A query is `{ conditions: [...], combinator: 'AND' | 'OR' }`. A bare
 * string is accepted too and compiles to the plain "contains anywhere"
 * search the app has always had, so existing callers keep their behavior.
 */

import { matchCondition } from './matchCondition.js'

/** Predicate that keeps everything — an absent or empty query. */
export const MATCH_ALL = () => true

const DEFAULT_CONDITION = {
  field: '',
  op: 'contains',
  value: '',
  value2: null,
  negate: false,
  caseSensitive: false,
}

/** Fills in the defaults so callers can pass sparse conditions. */
export function createCondition(partial = {}) {
  return { ...DEFAULT_CONDITION, ...partial }
}

const NEEDS_VALUE = new Set([
  'contains',
  'equals',
  'startsWith',
  'endsWith',
  'regex',
  'gt',
  'gte',
  'lt',
  'lte',
  'type',
])

/**
 * True for a condition that is not finished being written: an operator that
 * needs a value and has not been given one.
 *
 * Half-written conditions must not filter. A person adding a second
 * condition in the builder has, for a moment, an operator and no value — if
 * that counted, the view would either empty out (`amount>` matches nothing)
 * or widen (`city:` matches every city), and it would look as though the
 * first condition had been forgotten. `has:field` and `is:empty` need no
 * value and are therefore always complete.
 */
export function isIncomplete(condition) {
  if (!condition) return true
  const value = String(condition.value ?? '').trim()
  if (condition.op === 'between') {
    return !value || !String(condition.value2 ?? '').trim()
  }
  return NEEDS_VALUE.has(condition.op) && !value
}

/** The conditions that actually constrain the result. */
export function activeConditions(query) {
  return normalizeQuery(query).conditions.filter((condition) => !isIncomplete(condition))
}

/** Accepts a string, a condition array or a full query object. */
export function normalizeQuery(query) {
  if (!query) return { conditions: [], combinator: 'AND' }

  if (typeof query === 'string') {
    const text = query.trim()
    return { conditions: text ? [createCondition({ value: text })] : [], combinator: 'AND' }
  }

  if (Array.isArray(query)) {
    return { conditions: query.map(createCondition), combinator: 'AND' }
  }

  const combinator = String(query.combinator || 'AND').toUpperCase() === 'OR' ? 'OR' : 'AND'
  return { conditions: (query.conditions || []).map(createCondition), combinator }
}

/** True when the query would not filter anything out. */
export function isEmptyQuery(query) {
  return activeConditions(query).length === 0
}

/**
 * @param {string|Array|object} query
 * @returns {(node: object) => boolean}
 */
export function compileQuery(query) {
  const { combinator } = normalizeQuery(query)
  const active = activeConditions(query)
  if (active.length === 0) return MATCH_ALL

  if (active.length === 1) {
    const only = active[0]
    return (node) => matchCondition(node, only)
  }

  if (combinator === 'OR') {
    return (node) => active.some((condition) => matchCondition(node, condition))
  }
  return (node) => active.every((condition) => matchCondition(node, condition))
}

/** True when `node` or any of its descendants satisfies `predicate`. */
function anyDescendant(node, predicate) {
  if (!node) return false
  if (predicate(node)) return true
  return (node.children || []).some((child) => anyDescendant(child, predicate))
}

/**
 * Compiles a query that is evaluated against a whole subtree — a table row,
 * a card, any container — instead of a single node.
 *
 * This is what makes several conditions on *different* fields meaningful:
 * `status:paid AND amount>500` can never hold for one leaf, but it holds for
 * a row whose descendants satisfy both. Negation is applied at the subtree
 * level too, so `-status:cancelled` drops rows that have a cancelled status
 * rather than keeping every row that has some other field.
 *
 * @param {string|Array|object} query
 * @returns {(row: object) => boolean}
 */
export function compileRowQuery(query) {
  const { combinator } = normalizeQuery(query)
  const active = activeConditions(query)
  if (active.length === 0) return MATCH_ALL

  const checks = active.map((condition) => {
    const positive = { ...condition, negate: false }
    const test = (node) => matchCondition(node, positive)
    return (row) => {
      const found = anyDescendant(row, test)
      return condition.negate ? !found : found
    }
  })

  if (combinator === 'OR') return (row) => checks.some((check) => check(row))
  return (row) => checks.every((check) => check(row))
}
