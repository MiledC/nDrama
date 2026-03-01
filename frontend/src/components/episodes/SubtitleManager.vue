<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  LanguageIcon,
  CloudArrowUpIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/vue/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/vue/24/solid'
import api from '../../lib/api'
import axios from 'axios'

interface Subtitle {
  id: string
  episode_id: string
  language_code: string
  label: string
  file_url: string
  format: 'srt' | 'vtt'
  is_default: boolean
  created_at: string
  updated_at: string
}

interface Props {
  episodeId: string
}

const props = defineProps<Props>()

const subtitles = ref<Subtitle[]>([])
const loading = ref(false)
const uploadLoading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const deleteConfirmId = ref<string | null>(null)

// Form fields
const languageCode = ref('ar')
const label = ref('')
const isDefault = ref(false)
 
const fileInput = ref<HTMLInputElement | null>(null)
// eslint-disable-next-line no-undef
const selectedFile = ref<File | null>(null)

const LANGUAGE_OPTIONS = [
  { code: 'ar', name: 'Arabic' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ko', name: 'Korean' },
]

async function fetchSubtitles() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get(`/api/episodes/${props.episodeId}/subtitles`)
    subtitles.value = response.data.items
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to load subtitles')
      : 'Failed to load subtitles'
  } finally {
    loading.value = false
  }
}

// eslint-disable-next-line no-undef
function handleFileSelect(event: Event) {
   
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'srt' && ext !== 'vtt') {
      error.value = 'Only SRT and VTT files are allowed'
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      error.value = 'File size must be less than 5MB'
      return
    }
    selectedFile.value = file
    error.value = ''
  }
}

async function uploadSubtitle() {
  if (!selectedFile.value) return

  uploadLoading.value = true
  uploadProgress.value = 0
  error.value = ''

  // eslint-disable-next-line no-undef
  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('language_code', languageCode.value)
  formData.append('label', label.value || getLanguageName(languageCode.value))
  formData.append('is_default', String(isDefault.value))

  try {
    await api.post(`/api/episodes/${props.episodeId}/subtitles`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          )
        }
      },
    })
    // Reset form
    selectedFile.value = null
    label.value = ''
    isDefault.value = false
    if (fileInput.value) fileInput.value.value = ''
    await fetchSubtitles()
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to upload subtitle')
      : 'Failed to upload subtitle'
  } finally {
    uploadLoading.value = false
    uploadProgress.value = 0
  }
}

async function toggleDefault(subtitle: Subtitle) {
  error.value = ''
  try {
    await api.patch(`/api/subtitles/${subtitle.id}`, {
      is_default: !subtitle.is_default,
    })
    await fetchSubtitles()
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to update subtitle')
      : 'Failed to update subtitle'
  }
}

async function deleteSubtitle(subtitleId: string) {
  error.value = ''
  try {
    await api.delete(`/api/subtitles/${subtitleId}`)
    deleteConfirmId.value = null
    await fetchSubtitles()
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to delete subtitle')
      : 'Failed to delete subtitle'
  }
}

function getLanguageName(code: string): string {
  return LANGUAGE_OPTIONS.find((l) => l.code === code)?.name ?? code
}

onMounted(fetchSubtitles)
</script>

<template>
  <div>
    <div class="flex items-center gap-2 mb-3">
      <LanguageIcon class="h-4 w-4 text-accent" />
      <h3 class="text-sm font-semibold text-text-primary tracking-wide uppercase">
        Subtitles
      </h3>
      <span class="text-xs text-text-secondary tabular-nums">({{ subtitles.length }})</span>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-3 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"
    >
      {{ error }}
    </div>

    <!-- Existing subtitles -->
    <div
      v-if="subtitles.length > 0"
      class="space-y-1.5 mb-4"
    >
      <div
        v-for="sub in subtitles"
        :key="sub.id"
        class="group flex items-center gap-3 rounded-lg border border-border bg-bg-tertiary/50 px-3 py-2.5 transition-colors hover:border-border/80"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-text-primary truncate">{{ sub.label }}</span>
            <span class="shrink-0 rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-mono text-text-secondary uppercase tracking-wider">
              {{ sub.language_code }}
            </span>
            <span class="shrink-0 rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-mono text-text-secondary uppercase tracking-wider">
              {{ sub.format }}
            </span>
            <span
              v-if="sub.is_default"
              class="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent uppercase tracking-wider"
            >
              Default
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            class="rounded p-1 transition-colors"
            :class="sub.is_default
              ? 'text-accent hover:text-accent-hover'
              : 'text-text-secondary hover:text-text-primary'"
            :title="sub.is_default ? 'Remove default' : 'Set as default'"
            @click="toggleDefault(sub)"
          >
            <StarSolidIcon
              v-if="sub.is_default"
              class="h-4 w-4"
            />
            <StarIcon
              v-else
              class="h-4 w-4"
            />
          </button>

          <button
            v-if="deleteConfirmId !== sub.id"
            type="button"
            class="rounded p-1 text-text-secondary hover:text-destructive transition-colors"
            title="Delete subtitle"
            @click="deleteConfirmId = sub.id"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
          <button
            v-else
            type="button"
            class="rounded px-2 py-0.5 text-xs font-medium bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
            @click="deleteSubtitle(sub.id)"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>

    <!-- Upload form -->
    <div class="rounded-lg border border-dashed border-border p-3 space-y-3">
      <!-- File selection -->
      <div
        class="flex items-center gap-3 cursor-pointer"
        @click="fileInput?.click()"
      >
        <div class="shrink-0 rounded-lg bg-bg-tertiary p-2">
          <CloudArrowUpIcon class="h-5 w-5 text-text-secondary" />
        </div>
        <div class="flex-1 min-w-0">
          <p
            v-if="selectedFile"
            class="text-sm text-text-primary truncate"
          >
            {{ selectedFile.name }}
          </p>
          <p
            v-else
            class="text-sm text-text-secondary"
          >
            Select subtitle file (SRT or VTT — max 5MB)
          </p>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept=".srt,.vtt"
          class="hidden"
          @change="handleFileSelect"
          @click.stop
        >
      </div>

      <!-- Metadata fields -->
      <div
        v-if="selectedFile"
        class="grid grid-cols-2 gap-2"
      >
        <select
          v-model="languageCode"
          class="rounded-lg border border-border bg-bg-tertiary px-2.5 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option
            v-for="lang in LANGUAGE_OPTIONS"
            :key="lang.code"
            :value="lang.code"
          >
            {{ lang.name }}
          </option>
        </select>
        <input
          v-model="label"
          type="text"
          placeholder="Label (auto from language)"
          class="rounded-lg border border-border bg-bg-tertiary px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
      </div>

      <!-- Upload controls -->
      <div
        v-if="selectedFile"
        class="flex items-center gap-3"
      >
        <label class="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer select-none">
          <input
            v-model="isDefault"
            type="checkbox"
            class="rounded border-border bg-bg-tertiary text-accent focus:ring-accent focus:ring-offset-0 h-3.5 w-3.5"
          >
          Set as default
        </label>
        <div class="flex-1" />
        <button
          type="button"
          class="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
          :disabled="uploadLoading"
          @click="uploadSubtitle"
        >
          {{ uploadLoading ? `Uploading ${uploadProgress}%` : 'Upload' }}
        </button>
      </div>

      <!-- Progress bar -->
      <div
        v-if="uploadLoading"
        class="h-1 rounded-full bg-bg-tertiary overflow-hidden"
      >
        <div
          class="h-full bg-accent rounded-full transition-all duration-300"
          :style="{ width: `${uploadProgress}%` }"
        />
      </div>
    </div>
  </div>
</template>
