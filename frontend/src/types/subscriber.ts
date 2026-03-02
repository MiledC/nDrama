export type SubscriberStatus = 'anonymous' | 'active' | 'suspended' | 'banned'
export type TransactionType = 'purchase' | 'spend' | 'refund' | 'promo' | 'adjustment'

export interface Subscriber {
  id: string
  email: string | null
  name: string | null
  country: string | null
  avatar_url: string | null
  device_id: string
  status: SubscriberStatus
  coin_balance: number
  registered_at: string | null
  last_active_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface SubscriberListResponse {
  items: Subscriber[]
  total: number
  page: number
  per_page: number
}

export interface SubscriberUpdate {
  status?: SubscriberStatus
  admin_notes?: string
}

export interface CoinAdjustment {
  amount: number
  description: string
}

export interface CoinTransaction {
  id: string
  subscriber_id: string
  type: TransactionType
  amount: number
  balance_after: number
  reference_type: string | null
  reference_id: string | null
  description: string | null
  created_by: string | null
  created_at: string
}

export interface CoinTransactionListResponse {
  items: CoinTransaction[]
  total: number
  page: number
  per_page: number
}

export interface CoinPackage {
  id: string
  name: string
  description: string | null
  coin_amount: number
  price_sar: string
  is_active: boolean
  sort_order: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface CoinPackageListResponse {
  items: CoinPackage[]
  total: number
}

export interface CoinPackageCreate {
  name: string
  description?: string
  coin_amount: number
  price_sar: string
  sort_order?: number
}

export interface CoinPackageUpdate {
  name?: string
  description?: string
  coin_amount?: number
  price_sar?: string
  is_active?: boolean
  sort_order?: number
}
