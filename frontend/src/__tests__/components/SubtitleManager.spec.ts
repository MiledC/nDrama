import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SubtitleManager from '../../components/episodes/SubtitleManager.vue'
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

describe('SubtitleManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: { items: [], total: 0 } } as never)
  })

  it('renders subtitle list with format badges', async () => {
    mockGet.mockResolvedValue({
      data: {
        items: [
          {
            id: 's1',
            episode_id: 'ep1',
            language_code: 'ar',
            label: 'Arabic',
            file_url: 'http://s3/ar.vtt',
            format: 'vtt',
            is_default: true,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          {
            id: 's2',
            episode_id: 'ep1',
            language_code: 'en',
            label: 'English',
            file_url: 'http://s3/en.srt',
            format: 'srt',
            is_default: false,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        total: 2,
      },
    } as never)

    const wrapper = mount(SubtitleManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Arabic')
    expect(wrapper.text()).toContain('English')
    expect(wrapper.text()).toContain('vtt')
    expect(wrapper.text()).toContain('srt')
    expect(wrapper.text()).toContain('Default')
    expect(wrapper.text()).toContain('(2)')
  })

  it('uploads SRT subtitle file', async () => {
    mockPost.mockResolvedValue({ data: { id: 's-new' } } as never)
    mockGet
      .mockResolvedValueOnce({ data: { items: [], total: 0 } } as never)
      .mockResolvedValueOnce({ data: { items: [{ id: 's-new' }], total: 1 } } as never)

    const wrapper = mount(SubtitleManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    const file = new File(['1\n00:00:00,000 --> 00:00:01,000\nHello'], 'subs.srt', {
      type: 'application/x-subrip',
    })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    const uploadBtn = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    expect(uploadBtn).toBeDefined()
    await uploadBtn!.trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledOnce()
    const callArgs = mockPost.mock.calls[0]
    expect(callArgs[0]).toBe('/api/episodes/ep1/subtitles')
    expect(callArgs[1]).toBeInstanceOf(FormData)
  })

  it('uploads VTT subtitle file', async () => {
    mockPost.mockResolvedValue({ data: { id: 's-new' } } as never)
    mockGet
      .mockResolvedValueOnce({ data: { items: [], total: 0 } } as never)
      .mockResolvedValueOnce({ data: { items: [{ id: 's-new' }], total: 1 } } as never)

    const wrapper = mount(SubtitleManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    const file = new File(['WEBVTT\n\n00:00.000 --> 00:01.000\nHello'], 'subs.vtt', {
      type: 'text/vtt',
    })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await flushPromises()

    const uploadBtn = wrapper.findAll('button').find((b) => b.text().includes('Upload'))
    expect(uploadBtn).toBeDefined()
    await uploadBtn!.trigger('click')
    await flushPromises()

    expect(mockPost).toHaveBeenCalledOnce()
    const callArgs = mockPost.mock.calls[0]
    expect(callArgs[0]).toBe('/api/episodes/ep1/subtitles')
    expect(callArgs[1]).toBeInstanceOf(FormData)
  })

  it('sets default subtitle via star button', async () => {
    mockGet.mockResolvedValue({
      data: {
        items: [
          {
            id: 's1',
            episode_id: 'ep1',
            language_code: 'en',
            label: 'English',
            file_url: 'http://s3/en.vtt',
            format: 'vtt',
            is_default: false,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
      },
    } as never)
    mockPatch.mockResolvedValue({ data: {} } as never)

    const wrapper = mount(SubtitleManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    const starBtn = wrapper.find('button[title="Set as default"]')
    expect(starBtn.exists()).toBe(true)
    await starBtn.trigger('click')
    await flushPromises()

    expect(mockPatch).toHaveBeenCalledWith('/api/subtitles/s1', {
      is_default: true,
    })
  })

  it('deletes subtitle with two-click confirmation', async () => {
    mockGet.mockResolvedValue({
      data: {
        items: [
          {
            id: 's1',
            episode_id: 'ep1',
            language_code: 'en',
            label: 'English',
            file_url: 'http://s3/en.vtt',
            format: 'vtt',
            is_default: false,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
      },
    } as never)
    mockDelete.mockResolvedValue({} as never)

    const wrapper = mount(SubtitleManager, {
      props: { episodeId: 'ep1' },
    })
    await flushPromises()

    const trashBtn = wrapper.find('button[title="Delete subtitle"]')
    expect(trashBtn.exists()).toBe(true)
    await trashBtn.trigger('click')
    await flushPromises()

    const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Confirm')
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')
    await flushPromises()

    expect(mockDelete).toHaveBeenCalledWith('/api/subtitles/s1')
  })
})
