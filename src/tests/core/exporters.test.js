import { describe, expect, it } from 'vitest'
import { humanizeJson } from '../../core/transformer/humanizeJson.js'
import { toPlainText } from '../../core/exporter/toPlainText.js'
import { toMarkdown } from '../../core/exporter/toMarkdown.js'
import { toHtml } from '../../core/exporter/toHtml.js'
import { toCsv } from '../../core/exporter/toCsv.js'

const OPTS = { locale: 'en-US', timezone: 'utc' }

describe('toPlainText', () => {
  it('renders labels and values', () => {
    const tree = humanizeJson({ customer_name: 'Ravi Kumar', is_deleted: false }, OPTS)
    const text = toPlainText(tree)
    expect(text).toContain('Customer Name\nRavi Kumar')
    expect(text).toContain('Deleted\nNo')
  })

  it('renders primitive arrays as bullets', () => {
    const tree = humanizeJson({ roles: ['ADMIN', 'VIEWER'] }, OPTS)
    const text = toPlainText(tree)
    expect(text).toContain('• Admin')
    expect(text).toContain('• Viewer')
  })
})

describe('toMarkdown', () => {
  it('escapes markdown special characters in values', () => {
    const tree = humanizeJson({ note: '**bold** <img src=x>' }, OPTS)
    const markdown = toMarkdown(tree)
    expect(markdown).not.toContain('**bold**')
    expect(markdown).toContain('\\*\\*bold\\*\\*')
    expect(markdown).toContain('\\<img')
  })

  it('renders sections as headings', () => {
    const tree = humanizeJson({ customer: { name: 'Ravi' } }, OPTS)
    const markdown = toMarkdown(tree)
    expect(markdown).toContain('## Customer')
  })
})

describe('toHtml', () => {
  it('escapes HTML in keys and values', () => {
    const tree = humanizeJson({ '<script>alert(1)</script>': '<img onerror=x src=y>' }, OPTS)
    const html = toHtml(tree)
    expect(html).not.toContain('<script>alert(1)')
    expect(html).not.toContain('<img onerror')
    expect(html).toContain('&lt;img onerror=x src=y&gt;')
  })

  it('contains no script tags at all', () => {
    const tree = humanizeJson({ a: 1 }, OPTS)
    expect(toHtml(tree)).not.toMatch(/<script/i)
  })

  it('links only safe protocols', () => {
    const safe = humanizeJson({ site_url: 'https://example.com/x' }, OPTS)
    expect(toHtml(safe)).toContain('href="https://example.com/x"')

    const unsafe = humanizeJson({ link: 'javascript:alert(1)' }, OPTS)
    expect(toHtml(unsafe)).not.toContain('href="javascript:')
  })
})

describe('toCsv', () => {
  it('exports arrays of objects with humanized headers', () => {
    const tree = humanizeJson(
      {
        users: [
          { user_id: 1, full_name: 'Meera' },
          { user_id: 2, full_name: 'Arjun' },
        ],
      },
      OPTS
    )
    const csv = toCsv(tree.children[0])
    const lines = csv.trim().split('\r\n')
    expect(lines[0]).toBe('User ID,Full Name')
    expect(lines[1]).toBe('1,Meera')
  })

  it('quotes cells containing commas and escapes quotes', () => {
    const tree = humanizeJson(
      {
        rows: [
          { a: 'x,y', b: 'say "hi"' },
          { a: 'p', b: 'q' },
        ],
      },
      OPTS
    )
    const csv = toCsv(tree.children[0])
    expect(csv).toContain('"x,y"')
    expect(csv).toContain('"say ""hi"""')
  })

  it('neutralizes spreadsheet formula injection', () => {
    const tree = humanizeJson({ rows: [{ formula: '=SUM(A1:A9)' }, { formula: 'safe' }] }, OPTS)
    const csv = toCsv(tree.children[0])
    expect(csv).toContain("'=SUM(A1:A9)")
  })

  it('returns null for non-tabular nodes', () => {
    const tree = humanizeJson({ roles: ['A', 'B'] }, OPTS)
    expect(toCsv(tree.children[0])).toBeNull()
  })
})
