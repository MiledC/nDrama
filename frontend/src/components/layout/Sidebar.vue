<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  HomeIcon,
  FilmIcon,
  Cog6ToothIcon,
  UsersIcon,
  TagIcon,
  XMarkIcon,
  ChevronRightIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

defineProps<{
  mobileOpen?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

interface NavItem {
  name: string
  href: string
  icon: typeof HomeIcon
  adminOnly?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Browse', href: '/browse', icon: MagnifyingGlassIcon },
      { name: 'Series', href: '/series', icon: FilmIcon },
      { name: 'Tags & Genres', href: '/tags', icon: TagIcon },
      { name: 'Categories', href: '/categories', icon: FolderIcon },
    ],
  },
  {
    label: 'Subscribers',
    items: [
      { name: 'Subscribers', href: '/subscribers', icon: UserGroupIcon },
      { name: 'Coin Packages', href: '/coin-packages', icon: CurrencyDollarIcon, adminOnly: true },
    ],
  },
  {
    label: 'Users',
    items: [
      { name: 'Users', href: '/users', icon: UsersIcon, adminOnly: true },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    ],
  },
]

function isActive(href: string): boolean {
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function handleNavClick() {
  emit('close')
}

function getUserInitials(): string {
  const name = auth.user?.name ?? ''
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<template>
  <!-- Mobile overlay -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
    @click="emit('close')"
  />

  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-slate-400 flex flex-col transition-transform duration-200 shadow-xl lg:shadow-none',
      mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <!-- Logo -->
    <div class="flex h-16 items-center justify-between px-6 border-b border-white/10 shrink-0">
      <div class="flex items-center gap-3 text-white">
        <div class="w-8 h-8 bg-accent rounded-md flex items-center justify-center shadow-lg">
          <PlayIcon class="h-3.5 w-3.5 text-white" />
        </div>
        <span class="text-xl font-bold tracking-tight">Draama</span>
      </div>
      <button
        class="lg:hidden text-slate-400 hover:text-white transition-colors"
        @click="emit('close')"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1">
      <template
        v-for="(section, sIdx) in sections"
        :key="section.label"
      >
        <p
          :class="[
            'px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2',
            sIdx > 0 ? 'mt-8' : '',
          ]"
        >
          {{ section.label }}
        </p>

        <template
          v-for="item in section.items"
          :key="item.name"
        >
          <RouterLink
            v-if="!item.adminOnly || auth.isAdmin"
            :to="item.href"
            :class="[
              isActive(item.href)
                ? 'sidebar-item-active'
                : 'sidebar-item',
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            ]"
            @click="handleNavClick"
          >
            <component
              :is="item.icon"
              :class="[
                isActive(item.href) ? 'text-white' : 'text-slate-400',
                'h-5 w-5 shrink-0 transition-colors',
              ]"
            />
            {{ item.name }}
          </RouterLink>
        </template>
      </template>
    </nav>

    <!-- User section at bottom -->
    <div class="p-4 border-t border-white/10 shrink-0">
      <button
        class="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
        title="Sign out"
        @click="handleLogout"
      >
        <div class="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border border-white/20 text-sm font-medium text-white">
          {{ getUserInitials() }}
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-sm font-medium text-white truncate">
            {{ auth.user?.name }}
          </p>
          <p class="text-xs text-slate-500 truncate group-hover:text-slate-400">
            {{ auth.user?.email }}
          </p>
        </div>
        <ChevronRightIcon class="h-4 w-4 text-slate-600 group-hover:text-white transition-colors shrink-0" />
      </button>
    </div>
  </aside>
</template>
