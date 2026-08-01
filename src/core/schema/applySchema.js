/**
 * Builds a lookup function from a validated schema. Lookup order:
 *   1. exact normalized path match ("customer.address.city", "orders[].amount")
 *   2. bare field-name match ("status" matches a field named status at any depth)
 *
 * Schema settings always override automatic detection.
 */

import { DANGEROUS_KEYS, normalizePath } from '../../utils/paths.js'
import { validateSchema } from './validateSchema.js'

export function createSchemaLookup(schema) {
  if (!schema || !validateSchema(schema).valid) {
    return () => null
  }

  const byPath = new Map()
  const byKey = new Map()

  for (const [path, field] of Object.entries(schema.fields)) {
    const segments = path.replace(/\[\]/g, '').split('.')
    if (segments.some((segment) => DANGEROUS_KEYS.has(segment))) continue
    byPath.set(normalizePath(path), field)
    if (segments.length === 1) {
      byKey.set(segments[0], field)
    }
  }

  return function lookup(normalizedFieldPath, key) {
    const exact = byPath.get(normalizedFieldPath)
    if (exact) return exact
    if (key && byKey.has(key)) return byKey.get(key)
    return null
  }
}

export const EXAMPLE_SCHEMA = {
  fields: {
    status: {
      label: 'Application Status',
      type: 'enum',
      values: {
        1: 'Draft',
        2: 'Approved',
        3: 'Rejected',
      },
    },
    amount: {
      label: 'Total Amount',
      type: 'currency',
      currency: 'INR',
    },
    created_at: {
      label: 'Submitted On',
      type: 'datetime',
    },
  },
}
