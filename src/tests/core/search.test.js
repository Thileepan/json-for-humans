import { describe, expect, it } from 'vitest'
import { humanizeJson } from '../../core/transformer/humanizeJson.js'
import { filterTree, countFields, countRows } from '../../core/transformer/filterTree.js'
import {
  activeConditions,
  collectFields,
  comparableKind,
  compileQuery,
  compileRowQuery,
  createCondition,
  fieldMatches,
  isEmptyQuery,
  matchCondition,
  normalizeIdent,
  normalizeQuery,
} from '../../core/search/index.js'
import { parseQuery } from '../../core/search/parseQuery.js'

const OPTS = { locale: 'en-US', timezone: 'utc' }

const tree = () =>
  humanizeJson(
    {
      customer_name: 'Ravi Kumar',
      notes: 'Prefers delivery in Chennai',
      order_id: 991,
      address: { city: 'Chennai', landmark: '' },
      orders: [
        { order_ref: 'A-1', amount: 250, status: 'paid', placed_on: '2024-01-10' },
        { order_ref: 'A-2', amount: 1200, status: 'cancelled', placed_on: '2024-06-02' },
        { order_ref: 'A-3', amount: 640, status: 'paid', placed_on: '2024-09-21' },
      ],
    },
    OPTS
  )

/** Finds one node by its concrete path. */
function at(root, path) {
  if (!root) return null
  if (root.path === path) return root
  for (const child of root.children || []) {
    const found = at(child, path)
    if (found) return found
  }
  return null
}

const cond = (partial) => createCondition(partial)

describe('normalizeIdent', () => {
  it('folds keys, labels and paths onto one identifier', () => {
    expect(normalizeIdent('customer_name')).toBe('customername')
    expect(normalizeIdent('Customer Name')).toBe('customername')
    expect(normalizeIdent('orders[2].amount')).toBe('orders.amount')
    expect(normalizeIdent('orders[].amount')).toBe('orders.amount')
  })

  it('drops the leading segment left by a root-level array index', () => {
    expect(normalizeIdent('[0].amount')).toBe('amount')
  })
})

describe('fieldMatches', () => {
  const node = at(tree(), 'orders[1].amount')

  it('matches the raw key, the humanized label and the path', () => {
    expect(fieldMatches(node, 'amount')).toBe(true)
    expect(fieldMatches(node, 'Amount')).toBe(true)
    expect(fieldMatches(node, 'orders[].amount')).toBe(true)
  })

  it('does not match a dotted spec from a different parent', () => {
    expect(fieldMatches(node, 'refunds.amount')).toBe(false)
  })

  it('matches everything when no field is named', () => {
    expect(fieldMatches(node, '')).toBe(true)
  })
})

describe('collectFields', () => {
  const fields = collectFields(tree())
  const byPath = (path) => fields.find((field) => field.path === path)

  it('lists each distinct field once, using normalized paths', () => {
    expect(byPath('orders[].amount')).toBeTruthy()
    expect(fields.filter((field) => field.path === 'orders[].amount')).toHaveLength(1)
  })

  it('counts how many nodes feed a field and records their detected types', () => {
    expect(byPath('orders[].amount').count).toBe(3)
    expect(byPath('orders[].placed_on').types).toEqual(['date'])
    expect(byPath('customer_name').label).toBe('Customer Name')
  })

  it('omits containers unless asked for them', () => {
    expect(byPath('orders')).toBeUndefined()
    const withContainers = collectFields(tree(), { includeContainers: true })
    expect(withContainers.find((field) => field.path === 'orders').kind).toBe('array')
  })
})

describe('matchCondition — scoping', () => {
  const root = tree()

  it('limits a term to the named field', () => {
    const condition = cond({ field: 'city', value: 'Chennai' })
    expect(matchCondition(at(root, 'address.city'), condition)).toBe(true)
    // "notes" also contains Chennai, but it is not the city field.
    expect(matchCondition(at(root, 'notes'), condition)).toBe(false)
  })

  it('still matches field names when no field is named', () => {
    const condition = cond({ value: 'customer' })
    expect(matchCondition(at(root, 'customer_name'), condition)).toBe(true)
  })

  it('does not match a field name once a field is named', () => {
    // `city:city` asks for a city whose *value* contains "city".
    expect(matchCondition(at(root, 'address.city'), cond({ field: 'city', value: 'city' }))).toBe(
      false
    )
  })
})

describe('matchCondition — text operators', () => {
  const root = tree()
  const name = at(root, 'customer_name')

  it('supports equals, startsWith and endsWith', () => {
    expect(
      matchCondition(name, cond({ field: 'customer_name', op: 'equals', value: 'Ravi Kumar' }))
    ).toBe(true)
    expect(
      matchCondition(name, cond({ field: 'customer_name', op: 'equals', value: 'Ravi' }))
    ).toBe(false)
    expect(
      matchCondition(name, cond({ field: 'customer_name', op: 'startsWith', value: 'ravi' }))
    ).toBe(true)
    expect(
      matchCondition(name, cond({ field: 'customer_name', op: 'endsWith', value: 'kumar' }))
    ).toBe(true)
  })

  it('honors caseSensitive', () => {
    expect(matchCondition(name, cond({ value: 'ravi', caseSensitive: true }))).toBe(false)
    expect(matchCondition(name, cond({ value: 'Ravi', caseSensitive: true }))).toBe(true)
  })

  it('searches the formatted value as well as the raw one', () => {
    const amount = at(root, 'orders[1].amount')
    expect(amount.displayValue).toBe('1,200')
    expect(matchCondition(amount, cond({ field: 'amount', value: '1,200' }))).toBe(true)
    expect(matchCondition(amount, cond({ field: 'amount', value: '1200' }))).toBe(true)
  })

  it('applies regex and never throws on a bad pattern', () => {
    expect(matchCondition(name, cond({ op: 'regex', value: '^ravi\\s\\w+$' }))).toBe(true)
    expect(matchCondition(name, cond({ op: 'regex', value: '([' }))).toBe(false)
    expect(matchCondition(name, cond({ op: 'regex', value: 'a'.repeat(201) }))).toBe(false)
  })
})

describe('matchCondition — comparisons', () => {
  const root = tree()

  it('compares numbers against the raw value, not the formatted one', () => {
    const condition = cond({ field: 'amount', op: 'gt', value: 500 })
    expect(matchCondition(at(root, 'orders[0].amount'), condition)).toBe(false)
    expect(matchCondition(at(root, 'orders[1].amount'), condition)).toBe(true)
    expect(matchCondition(at(root, 'orders[2].amount'), condition)).toBe(true)
  })

  it('accepts a grouped numeric string as the bound', () => {
    expect(
      matchCondition(
        at(root, 'orders[1].amount'),
        cond({ field: 'amount', op: 'gte', value: '1,200' })
      )
    ).toBe(true)
  })

  it('compares dates chronologically rather than alphabetically', () => {
    const condition = cond({
      field: 'placed_on',
      op: 'between',
      value: '2024-05-01',
      value2: '2024-12-31',
    })
    expect(matchCondition(at(root, 'orders[0].placed_on'), condition)).toBe(false)
    expect(matchCondition(at(root, 'orders[1].placed_on'), condition)).toBe(true)
    expect(matchCondition(at(root, 'orders[2].placed_on'), condition)).toBe(true)
  })

  it('accepts a reversed between range', () => {
    const condition = cond({ field: 'amount', op: 'between', value: 1000, value2: 100 })
    expect(matchCondition(at(root, 'orders[0].amount'), condition)).toBe(true)
  })

  it('compares containers by size', () => {
    expect(matchCondition(at(root, 'orders'), cond({ field: 'orders', op: 'gt', value: 2 }))).toBe(
      true
    )
    expect(matchCondition(at(root, 'orders'), cond({ field: 'orders', op: 'gt', value: 5 }))).toBe(
      false
    )
  })

  it('does not match when the value cannot be compared', () => {
    expect(
      matchCondition(
        at(root, 'customer_name'),
        cond({ field: 'customer_name', op: 'gt', value: 5 })
      )
    ).toBe(false)
  })
})

describe('matchCondition — presence and type', () => {
  const root = tree()

  it('detects empty and present values', () => {
    expect(matchCondition(at(root, 'address.landmark'), cond({ op: 'isEmpty' }))).toBe(true)
    expect(matchCondition(at(root, 'address.city'), cond({ op: 'isEmpty' }))).toBe(false)
    expect(matchCondition(at(root, 'address.city'), cond({ op: 'exists' }))).toBe(true)
  })

  it('filters by detected type', () => {
    expect(
      matchCondition(at(root, 'orders[0].placed_on'), cond({ op: 'type', value: 'date' }))
    ).toBe(true)
    expect(matchCondition(at(root, 'order_id'), cond({ op: 'type', value: 'date' }))).toBe(false)
    expect(matchCondition(at(root, 'order_id'), cond({ op: 'type', value: 'id' }))).toBe(true)
    expect(matchCondition(at(root, 'orders'), cond({ op: 'type', value: 'array' }))).toBe(true)
  })
})

describe('matchCondition — negation', () => {
  const root = tree()
  const condition = cond({ field: 'status', value: 'cancelled', negate: true })

  it('excludes only the nodes that match, leaving unrelated fields alone', () => {
    expect(matchCondition(at(root, 'orders[1].status'), condition)).toBe(false)
    expect(matchCondition(at(root, 'orders[0].status'), condition)).toBe(true)
    expect(matchCondition(at(root, 'customer_name'), condition)).toBe(true)
  })
})

describe('normalizeQuery / compileQuery', () => {
  it('treats a bare string as a contains-anywhere term', () => {
    const query = normalizeQuery('chennai')
    expect(query.conditions).toHaveLength(1)
    expect(query.conditions[0]).toMatchObject({ field: '', op: 'contains', value: 'chennai' })
  })

  it('reports empty queries', () => {
    expect(isEmptyQuery('')).toBe(true)
    expect(isEmptyQuery({ conditions: [cond({ value: '   ' })] })).toBe(true)
    expect(isEmptyQuery('chennai')).toBe(false)
  })

  it('ignores a condition that is still half-written', () => {
    // A field with no value yet, an operator with no bound, half a range:
    // none of these should filter. `has:city` is how presence is asked for.
    expect(isEmptyQuery({ conditions: [cond({ field: 'city' })] })).toBe(true)
    expect(isEmptyQuery({ conditions: [cond({ field: 'amount', op: 'gt' })] })).toBe(true)
    expect(
      isEmptyQuery({ conditions: [cond({ field: 'amount', op: 'between', value: '100' })] })
    ).toBe(true)
    expect(isEmptyQuery({ conditions: [cond({ field: 'city', op: 'exists' })] })).toBe(false)
    expect(isEmptyQuery({ conditions: [cond({ op: 'isEmpty' })] })).toBe(false)
  })

  it('keeps the finished conditions when one is half-written', () => {
    const root = tree()
    const match = compileQuery({
      conditions: [cond({ field: 'city', value: 'Chennai' }), cond({ field: 'status' })],
    })
    expect(match(at(root, 'address.city'))).toBe(true)
    expect(match(at(root, 'notes'))).toBe(false)
  })

  it('keeps everything when there is nothing to match on', () => {
    expect(compileQuery('')(at(tree(), 'notes'))).toBe(true)
  })

  it('combines conditions with AND and OR', () => {
    const root = tree()
    const conditions = [
      cond({ field: 'status', value: 'paid' }),
      cond({ field: 'amount', op: 'gt', value: 500 }),
    ]
    const or = compileQuery({ conditions, combinator: 'OR' })
    expect(or(at(root, 'orders[0].status'))).toBe(true)
    expect(or(at(root, 'orders[2].amount'))).toBe(true)
    expect(or(at(root, 'customer_name'))).toBe(false)

    // Per node, AND across two different fields can never hold — that is what
    // compileRowQuery is for.
    const and = compileQuery({ conditions, combinator: 'AND' })
    expect(and(at(root, 'orders[2].amount'))).toBe(false)
  })

  it('ignores a blank condition instead of letting it swallow an OR', () => {
    const or = compileQuery({
      conditions: [cond({ value: '' }), cond({ field: 'status', value: 'paid' })],
      combinator: 'OR',
    })
    expect(or(at(tree(), 'orders[1].status'))).toBe(false)
  })
})

describe('compileRowQuery', () => {
  const root = tree()
  const rows = at(root, 'orders').children

  it('holds when different descendants satisfy different conditions', () => {
    const match = compileRowQuery({
      conditions: [
        cond({ field: 'status', value: 'paid' }),
        cond({ field: 'amount', op: 'gt', value: 500 }),
      ],
      combinator: 'AND',
    })
    expect(rows.map(match)).toEqual([false, false, true])
  })

  it('negates across the whole row, not per field', () => {
    const match = compileRowQuery({
      conditions: [cond({ field: 'status', value: 'cancelled', negate: true })],
    })
    expect(rows.map(match)).toEqual([true, false, true])
  })

  it('falls back to keeping every row when the query is empty', () => {
    expect(rows.map(compileRowQuery(''))).toEqual([true, true, true])
  })
})

describe('filterTree with structured queries', () => {
  it('accepts a structured query and scopes it to one field', () => {
    const filtered = filterTree(tree(), {
      query: { conditions: [cond({ field: 'city', value: 'Chennai' })] },
    })
    expect(countFields(filtered)).toBe(1)
    expect(filtered.children[0].key).toBe('address')
  })

  it('still matches the loose term everywhere when unscoped', () => {
    const filtered = filterTree(tree(), { query: 'chennai' })
    // Both the city and the note that mentions Chennai.
    expect(countFields(filtered)).toBe(2)
  })

  it('accepts a precompiled predicate', () => {
    const filtered = filterTree(tree(), {
      match: compileQuery({ conditions: [cond({ field: 'amount', op: 'gt', value: 500 })] }),
    })
    const orders = filtered.children.find((child) => child.key === 'orders')
    // Two orders are over 500, and each is kept whole rather than pruned
    // down to its amount cell — 2 rows x 4 cells.
    expect(orders.children).toHaveLength(2)
    expect(countFields(filtered)).toBe(8)
  })

  it('combines a structured query with the display filters', () => {
    const filtered = filterTree(tree(), {
      query: { conditions: [cond({ op: 'type', value: 'id' })] },
      hideIds: true,
    })
    expect(filtered).toBeNull()
  })
})

describe('filterTree in row scope', () => {
  const query = {
    conditions: [
      cond({ field: 'status', value: 'paid' }),
      cond({ field: 'amount', op: 'gt', value: 500 }),
    ],
    combinator: 'AND',
  }

  it('keeps only the record that satisfies every condition, whole', () => {
    const filtered = filterTree(tree(), { query, rowScope: true })
    const orders = filtered.children.find((child) => child.key === 'orders')
    expect(filtered.children).toHaveLength(1)
    expect(orders.children).toHaveLength(1)
    // The whole row survives, not just the two cells that matched.
    expect(orders.children[0].children.map((cell) => cell.key)).toEqual([
      'order_ref',
      'amount',
      'status',
      'placed_on',
    ])
    expect(orders.children[0].children.find((cell) => cell.key === 'amount').rawValue).toBe(640)
  })

  it('finds nothing in field scope, which is why row scope exists', () => {
    expect(filterTree(tree(), { query })).toBeNull()
  })

  it('returns null when no record satisfies the whole query', () => {
    const impossible = {
      conditions: [
        cond({ field: 'status', value: 'refunded' }),
        cond({ field: 'amount', op: 'gt', value: 500 }),
      ],
    }
    expect(filterTree(tree(), { query: impossible, rowScope: true })).toBeNull()
  })

  it('still applies the display filters inside a kept record', () => {
    const filtered = filterTree(tree(), { query, rowScope: true, hideIds: true })
    const row = filtered.children[0].children[0]
    expect(row.children.map((cell) => cell.key)).toEqual(['amount', 'status', 'placed_on'])
  })
})

describe('filterTree keeps table rows whole', () => {
  it('keeps every cell of a matching row, not just the cell that matched', () => {
    const filtered = filterTree(tree(), { query: 'cancelled' })
    const orders = filtered.children.find((child) => child.key === 'orders')
    expect(orders.children).toHaveLength(1)
    // Without this, the Table view would render a row of dashes.
    expect(orders.children[0].children.map((cell) => cell.key)).toEqual([
      'order_ref',
      'amount',
      'status',
      'placed_on',
    ])
  })

  it('drops rows that match nothing', () => {
    const filtered = filterTree(tree(), { query: 'paid' })
    const orders = filtered.children.find((child) => child.key === 'orders')
    expect(orders.children).toHaveLength(2)
  })

  it('still prunes plain nested objects down to the matching field', () => {
    const filtered = filterTree(tree(), { query: 'chennai' })
    const address = filtered.children.find((child) => child.key === 'address')
    expect(address.children.map((child) => child.key)).toEqual(['city'])
  })

  it('does not keep a row that only matched a field the filters hide', () => {
    // order_ref is the only "id" in each row, and hideIds removes it first.
    const filtered = filterTree(tree(), { query: 'A-2', hideIds: true })
    expect(filtered).toBeNull()
  })
})

describe('countRows', () => {
  it('counts the rows of arrays of objects', () => {
    expect(countRows(tree())).toBe(3)
    expect(countRows(filterTree(tree(), { query: 'paid' }))).toBe(2)
    expect(countRows(null)).toBe(0)
  })
})

describe('adding a condition does not disturb the result until it is finished', () => {
  const users = () =>
    humanizeJson(
      {
        total: 3,
        users: [
          { name: 'Ravi', email: 'ravi@far.com', age: 30 },
          { name: 'Meera', email: 'meera@ex.com', age: 25 },
          { name: 'Arun', email: 'arun@far.com', age: 41 },
        ],
      },
      OPTS
    )

  const withExtra = (partial) => ({
    conditions: [cond({ field: 'email', value: 'ar' }), cond(partial)],
    combinator: 'AND',
  })

  /** Mirrors what useHumanizedJson does: row scope needs two *finished* conditions. */
  const run = (query) => {
    const rowScope = activeConditions(query).length > 1 && (query.combinator || 'AND') === 'AND'
    return filterTree(users(), { query, rowScope })
  }

  const baseline = () => run(parseQuery('email:ar'))

  it('matches the two users before anything is added', () => {
    expect(countRows(baseline())).toBe(2)
  })

  it('is unchanged by a field with no value yet', () => {
    expect(countRows(run(withExtra({ field: 'name' })))).toBe(2)
  })

  it('is unchanged by a blank condition on a field outside the array', () => {
    // This was the bad one: the whole document came back.
    const filtered = run(withExtra({ field: 'total' }))
    expect(countRows(filtered)).toBe(2)
    expect(countFields(filtered)).toBe(countFields(baseline()))
  })

  it('is unchanged by an operator with no bound yet', () => {
    expect(countRows(run(withExtra({ field: 'age', op: 'gt', value: '' })))).toBe(2)
    expect(countRows(run(withExtra({ field: 'age', op: 'between', value: '20' })))).toBe(2)
  })

  it('narrows only once the condition is complete', () => {
    expect(countRows(run(withExtra({ field: 'age', op: 'gt', value: '35' })))).toBe(1)
  })
})

describe('row scope never falls back to the whole document', () => {
  it('keeps the matching fields when the conditions are scattered, not the lot', () => {
    const root = humanizeJson({ total: 3, users: [{ name: 'Ravi' }, { name: 'Meera' }] }, OPTS)
    // Both conditions hold for the document, but no single record holds both.
    const query = parseQuery('name:Ravi total:3')
    const filtered = filterTree(root, { query, rowScope: true })
    expect(countFields(filtered)).toBeLessThan(countFields(root))
    expect(countRows(filtered)).toBe(1)
  })
})

describe('collectFields — what a field can be asked', () => {
  const fields = collectFields(
    humanizeJson(
      {
        count: 4,
        postal_code: '600001',
        rows: [
          { user_id: 1, order_ref: 'A-1', placed_on: '2024-01-10', active: true, name: 'Ravi' },
          { user_id: 2, order_ref: 'A-2', placed_on: '2024-09-21', active: false, name: 'Meera' },
        ],
      },
      OPTS
    )
  )
  const byKey = (key) => fields.find((field) => field.key === key)

  it('orders a numeric id even though it is displayed as an identifier', () => {
    expect(byKey('user_id').types).toEqual(['id'])
    expect(byKey('user_id').orderable).toBe(true)
  })

  it('does not order an id whose values are not numbers', () => {
    expect(byKey('order_ref').types).toEqual(['id'])
    expect(byKey('order_ref').orderable).toBe(false)
  })

  it('orders numbers and dates', () => {
    expect(byKey('count').orderable).toBe(true)
    expect(byKey('placed_on').orderable).toBe(true)
  })

  it('does not order text or booleans', () => {
    expect(byKey('name').orderable).toBe(false)
    // Booleans compare as 0/1 so equality works, but ordering them is noise.
    expect(byKey('active').orderable).toBe(false)
  })

  it('orders a number that happens to be stored as a string', () => {
    // The matcher can compare it, so the UI should offer it.
    expect(byKey('postal_code').orderable).toBe(true)
  })
})

describe('comparableKind', () => {
  const root = tree()

  it('reports what the matcher can do with a value, not how it looks', () => {
    expect(comparableKind(at(root, 'order_id'))).toBe('number')
    expect(comparableKind(at(root, 'orders[0].order_ref'))).toBe('text')
    expect(comparableKind(at(root, 'orders[0].placed_on'))).toBe('date')
    expect(comparableKind(at(root, 'orders[0].amount'))).toBe('number')
  })

  it('returns null only when there is no value to compare', () => {
    const withNull = humanizeJson({ notes: null }, OPTS)
    expect(comparableKind(at(withNull, 'notes'))).toBe(null)
    expect(comparableKind(null)).toBe(null)
    // An empty string is still a string, and sorts like one.
    expect(comparableKind(at(root, 'address.landmark'))).toBe('text')
  })
})

describe('ordering a numeric id end to end', () => {
  it('filters rows by a numeric id', () => {
    const root = humanizeJson(
      { rows: [{ user_id: 1 }, { user_id: 2 }, { user_id: 3 }, { user_id: 4 }] },
      OPTS
    )
    const filtered = filterTree(root, {
      query: { conditions: [cond({ field: 'user_id', op: 'gt', value: 2 })] },
    })
    expect(countRows(filtered)).toBe(2)
  })
})
