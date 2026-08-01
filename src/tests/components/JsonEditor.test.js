import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import JsonEditor from '../../components/editor/JsonEditor.vue'

describe('JsonEditor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mounts a CodeMirror editor with the initial document', () => {
    const wrapper = mount(JsonEditor, {
      props: { modelValue: '{"a": 1}' },
      attachTo: document.body,
    })
    expect(wrapper.find('.cm-editor').exists()).toBe(true)
    expect(wrapper.find('.cm-content').text()).toContain('"a"')
    wrapper.unmount()
  })

  it('updates the document when the prop changes', async () => {
    const wrapper = mount(JsonEditor, {
      props: { modelValue: '{"a": 1}' },
      attachTo: document.body,
    })
    await wrapper.setProps({ modelValue: '{"b": 2}' })
    expect(wrapper.find('.cm-content').text()).toContain('"b"')
    wrapper.unmount()
  })

  it('exposes an accessible label', () => {
    const wrapper = mount(JsonEditor, {
      props: { modelValue: '', ariaLabel: 'My editor' },
      attachTo: document.body,
    })
    expect(wrapper.find('[aria-label="My editor"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
