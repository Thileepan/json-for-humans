/**
 * Link detection with safe URL handling. Only https:, http:, mailto: and
 * tel: are ever emitted as clickable hrefs. Values are plain text; the
 * engine never produces HTML from JSON content.
 */

const SAFE_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:'])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9][0-9\s\-().]{5,18}$/
const PHONE_NAME_HINT_RE = /(phone|mobile|tel|fax|whatsapp|contact_?number|contactNumber)/i

/** Returns a safe absolute URL string or null. */
export function detectUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return null
  try {
    const url = new URL(value)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href
  } catch {
    return null
  }
  return null
}

export function detectEmail(value) {
  if (typeof value !== 'string') return null
  return EMAIL_RE.test(value.trim()) ? value.trim() : null
}

export function detectPhone(value, fieldName = '') {
  if (typeof value !== 'string') return null
  if (!PHONE_NAME_HINT_RE.test(String(fieldName))) return null
  const trimmed = value.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 6 || digits.length > 15) return null
  return PHONE_RE.test(trimmed) ? trimmed : null
}

/** Validates an href against the protocol allowlist. Returns href or null. */
export function safeHref(href) {
  if (typeof href !== 'string') return null
  try {
    const url = new URL(href, 'https://placeholder.invalid')
    return SAFE_PROTOCOLS.has(url.protocol) ? href : null
  } catch {
    return null
  }
}
