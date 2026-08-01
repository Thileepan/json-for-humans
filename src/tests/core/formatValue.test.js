import { describe, expect, it } from 'vitest'
import { formatValue } from '../../core/formatter/formatValue.js'
import { resolveOptions } from '../../core/options.js'

const opts = (overrides = {}) => resolveOptions({ locale: 'en-US', timezone: 'utc', ...overrides })

describe('formatValue: booleans', () => {
  it('formats true/false as Yes/No by default', () => {
    expect(formatValue('is_deleted', true, opts()).displayValue).toBe('Yes')
    expect(formatValue('is_deleted', false, opts()).displayValue).toBe('No')
  })

  it('supports alternate boolean styles', () => {
    expect(
      formatValue('active', true, opts({ booleanStyle: 'enabled-disabled' })).displayValue
    ).toBe('Enabled')
    expect(
      formatValue('active', false, opts({ booleanStyle: 'active-inactive' })).displayValue
    ).toBe('Inactive')
    expect(formatValue('active', true, opts({ booleanStyle: 'true-false' })).displayValue).toBe(
      'True'
    )
  })
})

describe('formatValue: null and empty', () => {
  it('formats null with the configured label', () => {
    const result = formatValue('notes', null, opts())
    expect(result.displayValue).toBe('Not available')
    expect(result.detectedType).toBe('null')
  })

  it('formats empty strings', () => {
    expect(formatValue('notes', '', opts()).displayValue).toBe('Empty')
  })

  it('supports custom labels', () => {
    expect(formatValue('notes', null, opts({ nullLabel: 'N/A' })).displayValue).toBe('N/A')
    expect(formatValue('notes', '', opts({ emptyStringLabel: '(blank)' })).displayValue).toBe(
      '(blank)'
    )
  })

  it('does not treat zero or false as empty', () => {
    expect(formatValue('count', 0, opts()).displayValue).toBe('0')
    expect(formatValue('flag', false, opts()).displayValue).toBe('No')
  })
})

describe('formatValue: enums', () => {
  it('formats SCREAMING_SNAKE enums', () => {
    expect(formatValue('payment_status', 'PAYMENT_PENDING', opts()).displayValue).toBe(
      'Payment Pending'
    )
    expect(formatValue('status', 'IN_PROGRESS', opts()).displayValue).toBe('In Progress')
    expect(formatValue('error', 'ACCOUNT_NOT_FOUND', opts()).displayValue).toBe('Account Not Found')
  })

  it('formats lower snake enums', () => {
    expect(formatValue('status', 'partially_completed', opts()).displayValue).toBe(
      'Partially Completed'
    )
  })

  it('leaves ordinary sentences alone', () => {
    expect(formatValue('message', 'Hello there, world.', opts()).displayValue).toBe(
      'Hello there, world.'
    )
  })
})

describe('formatValue: numbers', () => {
  it('groups large numbers', () => {
    expect(formatValue('population', 1500000, opts()).displayValue).toBe('1,500,000')
  })

  it('formats amounts with grouping but no currency', () => {
    expect(formatValue('amount', 2500, opts()).displayValue).toBe('2,500')
  })

  it('detects ratio percentages from field names', () => {
    const result = formatValue('completion_rate', 0.85, opts())
    expect(result.displayValue).toBe('85%')
    expect(result.detectedType).toBe('percentage')
  })

  it('handles negative and decimal numbers', () => {
    expect(formatValue('delta', -12345.67, opts()).displayValue).toBe('-12,345.67')
  })

  it('keeps numeric identifiers ungrouped', () => {
    const result = formatValue('order_id', 1234567, opts())
    expect(result.displayValue).toBe('1234567')
    expect(result.detectedType).toBe('id')
  })
})

describe('formatValue: dates', () => {
  it('formats ISO timestamps', () => {
    const result = formatValue('created_at', '2026-08-01T09:30:00Z', opts())
    expect(result.detectedType).toBe('datetime')
    expect(result.displayValue).toContain('August 1, 2026')
    expect(result.displayValue).toContain('9:30')
  })

  it('formats ISO dates without a time', () => {
    const result = formatValue('delivery_date', '2026-08-05', opts())
    expect(result.detectedType).toBe('date')
    expect(result.displayValue).toBe('August 5, 2026')
  })

  it('converts unix seconds with a name hint', () => {
    const result = formatValue('last_login_at', 1767258600, opts())
    expect(result.detectedType).toBe('datetime')
    expect(result.displayValue).toContain('2026')
  })

  it('converts unix milliseconds with a name hint', () => {
    const result = formatValue('updated_at', 1767258600000, opts())
    expect(result.detectedType).toBe('datetime')
    expect(result.displayValue).toContain('2026')
  })

  it('does not convert plain numeric IDs into dates', () => {
    const result = formatValue('user_number', 1500000000, opts())
    expect(result.detectedType).toBe('number')
  })

  it('supports relative mode deterministically via injected now', () => {
    const result = formatValue(
      'created_at',
      '2026-07-30T00:00:00Z',
      opts({ dateMode: 'relative', now: new Date('2026-08-01T00:00:00Z') })
    )
    expect(result.displayValue).toBe('2 days ago')
  })
})

describe('formatValue: links and colors', () => {
  it('detects https URLs', () => {
    const result = formatValue('profile_url', 'https://example.com/u/1', opts())
    expect(result.detectedType).toBe('url')
    expect(result.meta.href).toBe('https://example.com/u/1')
  })

  it('rejects unsafe protocols', () => {
    const result = formatValue('link', 'javascript:alert(1)', opts())
    expect(result.detectedType).toBe('text')
    expect(result.meta.href).toBeUndefined()
  })

  it('detects email addresses', () => {
    const result = formatValue('email', 'ravi@example.com', opts())
    expect(result.detectedType).toBe('email')
    expect(result.meta.href).toBe('mailto:ravi@example.com')
  })

  it('detects phone numbers only with a field-name hint', () => {
    const withHint = formatValue('phone_number', '+91 98765 43210', opts())
    expect(withHint.detectedType).toBe('phone')
    expect(withHint.meta.href).toBe('tel:+919876543210')

    const withoutHint = formatValue('note', '+91 98765 43210', opts())
    expect(withoutHint.detectedType).not.toBe('phone')
  })

  it('detects hex, rgb and hsl colors', () => {
    expect(formatValue('color', '#2f8a5f', opts()).meta.color).toBe('#2f8a5f')
    expect(formatValue('tint', 'rgb(47, 138, 95)', opts()).meta.color).toBe('rgb(47, 138, 95)')
    expect(formatValue('hue', 'hsl(150, 49%, 36%)', opts()).meta.color).toBe('hsl(150, 49%, 36%)')
    expect(formatValue('name', 'red-ish', opts()).meta.color).toBeUndefined()
  })

  it('renders UUIDs as identifiers', () => {
    const result = formatValue('request_ref', '7f9c02e1-88a4-4c1e-9f30-6d2f5a1b9c44', opts())
    expect(result.detectedType).toBe('id')
    expect(result.meta.monospace).toBe(true)
  })
})

describe('formatValue: schema overrides', () => {
  it('maps enum values through the schema', () => {
    const schemaField = { type: 'enum', values: { 1: 'Draft', 2: 'Approved' } }
    expect(formatValue('status', 1, opts(), schemaField).displayValue).toBe('Draft')
    expect(formatValue('status', '2', opts(), schemaField).displayValue).toBe('Approved')
  })

  it('formats currency from the schema', () => {
    const result = formatValue('amount', 2500, opts(), { type: 'currency', currency: 'INR' })
    expect(result.detectedType).toBe('currency')
    expect(result.displayValue).toContain('2,500')
    expect(result.displayValue).toMatch(/₹|INR/)
  })

  it('falls back to detection when the schema type does not fit the value', () => {
    const result = formatValue('amount', 'not-a-number', opts(), {
      type: 'currency',
      currency: 'INR',
    })
    expect(result.detectedType).toBe('text')
  })
})
