<script setup>
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Download } from 'lucide-vue-next'
import NodeValue from './NodeValue.vue'
import { formatKey } from '../../core/formatter/formatKey.js'
import { useExport } from '../../composables/useExport.js'

const props = defineProps({
  tree: { type: Object, required: true },
})

const PAGE_SIZE = 25
const { exportCsv } = useExport()

/** Collects every array-of-objects in the tree so the user can pick one. */
function collectTables(node, found = []) {
  if (!node) return found
  if (node.kind === 'array' && node.itemsAreObjects) {
    found.push(node)
  }
  for (const child of node.children || []) collectTables(child, found)
  return found
}

const tables = computed(() => collectTables(props.tree))
const selectedPath = ref('')
const columnsOpen = ref(false)
const hiddenColumns = ref(new Set())
const sortKey = ref('')
const sortDirection = ref('asc')
const page = ref(1)

const activeTable = computed(
  () => tables.value.find((table) => table.path === selectedPath.value) || tables.value[0] || null
)

watch(activeTable, () => {
  sortKey.value = ''
  page.value = 1
  hiddenColumns.value = new Set()
})

const columns = computed(() => {
  if (!activeTable.value) return []
  return (activeTable.value.columns || []).filter((column) => !hiddenColumns.value.has(column))
})

function cellFor(row, column) {
  return row.children.find((cell) => cell.key === column) || null
}

function sortableValue(row, column) {
  const cell = cellFor(row, column)
  if (!cell) return undefined
  return cell.kind === 'field' ? cell.rawValue : (cell.itemCount ?? cell.entryCount)
}

const sortedRows = computed(() => {
  if (!activeTable.value) return []
  const rows = [...activeTable.value.children]
  if (!sortKey.value) return rows
  const direction = sortDirection.value === 'asc' ? 1 : -1
  return rows.sort((a, b) => {
    const va = sortableValue(a, sortKey.value)
    const vb = sortableValue(b, sortKey.value)
    if (va === vb) return 0
    if (va === undefined || va === null) return 1
    if (vb === undefined || vb === null) return -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * direction
    return String(va).localeCompare(String(vb)) * direction
  })
})

const pageCount = computed(() => Math.max(Math.ceil(sortedRows.value.length / PAGE_SIZE), 1))
const pagedRows = computed(() =>
  sortedRows.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)

function toggleSort(column) {
  if (sortKey.value === column) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else {
      sortKey.value = ''
    }
  } else {
    sortKey.value = column
    sortDirection.value = 'asc'
  }
}

function toggleColumn(column) {
  const next = new Set(hiddenColumns.value)
  if (next.has(column)) next.delete(column)
  else next.add(column)
  hiddenColumns.value = next
}
</script>

<template>
  <div
    v-if="!tables.length"
    class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400"
  >
    Table view needs an array of similar objects. This JSON does not contain one — try the Document
    or Cards view instead.
  </div>

  <div v-else class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <template v-if="tables.length > 1">
        <label for="table-select" class="text-xs font-medium text-slate-500 dark:text-slate-400">
          Data set
        </label>
        <select
          id="table-select"
          v-model="selectedPath"
          class="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option v-for="table in tables" :key="table.path" :value="table.path">
            {{ table.label || 'Root array' }} ({{ table.itemCount }})
          </option>
        </select>
      </template>
      <span v-else class="text-xs text-slate-500 dark:text-slate-400">
        {{ activeTable.label || 'Items' }} — {{ activeTable.itemCount }} rows
      </span>

      <div class="relative ml-auto">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          :aria-expanded="columnsOpen"
          @click="columnsOpen = !columnsOpen"
        >
          <Columns3 class="h-3.5 w-3.5" aria-hidden="true" /> Columns
        </button>
        <div
          v-if="columnsOpen"
          class="absolute right-0 top-full z-20 mt-1 max-h-64 w-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <label
            v-for="column in activeTable.columns"
            :key="column"
            class="flex items-center gap-2 rounded px-1.5 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <input
              type="checkbox"
              class="accent-brand-500"
              :checked="!hiddenColumns.has(column)"
              @change="toggleColumn(column)"
            />
            {{ formatKey(column) }}
          </label>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        @click="exportCsv(activeTable)"
      >
        <Download class="h-3.5 w-3.5" aria-hidden="true" /> CSV
      </button>
    </div>

    <div
      class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <table class="w-full min-w-max border-collapse text-left text-sm">
        <caption class="sr-only">
          {{
            activeTable.label || 'Data table'
          }}
          with
          {{
            activeTable.itemCount
          }}
          rows
        </caption>
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <th
              v-for="column in columns"
              :key="column"
              scope="col"
              class="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              :aria-sort="
                sortKey === column ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
              "
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
                @click="toggleSort(column)"
              >
                {{ formatKey(column) }}
                <ArrowUp
                  v-if="sortKey === column && sortDirection === 'asc'"
                  class="h-3 w-3"
                  aria-hidden="true"
                />
                <ArrowDown v-else-if="sortKey === column" class="h-3 w-3" aria-hidden="true" />
                <ArrowUpDown v-else class="h-3 w-3 opacity-30" aria-hidden="true" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in pagedRows"
            :key="row.path"
            class="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/50"
          >
            <td
              v-for="column in columns"
              :key="column"
              class="px-3 py-2 align-top text-slate-800 dark:text-slate-100"
            >
              <template v-if="cellFor(row, column)">
                <NodeValue
                  v-if="cellFor(row, column).kind === 'field'"
                  :node="cellFor(row, column)"
                />
                <span v-else class="text-xs italic text-slate-400">
                  {{
                    cellFor(row, column).kind === 'array'
                      ? `${cellFor(row, column).itemCount} items`
                      : `${cellFor(row, column).entryCount} details`
                  }}
                </span>
              </template>
              <span v-else class="text-slate-300 dark:text-slate-600">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav
      v-if="pageCount > 1"
      class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"
      aria-label="Table pagination"
    >
      <button
        type="button"
        class="rounded-md border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
        :disabled="page <= 1"
        @click="page--"
      >
        Previous
      </button>
      <span aria-live="polite">Page {{ page }} of {{ pageCount }}</span>
      <button
        type="button"
        class="rounded-md border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
        :disabled="page >= pageCount"
        @click="page++"
      >
        Next
      </button>
    </nav>
  </div>
</template>
