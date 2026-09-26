/** Public surface of the search engine. Framework-free, like the rest of core/. */

export { collectFields, fieldCandidates, fieldMatches, normalizeIdent } from './fields.js'
export {
  COMPARISON_OPS,
  OPERATORS,
  TEXT_OPS,
  UNARY_OPS,
  comparableKind,
  matchCondition,
} from './matchCondition.js'
export { highlightRanges, highlightSegments } from './highlight.js'
export {
  MATCH_ALL,
  activeConditions,
  compileQuery,
  compileRowQuery,
  createCondition,
  isEmptyQuery,
  isIncomplete,
  normalizeQuery,
} from './compileQuery.js'
