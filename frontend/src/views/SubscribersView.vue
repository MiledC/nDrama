<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'
import { useSubscriberStore } from '../stores/subscribers'
import type { SubscriberStatus } from '../types/subscriber'

const router = useRouter()
const store = useSubscriberStore()

// Filter state
const searchQuery = ref('')
const statusFilter = ref<'all' | SubscriberStatus>('all')
const page = ref(1)
const perPage = ref(20)

// Debounce
let searchTimer: number | null = null

const totalPages = computed(() => Math.ceil(store.total / perPage.value))
const hasPrevious = computed(() => page.value > 1)
const hasNext = computed(() => page.value < totalPages.value)

async function fetchSubscribers() {
  const params: Record<string, string | number> = {
    page: page.value,
    per_page: perPage.value,
  }
  if (searchQuery.value) params.search = searchQuery.value
  if (statusFilter.value !== 'all') params.status = statusFilter.value

  await store.fetchSubscribers(params)
}

function debouncedSearch() {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    page.value = 1
    fetchSubscribers()
  }, 300)
}

function goToPreviousPage() {
  if (hasPrevious.value) { page.value--; fetchSubscribers() }
}

function goToNextPage() {
  if (hasNext.value) { page.value++; fetchSubscribers() }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'suspended': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'banned': return 'bg-red-50 text-red-700 border border-red-200'
    case 'anonymous': return 'bg-gray-100 text-gray-600 border border-gray-200'
    default: return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function displayName(sub: { name: string | null; email: string | null; status: string }): string {
  if (sub.name) return sub.name
  if (sub.email) return sub.email
  return 'Anonymous'
}

watch(searchQuery, debouncedSearch)
watch(statusFilter, () => { page.value = 1; fetchSubscribers() })
onMounted(fetchSubscribers)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Subscribers
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Manage your platform subscribers
        </p>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="store.error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ store.error }}
      <button
        class="ml-2 underline hover:no-underline"
        @click="fetchSubscribers"
      >
        Retry
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="relative flex-1 min-w-[300px]">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email..."
          class="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent shadow-[--shadow-subtle]"
        >
      </div>
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="all">
          All Status
        </option>
        <option value="anonymous">
          Anonymous
        </option>
        <option value="active">
          Active
        </option>
        <option value="suspended">
          Suspended
        </option>
        <option value="banned">
          Banned
        </option>
      </select>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="store.loading && store.subscribers.length === 0"
      class="overflow-hidden rounded-xl border border-border bg-white shadow-[--shadow-card] animate-pulse"
    >
      <div class="border-b border-gray-200 bg-[#F9FAFB] px-4 py-3">
        <div class="h-4 w-32 bg-gray-200 rounded" />
      </div>
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-center gap-4 px-4 py-3 border-b border-gray-200 last:border-0"
      >
        <div class="h-9 w-9 bg-gray-100 rounded-full flex-shrink-0" />
        <div class="flex-1">
          <div class="h-4 w-40 bg-gray-100 rounded mb-1" />
          <div class="h-3 w-24 bg-gray-100 rounded" />
        </div>
        <div class="h-5 w-16 bg-gray-100 rounded-full" />
      </div>
    </div>

    <!-- Subscribers Table -->
    <div
      v-else-if="store.subscribers.length > 0"
      class="bg-white rounded-xl border border-border shadow-[--shadow-card] overflow-hidden"
    >
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-[#F9FAFB]">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Subscriber
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Country
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div class="flex items-center justify-end gap-1">
                <CurrencyDollarIcon class="h-3.5 w-3.5" />
                Coins
              </div>
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Registered
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Last Active
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="sub in store.subscribers"
            :key="sub.id"
            class="hover:bg-gray-50 transition-colors cursor-pointer"
            @click="router.push(`/subscribers/${sub.id}`)"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0 h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    v-if="sub.avatar_url"
                    :src="sub.avatar_url"
                    :alt="displayName(sub)"
                    class="h-full w-full object-cover"
                  >
                  <UserGroupIcon
                    v-else
                    class="h-4 w-4 text-gray-400"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ displayName(sub) }}
                  </p>
                  <p
                    v-if="sub.email && sub.name"
                    class="text-xs text-gray-500"
                  >
                    {{ sub.email }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  getStatusBadgeClass(sub.status),
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                ]"
              >
                {{ sub.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ sub.country ?? '—' }}
            </td>
            <td class="px-4 py-3 text-right">
              <span class="text-sm font-semibold text-gray-900">
                {{ sub.coin_balance.toLocaleString() }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ formatDate(sub.registered_at) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ formatDate(sub.last_active_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12"
    >
      <div class="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <UserGroupIcon class="h-6 w-6 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No subscribers found
      </h3>
      <p class="text-gray-500">
        {{ searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Subscribers will appear here when they install the app' }}
      </p>
    </div>

    <!-- Pagination -->
    <div
      v-if="!store.loading && totalPages > 1"
      class="flex items-center justify-between mt-6"
    >
      <div class="text-sm text-gray-500">
        Page {{ page }} of {{ totalPages }} ({{ store.total }} total)
      </div>
      <div class="flex gap-2">
        <button
          :disabled="!hasPrevious"
          class="rounded-lg bg-white border border-border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="goToPreviousPage"
        >
          Previous
        </button>
        <button
          :disabled="!hasNext"
          class="rounded-lg bg-white border border-border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="goToNextPage"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
