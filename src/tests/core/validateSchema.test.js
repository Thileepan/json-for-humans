import { describe, expect, it } from 'vitest'
import { validateSchema } from '../../core/schema/validateSchema.js'
import { EXAMPLE_SCHEMA } from '../../core/schema/applySchema.js'

describe('validateSchema', () => {
  it('accepts the bundled example schema', () => {
    expect(validateSchema(EXAMPLE_SCHEMA).valid).toBe(true)
  })

  it('accepts array and nested paths', () => {
    const result = validateSchema({
      fields: {
        'orders[].amount': { type: 'currency', currency: 'USD' },
        'customer.address.city': { label: 'City' },
      },
    })
    expect(result.valid).toBe(true)
  })

  it('rejects non-object schemas', () => {
    expect(validateSchema(null).valid).toBe(false)
    expect(validateSchema([]).valid).toBe(false)
    expect(validateSchema({}).valid).toBe(false)
  })

  it('rejects unknown field types', () => {
    const result = validateSchema({ fields: { a: { type: 'wizard' } } })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('unknown type')
  })

  it('requires a currency code for currency fields', () => {
    const result = validateSchema({ fields: { amount: { type: 'currency' } } })
    expect(result.valid).toBe(false)
  })

  it('rejects dangerous keys in paths', () => {
    const result = validateSchema({ fields: { '__proto__.x': { label: 'nope' } } })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('forbidden')
  })
})
