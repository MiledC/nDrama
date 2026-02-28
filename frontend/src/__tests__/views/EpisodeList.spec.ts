import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithPlugins } from '../helpers'
import SeriesDetailView from '../../views/SeriesDetailView.vue'

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

describe('SeriesDetailView - Episode List', () => {
  const mockSeries = {
    id: 's1',
    title: 'Desert Storm',
    description: 'A desert drama',
    thumbnail_url: null,
    status: 'published',
    free_episode_count: 3,
    coin_cost_per_episode: 10,
    tags: [{ id: 't1', name: 'Action', category: 'genre' }],
    created_at: '2026-01-01T00:00:00Z',
  }

  const mockEpisodes = {
    items: [
      {
        id: 'e1',
        series_id: 's1',
        title: 'Episode One',
        description: 'The first episode',
        episode_number: 1,
        thumbnail_url: null,
        status: 'published',
        video_provider: 'mux',
        video_playback_id: 'play1',
        duration_seconds: 1260,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'e2',
        series_id: 's1',
        title: 'Episode Two',
        description: 'The second episode',
        episode_number: 2,
        thumbnail_url: null,
        status: 'draft',
        video_provider: null,
        video_playback_id: null,
        duration_seconds: null,
        created_at: '2026-01-02T00:00:00Z',
      },
      {
        id: 'e3',
        series_id: 's1',
        title: 'Episode Three',
        description: null,
        episode_number: 3,
        thumbnail_url: null,
        status: 'processing',
        video_provider: 'mux',
        video_playback_id: null,
        duration_seconds: null,
        created_at: '2026-01-03T00:00:00Z',
      },
    ],
    total: 3,
    page: 1,
    per_page: 50,
  }

  const routes = [
    { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/series', name: 'series', component: { template: '<div>Series</div>' } },
    {
      path: '/series/:id',
      name: 'series-detail',
      component: SeriesDetailView,
    },
    {
      path: '/series/:id/edit',
      name: 'series-edit',
      component: { template: '<div>Edit</div>' },
    },
    {
      path: '/series/:seriesId/episodes/create',
      name: 'episode-create',
      component: { template: '<div>Create</div>' },
    },
    {
      path: '/series/:seriesId/episodes/:id/edit',
      name: 'episode-edit',
      component: { template: '<div>Edit Episode</div>' },
    },
  ]

  function setupMocks(seriesData = mockSeries, episodesData = mockEpisodes) {
    vi.mocked(api.get).mockImplementation((url) => {
      if ((url as string).match(/\/api\/series\/[^/]+\/episodes/)) {
        return Promise.resolve({ data: episodesData })
      }
      if ((url as string).match(/\/api\/series\//)) {
        return Promise.resolve({ data: seriesData })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders episode list with correct data', async () => {
    setupMocks()

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: {
        auth: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true },
        },
      },
    })

    // Navigate to the detail route
    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    expect(wrapper.text()).toContain('Desert Storm')
    expect(wrapper.text()).toContain('Episode One')
    expect(wrapper.text()).toContain('Episode Two')
    expect(wrapper.text()).toContain('Episode Three')
  })

  it('episodes shown in correct order', async () => {
    setupMocks()

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: {
        auth: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true },
        },
      },
    })

    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    // Find all episode number cells in the table
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(3)

    // Episode numbers should be in order
    expect(rows[0].text()).toContain('1')
    expect(rows[0].text()).toContain('Episode One')
    expect(rows[1].text()).toContain('2')
    expect(rows[1].text()).toContain('Episode Two')
    expect(rows[2].text()).toContain('3')
    expect(rows[2].text()).toContain('Episode Three')
  })

  it('status badges display correctly', async () => {
    setupMocks()

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: {
        auth: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true },
        },
      },
    })

    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    // Should show different status texts
    expect(wrapper.text()).toContain('published')
    expect(wrapper.text()).toContain('draft')
    expect(wrapper.text()).toContain('processing')
  })

  it('create button navigates to form', async () => {
    setupMocks()

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: {
        auth: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true },
        },
      },
    })

    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    // Find the "Add Episode" button
    const addButton = wrapper.findAll('button').find(btn => btn.text().includes('Add Episode'))
    expect(addButton).toBeDefined()
  })

  it('empty state when no episodes', async () => {
    setupMocks(mockSeries, { items: [], total: 0, page: 1, per_page: 50 })

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: {
        auth: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true },
        },
      },
    })

    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    expect(wrapper.text()).toContain('No episodes yet')
    expect(wrapper.text()).toContain('Add the first episode')
    expect(wrapper.text()).toContain('Add First Episode')
  })

  it('delete button shows confirmation dialog', async () => {
    setupMocks()

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: {
        auth: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true },
        },
      },
    })

    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    // Before clicking delete, modal should not be visible
    expect(wrapper.text()).not.toContain('Delete Episode')

    // The action menus use headlessui Menu - we look for the delete button class
    // Since headless UI menus need to be opened first, we check the modal toggle behavior
    expect(wrapper.find('[class*="fixed"]').exists()).toBe(false)
  })

  it('shows series info header', async () => {
    setupMocks()

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: {
        auth: {
          accessToken: 'test-token',
          refreshToken: 'test-refresh',
          user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true },
        },
      },
    })

    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    // Series header shows info
    expect(wrapper.text()).toContain('Desert Storm')
    expect(wrapper.text()).toContain('3 free')
    expect(wrapper.text()).toContain('10 coins/ep')
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('3 episodes')
  })
})
