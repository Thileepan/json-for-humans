/**
 * Date detection.
 *
 * Strings: ISO 8601 dates and datetimes are detected by shape + validity.
 * Numbers: only treated as Unix timestamps when BOTH the field name hints
 * at a date AND the value falls into a plausible timestamp range, so
 * ordinary numeric IDs are never converted into dates.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ISO_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})?$/

const DATE_NAME_HINT_RE =
  /(date|time|timestamp|created|updated|modified|expire|expiry|scheduled|birth|deadline|due)/i
const AT_ON_SUFFIX_RE = /(_at|_on)$|At$|On$/

// 2001-09-09 .. 2100-01-01 in seconds / milliseconds.
const UNIX_SECONDS_MIN = 1_000_000_000
const UNIX_SECONDS_MAX = 4_102_444_800
const UNIX_MS_MIN = 1_000_000_000_000
const UNIX_MS_MAX = 4_102_444_800_000

export function hasDateNameHint(fieldName) {
  const name = String(fieldName || '')
  return DATE_NAME_HINT_RE.test(name) || AT_ON_SUFFIX_RE.test(name)
}

/**
 * Returns null when the value is not a date, otherwise:
 * { date: Date, precision: 'date' | 'datetime', source: string }
 */
export function detectDate(value, fieldName = '') {
  if (typeof value === 'string') {
    if (ISO_DATETIME_RE.test(value)) {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        return { date, precision: 'datetime', source: 'iso-datetime' }
      }
    }
    if (ISO_DATE_RE.test(value)) {
      const date = new Date(`${value}T00:00:00Z`)
      if (!Number.isNaN(date.getTime())) {
        return { date, precision: 'date', source: 'iso-date' }
      }
    }
    return null
  }

  if (typeof value === 'number' && Number.isInteger(value)) {
    if (!hasDateNameHint(fieldName)) return null
    if (value >= UNIX_MS_MIN && value <= UNIX_MS_MAX) {
      return { date: new Date(value), precision: 'datetime', source: 'unix-ms' }
    }
    if (value >= UNIX_SECONDS_MIN && value <= UNIX_SECONDS_MAX) {
      return { date: new Date(value * 1000), precision: 'datetime', source: 'unix-s' }
    }
  }

  return null
}
