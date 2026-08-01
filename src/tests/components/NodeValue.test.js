import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NodeValue from '../../components/human-view/NodeValue.vue'

function fieldNode(overrides = {}) {
  return {
    kind: 'field',
    key: 'x',
    label: 'X',
    path: 'x',
    rawValue: 'value',
    displayValue: 'value',
    detectedType: 'text',
    meta: {},
    ...overrides,
  }
}

describe('NodeValue', () => {
  it('renders plain values as text', () => {
    const wrapper = mount(NodeValue, { props: { node: fieldNode() } })
    expect(wrapper.text()).toContain('value')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('renders safe links with rel=noopener', () => {
    const node = fieldNode({
      displayValue: 'https://example.com',
      detectedType: 'url',
      meta: { href: 'https://example.com' },
    })
    const wrapper = mount(NodeValue, { props: { node } })
    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('https://example.com')
    expect(link.attributes('rel')).toContain('noopener')
  })

  it('never renders unsafe protocols as links', () => {
    const node = fieldNode({
      displayValue: 'javascript:alert(1)',

      meta: { href: 'javascript:alert(1)' },
    })
    const wrapper = mount(NodeValue, { props: { node } })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('javascript:alert(1)')
  })

  it('does not interpret HTML in values', () => {
    const node = fieldNode({ displayValue: '<img src=x onerror=alert(1)>' })
    const wrapper = mount(NodeValue, { props: { node } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>')
  })

  it('shows a color swatch for color values', () => {
    const node = fieldNode({
      displayValue: '#2f8a5f',
      detectedType: 'color',
      meta: { color: '#2f8a5f', monospace: true },
    })
    const wrapper = mount(NodeValue, { props: { node } })
    expect(wrapper.find('[role="img"]').exists()).toBe(true)
  })

  it('shows a copy button for identifiers', () => {
    const node = fieldNode({ detectedType: 'id', meta: { isId: true, monospace: true } })
    const wrapper = mount(NodeValue, { props: { node } })
    expect(wrapper.find('button[aria-label^="Copy"]').exists()).toBe(true)
  })
})
