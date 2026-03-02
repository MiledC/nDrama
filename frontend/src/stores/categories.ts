import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import api from '@/lib/api'
import type {
  Category,
  CategoryTreeNode,
  CategoryCreate,
  CategoryUpdate,
  ReorderItem,
  SeriesListResponse,
} from '@/types/category'

function extractError(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) return e.response?.data?.detail ?? fallback
  return fallback
}

export const useCategoryStore = defineStore('categories', () => {
  // State
  const categories = ref<Category[]>([])
  const tree = ref<CategoryTreeNode[]>([])
  const currentCategory = ref<Category | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const rootCategories = computed(() => categories.value.filter(c => c.parent_id === null))
  const getCategoryById = computed(() => {
    return (id: string) => categories.value.find(c => c.id === id) || null
  })

  // Actions
  async function fetchCategories() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<Category[]>('/api/categories')
      categories.value = data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch categories')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchTree() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<CategoryTreeNode[]>('/api/categories/tree')
      tree.value = data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch category tree')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchCategory(id: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<Category>(`/api/categories/${id}`)
      currentCategory.value = data
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch category')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createCategory(payload: CategoryCreate) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post<Category>('/api/categories', payload)
      categories.value.push(data)
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to create category')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCategory(id: string, payload: CategoryUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.patch<Category>(`/api/categories/${id}`, payload)
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) categories.value[index] = data
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to update category')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/api/categories/${id}`)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to delete category')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setCategoryTags(categoryId: string, tagIds: string[]) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.put<Category>(`/api/categories/${categoryId}/tags`, { tag_ids: tagIds })
      const index = categories.value.findIndex(c => c.id === categoryId)
      if (index !== -1) categories.value[index] = data
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to set category tags')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reorderCategories(items: ReorderItem[]) {
    error.value = null
    try {
      await api.patch('/api/categories/reorder', { items })
      // Update local state
      for (const item of items) {
        const cat = categories.value.find(c => c.id === item.id)
        if (cat) cat.sort_order = item.sort_order
      }
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to reorder categories')
      throw e
    }
  }

  async function fetchCategorySeries(categoryId: string, page = 1, perPage = 20): Promise<SeriesListResponse> {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<SeriesListResponse>(`/api/categories/${categoryId}/series`, {
        params: { page, per_page: perPage },
      })
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch category series')
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    categories,
    tree,
    currentCategory,
    loading,
    error,
    // Getters
    rootCategories,
    getCategoryById,
    // Actions
    fetchCategories,
    fetchTree,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    setCategoryTags,
    reorderCategories,
    fetchCategorySeries,
  }
})