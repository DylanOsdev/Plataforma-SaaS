export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ListClientsParams {
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}