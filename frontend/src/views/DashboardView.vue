<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '../lib/api'
import {
  FilmIcon,
  PlayCircleIcon,
  UsersIcon,
  CheckBadgeIcon,
  PlusIcon,
  TagIcon,
  PhotoIcon,
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'

interface DashboardStats {
  series_count: number
  episode_count: number
  user_count: number
  published_series_count: number
  subscriber_total: number
  subscriber_active: number
  subscriber_anonymous: number
  subscriber_suspended: number
  coins_in_circulation: number
  transactions_today: number
}

interface RecentSeries {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

const router = useRouter()

const stats = ref<DashboardStats | null>(null)
const recentSeries = ref<RecentSeries[]>([])
const loading = ref(true)
const error = ref('')

const statCards = [
  { key: 'series_count' as const, label: 'Total Series', icon: FilmIcon, iconColor: 'text-accent', iconBg: 'bg-accent-light', blur: 'bg-accent/5', blurHover: 'group-hover:bg-accent/10' },
  { key: 'episode_count' as const, label: 'Total Episodes', icon: PlayCircleIcon, iconColor: 'text-blue-500', iconBg: 'bg-blue-50', blur: 'bg-blue-500/5', blurHover: 'group-hover:bg-blue-500/10' },
  { key: 'user_count' as const, label: 'Users', icon: UsersIcon, iconColor: 'text-amber-500', iconBg: 'bg-amber-50', blur: 'bg-amber-500/5', blurHover: 'group-hover:bg-amber-500/10' },
  { key: 'published_series_count' as const, label: 'Published', icon: CheckBadgeIcon, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', blur: 'bg-emerald-100', blurHover: 'group-hover:bg-emerald-200' },
  { key: 'subscriber_total' as const, label: 'Subscribers', icon: UserGroupIcon, iconColor: 'text-violet-500', iconBg: 'bg-violet-50', blur: 'bg-violet-500/5', blurHover: 'group-hover:bg-violet-500/10' },
  { key: 'coins_in_circulation' as const, label: 'Coins in Circulation', icon: CurrencyDollarIcon, iconColor: 'text-yellow-600', iconBg: 'bg-yellow-50', blur: 'bg-yellow-500/5', blurHover: 'group-hover:bg-yellow-500/10' },
]

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-100 text-emerald-800'
    case 'draft':
    case 'archived':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

async function fetchDashboard() {
  loading.value = true
  error.value = ''
  try {
    const [statsRes, recentRes] = await Promise.all([
      api.get<DashboardStats>('/api/dashboard/stats'),
      api.get<{ series: RecentSeries[] }>('/api/dashboard/recent'),
    ])
    stats.value = statsRes.data
    recentSeries.value = recentRes.data.series
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to load dashboard')
      : 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Overview of your streaming platform
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="px-4 py-2 bg-white border border-border text-gray-700 text-sm font-medium rounded-lg shadow-[--shadow-subtle] hover:bg-gray-50 transition-all"
          @click="router.push('/tags')"
        >
          <TagIcon class="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Manage Tags
        </button>
        <button
          class="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg shadow-sm hover:bg-accent-hover transition-all flex items-center gap-2"
          @click="router.push('/series/create')"
        >
          <PlusIcon class="h-4 w-4" />
          Create Series
        </button>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6"
    >
      {{ error }}
      <button
        class="ml-2 underline hover:no-underline"
        @click="fetchDashboard"
      >
        Retry
      </button>
    </div>

    <!-- Loading Skeleton -->
    <template v-if="loading">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div
          v-for="i in 6"
          :key="i"
          class="bg-white rounded-xl border border-border p-5 animate-pulse"
        >
          <div class="h-4 w-20 bg-gray-200 rounded mb-3" />
          <div class="h-8 w-16 bg-gray-100 rounded" />
        </div>
      </div>
      <div class="bg-white rounded-xl border border-border animate-pulse">
        <div class="p-5 border-b border-gray-100">
          <div class="h-5 w-32 bg-gray-200 rounded" />
        </div>
        <div class="p-5 space-y-4">
          <div
            v-for="i in 5"
            :key="i"
            class="flex items-center gap-3"
          >
            <div class="h-10 w-10 bg-gray-200 rounded-lg" />
            <div class="flex-1">
              <div class="h-4 w-40 bg-gray-200 rounded mb-1" />
              <div class="h-3 w-24 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Dashboard Content -->
    <template v-else-if="!error">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div
          v-for="card in statCards"
          :key="card.key"
          class="group bg-white p-6 rounded-xl border border-border shadow-[--shadow-card] hover:shadow-[--shadow-floating] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div
            :class="[card.blur, card.blurHover, 'absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10 transition-all']"
          />
          <div class="relative flex items-center justify-between mb-3">
            <div
              :class="[card.iconBg, 'w-10 h-10 rounded-full flex items-center justify-center']"
            >
              <component
                :is="card.icon"
                :class="[card.iconColor, 'h-5 w-5']"
              />
            </div>
          </div>
          <div class="relative">
            <span class="text-sm font-medium text-gray-500">{{ card.label }}</span>
            <div class="text-3xl font-bold text-gray-900 mt-1">
              {{ stats?.[card.key] ?? 0 }}
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Series -->
      <div class="bg-white rounded-xl border border-border shadow-[--shadow-card] overflow-hidden">
        <div class="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ArrowTrendingUpIcon class="h-5 w-5 text-gray-500" />
            <h2 class="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <button
            class="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            @click="router.push('/series')"
          >
            View all
          </button>
        </div>

        <!-- Empty State -->
        <div
          v-if="recentSeries.length === 0"
          class="py-12 text-center"
        >
          <div class="bg-gray-50 rounded-full p-4 inline-block mb-3">
            <FilmIcon class="mx-auto h-10 w-10 text-gray-500" />
          </div>
          <p class="text-sm font-medium text-gray-900 mb-1">
            No series yet
          </p>
          <p class="text-sm text-gray-500 mb-4">
            Create your first one to get started.
          </p>
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            @click="router.push('/series/create')"
          >
            <PlusIcon class="h-4 w-4" />
            Create Series
          </button>
        </div>

        <!-- Series List -->
        <div
          v-else
          class="divide-y divide-gray-100"
        >
          <button
            v-for="s in recentSeries"
            :key="s.id"
            class="group flex items-center justify-between p-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer w-full text-left"
            @click="router.push(`/series/${s.id}`)"
          >
            <div class="flex items-center gap-4 min-w-0 flex-1">
              <!-- Thumbnail -->
              <div class="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm shrink-0">
                <img
                  v-if="s.thumbnail_url"
                  :src="s.thumbnail_url"
                  :alt="s.title"
                  class="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                >
                <div
                  v-else
                  class="h-full w-full bg-gray-50 flex items-center justify-center"
                >
                  <PhotoIcon class="h-5 w-5 text-gray-400" />
                </div>
              </div>

              <!-- Info -->
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-900 group-hover:text-accent transition-colors truncate">
                  {{ s.title }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  Updated {{ formatRelativeTime(s.updated_at) }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 shrink-0 ml-4">
              <!-- Status Badge -->
              <span
                :class="[
                  getStatusBadgeClass(s.status),
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                ]"
              >
                {{ s.status }}
              </span>

              <!-- Chevron -->
              <ChevronRightIcon class="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
