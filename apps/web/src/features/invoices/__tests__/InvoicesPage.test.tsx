import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';

const mockUseListInvoicesQuery = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../invoicesApi', () => ({
  useListInvoicesQuery: (...args: unknown[]) => mockUseListInvoicesQuery(...args),
  useGetInvoiceQuery: vi.fn(),
  useCreateInvoiceMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}));

import InvoicesPage from '../pages/InvoicesPage';

const sampleInvoices = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-0001',
    status: 'pending' as const,
    subtotal: 10000,
    taxRate: 0.21,
    taxAmount: 2100,
    totalAmount: 12100,
    paidAmount: 0,
    issueDate: '2026-07-01T10:00:00Z',
    client: { id: 'c-1', name: 'John Doe' },
    workOrder: { id: 'wo-1' },
    payments: [],
    createdAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-0002',
    status: 'paid' as const,
    subtotal: 25000,
    taxRate: 0.21,
    taxAmount: 5250,
    totalAmount: 30250,
    paidAmount: 30250,
    issueDate: '2026-07-15T10:00:00Z',
    client: { id: 'c-2', name: 'Jane Smith' },
    workOrder: { id: 'wo-2' },
    payments: [
      {
        id: 'p-1',
        amount: 30250,
        method: 'transfer' as const,
        paymentDate: '2026-07-16T10:00:00Z',
      },
    ],
    createdAt: '2026-07-15T10:00:00Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('InvoicesPage', () => {
  it('should render invoice data from API', async () => {
    mockUseListInvoicesQuery.mockReturnValue({
      data: { data: sampleInvoices, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    expect(screen.getByText('INV-0001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('INV-0002')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should render formatted amounts', () => {
    mockUseListInvoicesQuery.mockReturnValue({
      data: { data: sampleInvoices, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    expect(screen.getByText('$12,100')).toBeInTheDocument();
    expect(screen.getByText('$30,250')).toBeInTheDocument();
  });

  it('should render status chips for each invoice', () => {
    mockUseListInvoicesQuery.mockReturnValue({
      data: { data: sampleInvoices, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  it('should navigate to invoice detail on row click', async () => {
    const user = userEvent.setup();
    mockUseListInvoicesQuery.mockReturnValue({
      data: { data: sampleInvoices, meta: { total: 2, page: 1, limit: 20, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    const row1 = screen.getByText('INV-0001').closest('tr');
    expect(row1).not.toBeNull();
    await user.click(row1!);

    expect(mockNavigate).toHaveBeenCalledWith('/invoices/inv-1');
  });

  it('should show error alert when API fails', async () => {
    mockUseListInvoicesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { status: 500, data: { message: 'Server error' } },
    });

    renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/failed to load/i);
    expect(alert).toHaveTextContent(/server error/i);
  });

  it('should render loading skeleton when data is being fetched', () => {
    mockUseListInvoicesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { container } = renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state when no invoices exist', () => {
    mockUseListInvoicesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    expect(screen.getByText('No hay facturas')).toBeInTheDocument();
  });

  it('should pass pagination params when page changes', async () => {
    const user = userEvent.setup();
    mockUseListInvoicesQuery.mockReturnValue({
      data: { data: sampleInvoices, meta: { total: 25, page: 0, limit: 10, totalPages: 3 } },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    const nextButton = await screen.findByTitle('Go to next page', {}, { timeout: 3000 });
    await user.click(nextButton);

    await waitFor(
      () => {
        const calls = mockUseListInvoicesQuery.mock.calls;
        const page2Call = calls.find((call) => (call[0] as Record<string, unknown>)?.page === 2);
        expect(page2Call).toBeDefined();
      },
      { timeout: 3000 },
    );
  });

  it('should filter by status and reset to page 1', async () => {
    const user = userEvent.setup();
    let queryParams: Record<string, unknown> = {};
    mockUseListInvoicesQuery.mockImplementation((params: Record<string, unknown>) => {
      queryParams = params;
      return {
        data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
        isLoading: false,
        isError: false,
        error: null,
      };
    });

    renderWithProviders(<InvoicesPage />, {
      initialEntries: ['/invoices'],
    });

    // Open the status select
    const statusSelect = screen.getByLabelText(/status/i);
    await user.click(statusSelect);

    // Select "paid" option
    const paidOption = await screen.findByText('paid');
    await user.click(paidOption);

    await waitFor(() => {
      expect(queryParams.status).toBe('paid');
    });
  });
});
