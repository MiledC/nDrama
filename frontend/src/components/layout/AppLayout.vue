<script setup lang="ts">
import Sidebar from './Sidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <Sidebar />

    <!-- Main content -->
    <main class="pl-64">
      <div class="px-8 py-6">
        <slot />
      </div>
    </main>
  </div>
</template>
