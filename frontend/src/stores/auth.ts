import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../lib/api'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor'
  is_active: boolean
  oauth_provider: string | null
  created_at: string
  updated_at: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))

  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  async function login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password })
    setTokens(response.data.access_token, response.data.refresh_token)
    await fetchMe()
  }

  async function register(email: string, password: string, name: string) {
    const response = await api.post('/api/auth/register', { email, password, name })
    setTokens(response.data.access_token, response.data.refresh_token)
    await fetchMe()
  }

  function loginWithGoogle() {
    window.location.href = 'http://localhost:8000/api/auth/google'
  }

  async function fetchMe() {
    try {
      const response = await api.get('/api/auth/me')
      user.value = response.data
    } catch {
      clearAuth()
    }
  }

  function logout() {
    clearAuth()
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isAdmin,
    login,
    register,
    loginWithGoogle,
    fetchMe,
    logout,
    setTokens,
    clearAuth,
  }
})
