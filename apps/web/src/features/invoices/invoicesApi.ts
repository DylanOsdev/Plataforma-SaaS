import { api } from '../../lib/http/api';
import type { PaginatedResponse } from '../../shared/types/api';
import type { Invoice, ListInvoicesParams } from './types';

export const invoicesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listInvoices: builder.query<PaginatedResponse<Invoice>, ListInvoicesParams>({
      query: (params) => ({ url: '/invoices', params }),
      providesTags: ['Invoice'],
    }),

    getInvoice: builder.query<Invoice, string>({
      query: (id) => ({ url: `/invoices/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'Invoice' as const, id }],
    }),

    createInvoice: builder.mutation<Invoice, { workOrderId: string; notes?: string }>({
      query: ({ workOrderId, notes }) => ({
        url: `/work-orders/${workOrderId}/invoice`,
        method: 'POST',
        body: notes ? { notes } : undefined,
      }),
      invalidatesTags: ['Invoice', 'WorkOrder'],
    }),
  }),
});

export const { useListInvoicesQuery, useGetInvoiceQuery, useCreateInvoiceMutation } = invoicesApi;
