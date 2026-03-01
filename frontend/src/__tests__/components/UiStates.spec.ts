import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton.vue'
import ErrorState from '../../components/ui/ErrorState.vue'
import EmptyState from '../../components/ui/EmptyState.vue'
import ConfirmDialog from '../../components/ui/ConfirmDialog.vue'
import Toast from '../../components/ui/Toast.vue'
import { useToastStore } from '../../stores/toast'

describe('LoadingSkeleton', () => {
  it('renders card variant', () => {
    const wrapper = mount(LoadingSkeleton, {
      props: { variant: 'card', count: 2 },
    })
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
    // Should render 2 card skeletons
    expect(wrapper.findAll('.rounded-xl').length).toBe(2)
  })

  it('renders row variant', () => {
    const wrapper = mount(LoadingSkeleton, {
      props: { variant: 'row', count: 3 },
    })
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders text variant by default', () => {
    const wrapper = mount(LoadingSkeleton, {
      props: { count: 4 },
    })
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})

describe('ErrorState', () => {
  it('renders with message and retry button', () => {
    const wrapper = mount(ErrorState, {
      props: { message: 'Something went wrong' },
    })
    expect(wrapper.text()).toContain('Something went wrong')
    expect(wrapper.text()).toContain('Retry')
  })

  it('emits retry event on button click', async () => {
    const wrapper = mount(ErrorState, {
      props: { message: 'Error occurred' },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })
})

describe('EmptyState', () => {
  it('renders with title and description', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'Nothing here',
        description: 'Create something to get started',
      },
    })
    expect(wrapper.text()).toContain('Nothing here')
    expect(wrapper.text()).toContain('Create something to get started')
  })

  it('renders action button when actionLabel provided', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No items',
        actionLabel: 'Create New',
      },
    })
    expect(wrapper.text()).toContain('Create New')
  })

  it('emits action event on button click', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: 'No items',
        actionLabel: 'Create New',
      },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })
})

describe('ConfirmDialog', () => {
  it('renders when open', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        open: true,
        title: 'Delete Item',
        message: 'Are you sure?',
        confirmLabel: 'Delete',
      },
    })
    expect(wrapper.text()).toContain('Delete Item')
    expect(wrapper.text()).toContain('Are you sure?')
    expect(wrapper.text()).toContain('Delete')
    expect(wrapper.text()).toContain('Cancel')
  })

  it('does not render when closed', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        open: false,
        title: 'Delete Item',
        message: 'Are you sure?',
      },
    })
    expect(wrapper.text()).not.toContain('Delete Item')
  })

  it('emits confirm and cancel events', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        open: true,
        title: 'Confirm',
        message: 'Proceed?',
        confirmLabel: 'Yes',
        cancelLabel: 'No',
      },
    })

    const buttons = wrapper.findAll('button')
    const cancelBtn = buttons.find(b => b.text() === 'No')!
    const confirmBtn = buttons.find(b => b.text() === 'Yes')!

    await cancelBtn.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()

    await confirmBtn.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('shows error message when provided', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        open: true,
        title: 'Delete',
        message: 'Are you sure?',
        error: 'Failed to delete',
      },
    })
    expect(wrapper.text()).toContain('Failed to delete')
  })
})

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renders toast notifications', () => {
    const pinia = createPinia()
    mount(Toast, {
      global: { plugins: [pinia] },
    })

    const store = useToastStore()
    store.success('Item saved')

    expect(store.toasts).toHaveLength(1)
    expect(store.toasts[0]!.type).toBe('success')
    expect(store.toasts[0]!.message).toBe('Item saved')
  })

  it('auto-dismisses after 4 seconds', () => {
    const pinia = createPinia()
    mount(Toast, {
      global: { plugins: [pinia] },
    })

    const store = useToastStore()
    store.success('Temporary message')
    expect(store.toasts.length).toBe(1)

    vi.advanceTimersByTime(4000)
    expect(store.toasts.length).toBe(0)
  })

  it('supports all notification types', () => {
    const pinia = createPinia()
    mount(Toast, {
      global: { plugins: [pinia] },
    })

    const store = useToastStore()
    store.success('Success')
    store.error('Error')
    store.warning('Warning')
    store.info('Info')

    expect(store.toasts.length).toBe(4)
    expect(store.toasts.map(t => t.type)).toEqual(['success', 'error', 'warning', 'info'])
  })

  it('remove function works', () => {
    const pinia = createPinia()
    mount(Toast, {
      global: { plugins: [pinia] },
    })

    const store = useToastStore()
    store.success('To be removed')
    const id = store.toasts[0]!.id
    store.remove(id)
    expect(store.toasts).toHaveLength(0)
  })
})
