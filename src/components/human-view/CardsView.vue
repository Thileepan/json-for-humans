<script setup>
import { computed } from 'vue'
import CardNode from './CardNode.vue'

const props = defineProps({
  tree: { type: Object, required: true },
})

/**
 * Top-level layout: the root's primitive fields form an "Overview" card,
 * and each nested container becomes its own card.
 */
const sections = computed(() => {
  const root = props.tree
  if (root.kind === 'field') {
    return [{ ...root, kind: 'object', label: 'Value', children: [root], synthetic: true }]
  }
  if (root.kind === 'array') return [root]

  const fields = (root.children || []).filter((child) => child.kind === 'field')
  const containers = (root.children || []).filter((child) => child.kind !== 'field')
  const result = []
  if (fields.length) {
    result.push({ kind: 'object', label: 'Overview', path: '', children: fields, isEmpty: false })
  }
  return [...result, ...containers]
})
</script>

<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <CardNode
      v-for="section in sections"
      :key="section.path || section.label"
      :node="section"
      :depth="0"
      :class="section.label === 'Overview' || sections.length === 1 ? 'xl:col-span-2' : ''"
    />
  </div>
</template>
