import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithPlugins } from '../helpers'
import SeriesForm from '../../components/series/SeriesForm.vue'

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

describe('PricingConfig', () => {
  const mockTags = [
    { id: 't1', name: 'Action', category: 'genre', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.FileReader = class {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null
      result: string = 'data:image/jpeg;base64,fake'
      readAsDataURL = vi.fn()
    } as unknown as typeof FileReader
  })

  it('renders pricing fields', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    const freeEpisodesInput = wrapper.find('input#free-episodes')
    expect(freeEpisodesInput.exists()).toBe(true)

    const coinCostInput = wrapper.find('input#coin-cost')
    expect(coinCostInput.exists()).toBe(true)
  })

  it('prefills pricing values in edit mode', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm, {
      props: {
        initialData: {
          title: 'Test',
          free_episode_count: 7,
          coin_cost_per_episode: 25,
        },
      },
    })
    await flushPromises()

    const freeEpisodesInput = wrapper.find('input#free-episodes')
    expect((freeEpisodesInput.element as HTMLInputElement).value).toBe('7')

    const coinCostInput = wrapper.find('input#coin-cost')
    expect((coinCostInput.element as HTMLInputElement).value).toBe('25')
  })

  it('submit includes pricing data in emitted event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    await wrapper.find('input#title').setValue('Priced Series')
    await wrapper.find('input#free-episodes').setValue('4')
    await wrapper.find('input#coin-cost').setValue('20')

    await wrapper.find('form').trigger('submit')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeDefined()
    expect(emitted?.[0]?.[0]).toMatchObject({
      free_episode_count: 4,
      coin_cost_per_episode: 20,
    })
  })

  it('inputs have min=0 validation', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    const freeEpisodesInput = wrapper.find('input#free-episodes')
    expect(freeEpisodesInput.attributes('min')).toBe('0')

    const coinCostInput = wrapper.find('input#coin-cost')
    expect(coinCostInput.attributes('min')).toBe('0')
  })

  it('shows pricing preview summary', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    const preview = wrapper.find('[data-testid="pricing-preview"]')
    expect(preview.exists()).toBe(true)

    // Default values (0 free, 0 cost) → "All episodes are free"
    expect(preview.text()).toBe('All episodes are free')

    // Set free count and cost
    await wrapper.find('input#free-episodes').setValue('3')
    await wrapper.find('input#coin-cost').setValue('10')

    expect(preview.text()).toBe('First 3 episodes free, then 10 coins each')
  })
})
