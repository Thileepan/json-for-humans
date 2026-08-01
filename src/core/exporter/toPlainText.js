/**
 * Plain-text export of a humanized tree — a simple readable report.
 */

function renderNode(node, depth, lines) {
  if (!node) return

  if (node.kind === 'field') {
    if (node.label) lines.push(node.label)
    lines.push(String(node.displayValue ?? ''))
    lines.push('')
    return
  }

  if (node.label) {
    lines.push(node.label.toUpperCase())
    lines.push('')
  }

  if (node.isEmpty) {
    lines.push(String(node.displayValue ?? ''))
    lines.push('')
    return
  }

  if (node.kind === 'array' && node.isPrimitiveList) {
    for (const child of node.children) {
      lines.push(`• ${child.displayValue}`)
    }
    lines.push('')
    return
  }

  for (const child of node.children) {
    renderNode(child, depth + 1, lines)
  }
}

export function toPlainText(root) {
  const lines = []
  renderNode(root, 0, lines)
  return (
    lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  )
}
