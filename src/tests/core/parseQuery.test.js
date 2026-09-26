import { describe, expect, it } from 'vitest'
import { parseQuery, serializeQuery } from '../../core/search/parseQuery.js'
import { createCondition } from '../../core/search/index.js'

const first = (text) => parseQuery(text).conditions[0]

describe('parseQuery — terms', () => {
  it('reads a bare word as a contains term', () => {
    expect(first('chennai')).toMatchObject({ field: '', op: 'contains', value: 'chennai' })
  })

  it('splits on whitespace but keeps quoted phrases whole', () => {
    expect(parseQuery('one two').conditions).toHaveLength(2)
    const phrase = parseQuery('"delivery in Chennai"')
    expect(phrase.conditions).toHaveLength(1)
    expect(phrase.conditions[0].value).toBe('delivery in Chennai')
  })

  it('treats a quoted token as a literal, never as syntax', () => {
    expect(first('"city:Chennai"')).toMatchObject({ field: '', value: 'city:Chennai' })
    expect(parseQuery('"OR"').conditions).toHaveLength(1)
  })

  it('unescapes quotes inside a phrase', () => {
    expect(first('"say \\"hi\\""').value).toBe('say "hi"')
  })
})

describe('parseQuery — operators', () => {
  it('scopes a term to a field', () => {
    expect(first('city:Chennai')).toMatchObject({ field: 'city', op: 'contains', value: 'Chennai' })
  })

  it('reads comparisons, longest symbol first', () => {
    expect(first('amount>500')).toMatchObject({ field: 'amount', op: 'gt', value: '500' })
    expect(first('amount>=500')).toMatchObject({ op: 'gte' })
    expect(first('amount<=500')).toMatchObject({ op: 'lte' })
    expect(first('amount<500')).toMatchObject({ op: 'lt' })
  })

  it('reads equality and inequality', () => {
    expect(first('status=paid')).toMatchObject({ op: 'equals', value: 'paid', negate: false })
    expect(first('status!=paid')).toMatchObject({ op: 'equals', value: 'paid', negate: true })
  })

  it('reads ranges', () => {
    expect(first('amount:100..900')).toMatchObject({
      field: 'amount',
      op: 'between',
      value: '100',
      value2: '900',
    })
  })

  it('reads regex, presence, emptiness and type', () => {
    expect(first('name~^Ravi')).toMatchObject({ op: 'regex', value: '^Ravi' })
    expect(first('has:email')).toMatchObject({ field: 'email', op: 'exists' })
    expect(first('empty:notes')).toMatchObject({ field: 'notes', op: 'isEmpty' })
    expect(first('is:empty')).toMatchObject({ field: '', op: 'isEmpty' })
    expect(first('is:date')).toMatchObject({ op: 'type', value: 'date' })
  })

  it('reads the long form for operators with no shorthand', () => {
    expect(first('name[startsWith]:Ra')).toMatchObject({
      field: 'name',
      op: 'startsWith',
      value: 'Ra',
    })
    expect(first('[equals]:Ravi')).toMatchObject({ field: '', op: 'equals', value: 'Ravi' })
  })

  it('keeps a path with array brackets out of the long form', () => {
    expect(first('orders[].amount>500')).toMatchObject({ field: 'orders[].amount', op: 'gt' })
  })

  it('negates with a leading minus', () => {
    expect(first('-status:cancelled')).toMatchObject({ field: 'status', negate: true })
    expect(first('-chennai')).toMatchObject({ field: '', value: 'chennai', negate: true })
  })

  it('switches to OR when the keyword appears', () => {
    const query = parseQuery('status:paid OR status:pending')
    expect(query.combinator).toBe('OR')
    expect(query.conditions).toHaveLength(2)
    expect(parseQuery('a AND b').combinator).toBe('AND')
    expect(parseQuery('a AND b').conditions).toHaveLength(2)
  })
})

describe('parseQuery — hostile and ambiguous input', () => {
  it('never throws, whatever it is given', () => {
    for (const text of ['', '   ', ':::', '-', '"', 'a:"b', '[]', 'x[nosuchop]:1', '>>>']) {
      expect(() => parseQuery(text)).not.toThrow()
    }
  })

  it('leaves a URL alone instead of reading it as a field', () => {
    expect(first('https://example.com')).toMatchObject({
      field: '',
      value: 'https://example.com',
    })
  })

  it('does not treat a time or a number as a field', () => {
    expect(first('10:30')).toMatchObject({ field: '', value: '10:30' })
  })

  it('falls back to the ordinary field:value rule for an unknown operator', () => {
    // Not a long form, so `x[nosuchop]` is read as an (unlikely) field name
    // rather than rejected — it simply matches nothing.
    expect(first('x[nosuchop]:1')).toMatchObject({ field: 'x[nosuchop]', value: '1' })
  })
})

describe('serializeQuery', () => {
  const roundTrip = (text) => serializeQuery(parseQuery(text))

  it('round-trips every supported form', () => {
    const cases = [
      'chennai',
      '"delivery in Chennai"',
      'city:Chennai',
      'amount>500',
      'amount>=500',
      'amount<=500',
      'status=paid',
      'status!=paid',
      'amount:100..900',
      'name~^Ravi',
      'has:email',
      'empty:notes',
      'is:empty',
      'is:date',
      'name[startsWith]:Ra',
      'name[endsWith]:mar',
      '-status:cancelled',
      'orders[].amount>500',
      'city:Chennai amount>500 -status:cancelled',
      'status:paid OR status:pending',
    ]
    for (const text of cases) expect(roundTrip(text)).toBe(text)
  })

  it('prefers the shorthand a person would have typed', () => {
    expect(
      serializeQuery({ conditions: [createCondition({ field: 'city', value: 'Chennai' })] })
    ).toBe('city:Chennai')
  })

  it('quotes values that would otherwise split', () => {
    expect(
      serializeQuery({ conditions: [createCondition({ field: 'name', value: 'Ravi Kumar' })] })
    ).toBe('name:"Ravi Kumar"')
    expect(roundTrip('name:"Ravi Kumar"')).toBe('name:"Ravi Kumar"')
  })

  it('escapes to the long form when a shorthand would be misread', () => {
    // A literal "a..b" must not come back as a range.
    const query = { conditions: [createCondition({ field: 'code', value: 'a..b' })] }
    expect(serializeQuery(query)).toBe('code[contains]:a..b')
    expect(parseQuery(serializeQuery(query)).conditions[0]).toMatchObject({
      op: 'contains',
      value: 'a..b',
    })
  })

  it('falls back to the long form rather than dropping a condition', () => {
    // An unscoped `exists` has no shorthand, but it must still survive a
    // round trip or the builder would lose the row the user just added.
    expect(serializeQuery({ conditions: [createCondition({ op: 'exists' })] })).toBe('[exists]')
    expect(parseQuery('[exists]').conditions[0]).toMatchObject({ field: '', op: 'exists' })
  })

  it('round-trips conditions that are still half-written', () => {
    const cases = [
      { field: 'age', op: 'between', value: '', value2: null },
      { field: 'age', op: 'between', value: '20', value2: null },
      { field: 'age', op: 'gt', value: '' },
      { field: 'name', op: 'startsWith', value: '' },
      { field: '', op: 'type', value: '' },
    ]
    for (const partial of cases) {
      const condition = createCondition(partial)
      const text = serializeQuery({ conditions: [condition] })
      const back = parseQuery(text).conditions[0]
      // The operator must survive; picking "between" must not silently
      // become "contains" just because no bounds have been typed yet.
      expect(back.op, text).toBe(condition.op)
      expect(String(back.value ?? ''), text).toBe(String(condition.value ?? ''))
      expect(String(back.value2 ?? ''), text).toBe(String(condition.value2 ?? ''))
    }
  })
})
