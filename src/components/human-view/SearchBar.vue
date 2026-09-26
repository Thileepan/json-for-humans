<script setup>
import { CaseSensitive, Filter, Plus, Search, SlidersHorizontal, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppTooltip from '../common/AppTooltip.vue'
import { useSearch } from '../../composables/useSearch.js'
import { formatKey } from '../../core/formatter/formatKey.js'

const props = defineProps({
  matchCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  rowCount: { type: Number, default: 0 },
  totalRows: { type: Number, default: 0 },
  fields: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'document' },
})

const {
  searchQuery,
  searchCaseSensitive,
  hideNulls,
  hideEmpty,
  hideIds,
  conditions,
  combinator,
  addCondition,
  updateCondition,
  removeCondition,
  setCombinator,
  resetFilters,
} = useSearch()

const filtersOpen = ref(false)
const builderOpen = ref(false)
const inputRef = ref(null)

/**
 * The box is debounced so a long document is not re-filtered on every
 * keystroke; the builder writes through immediately, since those edits are
 * deliberate and already discrete.
 */
const DEBOUNCE_MS = 150
const draft = ref(searchQuery.value)
let timer = null

watch(searchQuery, (value) => {
  if (value !== draft.value) draft.value = value
})

watch(draft, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    searchQuery.value = value
  }, DEBOUNCE_MS)
})

function clearSearch() {
  clearTimeout(timer)
  draft.value = ''
  searchQuery.value = ''
  inputRef.value?.focus()
}

/** `/` or Cmd/Ctrl-K jumps to the search box from anywhere on the page. */
function onGlobalKeydown(event) {
  const target = event.target
  const isTyping =
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  const isShortcut =
    (event.key === '/' && !isTyping) ||
    ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')
  if (!isShortcut) return
  event.preventDefault()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function onEscape() {
  if (draft.value) clearSearch()
  else inputRef.value?.blur()
}

onMounted(() => document.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
  clearTimeout(timer)
})

const OPERATOR_LABELS = [
  { op: 'contains', label: 'contains', group: 'text' },
  { op: 'equals', label: 'is', group: 'text' },
  { op: 'startsWith', label: 'starts with', group: 'text' },
  { op: 'endsWith', label: 'ends with', group: 'text' },
  { op: 'regex', label: 'matches regex', group: 'text' },
  { op: 'gt', label: 'greater than', group: 'ordered' },
  { op: 'gte', label: 'at least', group: 'ordered' },
  { op: 'lt', label: 'less than', group: 'ordered' },
  { op: 'lte', label: 'at most', group: 'ordered' },
  { op: 'between', label: 'between', group: 'ordered' },
  { op: 'exists', label: 'is present', group: 'presence' },
  { op: 'isEmpty', label: 'is empty', group: 'presence' },
  { op: 'type', label: 'is of type', group: 'type' },
]

const VALUELESS_OPS = new Set(['exists', 'isEmpty'])

function fieldFor(condition) {
  if (!condition.field) return null
  return props.fields.find(
    (field) => field.path === condition.field || field.key === condition.field
  )
}

/**
 * The operators worth offering for a field. An unscoped condition gets all
 * of them, since it could land on anything.
 *
 * Ordering comes from `field.orderable`, which the engine derives from the
 * values themselves rather than from how they are displayed — `user_id: 1`
 * reads as an identifier but is a number, so it can be ordered, while
 * `order_ref: "A-1"` cannot. The rule is that an operator is offered only
 * when the matcher can actually answer it.
 */
function operatorsFor(condition) {
  const field = fieldFor(condition)
  if (!field) return OPERATOR_LABELS

  const types = new Set(field.types || [])
  const onlyBoolean = types.size > 0 && [...types].every((type) => type === 'boolean')

  return OPERATOR_LABELS.filter((entry) => {
    if (entry.group === 'presence') return true
    // A field with one known type does not need to be asked about its type.
    if (entry.group === 'type') return types.size > 1
    if (entry.group === 'ordered') return !!field.orderable
    return onlyBoolean ? entry.op === 'equals' : true
  })
}

/**
 * Changing the field can strand the operator — "greater than" makes no
 * sense once the field is an email — so fall back to a supported one
 * instead of leaving a condition that cannot match.
 */
function changeField(index, path) {
  const condition = conditions.value[index]
  const allowed = operatorsFor({ ...condition, field: path })
  const patch = { field: path }
  if (!allowed.some((entry) => entry.op === condition.op)) {
    patch.op = allowed.find((entry) => entry.op === 'contains')?.op || allowed[0].op
  }
  updateCondition(index, patch)
}

const showRows = computed(() => props.viewMode === 'table' && props.totalRows > 0)

const countText = computed(() =>
  showRows.value
    ? `${props.rowCount}/${props.totalRows} rows`
    : `${props.matchCount}/${props.totalCount} fields`
)

const countTitle = computed(() => {
  if (showRows.value) {
    return `${props.rowCount} of ${props.totalRows} table rows match the current search and filters.`
  }
  const base = `${props.matchCount} of ${props.totalCount} fields match the current search and filters.`
  return props.totalRows
    ? `${base} ${props.rowCount} of ${props.totalRows} table rows are kept.`
    : base
})

const CASE_HINT =
  'Match case. Off: searching “ravi” also finds “Ravi” and “RAVI”. ' +
  'On: “ravi” finds only the lowercase spelling, so “Ravi” is left out.'

/** Detected types actually present in this document, for the type dropdown. */
const typeOptions = computed(() => {
  const types = new Set()
  for (const field of props.fields) {
    for (const type of field.types || []) types.add(type)
  }
  return [...types].sort()
})

function labelFor(op) {
  return OPERATOR_LABELS.find((entry) => entry.op === op)?.label || op
}

function fieldLabel(condition) {
  if (!condition.field) return 'Any field'
  const known = props.fields.find(
    (field) => field.path === condition.field || field.key === condition.field
  )
  return known?.label || formatKey(condition.field)
}

function summarize(condition) {
  const parts = [
    fieldLabel(condition),
    condition.negate ? `not ${labelFor(condition.op)}` : labelFor(condition.op),
  ]
  if (condition.op === 'between') {
    parts.push(`${condition.value} – ${condition.value2}`)
  } else if (!VALUELESS_OPS.has(condition.op)) {
    parts.push(String(condition.value ?? ''))
  }
  return parts.filter(Boolean).join(' ')
}

const hasActiveFilters = computed(
  () => conditions.value.length > 0 || hideNulls.value || hideEmpty.value || hideIds.value
)
</script>

<template>
  <div class="relative flex items-center gap-1.5">
    <div class="relative">
      <Search
        class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        ref="inputRef"
        v-model="draft"
        type="search"
        placeholder="Search — try city:Chennai amount>500"
        aria-label="Search fields or values"
        aria-keyshortcuts="/ Control+K Meta+K"
        aria-describedby="search-syntax-hint"
        class="w-44 rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-72"
        @keydown.esc.prevent="onEscape"
      />
      <button
        v-if="draft"
        type="button"
        class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
        aria-label="Clear search"
        @click="clearSearch"
      >
        <X class="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
    <p id="search-syntax-hint" class="sr-only">
      Type a word to search everywhere, or scope it to a field with field:value. Use greater-than
      and less-than for numbers and dates, a minus sign to exclude, and OR to match any condition.
      Press slash or Control-K to jump here, and Escape to clear.
    </p>

    <span
      v-if="hasActiveFilters"
      class="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400"
      aria-live="polite"
    >
      <AppTooltip :content="countTitle" focusable>
        <span>{{ countText }}</span>
      </AppTooltip>
    </span>

    <AppTooltip :content="CASE_HINT">
      <button
        type="button"
        class="rounded-md border px-1.5 py-1.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        :class="
          searchCaseSensitive
            ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/40 dark:text-brand-300'
            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
        "
        :aria-pressed="searchCaseSensitive"
        @click="searchCaseSensitive = !searchCaseSensitive"
      >
        <CaseSensitive class="h-3.5 w-3.5" aria-hidden="true" />
        <span class="sr-only">Match case</span>
      </button>
    </AppTooltip>

    <div class="relative">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        :aria-expanded="builderOpen"
        aria-haspopup="true"
        @click="builderOpen = !builderOpen"
      >
        <SlidersHorizontal class="h-3.5 w-3.5" aria-hidden="true" />
        Conditions
        <span
          v-if="conditions.length"
          class="rounded-full bg-brand-100 px-1.5 text-[0.65rem] font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
          >{{ conditions.length }}</span
        >
      </button>

      <div
        v-if="builderOpen"
        class="absolute right-0 top-full z-20 mt-1 w-[22rem] rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="mb-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <label for="search-combinator">Match</label>
          <select
            id="search-combinator"
            class="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            :value="combinator"
            :disabled="conditions.length < 2"
            @change="setCombinator($event.target.value)"
          >
            <option value="AND">all</option>
            <option value="OR">any</option>
          </select>
          <span>of these conditions</span>
        </div>

        <p
          v-if="!conditions.length"
          class="rounded-md bg-slate-50 px-2 py-3 text-center text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400"
        >
          No conditions yet. Add one, or type something like
          <code class="font-mono">status:paid</code> in the search box.
        </p>

        <ul v-else class="space-y-2">
          <li
            v-for="(condition, index) in conditions"
            :key="index"
            class="rounded-md border border-slate-200 p-2 dark:border-slate-700"
          >
            <div class="flex items-center gap-1">
              <select
                class="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                :value="condition.field"
                :aria-label="`Field for condition ${index + 1}`"
                @change="changeField(index, $event.target.value)"
              >
                <option value="">Any field</option>
                <option v-for="field in fields" :key="field.path" :value="field.path">
                  {{ field.label || formatKey(field.key) }}
                </option>
              </select>
              <button
                type="button"
                class="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                :aria-label="`Remove condition ${index + 1}`"
                @click="removeCondition(index)"
              >
                <X class="h-3 w-3" aria-hidden="true" />
              </button>
            </div>

            <div class="mt-1.5 flex items-center gap-1">
              <select
                class="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                :value="condition.op"
                :aria-label="`Operator for condition ${index + 1}`"
                @change="updateCondition(index, { op: $event.target.value })"
              >
                <option v-for="entry in operatorsFor(condition)" :key="entry.op" :value="entry.op">
                  {{ entry.label }}
                </option>
              </select>
              <label
                class="flex shrink-0 items-center gap-1 text-[0.7rem] text-slate-600 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  class="accent-brand-500"
                  :checked="condition.negate"
                  @change="updateCondition(index, { negate: $event.target.checked })"
                />
                not
              </label>
            </div>

            <div v-if="!VALUELESS_OPS.has(condition.op)" class="mt-1.5 flex items-center gap-1">
              <select
                v-if="condition.op === 'type'"
                class="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                :value="condition.value"
                :aria-label="`Type for condition ${index + 1}`"
                @change="updateCondition(index, { value: $event.target.value })"
              >
                <option value="">Choose a type</option>
                <option v-for="type in typeOptions" :key="type" :value="type">{{ type }}</option>
              </select>
              <template v-else>
                <input
                  type="text"
                  class="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  :value="condition.value"
                  :placeholder="condition.op === 'between' ? 'from' : 'value'"
                  :aria-label="`Value for condition ${index + 1}`"
                  @input="updateCondition(index, { value: $event.target.value })"
                />
                <input
                  v-if="condition.op === 'between'"
                  type="text"
                  class="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  :value="condition.value2 ?? ''"
                  placeholder="to"
                  :aria-label="`Upper bound for condition ${index + 1}`"
                  @input="updateCondition(index, { value2: $event.target.value })"
                />
              </template>
            </div>

            <p class="mt-1.5 text-[0.7rem] text-slate-500 dark:text-slate-400">
              {{ summarize(condition) }}
            </p>
          </li>
        </ul>

        <button
          type="button"
          class="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="addCondition({ field: fields[0]?.path || '' })"
        >
          <Plus class="h-3.5 w-3.5" aria-hidden="true" /> Add condition
        </button>
      </div>
    </div>

    <div class="relative">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        :aria-expanded="filtersOpen"
        aria-haspopup="true"
        @click="filtersOpen = !filtersOpen"
      >
        <Filter class="h-3.5 w-3.5" aria-hidden="true" />
        Filters
      </button>
      <div
        v-if="filtersOpen"
        class="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
      >
        <label class="flex items-center gap-2 py-1 text-xs text-slate-700 dark:text-slate-200">
          <input v-model="hideNulls" type="checkbox" class="accent-brand-500" />
          Hide null values
        </label>
        <label class="flex items-center gap-2 py-1 text-xs text-slate-700 dark:text-slate-200">
          <input v-model="hideEmpty" type="checkbox" class="accent-brand-500" />
          Hide empty values
        </label>
        <label class="flex items-center gap-2 py-1 text-xs text-slate-700 dark:text-slate-200">
          <input v-model="hideIds" type="checkbox" class="accent-brand-500" />
          Hide technical identifiers
        </label>
        <button
          type="button"
          class="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="(resetFilters(), (filtersOpen = false))"
        >
          Reset filters
        </button>
      </div>
    </div>
  </div>
</template>
