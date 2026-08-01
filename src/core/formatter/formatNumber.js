/**
 * Locale-aware number formatting built on Intl.NumberFormat.
 * The engine never guesses a currency; currencies come only from a schema.
 */

export function formatNumber(value, options = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value)
  return new Intl.NumberFormat(options.locale, {
    maximumFractionDigits: 6,
  }).format(value)
}

/** Formats a 0..1 ratio as a percentage: 0.85 -> "85%". */
export function formatPercentRatio(value, options = {}) {
  return new Intl.NumberFormat(options.locale, {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(value)
}

/** Formats an already-scaled percentage number: 85 -> "85%". */
export function formatPercentNumber(value, options = {}) {
  return `${formatNumber(value, options)}%`
}

export function formatCurrency(value, currency, options = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !currency) {
    return formatNumber(value, options)
  }
  try {
    return new Intl.NumberFormat(options.locale, {
      style: 'currency',
      currency,
    }).format(value)
  } catch {
    return formatNumber(value, options)
  }
}
