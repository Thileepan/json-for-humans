/**
 * Formats a single primitive JSON value into a display string plus
 * metadata. This is the heart of the deterministic humanization engine.
 *
 * Returns: { displayValue, detectedType, meta }
 *   detectedType: 'null' | 'boolean' | 'number' | 'percentage' | 'currency' |
 *                 'date' | 'datetime' | 'enum' | 'id' | 'url' | 'email' |
 *                 'phone' | 'color' | 'empty' | 'text'
 *   meta: { href?, color?, monospace? }
 */

import { formatBoolean } from './formatBoolean.js'
import { formatKey } from './formatKey.js'
import {
  formatCurrency,
  formatNumber,
  formatPercentNumber,
  formatPercentRatio,
} from './formatNumber.js'
import { formatDate } from './formatDate.js'
import { detectDate } from '../detector/detectDate.js'
import { detectEmail, detectPhone, detectUrl } from '../detector/detectLink.js'
import { detectColor } from '../detector/detectColor.js'
import { isEnumLike, isIdField, isMoneyField, isPercentField } from '../detector/detectFieldType.js'

function result(displayValue, detectedType, meta = {}) {
  return { displayValue, detectedType, meta }
}

/** Formats enum-shaped strings: PAYMENT_PENDING -> "Payment Pending". */
export function formatEnumValue(value) {
  return formatKey(String(value).trim())
}

function applySchemaField(value, schemaField, options) {
  switch (schemaField.type) {
    case 'enum': {
      const mapped = schemaField.values ? schemaField.values[String(value)] : undefined
      if (mapped !== undefined) return result(String(mapped), 'enum')
      if (isEnumLike(value)) return result(formatEnumValue(value), 'enum')
      return result(String(value), 'enum')
    }
    case 'currency': {
      if (typeof value === 'number') {
        return result(formatCurrency(value, schemaField.currency, options), 'currency')
      }
      return null
    }
    case 'datetime':
    case 'date': {
      const detected = detectDate(value, 'date')
      if (detected) {
        const precision = schemaField.type === 'date' ? 'date' : detected.precision
        return result(formatDate(detected.date, options, precision), schemaField.type)
      }
      return null
    }
    case 'percentage': {
      if (typeof value === 'number') {
        const display =
          value >= -1 && value <= 1
            ? formatPercentRatio(value, options)
            : formatPercentNumber(value, options)
        return result(display, 'percentage')
      }
      return null
    }
    case 'number': {
      if (typeof value === 'number') return result(formatNumber(value, options), 'number')
      return null
    }
    case 'boolean': {
      if (typeof value === 'boolean') return result(formatBoolean(value, options), 'boolean')
      return null
    }
    case 'id':
      return result(String(value), 'id', { monospace: true })
    case 'text':
      return result(String(value), 'text')
    default:
      return null
  }
}

function formatNumberValue(key, value, options) {
  const detectedDate = detectDate(value, key)
  if (detectedDate) {
    return result(formatDate(detectedDate.date, options, detectedDate.precision), 'datetime')
  }

  if (isIdField(key, value)) {
    // Identifiers are shown verbatim: no digit grouping.
    return result(String(value), 'id', { monospace: true })
  }

  if (isPercentField(key)) {
    if (value >= 0 && value <= 1) {
      return result(formatPercentRatio(value, options), 'percentage')
    }
    if (value > 1 && value <= 100) {
      return result(formatPercentNumber(value, options), 'percentage')
    }
  }

  if (isMoneyField(key)) {
    return result(formatNumber(value, options), 'number')
  }

  return result(formatNumber(value, options), 'number')
}

function formatStringValue(key, value, options) {
  if (value === '') return result(options.emptyStringLabel, 'empty')

  const detectedDate = detectDate(value, key)
  if (detectedDate) {
    return result(
      formatDate(detectedDate.date, options, detectedDate.precision),
      detectedDate.precision === 'date' ? 'date' : 'datetime'
    )
  }

  const url = detectUrl(value)
  if (url) return result(value, 'url', { href: url })

  const email = detectEmail(value)
  if (email) return result(email, 'email', { href: `mailto:${email}` })

  const phone = detectPhone(value, key)
  if (phone) return result(phone, 'phone', { href: `tel:${phone.replace(/[^+\d]/g, '')}` })

  const color = detectColor(value)
  if (color) return result(value, 'color', { color, monospace: true })

  if (isIdField(key, value)) {
    return result(value, 'id', { monospace: true })
  }

  if (isEnumLike(value)) {
    return result(formatEnumValue(value), 'enum')
  }

  return result(value, 'text')
}

/**
 * @param {string} key raw field name (used for smart hints)
 * @param {*} value primitive JSON value (null, boolean, number, string)
 * @param {object} options resolved humanization options
 * @param {object|null} schemaField optional schema entry overriding detection
 */
export function formatValue(key, value, options, schemaField = null) {
  if (schemaField) {
    const overridden = applySchemaField(value, schemaField, options)
    if (overridden) return overridden
  }

  if (value === null) return result(options.nullLabel, 'null')
  if (typeof value === 'boolean') return result(formatBoolean(value, options), 'boolean')
  if (typeof value === 'number') return formatNumberValue(key, value, options)
  if (typeof value === 'string') return formatStringValue(key, value, options)

  // undefined or anything exotic — should not happen with parsed JSON.
  return result(String(value), 'text')
}
