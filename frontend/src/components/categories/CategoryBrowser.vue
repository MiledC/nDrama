<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import api from '../../lib/api'
import type { CategoryTreeNode } from '../../types/category'
import {
  ChevronRightIcon,
  FilmIcon,
} from '@heroicons/vue/24/outline'

interface Series {
  id: string
  title: string
  description?: string | null
  thumbnail_url?: string | null
  tags?: Array<{
    id: string
    name: string
  }>
}

// State
const tree = ref<CategoryTreeNode[]>([])
const selectedRootId = ref<string | null>(null)
const selectedSubId = ref<string | null>(null)
const series = ref<Series[]>([])
const loading = ref(false)
const seriesLoading = ref(false)
const total = ref(0)
const page = ref(1)

// Computed
const selectedRoot = computed(() => tree.value.find(c => c.id === selectedRootId.value) || null)
const activeCategoryId = computed(() => selectedSubId.value || selectedRootId.value)
const hasMore = computed(() => series.value.length < total.value)

// Fetch tree on mount
onMounted(async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/categories/tree')
    tree.value = data
  } catch (e) {
    console.error('Failed to load categories:', e)
  } finally {
    loading.value = false
  }
})

// When active category changes, fetch series
watch(activeCategoryId, async (id) => {
  if (!id) {
    series.value = []
    total.value = 0
    return
  }
  seriesLoading.value = true
  page.value = 1
  try {
    const { data } = await api.get(`/api/categories/${id}/series`, {
      params: { page: 1, per_page: 20 }
    })
    series.value = data.items
    total.value = data.total
  } catch (e) {
    console.error('Failed to load series:', e)
    series.value = []
    total.value = 0
  } finally {
    seriesLoading.value = false
  }
})

function selectRoot(id: string) {
  if (selectedRootId.value === id) {
    selectedRootId.value = null
    selectedSubId.value = null
  } else {
    selectedRootId.value = id
    selectedSubId.value = null
  }
}

function selectSub(id: string) {
  selectedSubId.value = selectedSubId.value === id ? null : id
}

async function loadMore() {
  if (!activeCategoryId.value || seriesLoading.value) return
  page.value++
  seriesLoading.value = true
  try {
    const { data } = await api.get(`/api/categories/${activeCategoryId.value}/series`, {
      params: { page: page.value, per_page: 20 }
    })
    series.value.push(...data.items)
  } catch (e) {
    console.error('Failed to load more series:', e)
  } finally {
    seriesLoading.value = false
  }
}

function clearSelection() {
  selectedRootId.value = null
  selectedSubId.value = null
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-1">
        Browse by Category
      </h2>
      <p class="text-sm text-gray-500">
        Select a category to filter series
      </p>
    </div>

    <!-- Loading state for categories -->
    <div
      v-if="loading"
      class="space-y-4"
    >
      <div class="flex gap-2 overflow-x-auto pb-2">
        <div
          v-for="i in 5"
          :key="i"
          class="flex-shrink-0 h-9 w-24 bg-gray-200 rounded-full animate-pulse"
        />
      </div>
    </div>

    <!-- Category tree -->
    <div
      v-else-if="tree.length > 0"
      class="space-y-3 mb-6"
    >
      <!-- Root categories -->
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          v-for="category in tree"
          :key="category.id"
          :class="[
            selectedRootId === category.id
              ? 'bg-accent text-white border-accent'
              : 'bg-white border border-gray-200 text-gray-700 hover:border-accent',
            'flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors'
          ]"
          @click="selectRoot(category.id)"
        >
          <span v-if="category.icon">{{ category.icon }}</span>
          {{ category.name }}
        </button>
        <button
          v-if="selectedRootId"
          class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          @click="clearSelection"
        >
          Clear
        </button>
      </div>

      <!-- Subcategories -->
      <div
        v-if="selectedRoot && selectedRoot.children.length > 0"
        class="flex gap-2 overflow-x-auto pb-2 pl-4"
      >
        <ChevronRightIcon class="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
        <button
          v-for="subcat in selectedRoot.children"
          :key="subcat.id"
          :class="[
            selectedSubId === subcat.id
              ? 'bg-accent-light text-accent border-accent'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300',
            'flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors'
          ]"
          @click="selectSub(subcat.id)"
        >
          <span
            v-if="subcat.icon"
            class="text-xs"
          >{{ subcat.icon }}</span>
          {{ subcat.name }}
        </button>
      </div>
    </div>

    <!-- No categories -->
    <div
      v-else
      class="text-center py-8 bg-gray-50 rounded-lg"
    >
      <p class="text-gray-500">
        No categories available
      </p>
    </div>

    <!-- Series grid -->
    <div v-if="activeCategoryId">
      <!-- Loading skeleton -->
      <div
        v-if="seriesLoading && series.length === 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="rounded-xl border border-border bg-white shadow-[--shadow-card] overflow-hidden animate-pulse"
        >
          <div class="aspect-[2/3] bg-gray-200" />
          <div class="p-4 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4" />
            <div class="h-3 bg-gray-200 rounded" />
            <div class="flex gap-1">
              <div class="h-5 w-14 bg-gray-200 rounded-full" />
              <div class="h-5 w-12 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <!-- Series cards -->
      <div
        v-else-if="series.length > 0"
        class="space-y-4"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="s in series"
            :key="s.id"
            class="rounded-xl border border-border bg-white shadow-[--shadow-card] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="aspect-[2/3] bg-gray-100 flex items-center justify-center">
              <img
                v-if="s.thumbnail_url"
                :src="s.thumbnail_url"
                :alt="s.title"
                class="w-full h-full object-cover"
              >
              <FilmIcon
                v-else
                class="h-10 w-10 text-gray-300"
              />
            </div>
            <div class="p-4">
              <h3 class="text-sm font-semibold text-gray-900 truncate">
                {{ s.title }}
              </h3>
              <p
                v-if="s.description"
                class="text-xs text-gray-500 mt-1 line-clamp-2"
              >
                {{ s.description }}
              </p>
              <div
                v-if="s.tags && s.tags.length > 0"
                class="flex flex-wrap gap-1 mt-2"
              >
                <span
                  v-for="tag in s.tags.slice(0, 3)"
                  :key="tag.id"
                  class="inline-flex text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                >
                  {{ tag.name }}
                </span>
                <span
                  v-if="s.tags.length > 3"
                  class="inline-flex text-xs text-gray-400"
                >
                  +{{ s.tags.length - 3 }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Load more button -->
        <div
          v-if="hasMore"
          class="text-center pt-4"
        >
          <button
            :disabled="seriesLoading"
            class="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            @click="loadMore"
          >
            {{ seriesLoading ? 'Loading...' : 'Load More' }}
          </button>
        </div>
      </div>

      <!-- No series -->
      <div
        v-else
        class="text-center py-12 bg-gray-50 rounded-lg"
      >
        <FilmIcon class="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">
          No series found in this category
        </p>
      </div>
    </div>

    <!-- No category selected -->
    <div
      v-else-if="!loading && tree.length > 0"
      class="text-center py-12 bg-gray-50 rounded-lg"
    >
      <p class="text-gray-500">
        Select a category to browse series
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 2px;
}

.scrollbar-thin:hover::-webkit-scrollbar-thumb {
  background: #94A3B8;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>