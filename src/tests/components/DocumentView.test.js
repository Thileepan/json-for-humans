import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DocumentView from '../../components/human-view/DocumentView.vue'
import { humanizeJson } from '../../core/transformer/humanizeJson.js'

const OPTS = { locale: 'en-US', timezone: 'utc' }

describe('DocumentView', () => {
  it('promotes an id field into the document title', () => {
    const tree = humanizeJson({ order_id: 123, customer_name: 'Ravi Kumar' }, OPTS)
    const wrapper = mount(DocumentView, { props: { tree } })
    expect(wrapper.find('h2').text()).toBe('Order #123')
    expect(wrapper.text()).toContain('Customer Name')
    expect(wrapper.text()).toContain('Ravi Kumar')
  })

  it('renders nested objects as sections', () => {
    const tree = humanizeJson(
      { customer: { name: 'Ravi', contact: { email: 'ravi@example.com' } } },
      OPTS
    )
    const wrapper = mount(DocumentView, { props: { tree } })
    expect(wrapper.text()).toContain('Customer')
    expect(wrapper.text()).toContain('Contact')
    expect(wrapper.text()).toContain('ravi@example.com')
  })

  it('renders primitive arrays as bullet lists', () => {
    const tree = humanizeJson({ roles: ['ADMIN', 'EDITOR'] }, OPTS)
    const wrapper = mount(DocumentView, { props: { tree } })
    const items = wrapper.findAll('li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Admin')
  })
})
