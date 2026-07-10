export interface SparePart {
  id: string
  code: string
  name: string
  description: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitCost: number
  sellingPrice: number
  supplier: string
  notes: string
  status: string
  createdAt: string
}

export interface ListSparePartsParams {
  search?: string
  status?: string
  category?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}