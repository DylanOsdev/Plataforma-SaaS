import { describe, it, expect } from 'vitest'
import {
  createWorkOrderSchema,
  addPartSchema,
} from './validation'

describe('createWorkOrderSchema', () => {
  it('should accept valid payload with all required fields', () => {
    const payload = {
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      description: 'Oil change and brake inspection',
    }
    const result = createWorkOrderSchema.parse(payload)
    expect(result).toEqual(payload)
  })

  it('should accept optional mechanicId and priority', () => {
    const payload = {
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      description: 'Regular maintenance',
      mechanicId: 'mech-1',
      priority: 'high' as const,
    }
    const result = createWorkOrderSchema.parse(payload)
    expect(result).toEqual(payload)
  })

  it('should reject empty clientId', () => {
    const result = createWorkOrderSchema.safeParse({
      clientId: '',
      vehicleId: 'vehicle-1',
      description: 'Test',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty description', () => {
    const result = createWorkOrderSchema.safeParse({
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      description: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid priority value', () => {
    const result = createWorkOrderSchema.safeParse({
      clientId: 'client-1',
      vehicleId: 'vehicle-1',
      description: 'Test',
      priority: 'super-urgent',
    })
    expect(result.success).toBe(false)
  })
})

describe('addPartSchema', () => {
  it('should accept valid part addition payload', () => {
    const payload = {
      sparePartId: 'part-1',
      quantity: 2,
    }
    const result = addPartSchema.parse(payload)
    expect(result).toEqual(payload)
  })

  it('should reject quantity of zero', () => {
    const result = addPartSchema.safeParse({
      sparePartId: 'part-1',
      quantity: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative quantity', () => {
    const result = addPartSchema.safeParse({
      sparePartId: 'part-1',
      quantity: -1,
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty sparePartId', () => {
    const result = addPartSchema.safeParse({
      sparePartId: '',
      quantity: 1,
    })
    expect(result.success).toBe(false)
  })
})
