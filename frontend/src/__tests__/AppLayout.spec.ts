import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import AppLayout from '../components/layout/AppLayout.vue'
import { createTestRouter } from './helpers'

const routes = [
  { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
  { path: '/login', name: 'login', component: { template: '<div>Login</div>' }, meta: { public: true } },
  { path: '/auth/callback', name: 'auth-callback', component: { template: '<div>Callback</div>' }, meta: { public: true } },
  { path: '/series', name: 'series', component: { template: '<div>Series</div>' } },
  { path: '/settings', name: 'settings', component: { template: '<div>Settings</div>' } },
]

describe('AppLayout', () => {
  it('renders the slot content on dashboard route', async () => {
    const router = createTestRouter(routes)
    await router.push('/')
    await router.isReady()

    const wrapper = mount(AppLayout, {
      global: { plugins: [createPinia(), router] },
      slots: { default: '<p class="test-slot">Hello</p>' },
    })
    await flushPromises()

    expect(wrapper.find('.test-slot').exists()).toBe(true)
    expect(wrapper.text()).toContain('Hello')
  })

  it('hides sidebar on public routes', async () => {
    const router = createTestRouter(routes)
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(AppLayout, {
      global: { plugins: [createPinia(), router] },
      slots: { default: '<p>Login content</p>' },
    })
    await flushPromises()

    expect(wrapper.find('aside').exists()).toBe(false)
  })
})
