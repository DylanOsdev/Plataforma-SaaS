import { api } from '../../lib/http/api'
import type { PaginatedResponse } from '../../shared/types/api'
import type { Client, ListClientsParams } from './types'

export const clientsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listClients: builder.query<PaginatedResponse<Client>, ListClientsParams>({
      query: (params) => ({
        url: '/clients',
        params,
      }),
      providesTags: ['Client'],
    }),

    getClient: builder.query<Client, string>({
      query: (id) => ({ url: `/clients/${id}` }),
      providesTags: (_result, _error, id) =>
        _result ? [{ type: 'Client' as const, id }] : ['Client'],
    }),

    createClient: builder.mutation<Client, Partial<Client>>({
      query: (body) => ({
        url: '/clients',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Client'],
    }),

    updateClient: builder.mutation<Client, { id: string; changes: Partial<Client> }>({
      query: ({ id, changes }) => ({
        url: `/clients/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Client' as const, id },
        'Client',
      ],
    }),

    deleteClient: builder.mutation<void, string>({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Client'],
    }),
  }),
})

export const {
  useListClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientsApi