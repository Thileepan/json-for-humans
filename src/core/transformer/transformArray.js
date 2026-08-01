import { formatKey } from '../formatter/formatKey.js'
import { joinIndexPath } from '../../utils/paths.js'
import { isPlainObject, transformNode } from './humanizeJson.js'

/**
 * Table mode is recommended when the array holds two or more objects
 * whose key sets overlap enough to form meaningful columns.
 */
function computeTableRecommendation(items) {
  if (items.length < 2) return { recommended: false, columns: [] }
  const keyCounts = new Map()
  for (const item of items) {
    for (const itemKey of Object.keys(item)) {
      keyCounts.set(itemKey, (keyCounts.get(itemKey) || 0) + 1)
    }
  }
  const columns = [...keyCounts.keys()]
  const shared = columns.filter((column) => keyCounts.get(column) >= items.length * 0.5)
  return {
    recommended: columns.length > 0 && shared.length / columns.length >= 0.5,
    columns,
  }
}

export function transformArray(value, key, path, normalizedPathValue, depth, context) {
  const { options } = context

  const node = {
    kind: 'array',
    key,
    label: key === null ? null : formatKey(key),
    path,
    itemCount: value.length,
    isEmpty: value.length === 0,
    isPrimitiveList: value.every((item) => item === null || typeof item !== 'object'),
    itemsAreObjects: value.length > 0 && value.every((item) => isPlainObject(item)),
    tableRecommended: false,
    columns: [],
    children: [],
  }

  const schemaField = context.schemaLookup(normalizedPathValue, key)
  if (schemaField?.label) node.label = schemaField.label

  if (node.isEmpty) {
    node.displayValue = options.emptyArrayLabel
    return node
  }

  if (node.itemsAreObjects) {
    const { recommended, columns } = computeTableRecommendation(value)
    node.tableRecommended = recommended
    node.columns = columns
  }

  const normalizedChild = `${normalizedPathValue}[]`
  value.forEach((item, index) => {
    const child = transformNode(
      item,
      key,
      joinIndexPath(path, index),
      normalizedChild,
      depth + 1,
      context
    )
    child.label = node.itemsAreObjects || child.kind !== 'field' ? `Item ${index + 1}` : null
    child.index = index
    node.children.push(child)
  })

  return node
}
