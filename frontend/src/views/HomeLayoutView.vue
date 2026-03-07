<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Squares2X2Icon,
  FireIcon,
  SparklesIcon,
  FolderIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline'
import { useToastStore } from '../stores/toast'
import { useHomeSectionStore } from '../stores/homeSections'
import type { HomeSection, HomeSectionType } from '../stores/homeSections'

const toast = useToastStore()
const store = useHomeSectionStore()

// ---------------------------------------------------------------------------
// Draggable section list (synced from store)
// ---------------------------------------------------------------------------
const sortedSections = ref<HomeSection[]>([])

watch(() => store.sections, (sections) => {
  sortedSections.value = [...sections].sort((a, b) => a.sort_order - b.sort_order)
}, { immediate: true })

async function handleReorder() {
  const updates = sortedSections.value
    .map((section, index) => ({ id: section.id, newOrder: index }))
    .filter((u) => {
      const section = store.sections.find(s => s.id === u.id)
      return section && section.sort_order !== u.newOrder
    })

  for (const { id, newOrder } of updates) {
    await store.updateSection(id, { sort_order: newOrder })
  }
  if (updates.length > 0) {
    toast.success('Section order updated')
  }
}

// ---------------------------------------------------------------------------
// Create form state
// ---------------------------------------------------------------------------
const showCreateForm = ref(false)
const createType = ref<HomeSectionType>('featured')
const createTitle = ref('')
const createIsActive = ref(true)
const createLoading = ref(false)
const createError = ref('')

// Type-specific config fields
const createSelectedSeriesIds = ref<string[]>([])
const createSelectedCategoryId = ref('')
const createDays = ref(14)
const createLimit = ref(10)
const createSeriesSearch = ref('')

const createFilteredSeries = computed(() => {
  const q = createSeriesSearch.value.toLowerCase()
  return store.allSeries.filter(s => !q || s.title.toLowerCase().includes(q))
})

function buildCreateConfig(): Record<string, unknown> {
  switch (createType.value) {
    case 'featured':
      return { series_ids: createSelectedSeriesIds.value }
    case 'trending':
      return { days: 7, limit: createLimit.value }
    case 'new_releases':
      return { days: createDays.value, limit: createLimit.value }
    case 'category':
      return { category_id: createSelectedCategoryId.value, limit: createLimit.value }
    default:
      return {}
  }
}

function resetCreateForm() {
  createType.value = 'featured'
  createTitle.value = ''
  createIsActive.value = true
  createSelectedSeriesIds.value = []
  createSelectedCategoryId.value = ''
  createDays.value = 14
  createLimit.value = 10
  createSeriesSearch.value = ''
  createError.value = ''
}

async function handleCreate() {
  if (!createTitle.value.trim()) {
    createError.value = 'Title is required'
    return
  }

  if (createType.value === 'category' && !createSelectedCategoryId.value) {
    createError.value = 'Please select a category'
    return
  }

  createLoading.value = true
  createError.value = ''
  try {
    const newSection = await store.createSection({
      type: createType.value,
      title: createTitle.value,
      config: buildCreateConfig(),
      sort_order: store.sections.length,
      is_active: createIsActive.value,
    })
    showCreateForm.value = false
    resetCreateForm()
    toast.success('Home section created successfully')
    if (newSection) {
      store.fetchPreview(newSection.id)
    }
  } catch {
    createError.value = store.error ?? 'Failed to create section'
  } finally {
    createLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Edit form state
// ---------------------------------------------------------------------------
const showEditForm = ref(false)
const editingSection = ref<HomeSection | null>(null)
const editType = ref<HomeSectionType>('featured')
const editTitle = ref('')
const editIsActive = ref(true)
const editLoading = ref(false)
const editError = ref('')

// Type-specific config fields for edit
const editSelectedSeriesIds = ref<string[]>([])
const editSelectedCategoryId = ref('')
const editDays = ref(14)
const editLimit = ref(10)
const editSeriesSearch = ref('')

const editFilteredSeries = computed(() => {
  const q = editSeriesSearch.value.toLowerCase()
  return store.allSeries.filter(s => !q || s.title.toLowerCase().includes(q))
})

function buildEditConfig(): Record<string, unknown> {
  switch (editType.value) {
    case 'featured':
      return { series_ids: editSelectedSeriesIds.value }
    case 'trending':
      return { days: 7, limit: editLimit.value }
    case 'new_releases':
      return { days: editDays.value, limit: editLimit.value }
    case 'category':
      return { category_id: editSelectedCategoryId.value, limit: editLimit.value }
    default:
      return {}
  }
}

function openEditForm(section: HomeSection) {
  editingSection.value = section
  editType.value = section.type as HomeSectionType
  editTitle.value = section.title
  editIsActive.value = section.is_active
  editSeriesSearch.value = ''
  editError.value = ''

  // Populate type-specific fields from config
  const config = section.config || {}
  editSelectedSeriesIds.value = (config.series_ids as string[]) || []
  editSelectedCategoryId.value = (config.category_id as string) || ''
  editDays.value = (config.days as number) || 14
  editLimit.value = (config.limit as number) || 10

  showEditForm.value = true
}

async function handleUpdate() {
  if (!editingSection.value) return

  if (!editTitle.value.trim()) {
    editError.value = 'Title is required'
    return
  }

  if (editType.value === 'category' && !editSelectedCategoryId.value) {
    editError.value = 'Please select a category'
    return
  }

  editLoading.value = true
  editError.value = ''
  try {
    await store.updateSection(editingSection.value.id, {
      type: editType.value,
      title: editTitle.value,
      config: buildEditConfig(),
      is_active: editIsActive.value,
    })
    const sectionId = editingSection.value.id
    showEditForm.value = false
    editingSection.value = null
    toast.success('Home section updated successfully')
    store.fetchPreview(sectionId)
  } catch {
    editError.value = store.error ?? 'Failed to update section'
  } finally {
    editLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Delete confirmation
// ---------------------------------------------------------------------------
const showDeleteConfirm = ref(false)
const deletingSection = ref<HomeSection | null>(null)
const deleteLoading = ref(false)

function openDeleteConfirm(section: HomeSection) {
  deletingSection.value = section
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingSection.value) return

  deleteLoading.value = true
  try {
    await store.deleteSection(deletingSection.value.id)
    showDeleteConfirm.value = false
    deletingSection.value = null
    toast.success('Home section deleted')
  } catch {
    toast.error(store.error ?? 'Failed to delete section')
  } finally {
    deleteLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sectionTypes: { value: HomeSectionType; label: string; labelAr: string; icon: typeof Squares2X2Icon; color: string }[] = [
  { value: 'featured', label: 'Featured', labelAr: 'مميز', icon: SparklesIcon, color: 'emerald' },
  { value: 'trending', label: 'Trending', labelAr: 'رائج', icon: FireIcon, color: 'orange' },
  { value: 'new_releases', label: 'New Releases', labelAr: 'جديد', icon: SparklesIcon, color: 'blue' },
  { value: 'category', label: 'Category', labelAr: 'فئة', icon: FolderIcon, color: 'purple' },
]

function getTypeConfig(type: HomeSectionType) {
  return sectionTypes.find(t => t.value === type) ?? sectionTypes[0]!
}

function getTypeColor(type: HomeSectionType): string {
  return getTypeConfig(type).color
}

async function toggleActive(section: HomeSection) {
  try {
    await store.updateSection(section.id, { is_active: !section.is_active })
    toast.success(`Section ${section.is_active ? 'deactivated' : 'activated'}`)
  } catch {
    toast.error(store.error ?? 'Failed to update section')
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function configSummary(section: HomeSection): string {
  const config = section.config || {}
  const type = section.type as HomeSectionType
  if (type === 'featured') {
    const ids = (config.series_ids as string[]) || []
    return ids.length === 1 ? '1 series' : `${ids.length} series`
  }
  if (type === 'trending') {
    return `Top ${config.limit ?? 10} in ${config.days ?? 7} days`
  }
  if (type === 'new_releases') {
    return `Last ${config.days ?? 14} days, max ${config.limit ?? 10}`
  }
  if (type === 'category') {
    const cat = store.allCategories.find(c => c.id === config.category_id)
    return cat ? cat.name : 'No category'
  }
  return ''
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
onMounted(async () => {
  await store.fetchSections()
  store.fetchSeries()
  store.fetchCategories()
  store.fetchAllPreviews()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Home Layout
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          تخطيط الرئيسية - Configure home screen sections for the mobile app
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        @click="showCreateForm = true"
      >
        <PlusIcon class="h-4 w-4" />
        Add Section
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="store.error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ store.error }}
      <button
        class="ml-2 underline hover:no-underline"
        @click="store.fetchSections()"
      >
        Retry
      </button>
    </div>

    <!-- ================================================================= -->
    <!-- Create Section Modal                                              -->
    <!-- ================================================================= -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Create Home Section
        </h2>

        <div
          v-if="createError"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ createError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <!-- Section Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Section Type</label>
            <select
              v-model="createType"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option
                v-for="type in sectionTypes"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }} - {{ type.labelAr }}
              </option>
            </select>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              v-model="createTitle"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="e.g. Featured Series"
            >
          </div>

          <!-- Active Toggle -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Active</label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :class="[
                  createIsActive
                    ? 'bg-accent text-white'
                    : 'bg-gray-200 text-gray-600',
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                ]"
                @click="createIsActive = !createIsActive"
              >
                <span
                  :class="[
                    createIsActive ? 'translate-x-6' : 'translate-x-1',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  ]"
                />
              </button>
              <span class="text-sm text-gray-600">
                {{ createIsActive ? 'Section will be visible in the app' : 'Section will be hidden' }}
              </span>
            </div>
          </div>

          <!-- ========== Type-specific config ========== -->

          <!-- Featured: Series multi-select -->
          <div v-if="createType === 'featured'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Series</label>
            <input
              v-model="createSeriesSearch"
              type="text"
              placeholder="Search series..."
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm mb-2 placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
            <div class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              <label
                v-for="s in createFilteredSeries"
                :key="s.id"
                class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  v-model="createSelectedSeriesIds"
                  type="checkbox"
                  :value="s.id"
                  class="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                >
                <img
                  v-if="s.thumbnail_url"
                  :src="s.thumbnail_url"
                  class="h-8 w-8 rounded object-cover flex-shrink-0"
                >
                <div
                  v-else
                  class="h-8 w-8 rounded bg-gray-200 flex-shrink-0"
                />
                <span class="text-sm text-gray-900 truncate">{{ s.title }}</span>
              </label>
              <p
                v-if="createFilteredSeries.length === 0"
                class="px-3 py-4 text-sm text-gray-400 text-center"
              >
                No series found
              </p>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ createSelectedSeriesIds.length }} selected
            </p>
          </div>

          <!-- Trending: just limit -->
          <div v-if="createType === 'trending'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Max Series</label>
            <input
              v-model.number="createLimit"
              type="number"
              min="1"
              max="50"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
            <p class="text-xs text-gray-500 mt-1">
              Auto-ranked by viewer engagement in the past 7 days
            </p>
          </div>

          <!-- New Releases: days + limit -->
          <div
            v-if="createType === 'new_releases'"
            class="space-y-4"
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Days Back</label>
              <input
                v-model.number="createDays"
                type="number"
                min="1"
                max="90"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
              <p class="text-xs text-gray-500 mt-1">
                Show series published within this many days
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Max Series</label>
              <input
                v-model.number="createLimit"
                type="number"
                min="1"
                max="50"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
            </div>
          </div>

          <!-- Category: picker + limit -->
          <div
            v-if="createType === 'category'"
            class="space-y-4"
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                v-model="createSelectedCategoryId"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option
                  value=""
                  disabled
                >
                  Select a category
                </option>
                <option
                  v-for="cat in store.allCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Max Series</label>
              <input
                v-model.number="createLimit"
                type="number"
                min="1"
                max="50"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
            </div>
          </div>

          <!-- Submit -->
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              @click="showCreateForm = false; resetCreateForm()"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="createLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ createLoading ? 'Creating...' : 'Create Section' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- Edit Section Modal                                                -->
    <!-- ================================================================= -->
    <div
      v-if="showEditForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Edit Home Section
        </h2>

        <div
          v-if="editError"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ editError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleUpdate"
        >
          <!-- Section Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Section Type</label>
            <select
              v-model="editType"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option
                v-for="type in sectionTypes"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }} - {{ type.labelAr }}
              </option>
            </select>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              v-model="editTitle"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>

          <!-- Active Toggle -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Active</label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                :class="[
                  editIsActive
                    ? 'bg-accent text-white'
                    : 'bg-gray-200 text-gray-600',
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                ]"
                @click="editIsActive = !editIsActive"
              >
                <span
                  :class="[
                    editIsActive ? 'translate-x-6' : 'translate-x-1',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  ]"
                />
              </button>
              <span class="text-sm text-gray-600">
                {{ editIsActive ? 'Section will be visible in the app' : 'Section will be hidden' }}
              </span>
            </div>
          </div>

          <!-- ========== Type-specific config ========== -->

          <!-- Featured: Series multi-select -->
          <div v-if="editType === 'featured'">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Series</label>
            <input
              v-model="editSeriesSearch"
              type="text"
              placeholder="Search series..."
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm mb-2 placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
            <div class="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              <label
                v-for="s in editFilteredSeries"
                :key="s.id"
                class="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  v-model="editSelectedSeriesIds"
                  type="checkbox"
                  :value="s.id"
                  class="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                >
                <img
                  v-if="s.thumbnail_url"
                  :src="s.thumbnail_url"
                  class="h-8 w-8 rounded object-cover flex-shrink-0"
                >
                <div
                  v-else
                  class="h-8 w-8 rounded bg-gray-200 flex-shrink-0"
                />
                <span class="text-sm text-gray-900 truncate">{{ s.title }}</span>
              </label>
              <p
                v-if="editFilteredSeries.length === 0"
                class="px-3 py-4 text-sm text-gray-400 text-center"
              >
                No series found
              </p>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              {{ editSelectedSeriesIds.length }} selected
            </p>
          </div>

          <!-- Trending: just limit -->
          <div v-if="editType === 'trending'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Max Series</label>
            <input
              v-model.number="editLimit"
              type="number"
              min="1"
              max="50"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
            <p class="text-xs text-gray-500 mt-1">
              Auto-ranked by viewer engagement in the past 7 days
            </p>
          </div>

          <!-- New Releases: days + limit -->
          <div
            v-if="editType === 'new_releases'"
            class="space-y-4"
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Days Back</label>
              <input
                v-model.number="editDays"
                type="number"
                min="1"
                max="90"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
              <p class="text-xs text-gray-500 mt-1">
                Show series published within this many days
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Max Series</label>
              <input
                v-model.number="editLimit"
                type="number"
                min="1"
                max="50"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
            </div>
          </div>

          <!-- Category: picker + limit -->
          <div
            v-if="editType === 'category'"
            class="space-y-4"
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                v-model="editSelectedCategoryId"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option
                  value=""
                  disabled
                >
                  Select a category
                </option>
                <option
                  v-for="cat in store.allCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Max Series</label>
              <input
                v-model.number="editLimit"
                type="number"
                min="1"
                max="50"
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
            </div>
          </div>

          <!-- Submit -->
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              @click="showEditForm = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="editLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ editLoading ? 'Updating...' : 'Update Section' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- Delete Confirmation Modal                                         -->
    <!-- ================================================================= -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Delete Section
        </h2>

        <p class="text-gray-500 mb-4">
          Are you sure you want to delete "{{ deletingSection?.title }}"?
          This action cannot be undone.
        </p>

        <div class="flex justify-end gap-3">
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
            @click="handleDelete"
          >
            {{ deleteLoading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- Loading Skeleton                                                  -->
    <!-- ================================================================= -->
    <div
      v-if="store.loading && store.sections.length === 0"
      class="space-y-4 animate-pulse"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="rounded-xl border border-border bg-white shadow-[--shadow-card] p-6"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3 flex-1">
            <div class="h-5 w-5 bg-gray-200 rounded mt-1" />
            <div class="flex-1 space-y-2">
              <div class="h-5 w-24 bg-gray-200 rounded" />
              <div class="h-6 w-48 bg-gray-200 rounded" />
              <div class="h-4 w-32 bg-gray-100 rounded" />
            </div>
          </div>
          <div class="flex gap-2">
            <div class="h-8 w-20 bg-gray-100 rounded-lg" />
            <div class="h-8 w-16 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- Sections List (Draggable)                                         -->
    <!-- ================================================================= -->
    <draggable
      v-else-if="sortedSections.length > 0"
      v-model="sortedSections"
      item-key="id"
      handle=".drag-handle"
      ghost-class="opacity-30"
      animation="200"
      class="space-y-4"
      @end="handleReorder"
    >
      <template #item="{ element: section }">
        <div
          :class="[
            'rounded-xl border border-border bg-white shadow-[--shadow-card] p-6 hover:shadow-[--shadow-floating] transition-all',
            !section.is_active ? 'opacity-60' : '',
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3 flex-1">
              <!-- Drag handle -->
              <div class="drag-handle cursor-grab active:cursor-grabbing p-1 -ml-1 mt-0.5 text-gray-300 hover:text-gray-500 transition-colors">
                <Bars3Icon class="h-5 w-5" />
              </div>

              <div class="flex-1 min-w-0">
                <!-- Type Badge + Config summary -->
                <div class="flex items-center gap-3 mb-2">
                  <span
                    :class="[
                      getTypeColor(section.type as HomeSectionType) === 'emerald' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      getTypeColor(section.type as HomeSectionType) === 'orange' && 'bg-orange-50 text-orange-700 border-orange-200',
                      getTypeColor(section.type as HomeSectionType) === 'blue' && 'bg-blue-50 text-blue-700 border-blue-200',
                      getTypeColor(section.type as HomeSectionType) === 'purple' && 'bg-purple-50 text-purple-700 border-purple-200',
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border',
                    ]"
                  >
                    <component
                      :is="getTypeConfig(section.type as HomeSectionType).icon"
                      class="h-3.5 w-3.5"
                    />
                    {{ getTypeConfig(section.type as HomeSectionType).label }}
                  </span>
                  <span class="text-xs text-gray-400">
                    {{ configSummary(section) }}
                  </span>
                </div>

                <!-- Title -->
                <h3 class="text-lg font-semibold text-gray-900 mb-1">
                  {{ section.title }}
                </h3>

                <!-- Metadata -->
                <p class="text-sm text-gray-500">
                  {{ formatDate(section.updated_at) }}
                </p>

                <!-- Preview strip -->
                <div
                  v-if="store.previews[section.id]?.length"
                  class="mt-3 flex gap-3 overflow-x-auto pb-1"
                >
                  <div
                    v-for="item in (store.previews[section.id] ?? []).slice(0, 8)"
                    :key="item.id"
                    class="flex-shrink-0 w-14"
                  >
                    <img
                      v-if="item.thumbnail_url"
                      :src="item.thumbnail_url"
                      :alt="item.title"
                      class="w-14 h-[84px] rounded-lg object-cover border border-gray-100"
                    >
                    <div
                      v-else
                      class="w-14 h-[84px] rounded-lg bg-gray-100"
                    />
                    <p class="text-[10px] text-gray-500 mt-1 truncate leading-tight">
                      {{ item.title }}
                    </p>
                  </div>
                </div>
                <p
                  v-else-if="store.previews[section.id] !== undefined && store.previews[section.id]?.length === 0"
                  class="mt-3 text-xs text-gray-400 italic"
                >
                  No series matched
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <!-- Active Toggle -->
              <button
                :class="[
                  section.is_active
                    ? 'bg-accent text-white'
                    : 'bg-gray-200 text-gray-600',
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                ]"
                @click="toggleActive(section)"
              >
                <span
                  :class="[
                    section.is_active ? 'translate-x-6' : 'translate-x-1',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  ]"
                />
              </button>

              <!-- Edit Button -->
              <button
                class="text-sm font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                @click="openEditForm(section)"
              >
                <PencilIcon class="h-4 w-4" />
                Edit
              </button>

              <!-- Delete Button -->
              <button
                class="text-sm font-medium rounded-lg px-3 py-1.5 flex items-center gap-1 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                @click="openDeleteConfirm(section)"
              >
                <TrashIcon class="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <!-- ================================================================= -->
    <!-- Empty State                                                       -->
    <!-- ================================================================= -->
    <div
      v-else
      class="text-center py-12"
    >
      <div class="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <Squares2X2Icon class="h-6 w-6 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No home sections configured
      </h3>
      <p class="text-gray-500">
        Create your first section to customize the mobile app home screen
      </p>
    </div>
  </div>
</template>
