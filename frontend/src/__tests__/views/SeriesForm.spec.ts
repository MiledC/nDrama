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

describe('SeriesForm', () => {
  const mockTags = [
    { id: 't1', name: 'Action', category: 'genre', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 't2', name: 'Comedy', category: 'genre', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 't3', name: 'Happy', category: 'mood', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 't4', name: 'English', category: 'language', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 't5', name: 'Other Tag', category: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock FileReader as a class
    globalThis.FileReader = class {
      onload: ((e: ProgressEvent<FileReader>) => void) | null = null
      result: string = 'data:image/jpeg;base64,fake'
      readAsDataURL = vi.fn()
    } as unknown as typeof FileReader
  })

  it('renders empty form for create mode', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    // Check form fields are empty
    const titleInput = wrapper.find('input#title')
    expect((titleInput.element as HTMLInputElement).value).toBe('')

    const descriptionTextarea = wrapper.find('textarea#description')
    expect((descriptionTextarea.element as HTMLTextAreaElement).value).toBe('')

    const statusSelect = wrapper.find('select#status')
    expect((statusSelect.element as HTMLSelectElement).value).toBe('draft')

    const freeEpisodesInput = wrapper.find('input#free-episodes')
    expect((freeEpisodesInput.element as HTMLInputElement).value).toBe('0')

    const coinCostInput = wrapper.find('input#coin-cost')
    expect((coinCostInput.element as HTMLInputElement).value).toBe('0')

    // Check tags are loaded and displayed
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Comedy')
    expect(wrapper.text()).toContain('Happy')
    expect(wrapper.text()).toContain('English')
    expect(wrapper.text()).toContain('Other Tag')

    // Check categories are shown
    expect(wrapper.text()).toContain('Genre')
    expect(wrapper.text()).toContain('Mood')
    expect(wrapper.text()).toContain('Language')
    expect(wrapper.text()).toContain('Other')
  })

  it('renders prefilled form for edit mode', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const initialData = {
      title: 'Existing Series',
      description: 'Existing description',
      status: 'published' as const,
      thumbnail_url: 'https://example.com/thumb.jpg',
      free_episode_count: 5,
      coin_cost_per_episode: 15,
      tag_ids: ['t1', 't3'],
    }

    const wrapper = mountWithPlugins(SeriesForm, {
      props: { initialData },
    })
    await flushPromises()

    // Check form fields are prefilled
    const titleInput = wrapper.find('input#title')
    expect((titleInput.element as HTMLInputElement).value).toBe('Existing Series')

    const descriptionTextarea = wrapper.find('textarea#description')
    expect((descriptionTextarea.element as HTMLTextAreaElement).value).toBe('Existing description')

    const statusSelect = wrapper.find('select#status')
    expect((statusSelect.element as HTMLSelectElement).value).toBe('published')

    const freeEpisodesInput = wrapper.find('input#free-episodes')
    expect((freeEpisodesInput.element as HTMLInputElement).value).toBe('5')

    const coinCostInput = wrapper.find('input#coin-cost')
    expect((coinCostInput.element as HTMLInputElement).value).toBe('15')

    // Check selected tags count
    expect(wrapper.text()).toContain('2 tags selected')
  })

  it('tag picker shows tags and allows selection', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    // Initially no tags selected
    expect(wrapper.text()).toContain('0 tags selected')

    // Click on Action tag
    const actionTag = wrapper.findAll('button[type="button"]').find(btn => btn.text() === 'Action')
    await actionTag?.trigger('click')

    // Should show 1 tag selected
    expect(wrapper.text()).toContain('1 tag selected')

    // Click on Happy tag
    const happyTag = wrapper.findAll('button[type="button"]').find(btn => btn.text() === 'Happy')
    await happyTag?.trigger('click')

    // Should show 2 tags selected
    expect(wrapper.text()).toContain('2 tags selected')

    // Click Action again to deselect
    await actionTag?.trigger('click')

    // Should show 1 tag selected
    expect(wrapper.text()).toContain('1 tag selected')
  })

  it('validation shows error for empty title', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    // Submit form without filling title
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should show validation error
    expect(wrapper.text()).toContain('Title is required')

    // Should not emit submit event
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('submit emits data', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    // Fill form
    const titleInput = wrapper.find('input#title')
    await titleInput.setValue('New Series')

    const descriptionTextarea = wrapper.find('textarea#description')
    await descriptionTextarea.setValue('Series description')

    const statusSelect = wrapper.find('select#status')
    await statusSelect.setValue('published')

    const freeEpisodesInput = wrapper.find('input#free-episodes')
    await freeEpisodesInput.setValue('3')

    const coinCostInput = wrapper.find('input#coin-cost')
    await coinCostInput.setValue('10')

    // Select some tags
    const actionTag = wrapper.findAll('button[type="button"]').find(btn => btn.text() === 'Action')
    await actionTag?.trigger('click')

    const happyTag = wrapper.findAll('button[type="button"]').find(btn => btn.text() === 'Happy')
    await happyTag?.trigger('click')

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Check emitted data
    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeDefined()
    expect(emitted?.[0]).toEqual([
      {
        title: 'New Series',
        description: 'Series description',
        status: 'published',
        free_episode_count: 3,
        coin_cost_per_episode: 10,
        tag_ids: expect.arrayContaining(['t1', 't3']),
      },
    ])
  })

  it('cancel button emits cancel event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    // Click cancel button
    const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancel')
    await cancelButton?.trigger('click')

    // Check cancel event was emitted
    expect(wrapper.emitted('cancel')).toBeDefined()
  })

  it('handles thumbnail upload', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })
    vi.mocked(api.post).mockResolvedValue({ data: { url: 'https://example.com/uploaded.jpg' } })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    // Create a mock file
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })

    // Find file input and trigger change
    const fileInput = wrapper.find('input[type="file"]')
    const input = fileInput.element as HTMLInputElement

    // Mock file input
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    })

    // Trigger file selection which will create a FileReader instance
    await fileInput.trigger('change')

    // Wait for async operations
    await flushPromises()

    // Check upload API was called
    expect(api.post).toHaveBeenCalledWith(
      '/api/upload/thumbnail',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  })

  it('shows loading state when isLoading prop is true', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(SeriesForm, {
      props: { isLoading: true },
    })
    await flushPromises()

    // Check save button shows loading text
    const saveButton = wrapper.findAll('button').find(btn => btn.text().includes('Saving...'))
    expect(saveButton).toBeDefined()
    expect(saveButton?.attributes('disabled')).toBeDefined()
  })

  it('handles tag loading error gracefully', async () => {
    vi.mocked(api.get).mockRejectedValue({
      response: { data: { detail: 'Failed to load tags' } },
    })

    const wrapper = mountWithPlugins(SeriesForm)
    await flushPromises()

    // Should show error message
    expect(wrapper.text()).toContain('Failed to load tags')
  })
})