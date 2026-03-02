<script setup lang="ts">
import { useToastStore } from '../../stores/toast'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const toast = useToastStore()

const iconMap = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
}

const colorMap = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
}

const iconColorMap = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
}
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-x-4 opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-4 opacity-0"
    >
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        :class="[
          colorMap[t.type],
          'border rounded-lg px-4 py-3 flex items-start gap-3 shadow-lg',
        ]"
      >
        <component
          :is="iconMap[t.type]"
          :class="[iconColorMap[t.type], 'h-5 w-5 flex-shrink-0 mt-0.5']"
        />
        <p class="text-sm text-gray-900 flex-1">
          {{ t.message }}
        </p>
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          @click="toast.remove(t.id)"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
