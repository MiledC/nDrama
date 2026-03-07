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

export interface PreviewItem {
  id: string
  title: string
  thumbnail_url: string | null
}

export interface SeriesOption {
  id: string
  title: string
  thumbnail_url: string | null
}

export interface CategoryOption {
  id: string
  name: string
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

  // Picker data
  const allSeries = ref<SeriesOption[]>([])
  const allCategories = ref<CategoryOption[]>([])

  // Preview data
  const previews = ref<Record<string, PreviewItem[]>>({})

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
    }
  }

  async function deleteSection(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/api/home-sections/${id}`)
      sections.value = sections.value.filter(s => s.id !== id)
      delete previews.value[id]
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to delete home section')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchSeries() {
    try {
      const { data } = await api.get('/api/series', { params: { per_page: 100 } })
      allSeries.value = data.items.map((s: { id: string; title: string; thumbnail_url: string | null }) => ({
        id: s.id,
        title: s.title,
        thumbnail_url: s.thumbnail_url,
      }))
    } catch {
      // Non-critical — picker will be empty
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await api.get('/api/categories')
      allCategories.value = data.map((c: { id: string; name: string }) => ({
        id: c.id,
        name: c.name,
      }))
    } catch {
      // Non-critical — picker will be empty
    }
  }

  async function fetchPreview(sectionId: string) {
    try {
      const { data } = await api.get<PreviewItem[]>(`/api/home-sections/${sectionId}/preview`)
      previews.value[sectionId] = data
    } catch {
      previews.value[sectionId] = []
    }
  }

  async function fetchAllPreviews() {
    for (const section of sections.value) {
      fetchPreview(section.id)
    }
  }

  return {
    // State
    sections,
    loading,
    error,
    allSeries,
    allCategories,
    previews,
    // Actions
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    fetchSeries,
    fetchCategories,
    fetchPreview,
    fetchAllPreviews,
  }
})
