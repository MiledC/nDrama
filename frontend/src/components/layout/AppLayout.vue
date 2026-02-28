<script setup lang="ts">
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'

const route = useRoute()

const publicRoutes = ['login', 'auth-callback']
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <template v-if="!publicRoutes.includes(route.name as string)">
      <Sidebar />
      <main class="pl-64">
        <div class="px-8 py-6">
          <slot />
        </div>
      </main>
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>
