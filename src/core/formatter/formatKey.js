/**
 * Turns technical field names into human-readable labels.
 *
 *   customer_name  -> Customer Name
 *   customerName   -> Customer Name
 *   CUSTOMER_NAME  -> Customer Name
 *   customer-name  -> Customer Name
 *   URLValue       -> URL Value
 *   user_id        -> User ID
 */

export const DEFAULT_ACRONYMS = [
  'id',
  'url',
  'api',
  'otp',
  'ip',
  'uuid',
  'http',
  'https',
  'json',
  'xml',
  'sql',
  'gst',
  'pan',
]

const ACRONYM_SET = new Set(DEFAULT_ACRONYMS)

/** Splits an identifier into words across snake, kebab, dot and camel/pascal boundaries. */
export function splitWords(key) {
  return String(key)
    .replace(/[_\-.]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function capitalizeWord(word) {
  const lower = word.toLowerCase()
  if (ACRONYM_SET.has(lower)) return lower.toUpperCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function formatKey(key) {
  if (key === null || key === undefined) return ''
  const words = splitWords(key)
  if (words.length === 0) return String(key)
  return words.map(capitalizeWord).join(' ')
}
