/**
 * Field-name based hints. These only *suggest* formatting; a hint is
 * applied only when the value's actual data type supports it.
 */

const ID_NAME_RE =
  /(^|_)(id|uuid|guid|reference|ref)$|Id$|Uuid$|UUID$|(^|_)(reference_id|transaction_id|order_id)$/
const UUID_VALUE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MONEY_NAME_RE = /(amount|price|cost|total|fee|balance|salary|subtotal|discount|tax)$/i
const PERCENT_NAME_RE = /(percentage|percent|rate|ratio)$/i
const URL_NAME_RE = /(url|website|link|href|homepage)$/i
const EMAIL_NAME_RE = /(^|_)e?mail$|Email$/i
const BOOLEAN_PREFIX_RE = /^(is|has|can|should|was|will)([_A-Z]|$)/
const ENUM_UPPER_RE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/
const ENUM_LOWER_RE = /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/

export function isIdField(fieldName, value) {
  if (typeof value === 'string' && UUID_VALUE_RE.test(value)) return true
  return ID_NAME_RE.test(String(fieldName || ''))
}

export function isMoneyField(fieldName) {
  return MONEY_NAME_RE.test(String(fieldName || ''))
}

export function isPercentField(fieldName) {
  return PERCENT_NAME_RE.test(String(fieldName || ''))
}

export function isUrlField(fieldName) {
  return URL_NAME_RE.test(String(fieldName || ''))
}

export function isEmailField(fieldName) {
  return EMAIL_NAME_RE.test(String(fieldName || ''))
}

export function hasBooleanPrefix(fieldName) {
  return BOOLEAN_PREFIX_RE.test(String(fieldName || ''))
}

/** True for enum-shaped strings such as PAYMENT_PENDING or partially_completed. */
export function isEnumLike(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed.length < 2 || trimmed.length > 64) return false
  return ENUM_UPPER_RE.test(trimmed) || ENUM_LOWER_RE.test(trimmed)
}
