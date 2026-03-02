import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import api from '../lib/api'
import type {
  Subscriber,
  SubscriberListResponse,
  SubscriberUpdate,
  CoinAdjustment,
  CoinTransaction,
  CoinTransactionListResponse,
} from '../types/subscriber'

function extractError(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) return e.response?.data?.detail ?? fallback
  return fallback
}

export const useSubscriberStore = defineStore('subscribers', () => {
  // State
  const subscribers = ref<Subscriber[]>([])
  const currentSubscriber = ref<Subscriber | null>(null)
  const transactions = ref<CoinTransaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  const page = ref(1)
  const perPage = ref(20)
  const transactionTotal = ref(0)
  const transactionPage = ref(1)

  // Actions
  async function fetchSubscribers(params: {
    page?: number
    per_page?: number
    search?: string
    status?: string
    country?: string
  } = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<SubscriberListResponse>('/api/subscribers', { params })
      subscribers.value = data.items
      total.value = data.total
      page.value = data.page
      perPage.value = data.per_page
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch subscribers')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchSubscriber(id: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<Subscriber>(`/api/subscribers/${id}`)
      currentSubscriber.value = data
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch subscriber')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSubscriber(id: string, payload: SubscriberUpdate) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.patch<Subscriber>(`/api/subscribers/${id}`, payload)
      currentSubscriber.value = data
      const index = subscribers.value.findIndex(s => s.id === id)
      if (index !== -1) subscribers.value[index] = data
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to update subscriber')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function adjustCoins(id: string, payload: CoinAdjustment) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post<Subscriber>(`/api/subscribers/${id}/adjust-coins`, payload)
      currentSubscriber.value = data
      const index = subscribers.value.findIndex(s => s.id === id)
      if (index !== -1) subscribers.value[index] = data
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to adjust coins')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactions(subscriberId: string, params: {
    page?: number
    per_page?: number
  } = {}) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<CoinTransactionListResponse>(
        `/api/subscribers/${subscriberId}/transactions`,
        { params },
      )
      transactions.value = data.items
      transactionTotal.value = data.total
      transactionPage.value = data.page
      return data
    } catch (e: unknown) {
      error.value = extractError(e, 'Failed to fetch transactions')
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    subscribers,
    currentSubscriber,
    transactions,
    loading,
    error,
    total,
    page,
    perPage,
    transactionTotal,
    transactionPage,
    // Actions
    fetchSubscribers,
    fetchSubscriber,
    updateSubscriber,
    adjustCoins,
    fetchTransactions,
  }
})
