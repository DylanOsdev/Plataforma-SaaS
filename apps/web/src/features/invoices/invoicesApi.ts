import { api } from '../../lib/http/api';
import type { PaginatedResponse } from '../../shared/types/api';
import type { CreditNote, CreateCreditNoteDto, Invoice, ListInvoicesParams } from './types';

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

    listCreditNotes: builder.query<CreditNote[], string>({
      query: (invoiceId) => ({ url: `/invoices/${invoiceId}/credit-notes` }),
      providesTags: (_result, _error, invoiceId) => [{ type: 'CreditNote' as const, id: invoiceId }],
    }),

    createCreditNote: builder.mutation<CreditNote, { invoiceId: string; data: CreateCreditNoteDto }>({
      query: ({ invoiceId, data }) => ({
        url: `/invoices/${invoiceId}/credit-notes`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { invoiceId }) => [{ type: 'CreditNote' as const, id: invoiceId }],
    }),

    cancelCreditNote: builder.mutation<CreditNote, string>({
      query: (id) => ({
        url: `/credit-notes/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['CreditNote'],
    }),
  }),
});

export const {
  useListInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useListCreditNotesQuery,
  useCreateCreditNoteMutation,
  useCancelCreditNoteMutation,
} = invoicesApi;
