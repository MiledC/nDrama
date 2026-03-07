<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Squares2X2Icon,
  FireIcon,
  SparklesIcon,
  FolderIcon,
} from '@heroicons/vue/24/outline'
import { useToastStore } from '../stores/toast'
import { useHomeSectionStore } from '../stores/homeSections'
import type { HomeSection, HomeSectionType } from '../stores/homeSections'

const toast = useToastStore()
const store = useHomeSectionStore()

// Create form state
const showCreateForm = ref(false)
const createType = ref<HomeSectionType>('featured')
const createTitle = ref('')
const createSortOrder = ref(0)
const createIsActive = ref(true)
const createConfig = ref('{}')
const createLoading = ref(false)
const createError = ref('')

// Edit form state
const showEditForm = ref(false)
const editingSection = ref<HomeSection | null>(null)
const editType = ref<HomeSectionType>('featured')
const editTitle = ref('')
const editSortOrder = ref(0)
const editIsActive = ref(true)
const editConfig = ref('{}')
const editLoading = ref(false)
const editError = ref('')

// Delete confirmation state
const showDeleteConfirm = ref(false)
const deletingSection = ref<HomeSection | null>(null)
const deleteLoading = ref(false)

const sectionTypes: { value: HomeSectionType; label: string; labelAr: string; icon: typeof Squares2X2Icon; color: string }[] = [
  { value: 'featured', label: 'Featured', labelAr: 'مميز', icon: SparklesIcon, color: 'emerald' },
  { value: 'trending', label: 'Trending', labelAr: 'رائج', icon: FireIcon, color: 'orange' },
  { value: 'new_releases', label: 'New Releases', labelAr: 'جديد', icon: SparklesIcon, color: 'blue' },
  { value: 'category', label: 'Category', labelAr: 'فئة', icon: FolderIcon, color: 'purple' },
]

const sortedSections = computed(() => {
  return [...store.sections].sort((a, b) => a.sort_order - b.sort_order)
})

function getTypeConfig(type: HomeSectionType) {
  return sectionTypes.find(t => t.value === type) || sectionTypes[0]
}

function getTypeColor(type: HomeSectionType): string {
  const config = getTypeConfig(type)
  return config.color
}

function resetCreateForm() {
  createType.value = 'featured'
  createTitle.value = ''
  createSortOrder.value = 0
  createIsActive.value = true
  createConfig.value = '{}'
  createError.value = ''
}

function validateJson(jsonStr: string): boolean {
  try {
    JSON.parse(jsonStr)
    return true
  } catch {
    return false
  }
}

async function handleCreate() {
  if (!createTitle.value.trim()) {
    createError.value = 'Title is required'
    return
  }

  if (!validateJson(createConfig.value)) {
    createError.value = 'Invalid JSON configuration'
    return
  }

  createLoading.value = true
  createError.value = ''
  try {
    await store.createSection({
      type: createType.value,
      title: createTitle.value,
      config: JSON.parse(createConfig.value),
      sort_order: createSortOrder.value,
      is_active: createIsActive.value,
    })
    showCreateForm.value = false
    resetCreateForm()
    toast.success('Home section created successfully')
  } catch {
    createError.value = store.error ?? 'Failed to create section'
  } finally {
    createLoading.value = false
  }
}

function openEditForm(section: HomeSection) {
  editingSection.value = section
  editType.value = section.type as HomeSectionType
  editTitle.value = section.title
  editSortOrder.value = section.sort_order
  editIsActive.value = section.is_active
  editConfig.value = JSON.stringify(section.config, null, 2)
  editError.value = ''
  showEditForm.value = true
}

async function handleUpdate() {
  if (!editingSection.value) return

  if (!editTitle.value.trim()) {
    editError.value = 'Title is required'
    return
  }

  if (!validateJson(editConfig.value)) {
    editError.value = 'Invalid JSON configuration'
    return
  }

  editLoading.value = true
  editError.value = ''
  try {
    await store.updateSection(editingSection.value.id, {
      type: editType.value,
      title: editTitle.value,
      config: JSON.parse(editConfig.value),
      sort_order: editSortOrder.value,
      is_active: editIsActive.value,
    })
    showEditForm.value = false
    editingSection.value = null
    toast.success('Home section updated successfully')
  } catch {
    editError.value = store.error ?? 'Failed to update section'
  } finally {
    editLoading.value = false
  }
}

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

async function toggleActive(section: HomeSection) {
  try {
    await store.updateSection(section.id, { is_active: !section.is_active })
    toast.success(`Section ${section.is_active ? 'activated' : 'deactivated'}`)
  } catch {
    toast.error(store.error ?? 'Failed to update section')
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

onMounted(() => store.fetchSections())
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

    <!-- Create Section Modal -->
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              v-model.number="createSortOrder"
              type="number"
              min="0"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="0"
            >
            <p class="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
          </div>

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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Configuration (JSON)</label>
            <textarea
              v-model="createConfig"
              rows="6"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
              placeholder="{}"
            />
            <p class="text-xs text-gray-500 mt-1">
              Optional JSON configuration for the section
            </p>
          </div>

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

    <!-- Edit Section Modal -->
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              v-model="editTitle"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              v-model.number="editSortOrder"
              type="number"
              min="0"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
            <p class="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
          </div>

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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Configuration (JSON)</label>
            <textarea
              v-model="editConfig"
              rows="6"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
            />
            <p class="text-xs text-gray-500 mt-1">
              Optional JSON configuration for the section
            </p>
          </div>

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

    <!-- Delete Confirmation Modal -->
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

    <!-- Loading Skeleton -->
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
          <div class="flex-1 space-y-2">
            <div class="h-5 w-24 bg-gray-200 rounded" />
            <div class="h-6 w-48 bg-gray-200 rounded" />
            <div class="h-4 w-32 bg-gray-100 rounded" />
          </div>
          <div class="flex gap-2">
            <div class="h-8 w-20 bg-gray-100 rounded-lg" />
            <div class="h-8 w-16 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>

    <!-- Sections List -->
    <div
      v-else-if="sortedSections.length > 0"
      class="space-y-4"
    >
      <div
        v-for="section in sortedSections"
        :key="section.id"
        :class="[
          'rounded-xl border border-border bg-white shadow-[--shadow-card] p-6 hover:shadow-[--shadow-floating] transition-all',
          !section.is_active ? 'opacity-60' : '',
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <!-- Type Badge -->
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
                Order: {{ section.sort_order }}
              </span>
            </div>

            <!-- Title -->
            <h3 class="text-lg font-semibold text-gray-900 mb-1">
              {{ section.title }}
            </h3>

            <!-- Metadata -->
            <p class="text-sm text-gray-500">
              {{ formatDate(section.updated_at) }}
              <span
                v-if="Object.keys(section.config).length > 0"
                class="ml-2"
              >
                · {{ Object.keys(section.config).length }} config {{ Object.keys(section.config).length === 1 ? 'key' : 'keys' }}
              </span>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
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
    </div>

    <!-- Empty State -->
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