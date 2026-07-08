export interface WorkOrderMechanic {
  mechanic: { id: string; name: string }
  isPrimary: boolean
}

export interface WorkOrder {
  id: string
  client: { id: string; name: string }
  vehicle: { id: string; model: string; plate: string }
  description: string
  milestone: 'created' | 'assigned' | 'in_progress' | 'in_review' | 'completed' | 'invoiced' | 'paid' | 'delivered'
  mechanics: WorkOrderMechanic[]
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  parts: WorkOrderPart[]
  createdAt: string
  updatedAt: string
}

export interface WorkOrderPart {
  id: string
  sparePartId: string
  partName: string
  quantity: number
  unitPrice: number
}

export interface TimelineEntry {
  id: string
  fromStatus: string | null
  toStatus: string
  actorName: string
  timestamp: string
  action: string
}

/**
 * Query parameters for the list work orders endpoint.
 */
export interface ListWorkOrdersParams {
  page?: number
  limit?: number
  milestone?: string
  mechanicId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
