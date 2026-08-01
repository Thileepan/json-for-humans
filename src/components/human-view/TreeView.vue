<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next'
import TreeNode from './TreeNode.vue'
import { useUiStore } from '../../stores/uiStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'
import { formatKey } from '../../core/formatter/formatKey.js'

defineProps({
  tree: { type: Object, required: true },
})

const uiStore = useUiStore()
const settingsStore = useSettingsStore()
const { expandEpoch, expandMode } = storeToRefs(uiStore)

const selectedPath = ref('')

const defaultDepth = computed(() =>
  settingsStore.settings.autoExpand ? settingsStore.settings.maxInitialDepth : 0
)

/** Breadcrumb segments for the selected node's path. */
const breadcrumbs = computed(() => {
  if (!selectedPath.value) return []
  const segments = []
  const re = /([^.[\]]+)|\[(\d+)\]/g
  let match
  while ((match = re.exec(selectedPath.value)) !== null) {
    if (match[1] !== undefined) segments.push(formatKey(match[1]))
    else segments.push(`Item ${Number(match[2]) + 1}`)
  }
  return segments
})
</script>

<template>
  <div
    class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
  >
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        @click="uiStore.expandAll()"
      >
        <ChevronsUpDown class="h-3.5 w-3.5" aria-hidden="true" /> Expand all
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        @click="uiStore.collapseAll()"
      >
        <ChevronsDownUp class="h-3.5 w-3.5" aria-hidden="true" /> Collapse all
      </button>
      <nav
        v-if="breadcrumbs.length"
        aria-label="Selected field path"
        class="ml-auto min-w-0 truncate text-xs text-slate-500 dark:text-slate-400"
      >
        <span v-for="(crumb, index) in breadcrumbs" :key="index">
          <span v-if="index > 0" aria-hidden="true"> › </span>{{ crumb }}
        </span>
      </nav>
    </div>
    <ul class="space-y-0.5">
      <TreeNode
        :node="tree"
        :depth="0"
        :default-depth="defaultDepth"
        :expand-epoch="expandEpoch"
        :expand-mode="expandMode"
        @select="selectedPath = $event"
      />
    </ul>
  </div>
</template>
