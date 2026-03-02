<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../lib/api'
import { MagnifyingGlassIcon, FilmIcon, PlayCircleIcon } from '@heroicons/vue/24/outline'

interface SearchResultItem {
  id: string
  type: 'series' | 'episode'
  title: string
  description: string | null
  status: string | null
  thumbnail_url: string | null
  series_id: string | null
  series_title: string | null
  episode_number: number | null
}

interface SearchResponse {
  results: SearchResultItem[]
  total: number
}

const router = useRouter()

const query = ref('')
const results = ref<SearchResultItem[]>([])
const isOpen = ref(false)
const loading = ref(false)
const activeIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)

let searchTimer: number | null = null

const seriesResults = ref<SearchResultItem[]>([])
const episodeResults = ref<SearchResultItem[]>([])

function updateGroupedResults() {
  seriesResults.value = results.value.filter((r) => r.type === 'series')
  episodeResults.value = results.value.filter((r) => r.type === 'episode')
}

function flatResults(): SearchResultItem[] {
  return [...seriesResults.value, ...episodeResults.value]
}

async function doSearch() {
  if (!query.value.trim()) {
    results.value = []
    updateGroupedResults()
    isOpen.value = false
    return
  }

  loading.value = true
  try {
    const response = await api.get<SearchResponse>('/api/search', {
      params: { q: query.value, per_page: 10 },
    })
    results.value = response.data.results
    updateGroupedResults()
    isOpen.value = true
    activeIndex.value = -1
  } catch {
    results.value = []
    updateGroupedResults()
  } finally {
    loading.value = false
  }
}

function debouncedSearch() {
  if (searchTimer) {
    window.clearTimeout(searchTimer)
  }
  searchTimer = window.setTimeout(doSearch, 300)
}

function navigateToResult(item: SearchResultItem) {
  if (item.type === 'series') {
    router.push(`/series/${item.id}`)
  } else {
    router.push(`/series/${item.series_id}/episodes/${item.id}/edit`)
  }
  closeSearch()
}

function closeSearch() {
  isOpen.value = false
  activeIndex.value = -1
  query.value = ''
  results.value = []
  updateGroupedResults()
  inputRef.value?.blur()
}

function handleKeydown(e: KeyboardEvent) {
  const flat = flatResults()

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, flat.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, -1)
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault()
    const item = flat[activeIndex.value]
    if (item) navigateToResult(item)
  } else if (e.key === 'Escape') {
    closeSearch()
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    nextTick(() => inputRef.value?.focus())
  }
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

watch(query, debouncedSearch)

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('mousedown', handleClickOutside)
  if (searchTimer) window.clearTimeout(searchTimer)
})
</script>

<template>
  <div
    ref="dropdownRef"
    class="hidden md:block relative max-w-md w-64 lg:w-96"
  >
    <!-- Search Input -->
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="Search series, users, or tags..."
        class="block w-full pl-10 pr-16 py-2 border border-border rounded-lg leading-5 bg-white placeholder-gray-400 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm shadow-[--shadow-subtle] transition-all"
        @keydown="handleKeydown"
        @focus="() => { if (results.length > 0) isOpen = true }"
      >
      <div class="absolute inset-y-0 right-0 pr-2 flex items-center">
        <span class="text-gray-400 text-xs border border-gray-200 rounded px-1.5 py-0.5">Ctrl+K</span>
      </div>
    </div>

    <!-- Results Dropdown -->
    <div
      v-if="isOpen"
      class="absolute left-0 top-full mt-2 w-96 rounded-xl border border-border bg-white shadow-[--shadow-dropdown] overflow-hidden z-50"
    >
      <!-- Loading -->
      <div
        v-if="loading"
        class="px-4 py-3 text-sm text-text-secondary"
      >
        Searching...
      </div>

      <!-- No Results -->
      <div
        v-else-if="results.length === 0 && query.trim()"
        class="px-4 py-6 text-center"
      >
        <p class="text-sm text-text-secondary">
          No results for "{{ query }}"
        </p>
      </div>

      <!-- Grouped Results -->
      <template v-else>
        <!-- Series Group -->
        <div v-if="seriesResults.length > 0">
          <div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/80">
            Series
          </div>
          <button
            v-for="(item, i) in seriesResults"
            :key="item.id"
            :class="[
              activeIndex === i ? 'bg-accent/5' : 'hover:bg-gray-50',
              'flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors',
            ]"
            @click="navigateToResult(item)"
            @mouseenter="activeIndex = i"
          >
            <FilmIcon class="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ item.title }}
              </p>
              <p
                v-if="item.description"
                class="text-xs text-gray-500 truncate"
              >
                {{ item.description }}
              </p>
            </div>
            <span
              v-if="item.status"
              class="text-xs text-gray-500 capitalize flex-shrink-0"
            >
              {{ item.status }}
            </span>
          </button>
        </div>

        <!-- Episodes Group -->
        <div v-if="episodeResults.length > 0">
          <div class="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/80">
            Episodes
          </div>
          <button
            v-for="(item, j) in episodeResults"
            :key="item.id"
            :class="[
              activeIndex === seriesResults.length + j ? 'bg-accent/5' : 'hover:bg-gray-50',
              'flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors',
            ]"
            @click="navigateToResult(item)"
            @mouseenter="activeIndex = seriesResults.length + j"
          >
            <PlayCircleIcon class="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ item.title }}
              </p>
              <p class="text-xs text-gray-500 truncate">
                {{ item.series_title }} · Episode {{ item.episode_number }}
              </p>
            </div>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
