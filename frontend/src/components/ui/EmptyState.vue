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
    <component
      :is="icon"
      v-if="icon"
      class="mx-auto h-10 w-10 text-text-secondary mb-3"
    />
    <h3 class="text-base font-medium text-text-primary mb-1">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="text-sm text-text-secondary mb-4"
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
