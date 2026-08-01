import { describe, expect, it } from 'vitest'
import { detectDate } from '../../core/detector/detectDate.js'

describe('detectDate', () => {
  it('detects ISO datetimes regardless of field name', () => {
    expect(detectDate('2026-08-01T09:30:00Z', 'anything')).not.toBeNull()
    expect(detectDate('2026-08-01 09:30:00', 'anything')).not.toBeNull()
  })

  it('detects ISO dates', () => {
    const result = detectDate('2026-08-01', 'x')
    expect(result.precision).toBe('date')
  })

  it('rejects invalid calendar dates', () => {
    expect(detectDate('2026-13-45', 'date')).toBeNull()
  })

  it('rejects plain strings', () => {
    expect(detectDate('hello', 'created_at')).toBeNull()
  })

  it('requires a name hint for unix timestamps', () => {
    expect(detectDate(1767258600, 'created_at')).not.toBeNull()
    expect(detectDate(1767258600, 'order_id')).toBeNull()
    expect(detectDate(1767258600, 'count')).toBeNull()
  })

  it('handles millisecond timestamps', () => {
    const result = detectDate(1767258600000, 'updated_at')
    expect(result.source).toBe('unix-ms')
  })

  it('rejects numbers outside plausible ranges even with a hint', () => {
    expect(detectDate(123456, 'created_at')).toBeNull()
    expect(detectDate(9e15, 'created_at')).toBeNull()
  })
})
