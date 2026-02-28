<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import {
  HomeIcon,
  FilmIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'

const route = useRoute()

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Series', href: '/series', icon: FilmIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

function isActive(href: string): boolean {
  return route.path === href
}
</script>

<template>
  <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-bg-tertiary">
    <!-- Logo -->
    <div class="flex h-16 items-center px-6 border-b border-bg-tertiary">
      <span class="text-xl font-bold text-accent">nDrama</span>
    </div>

    <!-- Navigation -->
    <nav class="mt-6 px-3">
      <ul class="space-y-1">
        <li v-for="item in navigation" :key="item.name">
          <RouterLink
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
  </aside>
</template>
