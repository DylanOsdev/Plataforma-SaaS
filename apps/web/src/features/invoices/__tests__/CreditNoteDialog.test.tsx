import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';

const mockCreateCreditNote = vi.fn();
const mockMutationResult = { isLoading: false, error: null, data: null };

vi.mock('../invoicesApi', () => ({
  useCreateCreditNoteMutation: () => [mockCreateCreditNote, mockMutationResult],
  useListCreditNotesQuery: vi.fn(),
  useCancelCreditNoteMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useListInvoicesQuery: vi.fn(),
  useGetInvoiceQuery: vi.fn(),
  useCreateInvoiceMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}));

import CreditNoteDialog from '../components/CreditNoteDialog';

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  invoiceId: 'inv-1',
  onSuccess: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockMutationResult.isLoading = false;
  mockMutationResult.error = null;
  mockMutationResult.data = null;
  mockCreateCreditNote.mockReset();
});

describe('CreditNoteDialog', () => {
  it('should render all form fields when open', () => {
    renderWithProviders(<CreditNoteDialog {...defaultProps} />);

    expect(screen.getByText('New Credit/Debit Note')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should pre-select type when defaultType is provided', () => {
    renderWithProviders(
      <CreditNoteDialog {...defaultProps} defaultType="debit" />,
    );

    // MUI Select displays the selected value as text content in the combobox
    expect(screen.getByRole('combobox', { name: /type/i })).toHaveTextContent('Debit');
  });

  it('should disable Save button when amount is empty', () => {
    renderWithProviders(<CreditNoteDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('should disable Save button when reason is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreditNoteDialog {...defaultProps} />);

    const amountInput = screen.getByLabelText('Amount');
    await user.type(amountInput, '100');

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('should enable Save button when all fields are valid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreditNoteDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('Amount'), '100');
    await user.type(screen.getByLabelText('Reason'), 'Discount applied');

    expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
  });

  it('should show amount error when amount is zero after blur', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreditNoteDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('Amount'), '0');
    await user.tab();

    expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
  });

  it('should show reason error when reason is empty after blur', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreditNoteDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('Amount'), '100');
    await user.click(screen.getByLabelText('Reason'));
    await user.tab();

    expect(screen.getByText('Reason is required')).toBeInTheDocument();
  });

  it('should call createCreditNote with correct payload on submit', async () => {
    const user = userEvent.setup();
    // RTK Query mutation trigger returns { unwrap: () => Promise<result> }
    mockCreateCreditNote.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'cn-1' }) });

    renderWithProviders(
      <CreditNoteDialog {...defaultProps} defaultType="credit" />,
    );

    await user.type(screen.getByLabelText('Amount'), '250.50');
    await user.type(screen.getByLabelText('Reason'), 'Price adjustment');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockCreateCreditNote).toHaveBeenCalledWith({
        invoiceId: 'inv-1',
        data: { type: 'credit', amount: 250.5, reason: 'Price adjustment' },
      });
    });
  });

  it('should call onSuccess and onClose after successful creation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    mockCreateCreditNote.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'cn-1' }) });

    renderWithProviders(
      <CreditNoteDialog
        {...defaultProps}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    await user.type(screen.getByLabelText('Amount'), '100');
    await user.type(screen.getByLabelText('Reason'), 'Test reason');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should show error alert when mutation returns an error', () => {
    mockMutationResult.error = { data: { message: 'Invoice not found' } };

    renderWithProviders(<CreditNoteDialog {...defaultProps} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Invoice not found')).toBeInTheDocument();
  });

  it('should show loading state on submit button while creating', () => {
    mockMutationResult.isLoading = true;

    renderWithProviders(<CreditNoteDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument();
  });

  it('should close dialog and reset form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <CreditNoteDialog {...defaultProps} onClose={onClose} />,
    );

    await user.type(screen.getByLabelText('Amount'), '100');
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
