import { describe, expect, it } from 'vitest'
import { parseJson } from '../../core/parser/parseJson.js'
import { stripTrailingCommas, findDuplicateKeys } from '../../core/parser/validateJson.js'

describe('parseJson', () => {
  it('parses valid JSON', () => {
    const result = parseJson('{"a": 1}')
    expect(result.ok).toBe(true)
    expect(result.value).toEqual({ a: 1 })
  })

  it('flags empty input without an error message', () => {
    const result = parseJson('   ')
    expect(result.ok).toBe(false)
    expect(result.empty).toBe(true)
    expect(result.error).toBeNull()
  })

  it('reports line and column for invalid JSON', () => {
    const result = parseJson('{\n  "a": 1,\n  "b": oops\n}')
    expect(result.ok).toBe(false)
    expect(result.error.message).toBeTruthy()
    expect(result.error.line).toBe(3)
    expect(result.error.column).toBeGreaterThan(1)
  })

  it('suggests a repair for trailing commas without changing the input', () => {
    const input = '{"a": 1, "b": [1, 2,],}'
    const result = parseJson(input)
    expect(result.ok).toBe(false)
    expect(result.suggestion).not.toBeNull()
    expect(result.suggestion.text).toBe('{"a": 1, "b": [1, 2]}')
    expect(JSON.parse(result.suggestion.text)).toEqual({ a: 1, b: [1, 2] })
  })

  it('warns about duplicate keys', () => {
    const result = parseJson('{"a": 1, "a": 2}')
    expect(result.ok).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('Duplicate key "a"')
  })
})

describe('stripTrailingCommas', () => {
  it('does not touch commas inside strings', () => {
    const input = '{"text": "hello,}", "n": 1}'
    expect(stripTrailingCommas(input)).toBe(input)
  })

  it('removes nested trailing commas', () => {
    expect(stripTrailingCommas('[{"a": 1,},]')).toBe('[{"a": 1}]')
  })
})

describe('findDuplicateKeys', () => {
  it('scopes duplicates per object', () => {
    const text = '{"a": {"x": 1}, "b": {"x": 2}}'
    expect(findDuplicateKeys(text)).toHaveLength(0)
  })

  it('finds duplicates in nested objects', () => {
    const text = '{"outer": {"x": 1, "x": 2}}'
    const warnings = findDuplicateKeys(text)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('"x"')
  })
})
