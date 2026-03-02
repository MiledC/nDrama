<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import {
  ArrowLeftIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/vue/24/outline'
import { useSubscriberStore } from '../stores/subscribers'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import type { SubscriberStatus, TransactionType } from '../types/subscriber'

const route = useRoute()
const router = useRouter()
const store = useSubscriberStore()
const auth = useAuthStore()
const toast = useToastStore()

const subscriberId = route.params.id as string

// Local state
const loading = ref(true)
const error = ref('')
const notesEditing = ref(false)
const notesDraft = ref('')
const notesSaving = ref(false)

// Coin adjustment modal
const showAdjustModal = ref(false)
const adjustAmount = ref<number | null>(null)
const adjustDescription = ref('')
const adjustSaving = ref(false)
const adjustError = ref('')

// Transaction pagination
const txPage = ref(1)
const txPerPage = ref(10)
const txTotalPages = computed(() => Math.ceil(store.transactionTotal / txPerPage.value))

const previewBalance = computed(() => {
  if (!store.currentSubscriber || !adjustAmount.value) return null
  return store.currentSubscriber.coin_balance + adjustAmount.value
})

async function loadSubscriber() {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([
      store.fetchSubscriber(subscriberId),
      store.fetchTransactions(subscriberId, { page: txPage.value, per_page: txPerPage.value }),
    ])
    notesDraft.value = store.currentSubscriber?.admin_notes ?? ''
  } catch (e: unknown) {
    error.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to load subscriber')
      : 'Failed to load subscriber'
  } finally {
    loading.value = false
  }
}

async function updateStatus(newStatus: SubscriberStatus) {
  try {
    await store.updateSubscriber(subscriberId, { status: newStatus })
    toast.success(`Subscriber ${newStatus}`)
  } catch {
    toast.error('Failed to update status')
  }
}

async function saveNotes() {
  notesSaving.value = true
  try {
    await store.updateSubscriber(subscriberId, { admin_notes: notesDraft.value })
    notesEditing.value = false
    toast.success('Notes saved')
  } catch {
    toast.error('Failed to save notes')
  } finally {
    notesSaving.value = false
  }
}

function openAdjustModal() {
  adjustAmount.value = null
  adjustDescription.value = ''
  adjustError.value = ''
  showAdjustModal.value = true
}

async function submitAdjustment() {
  if (!adjustAmount.value || !adjustDescription.value.trim()) return

  adjustSaving.value = true
  adjustError.value = ''
  try {
    await store.adjustCoins(subscriberId, {
      amount: adjustAmount.value,
      description: adjustDescription.value,
    })
    showAdjustModal.value = false
    toast.success(`Coins adjusted by ${adjustAmount.value > 0 ? '+' : ''}${adjustAmount.value}`)
    await store.fetchTransactions(subscriberId, { page: 1, per_page: txPerPage.value })
    txPage.value = 1
  } catch (e: unknown) {
    adjustError.value = axios.isAxiosError(e)
      ? (e.response?.data?.detail ?? 'Failed to adjust coins')
      : 'Failed to adjust coins'
  } finally {
    adjustSaving.value = false
  }
}

async function fetchTxPage(p: number) {
  txPage.value = p
  await store.fetchTransactions(subscriberId, { page: p, per_page: txPerPage.value })
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'suspended': return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'banned': return 'bg-red-50 text-red-700 border border-red-200'
    case 'anonymous': return 'bg-gray-100 text-gray-600 border border-gray-200'
    default: return 'bg-gray-100 text-gray-600 border border-gray-200'
  }
}

function getTxTypeBadgeClass(type: TransactionType): string {
  switch (type) {
    case 'purchase': return 'bg-emerald-50 text-emerald-700'
    case 'spend': return 'bg-blue-50 text-blue-700'
    case 'refund': return 'bg-amber-50 text-amber-700'
    case 'promo': return 'bg-purple-50 text-purple-700'
    case 'adjustment': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const sub = computed(() => store.currentSubscriber)

onMounted(loadSubscriber)
</script>

<template>
  <div>
    <!-- Back Button -->
    <button
      class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
      @click="router.push('/subscribers')"
    >
      <ArrowLeftIcon class="h-4 w-4" />
      Back to Subscribers
    </button>

    <!-- Error -->
    <div
      v-if="error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ error }}
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="loading"
      class="space-y-6 animate-pulse"
    >
      <div class="bg-white rounded-xl border border-border p-6">
        <div class="flex items-center gap-4">
          <div class="h-16 w-16 bg-gray-200 rounded-full" />
          <div>
            <div class="h-6 w-40 bg-gray-200 rounded mb-2" />
            <div class="h-4 w-28 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-border p-6">
        <div class="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div class="h-20 w-full bg-gray-100 rounded" />
      </div>
    </div>

    <!-- Subscriber Content -->
    <template v-else-if="sub">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile Card -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-border shadow-[--shadow-card] p-6">
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-4">
              <div class="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  v-if="sub.avatar_url"
                  :src="sub.avatar_url"
                  :alt="sub.name ?? 'Subscriber'"
                  class="h-full w-full object-cover"
                >
                <UserCircleIcon
                  v-else
                  class="h-10 w-10 text-gray-300"
                />
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900">
                  {{ sub.name ?? 'Anonymous' }}
                </h1>
                <p
                  v-if="sub.email"
                  class="text-sm text-gray-500"
                >
                  {{ sub.email }}
                </p>
                <span
                  :class="[
                    getStatusBadgeClass(sub.status),
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize mt-1',
                  ]"
                >
                  {{ sub.status }}
                </span>
              </div>
            </div>

            <!-- Status Actions (admin only) -->
            <div
              v-if="auth.isAdmin"
              class="flex gap-2"
            >
              <button
                v-if="sub.status === 'active' || sub.status === 'anonymous'"
                class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                @click="updateStatus('suspended')"
              >
                Suspend
              </button>
              <button
                v-if="sub.status !== 'banned'"
                class="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                @click="updateStatus('banned')"
              >
                Ban
              </button>
              <button
                v-if="sub.status === 'suspended' || sub.status === 'banned'"
                class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                @click="updateStatus('active')"
              >
                Reactivate
              </button>
            </div>
          </div>

          <!-- Details Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="flex items-center gap-2 text-sm">
              <DevicePhoneMobileIcon class="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p class="text-gray-500 text-xs">
                  Device ID
                </p>
                <p class="text-gray-900 font-mono text-xs truncate max-w-[180px]">
                  {{ sub.device_id }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <GlobeAltIcon class="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p class="text-gray-500 text-xs">
                  Country
                </p>
                <p class="text-gray-900">
                  {{ sub.country ?? '—' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <CalendarIcon class="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p class="text-gray-500 text-xs">
                  Registered
                </p>
                <p class="text-gray-900">
                  {{ formatDate(sub.registered_at) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <ClockIcon class="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p class="text-gray-500 text-xs">
                  Last Active
                </p>
                <p class="text-gray-900">
                  {{ formatDate(sub.last_active_at) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <CalendarIcon class="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p class="text-gray-500 text-xs">
                  Created
                </p>
                <p class="text-gray-900">
                  {{ formatDate(sub.created_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Coin Balance Card -->
        <div class="bg-white rounded-xl border border-border shadow-[--shadow-card] p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Coin Balance
            </h2>
            <CurrencyDollarIcon class="h-5 w-5 text-amber-500" />
          </div>
          <p class="text-4xl font-bold text-gray-900 mb-4">
            {{ sub.coin_balance.toLocaleString() }}
          </p>
          <button
            v-if="auth.isAdmin"
            class="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            @click="openAdjustModal"
          >
            <CurrencyDollarIcon class="h-4 w-4" />
            Adjust Balance
          </button>
        </div>
      </div>

      <!-- Admin Notes -->
      <div class="bg-white rounded-xl border border-border shadow-[--shadow-card] p-6 mt-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Admin Notes
          </h2>
          <button
            v-if="auth.isAdmin && !notesEditing"
            class="text-sm text-accent hover:text-accent-hover transition-colors"
            @click="notesEditing = true; notesDraft = sub.admin_notes ?? ''"
          >
            Edit
          </button>
        </div>
        <template v-if="notesEditing">
          <textarea
            v-model="notesDraft"
            rows="3"
            class="w-full rounded-lg border border-border bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-sm"
            placeholder="Add notes about this subscriber..."
          />
          <div class="flex gap-2 mt-2">
            <button
              :disabled="notesSaving"
              class="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
              @click="saveNotes"
            >
              {{ notesSaving ? 'Saving...' : 'Save' }}
            </button>
            <button
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              @click="notesEditing = false"
            >
              Cancel
            </button>
          </div>
        </template>
        <p
          v-else
          class="text-sm text-gray-600"
        >
          {{ sub.admin_notes || 'No notes yet.' }}
        </p>
      </div>

      <!-- Transaction History -->
      <div class="bg-white rounded-xl border border-border shadow-[--shadow-card] overflow-hidden mt-6">
        <div class="px-6 py-4 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">
            Transaction History
          </h2>
        </div>

        <div
          v-if="store.transactions.length === 0"
          class="py-12 text-center"
        >
          <CurrencyDollarIcon class="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p class="text-sm text-gray-500">
            No transactions yet
          </p>
        </div>

        <table
          v-else
          class="w-full"
        >
          <thead>
            <tr class="border-b border-gray-200 bg-[#F9FAFB]">
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Balance After
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="tx in store.transactions"
              :key="tx.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3">
                <span
                  :class="[
                    getTxTypeBadgeClass(tx.type),
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  ]"
                >
                  {{ tx.type }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  :class="[
                    tx.amount > 0 ? 'text-emerald-600' : 'text-red-600',
                    'text-sm font-semibold flex items-center justify-end gap-1',
                  ]"
                >
                  <ArrowUpIcon
                    v-if="tx.amount > 0"
                    class="h-3 w-3"
                  />
                  <ArrowDownIcon
                    v-else
                    class="h-3 w-3"
                  />
                  {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount.toLocaleString() }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-sm text-gray-500">
                {{ tx.balance_after.toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                {{ tx.description ?? '—' }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                {{ formatDateTime(tx.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Transaction Pagination -->
        <div
          v-if="txTotalPages > 1"
          class="flex items-center justify-between px-4 py-3 border-t border-gray-100"
        >
          <div class="text-sm text-gray-500">
            Page {{ txPage }} of {{ txTotalPages }}
          </div>
          <div class="flex gap-2">
            <button
              :disabled="txPage <= 1"
              class="rounded-lg bg-white border border-border px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="fetchTxPage(txPage - 1)"
            >
              Previous
            </button>
            <button
              :disabled="txPage >= txTotalPages"
              class="rounded-lg bg-white border border-border px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="fetchTxPage(txPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Coin Adjustment Modal -->
    <div
      v-if="showAdjustModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Adjust Coin Balance
          </h2>

          <!-- Amount -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div class="flex gap-2">
              <button
                class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                @click="adjustAmount = Math.abs(adjustAmount ?? 0)"
              >
                <PlusIcon class="h-4 w-4" />
              </button>
              <button
                class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                @click="adjustAmount = -Math.abs(adjustAmount ?? 0)"
              >
                <MinusIcon class="h-4 w-4" />
              </button>
              <input
                v-model.number="adjustAmount"
                type="number"
                class="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-gray-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="0"
              >
            </div>
          </div>

          <!-- Balance Preview -->
          <div
            v-if="previewBalance !== null"
            class="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200"
          >
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Current balance</span>
              <span class="font-medium">{{ sub?.coin_balance.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-sm mt-1">
              <span class="text-gray-500">After adjustment</span>
              <span
                :class="[previewBalance < 0 ? 'text-red-600' : 'text-gray-900', 'font-bold']"
              >
                {{ previewBalance.toLocaleString() }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Reason (required)</label>
            <input
              v-model="adjustDescription"
              type="text"
              class="w-full rounded-lg border border-border bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="e.g. Welcome bonus, refund, promotion..."
            >
          </div>

          <!-- Error -->
          <div
            v-if="adjustError"
            class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
          >
            {{ adjustError }}
          </div>
        </div>

        <div class="flex justify-end gap-3 bg-gray-50 px-6 py-4">
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showAdjustModal = false"
          >
            Cancel
          </button>
          <button
            :disabled="adjustSaving || !adjustAmount || !adjustDescription.trim() || (previewBalance !== null && previewBalance < 0)"
            class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            @click="submitAdjustment"
          >
            {{ adjustSaving ? 'Adjusting...' : 'Confirm Adjustment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
