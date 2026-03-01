import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

let nextId = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([])

  function add(type: ToastItem['type'], message: string) {
    const id = ++nextId
    toasts.value.push({ id, type, message })
    window.setTimeout(() => remove(id), 4000)
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function success(message: string) { add('success', message) }
  function error(message: string) { add('error', message) }
  function warning(message: string) { add('warning', message) }
  function info(message: string) { add('info', message) }

  return { toasts, add, remove, success, error, warning, info }
})
