/**
 * Turns comparison results into readable sentences:
 *
 *   Payment Status changed from Pending to Completed.
 *   Customer Email was added.
 *   Delivery Date was removed.
 */

import { formatKey } from '../formatter/formatKey.js'
import { formatValue } from '../formatter/formatValue.js'
import { resolveOptions } from '../options.js'

function labelForPath(path, key) {
  const segments = String(path).split('.')
  const last = segments[segments.length - 1] || String(key ?? '')
  const indexMatch = last.match(/^(.*)\[(\d+)\]$/)
  if (indexMatch) {
    const base = indexMatch[1] ? formatKey(indexMatch[1]) : 'Item'
    return `${base} item ${Number(indexMatch[2]) + 1}`
  }
  return formatKey(last)
}

function humanValue(key, value, options) {
  if (value === undefined) return ''
  if (typeof value === 'object' && value !== null) {
    return Array.isArray(value) ? `a list of ${value.length}` : 'a set of details'
  }
  return formatValue(key ?? '', value, options).displayValue
}

/**
 * @param {Array} changes output of compareJson().changes
 * @param {object} [options] humanization options
 * @returns {string[]} readable sentences (unchanged entries are skipped)
 */
export function describeChanges(changes, options = {}) {
  const resolved = resolveOptions(options)
  const sentences = []

  for (const change of changes) {
    const label = labelForPath(change.path, change.key)
    if (change.type === 'changed') {
      const before = humanValue(change.key, change.before, resolved)
      const after = humanValue(change.key, change.after, resolved)
      sentences.push(`${label} changed from ${before} to ${after}.`)
    } else if (change.type === 'added') {
      const after = humanValue(change.key, change.after, resolved)
      const isContainer = typeof change.after === 'object' && change.after !== null
      sentences.push(isContainer ? `${label} was added.` : `${label} was added as ${after}.`)
    } else if (change.type === 'removed') {
      sentences.push(`${label} was removed.`)
    }
  }

  return sentences
}
