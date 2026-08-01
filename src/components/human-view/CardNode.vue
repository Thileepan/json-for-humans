<script setup>
import { computed, ref } from 'vue'
import NodeValue from './NodeValue.vue'

/**
 * Recursive renderer for the Cards view. Containers become cards at the
 * top levels and inline sections when deeply nested.
 */
const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
})

const PAGE_SIZE = 30
const limit = ref(PAGE_SIZE)

const fields = computed(() => (props.node.children || []).filter((child) => child.kind === 'field'))
const containers = computed(() =>
  (props.node.children || []).filter((child) => child.kind !== 'field').slice(0, limit.value)
)
const remaining = computed(() =>
  Math.max(
    (props.node.children || []).filter((child) => child.kind !== 'field').length - limit.value,
    0
  )
)

const asCard = computed(() => props.depth <= 1)
</script>

<template>
  <div
    :class="
      asCard
        ? 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'
        : 'border-l-2 border-slate-100 pl-3 dark:border-slate-700'
    "
  >
    <h3 v-if="node.label" class="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
      {{ node.label }}
      <span v-if="node.kind === 'array'" class="ml-1 text-xs font-normal text-slate-400">
        {{ node.itemCount }} {{ node.itemCount === 1 ? 'item' : 'items' }}
      </span>
    </h3>

    <p v-if="node.isEmpty" class="text-sm italic text-slate-400 dark:text-slate-500">
      {{ node.displayValue }}
    </p>

    <ul v-else-if="node.kind === 'array' && node.isPrimitiveList" class="space-y-1">
      <li
        v-for="child in node.children"
        :key="child.path"
        class="flex items-baseline gap-2 text-sm text-slate-800 dark:text-slate-100"
      >
        <span class="select-none text-brand-400" aria-hidden="true">•</span>
        <NodeValue :node="child" />
      </li>
    </ul>

    <template v-else>
      <dl v-if="fields.length" class="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        <div v-for="field in fields" :key="field.path" class="min-w-0">
          <dt
            class="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500"
          >
            {{ field.label }}
          </dt>
          <dd class="mt-0.5 text-sm text-slate-800 dark:text-slate-100">
            <NodeValue :node="field" />
          </dd>
        </div>
      </dl>

      <div v-if="containers.length" class="mt-3 space-y-3">
        <CardNode v-for="child in containers" :key="child.path" :node="child" :depth="depth + 1" />
      </div>

      <button
        v-if="remaining > 0"
        type="button"
        class="mt-2 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        @click="limit += PAGE_SIZE"
      >
        Show more ({{ remaining }} remaining)
      </button>
    </template>
  </div>
</template>
