import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithPlugins } from '../helpers'
import SeriesView from '../../views/SeriesView.vue'

// Mock the API module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../../lib/api'

describe('SeriesView', () => {
  const mockSeriesResponse = {
    items: [
      {
        id: '1',
        title: 'Desert Storm',
        description: 'A drama',
        thumbnail_url: null,
        status: 'draft',
        free_episode_count: 3,
        coin_cost_per_episode: 10,
        created_by: 'user1',
        tags: [{ id: 't1', name: 'Action', category: 'genre' }],
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'City Lights',
        description: 'A comedy',
        thumbnail_url: null,
        status: 'published',
        free_episode_count: 2,
        coin_cost_per_episode: 5,
        created_by: 'user1',
        tags: [],
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      },
    ],
    total: 2,
    page: 1,
    per_page: 20,
  }

  const mockTags = [
    { id: 't1', name: 'Action', category: 'genre', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('renders series rows', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/series') {
        return Promise.resolve({ data: mockSeriesResponse })
      }
      if (url === '/api/tags') {
        return Promise.resolve({ data: mockTags })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(SeriesView)
    await flushPromises()

    // Check that series are rendered
    expect(wrapper.text()).toContain('Desert Storm')
    expect(wrapper.text()).toContain('A drama')
    expect(wrapper.text()).toContain('City Lights')
    expect(wrapper.text()).toContain('A comedy')

    // Check status badges
    expect(wrapper.text()).toContain('draft')
    expect(wrapper.text()).toContain('published')

    // Check pricing info
    expect(wrapper.text()).toContain('3 free')
    expect(wrapper.text()).toContain('10 coins/ep')
    expect(wrapper.text()).toContain('2 free')
    expect(wrapper.text()).toContain('5 coins/ep')

    // Check API was called
    expect(api.get).toHaveBeenCalledWith('/api/series', expect.objectContaining({
      params: expect.objectContaining({
        page: 1,
        per_page: 20,
        sort: 'created_at',
      }),
    }))
  })

  it('shows empty state when no series', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/series') {
        return Promise.resolve({ data: { items: [], total: 0, page: 1, per_page: 20 } })
      }
      if (url === '/api/tags') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(SeriesView)
    await flushPromises()

    expect(wrapper.text()).toContain('No series found')
    expect(wrapper.text()).toContain('Get started by creating your first series')
    expect(wrapper.text()).toContain('Create your first series')
  })

  it('search input filters series', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/series') {
        return Promise.resolve({ data: mockSeriesResponse })
      }
      if (url === '/api/tags') {
        return Promise.resolve({ data: mockTags })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(SeriesView)
    await flushPromises()

    // Clear previous calls
    vi.clearAllMocks()

    // Type in search input
    const searchInput = wrapper.find('input[placeholder="Search series..."]')
    await searchInput.setValue('Desert')

    // Advance timers to trigger debounced search
    vi.advanceTimersByTime(300)
    await flushPromises()

    // Verify API was called with search param
    expect(api.get).toHaveBeenCalledWith('/api/series', expect.objectContaining({
      params: expect.objectContaining({
        search: 'Desert',
        page: 1,
      }),
    }))
  })

  it('create button exists and has correct link', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/series') {
        return Promise.resolve({ data: mockSeriesResponse })
      }
      if (url === '/api/tags') {
        return Promise.resolve({ data: mockTags })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(SeriesView)
    await flushPromises()

    // Find create button
    const createButton = wrapper.find('button:has(.h-4.w-4)')
    expect(createButton.text()).toContain('Create Series')
  })

  it('pagination controls work', async () => {
    const multiPageResponse = {
      items: mockSeriesResponse.items,
      total: 50,
      page: 1,  // Start at page 1 (component state starts at 1)
      per_page: 20,
    }

    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/series') {
        return Promise.resolve({ data: multiPageResponse })
      }
      if (url === '/api/tags') {
        return Promise.resolve({ data: mockTags })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(SeriesView)
    await flushPromises()

    // Check pagination info (50 total, 20 per page = 3 pages)
    expect(wrapper.text()).toContain('Page 1 of 3')

    // Check both buttons exist
    const prevButton = wrapper.findAll('button').find(btn => btn.text() === 'Previous')
    const nextButton = wrapper.findAll('button').find(btn => btn.text() === 'Next')

    // On page 1, previous should be disabled, next should be enabled
    expect(prevButton?.attributes('disabled')).toBeDefined()
    expect(nextButton?.attributes('disabled')).toBeUndefined()

    // Clear previous calls
    vi.clearAllMocks()

    // Click next button to go to page 2
    await nextButton?.trigger('click')
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/api/series', expect.objectContaining({
      params: expect.objectContaining({
        page: 2,
      }),
    }))
  })

  it('status filter works', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/series') {
        return Promise.resolve({ data: mockSeriesResponse })
      }
      if (url === '/api/tags') {
        return Promise.resolve({ data: mockTags })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(SeriesView)
    await flushPromises()

    // Clear previous calls
    vi.clearAllMocks()

    // Change status filter
    const statusSelect = wrapper.findAll('select')[0]!
    await statusSelect.setValue('published')
    await flushPromises()

    // Verify API was called with status param
    expect(api.get).toHaveBeenCalledWith('/api/series', expect.objectContaining({
      params: expect.objectContaining({
        status: 'published',
        page: 1,
      }),
    }))
  })

  it('tag filter works', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/series') {
        return Promise.resolve({ data: mockSeriesResponse })
      }
      if (url === '/api/tags') {
        return Promise.resolve({ data: mockTags })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(SeriesView)
    await flushPromises()

    // Clear previous calls
    vi.clearAllMocks()

    // Change tag filter
    const tagSelect = wrapper.findAll('select')[1]!
    await tagSelect.setValue('t1')
    await flushPromises()

    // Verify API was called with tag param
    expect(api.get).toHaveBeenCalledWith('/api/series', expect.objectContaining({
      params: expect.objectContaining({
        tag: 't1',
        page: 1,
      }),
    }))
  })

  it('handles API errors gracefully', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/series') {
        return Promise.reject({
          response: { data: { detail: 'Failed to load series' } },
        })
      }
      if (url === '/api/tags') {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(SeriesView)
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load series')
  })
})