import { api } from '../../lib/http/api'
import type { PaginatedResponse } from '../../shared/types/api'
import type { SparePart, ListSparePartsParams } from './types'

export function countLowStockItems(items: SparePart[]): number {
  return items.filter((item) => item.currentStock < item.minStock).length
}

export const sparePartsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listSpareParts: builder.query<PaginatedResponse<SparePart>, ListSparePartsParams>({
      query: (params) => ({
        url: '/spare-parts',
        params,
      }),
      providesTags: ['SparePart'],
    }),

    getSparePart: builder.query<SparePart, string>({
      query: (id) => ({ url: `/spare-parts/${id}` }),
      providesTags: (_result, _error, id) =>
        _result ? [{ type: 'SparePart' as const, id }] : ['SparePart'],
    }),

    createSparePart: builder.mutation<SparePart, Partial<SparePart>>({
      query: (body) => ({
        url: '/spare-parts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SparePart'],
    }),

    updateSparePart: builder.mutation<SparePart, { id: string; changes: Partial<SparePart> }>({
      query: ({ id, changes }) => ({
        url: `/spare-parts/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'SparePart' as const, id },
        'SparePart',
      ],
    }),

    deleteSparePart: builder.mutation<void, string>({
      query: (id) => ({
        url: `/spare-parts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SparePart'],
    }),

    getLowStockCount: builder.query<number, void>({
      query: () => ({
        url: '/spare-parts',
        params: { limit: 500 },
      }),
      transformResponse: (response: PaginatedResponse<SparePart>) =>
        countLowStockItems(response.data),
      providesTags: ['SparePart'],
    }),
  }),
})

export const {
  useListSparePartsQuery,
  useGetSparePartQuery,
  useCreateSparePartMutation,
  useUpdateSparePartMutation,
  useDeleteSparePartMutation,
  useGetLowStockCountQuery,
} = sparePartsApi