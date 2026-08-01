/**
 * Markdown export of a humanized tree. All values pass through
 * escapeMarkdown so JSON content cannot inject Markdown/HTML.
 */

import { escapeMarkdown } from '../../utils/escape.js'

function heading(depth) {
  return '#'.repeat(Math.min(depth + 2, 6))
}

function renderNode(node, depth, lines) {
  if (!node) return

  if (node.kind === 'field') {
    const value = escapeMarkdown(node.displayValue ?? '')
    if (node.label) {
      lines.push(`**${escapeMarkdown(node.label)}**  `)
      lines.push(value)
    } else {
      lines.push(value)
    }
    lines.push('')
    return
  }

  if (node.label) {
    lines.push(`${heading(depth)} ${escapeMarkdown(node.label)}`)
    lines.push('')
  }

  if (node.isEmpty) {
    lines.push(escapeMarkdown(node.displayValue ?? ''))
    lines.push('')
    return
  }

  if (node.kind === 'array' && node.isPrimitiveList) {
    for (const child of node.children) {
      lines.push(`- ${escapeMarkdown(child.displayValue)}`)
    }
    lines.push('')
    return
  }

  for (const child of node.children) {
    renderNode(child, depth + (node.label ? 1 : 0), lines)
  }
}

export function toMarkdown(root, title = '') {
  const lines = []
  if (title) {
    lines.push(`# ${escapeMarkdown(title)}`)
    lines.push('')
  }
  renderNode(root, 0, lines)
  return (
    lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  )
}
