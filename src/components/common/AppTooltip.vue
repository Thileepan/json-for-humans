<script setup>
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import { arrow, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'

/**
 * A tooltip, positioned by Floating UI and styled here rather than by the
 * library, so it follows the app's own palette and dark mode.
 *
 * Shows on hover after a short delay and on keyboard focus immediately;
 * Escape dismisses it. The bubble is teleported to the body so a toolbar or
 * a dropdown with its own overflow cannot clip it.
 *
 *   <AppTooltip content="Match case…"><button …/></AppTooltip>
 *
 * The content is a *description*, never the accessible name — it is wired up
 * with aria-describedby, so the trigger still needs its own label. Wrap a
 * non-focusable trigger with `focusable` to keep it reachable by keyboard.
 *
 * The template has exactly one root element, and must keep it: a second root
 * (even a comment) makes this a fragment component, and then a `class` passed
 * to <AppTooltip> has nowhere to land and the listeners stop reaching the
 * trigger. The teleport lives inside that root and still escapes clipping.
 */
const props = defineProps({
  content: { type: String, default: '' },
  placement: { type: String, default: 'top' },
  delay: { type: Number, default: 250 },
  focusable: { type: Boolean, default: false },
})

const OPEN_DELAY_SKIPPED = 0

const id = useId()
const open = ref(false)
const reference = ref(null)
const floatingEl = ref(null)
const arrowEl = ref(null)
let timer = null

const {
  floatingStyles,
  middlewareData,
  placement: actualPlacement,
} = useFloating(reference, floatingEl, {
  placement: computed(() => props.placement),
  middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 }), arrow({ element: arrowEl })],
  whileElementsMounted: autoUpdate,
})

const hasContent = computed(() => !!props.content.trim())

/** Keeps the arrow centred on the trigger, whichever side we flipped to. */
const arrowStyles = computed(() => {
  const data = middlewareData.value?.arrow
  if (!data) return {}
  const side = String(actualPlacement.value || 'top').split('-')[0]
  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side]
  return {
    left: data.x == null ? '' : `${data.x}px`,
    top: data.y == null ? '' : `${data.y}px`,
    [opposite]: '-3px',
  }
})

function show(delay = props.delay) {
  if (!hasContent.value) return
  clearTimeout(timer)
  if (delay === OPEN_DELAY_SKIPPED) {
    open.value = true
    return
  }
  timer = setTimeout(() => {
    open.value = true
  }, delay)
}

function hide() {
  clearTimeout(timer)
  open.value = false
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <span
    ref="reference"
    class="inline-flex"
    :tabindex="focusable && hasContent ? 0 : undefined"
    :aria-describedby="open ? id : undefined"
    @mouseenter="show()"
    @mouseleave="hide"
    @focusin="show(OPEN_DELAY_SKIPPED)"
    @focusout="hide"
    @keydown.esc="hide"
  >
    <slot />

    <Teleport to="body">
      <div
        v-if="open && hasContent"
        :id="id"
        ref="floatingEl"
        role="tooltip"
        class="z-50 w-max max-w-xs rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium leading-snug text-slate-50 shadow-lg ring-1 ring-black/5 dark:bg-slate-700 dark:text-slate-50"
        :style="floatingStyles"
      >
        <slot name="content">{{ content }}</slot>
        <span
          ref="arrowEl"
          class="absolute h-2 w-2 rotate-45 bg-slate-800 dark:bg-slate-700"
          :style="arrowStyles"
        ></span>
      </div>
    </Teleport>
  </span>
</template>
