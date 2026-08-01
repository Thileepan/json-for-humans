<script setup>
import { onBeforeUnmount, ref } from 'vue'

/**
 * Resizable two-pane layout. Horizontal on desktop, stacked on small
 * screens. The divider is keyboard-accessible (arrow keys).
 */
const leftPercent = ref(46)
const container = ref(null)
let dragging = false

function clamp(value) {
  return Math.min(75, Math.max(25, value))
}

function onPointerDown(event) {
  dragging = true
  event.target.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event) {
  if (!dragging || !container.value) return
  const rect = container.value.getBoundingClientRect()
  leftPercent.value = clamp(((event.clientX - rect.left) / rect.width) * 100)
}

function onPointerUp() {
  dragging = false
}

function onKeydown(event) {
  if (event.key === 'ArrowLeft') leftPercent.value = clamp(leftPercent.value - 2)
  if (event.key === 'ArrowRight') leftPercent.value = clamp(leftPercent.value + 2)
}

onBeforeUnmount(() => {
  dragging = false
})
</script>

<template>
  <div
    ref="container"
    class="flex min-h-0 flex-1 flex-col lg:flex-row"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <div
      class="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-none"
      :style="{ '--left': leftPercent + '%' }"
      :class="'lg:w-[var(--left)]'"
    >
      <slot name="left" />
    </div>
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panels"
      tabindex="0"
      class="hidden w-1.5 shrink-0 cursor-col-resize bg-slate-200 transition-colors hover:bg-brand-400 focus-visible:bg-brand-500 focus-visible:outline-none dark:bg-slate-700 dark:hover:bg-brand-500 lg:block"
      @pointerdown="onPointerDown"
      @keydown="onKeydown"
    ></div>
    <div
      class="flex min-h-0 min-w-0 flex-1 flex-col border-t border-slate-200 dark:border-slate-700 lg:border-t-0"
    >
      <slot name="right" />
    </div>
  </div>
</template>
