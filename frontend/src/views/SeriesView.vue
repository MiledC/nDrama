<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
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
  MagnifyingGlassIcon,
  PhotoIcon,
  PencilIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'

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
    showDeleteConfirm.value = false
    deletingSeries.value = null
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
      return 'bg-green-500/15 text-green-400'
    case 'archived':
      return 'bg-amber-500/15 text-amber-400'
    default:
      return 'bg-bg-tertiary text-text-secondary'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
      <h1 class="text-2xl font-bold text-text-primary">
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
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search series..."
          class="w-full rounded-lg border border-border bg-bg-tertiary pl-10 pr-3 py-2 text-text-primary placeholder-text-secondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
      </div>

      <!-- Status Filter -->
      <select
        v-model="statusFilter"
        class="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
        class="rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
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

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-text-secondary"
    >
      Loading series...
    </div>

    <!-- Series Table -->
    <div
      v-else-if="series.length > 0"
      class="overflow-hidden rounded-xl border border-border"
    >
      <table class="w-full">
        <thead>
          <tr class="border-b border-border bg-bg-secondary">
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Series
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Tags
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Pricing
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Created
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="s in series"
            :key="s.id"
            class="hover:bg-bg-secondary/50 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <!-- Thumbnail -->
                <div class="flex-shrink-0 h-10 w-10 rounded-lg bg-bg-tertiary flex items-center justify-center overflow-hidden">
                  <img
                    v-if="s.thumbnail_url"
                    :src="s.thumbnail_url"
                    :alt="s.title"
                    class="h-full w-full object-cover"
                  >
                  <PhotoIcon
                    v-else
                    class="h-5 w-5 text-text-secondary"
                  />
                </div>
                <!-- Title and Description -->
                <div>
                  <button
                    class="text-sm font-medium text-text-primary hover:text-accent transition-colors text-left"
                    @click="router.push(`/series/${s.id}`)"
                  >
                    {{ s.title }}
                  </button>
                  <p
                    v-if="s.description"
                    class="text-xs text-text-secondary line-clamp-1"
                  >
                    {{ s.description }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  getStatusBadgeClass(s.status),
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                ]"
              >
                {{ s.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in s.tags.slice(0, 3)"
                  :key="tag.id"
                  class="inline-flex items-center rounded-full bg-accent/15 text-accent px-2 py-0.5 text-xs font-medium"
                >
                  {{ tag.name }}
                </span>
                <span
                  v-if="s.tags.length > 3"
                  class="inline-flex items-center rounded-full bg-bg-tertiary text-text-secondary px-2 py-0.5 text-xs font-medium"
                >
                  +{{ s.tags.length - 3 }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-text-secondary">
                <div>
                  {{ s.free_episode_count }} free
                </div>
                <div class="text-xs">
                  {{ s.coin_cost_per_episode }} coins/ep
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-text-secondary">
              {{ formatDate(s.created_at) }}
            </td>
            <td class="px-4 py-3 text-right">
              <Menu
                as="div"
                class="relative inline-block text-left"
              >
                <MenuButton class="text-text-secondary hover:text-text-primary transition-colors">
                  <EllipsisVerticalIcon class="h-5 w-5" />
                </MenuButton>
                <MenuItems class="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-bg-secondary border border-border shadow-lg focus:outline-none">
                  <div class="py-1">
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm text-text-primary flex items-center gap-2']"
                        @click="router.push(`/series/${s.id}/edit`)"
                      >
                        <PencilIcon class="h-4 w-4" />
                        Edit
                      </button>
                    </MenuItem>
                    <MenuItem
                      v-if="s.status !== 'archived'"
                      v-slot="{ active }"
                    >
                      <button
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm text-amber-400 flex items-center gap-2']"
                        @click="openDeleteConfirm(s, 'archive')"
                      >
                        <ArchiveBoxIcon class="h-4 w-4" />
                        Archive
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm text-destructive flex items-center gap-2']"
                        @click="openDeleteConfirm(s, 'delete')"
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
      v-else
      class="text-center py-12"
    >
      <PhotoIcon class="mx-auto h-12 w-12 text-text-secondary mb-4" />
      <h3 class="text-lg font-medium text-text-primary mb-2">
        No series found
      </h3>
      <p class="text-text-secondary mb-6">
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
      <div class="text-sm text-text-secondary">
        Page {{ page }} of {{ totalPages }}
      </div>
      <div class="flex gap-2">
        <button
          :disabled="!hasPrevious"
          class="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="goToPreviousPage"
        >
          Previous
        </button>
        <button
          :disabled="!hasNext"
          class="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="goToNextPage"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Delete/Archive Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-text-primary mb-4">
          {{ deleteAction === 'archive' ? 'Archive' : 'Delete' }} Series
        </h2>

        <p class="text-text-secondary mb-4">
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

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
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