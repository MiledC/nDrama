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

describe('Episode Lock Indicators', () => {
  const routes = [
    { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/series', name: 'series', component: { template: '<div>Series</div>' } },
    { path: '/series/:id', name: 'series-detail', component: SeriesDetailView },
    { path: '/series/:id/edit', name: 'series-edit', component: { template: '<div>Edit</div>' } },
    { path: '/series/:seriesId/episodes/create', name: 'episode-create', component: { template: '<div>Create</div>' } },
    { path: '/series/:seriesId/episodes/:id/edit', name: 'episode-edit', component: { template: '<div>Edit Episode</div>' } },
  ]

  const authState = {
    auth: {
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', is_active: true },
    },
  }

  function makeSeries(overrides = {}) {
    return {
      id: 's1',
      title: 'Test Series',
      description: 'A test series',
      thumbnail_url: null,
      status: 'published',
      free_episode_count: 2,
      coin_cost_per_episode: 10,
      tags: [],
      created_at: '2026-01-01T00:00:00Z',
      ...overrides,
    }
  }

  function makeEpisodes(episodes: Array<{ episode_number: number; title: string }>) {
    return {
      items: episodes.map((ep, i) => ({
        id: `e${i + 1}`,
        series_id: 's1',
        title: ep.title,
        description: null,
        episode_number: ep.episode_number,
        thumbnail_url: null,
        status: 'published',
        video_provider: null,
        video_playback_id: null,
        duration_seconds: null,
        created_at: '2026-01-01T00:00:00Z',
      })),
      total: episodes.length,
      page: 1,
      per_page: 50,
    }
  }

  function setupMocks(series: ReturnType<typeof makeSeries>, episodes: ReturnType<typeof makeEpisodes>) {
    vi.mocked(api.get).mockImplementation((url) => {
      if ((url as string).match(/\/api\/series\/[^/]+\/episodes/)) {
        return Promise.resolve({ data: episodes })
      }
      if ((url as string).match(/\/api\/series\//)) {
        return Promise.resolve({ data: series })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('free episode shows "Free" badge with green class', async () => {
    const series = makeSeries({ free_episode_count: 2, coin_cost_per_episode: 10 })
    const episodes = makeEpisodes([
      { episode_number: 1, title: 'Ep 1' },
      { episode_number: 2, title: 'Ep 2' },
      { episode_number: 3, title: 'Ep 3' },
    ])
    setupMocks(series, episodes)

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: authState,
    })
    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    const badge = wrapper.find('[data-testid="episode-1-access"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Free')
    expect(badge.classes().join(' ')).toContain('bg-emerald-50')
    expect(badge.classes().join(' ')).toContain('text-emerald-700')
  })

  it('locked episode shows coin cost badge with amber class', async () => {
    const series = makeSeries({ free_episode_count: 2, coin_cost_per_episode: 10 })
    const episodes = makeEpisodes([
      { episode_number: 1, title: 'Ep 1' },
      { episode_number: 2, title: 'Ep 2' },
      { episode_number: 3, title: 'Ep 3' },
    ])
    setupMocks(series, episodes)

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: authState,
    })
    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    const badge = wrapper.find('[data-testid="episode-3-access"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('10 coins')
    expect(badge.classes().join(' ')).toContain('bg-amber-50')
    expect(badge.classes().join(' ')).toContain('text-amber-700')
  })

  it('boundary episode (number == free_count) shows "Free" badge', async () => {
    const series = makeSeries({ free_episode_count: 2, coin_cost_per_episode: 10 })
    const episodes = makeEpisodes([
      { episode_number: 1, title: 'Ep 1' },
      { episode_number: 2, title: 'Ep 2' },
      { episode_number: 3, title: 'Ep 3' },
    ])
    setupMocks(series, episodes)

    const wrapper = mountWithPlugins(SeriesDetailView, {
      routes,
      initialState: authState,
    })
    await wrapper.vm.$router.push('/series/s1')
    await flushPromises()

    const badge = wrapper.find('[data-testid="episode-2-access"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Free')
    expect(badge.classes().join(' ')).toContain('bg-emerald-50')
  })
})
