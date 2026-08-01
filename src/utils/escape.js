/**
 * Escaping helpers used by exporters. All user-provided JSON content is
 * untrusted and must pass through these before being embedded in HTML,
 * Markdown or CSV output.
 */

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function escapeMarkdown(value) {
  return String(value).replace(/([\\`*_{}[\]<>()#+.!|-])/g, '\\$1')
}

/**
 * CSV cell escaping. Also neutralizes spreadsheet formula injection by
 * prefixing cells that start with =, +, - or @ with a single quote.
 */
export function csvEscape(value) {
  let cell = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(cell)) {
    cell = `'${cell}`
  }
  if (/[",\n\r]/.test(cell)) {
    cell = `"${cell.replaceAll('"', '""')}"`
  }
  return cell
}
