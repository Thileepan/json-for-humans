import { ref } from 'vue'

const ACCEPTED_TYPES = ['application/json', 'text/json', 'text/plain', '']
const MAX_FILE_BYTES = 20 * 1024 * 1024

/**
 * Reads .json files from an <input type=file> or drag-and-drop.
 * Files never leave the browser.
 */
export function useFileUpload(onLoaded) {
  const isDragging = ref(false)
  const uploadError = ref('')

  function readFile(file) {
    uploadError.value = ''
    if (!file) return

    const looksJson =
      file.name.toLowerCase().endsWith('.json') || ACCEPTED_TYPES.includes(file.type)
    if (!looksJson) {
      uploadError.value = `"${file.name}" does not look like a JSON file. Please choose a .json file.`
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      uploadError.value = `"${file.name}" is larger than 20 MB and cannot be loaded.`
      return
    }

    const reader = new FileReader()
    reader.onload = () => onLoaded(file.name, file.size, String(reader.result))
    reader.onerror = () => {
      uploadError.value = `Could not read "${file.name}".`
    }
    reader.readAsText(file)
  }

  function onFileInput(event) {
    readFile(event.target.files?.[0])
    event.target.value = ''
  }

  function onDragOver(event) {
    event.preventDefault()
    isDragging.value = true
  }

  function onDragLeave() {
    isDragging.value = false
  }

  function onDrop(event) {
    event.preventDefault()
    isDragging.value = false
    readFile(event.dataTransfer?.files?.[0])
  }

  return { isDragging, uploadError, readFile, onFileInput, onDragOver, onDragLeave, onDrop }
}
