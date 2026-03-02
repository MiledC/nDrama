<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import api from '../lib/api'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline'
import { useToastStore } from '../stores/toast'

interface Tag {
  id: string
  name: string
  category: string | null
}

interface CategoryNode {
  id: string
  name: string
  icon: string | null
  description: string | null
  sort_order: number
  match_mode: string
  tags: Tag[]
  children: CategoryNode[]
}

const toast = useToastStore()

// Data
const tree = ref<CategoryNode[]>([])
const allTags = ref<Tag[]>([])
const loading = ref(true)
const error = ref('')
const expandedIds = ref<Set<string>>(new Set())

// Create form state
const showCreateForm = ref(false)
const createName = ref('')
const createIcon = ref('')
const createDescription = ref('')
const createMatchMode = ref<'any' | 'all'>('any')
const createParentId = ref<string | null>(null)
const createTagIds = ref<string[]>([])
const createLoading = ref(false)
const createError = ref('')

// Edit form state
const showEditForm = ref(false)
const editingCategory = ref<CategoryNode | null>(null)
const editName = ref('')
const editIcon = ref('')
const editDescription = ref('')
const editMatchMode = ref<'any' | 'all'>('any')
const editTagIds = ref<string[]>([])
const editLoading = ref(false)
const editError = ref('')

// Delete state
const showDeleteConfirm = ref(false)
const deletingCategory = ref<CategoryNode | null>(null)
const deleteLoading = ref(false)
const deleteError = ref('')

async function fetchData() {
  loading.value = true
  error.value = ''
  try {
    const [treeRes, tagsRes] = await Promise.all([
      api.get('/api/categories/tree'),
      api.get('/api/tags'),
    ])
    tree.value = treeRes.data
    allTags.value = tagsRes.data
  } catch {
    error.value = 'Failed to load categories'
  } finally {
    loading.value = false
  }
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

function openCreateForm(parentId: string | null = null) {
  createName.value = ''
  createIcon.value = ''
  createDescription.value = ''
  createMatchMode.value = 'any'
  createParentId.value = parentId
  createTagIds.value = []
  createError.value = ''
  showCreateForm.value = true
}

async function createCategory() {
  createLoading.value = true
  createError.value = ''
  try {
    const payload: Record<string, unknown> = {
      name: createName.value,
      match_mode: createMatchMode.value,
    }
    if (createIcon.value) payload.icon = createIcon.value
    if (createDescription.value) payload.description = createDescription.value
    if (createParentId.value) payload.parent_id = createParentId.value

    const response = await api.post('/api/categories', payload)

    // If tags were selected, set them
    if (createTagIds.value.length > 0) {
      await api.put(`/api/categories/${response.data.id}/tags`, { tag_ids: createTagIds.value })
    }

    showCreateForm.value = false
    toast.success('Category created successfully')
    await fetchData()
  } catch (e) {
    createError.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to create') : 'Failed to create'
  } finally {
    createLoading.value = false
  }
}

function openEditForm(category: CategoryNode) {
  editingCategory.value = category
  editName.value = category.name
  editIcon.value = category.icon || ''
  editDescription.value = category.description || ''
  editMatchMode.value = category.match_mode as 'any' | 'all'
  editTagIds.value = category.tags.map(t => t.id)
  editError.value = ''
  showEditForm.value = true
}

async function updateCategory() {
  if (!editingCategory.value) return

  editLoading.value = true
  editError.value = ''
  try {
    const payload: Record<string, unknown> = {}
    if (editName.value !== editingCategory.value.name) {
      payload.name = editName.value
    }
    if (editIcon.value !== (editingCategory.value.icon || '')) {
      payload.icon = editIcon.value || null
    }
    if (editDescription.value !== (editingCategory.value.description || '')) {
      payload.description = editDescription.value || null
    }
    if (editMatchMode.value !== editingCategory.value.match_mode) {
      payload.match_mode = editMatchMode.value
    }

    // Update category
    if (Object.keys(payload).length > 0) {
      await api.patch(`/api/categories/${editingCategory.value.id}`, payload)
    }

    // Update tags
    const currentTagIds = editingCategory.value.tags.map(t => t.id)
    const tagsChanged = editTagIds.value.length !== currentTagIds.length ||
      !editTagIds.value.every(id => currentTagIds.includes(id))

    if (tagsChanged) {
      await api.put(`/api/categories/${editingCategory.value.id}/tags`, { tag_ids: editTagIds.value })
    }

    showEditForm.value = false
    editingCategory.value = null
    toast.success('Category updated successfully')
    await fetchData()
  } catch (e) {
    editError.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to update') : 'Failed to update'
  } finally {
    editLoading.value = false
  }
}

function openDeleteConfirm(category: CategoryNode) {
  deletingCategory.value = category
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function deleteCategory() {
  if (!deletingCategory.value) return

  deleteLoading.value = true
  deleteError.value = ''
  try {
    await api.delete(`/api/categories/${deletingCategory.value.id}`)
    showDeleteConfirm.value = false
    deletingCategory.value = null
    toast.success('Category deleted successfully')
    await fetchData()
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 409) {
      deleteError.value = 'Cannot delete category: it has subcategories'
    } else {
      deleteError.value = axios.isAxiosError(e) ? (e.response?.data?.detail ?? 'Failed to delete') : 'Failed to delete'
    }
  } finally {
    deleteLoading.value = false
  }
}

// Check if category has parent (is a subcategory)
function getParentCategory(category: CategoryNode): CategoryNode | null {
  for (const root of tree.value) {
    if (root.children.some(c => c.id === category.id)) {
      return root
    }
  }
  return null
}

onMounted(fetchData)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Categories
      </h1>
      <button
        class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        @click="openCreateForm(null)"
      >
        <PlusIcon class="h-4 w-4" />
        Create Category
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>

    <!-- Create Category Modal -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          {{ createParentId ? 'Create Subcategory' : 'Create Category' }}
        </h2>

        <div
          v-if="createError"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ createError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="createCategory"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="createName"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter category name"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Icon (optional)</label>
            <input
              v-model="createIcon"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="e.g. 🎬"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              v-model="createDescription"
              rows="3"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter category description"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Match Mode</label>
            <select
              v-model="createMatchMode"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="any">
                Any (matches if series has any of the tags)
              </option>
              <option value="all">
                All (matches if series has all of the tags)
              </option>
            </select>
          </div>

          <div v-if="!createParentId">
            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Category (optional)</label>
            <select
              v-model="createParentId"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option :value="null">
                None (Root Category)
              </option>
              <option
                v-for="root in tree"
                :key="root.id"
                :value="root.id"
              >
                {{ root.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div class="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-2 space-y-1">
              <label
                v-for="tag in allTags"
                :key="tag.id"
                class="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded px-2 py-1 cursor-pointer"
              >
                <input
                  v-model="createTagIds"
                  type="checkbox"
                  :value="tag.id"
                  class="rounded border-gray-300 text-accent focus:ring-accent"
                >
                {{ tag.name }}
                <span
                  v-if="tag.category"
                  class="text-xs text-gray-400"
                >({{ tag.category }})</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              @click="showCreateForm = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="createLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ createLoading ? 'Creating...' : 'Create Category' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Category Modal -->
    <div
      v-if="showEditForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Edit Category
        </h2>

        <div
          v-if="editError"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ editError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="updateCategory"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="editName"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Icon (optional)</label>
            <input
              v-model="editIcon"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="e.g. 🎬"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              v-model="editDescription"
              rows="3"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter category description"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Match Mode</label>
            <select
              v-model="editMatchMode"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="any">
                Any (matches if series has any of the tags)
              </option>
              <option value="all">
                All (matches if series has all of the tags)
              </option>
            </select>
          </div>

          <div v-if="editingCategory && getParentCategory(editingCategory)">
            <label class="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <input
              type="text"
              :value="getParentCategory(editingCategory)?.name"
              disabled
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500 shadow-[--shadow-input]"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div class="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-2 space-y-1">
              <label
                v-for="tag in allTags"
                :key="tag.id"
                class="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded px-2 py-1 cursor-pointer"
              >
                <input
                  v-model="editTagIds"
                  type="checkbox"
                  :value="tag.id"
                  class="rounded border-gray-300 text-accent focus:ring-accent"
                >
                {{ tag.name }}
                <span
                  v-if="tag.category"
                  class="text-xs text-gray-400"
                >({{ tag.category }})</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              @click="showEditForm = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="editLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ editLoading ? 'Updating...' : 'Update Category' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Delete Category
        </h2>

        <p class="text-gray-500 mb-4">
          Are you sure you want to delete the category "{{ deletingCategory?.name }}"? This action cannot be undone.
        </p>

        <div
          v-if="deleteError"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ deleteError }}
        </div>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </button>
          <button
            :disabled="deleteLoading"
            class="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            @click="deleteCategory"
          >
            {{ deleteLoading ? 'Deleting...' : 'Delete Category' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="loading"
      class="overflow-hidden rounded-xl border border-border bg-white shadow-[--shadow-card] animate-pulse"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="border-b border-gray-200 last:border-0"
      >
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="h-4 w-4 bg-gray-200 rounded" />
          <div class="h-4 w-6 bg-gray-200 rounded" />
          <div class="h-4 w-32 bg-gray-200 rounded flex-1" />
          <div class="h-5 w-16 bg-gray-200 rounded-full" />
          <div class="h-5 w-12 bg-gray-200 rounded-full" />
          <div class="flex gap-2">
            <div class="h-4 w-4 bg-gray-200 rounded" />
            <div class="h-4 w-4 bg-gray-200 rounded" />
            <div class="h-4 w-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- Categories Tree -->
    <div
      v-else-if="tree.length > 0"
      class="overflow-hidden rounded-xl border border-border bg-white shadow-[--shadow-card]"
    >
      <div
        v-for="root in tree"
        :key="root.id"
        class="border-b border-gray-200 last:border-0"
      >
        <!-- Root category row -->
        <div class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
          <button
            v-if="root.children && root.children.length > 0"
            class="text-gray-400 hover:text-gray-600"
            @click="toggleExpand(root.id)"
          >
            <ChevronDownIcon
              v-if="expandedIds.has(root.id)"
              class="h-4 w-4"
            />
            <ChevronRightIcon
              v-else
              class="h-4 w-4"
            />
          </button>
          <div
            v-else
            class="w-4"
          />
          <span
            v-if="root.icon"
            class="text-lg"
          >{{ root.icon }}</span>
          <span class="text-sm font-medium text-gray-900 flex-1">{{ root.name }}</span>
          <span class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
            {{ root.tags.length }} tags
          </span>
          <span class="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
            {{ root.match_mode }}
          </span>
          <!-- Action buttons -->
          <button
            title="Add subcategory"
            class="text-gray-400 hover:text-accent"
            @click="openCreateForm(root.id)"
          >
            <PlusIcon class="h-4 w-4" />
          </button>
          <button
            title="Edit"
            class="text-gray-400 hover:text-gray-600"
            @click="openEditForm(root)"
          >
            <PencilIcon class="h-4 w-4" />
          </button>
          <button
            title="Delete"
            class="text-gray-400 hover:text-red-600"
            @click="openDeleteConfirm(root)"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>

        <!-- Children rows (if expanded) -->
        <div v-if="expandedIds.has(root.id) && root.children && root.children.length > 0">
          <div
            v-for="child in root.children"
            :key="child.id"
            class="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-gray-50 border-t border-gray-100"
          >
            <span
              v-if="child.icon"
              class="text-base"
            >{{ child.icon }}</span>
            <span class="text-sm text-gray-700 flex-1">{{ child.name }}</span>
            <span class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {{ child.tags.length }} tags
            </span>
            <span class="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
              {{ child.match_mode }}
            </span>
            <button
              class="text-gray-400 hover:text-gray-600"
              @click="openEditForm(child)"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              class="text-gray-400 hover:text-red-600"
              @click="openDeleteConfirm(child)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-12"
    >
      <p class="text-gray-500">
        No categories found. Create your first category to get started.
      </p>
    </div>
  </div>
</template>