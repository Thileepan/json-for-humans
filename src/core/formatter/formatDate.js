/**
 * Locale-aware date rendering built on Intl.DateTimeFormat.
 */

const RELATIVE_UNITS = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['week', 1000 * 60 * 60 * 24 * 7],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
  ['second', 1000],
]

export function formatRelativeDate(date, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date()
  const diff = date.getTime() - now.getTime()
  const rtf = new Intl.RelativeTimeFormat(options.locale, { numeric: 'auto' })
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms || unit === 'second') {
      return rtf.format(Math.round(diff / ms), unit)
    }
  }
  return rtf.format(0, 'second')
}

/**
 * @param {Date} date
 * @param {object} options resolved humanization options
 * @param {'date'|'datetime'} precision how much detail the source value carried
 */
export function formatDate(date, options = {}, precision = 'datetime') {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''

  if (options.dateMode === 'relative') {
    return formatRelativeDate(date, options)
  }

  const timeZone = options.timezone === 'utc' ? 'UTC' : undefined
  const dateOnly = options.dateMode === 'date' || precision === 'date'

  const formatter = new Intl.DateTimeFormat(options.locale, {
    dateStyle: 'long',
    ...(dateOnly ? {} : { timeStyle: 'short' }),
    timeZone,
  })
  return formatter.format(date)
}
