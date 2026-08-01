/**
 * Deterministic JSON comparison. Walks both values and produces a flat
 * list of changes plus counts. Arrays are compared by index.
 *
 * Change: { type: 'added'|'removed'|'changed'|'unchanged',
 *           path, key, before, after }
 */

import { isDangerousKey, joinIndexPath, joinPath } from '../../utils/paths.js'

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function deepEqual(a, b) {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
  }
  return false
}

function record(changes, type, path, key, before, after) {
  changes.push({ type, path, key, before, after })
}

function walk(before, after, path, key, changes, depth) {
  if (depth > 100) return

  const bothObjects = isPlainObject(before) && isPlainObject(after)
  const bothArrays = Array.isArray(before) && Array.isArray(after)

  if (bothObjects) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    for (const childKey of keys) {
      if (isDangerousKey(childKey)) continue
      const childPath = joinPath(path, childKey)
      const inBefore = Object.hasOwn(before, childKey)
      const inAfter = Object.hasOwn(after, childKey)
      if (inBefore && !inAfter) {
        record(changes, 'removed', childPath, childKey, before[childKey], undefined)
      } else if (!inBefore && inAfter) {
        record(changes, 'added', childPath, childKey, undefined, after[childKey])
      } else {
        walk(before[childKey], after[childKey], childPath, childKey, changes, depth + 1)
      }
    }
    return
  }

  if (bothArrays) {
    const max = Math.max(before.length, after.length)
    for (let i = 0; i < max; i++) {
      const childPath = joinIndexPath(path, i)
      if (i >= after.length) {
        record(changes, 'removed', childPath, key, before[i], undefined)
      } else if (i >= before.length) {
        record(changes, 'added', childPath, key, undefined, after[i])
      } else {
        walk(before[i], after[i], childPath, key, changes, depth + 1)
      }
    }
    return
  }

  // Primitive vs primitive, or mismatched container types.
  if (deepEqual(before, after)) {
    record(changes, 'unchanged', path, key, before, after)
  } else {
    record(changes, 'changed', path, key, before, after)
  }
}

/**
 * @returns {{ changes: Array, counts: { added, removed, changed, unchanged } }}
 */
export function compareJson(left, right) {
  const changes = []
  walk(left, right, '', null, changes, 0)

  const counts = { added: 0, removed: 0, changed: 0, unchanged: 0 }
  for (const change of changes) counts[change.type]++

  return { changes, counts }
}
