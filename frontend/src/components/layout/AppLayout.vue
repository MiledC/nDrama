<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Bars3Icon,
  BellIcon,
  GlobeAltIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline'
import Sidebar from './Sidebar.vue'
import GlobalSearch from './GlobalSearch.vue'

const route = useRoute()
const sidebarOpen = ref(false)

const publicRoutes = ['login', 'auth-callback']
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <template v-if="!publicRoutes.includes(route.name as string)">
      <Sidebar
        :mobile-open="sidebarOpen"
        @close="sidebarOpen = false"
      />
      <div class="lg:pl-64 flex flex-col min-h-screen">
        <!-- Top Bar - Glass Header -->
        <header class="glass-header sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 flex-1">
            <button
              class="lg:hidden p-2 text-gray-500 hover:text-accent transition-colors rounded-md hover:bg-gray-100"
              @click="sidebarOpen = true"
            >
              <Bars3Icon class="h-6 w-6" />
            </button>
            <GlobalSearch />
          </div>

          <div class="flex items-center gap-3 sm:gap-4 shrink-0">
            <!-- Notification Bell -->
            <button class="p-2 text-gray-400 hover:text-text-primary transition-colors relative">
              <BellIcon class="h-5 w-5" />
              <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-white" />
            </button>

            <!-- Separator -->
            <div class="h-6 w-px bg-gray-200 mx-1" />

            <!-- Language Switcher -->
            <button class="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-accent transition-colors">
              <GlobeAltIcon class="h-4 w-4 text-gray-400" />
              <span>EN</span>
              <ChevronDownIcon class="h-3 w-3 text-gray-400" />
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <slot />
        </main>
      </div>
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>
