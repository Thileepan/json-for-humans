import { toPlainText } from '../core/exporter/toPlainText.js'
import { toMarkdown } from '../core/exporter/toMarkdown.js'
import { toHtml } from '../core/exporter/toHtml.js'
import { toCsv } from '../core/exporter/toCsv.js'

function download(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Export helpers. Everything is generated locally in the browser; the
 * HTML export contains no scripts and all content is escaped.
 */
export function useExport() {
  function exportPlainText(tree) {
    download('json-for-humans.txt', toPlainText(tree), 'text/plain')
  }

  function exportMarkdown(tree, title) {
    download('json-for-humans.md', toMarkdown(tree, title), 'text/markdown')
  }

  function exportHtml(tree, title) {
    download('json-for-humans.html', toHtml(tree, title), 'text/html')
  }

  function exportJson(rawValue, indentSize = 2) {
    download('json-for-humans.json', JSON.stringify(rawValue, null, indentSize), 'application/json')
  }

  /** Returns false when the node cannot be exported as CSV. */
  function exportCsv(arrayNode) {
    const csv = toCsv(arrayNode)
    if (csv === null) return false
    download('json-for-humans.csv', csv, 'text/csv')
    return true
  }

  function printPage() {
    window.print()
  }

  return {
    exportPlainText,
    exportMarkdown,
    exportHtml,
    exportJson,
    exportCsv,
    printPage,
    asPlainText: toPlainText,
    asMarkdown: toMarkdown,
    asHtml: toHtml,
  }
}
