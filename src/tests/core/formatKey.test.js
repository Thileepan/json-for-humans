import { describe, expect, it } from 'vitest'
import { formatKey } from '../../core/formatter/formatKey.js'

describe('formatKey', () => {
  it('converts snake_case', () => {
    expect(formatKey('customer_name')).toBe('Customer Name')
  })

  it('converts camelCase', () => {
    expect(formatKey('customerName')).toBe('Customer Name')
    expect(formatKey('createdAt')).toBe('Created At')
  })

  it('converts SCREAMING_SNAKE', () => {
    expect(formatKey('CUSTOMER_NAME')).toBe('Customer Name')
  })

  it('converts kebab-case', () => {
    expect(formatKey('customer-name')).toBe('Customer Name')
  })

  it('handles acronym runs in PascalCase', () => {
    expect(formatKey('URLValue')).toBe('URL Value')
  })

  it('preserves common abbreviations', () => {
    expect(formatKey('user_id')).toBe('User ID')
    expect(formatKey('api_url')).toBe('API URL')
    expect(formatKey('otp_status')).toBe('OTP Status')
    expect(formatKey('transaction_uuid')).toBe('Transaction UUID')
    expect(formatKey('http_status')).toBe('HTTP Status')
    expect(formatKey('gst_number')).toBe('GST Number')
    expect(formatKey('pan_card')).toBe('PAN Card')
    expect(formatKey('ip_address')).toBe('IP Address')
    expect(formatKey('json_payload')).toBe('JSON Payload')
    expect(formatKey('sql_query')).toBe('SQL Query')
    expect(formatKey('xml_body')).toBe('XML Body')
  })

  it('handles edge cases', () => {
    expect(formatKey('')).toBe('')
    expect(formatKey('a')).toBe('A')
    expect(formatKey(null)).toBe('')
  })
})
