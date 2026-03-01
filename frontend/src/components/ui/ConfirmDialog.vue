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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  >
    <div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md">
      <h2 class="text-lg font-semibold text-text-primary mb-4">
        {{ title }}
      </h2>

      <p class="text-text-secondary mb-4">
        {{ message }}
      </p>

      <div
        v-if="error"
        class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
      >
        {{ error }}
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
          @click="emit('cancel')"
        >
          {{ cancelLabel ?? 'Cancel' }}
        </button>
        <button
          :disabled="loading"
          :class="[
            variant === 'danger' ? 'bg-destructive hover:bg-destructive/90' :
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
