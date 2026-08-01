<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorView } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import { oneDark } from '@codemirror/theme-one-dark'
import { parseJson } from '../../core/parser/parseJson.js'
import { isDark } from '../../composables/useTheme.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  ariaLabel: { type: String, default: 'JSON editor' },
})

const emit = defineEmits(['update:modelValue'])

const host = ref(null)
let view = null
const themeCompartment = new Compartment()

const baseTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' },
  '&.cm-focused': { outline: 'none' },
})

function jsonLinter(editorView) {
  const text = editorView.state.doc.toString()
  if (text.trim() === '') return []
  const result = parseJson(text)
  if (result.ok || !result.error) return []

  let from = 0
  let to = text.length
  if (result.error.line) {
    try {
      const line = editorView.state.doc.line(
        Math.min(result.error.line, editorView.state.doc.lines)
      )
      from = Math.min(line.from + Math.max((result.error.column || 1) - 1, 0), line.to)
      to = Math.min(from + 1, text.length)
    } catch {
      from = 0
      to = 0
    }
  }
  return [{ from, to, severity: 'error', message: result.error.message }]
}

function themeExtension(dark) {
  return dark ? oneDark : []
}

onMounted(() => {
  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        json(),
        linter(jsonLinter, { delay: 400 }),
        lintGutter(),
        baseTheme,
        themeCompartment.of(themeExtension(isDark.value)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
        EditorView.contentAttributes.of({ 'aria-label': props.ariaLabel }),
      ],
    }),
  })
})

watch(
  () => props.modelValue,
  (value) => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
    }
  }
)

watch(isDark, (dark) => {
  view?.dispatch({ effects: themeCompartment.reconfigure(themeExtension(dark)) })
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})
</script>

<template>
  <div ref="host" class="h-full min-h-0 overflow-hidden text-left"></div>
</template>
