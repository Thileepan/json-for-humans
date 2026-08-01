<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Braces,
  GitCompareArrows,
  Github,
  Monitor,
  Moon,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
} from 'lucide-vue-next'
import { useUiStore } from '../../stores/uiStore.js'
import { useJsonStore } from '../../stores/jsonStore.js'
import { useTheme } from '../../composables/useTheme.js'

const uiStore = useUiStore()
const jsonStore = useJsonStore()
const { workspaceMode } = storeToRefs(uiStore)
const { theme, cycleTheme } = useTheme()

const themeIcon = computed(
  () => ({ system: Monitor, light: Sun, dark: Moon })[theme.value] || Monitor
)

function resetWorkspace() {
  jsonStore.clear()
  uiStore.resetFilters()
  uiStore.workspaceMode = 'humanize'
}

const iconButton =
  'inline-flex items-center gap-1.5 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
</script>

<template>
  <header
    class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900"
  >
    <a
      href="./"
      class="flex items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
      aria-label="JSON for Humans home"
    >
      <span
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white"
        aria-hidden="true"
      >
        <Braces class="h-5 w-5" />
      </span>
      <div>
        <h1 class="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
          JSON for Humans
        </h1>
        <p class="hidden text-[0.68rem] leading-tight text-slate-500 dark:text-slate-400 md:block">
          Turn ugly JSON into something anyone can understand.
        </p>
      </div>
    </a>

    <span
      class="ml-2 hidden items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[0.68rem] font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300 sm:inline-flex"
      title="All processing happens locally. Nothing is uploaded or stored."
    >
      <ShieldCheck class="h-3.5 w-3.5" aria-hidden="true" />
      Your JSON stays in your browser and is never uploaded.
    </span>

    <div class="ml-auto flex items-center gap-1">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        :class="
          workspaceMode === 'compare'
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        "
        :aria-pressed="workspaceMode === 'compare'"
        @click="workspaceMode = workspaceMode === 'compare' ? 'humanize' : 'compare'"
      >
        <GitCompareArrows class="h-3.5 w-3.5" aria-hidden="true" />
        Compare
      </button>

      <button
        type="button"
        :class="iconButton"
        aria-label="Open custom schema"
        title="Custom schema"
        @click="uiStore.schemaOpen = true"
      >
        <SlidersHorizontal class="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        :class="iconButton"
        aria-label="Open settings"
        title="Settings"
        @click="uiStore.settingsOpen = true"
      >
        <Settings2 class="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        :class="iconButton"
        :aria-label="`Theme: ${theme}. Click to change.`"
        :title="`Theme: ${theme}`"
        @click="cycleTheme"
      >
        <component :is="themeIcon" class="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        :class="iconButton"
        aria-label="Reset workspace"
        title="Reset workspace"
        @click="resetWorkspace"
      >
        <RotateCcw class="h-4 w-4" aria-hidden="true" />
      </button>
      <a
        href="https://github.com/your-org/json-for-humans"
        target="_blank"
        rel="noopener noreferrer"
        :class="iconButton"
        aria-label="View source on GitHub"
        title="GitHub repository"
      >
        <Github class="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  </header>
</template>
