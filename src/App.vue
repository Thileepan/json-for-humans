<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from './components/common/AppHeader.vue'
import SplitPane from './components/common/SplitPane.vue'
import InputPanel from './components/editor/InputPanel.vue'
import HumanPanel from './components/human-view/HumanPanel.vue'
import ComparisonPanel from './components/comparison/ComparisonPanel.vue'
import SettingsModal from './components/settings/SettingsModal.vue'
import SchemaModal from './components/schema/SchemaModal.vue'
import { useSettingsStore } from './stores/settingsStore.js'
import { useUiStore } from './stores/uiStore.js'

const settingsStore = useSettingsStore()
const uiStore = useUiStore()
const { workspaceMode } = storeToRefs(uiStore)

onMounted(() => {
  settingsStore.load()
  uiStore.viewMode = settingsStore.settings.defaultViewMode
})
</script>

<template>
  <div class="flex h-screen flex-col bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
    <AppHeader />
    <main class="flex min-h-0 flex-1 flex-col">
      <SplitPane v-if="workspaceMode === 'humanize'">
        <template #left>
          <InputPanel />
        </template>
        <template #right>
          <HumanPanel />
        </template>
      </SplitPane>
      <ComparisonPanel v-else />
    </main>
    <SettingsModal />
    <SchemaModal />
  </div>
</template>
