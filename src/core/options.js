/**
 * Default humanization options. The engine is deterministic: the same
 * input + options + schema always produces the same output.
 */

export const BOOLEAN_STYLES = {
  'yes-no': { true: 'Yes', false: 'No' },
  'true-false': { true: 'True', false: 'False' },
  'enabled-disabled': { true: 'Enabled', false: 'Disabled' },
  'active-inactive': { true: 'Active', false: 'Inactive' },
}

export const DEFAULT_OPTIONS = {
  booleanStyle: 'yes-no',
  nullLabel: 'Not available',
  emptyStringLabel: 'Empty',
  emptyArrayLabel: 'No items',
  emptyObjectLabel: 'No details',
  /** BCP-47 locale string; undefined means "browser default". */
  locale: undefined,
  /** 'datetime' | 'date' | 'relative' */
  dateMode: 'datetime',
  /** 'local' | 'utc' */
  timezone: 'local',
  /** Maximum recursion depth before the engine truncates. */
  maxDepth: 60,
  /** Reference date for relative formatting (injectable for tests). */
  now: undefined,
}

export function resolveOptions(options = {}) {
  const resolved = { ...DEFAULT_OPTIONS }
  for (const [key, value] of Object.entries(options || {})) {
    if (value !== undefined) resolved[key] = value
  }
  if (!BOOLEAN_STYLES[resolved.booleanStyle]) resolved.booleanStyle = 'yes-no'
  return resolved
}
