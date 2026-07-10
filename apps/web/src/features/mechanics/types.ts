export interface Mechanic {
  id: string
  name: string
  email: string
  phone: string
  specializations: string[]
  hireDate: string
  hourlyRate: number
  notes: string
  status: string
  createdAt: string
}

export interface ListMechanicsParams {
  search?: string
  status?: string
  specialization?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}