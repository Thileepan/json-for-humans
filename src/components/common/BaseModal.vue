<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  wide: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const panel = ref(null)

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

watch(
  () => props.open,
  (open) => {
    if (open) {
      requestAnimationFrame(() => panel.value?.focus())
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="emit('close')"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        class="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl outline-none dark:border-slate-700 dark:bg-slate-900"
        :class="wide ? 'max-w-3xl' : 'max-w-lg'"
      >
        <header
          class="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-700"
        >
          <h2 class="text-base font-semibold text-slate-800 dark:text-slate-100">{{ title }}</h2>
          <button
            type="button"
            class="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close dialog"
            @click="emit('close')"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div class="overflow-y-auto px-5 py-4">
          <slot />
        </div>
        <footer
          v-if="$slots.footer"
          class="border-t border-slate-200 px-5 py-3 dark:border-slate-700"
        >
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>
