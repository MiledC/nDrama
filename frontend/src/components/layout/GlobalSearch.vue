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
    class="relative"
  >
    <!-- Search Input -->
    <div class="relative">
      <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
      <input
        ref="inputRef"
        v-model="query"
        type="text"
        placeholder="Search… Ctrl+K"
        class="w-64 rounded-lg border border-border bg-bg-tertiary pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder-text-secondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
        @keydown="handleKeydown"
        @focus="() => { if (results.length > 0) isOpen = true }"
      >
    </div>

    <!-- Results Dropdown -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-96 rounded-xl border border-border bg-bg-secondary shadow-2xl shadow-black/30 overflow-hidden z-50"
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
          <div class="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider bg-bg-primary/50">
            Series
          </div>
          <button
            v-for="(item, i) in seriesResults"
            :key="item.id"
            :class="[
              activeIndex === i ? 'bg-accent/10' : 'hover:bg-bg-tertiary/50',
              'flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors',
            ]"
            @click="navigateToResult(item)"
            @mouseenter="activeIndex = i"
          >
            <FilmIcon class="h-4 w-4 text-text-secondary flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-text-primary truncate">
                {{ item.title }}
              </p>
              <p
                v-if="item.description"
                class="text-xs text-text-secondary truncate"
              >
                {{ item.description }}
              </p>
            </div>
            <span
              v-if="item.status"
              class="text-xs text-text-secondary capitalize flex-shrink-0"
            >
              {{ item.status }}
            </span>
          </button>
        </div>

        <!-- Episodes Group -->
        <div v-if="episodeResults.length > 0">
          <div class="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wider bg-bg-primary/50">
            Episodes
          </div>
          <button
            v-for="(item, j) in episodeResults"
            :key="item.id"
            :class="[
              activeIndex === seriesResults.length + j ? 'bg-accent/10' : 'hover:bg-bg-tertiary/50',
              'flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors',
            ]"
            @click="navigateToResult(item)"
            @mouseenter="activeIndex = seriesResults.length + j"
          >
            <PlayCircleIcon class="h-4 w-4 text-text-secondary flex-shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-text-primary truncate">
                {{ item.title }}
              </p>
              <p class="text-xs text-text-secondary truncate">
                {{ item.series_title }} · Episode {{ item.episode_number }}
              </p>
            </div>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
