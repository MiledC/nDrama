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
} from '@heroicons/vue/24/outline'

interface DashboardStats {
  series_count: number
  episode_count: number
  user_count: number
  published_series_count: number
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
  { key: 'series_count' as const, label: 'Total Series', icon: FilmIcon, color: 'text-accent' },
  { key: 'episode_count' as const, label: 'Total Episodes', icon: PlayCircleIcon, color: 'text-blue-400' },
  { key: 'user_count' as const, label: 'Users', icon: UsersIcon, color: 'text-amber-400' },
  { key: 'published_series_count' as const, label: 'Published', icon: CheckBadgeIcon, color: 'text-emerald-400' },
]

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-green-500/15 text-green-400'
    case 'archived':
      return 'bg-amber-500/15 text-amber-400'
    default:
      return 'bg-bg-tertiary text-text-secondary'
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
        <h1 class="text-2xl font-bold text-text-primary">
          Dashboard
        </h1>
        <p class="text-sm text-text-secondary mt-1">
          Overview of your streaming platform
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
          @click="router.push('/tags')"
        >
          <TagIcon class="h-4 w-4" />
          Manage Tags
        </button>
        <button
          class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
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
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-6"
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          v-for="i in 4"
          :key="i"
          class="rounded-xl border border-border bg-bg-secondary p-5 animate-pulse"
        >
          <div class="h-4 w-20 bg-bg-tertiary rounded mb-3" />
          <div class="h-8 w-16 bg-bg-tertiary rounded" />
        </div>
      </div>
      <div class="rounded-xl border border-border bg-bg-secondary animate-pulse">
        <div class="p-5 border-b border-border">
          <div class="h-5 w-32 bg-bg-tertiary rounded" />
        </div>
        <div class="p-5 space-y-4">
          <div
            v-for="i in 5"
            :key="i"
            class="flex items-center gap-3"
          >
            <div class="h-10 w-10 bg-bg-tertiary rounded-lg" />
            <div class="flex-1">
              <div class="h-4 w-40 bg-bg-tertiary rounded mb-1" />
              <div class="h-3 w-24 bg-bg-tertiary rounded" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Dashboard Content -->
    <template v-else-if="!error">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          v-for="card in statCards"
          :key="card.key"
          class="rounded-xl border border-border bg-bg-secondary p-5 hover:border-border/80 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-text-secondary">{{ card.label }}</span>
            <component
              :is="card.icon"
              :class="[card.color, 'h-5 w-5']"
            />
          </div>
          <div class="text-3xl font-bold text-text-primary tracking-tight">
            {{ stats?.[card.key] ?? 0 }}
          </div>
        </div>
      </div>

      <!-- Recent Series -->
      <div class="rounded-xl border border-border bg-bg-secondary">
        <div class="flex items-center justify-between p-5 border-b border-border">
          <div class="flex items-center gap-2">
            <ArrowTrendingUpIcon class="h-5 w-5 text-text-secondary" />
            <h2 class="text-base font-semibold text-text-primary">
              Recent Activity
            </h2>
          </div>
          <button
            class="text-sm text-accent hover:text-accent-hover transition-colors"
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
          <FilmIcon class="mx-auto h-10 w-10 text-text-secondary mb-3" />
          <p class="text-sm text-text-secondary mb-4">
            No series yet. Create your first one to get started.
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
          class="divide-y divide-border"
        >
          <button
            v-for="s in recentSeries"
            :key="s.id"
            class="flex items-center gap-4 w-full px-5 py-3.5 text-left hover:bg-bg-tertiary/50 transition-colors"
            @click="router.push(`/series/${s.id}`)"
          >
            <!-- Thumbnail -->
            <div class="flex-shrink-0 h-10 w-10 rounded-lg bg-bg-tertiary flex items-center justify-center overflow-hidden">
              <img
                v-if="s.thumbnail_url"
                :src="s.thumbnail_url"
                :alt="s.title"
                class="h-full w-full object-cover"
              >
              <PhotoIcon
                v-else
                class="h-5 w-5 text-text-secondary"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-text-primary truncate">
                {{ s.title }}
              </p>
              <p class="text-xs text-text-secondary">
                Updated {{ formatRelativeTime(s.updated_at) }}
              </p>
            </div>

            <!-- Status Badge -->
            <span
              :class="[
                getStatusBadgeClass(s.status),
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize flex-shrink-0',
              ]"
            >
              {{ s.status }}
            </span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
