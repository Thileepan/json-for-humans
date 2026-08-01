<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { AlignLeft, Check, ClipboardPaste, Copy, Eraser, Minimize2, Upload } from 'lucide-vue-next'
import JsonEditor from './JsonEditor.vue'
import { useJsonStore } from '../../stores/jsonStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'
import { useClipboard } from '../../composables/useClipboard.js'
import { useFileUpload } from '../../composables/useFileUpload.js'
import { samples } from '../../samples/index.js'

const jsonStore = useJsonStore()
const settingsStore = useSettingsStore()
const { rawText, error, suggestion, warnings, isEmpty, byteSize, isLarge, fileName } =
  storeToRefs(jsonStore)

const { copied, copy } = useClipboard()
const fileInput = ref(null)
const { isDragging, uploadError, onFileInput, onDragOver, onDragLeave, onDrop } = useFileUpload(
  (name, size, text) => jsonStore.loadFile(name, size, text)
)

const sizeLabel = computed(() => {
  const bytes = byteSize.value
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
})

function onEditorInput(text) {
  jsonStore.setText(text)
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) jsonStore.setText(text, { immediate: true })
  } catch {
    // Clipboard read denied — the user can paste directly into the editor.
  }
}

function onSampleChange(event) {
  if (event.target.value) jsonStore.loadSample(event.target.value)
  event.target.value = ''
}

const toolButton =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
</script>

<template>
  <section
    class="relative flex min-h-0 flex-1 flex-col"
    aria-label="JSON input"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div
      class="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
    >
      <button type="button" :class="toolButton" @click="pasteFromClipboard">
        <ClipboardPaste class="h-3.5 w-3.5" aria-hidden="true" /> Paste
      </button>
      <button type="button" :class="toolButton" @click="fileInput?.click()">
        <Upload class="h-3.5 w-3.5" aria-hidden="true" /> Upload
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        class="sr-only"
        aria-label="Upload a JSON file"
        @change="onFileInput"
      />
      <label class="sr-only" for="sample-select">Load sample JSON</label>
      <select
        id="sample-select"
        :class="toolButton"
        class="appearance-none pr-6"
        @change="onSampleChange"
      >
        <option value="">Samples…</option>
        <option v-for="sample in samples" :key="sample.id" :value="sample.id">
          {{ sample.name }}
        </option>
      </select>
      <span
        class="mx-1 hidden h-4 w-px bg-slate-300 dark:bg-slate-600 sm:block"
        aria-hidden="true"
      ></span>
      <button
        type="button"
        :class="toolButton"
        :disabled="!!error || isEmpty"
        @click="jsonStore.formatDocument(settingsStore.settings.indentSize)"
      >
        <AlignLeft class="h-3.5 w-3.5" aria-hidden="true" /> Format
      </button>
      <button
        type="button"
        :class="toolButton"
        :disabled="!!error || isEmpty"
        @click="jsonStore.minify()"
      >
        <Minimize2 class="h-3.5 w-3.5" aria-hidden="true" /> Minify
      </button>
      <button type="button" :class="toolButton" :disabled="isEmpty" @click="copy(rawText)">
        <Check v-if="copied" class="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
        <Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
      <button type="button" :class="toolButton" :disabled="isEmpty" @click="jsonStore.clear()">
        <Eraser class="h-3.5 w-3.5" aria-hidden="true" /> Clear
      </button>
    </div>

    <div class="relative min-h-0 flex-1 bg-white dark:bg-slate-900">
      <JsonEditor
        :model-value="rawText"
        aria-label="JSON input editor"
        @update:model-value="onEditorInput"
      />
      <div
        v-if="isDragging"
        class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-brand-500 bg-brand-50/90 text-sm font-medium text-brand-700 dark:bg-slate-800/90 dark:text-brand-300"
      >
        Drop your .json file here
      </div>
      <div
        v-if="isEmpty && !isDragging"
        class="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
      >
        <p
          class="rounded-full bg-slate-100 px-4 py-1.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        >
          Paste JSON, drop a file, or pick a sample to get started
        </p>
      </div>
    </div>

    <div
      class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
    >
      <span>{{ sizeLabel }}</span>
      <span v-if="fileName" class="truncate">File: {{ fileName }}</span>
      <span v-if="isLarge" class="text-amber-600 dark:text-amber-400">
        Large input — rendering may be slower
      </span>
      <span v-if="!isEmpty && !error" class="ml-auto text-brand-600 dark:text-brand-400">
        Valid JSON
      </span>
    </div>

    <div
      v-if="uploadError"
      role="alert"
      class="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      {{ uploadError }}
    </div>

    <div
      v-if="error && !isEmpty"
      role="alert"
      class="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      <p class="font-medium">
        Invalid JSON: {{ error.message }}
        <template v-if="error.line"> (line {{ error.line }}, column {{ error.column }})</template>
      </p>
      <div v-if="suggestion" class="mt-1.5 flex items-center gap-2">
        <span>{{ suggestion.description }}</span>
        <button
          type="button"
          class="rounded border border-red-300 bg-white px-2 py-0.5 font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900 dark:text-red-200"
          @click="jsonStore.applySuggestion()"
        >
          Apply repair
        </button>
      </div>
    </div>

    <div
      v-if="warnings.length"
      class="border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
    >
      <p v-for="warning in warnings.slice(0, 3)" :key="warning">{{ warning }}</p>
    </div>
  </section>
</template>
