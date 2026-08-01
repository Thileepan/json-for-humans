<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Sparkles } from 'lucide-vue-next'
import ViewModeSelector from './ViewModeSelector.vue'
import SearchBar from './SearchBar.vue'
import DocumentView from './DocumentView.vue'
import CardsView from './CardsView.vue'
import TableView from './TableView.vue'
import TreeView from './TreeView.vue'
import RawView from './RawView.vue'
import ExportMenu from '../export/ExportMenu.vue'
import { useHumanizedJson } from '../../composables/useHumanizedJson.js'
import { useJsonStore } from '../../stores/jsonStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'
import { useUiStore } from '../../stores/uiStore.js'

const jsonStore = useJsonStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()
const { viewMode } = storeToRefs(uiStore)

const { tree, filteredTree, totalFields, visibleFields } = useHumanizedJson()

const hasResult = computed(() => !!tree.value && jsonStore.parsedValue !== undefined)

/** Suggest table mode when the data clearly is tabular. */
const tableRecommended = computed(() => {
  function check(node, depth = 0) {
    if (!node || depth > 2) return false
    if (node.kind === 'array' && node.tableRecommended) return true
    return (node.children || []).some((child) => check(child, depth + 1))
  }
  return check(tree.value)
})

const density = computed(() => settingsStore.settings.density)
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col" aria-label="Human-readable view">
    <div
      class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
    >
      <ViewModeSelector v-model="viewMode" :table-available="tableRecommended" />
      <div class="ml-auto flex items-center gap-1.5">
        <SearchBar :match-count="visibleFields" :total-count="totalFields" />
        <ExportMenu
          :tree="filteredTree"
          :raw-value="jsonStore.parsedValue"
          :indent-size="settingsStore.settings.indentSize"
        />
      </div>
    </div>

    <div
      class="min-h-0 flex-1 overflow-y-auto bg-slate-100/60 p-4 dark:bg-slate-950"
      :class="density === 'compact' ? 'text-[0.95em] leading-snug' : ''"
    >
      <div
        v-if="!hasResult"
        class="flex h-full flex-col items-center justify-center gap-3 text-center"
      >
        <div
          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
        >
          <Sparkles class="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Your readable view will appear here
          </p>
          <p class="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
            Paste JSON on the left — or load a sample — and it will be turned into something anyone
            can understand.
          </p>
        </div>
      </div>

      <div
        v-else-if="!filteredTree"
        class="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400"
      >
        No fields match the current search or filters.
      </div>

      <template v-else>
        <DocumentView v-if="viewMode === 'document'" :tree="filteredTree" />
        <CardsView v-else-if="viewMode === 'cards'" :tree="filteredTree" />
        <TableView v-else-if="viewMode === 'table'" :tree="filteredTree" />
        <TreeView v-else-if="viewMode === 'tree'" :tree="filteredTree" />
        <RawView v-else :value="jsonStore.parsedValue" />
      </template>
    </div>
  </section>
</template>
