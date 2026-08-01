import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ComparisonPanel from '../../components/comparison/ComparisonPanel.vue'
import { useComparisonStore } from '../../stores/comparisonStore.js'

describe('ComparisonPanel', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('shows readable change sentences for two documents', async () => {
    const comparisonStore = useComparisonStore()
    comparisonStore.leftText = JSON.stringify({
      payment_status: 'PENDING',
      delivery_date: '2026-08-10',
    })
    comparisonStore.rightText = JSON.stringify({
      payment_status: 'COMPLETED',
      customer_email: 'a@example.com',
    })

    const wrapper = mount(ComparisonPanel, {
      global: { plugins: [pinia] },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Payment Status changed from Pending to Completed.')
    expect(wrapper.text()).toContain('Delivery Date was removed.')
    expect(wrapper.text()).toContain('1 added · 1 removed · 1 changed')
    wrapper.unmount()
  })

  it('prompts for input when either side is missing', () => {
    const wrapper = mount(ComparisonPanel, {
      global: { plugins: [pinia] },
      attachTo: document.body,
    })
    expect(wrapper.text()).toContain('Paste valid JSON on both sides')
    wrapper.unmount()
  })
})
