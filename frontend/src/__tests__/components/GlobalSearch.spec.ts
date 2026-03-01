import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithPlugins } from '../helpers'
import GlobalSearch from '../../components/layout/GlobalSearch.vue'

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

import api from '../../lib/api'

describe('GlobalSearch', () => {
  const mockSearchResponse = {
    results: [
      {
        id: '1',
        type: 'series',
        title: 'Desert Storm',
        description: 'A drama series',
        status: 'published',
        thumbnail_url: null,
        series_id: null,
        series_title: null,
        episode_number: null,
      },
      {
        id: '2',
        type: 'episode',
        title: 'Pilot Episode',
        description: 'First episode',
        status: null,
        thumbnail_url: null,
        series_id: 's1',
        series_title: 'Desert Storm',
        episode_number: 1,
      },
    ],
    total: 2,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('renders search input', () => {
    const wrapper = mountWithPlugins(GlobalSearch)
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toContain('Search')
  })

  it('debounced search triggers API call', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockSearchResponse })

    const wrapper = mountWithPlugins(GlobalSearch)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('Desert')

    // Should not have called API yet (debounce)
    expect(api.get).not.toHaveBeenCalled()

    // Advance past debounce
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/api/search', {
      params: { q: 'Desert', per_page: 10 },
    })
  })

  it('results dropdown shows matching series and episodes', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockSearchResponse })

    const wrapper = mountWithPlugins(GlobalSearch)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('Desert')
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Series')
    expect(wrapper.text()).toContain('Episodes')
    expect(wrapper.text()).toContain('Desert Storm')
    expect(wrapper.text()).toContain('Pilot Episode')
  })

  it('shows empty results message', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { results: [], total: 0 },
    })

    const wrapper = mountWithPlugins(GlobalSearch)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('nonexistent')
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(wrapper.text()).toContain('No results')
  })

  it('escape key closes dropdown', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockSearchResponse })

    const wrapper = mountWithPlugins(GlobalSearch)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('Desert')
    vi.advanceTimersByTime(300)
    await flushPromises()

    // Results should be visible
    expect(wrapper.text()).toContain('Desert Storm')

    // Press escape
    await input.trigger('keydown', { key: 'Escape' })

    // Dropdown should be closed
    expect(wrapper.text()).not.toContain('Desert Storm')
  })
})
