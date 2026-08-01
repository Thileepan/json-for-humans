import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsModal from '../../components/settings/SettingsModal.vue'
import { useSettingsStore } from '../../stores/settingsStore.js'
import { useUiStore } from '../../stores/uiStore.js'

describe('SettingsModal', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
  })

  function mountModal() {
    const uiStore = useUiStore()
    uiStore.settingsOpen = true
    return mount(SettingsModal, {
      global: { plugins: [pinia], stubs: { teleport: true } },
    })
  }

  it('renders the settings form when open', () => {
    const wrapper = mountModal()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Boolean labels')
  })

  it('updates the store when a setting changes', async () => {
    const wrapper = mountModal()
    const settingsStore = useSettingsStore()
    await wrapper.find('#s-boolean').setValue('enabled-disabled')
    expect(settingsStore.settings.booleanStyle).toBe('enabled-disabled')
  })

  it('only persists settings when remember is enabled', async () => {
    const wrapper = mountModal()
    const settingsStore = useSettingsStore()

    settingsStore.update({ nullLabel: 'N/A' })
    await wrapper.vm.$nextTick()
    expect(localStorage.getItem('json-for-humans:settings')).toBeNull()

    settingsStore.update({ rememberSettings: true })
    await wrapper.vm.$nextTick()
    expect(localStorage.getItem('json-for-humans:settings')).toContain('N/A')
  })
})
