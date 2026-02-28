<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  PencilIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'

interface Tag {
  id: string
  name: string
  category: 'genre' | 'mood' | 'language' | null
  created_at: string
  updated_at: string
}

const tags = ref<Tag[]>([])
const loading = ref(true)
const error = ref('')
const selectedCategory = ref<'all' | 'genre' | 'mood' | 'language'>('all')

// Create tag form state
const showCreateForm = ref(false)
const createName = ref('')
const createCategory = ref<'genre' | 'mood' | 'language' | ''>('')
const createLoading = ref(false)
const createError = ref('')

// Edit tag form state
const showEditForm = ref(false)
const editingTag = ref<Tag | null>(null)
const editName = ref('')
const editCategory = ref<'genre' | 'mood' | 'language' | ''>('')
const editLoading = ref(false)
const editError = ref('')

// Delete confirmation state
const showDeleteConfirm = ref(false)
const deletingTag = ref<Tag | null>(null)
const deleteLoading = ref(false)
const deleteError = ref('')

// Computed filtered tags
const filteredTags = computed(() => {
  if (selectedCategory.value === 'all') {
    return tags.value
  }
  return tags.value.filter(tag => tag.category === selectedCategory.value)
})

// Count tags by category
const categoryCounts = computed(() => {
  const counts = {
    all: tags.value.length,
    genre: 0,
    mood: 0,
    language: 0,
  }
  tags.value.forEach(tag => {
    if (tag.category === 'genre') counts.genre++
    else if (tag.category === 'mood') counts.mood++
    else if (tag.category === 'language') counts.language++
  })
  return counts
})

async function fetchTags() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/api/tags')
    tags.value = response.data
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to load tags') : 'Failed to load tags'
  } finally {
    loading.value = false
  }
}

async function createTag() {
  createLoading.value = true
  createError.value = ''
  try {
    const payload: { name: string; category?: string } = {
      name: createName.value,
    }
    if (createCategory.value) {
      payload.category = createCategory.value
    }
    await api.post('/api/tags', payload)
    showCreateForm.value = false
    createName.value = ''
    createCategory.value = ''
    await fetchTags()
  } catch (e: unknown) {
    createError.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to create tag') : 'Failed to create tag'
  } finally {
    createLoading.value = false
  }
}

function openEditForm(tag: Tag) {
  editingTag.value = tag
  editName.value = tag.name
  editCategory.value = tag.category || ''
  editError.value = ''
  showEditForm.value = true
}

async function updateTag() {
  if (!editingTag.value) return

  editLoading.value = true
  editError.value = ''
  try {
    const payload: { name?: string; category?: string } = {}
    if (editName.value !== editingTag.value.name) {
      payload.name = editName.value
    }
    if (editCategory.value !== (editingTag.value.category || '')) {
      payload.category = editCategory.value || undefined
    }
    await api.patch(`/api/tags/${editingTag.value.id}`, payload)
    showEditForm.value = false
    editingTag.value = null
    editName.value = ''
    editCategory.value = ''
    await fetchTags()
  } catch (e: unknown) {
    editError.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to update tag') : 'Failed to update tag'
  } finally {
    editLoading.value = false
  }
}

function openDeleteConfirm(tag: Tag) {
  deletingTag.value = tag
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function deleteTag() {
  if (!deletingTag.value) return

  deleteLoading.value = true
  deleteError.value = ''
  try {
    await api.delete(`/api/tags/${deletingTag.value.id}`)
    showDeleteConfirm.value = false
    deletingTag.value = null
    await fetchTags()
  } catch (e: unknown) {
    if (axios.isAxiosError(e) && e.response?.status === 409) {
      deleteError.value = 'Cannot delete tag: it is currently in use'
    } else {
      deleteError.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to delete tag') : 'Failed to delete tag'
    }
  } finally {
    deleteLoading.value = false
  }
}

function getCategoryBadgeClass(category: string | null): string {
  switch (category) {
    case 'genre':
      return 'bg-blue-500/15 text-blue-400'
    case 'mood':
      return 'bg-purple-500/15 text-purple-400'
    case 'language':
      return 'bg-green-500/15 text-green-400'
    default:
      return 'bg-bg-tertiary text-text-secondary'
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(fetchTags)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-text-primary">
        Tags
      </h1>
      <button
        class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        @click="showCreateForm = true"
      >
        <PlusIcon class="h-4 w-4" />
        Create Tag
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>

    <!-- Category Filter Tabs -->
    <div class="flex gap-1 mb-6 border-b border-border">
      <button
        v-for="category in ['all', 'genre', 'mood', 'language']"
        :key="category"
        :class="[
          selectedCategory === category
            ? 'border-b-2 border-accent text-accent'
            : 'text-text-secondary hover:text-text-primary',
          'px-4 py-2 text-sm font-medium capitalize transition-colors',
        ]"
        @click="selectedCategory = category as any"
      >
        {{ category === 'all' ? 'All' : category }}
        <span class="ml-2 text-xs">
          ({{ categoryCounts[category as keyof typeof categoryCounts] }})
        </span>
      </button>
    </div>

    <!-- Create Tag Modal -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-text-primary mb-4">
          Create Tag
        </h2>

        <div
          v-if="createError"
          class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ createError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="createTag"
        >
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              v-model="createName"
              type="text"
              required
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter tag name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Category</label>
            <select
              v-model="createCategory"
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">
                None
              </option>
              <option value="genre">
                Genre
              </option>
              <option value="mood">
                Mood
              </option>
              <option value="language">
                Language
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
              @click="showCreateForm = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="createLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ createLoading ? 'Creating...' : 'Create Tag' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Tag Modal -->
    <div
      v-if="showEditForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-text-primary mb-4">
          Edit Tag
        </h2>

        <div
          v-if="editError"
          class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ editError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="updateTag"
        >
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Name</label>
            <input
              v-model="editName"
              type="text"
              required
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Category</label>
            <select
              v-model="editCategory"
              class="w-full rounded-lg border border-border bg-bg-tertiary px-3 py-2 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">
                None
              </option>
              <option value="genre">
                Genre
              </option>
              <option value="mood">
                Mood
              </option>
              <option value="language">
                Language
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
              @click="showEditForm = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="editLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ editLoading ? 'Updating...' : 'Update Tag' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-text-primary mb-4">
          Delete Tag
        </h2>

        <p class="text-text-secondary mb-4">
          Are you sure you want to delete the tag "{{ deletingTag?.name }}"? This action cannot be undone.
        </p>

        <div
          v-if="deleteError"
          class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ deleteError }}
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </button>
          <button
            :disabled="deleteLoading"
            class="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            @click="deleteTag"
          >
            {{ deleteLoading ? 'Deleting...' : 'Delete Tag' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-text-secondary"
    >
      Loading tags...
    </div>

    <!-- Tags Table -->
    <div
      v-else-if="filteredTags.length > 0"
      class="overflow-hidden rounded-xl border border-border"
    >
      <table class="w-full">
        <thead>
          <tr class="border-b border-border bg-bg-secondary">
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Name
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Category
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Created
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Updated
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="tag in filteredTags"
            :key="tag.id"
            class="hover:bg-bg-secondary/50 transition-colors"
          >
            <td class="px-4 py-3">
              <span class="text-sm font-medium text-text-primary">{{ tag.name }}</span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  getCategoryBadgeClass(tag.category),
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                ]"
              >
                {{ tag.category || 'Uncategorized' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-text-secondary">
              {{ formatDate(tag.created_at) }}
            </td>
            <td class="px-4 py-3 text-sm text-text-secondary">
              {{ formatDate(tag.updated_at) }}
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
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm text-text-primary flex items-center gap-2']"
                        @click="openEditForm(tag)"
                      >
                        <PencilIcon class="h-4 w-4" />
                        Edit
                      </button>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        :class="[active ? 'bg-bg-tertiary' : '', 'block w-full px-4 py-2 text-left text-sm text-destructive flex items-center gap-2']"
                        @click="openDeleteConfirm(tag)"
                      >
                        <TrashIcon class="h-4 w-4" />
                        Delete
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

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12"
    >
      <p class="text-text-secondary">
        No tags found{{ selectedCategory !== 'all' ? ` in ${selectedCategory} category` : '' }}.
      </p>
    </div>
  </div>
</template>