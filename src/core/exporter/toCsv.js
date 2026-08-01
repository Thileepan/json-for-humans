/**
 * CSV export for arrays of similar objects. Consumes an 'array' node
 * from the humanized tree whose children are object nodes.
 */

import { csvEscape } from '../../utils/escape.js'
import { formatKey } from '../formatter/formatKey.js'

/** Returns null when the node is not a table-able array. */
export function toCsv(arrayNode) {
  if (!arrayNode || arrayNode.kind !== 'array' || !arrayNode.itemsAreObjects) return null

  const columns = arrayNode.columns?.length
    ? arrayNode.columns
    : [...new Set(arrayNode.children.flatMap((row) => row.children.map((cell) => cell.key)))]

  const header = columns.map((column) => csvEscape(formatKey(column))).join(',')
  const rows = arrayNode.children.map((row) => {
    const byKey = new Map(row.children.map((cell) => [cell.key, cell]))
    return columns
      .map((column) => {
        const cell = byKey.get(column)
        if (!cell) return ''
        if (cell.kind === 'field') return csvEscape(cell.displayValue)
        return csvEscape(cell.displayValue ?? `(${cell.kind})`)
      })
      .join(',')
  })

  return [header, ...rows].join('\r\n') + '\r\n'
}
