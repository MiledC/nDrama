<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bars3Icon } from '@heroicons/vue/24/outline'
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
      <main class="lg:pl-64">
        <!-- Top Bar -->
        <div class="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
          <button
            class="lg:hidden text-text-secondary hover:text-text-primary transition-colors"
            @click="sidebarOpen = true"
          >
            <Bars3Icon class="h-6 w-6" />
          </button>
          <div class="flex-1" />
          <GlobalSearch />
        </div>
        <!-- Page Content -->
        <div class="px-4 sm:px-8 py-6">
          <slot />
        </div>
      </main>
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>
