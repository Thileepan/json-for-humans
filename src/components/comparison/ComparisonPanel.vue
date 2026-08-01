<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Check, Copy, Download, MinusCircle, PencilLine, PlusCircle } from 'lucide-vue-next'
import JsonEditor from '../editor/JsonEditor.vue'
import { useComparisonStore } from '../../stores/comparisonStore.js'
import { useClipboard } from '../../composables/useClipboard.js'
import { formatKey } from '../../core/formatter/formatKey.js'

const comparisonStore = useComparisonStore()
const { leftText, rightText, showUnchanged, ready, result, visibleChanges, sentences } =
  storeToRefs(comparisonStore)

const { copied, copy } = useClipboard()
const activeTab = ref('summary') // 'summary' | 'tree'

const summaryText = computed(() => sentences.value.join('\n'))

function downloadSummary() {
  const blob = new Blob([summaryText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'json-comparison.txt'
  link.click()
  URL.revokeObjectURL(url)
}

const typeStyles = {
  added: 'text-brand-700 bg-brand-50 dark:text-brand-300 dark:bg-brand-900/30',
  removed: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/60',
  changed: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60',
  unchanged: 'text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/60',
}

const typeIcons = {
  added: PlusCircle,
  removed: MinusCircle,
  changed: PencilLine,
}

function pathLabel(path) {
  return String(path)
    .split('.')
    .map((segment) => {
      const match = segment.match(/^(.*)\[(\d+)\]$/)
      if (match) {
        return `${match[1] ? formatKey(match[1]) : 'Item'} › Item ${Number(match[2]) + 1}`
      }
      return formatKey(segment)
    })
    .join(' › ')
}

function shortValue(value) {
  if (value === undefined) return ''
  if (typeof value === 'object' && value !== null) {
    return Array.isArray(value) ? `[${value.length} items]` : '{…}'
  }
  return JSON.stringify(value)
}

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div
      class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
    >
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Compare two JSON documents
      </h2>
      <div class="ml-auto flex items-center gap-1.5">
        <button type="button" :class="buttonClass" @click="comparisonStore.loadSample()">
          Load sample
        </button>
        <button type="button" :class="buttonClass" @click="comparisonStore.clear()">Clear</button>
      </div>
    </div>

    <div class="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1">
      <div
        class="flex min-h-0 flex-col border-b border-slate-200 dark:border-slate-700 lg:border-b-0 lg:border-r"
      >
        <div class="grid min-h-0 flex-1 grid-cols-2">
          <div class="flex min-h-0 flex-col border-r border-slate-200 dark:border-slate-700">
            <p
              class="border-b border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              Before
            </p>
            <div class="min-h-0 flex-1">
              <JsonEditor v-model="leftText" aria-label="JSON before" />
            </div>
          </div>
          <div class="flex min-h-0 flex-col">
            <p
              class="border-b border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            >
              After
            </p>
            <div class="min-h-0 flex-1">
              <JsonEditor v-model="rightText" aria-label="JSON after" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex min-h-0 flex-col bg-slate-100/60 dark:bg-slate-950">
        <div
          class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
        >
          <div
            role="tablist"
            aria-label="Comparison result view"
            class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <button
              v-for="tab in ['summary', 'tree']"
              :key="tab"
              role="tab"
              type="button"
              :aria-selected="activeTab === tab"
              class="rounded-md px-2.5 py-1 text-xs font-medium capitalize"
              :class="
                activeTab === tab
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
              "
              @click="activeTab = tab"
            >
              {{ tab === 'summary' ? 'Summary' : 'Changes' }}
            </button>
          </div>
          <label class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input v-model="showUnchanged" type="checkbox" class="accent-brand-500" />
            Show unchanged
          </label>
          <div class="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              :class="buttonClass"
              :disabled="!sentences.length"
              @click="copy(summaryText)"
            >
              <Check v-if="copied" class="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
              <Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
              Copy
            </button>
            <button
              type="button"
              :class="buttonClass"
              :disabled="!sentences.length"
              @click="downloadSummary"
            >
              <Download class="h-3.5 w-3.5" aria-hidden="true" /> Export
            </button>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <p v-if="!ready" class="text-sm text-slate-500 dark:text-slate-400">
            Paste valid JSON on both sides to see a readable comparison. Nothing is uploaded — the
            comparison happens in your browser.
          </p>

          <template v-else-if="result">
            <p class="mb-3 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
              {{ result.counts.added }} added · {{ result.counts.removed }} removed ·
              {{ result.counts.changed }} changed · {{ result.counts.unchanged }} unchanged
            </p>

            <div v-if="activeTab === 'summary'" class="space-y-2">
              <p
                v-if="!sentences.length"
                class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                Both documents are identical.
              </p>
              <p
                v-for="(sentence, index) in sentences"
                :key="index"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {{ sentence }}
              </p>
            </div>

            <ul v-else class="space-y-1.5">
              <li
                v-for="change in visibleChanges"
                :key="change.type + change.path"
                class="rounded-lg px-3 py-2 text-xs"
                :class="typeStyles[change.type]"
              >
                <span class="flex items-center gap-1.5 font-medium">
                  <component
                    :is="typeIcons[change.type]"
                    v-if="typeIcons[change.type]"
                    class="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  {{ pathLabel(change.path) }}
                  <span class="font-normal opacity-70">({{ change.type }})</span>
                </span>
                <span v-if="change.type === 'changed'" class="mt-0.5 block font-mono">
                  {{ shortValue(change.before) }} → {{ shortValue(change.after) }}
                </span>
                <span v-else-if="change.type === 'added'" class="mt-0.5 block font-mono">
                  {{ shortValue(change.after) }}
                </span>
                <span v-else-if="change.type === 'removed'" class="mt-0.5 block font-mono">
                  {{ shortValue(change.before) }}
                </span>
              </li>
            </ul>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
