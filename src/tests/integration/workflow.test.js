/**
 * Integration test covering the full user flow:
 *   Paste JSON → Parse → Transform → Display human-readable output → Export
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'
import { useJsonStore } from '../../stores/jsonStore.js'
import { useUiStore } from '../../stores/uiStore.js'

const ORDER_JSON = JSON.stringify({
  order_id: 123,
  customer_name: 'Ravi Kumar',
  payment_status: 'PAYMENT_PENDING',
  is_deleted: false,
  roles: ['ADMIN', 'EDITOR'],
})

describe('paste → parse → transform → display → export', () => {
  let pinia
  let writtenToClipboard

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    writtenToClipboard = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn((text) => {
          writtenToClipboard = text
          return Promise.resolve()
        }),
        readText: vi.fn(() => Promise.resolve('')),
      },
    })
  })

  it('turns pasted JSON into a readable document and exports it', async () => {
    const wrapper = mount(App, {
      global: { plugins: [pinia], stubs: { teleport: true } },
      attachTo: document.body,
    })

    // Paste JSON (immediate parse, as the paste button does).
    const jsonStore = useJsonStore()
    jsonStore.setText(ORDER_JSON, { immediate: true })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // Parsed and displayed as a human-readable document.
    const text = wrapper.text()
    expect(text).toContain('Order #123')
    expect(text).toContain('Customer Name')
    expect(text).toContain('Ravi Kumar')
    expect(text).toContain('Payment Pending')
    expect(text).toContain('Admin')
    expect(text).toContain('Valid JSON')

    // Booleans humanized: is_deleted -> Deleted: No
    expect(text).toContain('Deleted')
    expect(text).toContain('No')

    // Export: open the export menu and copy as plain text.
    const exportButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Export'))
    await exportButton.trigger('click')
    const copyItem = wrapper
      .findAll('[role="menuitem"]')
      .find((item) => item.text().includes('Copy as plain text'))
    await copyItem.trigger('click')
    await wrapper.vm.$nextTick()

    expect(writtenToClipboard).toContain('Customer Name')
    expect(writtenToClipboard).toContain('Ravi Kumar')
    expect(writtenToClipboard).toContain('• Admin')

    wrapper.unmount()
  })

  it('switches display modes and shows errors for invalid JSON', async () => {
    const wrapper = mount(App, {
      global: { plugins: [pinia], stubs: { teleport: true } },
      attachTo: document.body,
    })

    const jsonStore = useJsonStore()
    const uiStore = useUiStore()

    jsonStore.setText('{"a": 1,}', { immediate: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Invalid JSON')
    expect(wrapper.text()).toContain('Apply repair')

    jsonStore.applySuggestion()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('Invalid JSON')

    uiStore.viewMode = 'tree'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Expand all')

    wrapper.unmount()
  })
})
