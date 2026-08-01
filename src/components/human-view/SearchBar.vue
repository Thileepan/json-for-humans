<script setup>
import { Filter, Search, X } from 'lucide-vue-next'
import { ref } from 'vue'
import { useSearch } from '../../composables/useSearch.js'

defineProps({
  matchCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
})

const { searchQuery, hideNulls, hideEmpty, hideIds, resetFilters } = useSearch()
const filtersOpen = ref(false)
</script>

<template>
  <div class="relative flex items-center gap-1.5">
    <div class="relative">
      <Search
        class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search fields or values"
        aria-label="Search fields or values"
        class="w-44 rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:w-56"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
        aria-label="Clear search"
        @click="searchQuery = ''"
      >
        <X class="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
    <span
      v-if="searchQuery || hideNulls || hideEmpty || hideIds"
      class="text-xs text-slate-500 dark:text-slate-400"
      aria-live="polite"
    >
      {{ matchCount }}/{{ totalCount }}
    </span>
    <div class="relative">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        :aria-expanded="filtersOpen"
        aria-haspopup="true"
        @click="filtersOpen = !filtersOpen"
      >
        <Filter class="h-3.5 w-3.5" aria-hidden="true" />
        Filters
      </button>
      <div
        v-if="filtersOpen"
        class="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
      >
        <label class="flex items-center gap-2 py-1 text-xs text-slate-700 dark:text-slate-200">
          <input v-model="hideNulls" type="checkbox" class="accent-brand-500" />
          Hide null values
        </label>
        <label class="flex items-center gap-2 py-1 text-xs text-slate-700 dark:text-slate-200">
          <input v-model="hideEmpty" type="checkbox" class="accent-brand-500" />
          Hide empty values
        </label>
        <label class="flex items-center gap-2 py-1 text-xs text-slate-700 dark:text-slate-200">
          <input v-model="hideIds" type="checkbox" class="accent-brand-500" />
          Hide technical identifiers
        </label>
        <button
          type="button"
          class="mt-2 w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="(resetFilters(), (filtersOpen = false))"
        >
          Reset filters
        </button>
      </div>
    </div>
  </div>
</template>
