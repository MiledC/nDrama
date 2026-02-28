<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  HomeIcon,
  FilmIcon,
  Cog6ToothIcon,
  UsersIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Series', href: '/series', icon: FilmIcon },
  { name: 'Users', href: '/users', icon: UsersIcon, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

function isActive(href: string): boolean {
  return route.path === href
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-bg-tertiary flex flex-col">
    <!-- Logo -->
    <div class="flex h-16 items-center px-6 border-b border-bg-tertiary">
      <span class="text-xl font-bold text-accent">nDrama</span>
    </div>

    <!-- Navigation -->
    <nav class="mt-6 px-3 flex-1">
      <ul class="space-y-1">
        <li
          v-for="item in navigation"
          :key="item.name"
        >
          <RouterLink
            v-if="!item.adminOnly || auth.isAdmin"
            :to="item.href"
            :class="[
              isActive(item.href)
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                isActive(item.href) ? 'text-white' : 'text-text-secondary group-hover:text-text-primary',
                'h-5 w-5 shrink-0 transition-colors',
              ]"
            />
            {{ item.name }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- User section at bottom -->
    <div class="border-t border-bg-tertiary p-3">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-text-primary truncate">
            {{ auth.user?.name }}
          </p>
          <p class="text-xs text-text-secondary truncate">
            {{ auth.user?.email }}
          </p>
        </div>
        <button
          class="text-text-secondary hover:text-text-primary transition-colors"
          title="Sign out"
          @click="handleLogout"
        >
          <ArrowRightStartOnRectangleIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </aside>
</template>
