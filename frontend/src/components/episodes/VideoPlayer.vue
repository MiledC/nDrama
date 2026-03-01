<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PlayCircleIcon,
  MusicalNoteIcon,
  LanguageIcon,
} from '@heroicons/vue/24/outline'

interface AudioTrack {
  id: string
  language_code: string
  label: string
  file_url: string
  is_default: boolean
}

interface SubtitleTrack {
  id: string
  language_code: string
  label: string
  file_url: string
  format: 'srt' | 'vtt'
  is_default: boolean
}

interface Props {
  playbackId: string | null
  status?: 'draft' | 'processing' | 'ready' | 'published'
  audioTracks?: AudioTrack[]
  subtitleTracks?: SubtitleTrack[]
}

const props = withDefaults(defineProps<Props>(), {
  status: 'draft',
  audioTracks: () => [],
  subtitleTracks: () => [],
})

const hasVideo = computed(() => !!props.playbackId)
const isProcessing = computed(
  () => props.status === 'processing',
)
const streamUrl = computed(() =>
  props.playbackId ? `https://stream.mux.com/${props.playbackId}.m3u8` : '',
)
const posterUrl = computed(() =>
  props.playbackId
    ? `https://image.mux.com/${props.playbackId}/thumbnail.webp?width=640`
    : '',
)

// VTT subtitles can be used as native <track> elements
const vttSubtitles = computed(() =>
  props.subtitleTracks.filter((s) => s.format === 'vtt'),
)

const hasTracks = computed(
  () => props.audioTracks.length > 0 || props.subtitleTracks.length > 0,
)

const showTrackInfo = ref(false)
</script>

<template>
  <div>
    <div class="relative w-full aspect-video rounded-lg overflow-hidden bg-bg-tertiary border border-border">
      <!-- Video player when ready -->
      <div
        v-if="hasVideo && !isProcessing"
        class="w-full h-full"
      >
        <video
          :src="streamUrl"
          :poster="posterUrl"
          controls
          crossorigin="anonymous"
          preload="metadata"
          class="w-full h-full object-contain bg-black"
        >
          <track
            v-for="sub in vttSubtitles"
            :key="sub.id"
            kind="subtitles"
            :src="sub.file_url"
            :srclang="sub.language_code"
            :label="sub.label"
            :default="sub.is_default"
          >
          Your browser does not support the video tag.
        </video>
      </div>

      <!-- Processing state -->
      <div
        v-else-if="isProcessing"
        class="absolute inset-0 flex flex-col items-center justify-center text-center"
      >
        <div class="relative">
          <div class="h-12 w-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
        <p class="text-sm font-medium text-text-primary mt-4">
          Processing video...
        </p>
        <p class="text-xs text-text-secondary mt-1">
          This may take a few minutes
        </p>
      </div>

      <!-- No video placeholder -->
      <div
        v-else
        class="absolute inset-0 flex flex-col items-center justify-center"
      >
        <PlayCircleIcon class="h-16 w-16 text-text-secondary/50 mb-2" />
        <p class="text-sm text-text-secondary">
          No video available
        </p>
      </div>
    </div>

    <!-- Track info bar -->
    <div
      v-if="hasTracks"
      class="mt-2"
    >
      <button
        type="button"
        class="flex items-center gap-3 text-xs text-text-secondary hover:text-text-primary transition-colors"
        @click="showTrackInfo = !showTrackInfo"
      >
        <span
          v-if="audioTracks.length > 0"
          class="flex items-center gap-1"
        >
          <MusicalNoteIcon class="h-3.5 w-3.5" />
          {{ audioTracks.length }} audio
        </span>
        <span
          v-if="subtitleTracks.length > 0"
          class="flex items-center gap-1"
        >
          <LanguageIcon class="h-3.5 w-3.5" />
          {{ subtitleTracks.length }} subtitle{{ subtitleTracks.length !== 1 ? 's' : '' }}
        </span>
      </button>

      <div
        v-if="showTrackInfo"
        class="mt-2 rounded-lg border border-border bg-bg-tertiary/50 p-3 space-y-2"
      >
        <div
          v-if="audioTracks.length > 0"
          class="space-y-1"
        >
          <p class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            Audio Tracks
          </p>
          <div
            v-for="track in audioTracks"
            :key="track.id"
            class="flex items-center gap-2 text-xs"
          >
            <span class="text-text-primary">{{ track.label }}</span>
            <span class="rounded bg-bg-tertiary px-1 py-0.5 text-[10px] font-mono text-text-secondary uppercase">
              {{ track.language_code }}
            </span>
            <span
              v-if="track.is_default"
              class="rounded bg-accent/15 px-1 py-0.5 text-[10px] text-accent"
            >
              default
            </span>
          </div>
        </div>

        <div
          v-if="subtitleTracks.length > 0"
          class="space-y-1"
        >
          <p class="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            Subtitles
          </p>
          <div
            v-for="sub in subtitleTracks"
            :key="sub.id"
            class="flex items-center gap-2 text-xs"
          >
            <span class="text-text-primary">{{ sub.label }}</span>
            <span class="rounded bg-bg-tertiary px-1 py-0.5 text-[10px] font-mono text-text-secondary uppercase">
              {{ sub.language_code }}
            </span>
            <span class="rounded bg-bg-tertiary px-1 py-0.5 text-[10px] font-mono text-text-secondary uppercase">
              {{ sub.format }}
            </span>
            <span
              v-if="sub.is_default"
              class="rounded bg-accent/15 px-1 py-0.5 text-[10px] text-accent"
            >
              default
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
