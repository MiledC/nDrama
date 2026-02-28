<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '../lib/api'
import EpisodeForm from '../components/episodes/EpisodeForm.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

interface Episode {
  id: string
  series_id: string
  title: string
  description: string | null
  episode_number: number
  thumbnail_url: string | null
  status: 'draft' | 'processing' | 'ready' | 'published'
  video_provider: string | null
  video_playback_id: string | null
  duration_seconds: number | null
}

const route = useRoute()
const router = useRouter()
const seriesId = computed(() => route.params.seriesId as string)
const episodeId = computed(() => route.params.id as string)
const loading = ref(false)
const error = ref('')
const fetchLoading = ref(true)
const episode = ref<Episode | null>(null)

async function fetchEpisode() {
  fetchLoading.value = true
  error.value = ''
  try {
    const response = await api.get(`/api/episodes/${episodeId.value}`)
    episode.value = response.data
  } catch (e: unknown) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      error.value = 'Episode not found'
    } else {
      error.value = axios.isAxiosError(e)
        ? (e.response?.data?.detail ?? 'Failed to load episode')
        : 'Failed to load episode'
    }
  } finally {
    fetchLoading.value = false
  }
}

function getInitialData() {
  if (!episode.value) return undefined
  return {
    title: episode.value.title,
    description: episode.value.description || undefined,
    episode_number: episode.value.episode_number,
    thumbnail_url: episode.value.thumbnail_url || undefined,
    status: episode.value.status,
  }
}

async function handleSubmit(data: Record<string, unknown>) {
  loading.value = true
  error.value = ''
  try {
    await api.patch(`/api/episodes/${episodeId.value}`, data)
    router.push(`/series/${seriesId.value}`)
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to update episode')
      : 'Failed to update episode'
  } finally {
    loading.value = false
  }
}

onMounted(fetchEpisode)
</script>

<template>
  <div>
    <button
      class="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
      @click="router.push(`/series/${seriesId}`)"
    >
      <ArrowLeftIcon class="h-4 w-4" />
      Back to Episodes
    </button>

    <h1 class="text-2xl font-bold text-text-primary mb-6">
      Edit Episode
    </h1>

    <!-- Loading state -->
    <div
      v-if="fetchLoading"
      class="text-text-secondary"
    >
      Loading episode...
    </div>

    <!-- Error state -->
    <div
      v-else-if="error && !episode"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm"
    >
      {{ error }}
    </div>

    <!-- Form -->
    <template v-else-if="episode">
      <div
        v-if="error"
        class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
      >
        {{ error }}
      </div>
      <EpisodeForm
        :series-id="seriesId"
        :episode-id="episodeId"
        :initial-data="getInitialData()"
        :is-loading="loading"
        @submit="handleSubmit"
        @cancel="router.push(`/series/${seriesId}`)"
      />
    </template>
  </div>
</template>
