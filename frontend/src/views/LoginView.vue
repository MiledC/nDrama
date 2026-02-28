<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.response?.data?.detail || 'Login failed'
  } finally {
    loading.value = false
  }
}

function handleGoogleLogin() {
  auth.loginWithGoogle()
}
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-accent">nDrama</h1>
        <p class="text-text-secondary mt-2">Sign in to your account</p>
      </div>

      <!-- Login form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Error message -->
        <div
          v-if="error"
          class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm"
        >
          {{ error }}
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-text-secondary mb-1">
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="you@example.com"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-text-secondary mb-1">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Enter your password"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-border"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-bg-primary px-2 text-text-secondary">or</span>
        </div>
      </div>

      <!-- Google OAuth -->
      <button
        @click="handleGoogleLogin"
        class="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-bg-secondary px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-colors"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>
    </div>
  </div>
</template>
