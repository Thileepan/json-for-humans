<script setup>
import AppTooltip from '../common/AppTooltip.vue'
import { FileText, LayoutGrid, ListTree, Braces, Table2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, required: true },
  tableAvailable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const modes = [
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'cards', label: 'Cards', icon: LayoutGrid },
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'tree', label: 'Tree', icon: ListTree },
  { id: 'raw', label: 'Raw', icon: Braces },
]

function select(id) {
  if (id !== props.modelValue) emit('update:modelValue', id)
}

function onKeydown(event, index) {
  let target = null
  if (event.key === 'ArrowRight') target = modes[(index + 1) % modes.length]
  if (event.key === 'ArrowLeft') target = modes[(index - 1 + modes.length) % modes.length]
  if (target) {
    event.preventDefault()
    select(target.id)
  }
}
</script>

<template>
  <div
    role="tablist"
    aria-label="Display mode"
    class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
  >
    <button
      v-for="(mode, index) in modes"
      :key="mode.id"
      role="tab"
      type="button"
      :aria-selected="modelValue === mode.id"
      :tabindex="modelValue === mode.id ? 0 : -1"
      class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
      :class="
        modelValue === mode.id
          ? 'bg-brand-500 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
      "
      @click="select(mode.id)"
      @keydown="onKeydown($event, index)"
    >
      <component :is="mode.icon" class="h-3.5 w-3.5" aria-hidden="true" />
      <span class="hidden sm:inline">{{ mode.label }}</span>
      <AppTooltip
        v-if="mode.id === 'table' && tableAvailable && modelValue !== 'table'"
        content="This data looks tabular — Table view will probably read best."
        class="ml-0.5"
      >
        <span class="inline-block h-1.5 w-1.5 rounded-full bg-brand-400"></span>
        <span class="sr-only">Table view recommended for this data</span>
      </AppTooltip>
    </button>
  </div>
</template>
