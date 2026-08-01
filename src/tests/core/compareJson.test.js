import { describe, expect, it } from 'vitest'
import { compareJson } from '../../core/comparator/compareJson.js'
import { describeChanges } from '../../core/comparator/describeChanges.js'

describe('compareJson', () => {
  it('detects added, removed, changed and unchanged fields', () => {
    const before = { a: 1, b: 'x', gone: true }
    const after = { a: 1, b: 'y', fresh: 'new' }
    const { changes, counts } = compareJson(before, after)

    expect(counts).toEqual({ added: 1, removed: 1, changed: 1, unchanged: 1 })
    expect(changes.find((c) => c.path === 'b').type).toBe('changed')
    expect(changes.find((c) => c.path === 'gone').type).toBe('removed')
    expect(changes.find((c) => c.path === 'fresh').type).toBe('added')
    expect(changes.find((c) => c.path === 'a').type).toBe('unchanged')
  })

  it('compares nested objects by path', () => {
    const { changes } = compareJson(
      { customer: { city: 'Chennai' } },
      { customer: { city: 'Bengaluru' } }
    )
    const change = changes.find((c) => c.type === 'changed')
    expect(change.path).toBe('customer.city')
  })

  it('detects added and removed array items', () => {
    const { changes, counts } = compareJson({ items: [1, 2] }, { items: [1] })
    expect(counts.removed).toBe(1)
    expect(changes.find((c) => c.type === 'removed').path).toBe('items[1]')

    const added = compareJson({ items: [1] }, { items: [1, 2, 3] })
    expect(added.counts.added).toBe(2)
  })

  it('treats type mismatches as changes', () => {
    const { counts } = compareJson({ a: 1 }, { a: [1] })
    expect(counts.changed).toBe(1)
  })

  it('skips dangerous keys', () => {
    const { changes } = compareJson(
      JSON.parse('{"__proto__": 1, "a": 1}'),
      JSON.parse('{"__proto__": 2, "a": 1}')
    )
    expect(changes.every((c) => !c.path.includes('__proto__'))).toBe(true)
  })
})

describe('describeChanges', () => {
  const OPTS = { locale: 'en-US', timezone: 'utc' }

  it('produces readable sentences', () => {
    const { changes } = compareJson(
      { payment_status: 'PENDING', delivery_date: '2026-08-10' },
      { payment_status: 'COMPLETED', customer_email: 'ravi@example.com' }
    )
    const sentences = describeChanges(changes, OPTS)

    expect(sentences).toContain('Payment Status changed from Pending to Completed.')
    expect(sentences).toContain('Delivery Date was removed.')
    expect(sentences.some((sentence) => sentence.startsWith('Customer Email was added'))).toBe(true)
  })

  it('describes array item changes with item numbers', () => {
    const { changes } = compareJson({ items: ['a'] }, { items: ['a', 'b'] })
    const sentences = describeChanges(changes, OPTS)
    expect(sentences.some((sentence) => sentence.includes('Items item 2'))).toBe(true)
  })

  it('skips unchanged entries', () => {
    const { changes } = compareJson({ a: 1 }, { a: 1 })
    expect(describeChanges(changes, OPTS)).toHaveLength(0)
  })
})
