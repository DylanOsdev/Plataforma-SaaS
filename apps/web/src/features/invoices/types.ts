export type InvoiceStatus = 'pending' | 'partial' | 'paid' | 'overpaid' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'card';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  issueDate: string;
  notes?: string;
  client: { id: string; name: string };
  workOrder: { id: string };
  payments: Payment[];
  createdAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paymentDate: string;
}

export type CreditNoteType = 'credit' | 'debit';
export type CreditNoteStatus = 'active' | 'cancelled';

export interface CreditNote {
  id: string;
  invoiceId: string;
  type: CreditNoteType;
  amount: number;
  reason: string;
  status: CreditNoteStatus;
  number: string;
  issueDate: string;
}

export interface CreateCreditNoteDto {
  type: CreditNoteType;
  amount: number;
  reason: string;
}

export interface ListInvoicesParams {
  status?: InvoiceStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
