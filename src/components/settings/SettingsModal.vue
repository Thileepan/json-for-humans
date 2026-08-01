<script setup>
import { computed } from 'vue'
import BaseModal from '../common/BaseModal.vue'
import { useSettingsStore } from '../../stores/settingsStore.js'
import { useUiStore } from '../../stores/uiStore.js'

const settingsStore = useSettingsStore()
const uiStore = useUiStore()

const open = computed(() => uiStore.settingsOpen)

function set(key, value) {
  settingsStore.update({ [key]: value })
}

const fieldClass =
  'w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300'
const checkboxLabel = 'flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200'
</script>

<template>
  <BaseModal :open="open" title="Settings" wide @close="uiStore.settingsOpen = false">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label
          class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
          for="s-boolean"
          >Boolean labels</label
        >
        <select
          id="s-boolean"
          :value="settingsStore.settings.booleanStyle"
          :class="fieldClass"
          @change="set('booleanStyle', $event.target.value)"
        >
          <option value="yes-no">Yes / No</option>
          <option value="true-false">True / False</option>
          <option value="enabled-disabled">Enabled / Disabled</option>
          <option value="active-inactive">Active / Inactive</option>
        </select>
      </div>

      <div>
        <label :class="labelClass" for="s-datemode">Date format</label>
        <select
          id="s-datemode"
          :value="settingsStore.settings.dateMode"
          :class="fieldClass"
          @change="set('dateMode', $event.target.value)"
        >
          <option value="datetime">Date and time</option>
          <option value="date">Date only</option>
          <option value="relative">Relative time</option>
        </select>
      </div>

      <div>
        <label :class="labelClass" for="s-timezone">Timezone</label>
        <select
          id="s-timezone"
          :value="settingsStore.settings.timezone"
          :class="fieldClass"
          @change="set('timezone', $event.target.value)"
        >
          <option value="local">Browser local timezone</option>
          <option value="utc">UTC</option>
        </select>
      </div>

      <div>
        <label :class="labelClass" for="s-locale">Number locale</label>
        <input
          id="s-locale"
          :value="settingsStore.settings.locale"
          :class="fieldClass"
          placeholder="Browser default (e.g. en-IN, de-DE)"
          @change="set('locale', $event.target.value.trim())"
        />
      </div>

      <div>
        <label :class="labelClass" for="s-null">Label for null values</label>
        <input
          id="s-null"
          :value="settingsStore.settings.nullLabel"
          :class="fieldClass"
          @change="set('nullLabel', $event.target.value || 'Not available')"
        />
      </div>

      <div>
        <label :class="labelClass" for="s-emptystr">Label for empty text</label>
        <input
          id="s-emptystr"
          :value="settingsStore.settings.emptyStringLabel"
          :class="fieldClass"
          @change="set('emptyStringLabel', $event.target.value || 'Empty')"
        />
      </div>

      <div>
        <label :class="labelClass" for="s-emptyarr">Label for empty lists</label>
        <input
          id="s-emptyarr"
          :value="settingsStore.settings.emptyArrayLabel"
          :class="fieldClass"
          @change="set('emptyArrayLabel', $event.target.value || 'No items')"
        />
      </div>

      <div>
        <label :class="labelClass" for="s-emptyobj">Label for empty sections</label>
        <input
          id="s-emptyobj"
          :value="settingsStore.settings.emptyObjectLabel"
          :class="fieldClass"
          @change="set('emptyObjectLabel', $event.target.value || 'No details')"
        />
      </div>

      <div>
        <label :class="labelClass" for="s-indent">Indentation (spaces)</label>
        <select
          id="s-indent"
          :value="String(settingsStore.settings.indentSize)"
          :class="fieldClass"
          @change="set('indentSize', Number($event.target.value))"
        >
          <option value="2">2</option>
          <option value="4">4</option>
        </select>
      </div>

      <div>
        <label :class="labelClass" for="s-density">Display density</label>
        <select
          id="s-density"
          :value="settingsStore.settings.density"
          :class="fieldClass"
          @change="set('density', $event.target.value)"
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </div>

      <div>
        <label :class="labelClass" for="s-defaultview">Default view mode</label>
        <select
          id="s-defaultview"
          :value="settingsStore.settings.defaultViewMode"
          :class="fieldClass"
          @change="set('defaultViewMode', $event.target.value)"
        >
          <option value="document">Document</option>
          <option value="cards">Cards</option>
          <option value="table">Table</option>
          <option value="tree">Tree</option>
          <option value="raw">Raw</option>
        </select>
      </div>

      <div>
        <label :class="labelClass" for="s-maxdepth">Maximum initial nesting depth</label>
        <input
          id="s-maxdepth"
          type="number"
          min="0"
          max="20"
          :value="settingsStore.settings.maxInitialDepth"
          :class="fieldClass"
          @change="
            set('maxInitialDepth', Math.max(0, Math.min(20, Number($event.target.value) || 0)))
          "
        />
      </div>

      <div>
        <label :class="labelClass" for="s-theme">Theme</label>
        <select
          id="s-theme"
          :value="settingsStore.settings.theme"
          :class="fieldClass"
          @change="set('theme', $event.target.value)"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div class="space-y-2 sm:col-span-2">
        <label :class="checkboxLabel">
          <input
            type="checkbox"
            class="accent-brand-500"
            :checked="settingsStore.settings.showTechnicalFields"
            @change="set('showTechnicalFields', $event.target.checked)"
          />
          Show technical fields (identifiers, UUIDs)
        </label>
        <label :class="checkboxLabel">
          <input
            type="checkbox"
            class="accent-brand-500"
            :checked="settingsStore.settings.autoExpand"
            @change="set('autoExpand', $event.target.checked)"
          />
          Automatically expand nested objects
        </label>
        <label :class="checkboxLabel">
          <input
            type="checkbox"
            class="accent-brand-500"
            :checked="settingsStore.settings.rememberSettings"
            @change="set('rememberSettings', $event.target.checked)"
          />
          Remember settings on this device
        </label>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Settings are stored in your browser only when this is enabled. Your JSON is never stored
          anywhere.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <button
          type="button"
          class="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          @click="settingsStore.resetToDefaults()"
        >
          Reset to defaults
        </button>
        <button
          type="button"
          class="rounded-md bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
          @click="uiStore.settingsOpen = false"
        >
          Done
        </button>
      </div>
    </template>
  </BaseModal>
</template>
