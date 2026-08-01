<script setup>
import { computed } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { tokenizeJson } from '../../utils/tokenizeJson.js'
import { useSettingsStore } from '../../stores/settingsStore.js'
import { useClipboard } from '../../composables/useClipboard.js'

/**
 * Syntax-highlighted, formatted JSON. Tokens are rendered as text inside
 * styled spans — no HTML is generated from the JSON content.
 */
const props = defineProps({
  value: { required: true, validator: () => true },
})

const settingsStore = useSettingsStore()
const { copied, copy } = useClipboard()

const formatted = computed(() =>
  JSON.stringify(props.value, null, settingsStore.settings.indentSize)
)

const MAX_HIGHLIGHT_CHARS = 400_000
const tokens = computed(() => {
  if (formatted.value.length > MAX_HIGHLIGHT_CHARS) return null
  return tokenizeJson(formatted.value)
})

const tokenClasses = {
  key: 'text-brand-700 dark:text-brand-300',
  string: 'text-amber-700 dark:text-amber-300',
  number: 'text-sky-700 dark:text-sky-300',
  boolean: 'text-purple-700 dark:text-purple-300',
  null: 'text-slate-400 italic',
  punctuation: 'text-slate-500 dark:text-slate-400',
  whitespace: '',
}
</script>

<template>
  <div
    class="relative rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
  >
    <button
      type="button"
      class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      @click="copy(formatted)"
    >
      <Check v-if="copied" class="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
      <Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
      {{ copied ? 'Copied' : 'Copy' }}
    </button>
    <pre
      class="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-100"
    ><template v-if="tokens"><span
        v-for="(token, index) in tokens"
        :key="index"
        :class="tokenClasses[token.type]"
      >{{ token.value }}</span></template><template v-else>{{ formatted }}</template></pre>
  </div>
</template>
