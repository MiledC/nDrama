<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
  >
    <div class="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          {{ title }}
        </h2>

        <p class="text-gray-500 mb-4">
          {{ message }}
        </p>

        <div
          v-if="error"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ error }}
        </div>
      </div>

      <div class="flex justify-end gap-3 bg-gray-50 border-t border-gray-200 px-6 py-4">
        <button
          type="button"
          class="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="emit('cancel')"
        >
          {{ cancelLabel ?? 'Cancel' }}
        </button>
        <button
          :disabled="loading"
          :class="[
            variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
            variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' :
            'bg-accent hover:bg-accent-hover',
            'rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors',
          ]"
          @click="emit('confirm')"
        >
          {{ confirmLabel ?? 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>
