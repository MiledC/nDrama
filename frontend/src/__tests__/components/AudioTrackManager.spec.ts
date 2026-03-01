import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AudioTrackManager from '../../components/episodes/AudioTrackManager.vue'
import api from '../../lib/api'

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockGet = vi.mocked(api.get)
const mockPost = vi.mocked(api.post)
const mockPatch = vi.mocked(api.patch)
const mockDelete = vi.mocked(api.delete)

describe('AudioTrackManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { items: [], total: 0 } } as never)
  })

  it('renders audio track list for episode', async () => {
    mockGet.mockResolvedValue({
      data: {
        items: [
          {
            id: 't1',
            episode_id: 'ep1',
            language_code: 'ar',
            label: 'Arabic',
            file_url: 'http://s3/ar.mp3',
            is_default: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          {
            id: 't2',
            episode_id: 'ep1',
            language_code: 'en',
            label: 'English',
            file_url: 'http://s3/en.mp3',
            is_default: false,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        total: 2,
      },
    } as never)

    const wrapper = mount(AudioTrackManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Arabic')
    expect(wrapper.text()).toContain('English')
    expect(wrapper.text()).toContain('ar')
    expect(wrapper.text()).toContain('en')
    expect(wrapper.text()).toContain('Default')
    expect(wrapper.text()).toContain('(2)')
  })

  it('uploads new audio track via file input', async () => {
    mockPost.mockResolvedValue({ data: { id: 't-new' } } as never)
    mockGet
      .mockResolvedValueOnce({ data: { items: [], total: 0 } } as never)
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 't-new',
              episode_id: 'ep1',
              language_code: 'ar',
              label: 'Arabic',
              file_url: 'http://s3/ar.mp3',
              is_default: false,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          total: 1,
        },
      } as never)

    const wrapper = mount(AudioTrackManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    // Simulate file selection
    const file = new File(['fake audio'], 'test.mp3', { type: 'audio/mpeg' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    // Click upload button
    const uploadBtn = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    expect(uploadBtn).toBeDefined()
    await uploadBtn!.trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledOnce()
    const callArgs = mockPost.mock.calls[0]!
    expect(callArgs[0]).toBe('/api/episodes/ep1/audio-tracks')
    expect(callArgs[1]).toBeInstanceOf(FormData)
  })

  it('sets default audio track via star button', async () => {
    mockGet.mockResolvedValue({
      data: {
        items: [
          {
            id: 't1',
            episode_id: 'ep1',
            language_code: 'ar',
            label: 'Arabic',
            file_url: 'http://s3/ar.mp3',
            is_default: false,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
      },
    } as never)
    mockPatch.mockResolvedValue({ data: {} } as never)

    const wrapper = mount(AudioTrackManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    const starBtn = wrapper.find('button[title="Set as default"]')
    expect(starBtn.exists()).toBe(true)
    await starBtn.trigger('click')
    await flushPromises()

    expect(mockPatch).toHaveBeenCalledWith('/api/audio-tracks/t1', {
      is_default: true,
    })
  })

  it('deletes audio track with two-click confirmation', async () => {
    mockGet.mockResolvedValue({
      data: {
        items: [
          {
            id: 't1',
            episode_id: 'ep1',
            language_code: 'ar',
            label: 'Arabic',
            file_url: 'http://s3/ar.mp3',
            is_default: false,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
      },
    } as never)
    mockDelete.mockResolvedValue({} as never)

    const wrapper = mount(AudioTrackManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    // First click: trash icon
    const trashBtn = wrapper.find('button[title="Delete track"]')
    expect(trashBtn.exists()).toBe(true)
    await trashBtn.trigger('click')
    await flushPromises()

    // Second click: confirm
    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Confirm')
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')
    await flushPromises()

    expect(mockDelete).toHaveBeenCalledWith('/api/audio-tracks/t1')
  })

  it('language selector shows 8 language options', async () => {
    const wrapper = mount(AudioTrackManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    // Simulate file selection to make the select visible
    const file = new File(['fake audio'], 'test.mp3', { type: 'audio/mpeg' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    const options = select.findAll('option')
    expect(options.length).toBe(8)

    const optionTexts = options.map((o) => o.text().trim())
    expect(optionTexts).toContain('Arabic')
    expect(optionTexts).toContain('English')
    expect(optionTexts).toContain('French')
    expect(optionTexts).toContain('Spanish')
    expect(optionTexts).toContain('Hindi')
    expect(optionTexts).toContain('Urdu')
    expect(optionTexts).toContain('Turkish')
    expect(optionTexts).toContain('Korean')
  })
})
