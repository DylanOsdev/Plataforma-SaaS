import { api } from '../../lib/http/api'
import type { PaginatedResponse } from '../../shared/types/api'
import type {
  ChecklistTemplate,
  ChecklistExecution,
  ListTemplatesParams,
} from './types'

export const checklistsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Templates ──
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

    // ── Executions ──
    getWorkOrderChecklists: builder.query<ChecklistExecution[], string>({
      query: (workOrderId) => ({
        url: `/work-orders/${workOrderId}/checklists`,
      }),
      providesTags: (_result, _error, workOrderId) => [
        { type: 'ChecklistExecution' as const, workOrderId },
        'ChecklistExecution',
      ],
    }),

    getChecklistExecution: builder.query<ChecklistExecution, string>({
      query: (id) => ({ url: `/checklist-executions/${id}` }),
      providesTags: (_result, _error, id) =>
        _result
          ? [{ type: 'ChecklistExecution' as const, id }]
          : ['ChecklistExecution'],
    }),

    assignChecklist: builder.mutation<
      ChecklistExecution,
      { workOrderId: string; templateId: string; mechanicId: string }
    >({
      query: ({ workOrderId, templateId, mechanicId }) => ({
        url: `/work-orders/${workOrderId}/checklists`,
        method: 'POST',
        body: { templateId, mechanicId },
      }),
      invalidatesTags: ['ChecklistExecution'],
    }),

    startExecution: builder.mutation<ChecklistExecution, string>({
      query: (id) => ({
        url: `/checklist-executions/${id}/start`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ChecklistExecution' as const, id },
        'ChecklistExecution',
      ],
    }),

    submitAnswer: builder.mutation<
      void,
      { executionId: string; questionId: string; answer: string | number | boolean }
    >({
      query: ({ executionId, questionId, answer }) => ({
        url: `/checklist-executions/${executionId}/answers`,
        method: 'POST',
        body: { questionId, answer },
      }),
      invalidatesTags: (_result, _error, { executionId }) => [
        { type: 'ChecklistExecution' as const, executionId },
      ],
    }),

    completeExecution: builder.mutation<ChecklistExecution, string>({
      query: (id) => ({
        url: `/checklist-executions/${id}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ChecklistExecution' as const, id },
        'ChecklistExecution',
      ],
    }),
  }),
})

export const {
  useListChecklistTemplatesQuery,
  useGetChecklistTemplateQuery,
  useCreateChecklistTemplateMutation,
  useUpdateChecklistTemplateMutation,
  useDeleteChecklistTemplateMutation,
  useGetWorkOrderChecklistsQuery,
  useGetChecklistExecutionQuery,
  useAssignChecklistMutation,
  useStartExecutionMutation,
  useSubmitAnswerMutation,
  useCompleteExecutionMutation,
} = checklistsApi
