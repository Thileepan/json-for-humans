<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Download, Upload } from 'lucide-vue-next'
import BaseModal from '../common/BaseModal.vue'
import JsonEditor from '../editor/JsonEditor.vue'
import { useSchemaStore } from '../../stores/schemaStore.js'
import { useUiStore } from '../../stores/uiStore.js'

const schemaStore = useSchemaStore()
const uiStore = useUiStore()
const { schemaText, errors, enabled } = storeToRefs(schemaStore)

const open = computed(() => uiStore.schemaOpen)
const fileInput = ref(null)

function onImport(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => schemaStore.setText(String(reader.result))
  reader.readAsText(file)
  event.target.value = ''
}

function onExport() {
  const blob = new Blob([schemaStore.exportText], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'json-for-humans-schema.json'
  link.click()
  URL.revokeObjectURL(url)
}

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
</script>

<template>
  <BaseModal :open="open" title="Custom schema" wide @close="uiStore.schemaOpen = false">
    <p class="mb-3 text-xs text-slate-500 dark:text-slate-400">
      Define labels, types, enum value mappings and currencies per field. Paths support nesting
      (<code class="font-mono">customer.address.city</code>) and arrays (<code class="font-mono"
        >orders[].amount</code
      >). Schema settings override automatic detection.
    </p>

    <div class="mb-3 flex flex-wrap items-center gap-2">
      <button type="button" :class="buttonClass" @click="schemaStore.loadExample()">
        Load example
      </button>
      <button type="button" :class="buttonClass" @click="fileInput?.click()">
        <Upload class="h-3.5 w-3.5" aria-hidden="true" /> Import
      </button>
      <input
        ref="fileInput"
        type="file"
        accept=".json,application/json"
        class="sr-only"
        aria-label="Import schema file"
        @change="onImport"
      />
      <button type="button" :class="buttonClass" :disabled="!schemaText" @click="onExport">
        <Download class="h-3.5 w-3.5" aria-hidden="true" /> Export
      </button>
      <button type="button" :class="buttonClass" @click="schemaStore.reset()">Reset</button>
      <label class="ml-auto flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
        <input v-model="enabled" type="checkbox" class="accent-brand-500" />
        Apply schema
      </label>
    </div>

    <div class="h-64 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
      <JsonEditor
        :model-value="schemaText"
        aria-label="Schema editor"
        @update:model-value="schemaStore.setText($event)"
      />
    </div>

    <div
      v-if="errors.length"
      role="alert"
      class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
    >
      <p v-for="error in errors" :key="error">{{ error }}</p>
    </div>
    <p
      v-else-if="schemaText.trim()"
      class="mt-3 text-xs text-brand-600 dark:text-brand-400"
      aria-live="polite"
    >
      Schema is valid and will be applied to the output.
    </p>
  </BaseModal>
</template>
