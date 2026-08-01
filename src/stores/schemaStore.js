import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { parseJson } from '../core/parser/parseJson.js'
import { validateSchema } from '../core/schema/validateSchema.js'
import { EXAMPLE_SCHEMA } from '../core/schema/applySchema.js'

export const useSchemaStore = defineStore('schema', () => {
  const schemaText = ref('')
  const enabled = ref(true)
  const parsedSchema = shallowRef(null)
  const errors = ref([])

  function setText(text) {
    schemaText.value = text
    validate()
  }

  function validate() {
    errors.value = []
    parsedSchema.value = null
    if (schemaText.value.trim() === '') return

    const parsed = parseJson(schemaText.value)
    if (!parsed.ok) {
      errors.value = [
        `Schema is not valid JSON: ${parsed.error?.message || 'unknown error'}` +
          (parsed.error?.line ? ` (line ${parsed.error.line})` : ''),
      ]
      return
    }
    const result = validateSchema(parsed.value)
    if (!result.valid) {
      errors.value = result.errors
      return
    }
    parsedSchema.value = parsed.value
  }

  function loadExample() {
    setText(JSON.stringify(EXAMPLE_SCHEMA, null, 2))
  }

  function reset() {
    schemaText.value = ''
    parsedSchema.value = null
    errors.value = []
  }

  const isValid = computed(() => errors.value.length === 0)
  const activeSchema = computed(() =>
    enabled.value && parsedSchema.value ? parsedSchema.value : null
  )
  const exportText = computed(() =>
    parsedSchema.value ? JSON.stringify(parsedSchema.value, null, 2) : schemaText.value
  )

  return {
    schemaText,
    enabled,
    parsedSchema,
    errors,
    isValid,
    activeSchema,
    exportText,
    setText,
    validate,
    loadExample,
    reset,
  }
})
