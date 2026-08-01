<script setup>
import { computed } from 'vue'
import DocNode from './DocNode.vue'
import { formatKey } from '../../core/formatter/formatKey.js'

/**
 * Report-style layout for non-technical readers. Derives a friendly
 * document title from an id-like field when one exists at the top level
 * (e.g. order_id: 123 -> "Order #123").
 */
const props = defineProps({
  tree: { type: Object, required: true },
})

const title = computed(() => {
  if (props.tree.kind !== 'object') return null
  const idField = (props.tree.children || []).find(
    (child) =>
      child.kind === 'field' &&
      /(^|_)id$/i.test(String(child.key || '')) &&
      ['id', 'number'].includes(child.detectedType)
  )
  if (!idField) return null
  const base = String(idField.key).replace(/_?id$/i, '')
  return `${base ? formatKey(base) : 'Record'} #${idField.rawValue}`
})

const body = computed(() => {
  if (!title.value) return props.tree
  // The id field is promoted into the title; keep it out of the body.
  const promotedKey = (props.tree.children || []).find((child) =>
    /(^|_)id$/i.test(String(child.key || ''))
  )?.key
  return {
    ...props.tree,
    children: props.tree.children.filter((child) => child.key !== promotedKey),
  }
})
</script>

<template>
  <article
    class="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:px-8"
  >
    <h2
      v-if="title"
      class="mb-5 border-b border-slate-200 pb-3 text-xl font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100"
    >
      {{ title }}
    </h2>
    <div class="space-y-3">
      <DocNode :node="body" :depth="0" />
    </div>
  </article>
</template>
