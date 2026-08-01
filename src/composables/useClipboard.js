import { ref } from 'vue'

/** Clipboard helper with transient "Copied!" feedback. */
export function useClipboard(resetAfterMs = 1500) {
  const copied = ref(false)

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, resetAfterMs)
      return true
    } catch {
      return false
    }
  }

  return { copied, copy }
}
