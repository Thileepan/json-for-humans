/**
 * JSON parsing with friendly error locations, duplicate-key warnings and
 * a non-destructive repair suggestion for trailing commas. The original
 * input is never modified; a suggested repair is returned separately.
 */

import { findDuplicateKeys, findSyntaxErrorPosition, stripTrailingCommas } from './validateJson.js'

export const MAX_INPUT_BYTES = 20 * 1024 * 1024 // hard limit: 20 MB
export const WARN_INPUT_BYTES = 5 * 1024 * 1024 // soft warning above 5 MB

function positionToLineColumn(text, position) {
  let line = 1
  let column = 1
  const max = Math.min(position, text.length)
  for (let i = 0; i < max; i++) {
    if (text[i] === '\n') {
      line++
      column = 1
    } else {
      column++
    }
  }
  return { line, column }
}

function locateError(message, text) {
  // Newer V8: "... (line 3 column 5)" — older V8: "... at position 42"
  const lineColumn = message.match(/line (\d+) column (\d+)/)
  if (lineColumn) {
    return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) }
  }
  const position = message.match(/at position (\d+)/)
  if (position) {
    return positionToLineColumn(text, Number(position[1]))
  }
  // Newer engines omit the position entirely — locate it ourselves.
  const scanned = findSyntaxErrorPosition(text)
  if (scanned >= 0) {
    return positionToLineColumn(text, scanned)
  }
  return { line: null, column: null }
}

function cleanErrorMessage(message) {
  return message
    .replace(/^JSON\.parse: /, '')
    .replace(/in JSON at position \d+.*$/, '')
    .replace(/\(line \d+ column \d+\)/, '')
    .trim()
}

/**
 * @returns {{
 *   ok: boolean, empty?: boolean, value?: *, warnings?: string[],
 *   error?: { message, line, column } | null,
 *   suggestion?: { text, description } | null,
 *   byteSize?: number, tooLarge?: boolean
 * }}
 */
export function parseJson(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, empty: true, error: null, suggestion: null }
  }

  const byteSize = new TextEncoder().encode(text).length
  if (byteSize > MAX_INPUT_BYTES) {
    return {
      ok: false,
      empty: false,
      tooLarge: true,
      byteSize,
      error: {
        message: `Input is ${(byteSize / (1024 * 1024)).toFixed(1)} MB. The maximum supported size is 20 MB.`,
        line: null,
        column: null,
      },
      suggestion: null,
    }
  }

  try {
    const value = JSON.parse(text)
    return {
      ok: true,
      value,
      byteSize,
      warnings: findDuplicateKeys(text),
      error: null,
      suggestion: null,
    }
  } catch (err) {
    const message = String(err && err.message ? err.message : err)
    const { line, column } = locateError(message, text)

    let suggestion = null
    const repaired = stripTrailingCommas(text)
    if (repaired !== text) {
      try {
        JSON.parse(repaired)
        suggestion = {
          text: repaired,
          description: 'Trailing commas were found. Apply the suggested repair to remove them.',
        }
      } catch {
        suggestion = null
      }
    }

    return {
      ok: false,
      empty: false,
      byteSize,
      error: { message: cleanErrorMessage(message), line, column },
      suggestion,
    }
  }
}
