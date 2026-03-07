import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import api from '../lib/api'

// Types
export type HomeSectionType = 'featured' | 'trending' | 'new_releases' | 'category'

export interface HomeSection {
  id: string
  type: HomeSectionType
  title: string
  config: Record<string, unknown>
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface HomeSectionListResponse {
  items: HomeSection[]
  total: number
}

export interface HomeSectionCreate {
  type: HomeSectionType
  title: string
  config?: Record<string, unknown>
  sort_order?: number
  is_active?: boolean
}

export interface HomeSectionUpdate {
  type?: HomeSectionType
  title?: string
  config?: Record<string, unknown>
  sort_order?: number
  is_active?: boolean
}

function extractError(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) return e.response?.data?.detail ?? fallback
  return fallback
}

export const useHomeSectionStore = defineStore('homeSections', () => {
  // State
  const sections = ref<HomeSection[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchSections() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<HomeSectionListResponse>('/api/home-sections')
      sections.value = data.items.sort((a, b) => a.sort_order - b.sort_order)
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch home sections')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createSection(payload: HomeSectionCreate) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post<HomeSection>('/api/home-sections', payload)
      sections.value.push(data)
      sections.value.sort((a, b) => a.sort_order - b.sort_order)
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to create home section')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSection(id: string, payload: HomeSectionUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.patch<HomeSection>(`/api/home-sections/${id}`, payload)
      const index = sections.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sections.value[index] = data
        sections.value.sort((a, b) => a.sort_order - b.sort_order)
      }
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to update home section')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteSection(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/api/home-sections/${id}`)
      sections.value = sections.value.filter(s => s.id !== id)
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to delete home section')
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    sections,
    loading,
    error,
    // Actions
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
  }
})