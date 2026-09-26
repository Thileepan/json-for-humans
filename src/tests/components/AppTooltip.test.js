import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import AppTooltip from '../../components/common/AppTooltip.vue'

const CONTENT = 'Match case. Off: “ravi” also finds “Ravi”.'

function mountTooltip(props = {}) {
  return mount(AppTooltip, {
    props: { content: CONTENT, ...props },
    slots: { default: () => h('button', { type: 'button' }, 'Aa') },
    attachTo: document.body,
  })
}

const bubble = () => document.body.querySelector('[role="tooltip"]')

describe('AppTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('renders the trigger and nothing else at rest', () => {
    const wrapper = mountTooltip()
    expect(wrapper.find('button').text()).toBe('Aa')
    expect(bubble()).toBeNull()
    wrapper.unmount()
  })

  it('opens on hover, but only after the delay', async () => {
    const wrapper = mountTooltip({ delay: 250 })
    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    expect(bubble()).toBeNull()

    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()
    expect(bubble().textContent).toContain('Match case')
    wrapper.unmount()
  })

  it('closes again on mouseleave', async () => {
    const wrapper = mountTooltip({ delay: 0 })
    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    expect(bubble()).not.toBeNull()

    await wrapper.trigger('mouseleave')
    await wrapper.vm.$nextTick()
    expect(bubble()).toBeNull()
    wrapper.unmount()
  })

  it('opens immediately for keyboard focus', async () => {
    const wrapper = mountTooltip({ delay: 400 })
    await wrapper.trigger('focusin')
    await wrapper.vm.$nextTick()
    // No timer advance: a keyboard user should not have to wait.
    expect(bubble()).not.toBeNull()
    wrapper.unmount()
  })

  it('closes on blur and on Escape', async () => {
    const wrapper = mountTooltip()
    await wrapper.trigger('focusin')
    await wrapper.trigger('focusout')
    await wrapper.vm.$nextTick()
    expect(bubble()).toBeNull()

    await wrapper.trigger('focusin')
    await wrapper.vm.$nextTick()
    expect(bubble()).not.toBeNull()
    await wrapper.trigger('keydown', { key: 'Escape' })
    await wrapper.vm.$nextTick()
    expect(bubble()).toBeNull()
    wrapper.unmount()
  })

  it('describes the trigger rather than renaming it', async () => {
    const wrapper = mountTooltip({ delay: 0 })
    expect(wrapper.attributes('aria-describedby')).toBeUndefined()

    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    // aria-describedby, not aria-label: the button keeps its own name.
    expect(wrapper.attributes('aria-describedby')).toBe(bubble().id)
    expect(wrapper.attributes('aria-label')).toBeUndefined()
    wrapper.unmount()
  })

  it('stays out of the way when there is no content', async () => {
    const wrapper = mountTooltip({ content: '   ', delay: 0 })
    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    expect(bubble()).toBeNull()
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    wrapper.unmount()
  })

  it('makes a non-focusable trigger reachable when asked', () => {
    const wrapper = mountTooltip({ focusable: true })
    expect(wrapper.attributes('tabindex')).toBe('0')
    wrapper.unmount()
  })

  it('cleans up a pending open on unmount', async () => {
    const wrapper = mountTooltip({ delay: 250 })
    await wrapper.trigger('mouseenter')
    wrapper.unmount()
    vi.advanceTimersByTime(500)
    expect(bubble()).toBeNull()
  })

  it('renders rich content through the slot', async () => {
    const wrapper = mount(AppTooltip, {
      props: { content: 'fallback', delay: 0 },
      slots: {
        default: () => h('button', { type: 'button' }, 'Aa'),
        content: () => h('strong', 'Detailed explanation'),
      },
      attachTo: document.body,
    })
    await wrapper.trigger('mouseenter')
    await wrapper.vm.$nextTick()
    expect(bubble().textContent).toContain('Detailed explanation')
    wrapper.unmount()
  })
})
