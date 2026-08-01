import { BOOLEAN_STYLES } from '../options.js'

export function formatBoolean(value, options = {}) {
  const style = BOOLEAN_STYLES[options.booleanStyle] || BOOLEAN_STYLES['yes-no']
  return value ? style.true : style.false
}
