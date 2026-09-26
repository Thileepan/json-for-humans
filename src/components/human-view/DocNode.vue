<script setup>
import { computed, ref } from 'vue'
import HighlightedText from './HighlightedText.vue'
import NodeValue from './NodeValue.vue'

/** Recursive section renderer for the Document view. */
const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
})

const PAGE_SIZE = 50
const limit = ref(PAGE_SIZE)

const visibleChildren = computed(() => (props.node.children || []).slice(0, limit.value))
const remaining = computed(() => Math.max((props.node.children || []).length - limit.value, 0))

const headingLevel = computed(() => Math.min(props.depth + 2, 6))
</script>

<template>
  <div v-if="node.kind === 'field'" class="doc-field">
    <p
      v-if="node.label"
      class="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500"
    >
      <HighlightedText :text="node.label" :node="node" />
    </p>
    <p class="mt-0.5 text-sm text-slate-800 dark:text-slate-100">
      <NodeValue :node="node" />
    </p>
  </div>

  <section v-else :aria-label="node.label || 'Section'">
    <component
      :is="`h${headingLevel}`"
      v-if="node.label"
      class="mb-2 mt-1 border-b border-slate-100 pb-1.5 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
      :class="depth <= 1 ? 'text-base' : 'text-sm'"
    >
      <HighlightedText :text="node.label" :node="node" />
      <span
        v-if="node.kind === 'array' && !node.isEmpty"
        class="ml-1 text-xs font-normal text-slate-400"
      >
        {{ node.itemCount }} {{ node.itemCount === 1 ? 'item' : 'items' }}
      </span>
    </component>

    <p v-if="node.isEmpty" class="text-sm italic text-slate-400 dark:text-slate-500">
      {{ node.displayValue }}
    </p>

    <ul v-else-if="node.kind === 'array' && node.isPrimitiveList" class="space-y-1 pl-1">
      <li
        v-for="child in visibleChildren"
        :key="child.path"
        class="flex items-baseline gap-2 text-sm text-slate-800 dark:text-slate-100"
      >
        <span class="select-none text-brand-400" aria-hidden="true">•</span>
        <NodeValue :node="child" />
      </li>
    </ul>

    <div
      v-else
      class="space-y-3"
      :class="depth > 0 ? 'border-l-2 border-slate-100 pl-4 dark:border-slate-700' : ''"
    >
      <DocNode
        v-for="child in visibleChildren"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
      />
    </div>

    <button
      v-if="remaining > 0"
      type="button"
      class="mt-2 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      @click="limit += PAGE_SIZE"
    >
      Show more ({{ remaining }} remaining)
    </button>
  </section>
</template>
