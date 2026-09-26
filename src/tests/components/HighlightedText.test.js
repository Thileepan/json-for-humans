import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import HighlightedText from '../../components/human-view/HighlightedText.vue'
import { provideSearchHighlight } from '../../composables/useSearchHighlight.js'
import { parseQuery } from '../../core/search/parseQuery.js'

const NODE = {
  kind: 'field',
  key: 'city',
  label: 'City',
  displayValue: 'Chennai Central',
  rawValue: 'Chennai Central',
  detectedType: 'text',
}

/** Mounts HighlightedText under a provider, the way HumanPanel does. */
function mountWithQuery(queryText, props = {}) {
  const Host = defineComponent({
    setup() {
      provideSearchHighlight(ref(queryText === null ? null : parseQuery(queryText)))
      return () => h(HighlightedText, { text: 'Chennai Central', node: NODE, ...props })
    },
  })
  return mount(Host)
}

describe('HighlightedText', () => {
  it('marks the matching run', () => {
    const wrapper = mountWithQuery('chennai')
    expect(wrapper.find('mark').text()).toBe('Chennai')
    // textContent, not wrapper.text(): the latter collapses the space that
    // sits between the <mark> and the rest of the value.
    expect(wrapper.element.textContent).toBe('Chennai Central')
  })

  it('renders plain text when there is no query', () => {
    const wrapper = mountWithQuery(null)
    expect(wrapper.find('mark').exists()).toBe(false)
    expect(wrapper.text()).toBe('Chennai Central')
  })

  it('renders plain text outside a provider', () => {
    const wrapper = mount(HighlightedText, { props: { text: 'Chennai', node: NODE } })
    expect(wrapper.find('mark').exists()).toBe(false)
    expect(wrapper.text()).toBe('Chennai')
  })

  it('does not mark a field the query was scoped away from', () => {
    const wrapper = mountWithQuery('notes:chennai')
    expect(wrapper.find('mark').exists()).toBe(false)
  })

  it('escapes rather than interprets markup in the value', () => {
    const text = '<img src=x onerror=alert(1)>'
    const node = { ...NODE, displayValue: text, rawValue: text }
    const wrapper = mountWithQuery('img', { text, node })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.element.textContent).toBe(text)
    expect(wrapper.find('mark').text()).toBe('img')
  })
})
