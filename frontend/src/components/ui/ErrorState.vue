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
  <div class="rounded-lg px-6 py-8 flex flex-col items-center text-center">
    <div class="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <ExclamationTriangleIcon class="h-7 w-7 text-red-600 flex-shrink-0" />
    </div>
    <h3 class="text-base font-medium text-gray-900 mb-1">
      Something went wrong
    </h3>
    <p class="text-sm text-gray-500 mb-4">
      {{ message }}
    </p>
    <button
      class="text-sm font-medium text-accent hover:text-accent-hover underline hover:no-underline transition-colors"
      @click="emit('retry')"
    >
      Try again
    </button>
  </div>
</template>
