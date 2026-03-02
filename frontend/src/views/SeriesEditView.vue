<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '../lib/api'
import SeriesForm from '../components/series/SeriesForm.vue'

interface Tag {
  id: string
  name: string
  category: 'genre' | 'mood' | 'language' | null
}

interface Series {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: 'draft' | 'published' | 'archived'
  free_episode_count: number
  coin_cost_per_episode: number
  created_by: string
  tags: Tag[]
  created_at: string
  updated_at: string
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const fetchLoading = ref(true)
const series = ref<Series | null>(null)

// Fetch series data
async function fetchSeries() {
  fetchLoading.value = true
  error.value = ''
  try {
    const response = await api.get(`/api/series/${route.params.id}`)
    series.value = response.data
  } catch (e: unknown) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      error.value = 'Series not found'
    } else {
      error.value = axios.isAxiosError(e)
        ? (e.response?.data?.detail ?? 'Failed to load series')
        : 'Failed to load series'
    }
  } finally {
    fetchLoading.value = false
  }
}

// Handle form submission
async function handleSubmit(data: Record<string, unknown>) {
  loading.value = true
  error.value = ''
  try {
    await api.patch(`/api/series/${route.params.id}`, data)
    router.push('/series')
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to update series')
      : 'Failed to update series'
  } finally {
    loading.value = false
  }
}

// Convert series to form data format
function getInitialData() {
  if (!series.value) return undefined

  return {
    title: series.value.title,
    description: series.value.description || undefined,
    thumbnail_url: series.value.thumbnail_url || undefined,
    status: series.value.status,
    free_episode_count: series.value.free_episode_count,
    coin_cost_per_episode: series.value.coin_cost_per_episode,
    tag_ids: series.value.tags.map(tag => tag.id),
  }
}

onMounted(fetchSeries)
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

    <div class="flex items-center gap-3 mb-6">
      <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
        Edit Series
      </h1>
      <span
        v-if="series"
        :class="[
          'badge-pill',
          series.status === 'published' ? 'bg-accent-light text-accent' :
          series.status === 'archived' ? 'bg-gray-100 text-gray-600' :
          'bg-warning-light text-warning'
        ]"
      >
        {{ series.status }}
      </span>
    </div>

    <!-- Loading state -->
    <div
      v-if="fetchLoading"
      class="text-gray-500"
    >
      Loading series...
    </div>

    <!-- Error state -->
    <div
      v-else-if="error && !series"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm"
    >
      {{ error }}
    </div>

    <!-- Form -->
    <template v-else-if="series">
      <div
        v-if="error"
        class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
      >
        {{ error }}
      </div>
      <SeriesForm
        :initial-data="getInitialData()"
        :is-loading="loading"
        @submit="handleSubmit"
        @cancel="router.push('/series')"
      />
    </template>
  </div>
</template>