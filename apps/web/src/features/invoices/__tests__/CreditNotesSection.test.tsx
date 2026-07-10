import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';
import type { CreditNote } from '../types';

const mockListCreditNotes = vi.fn();
const mockCancelCreditNote = vi.fn();
const mockCancelMutationState = { isLoading: false, error: null, data: null };

vi.mock('../invoicesApi', () => ({
  useListCreditNotesQuery: (...args: unknown[]) => mockListCreditNotes(...args),
  useCancelCreditNoteMutation: () => [mockCancelCreditNote, mockCancelMutationState],
  useCreateCreditNoteMutation: vi.fn(() => [vi.fn(), { isLoading: false, error: null }]),
  useListInvoicesQuery: vi.fn(),
  useGetInvoiceQuery: vi.fn(),
  useCreateInvoiceMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}));

import CreditNotesSection from '../components/CreditNotesSection';

const sampleNotes: CreditNote[] = [
  {
    id: 'cn-1',
    invoiceId: 'inv-1',
    type: 'credit',
    amount: 500,
    reason: 'Discount applied',
    status: 'active',
    number: 'NC-0001',
    issueDate: '2026-07-10T10:00:00Z',
  },
  {
    id: 'cn-2',
    invoiceId: 'inv-1',
    type: 'debit',
    amount: 200,
    reason: 'Additional fee',
    status: 'cancelled',
    number: 'ND-0001',
    issueDate: '2026-07-11T10:00:00Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockCancelMutationState.isLoading = false;
  mockCancelMutationState.error = null;
  mockCancelMutationState.data = null;
  mockCancelCreditNote.mockReset();
});

describe('CreditNotesSection', () => {
  it('should show loading spinner while fetching', () => {
    mockListCreditNotes.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { container } = renderWithProviders(
      <CreditNotesSection invoiceId="inv-1" />,
    );

    const spinners = container.querySelectorAll('.MuiCircularProgress-root');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('should show error alert when API fails', () => {
    mockListCreditNotes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Server error' } },
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/server error/i);
  });

  it('should show empty state when no notes exist', () => {
    mockListCreditNotes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    expect(screen.getByText('No credit notes for this invoice.')).toBeInTheDocument();
  });

  it('should render credit notes in the table', () => {
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    expect(screen.getByText('NC-0001')).toBeInTheDocument();
    expect(screen.getByText('ND-0001')).toBeInTheDocument();
    expect(screen.getByText('Discount applied')).toBeInTheDocument();
    expect(screen.getByText('Additional fee')).toBeInTheDocument();
  });

  it('should display type chips with correct colors', () => {
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    const creditChip = screen.getByText('credit');
    const debitChip = screen.getByText('debit');
    expect(creditChip).toBeInTheDocument();
    expect(debitChip).toBeInTheDocument();
  });

  it('should display formatted amounts', () => {
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    expect(screen.getByText('$500')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('should display status chips with correct variants', () => {
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    const activeStatus = screen.getByText('active');
    const cancelledStatus = screen.getByText('cancelled');
    expect(activeStatus).toBeInTheDocument();
    expect(cancelledStatus).toBeInTheDocument();
  });

  it('should show cancel button only for active notes', () => {
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    // Only the active note (cn-1) should have a cancel button
    expect(cancelButtons.length).toBe(1);
  });

  it('should filter notes by type when creditNoteType is provided', () => {
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <CreditNotesSection invoiceId="inv-1" creditNoteType="credit" />,
    );

    expect(screen.getByText('NC-0001')).toBeInTheDocument();
    expect(screen.queryByText('ND-0001')).not.toBeInTheDocument();
  });

  it('should show "Add Credit Note" button text when filtered by credit', () => {
    mockListCreditNotes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <CreditNotesSection invoiceId="inv-1" creditNoteType="credit" />,
    );

    expect(screen.getByText('Add Credit Note')).toBeInTheDocument();
  });

  it('should show "Add Debit Note" button text when filtered by debit', () => {
    mockListCreditNotes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(
      <CreditNotesSection invoiceId="inv-1" creditNoteType="debit" />,
    );

    expect(screen.getByText('Add Debit Note')).toBeInTheDocument();
  });

  it('should show "Add Note" button text when no filter', () => {
    mockListCreditNotes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    expect(screen.getByText('Add Note')).toBeInTheDocument();
  });

  it('should open cancel confirmation dialog when cancel button is clicked', async () => {
    const user = userEvent.setup();
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    await user.click(cancelBtn);

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    // NC-0001 appears in both the table row and the dialog text
    const nc0001Elements = screen.getAllByText(/NC-0001/);
    expect(nc0001Elements.length).toBeGreaterThanOrEqual(2);
  });

  it('should call cancelCreditNote when cancel is confirmed', async () => {
    const user = userEvent.setup();
    mockCancelCreditNote.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 'cn-1', status: 'cancelled' }),
    });
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    await user.click(screen.getByRole('button', { name: /yes, cancel/i }));

    await waitFor(() => {
      expect(mockCancelCreditNote).toHaveBeenCalledWith('cn-1');
    });
  });

  it('should close cancel dialog when No is clicked', async () => {
    const user = userEvent.setup();
    mockListCreditNotes.mockReturnValue({
      data: sampleNotes,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^no$/i }));

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });
  });

  it('should open CreditNoteDialog when Add Note button is clicked', async () => {
    const user = userEvent.setup();
    mockListCreditNotes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<CreditNotesSection invoiceId="inv-1" />);

    await user.click(screen.getByText('Add Note'));

    expect(screen.getByText('New Credit/Debit Note')).toBeInTheDocument();
  });
});
