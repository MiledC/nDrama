import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithPlugins } from '../helpers'
import EpisodeForm from '../../components/episodes/EpisodeForm.vue'

// Mock the API module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('EpisodeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty form in create mode', () => {
    const wrapper = mountWithPlugins(EpisodeForm, {
      props: {
        seriesId: 's1',
      },
    })

    // Check form fields exist
    expect(wrapper.find('#ep-title').exists()).toBe(true)
    expect(wrapper.find('#ep-description').exists()).toBe(true)
    expect(wrapper.find('#ep-number').exists()).toBe(true)
    expect(wrapper.find('#ep-status').exists()).toBe(true)

    // Title should be empty
    const titleInput = wrapper.find('#ep-title')
    expect((titleInput.element as HTMLInputElement).value).toBe('')

    // Should show info about video upload
    expect(wrapper.text()).toContain('Video upload will be available after creating the episode')
  })

  it('renders prefilled form in edit mode', async () => {
    const initialData = {
      title: 'Existing Episode',
      description: 'An existing description',
      episode_number: 5,
      status: 'published' as const,
      thumbnail_url: 'https://example.com/thumb.jpg',
    }

    const wrapper = mountWithPlugins(EpisodeForm, {
      props: {
        seriesId: 's1',
        episodeId: 'e1',
        initialData,
      },
    })

    await flushPromises()

    // Check fields are populated
    const titleInput = wrapper.find('#ep-title')
    expect((titleInput.element as HTMLInputElement).value).toBe('Existing Episode')

    const descInput = wrapper.find('#ep-description')
    expect((descInput.element as HTMLTextAreaElement).value).toBe('An existing description')

    const numberInput = wrapper.find('#ep-number')
    expect((numberInput.element as HTMLInputElement).value).toBe('5')

    const statusSelect = wrapper.find('#ep-status')
    expect((statusSelect.element as HTMLSelectElement).value).toBe('published')
  })

  it('validates required title', async () => {
    const wrapper = mountWithPlugins(EpisodeForm, {
      props: {
        seriesId: 's1',
      },
    })

    // Submit with empty title
    const form = wrapper.find('form')
    await form.trigger('submit')

    // Should show error
    expect(wrapper.text()).toContain('Title is required')
    // Should NOT emit submit
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits submit with form data', async () => {
    const wrapper = mountWithPlugins(EpisodeForm, {
      props: {
        seriesId: 's1',
      },
    })

    // Fill in form
    await wrapper.find('#ep-title').setValue('New Episode')
    await wrapper.find('#ep-description').setValue('A description')
    await wrapper.find('#ep-number').setValue(3)

    // Submit
    await wrapper.find('form').trigger('submit')

    // Should emit with data
    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeDefined()
    expect(emitted).not.toBeUndefined()
    if (emitted) {
      expect(emitted[0][0]).toEqual(
        expect.objectContaining({
          title: 'New Episode',
          description: 'A description',
          episode_number: 3,
          status: 'draft',
        })
      )
    }
  })

  it('emits cancel event', async () => {
    const wrapper = mountWithPlugins(EpisodeForm, {
      props: {
        seriesId: 's1',
      },
    })

    // Click cancel button
    const cancelButton = wrapper.findAll('button').find(btn => btn.text() === 'Cancel')
    await cancelButton!.trigger('click')

    expect(wrapper.emitted('cancel')).toBeDefined()
  })

  it('shows video upload area in edit mode', () => {
    const wrapper = mountWithPlugins(EpisodeForm, {
      props: {
        seriesId: 's1',
        episodeId: 'e1',
        initialData: {
          title: 'Episode',
          status: 'draft' as const,
        },
      },
    })

    // Should show video upload area
    expect(wrapper.text()).toContain('Click to select a video file')
    expect(wrapper.text()).toContain('Max 2GB')
  })

  it('shows character count for description', async () => {
    const wrapper = mountWithPlugins(EpisodeForm, {
      props: {
        seriesId: 's1',
      },
    })

    // Initially 0/2000
    expect(wrapper.text()).toContain('0/2000 characters')

    // Type something
    await wrapper.find('#ep-description').setValue('Hello')

    expect(wrapper.text()).toContain('5/2000 characters')
  })

  it('disabled submit button when loading', () => {
    const wrapper = mountWithPlugins(EpisodeForm, {
      props: {
        seriesId: 's1',
        isLoading: true,
      },
    })

    const submitButton = wrapper.findAll('button').find(btn => btn.text().includes('Saving'))
    expect(submitButton).toBeDefined()
    expect(submitButton!.attributes('disabled')).toBeDefined()
  })
})
