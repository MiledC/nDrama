<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PhotoIcon } from '@heroicons/vue/24/outline'
import api from '../../lib/api'
import axios from 'axios'

interface Tag {
  id: string
  name: string
  category: 'genre' | 'mood' | 'language' | null
}

type SeriesFormData = {
  title: string
  description?: string
  thumbnail_url?: string
  status: 'draft' | 'published' | 'archived'
  free_episode_count: number
  coin_cost_per_episode: number
  tag_ids: string[]
}

interface Props {
  initialData?: Partial<SeriesFormData>
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  isLoading: false,
})

const emit = defineEmits<{
  submit: [data: SeriesFormData]
  cancel: []
}>()

// Form fields
const title = ref('')
const description = ref('')
const status = ref<'draft' | 'published' | 'archived'>('draft')
const thumbnailUrl = ref<string>('')
const freeEpisodeCount = ref(0)
const coinCostPerEpisode = ref(0)
const selectedTagIds = ref<Set<string>>(new Set())

// Tags
const tags = ref<Tag[]>([])
const tagsLoading = ref(false)
const tagsError = ref('')

// File input ref
 
const fileInput = ref<HTMLInputElement | null>(null)

// Thumbnail upload
// eslint-disable-next-line no-undef
const thumbnailFile = ref<File | null>(null)
const thumbnailPreview = ref<string>('')
const uploadProgress = ref(0)
const uploadLoading = ref(false)
const uploadError = ref('')

// Validation
const titleError = ref('')

// Group tags by category
const tagsByCategory = computed(() => {
  const grouped: Record<string, Tag[]> = {
    genre: [],
    mood: [],
    language: [],
    other: [],
  }

  tags.value.forEach(tag => {
    const category = tag.category || 'other'
    if (grouped[category]) {
      grouped[category].push(tag)
    }
  })

  // Filter out empty categories
  return Object.entries(grouped).filter(([, items]) => items.length > 0)
})

const pricingPreview = computed(() => {
  const free = freeEpisodeCount.value || 0
  const cost = coinCostPerEpisode.value || 0
  if (free === 0 && cost === 0) return 'All episodes are free'
  if (free === 0) return `All episodes cost ${cost} coin${cost === 1 ? '' : 's'} each`
  if (cost === 0) return `First ${free} episode${free === 1 ? '' : 's'} free, remaining episodes are free`
  return `First ${free} episode${free === 1 ? '' : 's'} free, then ${cost} coin${cost === 1 ? '' : 's'} each`
})

// Initialize form with initial data
function initializeForm() {
  if (props.initialData) {
    title.value = props.initialData.title || ''
    description.value = props.initialData.description || ''
    status.value = props.initialData.status || 'draft'
    thumbnailUrl.value = props.initialData.thumbnail_url || ''
    thumbnailPreview.value = props.initialData.thumbnail_url || ''
    freeEpisodeCount.value = props.initialData.free_episode_count || 0
    coinCostPerEpisode.value = props.initialData.coin_cost_per_episode || 0
    selectedTagIds.value = new Set(props.initialData.tag_ids || [])
  }
}

// Watch for initial data changes (for edit mode)
watch(() => props.initialData, initializeForm, { immediate: true })

// Fetch tags
async function fetchTags() {
  tagsLoading.value = true
  tagsError.value = ''
  try {
    const response = await api.get('/api/tags')
    tags.value = response.data
  } catch (e: unknown) {
    tagsError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to load tags')
      : 'Failed to load tags'
  } finally {
    tagsLoading.value = false
  }
}

// Handle file selection
// eslint-disable-next-line no-undef
function handleFileSelect(event: Event) {
   
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      uploadError.value = 'Please select an image file'
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      uploadError.value = 'File size must be less than 5MB'
      return
    }

    thumbnailFile.value = file
    uploadError.value = ''

    // Create preview
    // eslint-disable-next-line no-undef
    const reader = new FileReader()
    reader.onload = (e) => {
      thumbnailPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadThumbnail(file)
  }
}

// Upload thumbnail
// eslint-disable-next-line no-undef
async function uploadThumbnail(file: File) {
  uploadLoading.value = true
  uploadProgress.value = 0
  uploadError.value = ''

  // eslint-disable-next-line no-undef
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post('/api/upload/thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      },
    })

    thumbnailUrl.value = response.data.url
  } catch (e: unknown) {
    uploadError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to upload thumbnail')
      : 'Failed to upload thumbnail'
    thumbnailPreview.value = ''
    thumbnailUrl.value = ''
  } finally {
    uploadLoading.value = false
    uploadProgress.value = 0
  }
}

// Toggle tag selection
function toggleTag(tagId: string) {
  if (selectedTagIds.value.has(tagId)) {
    selectedTagIds.value.delete(tagId)
  } else {
    selectedTagIds.value.add(tagId)
  }
}

// Validate form
function validateForm(): boolean {
  let isValid = true

  // Reset errors
  titleError.value = ''

  // Validate title
  if (!title.value.trim()) {
    titleError.value = 'Title is required'
    isValid = false
  } else if (title.value.length > 255) {
    titleError.value = 'Title must be less than 255 characters'
    isValid = false
  }

  return isValid
}

// Handle form submission
function handleSubmit() {
  if (!validateForm()) {
    return
  }

  const formData: SeriesFormData = {
    title: title.value.trim(),
    status: status.value,
    free_episode_count: freeEpisodeCount.value,
    coin_cost_per_episode: coinCostPerEpisode.value,
    tag_ids: Array.from(selectedTagIds.value),
  }

  if (description.value.trim()) {
    formData.description = description.value.trim()
  }

  if (thumbnailUrl.value) {
    formData.thumbnail_url = thumbnailUrl.value
  }

  emit('submit', formData)
}

// Get category display name
function getCategoryDisplayName(category: string): string {
  switch (category) {
    case 'genre':
      return 'Genre'
    case 'mood':
      return 'Mood'
    case 'language':
      return 'Language'
    default:
      return 'Other'
  }
}

onMounted(fetchTags)
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left column: Form fields -->
      <div class="space-y-6">
        <!-- Basic Info Card -->
        <div class="bg-white rounded-xl shadow-[--shadow-card] border border-border p-6 space-y-5">
          <!-- Title -->
          <div>
            <label
              for="title"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Title <span class="text-destructive">*</span>
            </label>
            <input
              id="title"
              v-model="title"
              type="text"
              maxlength="255"
              class="form-input block w-full rounded-lg border-gray-300 shadow-[--shadow-input] sm:text-sm py-2.5 px-3 text-gray-900 placeholder-gray-400 transition-colors"
              placeholder="Enter series title"
            >
            <p
              v-if="titleError"
              class="mt-1 text-sm text-destructive"
            >
              {{ titleError }}
            </p>
          </div>

          <!-- Description -->
          <div>
            <label
              for="description"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              v-model="description"
              rows="4"
              maxlength="2000"
              class="form-input block w-full rounded-lg border-gray-300 shadow-[--shadow-input] sm:text-sm py-2.5 px-3 text-gray-900 placeholder-gray-400 transition-colors resize-none"
              placeholder="Enter series description"
            />
            <p class="mt-1 text-xs text-gray-500">
              {{ description.length }}/2000 characters
            </p>
          </div>

          <!-- Status -->
          <div>
            <label
              for="status"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <div class="relative">
              <select
                id="status"
                v-model="status"
                class="form-input block w-full rounded-lg border-gray-300 shadow-[--shadow-input] sm:text-sm py-2.5 px-3 text-gray-900 bg-white appearance-none transition-colors"
              >
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
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  class="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Monetization Card -->
        <div class="bg-white rounded-xl shadow-[--shadow-card] border border-border p-6">
          <!-- Monetization Header -->
          <div class="flex items-center gap-3 mb-5">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gold-light">
              <svg
                class="w-5 h-5 text-gold"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.389 5.389 0 01-.421-.821H10a1 1 0 100-2H8.014a7.467 7.467 0 010-1H10a1 1 0 100-2H8.315c.12-.29.264-.562.421-.821z" />
              </svg>
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900">
                Monetization
              </h3>
              <p class="text-xs text-gray-500">
                Configure pricing for this series
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Free Episode Count -->
            <div>
              <label
                for="free-episodes"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Free Episodes
              </label>
              <input
                id="free-episodes"
                v-model.number="freeEpisodeCount"
                type="number"
                min="0"
                class="form-input block w-full rounded-lg border-gray-300 shadow-[--shadow-input] sm:text-sm py-2.5 px-3 text-gray-900 placeholder-gray-400 transition-colors"
                placeholder="0"
              >
              <p class="mt-1 text-xs text-gray-500">
                Episodes available for free
              </p>
            </div>

            <!-- Coin Cost Per Episode -->
            <div>
              <label
                for="coin-cost"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Coin Cost
              </label>
              <input
                id="coin-cost"
                v-model.number="coinCostPerEpisode"
                type="number"
                min="0"
                class="form-input block w-full rounded-lg border-gray-300 shadow-[--shadow-input] sm:text-sm py-2.5 px-3 text-gray-900 placeholder-gray-400 transition-colors"
                placeholder="0"
              >
              <p class="mt-1 text-xs text-gray-500">
                Coins per premium episode
              </p>
            </div>
          </div>

          <!-- Pricing Preview -->
          <div class="mt-4 rounded-lg bg-accent-light border-l-4 border-accent px-4 py-3">
            <p class="text-xs font-medium text-accent uppercase tracking-wider mb-1">
              Pricing Preview
            </p>
            <p
              class="text-sm font-medium text-accent"
              data-testid="pricing-preview"
            >
              {{ pricingPreview }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right column: Thumbnail and Tags -->
      <div class="space-y-6">
        <!-- Thumbnail Upload Card -->
        <div class="bg-white rounded-xl shadow-[--shadow-card] border border-border p-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail
          </label>
          <div
            class="relative w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-accent transition-colors cursor-pointer overflow-hidden bg-gray-50"
            @click="fileInput?.click()"
          >
            <!-- Preview -->
            <div
              v-if="thumbnailPreview"
              class="absolute inset-0"
            >
              <img
                :src="thumbnailPreview"
                alt="Thumbnail preview"
                class="w-full h-full object-cover"
              >
              <!-- Overlay when uploading -->
              <div
                v-if="uploadLoading"
                class="absolute inset-0 bg-black/60 flex items-center justify-center"
              >
                <div class="text-center">
                  <div class="text-white text-sm mb-2">
                    Uploading...
                  </div>
                  <div class="w-48 bg-white/20 rounded-full h-2">
                    <div
                      class="bg-accent h-2 rounded-full transition-all"
                      :style="{ width: `${uploadProgress}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Upload placeholder -->
            <div
              v-else
              class="absolute inset-0 flex flex-col items-center justify-center"
            >
              <PhotoIcon class="h-12 w-12 text-gray-400 mb-2" />
              <p class="text-sm text-gray-500">
                Click to upload thumbnail
              </p>
              <p class="text-xs text-gray-400 mt-1">
                Max 5MB, image files only
              </p>
            </div>

            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileSelect"
              @click.stop
            >
          </div>

          <!-- Upload error -->
          <p
            v-if="uploadError"
            class="mt-1 text-sm text-destructive"
          >
            {{ uploadError }}
          </p>
        </div>

        <!-- Tags Card -->
        <div class="bg-white rounded-xl shadow-[--shadow-card] border border-border p-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Tags
          </label>

          <!-- Tags loading -->
          <div
            v-if="tagsLoading"
            class="text-gray-500 text-sm"
          >
            Loading tags...
          </div>

          <!-- Tags error -->
          <div
            v-else-if="tagsError"
            class="text-destructive text-sm"
          >
            {{ tagsError }}
          </div>

          <!-- Tags list grouped by category -->
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="[category, categoryTags] in tagsByCategory"
              :key="category"
            >
              <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {{ getCategoryDisplayName(category) }}
              </h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in categoryTags"
                  :key="tag.id"
                  type="button"
                  :class="['tag-btn', { 'selected': selectedTagIds.has(tag.id) }]"
                  @click="toggleTag(tag.id)"
                >
                  {{ tag.name }}
                </button>
              </div>
            </div>
          </div>

          <p class="mt-3 text-xs text-gray-500">
            {{ selectedTagIds.size }} tag{{ selectedTagIds.size === 1 ? '' : 's' }} selected
          </p>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="sticky bottom-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] -mx-6 px-6 py-4 mt-8 flex justify-end gap-3">
      <button
        type="button"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        :disabled="isLoading"
        class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
      >
        {{ isLoading ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </form>
</template>