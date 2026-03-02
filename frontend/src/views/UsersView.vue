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
import { useToastStore } from '../stores/toast'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor'
  is_active: boolean
  oauth_provider: string | null
  created_at: string
}

const toast = useToastStore()

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
    toast.success('User invited successfully')
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
    toast.success(`Role changed to ${role}`)
    await fetchUsers()
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to change role') : 'Failed to change role'
  }
}

async function toggleActive(userId: string, isActive: boolean) {
  try {
    await api.patch(`/api/users/${userId}/active`, { is_active: !isActive })
    toast.success(`Account ${isActive ? 'disabled' : 'enabled'}`)
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
      <h1 class="text-2xl font-bold text-gray-900">
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
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>

    <!-- Invite Form Modal -->
    <div
      v-if="showInviteForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Invite User
        </h2>

        <div
          v-if="inviteError"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ inviteError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="inviteUser"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="inviteEmail"
              type="email"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="inviteName"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
            <input
              v-model="invitePassword"
              type="password"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              v-model="inviteRole"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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

    <!-- Loading Skeleton -->
    <div
      v-if="loading"
      class="overflow-hidden rounded-xl border border-border bg-white shadow-[--shadow-card] animate-pulse"
    >
      <div class="border-b border-gray-200 bg-[#F9FAFB] px-4 py-3">
        <div class="h-4 w-32 bg-gray-200 rounded" />
      </div>
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-center gap-4 px-4 py-3 border-b border-gray-200 last:border-0"
      >
        <div class="flex-1">
          <div class="h-4 w-32 bg-gray-200 rounded mb-1" />
          <div class="h-3 w-48 bg-gray-200 rounded" />
        </div>
        <div class="h-5 w-14 bg-gray-200 rounded-full" />
        <div class="h-5 w-14 bg-gray-200 rounded-full" />
      </div>
    </div>

    <!-- Users Table -->
    <div
      v-else
      class="overflow-hidden rounded-xl border border-border bg-white shadow-[--shadow-card]"
    >
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-[#F9FAFB]">
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Joined
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="u in users"
            :key="u.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900">{{ u.name }}</span>
                <span
                  v-if="u.oauth_provider"
                  class="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs text-gray-500"
                >
                  {{ u.oauth_provider }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ u.email }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  u.role === 'admin'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200',
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
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200',
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                ]"
              >
                {{ u.is_active ? 'Active' : 'Disabled' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ formatDate(u.created_at) }}
            </td>
            <td class="px-4 py-3 text-right">
              <Menu
                as="div"
                class="relative inline-block text-left"
              >
                <MenuButton class="text-gray-400 hover:text-gray-600 transition-colors">
                  <EllipsisVerticalIcon class="h-5 w-5" />
                </MenuButton>
                <MenuItems class="absolute right-0 z-10 mt-2 w-48 rounded-lg bg-white border border-gray-200 shadow-[--shadow-dropdown] focus:outline-none">
                  <div class="py-1">
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="[active ? 'bg-gray-50' : '', 'block w-full px-4 py-2 text-left text-sm text-gray-700']"
                        @click="changeRole(u.id, u.role === 'admin' ? 'editor' : 'admin')"
                      >
                        Make {{ u.role === 'admin' ? 'Editor' : 'Admin' }}
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="[active ? 'bg-gray-50' : '', 'block w-full px-4 py-2 text-left text-sm', u.is_active ? 'text-red-600' : 'text-emerald-600']"
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
