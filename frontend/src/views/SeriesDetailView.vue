<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '../lib/api'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/vue'
import {
  EllipsisVerticalIcon,
  PlusIcon,
  FilmIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  PlayCircleIcon,
} from '@heroicons/vue/24/outline'
import { useToastStore } from '../stores/toast'

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
  tags: Tag[]
  created_at: string
}

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
  created_at: string
}

interface EpisodeListResponse {
  items: Episode[]
  total: number
  page: number
  per_page: number
}

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const seriesId = computed(() => route.params.id as string)

// Series state
const series = ref<Series | null>(null)
const seriesLoading = ref(true)
const seriesError = ref('')

// Episodes state
const episodes = ref<Episode[]>([])
const episodesLoading = ref(true)
const episodesError = ref('')
const page = ref(1)
const perPage = ref(50)
const total = ref(0)

// Delete confirmation
const showDeleteConfirm = ref(false)
const deletingEpisode = ref<Episode | null>(null)
const deleteLoading = ref(false)
const deleteError = ref('')

async function fetchSeries() {
  seriesLoading.value = true
  seriesError.value = ''
  try {
    const response = await api.get<Series>(`/api/series/${seriesId.value}`)
    series.value = response.data
  } catch (e: unknown) {
    seriesError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to load series')
      : 'Failed to load series'
  } finally {
    seriesLoading.value = false
  }
}

async function fetchEpisodes() {
  episodesLoading.value = true
  episodesError.value = ''
  try {
    const response = await api.get<EpisodeListResponse>(
      `/api/series/${seriesId.value}/episodes`,
      { params: { page: page.value, per_page: perPage.value } }
    )
    episodes.value = response.data.items
    total.value = response.data.total
  } catch (e: unknown) {
    episodesError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to load episodes')
      : 'Failed to load episodes'
  } finally {
    episodesLoading.value = false
  }
}

function openDeleteConfirm(ep: Episode) {
  deletingEpisode.value = ep
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deletingEpisode.value) return

  deleteLoading.value = true
  deleteError.value = ''
  try {
    await api.delete(`/api/episodes/${deletingEpisode.value.id}`)
    showDeleteConfirm.value = false
    deletingEpisode.value = null
    toast.success('Episode deleted successfully')
    await fetchEpisodes()
  } catch (e: unknown) {
    deleteError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to delete episode')
      : 'Failed to delete episode'
  } finally {
    deleteLoading.value = false
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'ready':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'processing':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getEpisodePricingBadge(episodeNumber: number): { label: string; class: string } {
  if (!series.value) return { label: '', class: '' }
  if (episodeNumber <= series.value.free_episode_count) {
    return { label: 'Free', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
  }
  const cost = series.value.coin_cost_per_episode
  return {
    label: cost > 0 ? `${cost} coins` : 'Locked',
    class: 'bg-amber-50 text-amber-700 border border-amber-200',
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(() => {
  fetchSeries()
  fetchEpisodes()
})
</script>

<template>
  <div>
    <!-- Back button + Series Header -->
    <div class="mb-6">
      <button
        class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent transition-colors mb-4"
        @click="router.push('/series')"
      >
        <ArrowLeftIcon class="h-4 w-4" />
        Back to Series
      </button>

      <!-- Series loading skeleton -->
      <div
        v-if="seriesLoading"
        class="flex items-start gap-4 animate-pulse"
      >
        <div class="h-20 w-20 bg-gray-100 rounded-xl flex-shrink-0" />
        <div class="flex-1">
          <div class="h-6 w-48 bg-gray-100 rounded mb-2" />
          <div class="h-4 w-72 bg-gray-100 rounded mb-2" />
          <div class="h-3 w-40 bg-gray-100 rounded" />
        </div>
      </div>
      <div
        v-else-if="seriesError"
        class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm"
      >
        {{ seriesError }}
      </div>

      <!-- Series info header -->
      <div
        v-else-if="series"
        class="bg-white rounded-xl shadow-[--shadow-card] border border-border p-4 md:p-6 flex items-start gap-4"
      >
        <!-- Thumbnail -->
        <div class="flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
          <img
            v-if="series.thumbnail_url"
            :src="series.thumbnail_url"
            :alt="series.title"
            class="h-full w-full object-cover group-hover:scale-105 transition-transform"
          >
          <div
            v-else
            class="h-full w-full bg-gray-50 flex items-center justify-center"
          >
            <FilmIcon class="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight truncate">
              {{ series.title }}
            </h1>
            <span
              :class="[
                getStatusBadgeClass(series.status),
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
              ]"
            >
              {{ series.status }}
            </span>
          </div>
          <p
            v-if="series.description"
            class="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-2"
          >
            {{ series.description }}
          </p>
          <div class="flex items-center gap-4 text-xs text-gray-600">
            <span>{{ total }} episode{{ total === 1 ? '' : 's' }}</span>
            <span class="text-gray-300">&middot;</span>
            <span>{{ series.free_episode_count }} free</span>
            <span class="text-gray-300">&middot;</span>
            <span>{{ series.coin_cost_per_episode }} coins/ep</span>
            <div
              v-if="series.tags.length"
              class="flex gap-1"
            >
              <span
                v-for="(tag, index) in series.tags.slice(0, 3)"
                :key="tag.id"
                :class="[
                  index % 3 === 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                  index % 3 === 1 ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                  'bg-green-50 text-green-700 border border-green-100',
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                ]"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>
        <button
          class="flex-shrink-0 flex items-center gap-1.5 text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors rounded-lg px-3 py-1.5"
          @click="router.push(`/series/${series.id}/edit`)"
        >
          <PencilIcon class="h-4 w-4" />
          Edit Series
        </button>
      </div>
    </div>

    <!-- Episodes Section -->
    <div class="mt-8">
      <!-- Episodes Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-semibold text-gray-900">
            Episodes
          </h2>
          <span class="bg-gray-100 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5 text-xs font-medium">
            {{ total }}
          </span>
        </div>
        <button
          class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          @click="router.push(`/series/${seriesId}/episodes/create`)"
        >
          <PlusIcon class="h-4 w-4" />
          Add Episode
        </button>
      </div>

      <!-- Episodes error -->
      <div
        v-if="episodesError"
        class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
      >
        {{ episodesError }}
      </div>

      <!-- Episodes loading skeleton -->
      <div
        v-if="episodesLoading"
        class="overflow-hidden rounded-xl border border-border bg-white shadow-[--shadow-card] animate-pulse"
      >
        <div class="border-b border-gray-200 bg-[#F9FAFB] px-4 py-3">
          <div class="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div
          v-for="i in 3"
          :key="i"
          class="flex items-center gap-4 px-4 py-3 border-b border-gray-200 last:border-0"
        >
          <div class="h-4 w-6 bg-gray-100 rounded" />
          <div class="h-10 w-16 bg-gray-100 rounded" />
          <div class="flex-1">
            <div class="h-4 w-36 bg-gray-100 rounded mb-1" />
            <div class="h-3 w-24 bg-gray-100 rounded" />
          </div>
          <div class="h-5 w-16 bg-gray-100 rounded-full" />
        </div>
      </div>

      <!-- Episodes Table -->
      <div
        v-else-if="episodes.length > 0"
        class="bg-white rounded-xl border border-border shadow-[--shadow-card] overflow-hidden"
      >
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 bg-[#F9FAFB]">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                #
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Episode
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                Status
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                Access
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                Duration
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                Created
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="ep in episodes"
              :key="ep.id"
              class="hover:bg-gray-50 transition-colors cursor-pointer"
              @click="router.push(`/series/${seriesId}/episodes/${ep.id}/edit`)"
            >
              <td class="px-4 py-3">
                <span class="text-sm font-mono text-gray-500">
                  {{ ep.episode_number }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <!-- Video thumbnail / placeholder -->
                  <div class="flex-shrink-0 h-16 w-10 rounded bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                    <img
                      v-if="ep.thumbnail_url"
                      :src="ep.thumbnail_url"
                      :alt="ep.title"
                      class="h-full w-full object-cover"
                    >
                    <PlayCircleIcon
                      v-else
                      class="h-5 w-5 text-gray-400"
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ ep.title }}
                    </p>
                    <p
                      v-if="ep.description"
                      class="text-xs text-gray-500 line-clamp-1"
                    >
                      {{ ep.description }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    getStatusBadgeClass(ep.status),
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  ]"
                >
                  {{ ep.status }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[getEpisodePricingBadge(ep.episode_number).class, 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium']"
                  :data-testid="`episode-${ep.episode_number}-access`"
                >
                  {{ getEpisodePricingBadge(ep.episode_number).label }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 font-mono">
                {{ formatDuration(ep.duration_seconds) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">
                {{ formatDate(ep.created_at) }}
              </td>
              <td
                class="px-4 py-3 text-right"
                @click.stop
              >
                <Menu
                  as="div"
                  class="relative inline-block text-left"
                >
                  <MenuButton class="text-gray-400 hover:text-gray-700 transition-colors">
                    <EllipsisVerticalIcon class="h-5 w-5" />
                  </MenuButton>
                  <MenuItems class="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-white border border-border shadow-lg focus:outline-none">
                    <div class="py-1">
                      <MenuItem v-slot="{ active }">
                        <button
                          :class="[active ? 'bg-gray-50' : '', 'block w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-2']"
                          @click="router.push(`/series/${seriesId}/episodes/${ep.id}/edit`)"
                        >
                          <PencilIcon class="h-4 w-4" />
                          Edit
                        </button>
                      </MenuItem>
                      <MenuItem v-slot="{ active }">
                        <button
                          :class="[active ? 'bg-gray-50' : '', 'block w-full px-4 py-2 text-left text-sm text-destructive flex items-center gap-2']"
                          @click="openDeleteConfirm(ep)"
                        >
                          <TrashIcon class="h-4 w-4" />
                          Delete
                        </button>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!episodesLoading"
        class="text-center py-16 border border-border/50 rounded-xl border-dashed"
      >
        <div class="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <FilmIcon class="h-6 w-6 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          No episodes yet
        </h3>
        <p class="text-gray-500 mb-6 text-sm">
          Add the first episode to this series
        </p>
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          @click="router.push(`/series/${seriesId}/episodes/create`)"
        >
          <PlusIcon class="h-4 w-4" />
          Add First Episode
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Delete Episode
          </h2>

          <p class="text-gray-500 mb-4">
            Are you sure you want to delete episode {{ deletingEpisode?.episode_number }}
            "{{ deletingEpisode?.title }}"? This will also remove the associated video.
            This action cannot be undone.
          </p>

          <div
            v-if="deleteError"
            class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
          >
            {{ deleteError }}
          </div>
        </div>

        <div class="flex justify-end gap-3 bg-gray-50 px-6 py-4">
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </button>
          <button
            :disabled="deleteLoading"
            class="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            @click="confirmDelete"
          >
            {{ deleteLoading ? 'Deleting...' : 'Delete Episode' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
