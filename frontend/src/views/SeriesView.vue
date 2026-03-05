<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '../lib/api'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PencilIcon,
  ArchiveBoxIcon,
  TrashIcon,
  FilmIcon,
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
  created_by: string
  tags: Tag[]
  created_at: string
  updated_at: string
}

interface PaginatedResponse {
  items: Series[]
  total: number
  page: number
  per_page: number
}

const router = useRouter()
const toast = useToastStore()

// State
const series = ref<Series[]>([])
const loading = ref(true)
const error = ref('')

// Pagination state
const page = ref(1)
const perPage = ref(20)
const total = ref(0)

// Filter state
const searchQuery = ref('')
const statusFilter = ref<'all' | 'draft' | 'published' | 'archived'>('all')
const selectedTag = ref<string>('')
const tags = ref<Tag[]>([])
const tagsLoading = ref(false)

// Debounce timer for search
let searchTimer: number | null = null

// Computed values
const totalPages = computed(() => Math.ceil(total.value / perPage.value))
const hasPrevious = computed(() => page.value > 1)
const hasNext = computed(() => page.value < totalPages.value)

// Archive/Delete confirmation state
const showDeleteConfirm = ref(false)
const deletingSeries = ref<Series | null>(null)
const deleteLoading = ref(false)
const deleteError = ref('')
const deleteAction = ref<'archive' | 'delete'>('archive')

async function fetchSeries() {
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      per_page: perPage.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }

    if (selectedTag.value) {
      params.tag = selectedTag.value
    }

    params.sort = 'created_at'

    const response = await api.get<PaginatedResponse>('/api/series', { params })
    series.value = response.data.items
    total.value = response.data.total
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to load series')
      : 'Failed to load series'
  } finally {
    loading.value = false
  }
}

async function fetchTags() {
  tagsLoading.value = true
  try {
    const response = await api.get<Tag[]>('/api/tags')
    tags.value = response.data
  } catch {
    // Silently ignore tag loading errors
  } finally {
    tagsLoading.value = false
  }
}

function debouncedSearch() {
  if (searchTimer) {
    window.clearTimeout(searchTimer)
  }
  searchTimer = window.setTimeout(() => {
    page.value = 1 // Reset to first page on search
    fetchSeries()
  }, 300)
}

function goToPreviousPage() {
  if (hasPrevious.value) {
    page.value--
    fetchSeries()
  }
}

function goToNextPage() {
  if (hasNext.value) {
    page.value++
    fetchSeries()
  }
}

function openDeleteConfirm(s: Series, action: 'archive' | 'delete') {
  deletingSeries.value = s
  deleteAction.value = action
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deletingSeries.value) return

  deleteLoading.value = true
  deleteError.value = ''
  try {
    if (deleteAction.value === 'archive') {
      await api.patch(`/api/series/${deletingSeries.value.id}`, { status: 'archived' })
    } else {
      await api.delete(`/api/series/${deletingSeries.value.id}`)
    }
    const action = deleteAction.value
    showDeleteConfirm.value = false
    deletingSeries.value = null
    toast.success(`Series ${action === 'archive' ? 'archived' : 'deleted'} successfully`)
    await fetchSeries()
  } catch (e: unknown) {
    deleteError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? `Failed to ${deleteAction.value} series`)
      : `Failed to ${deleteAction.value} series`
  } finally {
    deleteLoading.value = false
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'archived':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

// Watchers
watch(searchQuery, debouncedSearch)

watch(statusFilter, () => {
  page.value = 1
  fetchSeries()
})

watch(selectedTag, () => {
  page.value = 1
  fetchSeries()
})

onMounted(() => {
  fetchSeries()
  fetchTags()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Series
      </h1>
      <button
        class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        @click="router.push('/series/create')"
      >
        <PlusIcon class="h-4 w-4" />
        Create Series
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- Search Input -->
      <div class="relative flex-1 min-w-[300px]">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search series..."
          class="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent shadow-[--shadow-subtle]"
        >
      </div>

      <!-- Status Filter -->
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="all">
          All Status
        </option>
        <option value="draft">
          Draft
        </option>
        <option value="published">
          Published
        </option>
        <option value="archived">
          Archived
        </option>
      </select>

      <!-- Tag Filter -->
      <select
        v-model="selectedTag"
        :disabled="tagsLoading"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      >
        <option value="">
          All Tags
        </option>
        <option
          v-for="tag in tags"
          :key="tag.id"
          :value="tag.id"
        >
          {{ tag.name }}
        </option>
      </select>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse"
    >
      <div
        v-for="i in 8"
        :key="i"
        class="rounded-xl border border-border bg-white shadow-[--shadow-card] overflow-hidden"
      >
        <div class="aspect-[2/3] bg-gray-100" />
        <div class="p-4 space-y-2">
          <div class="h-4 w-3/4 bg-gray-200 rounded" />
          <div class="h-3 w-full bg-gray-100 rounded" />
          <div class="h-3 w-1/2 bg-gray-100 rounded" />
        </div>
        <div class="px-4 pb-4 flex flex-wrap gap-2">
          <div class="h-7 w-16 bg-gray-100 rounded-lg" />
          <div class="h-7 w-16 bg-gray-100 rounded-lg" />
          <div class="h-7 w-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>

    <!-- Series Card Grid -->
    <div
      v-else-if="series.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div
        v-for="s in series"
        :key="s.id"
        class="rounded-xl border border-border bg-white shadow-[--shadow-card] overflow-hidden hover:shadow-[--shadow-floating] transition-all"
      >
        <!-- Thumbnail -->
        <div class="relative aspect-[2/3] bg-gray-50 flex items-center justify-center overflow-hidden">
          <img
            v-if="s.thumbnail_url"
            :src="s.thumbnail_url"
            :alt="s.title"
            class="h-full w-full object-cover"
          >
          <PhotoIcon
            v-else
            class="h-10 w-10 text-gray-300"
          />
          <!-- Status badge -->
          <span
            :class="[
              getStatusBadgeClass(s.status),
              'absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
            ]"
          >
            {{ s.status }}
          </span>
        </div>

        <!-- Content -->
        <div class="p-4">
          <button
            class="text-sm font-semibold text-gray-900 hover:text-accent transition-colors text-left line-clamp-1"
            @click="router.push(`/series/${s.id}`)"
          >
            {{ s.title }}
          </button>
          <p
            v-if="s.description"
            class="text-xs text-gray-500 mt-1 line-clamp-2"
          >
            {{ s.description }}
          </p>

          <!-- Tags -->
          <div
            v-if="s.tags.length > 0"
            class="flex flex-wrap gap-1 mt-2"
          >
            <span
              v-for="tag in s.tags.slice(0, 3)"
              :key="tag.id"
              class="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 text-xs font-medium"
            >
              {{ tag.name }}
            </span>
            <span
              v-if="s.tags.length > 3"
              class="inline-flex items-center rounded-full bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 text-xs font-medium"
            >
              +{{ s.tags.length - 3 }}
            </span>
          </div>

          <!-- Pricing -->
          <p class="text-xs text-gray-500 mt-2">
            {{ s.free_episode_count }} free · {{ s.coin_cost_per_episode }} coins/ep
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="px-4 pb-4 flex flex-wrap gap-2">
          <button
            class="text-xs font-medium rounded-lg px-2.5 py-1.5 flex items-center gap-1 bg-accent-light text-accent hover:bg-accent hover:text-white transition-colors"
            @click.stop="router.push(`/series/${s.id}`)"
          >
            <FilmIcon class="h-3.5 w-3.5" />
            Episodes
          </button>
          <button
            class="text-xs font-medium rounded-lg px-2.5 py-1.5 flex items-center gap-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            @click.stop="router.push(`/series/${s.id}/edit`)"
          >
            <PencilIcon class="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            v-if="s.status !== 'archived'"
            class="text-xs font-medium rounded-lg px-2.5 py-1.5 flex items-center gap-1 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            @click.stop="openDeleteConfirm(s, 'archive')"
          >
            <ArchiveBoxIcon class="h-3.5 w-3.5" />
            Archive
          </button>
          <button
            class="text-xs font-medium rounded-lg px-2.5 py-1.5 flex items-center gap-1 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            @click.stop="openDeleteConfirm(s, 'delete')"
          >
            <TrashIcon class="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12"
    >
      <div class="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <PhotoIcon class="h-6 w-6 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No series found
      </h3>
      <p class="text-gray-500 mb-6">
        {{ searchQuery || statusFilter !== 'all' || selectedTag ? 'Try adjusting your filters' : 'Get started by creating your first series' }}
      </p>
      <button
        v-if="!searchQuery && statusFilter === 'all' && !selectedTag"
        class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        @click="router.push('/series/create')"
      >
        <PlusIcon class="h-4 w-4" />
        Create your first series
      </button>
    </div>

    <!-- Pagination -->
    <div
      v-if="!loading && totalPages > 1"
      class="flex items-center justify-between mt-6"
    >
      <div class="text-sm text-gray-500">
        Page {{ page }} of {{ totalPages }}
      </div>
      <div class="flex gap-2">
        <button
          :disabled="!hasPrevious"
          class="rounded-lg bg-white border border-border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="goToPreviousPage"
        >
          Previous
        </button>
        <button
          :disabled="!hasNext"
          class="rounded-lg bg-white border border-border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="goToNextPage"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Delete/Archive Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            {{ deleteAction === 'archive' ? 'Archive' : 'Delete' }} Series
          </h2>

          <p class="text-gray-500 mb-4">
            Are you sure you want to {{ deleteAction }} the series "{{ deletingSeries?.title }}"?
            <span v-if="deleteAction === 'delete'">
              This action cannot be undone.
            </span>
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
            :class="[
              deleteAction === 'archive' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-destructive hover:bg-destructive/90',
              'rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors',
            ]"
            @click="confirmDelete"
          >
            {{ deleteLoading ? `${deleteAction === 'archive' ? 'Archiving' : 'Deleting'}...` : deleteAction === 'archive' ? 'Archive Series' : 'Delete Series' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>