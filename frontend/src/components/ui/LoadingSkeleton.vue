<script setup lang="ts">
defineProps<{
  variant?: 'card' | 'row' | 'text'
  count?: number
}>()
</script>

<template>
  <div class="animate-pulse">
    <!-- Card variant -->
    <template v-if="variant === 'card'">
      <div
        v-for="i in (count ?? 1)"
        :key="i"
        class="rounded-xl border border-border bg-bg-secondary p-5 mb-4"
      >
        <div class="h-4 w-24 bg-bg-tertiary rounded mb-3" />
        <div class="h-8 w-16 bg-bg-tertiary rounded" />
      </div>
    </template>

    <!-- Row variant -->
    <template v-else-if="variant === 'row'">
      <div
        v-for="i in (count ?? 3)"
        :key="i"
        class="flex items-center gap-3 py-3"
      >
        <div class="h-10 w-10 bg-bg-tertiary rounded-lg flex-shrink-0" />
        <div class="flex-1">
          <div class="h-4 w-40 bg-bg-tertiary rounded mb-1.5" />
          <div class="h-3 w-24 bg-bg-tertiary rounded" />
        </div>
      </div>
    </template>

    <!-- Text variant (default) -->
    <template v-else>
      <div
        v-for="i in (count ?? 3)"
        :key="i"
        class="mb-3"
      >
        <div
          class="h-4 bg-bg-tertiary rounded"
          :style="{ width: `${70 + Math.random() * 30}%` }"
        />
      </div>
    </template>
  </div>
</template>
