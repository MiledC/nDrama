<script setup lang="ts">
import { computed } from 'vue'
import { PlayCircleIcon } from '@heroicons/vue/24/outline'

interface Props {
  playbackId: string | null
  status?: 'draft' | 'processing' | 'ready' | 'published'
}

const props = withDefaults(defineProps<Props>(), {
  status: 'draft',
})

const hasVideo = computed(() => !!props.playbackId)
const isProcessing = computed(
  () => props.status === 'processing'
)
const streamUrl = computed(() =>
  props.playbackId ? `https://stream.mux.com/${props.playbackId}.m3u8` : ''
)
const posterUrl = computed(() =>
  props.playbackId
    ? `https://image.mux.com/${props.playbackId}/thumbnail.webp?width=640`
    : ''
)
</script>

<template>
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
        preload="metadata"
        class="w-full h-full object-contain bg-black"
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
</template>
