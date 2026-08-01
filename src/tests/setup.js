/**
 * Vitest setup: jsdom lacks a few APIs that CodeMirror 6 and the theme
 * composable rely on.
 */

// matchMedia (used by useTheme)
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

// Range/measurement APIs (used by CodeMirror)
const rect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 }

if (typeof Range !== 'undefined') {
  Range.prototype.getClientRects = function () {
    const list = []
    list.item = () => null
    return list
  }
  Range.prototype.getBoundingClientRect = () => ({ ...rect })
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

if (!document.elementFromPoint) {
  document.elementFromPoint = () => null
}

// CodeMirror measures text via canvas-less DOM APIs; provide harmless stubs.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback) => setTimeout(callback, 0)
}

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock'
  URL.revokeObjectURL = () => {}
}
