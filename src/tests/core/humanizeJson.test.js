import { describe, expect, it } from 'vitest'
import { humanizeJson } from '../../core/transformer/humanizeJson.js'

const OPTS = { locale: 'en-US', timezone: 'utc' }

describe('humanizeJson: objects', () => {
  it('transforms a flat object into labeled fields', () => {
    const tree = humanizeJson(
      {
        order_id: 123,
        customer_name: 'Ravi Kumar',
        payment_status: 'PAYMENT_PENDING',
        is_deleted: false,
      },
      OPTS
    )

    expect(tree.kind).toBe('object')
    const byKey = Object.fromEntries(tree.children.map((child) => [child.key, child]))
    expect(byKey.customer_name.label).toBe('Customer Name')
    expect(byKey.customer_name.displayValue).toBe('Ravi Kumar')
    expect(byKey.payment_status.displayValue).toBe('Payment Pending')
    expect(byKey.is_deleted.displayValue).toBe('No')
    expect(byKey.order_id.displayValue).toBe('123')
  })

  it('transforms nested objects into sections with paths', () => {
    const tree = humanizeJson(
      { customer: { name: 'Ravi', contact: { email: 'ravi@example.com' } } },
      OPTS
    )
    const customer = tree.children[0]
    expect(customer.kind).toBe('object')
    expect(customer.label).toBe('Customer')
    const contact = customer.children.find((child) => child.key === 'contact')
    expect(contact.kind).toBe('object')
    const email = contact.children[0]
    expect(email.path).toBe('customer.contact.email')
    expect(email.detectedType).toBe('email')
  })

  it('labels empty containers', () => {
    const tree = humanizeJson({ details: {}, items: [] }, OPTS)
    const [details, items] = tree.children
    expect(details.isEmpty).toBe(true)
    expect(details.displayValue).toBe('No details')
    expect(items.isEmpty).toBe(true)
    expect(items.displayValue).toBe('No items')
  })

  it('does not recurse into dangerous keys', () => {
    const tree = humanizeJson(JSON.parse('{"__proto__": {"polluted": true}, "safe": 1}'), OPTS)
    const dangerous = tree.children.find((child) => child.key === '__proto__')
    expect(dangerous.kind).toBe('field')
    expect(dangerous.meta.unsafe).toBe(true)
    expect(dangerous.children).toBeUndefined()
  })

  it('truncates beyond the maximum depth', () => {
    let value = 'leaf'
    for (let i = 0; i < 10; i++) value = { nested: value }
    const tree = humanizeJson(value, { ...OPTS, maxDepth: 3 })
    let node = tree
    while (node.kind === 'object') node = node.children[0]
    expect(node.detectedType).toBe('truncated')
  })
})

describe('humanizeJson: arrays', () => {
  it('renders primitive arrays as readable lists', () => {
    const tree = humanizeJson({ roles: ['ADMIN', 'EDITOR', 'VIEWER'] }, OPTS)
    const roles = tree.children[0]
    expect(roles.kind).toBe('array')
    expect(roles.isPrimitiveList).toBe(true)
    expect(roles.children.map((child) => child.displayValue)).toEqual(['Admin', 'Editor', 'Viewer'])
  })

  it('recommends table mode for arrays of similar objects', () => {
    const tree = humanizeJson(
      {
        users: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
          { id: 3, name: 'C' },
        ],
      },
      OPTS
    )
    const users = tree.children[0]
    expect(users.itemsAreObjects).toBe(true)
    expect(users.tableRecommended).toBe(true)
    expect(users.columns).toEqual(['id', 'name'])
    expect(users.children[0].label).toBe('Item 1')
    expect(users.children[0].path).toBe('users[0]')
  })

  it('does not recommend tables for dissimilar objects', () => {
    const tree = humanizeJson({ things: [{ a: 1 }, { b: 2 }, { c: 3 }] }, OPTS)
    expect(tree.children[0].tableRecommended).toBe(false)
  })
})

describe('humanizeJson: schema overrides', () => {
  const schema = {
    fields: {
      status: { label: 'Application Status', type: 'enum', values: { 1: 'Draft', 2: 'Approved' } },
      'orders[].amount': { type: 'currency', currency: 'USD' },
      'customer.address.city': { label: 'City of Residence' },
    },
  }

  it('applies bare-name schema entries at any position', () => {
    const tree = humanizeJson({ status: 2 }, OPTS, schema)
    expect(tree.children[0].label).toBe('Application Status')
    expect(tree.children[0].displayValue).toBe('Approved')
  })

  it('applies array path entries', () => {
    const tree = humanizeJson({ orders: [{ amount: 1200 }] }, OPTS, schema)
    const amount = tree.children[0].children[0].children[0]
    expect(amount.detectedType).toBe('currency')
    expect(amount.displayValue).toContain('$')
  })

  it('applies nested path labels', () => {
    const tree = humanizeJson({ customer: { address: { city: 'Chennai' } } }, OPTS, schema)
    const city = tree.children[0].children[0].children[0]
    expect(city.label).toBe('City of Residence')
  })
})
