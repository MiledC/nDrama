<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  title: string
  description?: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="text-center py-12">
    <div
      v-if="icon"
      class="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"
    >
      <component
        :is="icon"
        class="h-8 w-8 text-gray-400"
      />
    </div>
    <h3 class="text-base font-medium text-gray-900 mb-1">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="text-sm text-gray-500 mb-4"
    >
      {{ description }}
    </p>
    <button
      v-if="actionLabel"
      class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
