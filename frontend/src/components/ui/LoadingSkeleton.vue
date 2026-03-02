<script setup lang="ts">
defineProps<{
  variant?: 'card' | 'row' | 'text'
  count?: number
}>()
</script>

<template>
  <div>
    <!-- Card variant -->
    <template v-if="variant === 'card'">
      <div
        v-for="i in (count ?? 1)"
        :key="i"
        class="rounded-xl border border-gray-200 bg-white p-5 mb-4"
      >
        <div class="h-4 w-24 bg-gray-200 shimmer rounded mb-3" />
        <div class="h-8 w-16 bg-gray-100 shimmer rounded" />
      </div>
    </template>

    <!-- Row variant -->
    <template v-else-if="variant === 'row'">
      <div
        v-for="i in (count ?? 3)"
        :key="i"
        class="flex items-center gap-3 py-3"
      >
        <div class="h-10 w-10 bg-gray-200 shimmer rounded-lg flex-shrink-0" />
        <div class="flex-1">
          <div class="h-4 w-40 bg-gray-200 shimmer rounded mb-1.5" />
          <div class="h-3 w-24 bg-gray-100 shimmer rounded" />
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
          class="h-4 bg-gray-200 shimmer rounded"
          :style="{ width: `${70 + Math.random() * 30}%` }"
        />
      </div>
    </template>
  </div>
</template>
