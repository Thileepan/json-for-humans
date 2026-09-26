<script setup>
import { computed } from 'vue'
import { highlightSegments } from '../../core/search/highlight.js'
import { useSearchHighlight } from '../../composables/useSearchHighlight.js'

/**
 * Renders text with the search matches marked. Everything is emitted as
 * text nodes — never v-html — so untrusted JSON content stays inert.
 */
const props = defineProps({
  text: { type: [String, Number], default: '' },
  node: { type: Object, default: null },
})

const query = useSearchHighlight()

const segments = computed(() => {
  const active = query?.value
  if (!active || !active.conditions?.length) return null
  return highlightSegments(props.text, props.node, active)
})
</script>

<template>
  <template v-if="segments"
    ><template v-for="(segment, index) in segments" :key="index"
      ><mark
        v-if="segment.match"
        class="rounded-[3px] bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-400/30"
        >{{ segment.text }}</mark
      ><template v-else>{{ segment.text }}</template></template
    ></template
  ><template v-else>{{ text }}</template>
</template>
