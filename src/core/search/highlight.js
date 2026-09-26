/**
 * Where a query matched inside a piece of text, so the views can mark it.
 *
 * Returns offsets rather than markup: the renderer splits the string into
 * plain text nodes and never interpolates HTML, which keeps untrusted JSON
 * content safe to display.
 */

import { buildRegExp, matchCondition } from './matchCondition.js'
import { normalizeQuery } from './compileQuery.js'
import { fieldMatches } from './fields.js'

// Only operators that point at a *substring* can be highlighted. `gt`,
// `exists` and friends are true of the whole value, not part of it.
const HIGHLIGHTABLE = new Set(['contains', 'equals', 'startsWith', 'endsWith', 'regex'])

function findRanges(text, condition) {
  const needle = String(condition.value ?? '')
  if (!needle) return []

  if (condition.op === 'regex') {
    const pattern = buildRegExp(needle, condition.caseSensitive, 'g')
    if (!pattern) return []
    const ranges = []
    let match = pattern.exec(text)
    while (match) {
      // A zero-length match would loop forever.
      if (match[0].length === 0) {
        pattern.lastIndex += 1
      } else {
        ranges.push([match.index, match.index + match[0].length])
      }
      match = pattern.exec(text)
    }
    return ranges
  }

  const haystack = condition.caseSensitive ? text : text.toLowerCase()
  const target = condition.caseSensitive ? needle : needle.toLowerCase()

  switch (condition.op) {
    case 'equals':
      return haystack === target ? [[0, text.length]] : []
    case 'startsWith':
      return haystack.startsWith(target) ? [[0, target.length]] : []
    case 'endsWith':
      return haystack.endsWith(target) ? [[text.length - target.length, text.length]] : []
    default: {
      const ranges = []
      let index = haystack.indexOf(target)
      while (index !== -1) {
        ranges.push([index, index + target.length])
        index = haystack.indexOf(target, index + target.length)
      }
      return ranges
    }
  }
}

function mergeRanges(ranges) {
  if (ranges.length < 2) return ranges
  const sorted = [...ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const merged = [sorted[0]]
  for (const [start, end] of sorted.slice(1)) {
    const last = merged[merged.length - 1]
    if (start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }
  return merged
}

/**
 * @param {string} text the text being displayed
 * @param {object|null} node the node it came from, used to honor field scoping
 * @param {object|string} query
 * @returns {Array<[number, number]>} merged, ordered ranges
 */
export function highlightRanges(text, node, query) {
  const source = String(text ?? '')
  if (!source) return []

  const { conditions } = normalizeQuery(query)
  const ranges = []

  for (const condition of conditions) {
    if (condition.negate) continue
    if (!HIGHLIGHTABLE.has(condition.op)) continue
    if (node) {
      if (condition.field && !fieldMatches(node, condition.field)) continue
      // Do not mark text in a node the condition did not actually keep.
      if (!matchCondition(node, condition)) continue
    }
    ranges.push(...findRanges(source, condition))
  }

  return mergeRanges(ranges)
}

/**
 * The same thing, ready to render: alternating plain and matched segments.
 * Always returns at least one segment for non-empty text.
 */
export function highlightSegments(text, node, query) {
  const source = String(text ?? '')
  const ranges = highlightRanges(source, node, query)
  if (!ranges.length) return source ? [{ text: source, match: false }] : []

  const segments = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start > cursor) segments.push({ text: source.slice(cursor, start), match: false })
    segments.push({ text: source.slice(start, end), match: true })
    cursor = end
  }
  if (cursor < source.length) segments.push({ text: source.slice(cursor), match: false })
  return segments
}
