<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import api from '../lib/api'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/vue'
import {
  EllipsisVerticalIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor'
  is_active: boolean
  oauth_provider: string | null
  created_at: string
}

const users = ref<User[]>([])
const loading = ref(true)
const error = ref('')

// Invite form state
const showInviteForm = ref(false)
const inviteEmail = ref('')
const inviteName = ref('')
const invitePassword = ref('')
const inviteRole = ref<'admin' | 'editor'>('editor')
const inviteLoading = ref(false)
const inviteError = ref('')

async function fetchUsers() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/api/users')
    users.value = response.data
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to load users') : 'Failed to load users'
  } finally {
    loading.value = false
  }
}

async function inviteUser() {
  inviteLoading.value = true
  inviteError.value = ''
  try {
    await api.post('/api/users/invite', {
      email: inviteEmail.value,
      name: inviteName.value,
      password: invitePassword.value,
      role: inviteRole.value,
    })
    showInviteForm.value = false
    inviteEmail.value = ''
    inviteName.value = ''
    invitePassword.value = ''
    inviteRole.value = 'editor'
    await fetchUsers()
  } catch (e: unknown) {
    inviteError.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to invite user') : 'Failed to invite user'
  } finally {
    inviteLoading.value = false
  }
}

async function changeRole(userId: string, role: 'admin' | 'editor') {
  try {
    await api.patch(`/api/users/${userId}/role`, { role })
    await fetchUsers()
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to change role') : 'Failed to change role'
  }
}

async function toggleActive(userId: string, isActive: boolean) {
  try {
    await api.patch(`/api/users/${userId}/active`, { is_active: !isActive })
    await fetchUsers()
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to update user status') : 'Failed to update user status'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(fetchUsers)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-text-primary">
        Users
      </h1>
      <button
        class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        @click="showInviteForm = true"
      >
        <PlusIcon class="h-4 w-4" />
        Invite User
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>

    <!-- Invite Form Modal -->
    <div
      v-if="showInviteForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-text-primary mb-4">
          Invite User
        </h2>

        <div
          v-if="inviteError"
          class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ inviteError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="inviteUser"
        >
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              v-model="inviteEmail"
              type="email"
              required
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              v-model="inviteName"
              type="text"
              required
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Temporary Password</label>
            <input
              v-model="invitePassword"
              type="password"
              required
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Role</label>
            <select
              v-model="inviteRole"
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="editor">
                Editor
              </option>
              <option value="admin">
                Admin
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
              @click="showInviteForm = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="inviteLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ inviteLoading ? 'Inviting...' : 'Send Invite' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-text-secondary"
    >
      Loading users...
    </div>

    <!-- Users Table -->
    <div
      v-else
      class="overflow-hidden rounded-xl border border-border"
    >
      <table class="w-full">
        <thead>
          <tr class="border-b border-border bg-bg-secondary">
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Name
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Email
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Role
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Joined
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="u in users"
            :key="u.id"
            class="hover:bg-bg-secondary/50 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-text-primary">{{ u.name }}</span>
                <span
                  v-if="u.oauth_provider"
                  class="inline-flex items-center rounded-full bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary"
                >
                  {{ u.oauth_provider }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-text-secondary">
              {{ u.email }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  u.role === 'admin'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-bg-tertiary text-text-secondary',
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                ]"
              >
                {{ u.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  u.is_active
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-destructive/15 text-destructive',
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                ]"
              >
                {{ u.is_active ? 'Active' : 'Disabled' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-text-secondary">
              {{ formatDate(u.created_at) }}
            </td>
            <td class="px-4 py-3 text-right">
              <Menu
                as="div"
                class="relative inline-block text-left"
              >
                <MenuButton class="text-text-secondary hover:text-text-primary transition-colors">
                  <EllipsisVerticalIcon class="h-5 w-5" />
                </MenuButton>
                <MenuItems class="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-bg-secondary border border-border shadow-lg focus:outline-none">
                  <div class="py-1">
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm text-text-primary']"
                        @click="changeRole(u.id, u.role === 'admin' ? 'editor' : 'admin')"
                      >
                        Make {{ u.role === 'admin' ? 'Editor' : 'Admin' }}
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm', u.is_active ? 'text-destructive' : 'text-green-400']"
                        @click="toggleActive(u.id, u.is_active)"
                      >
                        {{ u.is_active ? 'Disable Account' : 'Enable Account' }}
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </Menu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
