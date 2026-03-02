import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import api from '../lib/api'
import type {
  CoinPackage,
  CoinPackageListResponse,
  CoinPackageCreate,
  CoinPackageUpdate,
} from '../types/subscriber'

function extractError(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) return e.response?.data?.detail ?? fallback
  return fallback
}

export const useCoinPackageStore = defineStore('coinPackages', () => {
  // State
  const packages = ref<CoinPackage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // Actions
  async function fetchPackages() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<CoinPackageListResponse>('/api/coin-packages')
      packages.value = data.items
      total.value = data.total
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch coin packages')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createPackage(payload: CoinPackageCreate) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post<CoinPackage>('/api/coin-packages', payload)
      packages.value.push(data)
      total.value++
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to create coin package')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePackage(id: string, payload: CoinPackageUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.patch<CoinPackage>(`/api/coin-packages/${id}`, payload)
      const index = packages.value.findIndex(p => p.id === id)
      if (index !== -1) packages.value[index] = data
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to update coin package')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deletePackage(id: string) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/api/coin-packages/${id}`)
      const index = packages.value.findIndex(p => p.id === id)
      if (index !== -1) packages.value[index].is_active = false
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to deactivate coin package')
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    packages,
    loading,
    error,
    total,
    // Actions
    fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
  }
})
