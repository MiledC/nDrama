import { mount } from '@vue/test-utils'
import { createPinia, type StateTree } from 'pinia'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import type { Component } from 'vue'

const defaultRoutes: RouteRecordRaw[] = [
  { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
  { path: '/login', name: 'login', component: { template: '<div>Login</div>' }, meta: { public: true } },
]

/**
 * Create a test router instance with optional custom routes.
 */
export function createTestRouter(routes?: RouteRecordRaw[]) {
  return createRouter({
    history: createMemoryHistory(),
    routes: routes ?? defaultRoutes,
  })
}

/**
 * Create a test Pinia instance with optional initial state.
 */
export function createTestPinia(initialState?: Record<string, StateTree>) {
  const pinia = createPinia()
  if (initialState) {
    for (const [id, state] of Object.entries(initialState)) {
      pinia.state.value[id] = state
    }
  }
  return pinia
}

/**
 * Mount a component with Pinia and Router plugins pre-configured.
 */
export function mountWithPlugins(
  component: Component,
  options: {
    routes?: RouteRecordRaw[]
    initialState?: Record<string, StateTree>
    props?: Record<string, unknown>
    slots?: Record<string, string>
  } = {},
) {
  const router = createTestRouter(options.routes)
  const pinia = createTestPinia(options.initialState)

  return mount(component, {
    global: {
      plugins: [pinia, router],
    },
    props: options.props,
    slots: options.slots,
  })
}
