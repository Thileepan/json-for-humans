import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ViewModeSelector from '../../components/human-view/ViewModeSelector.vue'

describe('ViewModeSelector', () => {
  it('renders all five display modes', () => {
    const wrapper = mount(ViewModeSelector, { props: { modelValue: 'document' } })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(5)
  })

  it('marks the active mode as selected', () => {
    const wrapper = mount(ViewModeSelector, { props: { modelValue: 'tree' } })
    const active = wrapper.find('[aria-selected="true"]')
    expect(active.text()).toContain('Tree')
  })

  it('emits update:modelValue on click', async () => {
    const wrapper = mount(ViewModeSelector, { props: { modelValue: 'document' } })
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['cards'])
  })

  it('supports arrow-key navigation', async () => {
    const wrapper = mount(ViewModeSelector, { props: { modelValue: 'document' } })
    await wrapper.findAll('[role="tab"]')[0].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['cards'])
  })
})
