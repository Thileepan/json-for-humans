/**
 * Evaluates a single search condition against one humanized tree node.
 *
 * A condition is a plain object:
 *   { field, op, value, value2, negate, caseSensitive }
 *
 *   field   '' matches any field; otherwise a key, label or path (see fields.js)
 *   op      contains | equals | startsWith | endsWith | regex
 *           gt | gte | lt | lte | between
 *           exists | isEmpty | type
 *   value2  upper bound, `between` only
 *   negate  inverts the whole condition, field scoping included — so
 *           `-status:cancelled` keeps every node that is not a cancelled
 *           status, rather than only non-status fields.
 *
 * Which value is searched depends on the operator, because the user sees a
 * formatted string ("₹1,200.00") while the JSON holds a number (1200):
 *   text ops        -> displayValue and rawValue (and key/label when unscoped)
 *   comparison ops  -> rawValue, coerced to number or timestamp
 */

import { detectDate } from '../detector/detectDate.js'
import { fieldMatches } from './fields.js'

export const TEXT_OPS = ['contains', 'equals', 'startsWith', 'endsWith', 'regex']
export const COMPARISON_OPS = ['gt', 'gte', 'lt', 'lte', 'between']
export const UNARY_OPS = ['exists', 'isEmpty']
export const OPERATORS = [...TEXT_OPS, ...COMPARISON_OPS, ...UNARY_OPS, 'type']

const TEXT_OP_SET = new Set(TEXT_OPS)
const COMPARISON_OP_SET = new Set(COMPARISON_OPS)

// User-supplied patterns are untrusted: cap the length and never let a bad
// pattern throw out of the filter.
const MAX_REGEX_LENGTH = 200

export function buildRegExp(pattern, caseSensitive, flags = '') {
  if (!pattern || pattern.length > MAX_REGEX_LENGTH) return null
  try {
    return new RegExp(pattern, caseSensitive ? flags : `${flags}i`)
  } catch {
    return null
  }
}

/** Numeric strings, including grouped ones ("1,200.50"). */
function toNumber(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null
  const text = String(input ?? '').trim()
  if (!text) return null
  const cleaned = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text) ? text.replaceAll(',', '') : text
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

function textHaystacks(node, scoped) {
  const haystacks = []
  if (node.kind === 'field') {
    if (node.displayValue !== undefined && node.displayValue !== null) {
      haystacks.push(String(node.displayValue))
    }
    if (node.rawValue !== undefined && node.rawValue !== null) {
      haystacks.push(String(node.rawValue))
    }
  }
  // An unscoped term still matches the field's name, as plain search always has.
  if (!scoped) {
    if (node.key) haystacks.push(String(node.key))
    if (node.label) haystacks.push(String(node.label))
  }
  return haystacks
}

/**
 * Lower-casing every value on every keystroke is the bulk of the filtering
 * cost on a large document. Tree nodes are rebuilt only when the JSON or
 * the formatting options change, so their identity is a safe cache key, and
 * a WeakMap lets the entries go as soon as the tree does.
 */
const loweredCache = new WeakMap()

function loweredHaystacks(node, scoped) {
  let entry = loweredCache.get(node)
  if (!entry) {
    entry = {
      scoped: textHaystacks(node, true).map((text) => text.toLowerCase()),
      unscoped: textHaystacks(node, false).map((text) => text.toLowerCase()),
    }
    loweredCache.set(node, entry)
  }
  return scoped ? entry.scoped : entry.unscoped
}

function matchText(node, condition, scoped) {
  const haystacks =
    condition.caseSensitive || condition.op === 'regex' ? textHaystacks(node, scoped) : null
  const needle =
    condition.value === undefined || condition.value === null ? '' : String(condition.value)

  if (condition.op === 'regex') {
    const pattern = buildRegExp(needle, condition.caseSensitive)
    return pattern ? haystacks.some((haystack) => pattern.test(haystack)) : false
  }

  if (!needle) return true

  const target = condition.caseSensitive ? needle : needle.toLowerCase()
  const candidates = condition.caseSensitive ? haystacks : loweredHaystacks(node, scoped)
  return candidates.some((haystack) => {
    switch (condition.op) {
      case 'equals':
        return haystack === target
      case 'startsWith':
        return haystack.startsWith(target)
      case 'endsWith':
        return haystack.endsWith(target)
      default:
        return haystack.includes(target)
    }
  })
}

/**
 * The comparable form of a node: a number, a timestamp or text. Containers
 * compare by size, so `orders>3` means "more than three orders".
 */
function nodeComparable(node) {
  if (node.kind !== 'field') {
    const size = node.itemCount ?? node.entryCount
    return size === undefined ? null : { type: 'number', value: size }
  }

  const raw = node.rawValue
  if (raw === undefined || raw === null) return null
  if (typeof raw === 'boolean') return { type: 'number', value: raw ? 1 : 0 }

  if (typeof raw === 'number') {
    if (node.detectedType === 'date' || node.detectedType === 'datetime') {
      const detected = detectDate(raw, node.key ?? '')
      if (detected) return { type: 'date', value: detected.date.getTime() }
    }
    return { type: 'number', value: raw }
  }

  const detected = detectDate(raw, node.key ?? '')
  if (detected) return { type: 'date', value: detected.date.getTime() }

  const numeric = toNumber(raw)
  if (numeric !== null) return { type: 'number', value: numeric }

  return { type: 'text', value: String(raw) }
}

/**
 * How this node can be compared: 'number', 'date', 'text', or null when it
 * cannot be compared at all.
 *
 * Callers use this to decide which operators are worth offering, so that the
 * question a field is asked is one the matcher can actually answer. Note it
 * reflects the *value*, not the detected type — `user_id: 1` is detected as
 * an "id" for display purposes but is still a number and orders like one,
 * while `order_ref: "A-1"` is an id that does not.
 */
export function comparableKind(node) {
  if (!node) return null
  return nodeComparable(node)?.type ?? null
}

/** Coerces the condition's operand into the same space as the node's value. */
function operandComparable(operand, type) {
  if (operand === undefined || operand === null || operand === '') return null
  if (type === 'date') {
    const detected = detectDate(typeof operand === 'string' ? operand.trim() : operand, 'date')
    if (detected) return detected.date.getTime()
    return toNumber(operand)
  }
  if (type === 'number') return toNumber(operand)
  return String(operand)
}

function compareValues(left, right, isText) {
  if (isText) return String(left).localeCompare(String(right))
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

/**
 * A numeric bound against a text value is a mistake rather than a request
 * for an alphabetical comparison: `amount>500` must not match a field
 * holding "Ravi Kumar". A non-numeric bound still compares lexically, so
 * `name>M` keeps working.
 */
function rejectsNumericBound(target, ...operands) {
  if (target.type !== 'text') return false
  return operands.some(
    (operand) =>
      operand !== undefined && operand !== null && operand !== '' && toNumber(operand) !== null
  )
}

function matchComparison(node, condition) {
  const target = nodeComparable(node)
  if (!target) return false

  const isText = target.type === 'text'
  const bound = operandComparable(condition.value, target.type)
  if (bound === null) return false
  if (rejectsNumericBound(target, condition.value, condition.value2)) return false

  if (condition.op === 'between') {
    const other = operandComparable(condition.value2, target.type)
    if (other === null) return false
    const ascending = compareValues(bound, other, isText) <= 0
    const low = ascending ? bound : other
    const high = ascending ? other : bound
    return (
      compareValues(target.value, low, isText) >= 0 &&
      compareValues(target.value, high, isText) <= 0
    )
  }

  const order = compareValues(target.value, bound, isText)
  switch (condition.op) {
    case 'gt':
      return order > 0
    case 'gte':
      return order >= 0
    case 'lt':
      return order < 0
    default:
      return order <= 0
  }
}

function matchExists(node) {
  if (node.kind !== 'field') return !node.isEmpty
  return node.rawValue !== undefined && node.rawValue !== null
}

function matchIsEmpty(node) {
  if (node.kind !== 'field') return !!node.isEmpty
  const raw = node.rawValue
  if (raw === undefined || raw === null) return true
  if (typeof raw === 'string') return raw.trim() === ''
  return node.detectedType === 'empty'
}

function matchDetectedType(node, condition) {
  const wanted = String(condition.value ?? '')
    .trim()
    .toLowerCase()
  if (!wanted) return true
  if (node.kind !== 'field') return node.kind === wanted
  return String(node.detectedType || '').toLowerCase() === wanted
}

/**
 * @param {object} node humanized tree node
 * @param {object} condition see the module header
 * @returns {boolean}
 */
export function matchCondition(node, condition) {
  if (!node || !condition) return true

  const op = condition.op || 'contains'
  const scoped = !!String(condition.field ?? '').trim()

  let result
  if (scoped && !fieldMatches(node, condition.field)) {
    result = false
  } else if (TEXT_OP_SET.has(op)) {
    result = matchText(node, condition, scoped)
  } else if (COMPARISON_OP_SET.has(op)) {
    result = matchComparison(node, condition)
  } else if (op === 'exists') {
    result = matchExists(node)
  } else if (op === 'isEmpty') {
    result = matchIsEmpty(node)
  } else if (op === 'type') {
    result = matchDetectedType(node, condition)
  } else {
    result = matchText(node, { ...condition, op: 'contains' }, scoped)
  }

  return condition.negate ? !result : result
}
