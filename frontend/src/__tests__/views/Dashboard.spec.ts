import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithPlugins } from '../helpers'
import DashboardView from '../../views/DashboardView.vue'

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

import api from '../../lib/api'

describe('DashboardView', () => {
  const mockStats = {
    series_count: 12,
    episode_count: 48,
    user_count: 5,
    published_series_count: 8,
  }

  const mockRecent = {
    series: [
      {
        id: '1',
        title: 'Desert Storm',
        status: 'published',
        thumbnail_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-02-28T12:00:00Z',
      },
      {
        id: '2',
        title: 'City Lights',
        status: 'draft',
        thumbnail_url: null,
        created_at: '2026-01-02T00:00:00Z',
        updated_at: '2026-02-27T12:00:00Z',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders stat cards with counts', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/stats')) {
        return Promise.resolve({ data: mockStats })
      }
      if (typeof url === 'string' && url.includes('/recent')) {
        return Promise.resolve({ data: mockRecent })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(DashboardView)
    await flushPromises()

    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('48')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('Total Series')
    expect(wrapper.text()).toContain('Total Episodes')
    expect(wrapper.text()).toContain('Users')
    expect(wrapper.text()).toContain('Published')
  })

  it('renders recent series list', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/stats')) {
        return Promise.resolve({ data: mockStats })
      }
      if (typeof url === 'string' && url.includes('/recent')) {
        return Promise.resolve({ data: mockRecent })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(DashboardView)
    await flushPromises()

    expect(wrapper.text()).toContain('Desert Storm')
    expect(wrapper.text()).toContain('City Lights')
    expect(wrapper.text()).toContain('published')
    expect(wrapper.text()).toContain('draft')
  })

  it('quick action buttons exist', async () => {
    vi.mocked(api.get).mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/stats')) {
        return Promise.resolve({ data: mockStats })
      }
      if (typeof url === 'string' && url.includes('/recent')) {
        return Promise.resolve({ data: mockRecent })
      }
      return Promise.reject(new Error('Unknown URL'))
    })

    const wrapper = mountWithPlugins(DashboardView)
    await flushPromises()

    expect(wrapper.text()).toContain('Create Series')
    expect(wrapper.text()).toContain('Manage Tags')
  })

  it('shows loading state while fetching', () => {
    // Mock APIs that never resolve
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}))

    const wrapper = mountWithPlugins(DashboardView)

    // Should show skeleton (animate-pulse elements)
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('shows error state on API failure', async () => {
    vi.mocked(api.get).mockRejectedValue({
      response: { data: { detail: 'Server error' } },
    })

    const wrapper = mountWithPlugins(DashboardView)
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load dashboard')
  })
})
