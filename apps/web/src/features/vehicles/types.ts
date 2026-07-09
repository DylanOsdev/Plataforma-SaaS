export interface Vehicle {
  id: string
  client: {
    id: string
    name: string
    email: string
    phone: string
  }
  make: string
  model: string
  year: number
  plate: string
  vin: string
  color: string
  fuelType: string
  mileage: number
  notes: string
  status: string
  createdAt: string
}

export interface ListVehiclesParams {
  search?: string
  clientId?: string
  make?: string
  fuelType?: string
  status?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}