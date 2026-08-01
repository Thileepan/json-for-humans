import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { parseJson } from '../core/parser/parseJson.js'
import { compareJson } from '../core/comparator/compareJson.js'
import { describeChanges } from '../core/comparator/describeChanges.js'
import { comparisonSample } from '../samples/index.js'
import { useSettingsStore } from './settingsStore.js'

export const useComparisonStore = defineStore('comparison', () => {
  const leftText = ref('')
  const rightText = ref('')
  const showUnchanged = ref(false)

  const leftParse = computed(() => parseJson(leftText.value))
  const rightParse = computed(() => parseJson(rightText.value))

  const ready = computed(() => leftParse.value.ok && rightParse.value.ok)

  const result = computed(() => {
    if (!ready.value) return null
    return compareJson(leftParse.value.value, rightParse.value.value)
  })

  const visibleChanges = computed(() => {
    if (!result.value) return []
    return result.value.changes.filter(
      (change) => showUnchanged.value || change.type !== 'unchanged'
    )
  })

  const sentences = computed(() => {
    if (!result.value) return []
    const settingsStore = useSettingsStore()
    return describeChanges(
      result.value.changes.filter((change) => change.type !== 'unchanged'),
      settingsStore.humanizeOptions
    )
  })

  function loadSample() {
    leftText.value = comparisonSample.left
    rightText.value = comparisonSample.right
  }

  function clear() {
    leftText.value = ''
    rightText.value = ''
  }

  return {
    leftText,
    rightText,
    showUnchanged,
    leftParse,
    rightParse,
    ready,
    result,
    visibleChanges,
    sentences,
    loadSample,
    clear,
  }
})
