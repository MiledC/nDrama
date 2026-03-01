<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { PhotoIcon, CloudArrowUpIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import api from '../../lib/api'
import axios from 'axios'
import VideoPlayer from './VideoPlayer.vue'

type EpisodeFormData = {
  title: string
  description?: string
  episode_number?: number
  thumbnail_url?: string
  status: 'draft' | 'processing' | 'ready' | 'published'
  video_playback_id?: string
}

interface Props {
  seriesId: string
  episodeId?: string
  initialData?: Partial<EpisodeFormData>
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  episodeId: undefined,
  initialData: undefined,
  isLoading: false,
})

const emit = defineEmits<{
  submit: [data: EpisodeFormData]
  cancel: []
}>()

// Form fields
const title = ref('')
const description = ref('')
const episodeNumber = ref<number | undefined>(undefined)
const status = ref<'draft' | 'processing' | 'ready' | 'published'>('draft')
const thumbnailUrl = ref('')

// Thumbnail upload
// eslint-disable-next-line no-undef
const fileInput = ref<HTMLInputElement | null>(null)
// eslint-disable-next-line no-undef
const thumbnailFile = ref<File | null>(null)
const thumbnailPreview = ref('')
const thumbnailUploadLoading = ref(false)
const thumbnailUploadProgress = ref(0)
const thumbnailUploadError = ref('')

// Video playback
const videoPlaybackId = ref<string | undefined>(undefined)
const isReplacingVideo = ref(false)

// Video upload
const videoUploadLoading = ref(false)
const videoUploadProgress = ref(0)
const videoUploadError = ref('')
const videoUploadSuccess = ref(false)
// eslint-disable-next-line no-undef
const videoFileInput = ref<HTMLInputElement | null>(null)
// eslint-disable-next-line no-undef
const videoFile = ref<File | null>(null)
const videoFileName = ref('')

// Validation
const titleError = ref('')

const isEditMode = !!props.episodeId

function initializeForm() {
  if (props.initialData) {
    title.value = props.initialData.title || ''
    description.value = props.initialData.description || ''
    episodeNumber.value = props.initialData.episode_number
    status.value = props.initialData.status || 'draft'
    thumbnailUrl.value = props.initialData.thumbnail_url || ''
    thumbnailPreview.value = props.initialData.thumbnail_url || ''
    videoPlaybackId.value = props.initialData.video_playback_id
  }
}

watch(() => props.initialData, initializeForm, { immediate: true })

// eslint-disable-next-line no-undef
function handleThumbnailSelect(event: Event) {
  // eslint-disable-next-line no-undef
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    if (!file.type.startsWith('image/')) {
      thumbnailUploadError.value = 'Please select an image file'
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      thumbnailUploadError.value = 'File size must be less than 5MB'
      return
    }

    thumbnailFile.value = file
    thumbnailUploadError.value = ''

    // eslint-disable-next-line no-undef
    const reader = new FileReader()
    reader.onload = (e) => {
      thumbnailPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    uploadThumbnail(file)
  }
}

// eslint-disable-next-line no-undef
async function uploadThumbnail(file: File) {
  thumbnailUploadLoading.value = true
  thumbnailUploadProgress.value = 0
  thumbnailUploadError.value = ''

  // eslint-disable-next-line no-undef
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post('/api/upload/thumbnail', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          thumbnailUploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
        }
      },
    })
    thumbnailUrl.value = response.data.url
  } catch (e: unknown) {
    thumbnailUploadError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to upload thumbnail')
      : 'Failed to upload thumbnail'
    thumbnailPreview.value = ''
    thumbnailUrl.value = ''
  } finally {
    thumbnailUploadLoading.value = false
    thumbnailUploadProgress.value = 0
  }
}

// eslint-disable-next-line no-undef
function handleVideoSelect(event: Event) {
  // eslint-disable-next-line no-undef
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    if (!file.type.startsWith('video/')) {
      videoUploadError.value = 'Please select a video file'
      return
    }
    if (file.size > 2 * 1024 * 1024 * 1024) {
      videoUploadError.value = 'File size must be less than 2GB'
      return
    }

    videoFile.value = file
    videoFileName.value = file.name
    videoUploadError.value = ''
  }
}

async function uploadVideo() {
  if (!videoFile.value || !props.episodeId) return

  videoUploadLoading.value = true
  videoUploadProgress.value = 0
  videoUploadError.value = ''

  try {
    // Step 1: Get upload URL from our API
    const urlResponse = await api.post(`/api/episodes/${props.episodeId}/video`)
    const { upload_url } = urlResponse.data

    // Step 2: Upload directly to Mux using the signed URL
    await axios.put(upload_url, videoFile.value, {
      headers: { 'Content-Type': videoFile.value.type },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          videoUploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
        }
      },
    })

    // Finalize: fetch asset_id and playback_id from Mux via backend
    try {
      const completeResp = await api.post(`/api/episodes/${props.episodeId}/video/complete`)
      if (completeResp.data.video_playback_id) {
        videoPlaybackId.value = completeResp.data.video_playback_id
      }
    } catch {
      // Non-fatal: playback_id will be available on next page load
    }

    videoUploadSuccess.value = true
    videoFile.value = null
  } catch (e: unknown) {
    videoUploadError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to upload video')
      : 'Failed to upload video'
  } finally {
    videoUploadLoading.value = false
    videoUploadProgress.value = 0
  }
}

function validateForm(): boolean {
  let isValid = true
  titleError.value = ''

  if (!title.value.trim()) {
    titleError.value = 'Title is required'
    isValid = false
  } else if (title.value.length > 255) {
    titleError.value = 'Title must be less than 255 characters'
    isValid = false
  }

  return isValid
}

function handleSubmit() {
  if (!validateForm()) return

  const formData: EpisodeFormData = {
    title: title.value.trim(),
    status: status.value,
  }

  if (description.value.trim()) {
    formData.description = description.value.trim()
  }

  if (episodeNumber.value !== undefined) {
    formData.episode_number = episodeNumber.value
  }

  if (thumbnailUrl.value) {
    formData.thumbnail_url = thumbnailUrl.value
  }

  emit('submit', formData)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

onMounted(() => {
  initializeForm()
})
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left column: Form fields -->
      <div class="space-y-6">
        <!-- Title -->
        <div>
          <label
            for="ep-title"
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Title <span class="text-destructive">*</span>
          </label>
          <input
            id="ep-title"
            v-model="title"
            type="text"
            maxlength="255"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Enter episode title"
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
            for="ep-description"
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Description
          </label>
          <textarea
            id="ep-description"
            v-model="description"
            rows="4"
            maxlength="2000"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            placeholder="Enter episode description"
          />
          <p class="mt-1 text-xs text-text-secondary">
            {{ description.length }}/2000 characters
          </p>
        </div>

        <!-- Episode Number -->
        <div>
          <label
            for="ep-number"
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Episode Number
          </label>
          <input
            id="ep-number"
            v-model.number="episodeNumber"
            type="number"
            min="1"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Auto-assigned if empty"
          >
          <p class="mt-1 text-xs text-text-secondary">
            Leave empty to auto-assign the next number
          </p>
        </div>

        <!-- Status -->
        <div>
          <label
            for="ep-status"
            class="block text-sm font-medium text-text-secondary mb-1"
          >
            Status
          </label>
          <select
            id="ep-status"
            v-model="status"
            class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="draft">
              Draft
            </option>
            <option value="published">
              Published
            </option>
          </select>
        </div>
      </div>

      <!-- Right column: Thumbnail + Video Upload -->
      <div class="space-y-6">
        <!-- Thumbnail Upload -->
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">
            Thumbnail
          </label>
          <div
            class="relative w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-accent transition-colors cursor-pointer overflow-hidden bg-bg-tertiary"
            @click="fileInput?.click()"
          >
            <div
              v-if="thumbnailPreview"
              class="absolute inset-0"
            >
              <img
                :src="thumbnailPreview"
                alt="Thumbnail preview"
                class="w-full h-full object-cover"
              >
              <div
                v-if="thumbnailUploadLoading"
                class="absolute inset-0 bg-black/60 flex items-center justify-center"
              >
                <div class="text-center">
                  <div class="text-white text-sm mb-2">
                    Uploading...
                  </div>
                  <div class="w-48 bg-bg-tertiary rounded-full h-2">
                    <div
                      class="bg-accent h-2 rounded-full transition-all"
                      :style="{ width: `${thumbnailUploadProgress}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
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
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleThumbnailSelect"
              @click.stop
            >
          </div>
          <p
            v-if="thumbnailUploadError"
            class="mt-1 text-sm text-destructive"
          >
            {{ thumbnailUploadError }}
          </p>
        </div>

        <!-- Video Upload (only in edit mode) -->
        <div v-if="isEditMode">
          <label class="block text-sm font-medium text-text-secondary mb-1">
            Video
          </label>

          <!-- Existing video player -->
          <div v-if="videoPlaybackId && !isReplacingVideo">
            <VideoPlayer
              :playback-id="videoPlaybackId"
              :status="status"
            />
            <button
              type="button"
              class="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
              @click="isReplacingVideo = true"
            >
              <ArrowPathIcon class="h-4 w-4" />
              Replace Video
            </button>
          </div>

          <!-- Video file selection area -->
          <template v-else>
            <div
              class="relative w-full rounded-lg border-2 border-dashed border-border hover:border-accent transition-colors cursor-pointer overflow-hidden bg-bg-tertiary p-6"
              @click="videoFileInput?.click()"
            >
              <div class="flex flex-col items-center justify-center text-center">
                <!-- Upload success -->
                <div
                  v-if="videoUploadSuccess"
                  class="text-green-400"
                >
                  <CloudArrowUpIcon class="h-10 w-10 mx-auto mb-2" />
                  <p class="text-sm font-medium">
                    Video uploaded successfully
                  </p>
                  <p class="text-xs text-text-secondary mt-1">
                    Processing may take a few minutes
                  </p>
                </div>

                <!-- Upload in progress -->
                <div
                  v-else-if="videoUploadLoading"
                  class="w-full"
                >
                  <CloudArrowUpIcon class="h-10 w-10 mx-auto mb-2 text-accent animate-pulse" />
                  <p class="text-sm text-text-primary mb-3">
                    Uploading video...
                  </p>
                  <div class="w-full bg-bg-primary rounded-full h-3 mb-2">
                    <div
                      class="bg-accent h-3 rounded-full transition-all duration-300"
                      :style="{ width: `${videoUploadProgress}%` }"
                    />
                  </div>
                  <p class="text-xs text-text-secondary">
                    {{ videoUploadProgress }}% complete
                  </p>
                </div>

                <!-- File selected, ready to upload -->
                <div v-else-if="videoFile">
                  <CloudArrowUpIcon class="h-10 w-10 mx-auto mb-2 text-text-secondary" />
                  <p class="text-sm font-medium text-text-primary">
                    {{ videoFileName }}
                  </p>
                  <p class="text-xs text-text-secondary mt-1">
                    {{ formatFileSize(videoFile.size) }}
                  </p>
                </div>

                <!-- Empty state -->
                <div v-else>
                  <CloudArrowUpIcon class="h-10 w-10 mx-auto mb-2 text-text-secondary" />
                  <p class="text-sm text-text-secondary">
                    Click to select a video file
                  </p>
                  <p class="text-xs text-text-secondary mt-1">
                    Max 2GB, video files only
                  </p>
                </div>
              </div>
              <input
                ref="videoFileInput"
                type="file"
                accept="video/*"
                class="hidden"
                @change="handleVideoSelect"
                @click.stop
              >
            </div>

            <!-- Upload button (separate from file selection) -->
            <button
              v-if="videoFile && !videoUploadLoading && !videoUploadSuccess"
              type="button"
              class="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              @click.stop="uploadVideo"
            >
              <CloudArrowUpIcon class="h-4 w-4" />
              Upload Video
            </button>

            <!-- Cancel replace button -->
            <button
              v-if="videoPlaybackId && isReplacingVideo && !videoUploadLoading && !videoUploadSuccess"
              type="button"
              class="mt-2 w-full text-center text-sm text-text-secondary hover:text-text-primary transition-colors"
              @click="isReplacingVideo = false; videoFile = null; videoFileName = ''"
            >
              Cancel replacement
            </button>
          </template>

          <p
            v-if="videoUploadError"
            class="mt-1 text-sm text-destructive"
          >
            {{ videoUploadError }}
          </p>
        </div>

        <!-- Info note for create mode -->
        <div
          v-else
          class="rounded-lg bg-bg-tertiary/50 border border-border/50 p-4"
        >
          <p class="text-sm text-text-secondary">
            Video upload will be available after creating the episode.
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
        {{ isLoading ? 'Saving...' : 'Save Episode' }}
      </button>
    </div>
  </form>
</template>
