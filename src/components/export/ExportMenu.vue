<script setup>
import { computed, ref } from 'vue'
import { Check, Copy, Download, Printer } from 'lucide-vue-next'
import { useExport } from '../../composables/useExport.js'
import { useClipboard } from '../../composables/useClipboard.js'

const props = defineProps({
  tree: { type: Object, default: null },
  rawValue: { required: false, default: undefined, validator: () => true },
  indentSize: { type: Number, default: 2 },
})

const open = ref(false)
const exporter = useExport()
const { copied, copy } = useClipboard()

const hasCsv = computed(() => {
  function findTable(node) {
    if (!node) return false
    if (node.kind === 'array' && node.itemsAreObjects) return true
    return (node.children || []).some(findTable)
  }
  return findTable(props.tree)
})

function findFirstTable(node) {
  if (!node) return null
  if (node.kind === 'array' && node.itemsAreObjects) return node
  for (const child of node.children || []) {
    const found = findFirstTable(child)
    if (found) return found
  }
  return null
}

const itemClass =
  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700'

function run(action) {
  action()
  open.value = false
}
</script>

<template>
  <div class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      :aria-expanded="open"
      aria-haspopup="true"
      :disabled="!tree"
      @click="open = !open"
    >
      <Download class="h-3.5 w-3.5" aria-hidden="true" /> Export
    </button>
    <div
      v-if="open && tree"
      class="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
      role="menu"
    >
      <p
        class="px-2 pb-1 pt-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400"
      >
        Copy
      </p>
      <button
        type="button"
        :class="itemClass"
        role="menuitem"
        @click="run(() => copy(exporter.asPlainText(tree)))"
      >
        <Check v-if="copied" class="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
        <Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
        Copy as plain text
      </button>
      <button
        type="button"
        :class="itemClass"
        role="menuitem"
        @click="run(() => copy(exporter.asMarkdown(tree)))"
      >
        <Copy class="h-3.5 w-3.5" aria-hidden="true" /> Copy as Markdown
      </button>
      <p class="px-2 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
        Download
      </p>
      <button
        type="button"
        :class="itemClass"
        role="menuitem"
        @click="run(() => exporter.exportPlainText(tree))"
      >
        <Download class="h-3.5 w-3.5" aria-hidden="true" /> Plain text (.txt)
      </button>
      <button
        type="button"
        :class="itemClass"
        role="menuitem"
        @click="run(() => exporter.exportMarkdown(tree))"
      >
        <Download class="h-3.5 w-3.5" aria-hidden="true" /> Markdown (.md)
      </button>
      <button
        type="button"
        :class="itemClass"
        role="menuitem"
        @click="run(() => exporter.exportHtml(tree))"
      >
        <Download class="h-3.5 w-3.5" aria-hidden="true" /> HTML (.html)
      </button>
      <button
        type="button"
        :class="itemClass"
        role="menuitem"
        @click="run(() => exporter.exportJson(rawValue, indentSize))"
      >
        <Download class="h-3.5 w-3.5" aria-hidden="true" /> Formatted JSON (.json)
      </button>
      <button
        v-if="hasCsv"
        type="button"
        :class="itemClass"
        role="menuitem"
        @click="run(() => exporter.exportCsv(findFirstTable(tree)))"
      >
        <Download class="h-3.5 w-3.5" aria-hidden="true" /> CSV (.csv)
      </button>
      <button
        type="button"
        :class="itemClass"
        role="menuitem"
        @click="run(() => exporter.printPage())"
      >
        <Printer class="h-3.5 w-3.5" aria-hidden="true" /> Print
      </button>
    </div>
  </div>
</template>
