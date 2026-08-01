/**
 * Lightweight character-level scanner used for duplicate-key detection
 * and trailing-comma repair. It is string-aware (understands escapes) so
 * it never touches content inside JSON strings.
 */

function scan(text, handlers) {
  let inString = false
  let escaped = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
        handlers.onStringEnd?.(i)
      }
      continue
    }
    if (char === '"') {
      inString = true
      handlers.onStringStart?.(i)
      continue
    }
    handlers.onChar?.(char, i)
  }
}

/** Removes trailing commas (",}" and ",]") outside of strings. */
export function stripTrailingCommas(text) {
  const removeAt = new Set()
  let pendingComma = -1

  scan(text, {
    onStringStart() {
      pendingComma = -1
    },
    onChar(char, i) {
      if (char === ',') {
        pendingComma = i
      } else if (char === '}' || char === ']') {
        if (pendingComma !== -1) removeAt.add(pendingComma)
        pendingComma = -1
      } else if (!/\s/.test(char)) {
        pendingComma = -1
      }
    },
  })

  if (removeAt.size === 0) return text
  let result = ''
  for (let i = 0; i < text.length; i++) {
    if (!removeAt.has(i)) result += text[i]
  }
  return result
}

/**
 * Minimal recursive-descent JSON scanner that returns the index of the
 * first syntax error, or -1 when the text is valid. Used because newer
 * JavaScript engines no longer include a position in JSON.parse errors.
 */
export function findSyntaxErrorPosition(text) {
  let i = 0
  const n = text.length
  const error = {}

  const ws = () => {
    while (i < n && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n' || text[i] === '\r'))
      i++
  }
  const fail = () => {
    error.pos = Math.min(i, n - 1)
    throw error
  }

  function parseString() {
    i++ // opening quote
    while (i < n) {
      if (text[i] === '\\') i += 2
      else if (text[i] === '"') {
        i++
        return
      } else i++
    }
    fail()
  }

  function parseNumber() {
    const match = text.slice(i).match(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/)
    if (!match || match[0] === '-') fail()
    i += match[0].length
  }

  function parseObject() {
    i++ // {
    ws()
    if (text[i] === '}') {
      i++
      return
    }
    for (;;) {
      ws()
      if (text[i] !== '"') fail()
      parseString()
      ws()
      if (text[i] !== ':') fail()
      i++
      parseValue()
      ws()
      if (text[i] === ',') {
        i++
        continue
      }
      if (text[i] === '}') {
        i++
        return
      }
      fail()
    }
  }

  function parseArray() {
    i++ // [
    ws()
    if (text[i] === ']') {
      i++
      return
    }
    for (;;) {
      parseValue()
      ws()
      if (text[i] === ',') {
        i++
        continue
      }
      if (text[i] === ']') {
        i++
        return
      }
      fail()
    }
  }

  function parseValue() {
    ws()
    if (i >= n) fail()
    const c = text[i]
    if (c === '{') return parseObject()
    if (c === '[') return parseArray()
    if (c === '"') return parseString()
    if (c === '-' || (c >= '0' && c <= '9')) return parseNumber()
    if (text.startsWith('true', i)) {
      i += 4
      return
    }
    if (text.startsWith('false', i)) {
      i += 5
      return
    }
    if (text.startsWith('null', i)) {
      i += 4
      return
    }
    fail()
  }

  try {
    parseValue()
    ws()
    if (i < n) return i
    return -1
  } catch (thrown) {
    return thrown === error ? error.pos : -1
  }
}

/**
 * Finds duplicate keys per object level. Returns human-readable warnings
 * such as: 'Duplicate key "name" at line 4. The last value wins.'
 */
export function findDuplicateKeys(text) {
  const warnings = []
  const stack = []
  let stringStart = -1
  let lastString = null

  const lineOf = (position) => {
    let line = 1
    for (let i = 0; i < position && i < text.length; i++) {
      if (text[i] === '\n') line++
    }
    return line
  }

  scan(text, {
    onStringStart(i) {
      stringStart = i
    },
    onStringEnd(i) {
      lastString = { value: text.slice(stringStart + 1, i), start: stringStart }
    },
    onChar(char, _i) {
      const top = stack[stack.length - 1]
      if (char === '{') {
        stack.push({ type: 'object', keys: new Set() })
      } else if (char === '[') {
        stack.push({ type: 'array' })
      } else if (char === '}' || char === ']') {
        stack.pop()
      } else if (char === ':' && top?.type === 'object' && lastString) {
        const key = lastString.value
        if (top.keys.has(key)) {
          warnings.push(
            `Duplicate key "${key}" at line ${lineOf(lastString.start)}. The last value wins.`
          )
        }
        top.keys.add(key)
        lastString = null
      } else if (char === ',') {
        lastString = null
      }
      if (warnings.length >= 20) return
    },
  })

  return warnings
}
