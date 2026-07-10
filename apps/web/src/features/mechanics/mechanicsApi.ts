import { api } from '../../lib/http/api'
import type { PaginatedResponse } from '../../shared/types/api'
import type { Mechanic, ListMechanicsParams } from './types'

export const mechanicsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listMechanics: builder.query<PaginatedResponse<Mechanic>, ListMechanicsParams>({
      query: (params) => ({
        url: '/mechanics',
        params,
      }),
      providesTags: ['Mechanic'],
    }),

    getMechanic: builder.query<Mechanic, string>({
      query: (id) => ({ url: `/mechanics/${id}` }),
      providesTags: (_result, _error, id) =>
        _result ? [{ type: 'Mechanic' as const, id }] : ['Mechanic'],
    }),

    createMechanic: builder.mutation<Mechanic, Partial<Mechanic>>({
      query: (body) => ({
        url: '/mechanics',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Mechanic'],
    }),

    updateMechanic: builder.mutation<Mechanic, { id: string; changes: Partial<Mechanic> }>({
      query: ({ id, changes }) => ({
        url: `/mechanics/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Mechanic' as const, id },
        'Mechanic',
      ],
    }),

    deleteMechanic: builder.mutation<void, string>({
      query: (id) => ({
        url: `/mechanics/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Mechanic'],
    }),
  }),
})

export const {
  useListMechanicsQuery,
  useGetMechanicQuery,
  useCreateMechanicMutation,
  useUpdateMechanicMutation,
  useDeleteMechanicMutation,
} = mechanicsApi