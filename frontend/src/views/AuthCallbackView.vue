<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

onMounted(async () => {
  const accessToken = route.query.access_token as string
  const refreshToken = route.query.refresh_token as string

  if (accessToken && refreshToken) {
    auth.setTokens(accessToken, refreshToken)
    await auth.fetchMe()
    router.push('/')
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center">
    <p class="text-text-secondary">
      Authenticating...
    </p>
  </div>
</template>
