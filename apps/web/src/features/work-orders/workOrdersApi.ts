import { api } from '../../lib/http/api'
import type { PaginatedResponse } from '../../shared/types/api'
import type { WorkOrder, TimelineEntry, ListWorkOrdersParams } from './types'
import type { CreateWorkOrderPayload, AddPartPayload } from './validation'

export const workOrdersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listWorkOrders: builder.query<PaginatedResponse<WorkOrder>, ListWorkOrdersParams>({
      query: (params) => ({
        url: '/work-orders',
        params,
      }),
      providesTags: ['WorkOrder'],
    }),

    getWorkOrder: builder.query<WorkOrder, string>({
      query: (id) => ({ url: `/work-orders/${id}` }),
      providesTags: (result, _error, id) =>
        result ? [{ type: 'WorkOrder' as const, id }] : ['WorkOrder'],
    }),

    createWorkOrder: builder.mutation<WorkOrder, CreateWorkOrderPayload>({
      query: (body) => ({
        url: '/work-orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkOrder'],
    }),

    transitionWorkOrderStatus: builder.mutation<WorkOrder, { id: string; milestone: string }>({
      query: ({ id, milestone }) => ({
        url: `/work-orders/${id}/transition`,
        method: 'PATCH',
        body: { milestone },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'WorkOrder' as const, id },
        'WorkOrder',
      ],
    }),

    assignMechanic: builder.mutation<WorkOrder, { id: string; mechanicIds: string[]; primaryMechanicId?: string }>({
      query: ({ id, mechanicIds, primaryMechanicId }) => ({
        url: `/work-orders/${id}/mechanics`,
        method: 'POST',
        body: { mechanicIds, primaryMechanicId },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'WorkOrder' as const, id },
        'WorkOrder',
      ],
    }),

    addPart: builder.mutation<WorkOrder, { id: string; sparePartId: string; quantity: number }>({
      query: ({ id, sparePartId, quantity }) => ({
        url: `/work-orders/${id}/parts`,
        method: 'POST',
        body: { sparePartId, quantity },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'WorkOrder' as const, id },
        'WorkOrder',
      ],
    }),

    getTimeline: builder.query<TimelineEntry[], string>({
      query: (id) => ({ url: `/work-orders/${id}/timeline` }),
      providesTags: (_result, _error, id) => [{ type: 'WorkOrder' as const, id }],
    }),
  }),
})

export const {
  useListWorkOrdersQuery,
  useGetWorkOrderQuery,
  useCreateWorkOrderMutation,
  useTransitionWorkOrderStatusMutation,
  useAssignMechanicMutation,
  useAddPartMutation,
  useGetTimelineQuery,
} = workOrdersApi
