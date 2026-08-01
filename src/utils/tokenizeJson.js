/**
 * Tiny JSON tokenizer for the Raw view. Produces typed segments that Vue
 * renders as text nodes inside styled <span>s — no HTML is ever built
 * from JSON content.
 *
 * Token types: 'key' | 'string' | 'number' | 'boolean' | 'null' |
 *              'punctuation' | 'whitespace'
 */

const NUMBER_RE = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/

export function tokenizeJson(text) {
  const tokens = []
  let i = 0

  const push = (type, value) => {
    const last = tokens[tokens.length - 1]
    if (last && last.type === type && (type === 'whitespace' || type === 'punctuation')) {
      last.value += value
    } else {
      tokens.push({ type, value })
    }
  }

  while (i < text.length) {
    const char = text[i]

    if (/\s/.test(char)) {
      push('whitespace', char)
      i++
      continue
    }

    if (char === '"') {
      let j = i + 1
      let escaped = false
      while (j < text.length) {
        if (escaped) escaped = false
        else if (text[j] === '\\') escaped = true
        else if (text[j] === '"') break
        j++
      }
      const raw = text.slice(i, Math.min(j + 1, text.length))
      // Look ahead for ':' to distinguish keys from string values.
      let k = j + 1
      while (k < text.length && /\s/.test(text[k])) k++
      push(text[k] === ':' ? 'key' : 'string', raw)
      i = j + 1
      continue
    }

    if (char === '-' || (char >= '0' && char <= '9')) {
      const match = text.slice(i).match(NUMBER_RE)
      if (match) {
        push('number', match[0])
        i += match[0].length
        continue
      }
    }

    if (text.startsWith('true', i)) {
      push('boolean', 'true')
      i += 4
      continue
    }
    if (text.startsWith('false', i)) {
      push('boolean', 'false')
      i += 5
      continue
    }
    if (text.startsWith('null', i)) {
      push('null', 'null')
      i += 4
      continue
    }

    push('punctuation', char)
    i++
  }

  return tokens
}
