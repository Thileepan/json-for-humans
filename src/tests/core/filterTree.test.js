import { describe, expect, it } from 'vitest'
import { humanizeJson } from '../../core/transformer/humanizeJson.js'
import { filterTree, countFields } from '../../core/transformer/filterTree.js'

const OPTS = { locale: 'en-US', timezone: 'utc' }

const tree = () =>
  humanizeJson(
    {
      customer_name: 'Ravi Kumar',
      email: 'ravi@example.com',
      notes: null,
      order_id: 991,
      address: { city: 'Chennai', landmark: '' },
    },
    OPTS
  )

describe('filterTree', () => {
  it('matches by field name', () => {
    const filtered = filterTree(tree(), { query: 'customer' })
    expect(countFields(filtered)).toBe(1)
    expect(filtered.children[0].key).toBe('customer_name')
  })

  it('matches by value across nesting', () => {
    const filtered = filterTree(tree(), { query: 'chennai' })
    expect(countFields(filtered)).toBe(1)
    expect(filtered.children[0].kind).toBe('object')
    expect(filtered.children[0].children[0].key).toBe('city')
  })

  it('hides null values', () => {
    const filtered = filterTree(tree(), { hideNulls: true })
    expect(filtered.children.some((child) => child.key === 'notes')).toBe(false)
  })

  it('hides empty values', () => {
    const filtered = filterTree(tree(), { hideEmpty: true })
    const address = filtered.children.find((child) => child.key === 'address')
    expect(address.children.some((child) => child.key === 'landmark')).toBe(false)
  })

  it('hides technical identifiers', () => {
    const filtered = filterTree(tree(), { hideIds: true })
    expect(filtered.children.some((child) => child.key === 'order_id')).toBe(false)
  })

  it('returns null when nothing matches', () => {
    expect(filterTree(tree(), { query: 'zzz-no-match' })).toBeNull()
  })
})
