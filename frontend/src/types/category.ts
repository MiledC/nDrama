export interface CategoryTag {
  id: string
  name: string
  category: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  icon: string | null
  description: string | null
  parent_id: string | null
  sort_order: number
  match_mode: 'any' | 'all'
  tags: CategoryTag[]
  created_at: string
  updated_at: string
}

export interface CategoryTreeNode extends Omit<Category, 'parent_id'> {
  children: CategoryTreeNode[]
}

export interface CategoryCreate {
  name: string
  icon?: string | null
  description?: string | null
  parent_id?: string | null
  tag_ids?: string[]
  match_mode?: 'any' | 'all'
}

export interface CategoryUpdate {
  name?: string
  icon?: string | null
  description?: string | null
  sort_order?: number
  match_mode?: 'any' | 'all'
}

export interface ReorderItem {
  id: string
  sort_order: number
}

export interface SeriesListResponse {
  items: any[]
  total: number
  page: number
  per_page: number
}