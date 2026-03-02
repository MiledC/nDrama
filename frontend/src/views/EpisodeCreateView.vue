<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '../lib/api'
import EpisodeForm from '../components/episodes/EpisodeForm.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const seriesId = computed(() => route.params.seriesId as string)
const loading = ref(false)
const error = ref('')

async function handleSubmit(data: Record<string, unknown>) {
  loading.value = true
  error.value = ''
  try {
    await api.post(`/api/series/${seriesId.value}/episodes`, data)
    router.push(`/series/${seriesId.value}`)
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to create episode')
      : 'Failed to create episode'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <button
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent transition-colors mb-4 group"
      @click="router.push(`/series/${seriesId}`)"
    >
      <ArrowLeftIcon class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      Back to Episodes
    </button>

    <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-6">
      Add Episode
    </h1>
    <div
      v-if="error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>
    <EpisodeForm
      :series-id="seriesId"
      :is-loading="loading"
      @submit="handleSubmit"
      @cancel="router.push(`/series/${seriesId}`)"
    />
  </div>
</template>
