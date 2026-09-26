import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchBar from '../../components/human-view/SearchBar.vue'
import AppTooltip from '../../components/common/AppTooltip.vue'
import { collectFields } from '../../core/search/index.js'
import { humanizeJson } from '../../core/transformer/humanizeJson.js'
import { useUiStore } from '../../stores/uiStore.js'

/**
 * Built from a real tree rather than written by hand, so the fixture cannot
 * drift from what collectFields actually produces. `user_id` is numeric and
 * `order_ref` is not: both are detected as identifiers, and only the first
 * can be ordered.
 */
const FIELDS = collectFields(
  humanizeJson(
    {
      active: true,
      address: { city: 'Chennai' },
      email: 'ravi@example.com',
      orders: [
        { amount: 250, placed_on: '2024-01-10', order_ref: 'A-1', user_id: 1, mixed: 'a' },
        { amount: 640, placed_on: '2024-09-21', order_ref: 'A-2', user_id: 2, mixed: 7 },
      ],
    },
    { locale: 'en-US', timezone: 'utc' }
  )
)

let pinia

function mountBar(options = {}) {
  return mount(SearchBar, {
    props: { matchCount: 2, totalCount: 10, fields: FIELDS },
    global: { plugins: [pinia] },
    ...options,
  })
}

describe('SearchBar', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  const openBuilder = async (wrapper) => {
    const buttons = wrapper.findAll('button')
    await buttons.find((button) => button.text().includes('Conditions')).trigger('click')
  }

  it('shows a chip for each condition parsed out of the typed text', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'city:Chennai amount>500'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('City contains Chennai')
    expect(wrapper.text()).toContain('Amount greater than 500')
  })

  it('writes a builder edit back into the search box', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'city:Chennai'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    const operator = wrapper.findAll('select')[2]
    await operator.setValue('equals')
    expect(ui.searchQuery).toBe('city=Chennai')
  })

  it('adds and removes conditions through the text', async () => {
    const ui = useUiStore()
    const wrapper = mountBar()
    await openBuilder(wrapper)
    const add = wrapper.findAll('button').find((button) => button.text().includes('Add condition'))

    await add.trigger('click')
    expect(ui.searchQuery).toBe(`${FIELDS[0].path}:`)

    const remove = wrapper.find('[aria-label="Remove condition 1"]')
    await remove.trigger('click')
    expect(ui.searchQuery).toBe('')
  })

  it('switches the whole query between all and any', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'status:paid amount>500'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    await wrapper.find('#search-combinator').setValue('OR')
    expect(ui.searchQuery).toBe('status:paid OR amount>500')
  })

  it('keeps the combinator locked until there are two conditions', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'status:paid'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    expect(wrapper.find('#search-combinator').attributes('disabled')).toBeDefined()
  })

  it('toggles case sensitivity without touching the query text', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'chennai'
    const wrapper = mountBar()
    await wrapper.find('[aria-pressed]').trigger('click')
    expect(ui.searchCaseSensitive).toBe(true)
    expect(ui.searchQuery).toBe('chennai')
  })

  it('offers only the detected types present in the document', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'is:date'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    const typeSelect = wrapper.findAll('select').at(-1)
    const options = typeSelect.findAll('option').map((option) => option.text())
    expect(options).toEqual(['Choose a type', 'boolean', 'date', 'email', 'id', 'number', 'text'])
  })
})

describe('SearchBar — typing and shortcuts', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces typing instead of filtering on every keystroke', async () => {
    const ui = useUiStore()
    const wrapper = mountBar()
    const input = wrapper.find('input[type="search"]')

    await input.setValue('che')
    expect(ui.searchQuery).toBe('')

    await input.setValue('chen')
    vi.advanceTimersByTime(100)
    expect(ui.searchQuery).toBe('')

    vi.advanceTimersByTime(100)
    expect(ui.searchQuery).toBe('chen')
  })

  it('shows the typed text immediately, even before it is committed', async () => {
    const wrapper = mountBar()
    const input = wrapper.find('input[type="search"]')
    await input.setValue('che')
    expect(input.element.value).toBe('che')
  })

  it('clears immediately rather than after the debounce', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'chennai'
    const wrapper = mountBar()
    await wrapper.find('[aria-label="Clear search"]').trigger('click')
    expect(ui.searchQuery).toBe('')
  })

  it('focuses the box on / from elsewhere on the page', async () => {
    const wrapper = mountBar({ attachTo: document.body })
    const input = wrapper.find('input[type="search"]').element
    expect(document.activeElement).not.toBe(input)

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(document.activeElement).toBe(input)
    wrapper.unmount()
  })

  it('ignores / while the user is typing somewhere else', async () => {
    const wrapper = mountBar({ attachTo: document.body })
    const input = wrapper.find('input[type="search"]').element
    const other = document.createElement('textarea')
    document.body.appendChild(other)
    other.focus()

    other.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(document.activeElement).not.toBe(input)

    other.remove()
    wrapper.unmount()
  })

  it('focuses the box on Ctrl-K even while typing elsewhere', async () => {
    const wrapper = mountBar({ attachTo: document.body })
    const input = wrapper.find('input[type="search"]').element
    const other = document.createElement('textarea')
    document.body.appendChild(other)
    other.focus()

    other.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(document.activeElement).toBe(input)

    other.remove()
    wrapper.unmount()
  })

  it('clears on Escape', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'chennai'
    const wrapper = mountBar()
    await wrapper.find('input[type="search"]').trigger('keydown.esc')
    expect(ui.searchQuery).toBe('')
  })

  it('stops listening once unmounted', async () => {
    const wrapper = mountBar({ attachTo: document.body })
    const input = wrapper.find('input[type="search"]').element
    wrapper.unmount()
    expect(() =>
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }))
    ).not.toThrow()
    expect(document.activeElement).not.toBe(input)
  })
})

describe('SearchBar — operators offered per field', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  const openBuilder = async (wrapper) => {
    const buttons = wrapper.findAll('button')
    await buttons.find((button) => button.text().includes('Conditions')).trigger('click')
  }

  const operatorOptions = (wrapper) =>
    wrapper
      .findAll('select')[2]
      .findAll('option')
      .map((option) => option.attributes('value'))

  it('leaves out ordering operators for an email field', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'email:ar'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    const ops = operatorOptions(wrapper)
    expect(ops).toContain('contains')
    expect(ops).toContain('startsWith')
    expect(ops).not.toContain('gt')
    expect(ops).not.toContain('lt')
    expect(ops).not.toContain('between')
  })

  it('offers ordering operators for a number field', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'orders[].amount>100'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    const ops = operatorOptions(wrapper)
    expect(ops).toContain('gt')
    expect(ops).toContain('between')
  })

  it('offers ordering operators for a numeric id, despite it displaying as an id', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'user_id:1'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    const ops = operatorOptions(wrapper)
    // user_id is detected as an "id" for display, but the value is a number
    // and the matcher can order it, so the operators must be offered.
    expect(ops).toContain('gt')
    expect(ops).toContain('lt')
    expect(ops).toContain('between')
  })

  it('withholds ordering from an id that is not numeric', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'order_ref:A-1'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    const ops = operatorOptions(wrapper)
    expect(ops).toContain('contains')
    expect(ops).not.toContain('gt')
    expect(ops).not.toContain('between')
  })

  it('offers ordering operators for a date field', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'orders[].placed_on>2024-01-01'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    expect(operatorOptions(wrapper)).toContain('between')
  })

  it('offers everything for an unscoped condition', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'chennai'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    const ops = operatorOptions(wrapper)
    expect(ops).toContain('gt')
    expect(ops).toContain('type')
  })

  it('asks about type only where a field really has more than one', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'email:ar'
    let wrapper = mountBar()
    await openBuilder(wrapper)
    expect(operatorOptions(wrapper)).not.toContain('type')

    ui.searchQuery = 'mixed:x'
    wrapper = mountBar()
    await openBuilder(wrapper)
    expect(operatorOptions(wrapper)).toContain('type')
  })

  it('narrows a boolean field to is / present / empty', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'active:true'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    expect(operatorOptions(wrapper)).toEqual(['equals', 'exists', 'isEmpty'])
  })

  it('moves the operator to a supported one when the field changes', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'orders[].amount>100'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    // Greater-than is meaningless for an email, so it must not be left behind.
    await wrapper.findAll('select')[1].setValue('email')
    expect(ui.searchQuery).toBe('email:100')
  })

  it('keeps the operator when the new field still supports it', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'orders[].amount>100'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    await wrapper.findAll('select')[1].setValue('orders[].placed_on')
    expect(ui.searchQuery).toBe('orders[].placed_on>100')
  })

  it('keeps "between" selected instead of dropping back to "contains"', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'orders[].amount>100'
    const wrapper = mountBar()
    await openBuilder(wrapper)
    await wrapper.findAll('select')[2].setValue('between')
    // Even with no bounds typed yet, the choice has to stick.
    expect(wrapper.findAll('select')[2].element.value).toBe('between')
    expect(ui.searchQuery).toBe('orders[].amount[between]:100..')
  })
})

describe('SearchBar — the match counter', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('says what the number counts', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'chennai'
    const wrapper = mountBar()
    expect(wrapper.text()).toContain('2/10 fields')
  })

  it('counts rows instead of fields in table view', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'chennai'
    const wrapper = mount(SearchBar, {
      props: {
        matchCount: 2,
        totalCount: 10,
        rowCount: 3,
        totalRows: 25,
        fields: FIELDS,
        viewMode: 'table',
      },
      global: { plugins: [pinia] },
    })
    expect(wrapper.text()).toContain('3/25 rows')
    expect(wrapper.text()).not.toContain('fields')
  })

  const tooltipTexts = (wrapper) =>
    wrapper.findAllComponents(AppTooltip).map((tip) => tip.props('content'))

  it('explains itself on hover', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'chennai'
    const wrapper = mountBar()
    expect(tooltipTexts(wrapper).some((text) => text.includes('2 of 10 fields'))).toBe(true)
  })

  it('spells out what matching case does', async () => {
    const wrapper = mountBar()
    const hint = tooltipTexts(wrapper).find((text) => text.includes('Match case'))
    expect(hint).toContain('ravi')
    expect(hint).toContain('Ravi')
  })

  it('keeps the counter tooltip reachable by keyboard', async () => {
    const ui = useUiStore()
    ui.searchQuery = 'chennai'
    const wrapper = mountBar()
    const counterTip = wrapper
      .findAllComponents(AppTooltip)
      .find((tip) => tip.props('content').includes('fields match'))
    // A plain <span> is not focusable, so the tooltip has to make it so.
    expect(counterTip.props('focusable')).toBe(true)
  })
})
