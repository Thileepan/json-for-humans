/**
 * Standalone HTML export. Contains no scripts; every piece of JSON
 * content is escaped, and links are emitted only for allowlisted
 * protocols via safeHref.
 */

import { escapeHtml } from '../../utils/escape.js'
import { safeHref } from '../detector/detectLink.js'

const STYLES = `
  body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1f2937;
         max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
  h1 { font-size: 1.5rem; border-bottom: 2px solid #e5e7eb; padding-bottom: .5rem; }
  h2, h3, h4 { margin: 1.5rem 0 .25rem; color: #111827; }
  .field { margin: .75rem 0; }
  .label { font-size: .8rem; text-transform: uppercase; letter-spacing: .03em; color: #6b7280; }
  .value { font-size: 1rem; }
  ul { margin: .25rem 0; padding-left: 1.25rem; }
  .empty { color: #9ca3af; font-style: italic; }
  section { margin-left: 0; }
  section section { margin-left: 1rem; padding-left: 1rem; border-left: 2px solid #e5e7eb; }
`

function headingTag(depth) {
  return `h${Math.min(depth + 2, 6)}`
}

function renderValue(node) {
  const text = escapeHtml(node.displayValue ?? '')
  const href = node.meta?.href ? safeHref(node.meta.href) : null
  if (href) {
    return `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${text}</a>`
  }
  return text
}

function renderNode(node, depth, parts) {
  if (!node) return

  if (node.kind === 'field') {
    parts.push('<div class="field">')
    if (node.label) parts.push(`<div class="label">${escapeHtml(node.label)}</div>`)
    parts.push(`<div class="value">${renderValue(node)}</div>`)
    parts.push('</div>')
    return
  }

  parts.push('<section>')
  if (node.label) {
    const tag = headingTag(depth)
    parts.push(`<${tag}>${escapeHtml(node.label)}</${tag}>`)
  }

  if (node.isEmpty) {
    parts.push(`<div class="empty">${escapeHtml(node.displayValue ?? '')}</div>`)
  } else if (node.kind === 'array' && node.isPrimitiveList) {
    parts.push('<ul>')
    for (const child of node.children) {
      parts.push(`<li>${renderValue(child)}</li>`)
    }
    parts.push('</ul>')
  } else {
    for (const child of node.children) {
      renderNode(child, depth + (node.label ? 1 : 0), parts)
    }
  }
  parts.push('</section>')
}

export function toHtml(root, title = 'JSON for Humans export') {
  const parts = []
  renderNode(root, 0, parts)
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${STYLES}</style>`,
    '</head>',
    '<body>',
    `<h1>${escapeHtml(title)}</h1>`,
    ...parts,
    '</body>',
    '</html>',
  ].join('\n')
}
