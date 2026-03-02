<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  ArchiveBoxXMarkIcon,
  CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'
import { useToastStore } from '../stores/toast'
import { useCoinPackageStore } from '../stores/coinPackages'
import type { CoinPackage } from '../types/subscriber'

const toast = useToastStore()
const store = useCoinPackageStore()

const activeFilter = ref<'all' | 'active' | 'inactive'>('all')

// Create form state
const showCreateForm = ref(false)
const createName = ref('')
const createDescription = ref('')
const createCoinAmount = ref<number | null>(null)
const createPriceSar = ref('')
const createSortOrder = ref(0)
const createLoading = ref(false)
const createError = ref('')

// Edit form state
const showEditForm = ref(false)
const editingPackage = ref<CoinPackage | null>(null)
const editName = ref('')
const editDescription = ref('')
const editCoinAmount = ref<number | null>(null)
const editPriceSar = ref('')
const editSortOrder = ref(0)
const editLoading = ref(false)
const editError = ref('')

// Deactivate confirmation state
const showDeactivateConfirm = ref(false)
const deactivatingPackage = ref<CoinPackage | null>(null)
const deactivateLoading = ref(false)

const filteredPackages = computed(() => {
  if (activeFilter.value === 'all') return store.packages
  if (activeFilter.value === 'active') return store.packages.filter(p => p.is_active)
  return store.packages.filter(p => !p.is_active)
})

const filterCounts = computed(() => ({
  all: store.packages.length,
  active: store.packages.filter(p => p.is_active).length,
  inactive: store.packages.filter(p => !p.is_active).length,
}))

function resetCreateForm() {
  createName.value = ''
  createDescription.value = ''
  createCoinAmount.value = null
  createPriceSar.value = ''
  createSortOrder.value = 0
  createError.value = ''
}

async function handleCreate() {
  if (!createCoinAmount.value || !createPriceSar.value) return

  createLoading.value = true
  createError.value = ''
  try {
    await store.createPackage({
      name: createName.value,
      description: createDescription.value || undefined,
      coin_amount: createCoinAmount.value,
      price_sar: createPriceSar.value,
      sort_order: createSortOrder.value,
    })
    showCreateForm.value = false
    resetCreateForm()
    toast.success('Coin package created successfully')
  } catch {
    createError.value = store.error ?? 'Failed to create package'
  } finally {
    createLoading.value = false
  }
}

function openEditForm(pkg: CoinPackage) {
  editingPackage.value = pkg
  editName.value = pkg.name
  editDescription.value = pkg.description ?? ''
  editCoinAmount.value = pkg.coin_amount
  editPriceSar.value = pkg.price_sar
  editSortOrder.value = pkg.sort_order
  editError.value = ''
  showEditForm.value = true
}

async function handleUpdate() {
  if (!editingPackage.value) return

  editLoading.value = true
  editError.value = ''
  try {
    await store.updatePackage(editingPackage.value.id, {
      name: editName.value,
      description: editDescription.value || undefined,
      coin_amount: editCoinAmount.value ?? undefined,
      price_sar: editPriceSar.value || undefined,
      sort_order: editSortOrder.value,
    })
    showEditForm.value = false
    editingPackage.value = null
    toast.success('Coin package updated successfully')
  } catch {
    editError.value = store.error ?? 'Failed to update package'
  } finally {
    editLoading.value = false
  }
}

function openDeactivateConfirm(pkg: CoinPackage) {
  deactivatingPackage.value = pkg
  showDeactivateConfirm.value = true
}

async function handleDeactivate() {
  if (!deactivatingPackage.value) return

  deactivateLoading.value = true
  try {
    await store.deletePackage(deactivatingPackage.value.id)
    showDeactivateConfirm.value = false
    deactivatingPackage.value = null
    toast.success('Coin package deactivated')
  } catch {
    // Error is shown via store.error
  } finally {
    deactivateLoading.value = false
  }
}

function formatPrice(price: string): string {
  return `${parseFloat(price).toFixed(2)} SAR`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

onMounted(() => store.fetchPackages())
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Coin Packages
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Manage purchasable coin bundles
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        @click="showCreateForm = true"
      >
        <PlusIcon class="h-4 w-4" />
        Create Package
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="store.error"
      class="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm mb-4"
    >
      {{ store.error }}
      <button
        class="ml-2 underline hover:no-underline"
        @click="store.fetchPackages()"
      >
        Retry
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-1 mb-6 border-b border-gray-200">
      <button
        v-for="filter in (['all', 'active', 'inactive'] as const)"
        :key="filter"
        :class="[
          activeFilter === filter
            ? 'border-b-2 border-accent text-accent'
            : 'text-gray-500 hover:text-gray-900',
          'px-4 py-2 text-sm font-medium capitalize transition-colors',
        ]"
        @click="activeFilter = filter"
      >
        {{ filter }}
        <span class="ml-2 text-xs">
          ({{ filterCounts[filter] }})
        </span>
      </button>
    </div>

    <!-- Create Package Modal -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Create Coin Package
        </h2>

        <div
          v-if="createError"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ createError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleCreate"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              v-model="createName"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="e.g. Starter Pack"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              v-model="createDescription"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Optional description"
            >
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Coins</label>
              <input
                v-model.number="createCoinAmount"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="100"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Price (SAR)</label>
              <input
                v-model="createPriceSar"
                type="text"
                inputmode="decimal"
                pattern="[0-9]+(\.[0-9]{1,2})?"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="9.99"
              >
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              v-model.number="createSortOrder"
              type="number"
              min="0"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="0"
            >
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              @click="showCreateForm = false; resetCreateForm()"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="createLoading"
              class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {{ createLoading ? 'Creating...' : 'Create Package' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Package Modal -->
    <div
      v-if="showEditForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Edit Coin Package
        </h2>

        <div
          v-if="editError"
          class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"
        >
          {{ editError }}
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleUpdate"
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              v-model="editDescription"
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Optional description"
            >
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Coins</label>
              <input
                v-model.number="editCoinAmount"
                type="number"
                min="1"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Price (SAR)</label>
              <input
                v-model="editPriceSar"
                type="text"
                inputmode="decimal"
                pattern="[0-9]+(\.[0-9]{1,2})?"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              v-model.number="editSortOrder"
              type="number"
              min="0"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-[--shadow-input] placeholder-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
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
              {{ editLoading ? 'Updating...' : 'Update Package' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Deactivate Confirmation Modal -->
    <div
      v-if="showDeactivateConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm"
    >
      <div class="bg-white border border-gray-100 rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Deactivate Package
        </h2>

        <p class="text-gray-500 mb-4">
          Are you sure you want to deactivate "{{ deactivatingPackage?.name }}"?
          It will no longer be visible to subscribers.
        </p>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="showDeactivateConfirm = false"
          >
            Cancel
          </button>
          <button
            :disabled="deactivateLoading"
            class="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            @click="handleDeactivate"
          >
            {{ deactivateLoading ? 'Deactivating...' : 'Deactivate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="store.loading && store.packages.length === 0"
      class="overflow-hidden rounded-xl border border-border bg-white shadow-[--shadow-card] animate-pulse"
    >
      <div class="border-b border-gray-200 bg-[#F9FAFB] px-4 py-3">
        <div class="h-4 w-32 bg-gray-200 rounded" />
      </div>
      <div
        v-for="i in 4"
        :key="i"
        class="flex items-center gap-4 px-4 py-3 border-b border-gray-200 last:border-0"
      >
        <div class="flex-1">
          <div class="h-4 w-28 bg-gray-200 rounded mb-1" />
          <div class="h-3 w-40 bg-gray-100 rounded" />
        </div>
        <div class="h-5 w-16 bg-gray-200 rounded-full" />
        <div class="h-4 w-20 bg-gray-200 rounded" />
      </div>
    </div>

    <!-- Packages Table -->
    <div
      v-else-if="filteredPackages.length > 0"
      class="overflow-hidden rounded-xl border border-border bg-white shadow-[--shadow-card]"
    >
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-[#F9FAFB]">
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Package
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div class="flex items-center justify-end gap-1">
                <CurrencyDollarIcon class="h-3.5 w-3.5" />
                Coins
              </div>
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Order
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="pkg in filteredPackages"
            :key="pkg.id"
            :class="[
              'hover:bg-gray-50 transition-colors',
              !pkg.is_active ? 'opacity-60' : '',
            ]"
          >
            <td class="px-4 py-3">
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ pkg.name }}
                </p>
                <p
                  v-if="pkg.description"
                  class="text-xs text-gray-500 mt-0.5"
                >
                  {{ pkg.description }}
                </p>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="text-sm font-semibold text-gray-900">
                {{ pkg.coin_amount.toLocaleString() }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="text-sm text-gray-700">
                {{ formatPrice(pkg.price_sar) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  pkg.is_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200',
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                ]"
              >
                {{ pkg.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ pkg.sort_order }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">
              {{ formatDate(pkg.created_at) }}
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
                        :class="[active ? 'bg-gray-50' : '', 'block w-full px-4 py-2 text-left text-sm text-gray-700 flex items-center gap-2']"
                        @click="openEditForm(pkg)"
                      >
                        <PencilIcon class="h-4 w-4" />
                        Edit
                      </button>
                    </MenuItem>
                    <MenuItem
                      v-if="pkg.is_active"
                      v-slot="{ active }"
                    >
                      <button
                        :class="[active ? 'bg-gray-50' : '', 'block w-full px-4 py-2 text-left text-sm text-red-600 flex items-center gap-2']"
                        @click="openDeactivateConfirm(pkg)"
                      >
                        <ArchiveBoxXMarkIcon class="h-4 w-4" />
                        Deactivate
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
      <div class="mx-auto h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <CurrencyDollarIcon class="h-6 w-6 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No coin packages found
      </h3>
      <p class="text-gray-500">
        {{ activeFilter !== 'all' ? 'Try adjusting your filter' : 'Create your first coin package to get started' }}
      </p>
    </div>
  </div>
</template>
