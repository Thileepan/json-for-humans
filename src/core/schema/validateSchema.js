/**
 * Validates a user-provided schema configuration. A schema looks like:
 *
 * {
 *   "fields": {
 *     "status": { "label": "Application Status", "type": "enum",
 *                 "values": { "1": "Draft", "2": "Approved" } },
 *     "amount": { "label": "Total Amount", "type": "currency", "currency": "INR" },
 *     "orders[].amount": { "type": "currency", "currency": "USD" }
 *   }
 * }
 */

import { DANGEROUS_KEYS } from '../../utils/paths.js'

export const SCHEMA_FIELD_TYPES = [
  'text',
  'number',
  'currency',
  'percentage',
  'boolean',
  'enum',
  'date',
  'datetime',
  'id',
]

const PATH_RE = /^[A-Za-z0-9_$-]+(\[\])?(\.[A-Za-z0-9_$-]+(\[\])?)*$/

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Returns { valid: boolean, errors: string[] } */
export function validateSchema(schema) {
  const errors = []

  if (!isPlainObject(schema)) {
    return { valid: false, errors: ['Schema must be a JSON object.'] }
  }
  if (!isPlainObject(schema.fields)) {
    return { valid: false, errors: ['Schema must contain a "fields" object.'] }
  }

  for (const [path, field] of Object.entries(schema.fields)) {
    const segments = path.replace(/\[\]/g, '').split('.')
    if (segments.some((segment) => DANGEROUS_KEYS.has(segment))) {
      errors.push(`Field path "${path}" uses a forbidden key.`)
      continue
    }
    if (!PATH_RE.test(path)) {
      errors.push(`Field path "${path}" is not a valid path (use dots and [] for arrays).`)
      continue
    }
    if (!isPlainObject(field)) {
      errors.push(`Field "${path}" must be an object.`)
      continue
    }
    if (field.label !== undefined && typeof field.label !== 'string') {
      errors.push(`Field "${path}": "label" must be a string.`)
    }
    if (field.type !== undefined && !SCHEMA_FIELD_TYPES.includes(field.type)) {
      errors.push(`Field "${path}": unknown type "${field.type}".`)
    }
    if (field.type === 'currency' && typeof field.currency !== 'string') {
      errors.push(`Field "${path}": currency fields need a "currency" code (e.g. "INR").`)
    }
    if (field.values !== undefined && !isPlainObject(field.values)) {
      errors.push(`Field "${path}": "values" must be an object mapping raw values to labels.`)
    }
    if (field.hidden !== undefined && typeof field.hidden !== 'boolean') {
      errors.push(`Field "${path}": "hidden" must be true or false.`)
    }
  }

  return { valid: errors.length === 0, errors }
}
