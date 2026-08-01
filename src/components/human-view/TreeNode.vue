<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import NodeValue from './NodeValue.vue'

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  defaultDepth: { type: Number, default: 3 },
  expandEpoch: { type: Number, default: 0 },
  expandMode: { type: String, default: 'default' },
})

const emit = defineEmits(['select'])

const PAGE_SIZE = 100
const limit = ref(PAGE_SIZE)

const expanded = ref(props.depth < props.defaultDepth)

watch(
  () => props.expandEpoch,
  () => {
    if (props.expandMode === 'expand-all') expanded.value = true
    else if (props.expandMode === 'collapse-all') expanded.value = false
  }
)

const isContainer = computed(() => props.node.kind !== 'field')
const visibleChildren = computed(() => (props.node.children || []).slice(0, limit.value))
const remaining = computed(() => Math.max((props.node.children || []).length - limit.value, 0))

const summary = computed(() => {
  if (props.node.kind === 'array') {
    return `${props.node.itemCount} ${props.node.itemCount === 1 ? 'item' : 'items'}`
  }
  if (props.node.kind === 'object') {
    return `${props.node.entryCount} ${props.node.entryCount === 1 ? 'field' : 'fields'}`
  }
  return ''
})
</script>

<template>
  <li>
    <div
      v-if="isContainer"
      class="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <button
        type="button"
        class="flex items-center gap-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        :aria-expanded="expanded"
        :aria-label="`${expanded ? 'Collapse' : 'Expand'} ${node.label || 'section'}`"
        @click="((expanded = !expanded), emit('select', node.path))"
      >
        <ChevronRight
          class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform motion-reduce:transition-none"
          :class="expanded ? 'rotate-90' : ''"
          aria-hidden="true"
        />
        <span class="text-sm font-medium text-slate-700 dark:text-slate-200">
          {{ node.label || 'Root' }}
        </span>
        <span class="text-xs text-slate-400">{{ summary }}</span>
      </button>
      <span v-if="node.isEmpty" class="text-xs italic text-slate-400">
        {{ node.displayValue }}
      </span>
    </div>

    <button
      v-else
      type="button"
      class="flex w-full items-baseline gap-2 rounded px-1 py-0.5 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:hover:bg-slate-800/60"
      @click="emit('select', node.path)"
    >
      <span v-if="node.label" class="shrink-0 text-sm text-slate-500 dark:text-slate-400">
        {{ node.label }}:
      </span>
      <span class="min-w-0 text-sm text-slate-800 dark:text-slate-100">
        <NodeValue :node="node" />
      </span>
    </button>

    <ul
      v-if="isContainer && expanded && !node.isEmpty"
      class="ml-2 border-l border-slate-200 pl-3 dark:border-slate-700"
    >
      <TreeNode
        v-for="child in visibleChildren"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :default-depth="defaultDepth"
        :expand-epoch="expandEpoch"
        :expand-mode="expandMode"
        @select="emit('select', $event)"
      />
      <li v-if="remaining > 0">
        <button
          type="button"
          class="my-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          @click="limit += PAGE_SIZE"
        >
          Show more ({{ remaining }} remaining)
        </button>
      </li>
    </ul>
  </li>
</template>
