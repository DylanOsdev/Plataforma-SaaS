import { z } from 'zod'

/**
 * Zod schema for creating a work order.
 * Client, vehicle, and description are required.
 * Mechanic and priority are optional.
 */
export const createWorkOrderSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  description: z.string().min(1, 'Description is required'),
  mechanicId: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().optional(),
  ),
  priority: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  ),

})

export type CreateWorkOrderPayload = z.infer<typeof createWorkOrderSchema>

/**
 * Zod schema for adding a part to a work order.
 */
export const addPartSchema = z.object({
  sparePartId: z.string().min(1, 'Part is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
})

export type AddPartPayload = z.infer<typeof addPartSchema>
