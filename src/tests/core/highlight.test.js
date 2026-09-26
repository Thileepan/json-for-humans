import { describe, expect, it } from 'vitest'
import { highlightRanges, highlightSegments } from '../../core/search/highlight.js'
import { parseQuery } from '../../core/search/parseQuery.js'

const field = (value, key = 'city') => ({
  kind: 'field',
  key,
  label: key === 'city' ? 'City' : key,
  displayValue: value,
  rawValue: value,
  detectedType: 'text',
})

const segments = (text, node, text2) => highlightSegments(text, node, parseQuery(text2))

describe('highlightRanges', () => {
  it('marks every occurrence of a term', () => {
    expect(highlightRanges('a b a', field('a b a'), parseQuery('a'))).toEqual([
      [0, 1],
      [4, 5],
    ])
  })

  it('is case-insensitive unless the condition says otherwise', () => {
    expect(highlightRanges('Chennai', field('Chennai'), parseQuery('chen'))).toEqual([[0, 4]])
    expect(
      highlightRanges('Chennai', field('Chennai'), {
        conditions: [{ field: '', op: 'contains', value: 'chen', caseSensitive: true }],
      })
    ).toEqual([])
  })

  it('merges overlapping ranges from different conditions', () => {
    expect(highlightRanges('aaaa', field('aaaa'), parseQuery('city:aa city:aaa'))).toEqual([[0, 4]])
  })

  it('anchors startsWith and endsWith', () => {
    const node = field('Ravi Kumar', 'name')
    expect(highlightRanges('Ravi Kumar', node, parseQuery('name[startsWith]:Ravi'))).toEqual([
      [0, 4],
    ])
    expect(highlightRanges('Ravi Kumar', node, parseQuery('name[endsWith]:Kumar'))).toEqual([
      [5, 10],
    ])
  })

  it('handles a regex, including one that can match nothing', () => {
    const node = field('aaa bb aa', 'x')
    expect(highlightRanges('aaa bb aa', node, parseQuery('x~a+'))).toEqual([
      [0, 3],
      [7, 9],
    ])
    // A zero-length match must not spin forever.
    expect(highlightRanges('abc', node, parseQuery('x~z*'))).toEqual([])
  })

  it('never throws on a malformed regex', () => {
    expect(() => highlightRanges('abc', field('abc', 'x'), parseQuery('x~(['))).not.toThrow()
    expect(highlightRanges('abc', field('abc', 'x'), parseQuery('x~(['))).toEqual([])
  })
})

describe('highlightRanges — scope', () => {
  it('does not mark a field the condition was not aimed at', () => {
    expect(highlightRanges('Chennai', field('Chennai'), parseQuery('notes:Chennai'))).toEqual([])
    expect(highlightRanges('Chennai', field('Chennai'), parseQuery('city:Chennai'))).toEqual([
      [0, 7],
    ])
  })

  it('ignores conditions that exclude rather than select', () => {
    expect(highlightRanges('Chennai', field('Chennai'), parseQuery('-Chennai'))).toEqual([])
  })

  it('ignores operators that describe the whole value', () => {
    const amount = { kind: 'field', key: 'amount', displayValue: '1,200', rawValue: 1200 }
    expect(highlightRanges('1,200', amount, parseQuery('amount>500'))).toEqual([])
  })
})

describe('highlightSegments', () => {
  it('splits text into plain and matched runs', () => {
    expect(segments('Chennai Central', field('Chennai Central'), 'central')).toEqual([
      { text: 'Chennai ', match: false },
      { text: 'Central', match: true },
    ])
  })

  it('returns a single plain segment when nothing matches', () => {
    expect(segments('Chennai', field('Chennai'), 'zzz')).toEqual([
      { text: 'Chennai', match: false },
    ])
  })

  it('preserves the original text exactly', () => {
    const text = 'a <b> & "c"'
    const joined = segments(text, field(text), 'b')
      .map((segment) => segment.text)
      .join('')
    expect(joined).toBe(text)
  })

  it('handles empty text', () => {
    expect(segments('', field(''), 'a')).toEqual([])
  })
})
