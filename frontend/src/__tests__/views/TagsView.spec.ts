import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountWithPlugins } from '../helpers'
import TagsView from '../../views/TagsView.vue'

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

describe('TagsView', () => {
  const mockTags = [
    { id: '1', name: 'Action', category: 'genre', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: '2', name: 'Happy', category: 'mood', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: '3', name: 'Sad', category: 'mood', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tag list', async () => {
    // Mock API response
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(TagsView)
    await flushPromises()

    // Check that tags are rendered
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Happy')
    expect(wrapper.text()).toContain('Sad')

    // Check category badges
    expect(wrapper.text()).toContain('genre')
    expect(wrapper.text()).toContain('mood')

    // Check API was called
    expect(api.get).toHaveBeenCalledWith('/api/tags')
  })

  it('creates a new tag via form', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })
    vi.mocked(api.post).mockResolvedValue({ data: { id: '4', name: 'Drama', category: 'genre' } })

    const wrapper = mountWithPlugins(TagsView)
    await flushPromises()

    // Click Create button
    const createButton = wrapper.find('button:has(.h-4.w-4)')
    expect(createButton.text()).toContain('Create Tag')
    await createButton.trigger('click')

    // Check modal is shown
    expect(wrapper.text()).toContain('Create Tag')

    // Fill form
    const nameInput = wrapper.find('input[placeholder="Enter tag name"]')
    await nameInput.setValue('Drama')

    const categorySelect = wrapper.findAll('select')[0]!  // First select in the modal
    await categorySelect.setValue('genre')

    // Submit form
    const form = wrapper.find('form')
    await form.trigger('submit')
    await flushPromises()

    // Verify API was called
    expect(api.post).toHaveBeenCalledWith('/api/tags', {
      name: 'Drama',
      category: 'genre',
    })
  })

  it('deletes a tag with confirmation', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })
    vi.mocked(api.delete).mockResolvedValue({ data: {} })

    const wrapper = mountWithPlugins(TagsView)
    await flushPromises()

    // Trigger delete confirmation directly via component (HeadlessUI menus
    // are difficult to interact with in happy-dom test environment)
    const vm = wrapper.vm as unknown as { showDeleteConfirm: boolean; deletingTag: typeof mockTags[0] | null }
    vm.deletingTag = mockTags[0]!
    vm.showDeleteConfirm = true
    await wrapper.vm.$nextTick()

    // Confirm deletion modal should be visible
    expect(wrapper.text()).toContain('Delete Tag')
    expect(wrapper.text()).toContain('Are you sure you want to delete the tag')

    // Find and click confirm button
    const confirmButtons = wrapper.findAll('button').filter(btn => btn.text() === 'Delete Tag')
    expect(confirmButtons.length).toBeGreaterThan(0)
    await confirmButtons[0]!.trigger('click')
    await flushPromises()

    // Verify API was called
    expect(api.delete).toHaveBeenCalledWith('/api/tags/1')
  })

  it('filters tags by category', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockTags })

    const wrapper = mountWithPlugins(TagsView)
    await flushPromises()

    // Initially all tags are shown
    expect(wrapper.text()).toContain('Action')
    expect(wrapper.text()).toContain('Happy')
    expect(wrapper.text()).toContain('Sad')

    // Click mood category tab
    const moodTab = wrapper.findAll('button').find(btn => btn.text().includes('mood'))
    await moodTab?.trigger('click')

    // Only mood tags should be visible in the table
    const tableRows = wrapper.findAll('tbody tr')
    expect(tableRows).toHaveLength(2) // Happy and Sad
    expect(wrapper.find('tbody').text()).toContain('Happy')
    expect(wrapper.find('tbody').text()).toContain('Sad')
    expect(wrapper.find('tbody').text()).not.toContain('Action')
  })

  it('shows empty state when no tags', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })

    const wrapper = mountWithPlugins(TagsView)
    await flushPromises()

    expect(wrapper.text()).toContain('No tags found')
  })

  it('handles API errors gracefully', async () => {
    vi.mocked(api.get).mockRejectedValue({
      response: { data: { detail: 'Failed to fetch tags' } },
    })

    const wrapper = mountWithPlugins(TagsView)
    await flushPromises()

    // The component maps the error to 'Failed to load tags'
    expect(wrapper.text()).toContain('Failed to load tags')
  })
})