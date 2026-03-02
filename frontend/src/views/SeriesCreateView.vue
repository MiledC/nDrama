<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '../lib/api'
import SeriesForm from '../components/series/SeriesForm.vue'

const router = useRouter()
const loading = ref(false)
const error = ref('')

async function handleSubmit(data: Record<string, unknown>) {
  loading.value = true
  error.value = ''
  try {
    await api.post('/api/series', data)
    router.push('/series')
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to create series')
      : 'Failed to create series'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <RouterLink
      to="/series"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent transition-colors mb-4 group"
    >
      <svg
        class="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back to Series
    </RouterLink>

    <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-6">
      Create Series
    </h1>
    <div
      v-if="error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>
    <SeriesForm
      :is-loading="loading"
      @submit="handleSubmit"
      @cancel="router.push('/series')"
    />
  </div>
</template>