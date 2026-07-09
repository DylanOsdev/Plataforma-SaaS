import { api } from '../../lib/http/api'
import type { PaginatedResponse } from '../../shared/types/api'
import type { Vehicle, ListVehiclesParams } from './types'

export const vehiclesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listVehicles: builder.query<PaginatedResponse<Vehicle>, ListVehiclesParams>({
      query: (params) => ({
        url: '/vehicles',
        params,
      }),
      providesTags: ['Vehicle'],
    }),

    getVehicle: builder.query<Vehicle, string>({
      query: (id) => ({ url: `/vehicles/${id}` }),
      providesTags: (_result, _error, id) =>
        _result ? [{ type: 'Vehicle' as const, id }] : ['Vehicle'],
    }),

    createVehicle: builder.mutation<Vehicle, Partial<Vehicle>>({
      query: (body) => ({
        url: '/vehicles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Vehicle'],
    }),

    updateVehicle: builder.mutation<Vehicle, { id: string; changes: Partial<Vehicle> }>({
      query: ({ id, changes }) => ({
        url: `/vehicles/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Vehicle' as const, id },
        'Vehicle',
      ],
    }),

    deleteVehicle: builder.mutation<void, string>({
      query: (id) => ({
        url: `/vehicles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vehicle'],
    }),
  }),
})

export const {
  useListVehiclesQuery,
  useGetVehicleQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} = vehiclesApi