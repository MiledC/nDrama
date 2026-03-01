import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('../views/AuthCallbackView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/series',
      name: 'series',
      component: () => import('../views/SeriesView.vue'),
    },
    {
      path: '/series/create',
      name: 'series-create',
      component: () => import('../views/SeriesCreateView.vue'),
    },
    {
      path: '/series/:id',
      name: 'series-detail',
      component: () => import('../views/SeriesDetailView.vue'),
    },
    {
      path: '/series/:id/edit',
      name: 'series-edit',
      component: () => import('../views/SeriesEditView.vue'),
    },
    {
      path: '/series/:seriesId/episodes/create',
      name: 'episode-create',
      component: () => import('../views/EpisodeCreateView.vue'),
    },
    {
      path: '/series/:seriesId/episodes/:id/edit',
      name: 'episode-edit',
      component: () => import('../views/EpisodeEditView.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('../views/TagsView.vue'),
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Public routes don't need auth
  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') {
      return { name: 'dashboard' }
    }
    return true
  }

  // Protected routes require auth
  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  // If we have a token but no user data, fetch it
  if (!auth.user) {
    await auth.fetchMe()
    if (!auth.isAuthenticated) {
      return { name: 'login' }
    }
  }

  // Admin-only routes
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
