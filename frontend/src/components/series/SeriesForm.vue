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

interface FormData {
  title: string
  description?: string
  thumbnail_url?: string
  status: 'draft' | 'published' | 'archived'
  free_episode_count: number
  coin_cost_per_episode: number
  tag_ids: string[]
}

interface Props {
  initialData?: Partial<FormData>
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialData: undefined,
  isLoading: false,
})

const emit = defineEmits<{
  submit: [data: FormData]
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
    grouped[category].push(tag)
  })

  // Filter out empty categories
  return Object.entries(grouped).filter(([, items]) => items.length > 0)
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
  // eslint-disable-next-line no-undef
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

  const formData: FormData = {
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

// Get tag chip classes
function getTagChipClass(tagId: string, category: string | null): string {
  const isSelected = selectedTagIds.value.has(tagId)
  const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all'

  if (isSelected) {
    return `${baseClasses} bg-accent text-white hover:bg-accent-hover`
  }

  switch (category) {
    case 'genre':
      return `${baseClasses} bg-blue-500/15 text-blue-400 hover:bg-blue-500/25`
    case 'mood':
      return `${baseClasses} bg-purple-500/15 text-purple-400 hover:bg-purple-500/25`
    case 'language':
      return `${baseClasses} bg-green-500/15 text-green-400 hover:bg-green-500/25`
    default:
      return `${baseClasses} bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/70`
  }
}

onMounted(fetchTags)
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left column: Form fields -->
      <div class="space-y-6">
        <!-- Title -->
        <div>
          <label
            for="title"
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Title <span class="text-destructive">*</span>
          </label>
          <input
            id="title"
            v-model="title"
            type="text"
            maxlength="255"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            v-model="description"
            rows="4"
            maxlength="2000"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            placeholder="Enter series description"
          />
          <p class="mt-1 text-xs text-text-secondary">
            {{ description.length }}/2000 characters
          </p>
        </div>

        <!-- Status -->
        <div>
          <label
            for="status"
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Status
          </label>
          <select
            id="status"
            v-model="status"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
        </div>

        <!-- Free Episode Count -->
        <div>
          <label
            for="free-episodes"
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Free Episode Count
          </label>
          <input
            id="free-episodes"
            v-model.number="freeEpisodeCount"
            type="number"
            min="0"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="0"
          >
          <p class="mt-1 text-xs text-text-secondary">
            Number of episodes available for free
          </p>
        </div>

        <!-- Coin Cost Per Episode -->
        <div>
          <label
            for="coin-cost"
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Coin Cost Per Episode
          </label>
          <input
            id="coin-cost"
            v-model.number="coinCostPerEpisode"
            type="number"
            min="0"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="0"
          >
          <p class="mt-1 text-xs text-text-secondary">
            Cost in coins to unlock each premium episode
          </p>
        </div>
      </div>

      <!-- Right column: Thumbnail and Tags -->
      <div class="space-y-6">
        <!-- Thumbnail Upload -->
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">
            Thumbnail
          </label>
          <div
            class="relative w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-accent transition-colors cursor-pointer overflow-hidden bg-bg-tertiary"
            @click="$refs.fileInput?.click()"
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
                  <div class="w-48 bg-bg-tertiary rounded-full h-2">
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
              <PhotoIcon class="h-12 w-12 text-text-secondary mb-2" />
              <p class="text-sm text-text-secondary">
                Click to upload thumbnail
              </p>
              <p class="text-xs text-text-secondary mt-1">
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

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-3">
            Tags
          </label>

          <!-- Tags loading -->
          <div
            v-if="tagsLoading"
            class="text-text-secondary text-sm"
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
              <h4 class="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                {{ getCategoryDisplayName(category) }}
              </h4>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in categoryTags"
                  :key="tag.id"
                  type="button"
                  :class="getTagChipClass(tag.id, tag.category)"
                  @click="toggleTag(tag.id)"
                >
                  {{ tag.name }}
                </button>
              </div>
            </div>
          </div>

          <p class="mt-3 text-xs text-text-secondary">
            {{ selectedTagIds.size }} tag{{ selectedTagIds.size === 1 ? '' : 's' }} selected
          </p>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
      <button
        type="button"
        class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
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