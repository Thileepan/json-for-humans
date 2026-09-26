/**
 * The text form of a query, and its inverse.
 *
 *   city:Chennai amount>500 -status:cancelled "exact phrase" is:date
 *
 * `parseQuery` never throws: anything it cannot read becomes a plain
 * contains term, so typing is never punished with an error.
 *
 * Syntax
 *   term                 contains, anywhere (key, label or value)
 *   "two words"          the same, as one phrase
 *   field:value          contains, limited to that field
 *   field=value          equals            field!=value   not equals
 *   field>v  field>=v    greater than      field<v  field<=v  less than
 *   field:a..b           between (inclusive)
 *   field~pattern        regular expression
 *   has:field            the field is present
 *   empty:field          the field is empty     is:empty  any empty field
 *   is:date              detected type (date, currency, url, email, …)
 *   -term                exclude
 *   OR                   match any condition instead of all of them
 *   field[op]:value      long form, for operators with no shorthand
 *
 * `serializeQuery` is the inverse and prefers the shorthand whenever one
 * exists, so what the builder writes is what a person would have typed.
 * `caseSensitive` is deliberately not serialized — it is a whole-query
 * toggle in the UI rather than a per-condition flag.
 */

import { OPERATORS } from './matchCondition.js'
import { createCondition, normalizeQuery } from './compileQuery.js'

const FIELD_RE = /^[A-Za-z_][A-Za-z0-9_.\-[\]]*$/

// Longest first, so `>=` is found before `>` at the same position.
const SHORTHAND_OPS = [
  { symbol: '!=', op: 'equals', negate: true },
  { symbol: '>=', op: 'gte' },
  { symbol: '<=', op: 'lte' },
  { symbol: '=', op: 'equals' },
  { symbol: '>', op: 'gt' },
  { symbol: '<', op: 'lt' },
  { symbol: '~', op: 'regex' },
  { symbol: ':', op: 'contains' },
]

/**
 * Splits on whitespace, but keeps quoted runs together. `quoted` records
 * whether the token *opened* with a quote — `"a b"` is a literal phrase,
 * while `city:"a b"` is still a scoped term.
 */
function tokenize(text) {
  const tokens = []
  let current = ''
  let quote = null
  let started = false
  let quotedStart = false

  const push = () => {
    if (started) tokens.push({ text: current, quoted: quotedStart })
    current = ''
    started = false
    quotedStart = false
  }

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quote) {
      if (char === '\\' && text[index + 1] === quote) {
        current += quote
        index += 1
      } else if (char === quote) {
        quote = null
      } else {
        current += char
      }
      continue
    }

    if (char === '"' || char === "'") {
      if (!started) quotedStart = true
      started = true
      quote = char
      continue
    }

    if (/\s/.test(char)) {
      push()
      continue
    }

    current += char
    started = true
  }

  push()
  return tokens
}

/** `a..b` — the shorthand needs both sides, or it is not a range at all. */
function splitRange(value) {
  const index = value.indexOf('..')
  if (index <= 0 || index >= value.length - 2) return null
  return [value.slice(0, index), value.slice(index + 2)]
}

/**
 * The long form may carry a half-written range (`100..`, `..900`, even
 * `..`), because the builder has to be able to write down a condition the
 * user has not finished.
 */
function splitRangeLoose(value) {
  const index = value.indexOf('..')
  if (index === -1) return null
  return [value.slice(0, index), value.slice(index + 2)]
}

function findShorthand(text) {
  let best = null
  for (const candidate of SHORTHAND_OPS) {
    const index = text.indexOf(candidate.symbol)
    if (index <= 0) continue
    if (
      !best ||
      index < best.index ||
      (index === best.index && candidate.symbol.length > best.candidate.symbol.length)
    ) {
      best = { index, candidate }
    }
  }
  return best
}

function parseToken(token) {
  let text = token.text
  let negate = false

  if (!token.quoted && text.length > 1 && (text.startsWith('-') || text.startsWith('!'))) {
    negate = true
    text = text.slice(1)
  }

  // A quoted token is always a literal phrase, never syntax.
  if (token.quoted) return createCondition({ value: text, negate })

  let match = /^has:(.+)$/i.exec(text)
  if (match && FIELD_RE.test(match[1])) {
    return createCondition({ field: match[1], op: 'exists', negate })
  }

  match = /^empty:(.+)$/i.exec(text)
  if (match && FIELD_RE.test(match[1])) {
    return createCondition({ field: match[1], op: 'isEmpty', negate })
  }

  match = /^is:(.+)$/i.exec(text)
  if (match) {
    const value = match[1].toLowerCase()
    if (value === 'empty') return createCondition({ op: 'isEmpty', negate })
    return createCondition({ op: 'type', value, negate })
  }

  // Long form: field[op]:value — the field may itself contain `[]`.
  match = /^(.*)\[([A-Za-z]+)\](?::([\s\S]*))?$/.exec(text)
  if (match && OPERATORS.includes(match[2]) && (match[1] === '' || FIELD_RE.test(match[1]))) {
    const value = match[3] ?? ''
    const range = match[2] === 'between' ? splitRangeLoose(value) : null
    return createCondition({
      field: match[1],
      op: match[2],
      value: range ? range[0] : value,
      value2: range ? range[1] : null,
      negate,
    })
  }

  const shorthand = findShorthand(text)
  if (shorthand) {
    const field = text.slice(0, shorthand.index)
    const value = text.slice(shorthand.index + shorthand.candidate.symbol.length)
    // `https://example.com` is a URL, not a scoped term.
    const looksLikeUrl = shorthand.candidate.op === 'contains' && value.startsWith('/')
    if (FIELD_RE.test(field) && !looksLikeUrl) {
      const range = shorthand.candidate.op === 'contains' ? splitRange(value) : null
      if (range) {
        return createCondition({ field, op: 'between', value: range[0], value2: range[1], negate })
      }
      return createCondition({
        field,
        op: shorthand.candidate.op,
        value,
        negate: negate || !!shorthand.candidate.negate,
      })
    }
  }

  return createCondition({ value: text, negate })
}

/**
 * @param {string} text
 * @returns {{conditions: object[], combinator: 'AND'|'OR'}}
 */
export function parseQuery(text) {
  const conditions = []
  let combinator = 'AND'

  for (const token of tokenize(String(text ?? ''))) {
    if (!token.quoted) {
      const upper = token.text.toUpperCase()
      if (upper === 'OR') {
        combinator = 'OR'
        continue
      }
      if (upper === 'AND') continue
    }
    conditions.push(parseToken(token))
  }

  return { conditions, combinator }
}

function quoteIfNeeded(value) {
  const text = String(value ?? '')
  if (!text) return ''
  if (/[\s"']/.test(text)) return `"${text.replaceAll('"', '\\"')}"`
  return text
}

function longForm(condition, prefix) {
  const value =
    condition.op === 'between'
      ? `${String(condition.value ?? '')}..${String(condition.value2 ?? '')}`
      : String(condition.value ?? '')
  const field = String(condition.field ?? '').trim()
  const tail = value ? `:${quoteIfNeeded(value)}` : ''
  return `${prefix}${field}[${condition.op}]${tail}`
}

/**
 * Does this text read back as the condition it was written from? The
 * shorthands are ambiguous at the edges — an unfinished range serializes to
 * `age:..`, which parses back as a plain term — so every shorthand is
 * checked against the parser rather than trusted. Anything that fails falls
 * back to the long form, which is unambiguous.
 */
function roundTrips(text, condition) {
  const parsed = parseQuery(text).conditions
  if (parsed.length !== 1) return false
  const back = parsed[0]
  return (
    back.op === condition.op &&
    String(back.field ?? '') === String(condition.field ?? '').trim() &&
    String(back.value ?? '') === String(condition.value ?? '') &&
    String(back.value2 ?? '') === String(condition.value2 ?? '') &&
    !!back.negate === !!condition.negate
  )
}

function serializeCondition(condition) {
  const prefix = condition.negate ? '-' : ''
  const shorthand = shorthandFor(condition, prefix)
  if (shorthand && roundTrips(shorthand, condition)) return shorthand
  const long = longForm(condition, prefix)
  return roundTrips(long, condition) ? long : shorthand || long
}

function shorthandFor(condition, prefix) {
  const field = String(condition.field ?? '').trim()
  const value = String(condition.value ?? '')

  switch (condition.op) {
    case 'exists':
      return field ? `${prefix}has:${field}` : ''
    case 'isEmpty':
      return field ? `${prefix}empty:${field}` : `${prefix}is:empty`
    case 'type':
      return field ? null : `${prefix}is:${value.toLowerCase()}`
    case 'contains':
      if (!field) return `${prefix}${quoteIfNeeded(value)}`
      return `${prefix}${field}:${quoteIfNeeded(value)}`
    case 'equals':
      if (!field) return null
      return condition.negate
        ? `${field}!=${quoteIfNeeded(value)}`
        : `${field}=${quoteIfNeeded(value)}`
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      if (!field) return null
      const symbol = { gt: '>', gte: '>=', lt: '<', lte: '<=' }[condition.op]
      return `${prefix}${field}${symbol}${quoteIfNeeded(value)}`
    }
    case 'between':
      if (!field) return null
      return `${prefix}${field}:${value}..${String(condition.value2 ?? '')}`
    case 'regex':
      if (!field) return null
      return `${prefix}${field}~${quoteIfNeeded(value)}`
    default:
      return null
  }
}

/**
 * @param {object|Array|string} query
 * @returns {string} the text a person would have typed for this query
 */
export function serializeQuery(query) {
  const { conditions, combinator } = normalizeQuery(query)
  const parts = conditions.map(serializeCondition).filter(Boolean)
  return parts.join(combinator === 'OR' ? ' OR ' : ' ')
}
