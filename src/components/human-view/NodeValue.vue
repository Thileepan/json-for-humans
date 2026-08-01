<script setup>
import { computed } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { safeHref } from '../../core/detector/detectLink.js'
import { useClipboard } from '../../composables/useClipboard.js'

/**
 * Renders a single field value. All content is rendered as text nodes
 * (never v-html); links only get an href after safeHref validation.
 */
const props = defineProps({
  node: { type: Object, required: true },
})

const { copied, copy } = useClipboard()

const href = computed(() => (props.node.meta?.href ? safeHref(props.node.meta.href) : null))
const isMuted = computed(() => ['null', 'empty'].includes(props.node.detectedType))
</script>

<template>
  <span class="inline-flex max-w-full items-center gap-1.5 break-words align-top">
    <span
      v-if="node.meta?.color"
      class="inline-block h-3.5 w-3.5 shrink-0 rounded border border-slate-300 dark:border-slate-600"
      :style="{ backgroundColor: node.meta.color }"
      :aria-label="`Color preview for ${node.displayValue}`"
      role="img"
    ></span>
    <a
      v-if="href"
      :href="href"
      target="_blank"
      rel="noopener noreferrer"
      class="break-all text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700 dark:text-brand-400"
      >{{ node.displayValue }}</a
    >
    <span
      v-else
      class="min-w-0 break-words"
      :class="{
        'font-mono text-[0.9em]': node.meta?.monospace,
        'italic text-slate-400 dark:text-slate-500': isMuted,
      }"
      >{{ node.displayValue }}</span
    >
    <button
      v-if="node.meta?.isId"
      type="button"
      class="shrink-0 rounded p-0.5 text-slate-400 opacity-70 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:hover:bg-slate-700"
      :aria-label="`Copy ${node.label || 'identifier'}`"
      @click="copy(String(node.rawValue ?? node.displayValue))"
    >
      <Check v-if="copied" class="h-3 w-3 text-brand-500" aria-hidden="true" />
      <Copy v-else class="h-3 w-3" aria-hidden="true" />
    </button>
  </span>
</template>
