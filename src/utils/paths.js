/**
 * Path helpers for the humanized tree.
 *
 * Concrete paths look like:  customer.orders[2].amount
 * Normalized paths (used for schema lookup) replace indices: customer.orders[].amount
 */

export const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function isDangerousKey(key) {
  return DANGEROUS_KEYS.has(key)
}

export function joinPath(parentPath, key) {
  if (!parentPath) return key
  return `${parentPath}.${key}`
}

export function joinIndexPath(parentPath, index) {
  return `${parentPath || ''}[${index}]`
}

export function normalizePath(path) {
  return String(path).replace(/\[\d+\]/g, '[]')
}

/** Last meaningful segment of a path, e.g. "customer.orders[2].amount" -> "amount". */
export function lastPathKey(path) {
  const cleaned = String(path).replace(/\[\d*\]/g, '')
  const parts = cleaned.split('.').filter(Boolean)
  return parts.length ? parts[parts.length - 1] : ''
}
