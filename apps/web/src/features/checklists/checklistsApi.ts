import { api } from '../../lib/http/api'
import type { PaginatedResponse } from '../../shared/types/api'
import type { ChecklistTemplate, ListTemplatesParams } from './types'

export const checklistsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listChecklistTemplates: builder.query<
      PaginatedResponse<ChecklistTemplate>,
      ListTemplatesParams
    >({
      query: (params) => ({
        url: '/checklist-templates',
        params,
      }),
      providesTags: ['Checklist'],
    }),

    getChecklistTemplate: builder.query<ChecklistTemplate, string>({
      query: (id) => ({ url: `/checklist-templates/${id}` }),
      providesTags: (_result, _error, id) =>
        _result ? [{ type: 'Checklist' as const, id }] : ['Checklist'],
    }),

    createChecklistTemplate: builder.mutation<
      ChecklistTemplate,
      Partial<ChecklistTemplate>
    >({
      query: (body) => ({
        url: '/checklist-templates',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Checklist'],
    }),

    updateChecklistTemplate: builder.mutation<
      ChecklistTemplate,
      { id: string; changes: Partial<ChecklistTemplate> }
    >({
      query: ({ id, changes }) => ({
        url: `/checklist-templates/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Checklist' as const, id },
        'Checklist',
      ],
    }),

    deleteChecklistTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/checklist-templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Checklist'],
    }),
  }),
})

export const {
  useListChecklistTemplatesQuery,
  useGetChecklistTemplateQuery,
  useCreateChecklistTemplateMutation,
  useUpdateChecklistTemplateMutation,
  useDeleteChecklistTemplateMutation,
} = checklistsApi
