import { formatKey } from '../formatter/formatKey.js'
import { isDangerousKey, joinPath } from '../../utils/paths.js'
import { transformNode } from './humanizeJson.js'

export function transformObject(value, key, path, normalizedPathValue, depth, context) {
  const { options } = context
  const keys = Object.keys(value)

  const node = {
    kind: 'object',
    key,
    label: key === null ? null : formatKey(key),
    path,
    entryCount: keys.length,
    isEmpty: keys.length === 0,
    children: [],
  }

  const schemaField = context.schemaLookup(normalizedPathValue, key)
  if (schemaField?.label) node.label = schemaField.label

  if (node.isEmpty) {
    node.displayValue = options.emptyObjectLabel
    return node
  }

  for (const childKey of keys) {
    // Dangerous keys are rendered as inert text and never recursed into.
    if (isDangerousKey(childKey)) {
      node.children.push({
        kind: 'field',
        key: childKey,
        label: childKey,
        path: joinPath(path, childKey),
        rawValue: undefined,
        displayValue: '(unsafe key skipped)',
        detectedType: 'text',
        meta: { unsafe: true },
      })
      continue
    }
    const childPath = joinPath(path, childKey)
    const childNormalized = joinPath(normalizedPathValue, childKey)
    node.children.push(
      transformNode(value[childKey], childKey, childPath, childNormalized, depth + 1, context)
    )
  }

  return node
}
