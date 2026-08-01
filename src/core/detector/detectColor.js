/**
 * Detects HEX, RGB(A) and HSL(A) color strings so views can show a
 * small color preview swatch next to the value.
 */

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i
const HSL_RE =
  /^hsla?\(\s*\d{1,3}(?:\.\d+)?(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i

/** Returns a CSS color string usable in a style binding, or null. */
export function detectColor(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (HEX_RE.test(trimmed) || RGB_RE.test(trimmed) || HSL_RE.test(trimmed)) {
    return trimmed
  }
  return null
}
