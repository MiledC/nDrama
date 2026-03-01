<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

defineProps<{
  message: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <ExclamationTriangleIcon class="h-5 w-5 text-destructive flex-shrink-0" />
      <span class="text-sm text-destructive">{{ message }}</span>
    </div>
    <button
      class="text-sm text-destructive underline hover:no-underline flex-shrink-0 ml-4"
      @click="emit('retry')"
    >
      Retry
    </button>
  </div>
</template>
