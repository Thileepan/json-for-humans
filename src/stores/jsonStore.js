import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { parseJson, WARN_INPUT_BYTES } from '../core/parser/parseJson.js'
import { samples } from '../samples/index.js'

const PARSE_DEBOUNCE_MS = 250

export const useJsonStore = defineStore('json', () => {
  const rawText = ref('')
  const fileName = ref('')
  const fileSize = ref(0)
  const selectedSampleId = ref('')

  // Parse results are large and immutable — keep them shallow.
  const parseResult = shallowRef(parseJson(''))

  let debounceTimer = null

  function runParse() {
    parseResult.value = parseJson(rawText.value)
  }

  function setText(text, { immediate = false, source = 'edit' } = {}) {
    rawText.value = text
    if (source !== 'file') {
      fileName.value = ''
      fileSize.value = 0
    }
    if (source !== 'sample') selectedSampleId.value = ''
    if (debounceTimer) clearTimeout(debounceTimer)
    if (immediate) {
      runParse()
    } else {
      debounceTimer = setTimeout(runParse, PARSE_DEBOUNCE_MS)
    }
  }

  function loadSample(id) {
    const sample = samples.find((entry) => entry.id === id)
    if (!sample) return
    setText(sample.text, { immediate: true, source: 'sample' })
    selectedSampleId.value = id
  }

  function loadFile(name, size, text) {
    setText(text, { immediate: true, source: 'file' })
    fileName.value = name
    fileSize.value = size
  }

  function clear() {
    setText('', { immediate: true })
  }

  function formatDocument(indentSize = 2) {
    if (!parseResult.value.ok) return
    setText(JSON.stringify(parseResult.value.value, null, indentSize), { immediate: true })
  }

  function minify() {
    if (!parseResult.value.ok) return
    setText(JSON.stringify(parseResult.value.value), { immediate: true })
  }

  /** Applies a suggested repair. The user triggers this explicitly. */
  function applySuggestion() {
    const suggestion = parseResult.value.suggestion
    if (suggestion) setText(suggestion.text, { immediate: true })
  }

  const parsedValue = computed(() => (parseResult.value.ok ? parseResult.value.value : undefined))
  const error = computed(() => parseResult.value.error)
  const suggestion = computed(() => parseResult.value.suggestion)
  const warnings = computed(() => parseResult.value.warnings || [])
  const isEmpty = computed(() => rawText.value.trim() === '')
  const byteSize = computed(() => new TextEncoder().encode(rawText.value).length)
  const isLarge = computed(() => byteSize.value > WARN_INPUT_BYTES)

  return {
    rawText,
    fileName,
    fileSize,
    selectedSampleId,
    parseResult,
    parsedValue,
    error,
    suggestion,
    warnings,
    isEmpty,
    byteSize,
    isLarge,
    setText,
    loadSample,
    loadFile,
    clear,
    formatDocument,
    minify,
    applySuggestion,
  }
})
