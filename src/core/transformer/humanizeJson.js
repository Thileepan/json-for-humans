/**
 * The deterministic humanization engine. Framework-free: accepts plain
 * JavaScript values (from JSON.parse) and returns a normalized tree that
 * every display mode consumes.
 *
 *   const tree = humanizeJson(input, options, schema)
 *
 * Node kinds:
 *   field  – primitive leaf { key, label, path, rawValue, displayValue, detectedType, meta }
 *   object – { key, label, path, children, entryCount, isEmpty, displayValue? }
 *   array  – { key, label, path, children, itemCount, isEmpty, isPrimitiveList,
 *              itemsAreObjects, tableRecommended, columns }
 */

import { resolveOptions } from '../options.js'
import { formatKey } from '../formatter/formatKey.js'
import { formatValue } from '../formatter/formatValue.js'
import { createSchemaLookup } from '../schema/applySchema.js'
import { isIdField } from '../detector/detectFieldType.js'
import { isDangerousKey, joinIndexPath, joinPath, normalizePath } from '../../utils/paths.js'
import { transformObject } from './transformObject.js'
import { transformArray } from './transformArray.js'

export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Internal recursive walker shared by transformObject / transformArray.
 * `context` carries resolved options and the schema lookup.
 */
export function transformNode(value, key, path, normalizedPathValue, depth, context) {
  const { options } = context

  if (depth > options.maxDepth) {
    return {
      kind: 'field',
      key,
      label: key === null ? null : formatKey(key),
      path,
      rawValue: undefined,
      displayValue: '… (maximum depth reached)',
      detectedType: 'truncated',
      meta: { truncated: true },
    }
  }

  if (Array.isArray(value)) {
    return transformArray(value, key, path, normalizedPathValue, depth, context)
  }

  if (isPlainObject(value)) {
    return transformObject(value, key, path, normalizedPathValue, depth, context)
  }

  const schemaField = context.schemaLookup(normalizedPathValue, key)
  const { displayValue, detectedType, meta } = formatValue(key, value, options, schemaField)

  // Boolean-friendly labels: is_deleted -> "Deleted", has_access -> "Access".
  let autoLabel = key === null ? null : formatKey(key)
  if (detectedType === 'boolean' && typeof key === 'string' && /^(is|has)[_A-Z]/.test(key)) {
    const stripped = formatKey(key.replace(/^(is|has)[_]?/, ''))
    if (stripped) autoLabel = stripped
  }

  return {
    kind: 'field',
    key,
    label: schemaField?.label ?? autoLabel,
    path,
    rawValue: value,
    displayValue,
    detectedType,
    meta: {
      ...meta,
      isId: detectedType === 'id' || isIdField(key, value),
      hidden: schemaField?.hidden === true,
    },
  }
}

/**
 * Entry point.
 * @param {*} input parsed JSON value
 * @param {object} [options] humanization options (see core/options.js)
 * @param {object|null} [schema] optional field schema
 */
export function humanizeJson(input, options = {}, schema = null) {
  const context = {
    options: resolveOptions(options),
    schemaLookup: createSchemaLookup(schema),
  }
  return transformNode(input, null, '', '', 0, context)
}

export { joinPath, joinIndexPath, normalizePath, isDangerousKey }
